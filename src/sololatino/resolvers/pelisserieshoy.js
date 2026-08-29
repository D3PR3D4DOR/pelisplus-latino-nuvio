const PLAYER_HOST = "https://player.pelisserieshoy.com";

const USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
    "AppleWebKit/537.36 (KHTML, like Gecko) " +
    "Chrome/120.0.0.0 Safari/537.36";

export async function resolvePelisSeriesHoy(
    playerUrl,
    refererUrl = "https://sololatino.net/"
) {

    console.log(
        `[PelisSeriesHoy] Opening: ${playerUrl}`
    );

    if (
        typeof playerUrl !== "string" ||
        !playerUrl
    ) {
        throw new Error("playerUrl inválida");
    }

    // ==========================================================
    // 1. GET DEL PLAYER + CAPTURAR COOKIES
    // ==========================================================

    const htmlResponse =
        await fetch(
            playerUrl,
            {
                redirect: "follow",
                headers: {
                    "User-Agent":
                        USER_AGENT,

                    "Accept":
                        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

                    "Referer":
                        refererUrl
                }
            }
        );

    const finalUrl =
        htmlResponse.url ||
        playerUrl;

    console.log(
        `[PelisSeriesHoy] Final URL: ${finalUrl}`
    );

    if (
        !htmlResponse.ok
    ) {
        throw new Error(
            `Player HTTP ${htmlResponse.status}`
        );
    }

    const html =
        await htmlResponse.text();

    console.log(
        `[PelisSeriesHoy] HTML length: ${html.length}`
    );

    // ----------------------------------------------------------
    // Cookies recibidas por el player
    // ----------------------------------------------------------

    const cookieHeader =
        getCookieHeader(
            htmlResponse
        );

    console.log(
        `[PelisSeriesHoy] Cookies: ${
            cookieHeader
                ? "encontradas"
                : "ninguna"
        }`
    );

    // ==========================================================
    // 2. EXTRAER _t
    // ==========================================================

    const token =
        extractPlayerToken(
            html
        );

    if (!token) {
        throw new Error(
            "No se encontró el token _t del reproductor"
        );
    }

    console.log(
        "[PelisSeriesHoy] Player token encontrado"
    );

    // ==========================================================
    // 3. a=1
    // ==========================================================

    const scan =
        await postSphp(
            token,
            {
                a: "1"
            },
            finalUrl,
            cookieHeader
        );

    if (
        !scan ||
        !Array.isArray(
            scan.s
        )
    ) {
        throw new Error(
            "s.php a=1 no devolvió la lista de servidores"
        );
    }

    console.log(
        `[PelisSeriesHoy] Servers found: ${scan.s.length}`
    );

    const streams = [];

    // ==========================================================
    // 4. RESOLVER SERVIDORES
    // ==========================================================

    for (
        const server of scan.s
    ) {

        if (
            !Array.isArray(server) ||
            server.length < 2
        ) {
            continue;
        }

        const label =
            String(
                server[0] || ""
            ).trim();

        const serverId =
            String(
                server[1] || ""
            ).trim();

        if (
            !label ||
            !serverId
        ) {
            continue;
        }

        console.log(
            `[PelisSeriesHoy] Resolving: ${label}`
        );

        try {

            const resolved =
                await postSphp(
                    token,
                    {
                        a: "2",
                        v: serverId
                    },
                    finalUrl,
                    cookieHeader
                );

            if (
                !resolved
            ) {
                continue;
            }

            // ==================================================
            // MP4
            // ==================================================

            if (
                resolved.type === "mp4" &&
                resolved.u
            ) {

                const mp4Url =
                    new URL(
                        resolved.u,
                        finalUrl
                    ).href;

                console.log(
                    `[PelisSeriesHoy] ${label} -> MP4`
                );

                streams.push({
                    name:
                        `SoloLatino ${cleanLabel(label)} MP4`,

                    url:
                        mp4Url,

                    quality:
                        "auto",

                    headers:
                        {}
                });

                continue;
            }

            // ==================================================
            // IFRAME
            // ==================================================

            if (
                resolved.type === "iframe" &&
                resolved.url
            ) {

                const iframeUrl =
                    new URL(
                        resolved.url,
                        finalUrl
                    ).href;

                console.log(
                    `[PelisSeriesHoy] ${label} -> iframe`
                );

                streams.push({
                    name:
                        `SoloLatino ${cleanLabel(label)}`,

                    url:
                        iframeUrl,

                    quality:
                        "auto",

                    headers:
                        {}
                });

                continue;
            }

            // ==================================================
            // HLS
            // ==================================================

            if (
                resolved.u
            ) {

                const hlsStreams =
                    await resolveHls(
                        resolved.u,
                        resolved.sig || "",
                        finalUrl,
                        label
                    );

                streams.push(
                    ...hlsStreams
                );

                continue;
            }

            console.log(
                `[PelisSeriesHoy] ${label}: formato desconocido`
            );

        } catch (
            error
        ) {

            console.warn(
                `[PelisSeriesHoy] ${label} error:`,
                error.message
            );
        }
    }

    console.log(
        `[PelisSeriesHoy] Final streams: ${streams.length}`
    );

    return deduplicate(
        streams
    );
}


// ==========================================================
// EXTRAER COOKIES DEL RESPONSE
// ==========================================================

function getCookieHeader(
    response
) {

    try {

        const setCookies =
            response.headers.getSetCookie
                ? response.headers.getSetCookie()
                : [];

        if (
            Array.isArray(
                setCookies
            ) &&
            setCookies.length > 0
        ) {

            return setCookies
                .map(
                    cookie =>
                        cookie.split(";")[0]
                )
                .filter(
                    Boolean
                )
                .join("; ");
        }

        const single =
            response.headers.get(
                "set-cookie"
            );

        if (
            single
        ) {

            return single
                .split(/,(?=[^;]+?=)/)
                .map(
                    cookie =>
                        cookie.split(";")[0]
                )
                .filter(
                    Boolean
                )
                .join("; ");
        }

    } catch {
        // ignorar
    }

    return "";
}


// ==========================================================
// EXTRAER _t
// ==========================================================

function extractPlayerToken(
    html
) {

    const patterns = [

        /(?:const|let|var)\s+_t\s*=\s*['"]([^'"]+)['"]/i,

        /_t\s*=\s*['"]([^'"]+)['"]/i

    ];

    for (
        const pattern of patterns
    ) {

        const match =
            html.match(
                pattern
            );

        if (
            match?.[1]
        ) {
            return match[1];
        }
    }

    return null;
}


// ==========================================================
// POST /s.php
// ==========================================================

async function postSphp(
    token,
    params,
    playerUrl,
    cookieHeader
) {

    const body =
        new URLSearchParams({
            ...params,
            tok: token
        });

    const response =
        await fetch(
            `${PLAYER_HOST}/s.php`,
            {
                method: "POST",

                headers: {
                    "User-Agent":
                        USER_AGENT,

                    "Accept":
                        "application/json,text/plain,*/*",

                    "Content-Type":
                        "application/x-www-form-urlencoded; charset=UTF-8",

                    "Referer":
                        playerUrl,

                    "Origin":
                        PLAYER_HOST,

                    ...(cookieHeader
                        ? {
                            "Cookie":
                                cookieHeader
                        }
                        : {})
                },

                body
            }
        );

    if (
        !response.ok
    ) {
        throw new Error(
            `s.php HTTP ${response.status}`
        );
    }

    return await response.json();
}


// ==========================================================
// HLS
// ==========================================================

async function resolveHls(
    sourceUrl,
    sig,
    playerUrl,
    label
) {

    const master =
        new URL(
            "/p.php",
            PLAYER_HOST
        );

    master.searchParams.set(
        "url",
        sourceUrl
    );

    if (
        sig
    ) {
        master.searchParams.set(
            "sig",
            sig
        );
    }

    const masterUrl =
        master.href;

    console.log(
        `[PelisSeriesHoy] ${label} -> HLS`
    );

    let playlist = "";

    try {

        const response =
            await fetch(
                masterUrl,
                {
                    headers: {
                        "User-Agent":
                            USER_AGENT,

                        "Accept":
                            "application/vnd.apple.mpegurl,application/x-mpegURL,text/plain,*/*",

                        "Referer":
                            playerUrl
                    }
                }
            );

        if (
            response.ok
        ) {
            playlist =
                await response.text();
        }

    } catch (
        error
    ) {

        console.warn(
            `[PelisSeriesHoy] Master error: ${error.message}`
        );
    }

    if (
        !playlist
    ) {

        return [
            {
                name:
                    `SoloLatino ${cleanLabel(label)} HLS`,

                url:
                    masterUrl,

                quality:
                    "auto",

                headers:
                    {}
            }
        ];
    }

    const variants =
        parseHlsVariants(
            playlist,
            masterUrl
        );

    if (
        variants.length === 0
    ) {

        return [
            {
                name:
                    `SoloLatino ${cleanLabel(label)} HLS`,

                url:
                    masterUrl,

                quality:
                    "auto",

                headers:
                    {}
            }
        ];
    }

    return variants.map(
        variant => {

            const proxy =
                new URL(
                    masterUrl
                );

            proxy.searchParams.set(
                "url",
                variant.url
            );

            if (
                sig
            ) {
                proxy.searchParams.set(
                    "sig",
                    sig
                );
            }

            return {
                name:
                    `SoloLatino ${cleanLabel(label)} ${variant.quality}`,

                url:
                    proxy.href,

                quality:
                    variant.quality,

                headers:
                    {}
            };
        }
    );
}


// ==========================================================
// PARSER HLS
// ==========================================================

function parseHlsVariants(
    playlist,
    baseUrl
) {

    const lines =
        playlist
            .split(/\r?\n/)
            .map(
                line => line.trim()
            );

    const variants = [];

    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        const line =
            lines[i];

        if (
            !line.startsWith(
                "#EXT-X-STREAM-INF:"
            )
        ) {
            continue;
        }

        const next =
            lines[i + 1];

        if (
            !next ||
            next.startsWith("#")
        ) {
            continue;
        }

        const resolution =
            line.match(
                /RESOLUTION=\d+x(\d+)/i
            );

        const bandwidth =
            line.match(
                /BANDWIDTH=(\d+)/i
            );

        let quality =
            "auto";

        if (
            resolution
        ) {

            quality =
                `${Number(
                    resolution[1]
                )}p`;

        } else {

            const name =
                line.match(
                    /(?:^|,)NAME="?([^",]+)"?(?:,|$)/i
                );

            if (
                name?.[1]
            ) {
                quality =
                    name[1]
                        .trim();
            }
        }

        try {

            const url =
                new URL(
                    next,
                    baseUrl
                ).href;

            if (
                variants.some(
                    item =>
                        item.url === url
                )
            ) {
                continue;
            }

            variants.push({
                url,
                quality,
                bandwidth:
                    bandwidth
                        ? Number(
                            bandwidth[1]
                        )
                        : 0
            });

        } catch {
            // ignorar variante inválida
        }
    }

    variants.sort(
        (a, b) =>
            qualityNumber(b.quality) -
            qualityNumber(a.quality)
    );

    return variants;
}


// ==========================================================
// HELPERS
// ==========================================================

function qualityNumber(
    quality
) {

    const match =
        String(
            quality
        ).match(
            /(\d+)p/i
        );

    return match
        ? Number(
            match[1]
        )
        : 0;
}


function cleanLabel(
    label
) {

    return String(
        label
    )
        .replace(
            /[^\p{L}\p{N}\s+.-]/gu,
            ""
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();
}


function deduplicate(
    streams
) {

    const seen =
        new Set();

    return streams.filter(
        stream => {

            if (
                !stream?.url
            ) {
                return false;
            }

            const key =
                `${stream.url}|${stream.quality || ""}`;

            if (
                seen.has(
                    key
                )
            ) {
                return false;
            }

            seen.add(
                key
            );

            return true;
        }
    );
}
