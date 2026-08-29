import {
    fetchText,
    HEADERS
} from "../http.js";


// ==========================================================
// VOE RESOLVER
// ==========================================================

export async function resolveVoe(
    url
) {

    console.log(
        `[VOE] Opening: ${url}`
    );

    if (
        !url ||
        typeof url !== "string"
    ) {

        return [];
    }

    try {

        const response =
            await fetchVoePage(
                url
            );

        console.log(
            `[VOE] Final URL: ${response.url}`
        );

        console.log(
            `[VOE] HTML length: ${response.html.length}`
        );

        // --------------------------------------------------
        // ALTCHA
        // --------------------------------------------------

        if (
            isAltchaPage(
                response.html
            )
        ) {

            console.log(
                "[VOE] Página protegida por ALTCHA"
            );

            console.log(
                "[VOE] Se requiere verificación manual"
            );

            return [];
        }

        // --------------------------------------------------
        // EXTRAER SOURCE
        // --------------------------------------------------

        const source =
            extractSourceFromHtml(
                response.html
            );

        if (
            !source
        ) {

            console.log(
                "[VOE] No se encontró data.source"
            );

            return [];
        }

        console.log(
            `[VOE] Source: ${source}`
        );

        // --------------------------------------------------
        // SOURCE -> HLS
        // --------------------------------------------------

        const streams =
            await resolveSource(
                source,
                response.url
            );

        console.log(
            `[VOE] Returning: ${streams.length}`
        );

        return streams;

    } catch (
        error
    ) {

        console.warn(
            `[VOE] Error: ${error.message}`
        );

        return [];
    }
}


// ==========================================================
// OBTENER PÁGINA VOE
// ==========================================================

async function fetchVoePage(
    url
) {

    let currentUrl =
        url;

    for (
        let attempt = 0;
        attempt < 3;
        attempt++
    ) {

        const response =
            await fetch(
                currentUrl,
                {
                    headers: {
                        ...HEADERS
                    },

                    redirect:
                        "follow"
                }
            );

        if (
            !response.ok
        ) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const html =
            await response.text();

        // --------------------------------------------------
        // Redirect HTTP ya seguido por fetch()
        // --------------------------------------------------

        const finalUrl =
            response.url ||
            currentUrl;

        if (
            finalUrl !==
            currentUrl
        ) {

            console.log(
                `[VOE] HTTP redirect: ${finalUrl}`
            );

            currentUrl =
                finalUrl;
        }

        // --------------------------------------------------
        // Redirect escrito dentro del HTML
        // --------------------------------------------------

        const locationMatch =
            html.match(
                /(?:window\.)?location(?:\.href)?\s*=\s*["']([^"']+)["']/i
            );

        const metaRefresh =
            html.match(
                /<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^"']*url=([^"']+)["']/i
            );

        const redirect =
            locationMatch?.[1] ||
            metaRefresh?.[1];

        if (
            redirect
        ) {

            const nextUrl =
                new URL(
                    redirect,
                    currentUrl
                ).href;

            if (
                nextUrl !==
                currentUrl
            ) {

                console.log(
                    `[VOE] HTML redirect: ${nextUrl}`
                );

                currentUrl =
                    nextUrl;

                continue;
            }
        }

        return {

            url:
                currentUrl,

            html:
                html
        };
    }

    throw new Error(
        "Demasiados redirects VOE"
    );
}

export function extractSourceFromHtml(
    html
) {

    if (
        !html
    ) {

        return null;
    }

    // ------------------------------------------------------
    // application/json
    // ------------------------------------------------------

    const match =
        html.match(
            /<script\s+type=["']application\/json["']\s*>\s*([\s\S]*?)\s*<\/script>/i
        );

    if (
        !match
    ) {

        return null;
    }

    let payload;

    try {

        payload =
            JSON.parse(
                match[1]
            );

    } catch (
        error
    ) {

        console.warn(
            "[VOE] JSON payload inválido:",
            error.message
        );

        return null;
    }

    const encoded =
        Array.isArray(
            payload
        )
            ? payload[0]
            : payload;

    if (
        typeof encoded !==
        "string"
    ) {

        return null;
    }

    try {

        const decoded =
            decodeVoePayload(
                encoded
            );

        const data =
            JSON.parse(
                decoded
            );

        if (
            data?.source
        ) {

            return data.source;
        }

    } catch (
        error
    ) {

        console.warn(
            "[VOE] Error decodificando payload:",
            error.message
        );
    }

    return null;
}


// ==========================================================
// DECODER VOE
// ==========================================================

function decodeVoePayload(
    encoded
) {

    // ------------------------------------------------------
    // 1. ROT13
    // ------------------------------------------------------

    let value =
        encoded.replace(
            /[a-zA-Z]/g,
            char => {

                const code =
                    char.charCodeAt(
                        0
                    );

                const base =
                    code <= 90
                        ? 65
                        : 97;

                return String.fromCharCode(
                    (
                        code -
                        base +
                        13
                    ) % 26 +
                    base
                );
            }
        );

    // ------------------------------------------------------
    // 2. Eliminar separadores
    // ------------------------------------------------------

    const noise = [
        "@$",
        "^^",
        "~@",
        "%?",
        "*~",
        "!!",
        "#&"
    ];

    for (
        const token of
        noise
    ) {

        value =
            value
                .split(
                    token
                )
                .join("");
    }

    // ------------------------------------------------------
    // 3. Base64
    // ------------------------------------------------------

    const stage1 =
        Buffer.from(
            value,
            "base64"
        ).toString(
            "utf8"
        );

    if (
        !stage1
    ) {

        throw new Error(
            "Base64 stage 1 vacío"
        );
    }

    // ------------------------------------------------------
    // 4. -3 a cada carácter
    // ------------------------------------------------------

    let shifted =
        "";

    for (
        let index = 0;
        index < stage1.length;
        index++
    ) {

        shifted +=
            String.fromCharCode(
                stage1.charCodeAt(
                    index
                ) - 3
            );
    }

    // ------------------------------------------------------
    // 5. Reverse
    // ------------------------------------------------------

    const reversed =
        shifted
            .split("")
            .reverse()
            .join("");

    // ------------------------------------------------------
    // 6. Base64 final
    // ------------------------------------------------------

    const stage2 =
        Buffer.from(
            reversed,
            "base64"
        ).toString(
            "utf8"
        );

    if (
        !stage2
    ) {

        throw new Error(
            "Base64 stage 2 vacío"
        );
    }

    return stage2;
}


// ==========================================================
// SOURCE
// ==========================================================

async function resolveSource(
    source,
    referer
) {

    const normalized =
        String(
            source ||
            ""
        )
            .trim();

    if (
        !normalized
    ) {

        return [];
    }

    // ------------------------------------------------------
    // M3U8
    // ------------------------------------------------------

    if (
        /\.m3u8(?:\?|$)/i.test(
            normalized
        )
    ) {

        console.log(
            "[VOE] Source es M3U8"
        );

        try {

            const playlist =
                await fetchPlaylist(
                    normalized,
                    referer
                );

            console.log(
                `[VOE] Playlist length: ${playlist.length}`
            );

            const variants =
                extractHlsVariants(
                    playlist,
                    normalized
                );

            console.log(
                `[VOE] Variants: ${variants.length}`
            );

            if (
                variants.length > 0
            ) {

                for (
                    const variant of
                    variants
                ) {

                    console.log(
                        `[VOE] ${variant.quality} -> ${variant.url}`
                    );
                }

                return variants.map(
                    variant => ({

                        url:
                            variant.url,

                        quality:
                            variant.quality,

                        headers:
                            buildHeaders(
                                referer
                            )
                    })
                );
            }

        } catch (
            error
        ) {

            console.warn(
                "[VOE] Error leyendo HLS:",
                error.message
            );
        }

        // --------------------------------------------------
        // Playlist única
        // --------------------------------------------------

        return [
            {

                url:
                    normalized,

                quality:
                    "auto",

                headers:
                    buildHeaders(
                        referer
                    )
            }
        ];
    }

    // ------------------------------------------------------
    // Source directo
    // ------------------------------------------------------

    return [
        {

            url:
                normalized,

            quality:
                "auto",

            headers:
                buildHeaders(
                    referer
                )
        }
    ];
}


// ==========================================================
// FETCH PLAYLIST
// ==========================================================

async function fetchPlaylist(
    url,
    referer
) {

    const headers =
        buildHeaders(
            referer
        );

    const response =
        await fetch(
            url,
            {
                headers,

                redirect:
                    "follow"
            }
        );

    if (
        !response.ok
    ) {

        throw new Error(
            `HLS HTTP ${response.status}`
        );
    }

    return response.text();
}


// ==========================================================
// HEADERS
// ==========================================================

function buildHeaders(
    referer
) {

    const headers = {
        ...HEADERS
    };

    if (
        referer
    ) {

        headers.Referer =
            referer;

        try {

            headers.Origin =
                new URL(
                    referer
                ).origin;

        } catch {
            // ignorar
        }
    }

    return headers;
}


// ==========================================================
// EXTRAER VARIANTES HLS
// ==========================================================

function extractHlsVariants(
    playlist,
    masterUrl
) {

    const lines =
        String(
            playlist ||
            ""
        )
            .split(
                /\r?\n/
            )
            .map(
                line =>
                    line.trim()
            );

    const variants =
        [];

    for (
        let index = 0;
        index < lines.length;
        index++
    ) {

        const line =
            lines[
                index
            ];

        if (
            !line.startsWith(
                "#EXT-X-STREAM-INF:"
            )
        ) {

            continue;
        }

        let streamUrl =
            null;

        // --------------------------------------------------
        // Buscar URL siguiente
        // --------------------------------------------------

        for (
            let next =
                index + 1;
            next < lines.length;
            next++
        ) {

            const candidate =
                lines[
                    next
                ]
                    .trim();

            if (
                !candidate
            ) {

                continue;
            }

            if (
                candidate.startsWith(
                    "#"
                )
            ) {

                continue;
            }

            streamUrl =
                candidate;

            break;
        }

        if (
            !streamUrl
        ) {

            continue;
        }

        // --------------------------------------------------
        // Resolución
        // --------------------------------------------------

        const resolution =
            line.match(
                /RESOLUTION=\d+x(\d+)/i
            );

        const frameRate =
            line.match(
                /FRAME-RATE=([\d.]+)/i
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
                `${resolution[1]}p`;

        } else if (
            bandwidth
        ) {

            quality =
                `${bandwidth[1]}bps`;
        }

        try {

            const absolute =
                new URL(
                    streamUrl,
                    masterUrl
                ).href;

            if (
                variants.some(
                    variant =>
                        variant.url ===
                        absolute
                )
            ) {

                continue;
            }

            variants.push({

                url:
                    absolute,

                quality:
                    quality,

                frameRate:
                    frameRate
                        ? Number(
                            frameRate[1]
                        )
                        : null
            });

        } catch {

            console.warn(
                `[VOE] URL HLS inválida: ${streamUrl}`
            );
        }
    }

    // ------------------------------------------------------
    // Mayor calidad primero
    // ------------------------------------------------------

    variants.sort(
        (
            a,
            b
        ) =>
            qualityNumber(
                b.quality
            ) -
            qualityNumber(
                a.quality
            )
    );

    return variants;
}


// ==========================================================
// QUALITY NUMBER
// ==========================================================

function qualityNumber(
    quality
) {

    const match =
        String(
            quality ||
            ""
        )
            .match(
                /(\d+)p/i
            );

    return match
        ? Number(
            match[1]
        )
        : 0;
}


// ==========================================================
// ALTCHA
// ==========================================================

function isAltchaPage(
    html
) {

    const text =
        String(
            html ||
            ""
        );

    return (
        /<altcha-widget\b/i.test(
            text
        ) ||
        /access-form/i.test(
            text
        ) &&
        /altcha/i.test(
            text
        )
    );
}

