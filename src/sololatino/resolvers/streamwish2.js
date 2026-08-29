/**
 * StreamWish Resolver
 *
 * Convierte HGLINK -> Hanerix mediante proxy,
 * extrae todas las fuentes HLS disponibles,
 * descarga el master y devuelve todas las calidades.
 */

import {
    HEADERS
} from "../http.js";


const PROXY_BASE =
    "https://plugin1.duckdns.org";


export async function resolveStreamwish2(
    url
) {

    console.log(
        `[StreamWish2] Opening: ${url}`
    );

    // ======================================================
    // 1. HGLINK -> HANERIX
    // ======================================================

    const hanerixUrl =
        getHanerixUrl(
            url
        );

    if (
        !hanerixUrl
    ) {

        throw new Error(
            `[StreamWish2] No se pudo convertir la URL a Hanerix: ${url}`
        );
    }

    console.log(
        `[StreamWish2] Hanerix: ${hanerixUrl}`
    );

    // ======================================================
    // 2. HANERIX A TRAVÉS DEL PROXY
    // ======================================================

    const proxyPlayerUrl =
        `${PROXY_BASE}/hanerix?url=` +
        encodeURIComponent(
            hanerixUrl
        );

    console.log(
        `[StreamWish2] Hanerix proxy: ${proxyPlayerUrl}`
    );

    const player =
        await fetchPage(
            proxyPlayerUrl,
            "https://hglink.to/"
        );

    // IMPORTANTE:
    // Las URLs relativas deben resolverse contra Hanerix,
    // no contra el proxy.
    player.url =
        hanerixUrl;

    console.log(
        `[StreamWish2] Hanerix HTML length: ${player.html.length}`
    );

    if (
        player.html.length < 2000
    ) {

        throw new Error(
            `[StreamWish2] Hanerix devolvió un HTML inesperadamente pequeño: ${player.html.length} bytes`
        );
    }

    // ======================================================
    // 3. DESAQUETAR PACKER
    // ======================================================

    const unpacked =
        unpackPacker(
            player.html
        );

    // ======================================================
    // 4. BUSCAR FUENTES HLS
    // ======================================================

    const hlsSources =
        extractHlsSources(
            unpacked,
            player.url
        );

    console.log(
        `[StreamWish2] HLS sources: ${hlsSources.length}`
    );

    for (
        const source of
        hlsSources
    ) {

        console.log(
            `[StreamWish2] ${source.type} -> ${source.url}`
        );
    }

    // ======================================================
    // 5. PREFERIR HLS3
    // ======================================================

    const masterSource =
        hlsSources.find(
            source =>
                source.type ===
                "hls3"
        ) ||
        hlsSources.find(
            source =>
                source.type ===
                "hls4"
        ) ||
        hlsSources.find(
            source =>
                source.type ===
                "hls2"
        );

    if (
        !masterSource
    ) {

        throw new Error(
            `[StreamWish2] No se encontró ninguna fuente HLS. ${getHlsDiagnostic(
                unpacked,
                player.html
            )}`
        );
    }

    const masterUrl =
        masterSource.url;

    console.log(
        `[StreamWish2] Master: ${masterUrl}`
    );

    // ======================================================
    // 6. DESCARGAR MASTER
    // ======================================================

    const master =
        await fetchHls(
            masterUrl,
            hanerixUrl
        );

    console.log(
        `[StreamWish2] Master HTTP ${master.status}`
    );

    console.log(
        `[StreamWish2] Master length: ${master.text.length}`
    );

    // ======================================================
    // 7. EXTRAER TODAS LAS VARIANTES
    // ======================================================

    const variants =
        extractHlsVariants(
            master.text,
            masterUrl
        );

    console.log(
        `[StreamWish2] Variants encontrados: ${variants.length}`
    );

    for (
        const variant of
        variants
    ) {

        console.log(
            `[StreamWish2] ${variant.quality} -> ${variant.url}`
        );
    }

    if (
        variants.length === 0
    ) {

        throw new Error(
            "[StreamWish2] No se encontraron variantes HLS en el master."
        );
    }

    // ======================================================
    // 8. CREAR URL DEL PROXY PARA CADA CALIDAD
    // ======================================================

    const streams =
        [];

    const seen =
        new Set();

    for (
        const variant of
        variants
    ) {

        if (
            !variant?.url
        ) {

            continue;
        }

        if (
            seen.has(
                variant.url
            )
        ) {

            continue;
        }

        seen.add(
            variant.url
        );

        const proxyUrl =
            `${PROXY_BASE}/streamwish/playlist.m3u8?url=` +
            encodeURIComponent(
                variant.url
            );

        streams.push({

            url:
                proxyUrl,

            quality:
                variant.quality ||
                "auto"
        });

        console.log(
            `[StreamWish2] Proxy ${variant.quality}: ${proxyUrl}`
        );
    }

    // ======================================================
    // 9. ORDENAR DE MAYOR A MENOR CALIDAD
    // ======================================================

    streams.sort(
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

    console.log(
        `[StreamWish2] Returning ${streams.length} streams`
    );

    return streams;
}


// ==========================================================
// HGLINK -> HANERIX
// ==========================================================

function getHanerixUrl(
    url
) {

    try {

        const parsed =
            new URL(
                url
            );

        const hostname =
            parsed.hostname
                .toLowerCase();

        if (
            hostname ===
                "hglink.to" ||
            hostname.endsWith(
                ".hglink.to"
            )
        ) {

            parsed.hostname =
                "hanerix.com";

            return parsed.href;
        }

        if (
            hostname ===
                "hanerix.com" ||
            hostname.endsWith(
                ".hanerix.com"
            )
        ) {

            return parsed.href;
        }

        return null;

    } catch {

        return null;
    }
}


// ==========================================================
// FETCH PAGE
// ==========================================================

async function fetchPage(
    url,
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
    }

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
            `HTTP ${response.status} for ${url}`
        );
    }

    return {

        url:
            response.url ||
            url,

        html:
            await response.text()
    };
}


// ==========================================================
// FETCH HLS
// ==========================================================

async function fetchHls(
    url,
    referer
) {

    const refererUrl =
        new URL(
            referer
        );

    const response =
        await fetch(
            url,
            {
                headers: {

                    ...HEADERS,

                    Referer:
                        referer,

                    Origin:
                        refererUrl.origin
                }
            }
        );

    if (
        !response.ok
    ) {

        throw new Error(
            `[StreamWish2] HLS HTTP ${response.status}: ${url}`
        );
    }

    return {

        url,

        status:
            response.status,

        text:
            await response.text()
    };
}


// ==========================================================
// EXTRAER FUENTES HLS DEL HTML
// ==========================================================

function extractHlsSources(
    source,
    pageUrl
) {

    const sources =
        [];

    // ------------------------------------------------------
    // Formato:
    //
    // hls3: "URL"
    // hls2: "URL"
    // ------------------------------------------------------

    const pattern1 =
        /["']?(hls[234])["']?\s*:\s*["']([^"']+)["']/gi;

    let match;

    while (
        (
            match =
                pattern1.exec(
                    source
                )
        ) !== null
    ) {

        addHlsSource(
            sources,
            match[1],
            match[2],
            pageUrl
        );
    }

    // ------------------------------------------------------
    // Formato:
    //
    // hls3 = "URL"
    // ------------------------------------------------------

    const pattern2 =
        /\b(hls[234])\b\s*=\s*["']([^"']+)["']/gi;

    while (
        (
            match =
                pattern2.exec(
                    source
                )
        ) !== null
    ) {

        addHlsSource(
            sources,
            match[1],
            match[2],
            pageUrl
        );
    }

    return sources;
}


// ==========================================================
// AGREGAR FUENTE HLS
// ==========================================================

function addHlsSource(
    sources,
    type,
    value,
    pageUrl
) {

    const normalizedType =
        String(
            type ||
            ""
        )
            .toLowerCase()
            .trim();

    if (
        normalizedType !==
            "hls2" &&
        normalizedType !==
            "hls3" &&
        normalizedType !==
            "hls4"
    ) {

        return;
    }

    let cleanValue =
        String(
            value ||
            ""
        );

    cleanValue =
        cleanValue
            .replace(
                /\\\//g,
                "/"
            )
            .replace(
                /\\u002f/gi,
                "/"
            )
            .replace(
                /\\u003a/gi,
                ":"
            )
            .replace(
                /&amp;/gi,
                "&"
            );

    try {

        const absoluteUrl =
            new URL(
                cleanValue,
                pageUrl
            ).href;

        if (
            sources.some(
                source =>
                    source.type ===
                        normalizedType &&
                    source.url ===
                        absoluteUrl
            )
        ) {

            return;
        }

        sources.push({

            type:
                normalizedType,

            url:
                absoluteUrl
        });

    } catch {

        console.log(
            `[StreamWish2] URL HLS inválida: ${cleanValue}`
        );
    }
}


// ==========================================================
// EXTRAER TODAS LAS VARIANTES DEL MASTER
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
            ]
                .trim();

        if (
            !line.startsWith(
                "#EXT-X-STREAM-INF:"
            )
        ) {

            continue;
        }

        // --------------------------------------------------
        // Buscar la URL siguiente no-comentada
        // --------------------------------------------------

        let location =
            null;

        for (
            let next =
                index + 1;
            next <
                lines.length;
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

            location =
                candidate;

            break;
        }

        if (
            !location
        ) {

            continue;
        }

        // --------------------------------------------------
        // RESOLUTION
        // --------------------------------------------------

        const resolution =
            line.match(
                /(?:^|,)RESOLUTION=\d+x(\d+)(?:,|$)/i
            );

        // --------------------------------------------------
        // NAME
        // --------------------------------------------------

        const name =
            line.match(
                /(?:^|,)NAME="?([^",]+)"?(?:,|$)/i
            );

        let quality =
            "auto";

        if (
            resolution
        ) {

            quality =
                `${resolution[1]}p`;

        } else if (
            name
        ) {

            quality =
                name[1]
                    .trim();
        }

        try {

            const absoluteUrl =
                new URL(
                    location,
                    masterUrl
                ).href;

            if (
                variants.some(
                    variant =>
                        variant.url ===
                        absoluteUrl
                )
            ) {

                continue;
            }

            variants.push({

                url:
                    absoluteUrl,

                quality:
                    quality
            });

        } catch {

            console.log(
                `[StreamWish2] Variant URL inválida: ${location}`
            );
        }
    }

    return variants;
}


// ==========================================================
// QUALITY NUMBER
// ==========================================================

function qualityNumber(
    value
) {

    const match =
        String(
            value ||
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
// DIAGNÓSTICO
// ==========================================================

function getHlsDiagnostic(
    source,
    rawHtml
) {

    const sourceText =
        String(
            source ||
            ""
        );

    const htmlText =
        String(
            rawHtml ||
            ""
        );

    const sourceLower =
        sourceText.toLowerCase();

    const htmlLower =
        htmlText.toLowerCase();

    return (
        `RAW_HTML=${htmlText.length}` +
        ` | UNPACKED=${sourceText.length}` +
        ` | RAW_HLS2=${htmlLower.includes("hls2")}` +
        ` | RAW_HLS3=${htmlLower.includes("hls3")}` +
        ` | RAW_HLS4=${htmlLower.includes("hls4")}` +
        ` | UNPACKED_HLS2=${sourceLower.includes("hls2")}` +
        ` | UNPACKED_HLS3=${sourceLower.includes("hls3")}` +
        ` | UNPACKED_HLS4=${sourceLower.includes("hls4")}`
    );
}


// ==========================================================
// PACKER
// ==========================================================

function unpackPacker(
    html
) {

    const match =
        html.match(
            /eval\(function\(p,a,c,k,e,d\)\{[\s\S]*?\}\('((?:\\.|[^'])*)',(\d+),(\d+),'((?:\\.|[^'])*)'\.split\('\|'\)\)\)/
        );

    if (
        !match
    ) {

        console.log(
            "[StreamWish2] No se encontró código Packer."
        );

        return html;
    }

    let source =
        decodePackedString(
            match[1]
        );

    const base =
        Number(
            match[2]
        );

    const count =
        Number(
            match[3]
        );

    const dictionary =
        decodePackedString(
            match[4]
        )
            .split(
                "|"
            );

    console.log(
        `[StreamWish2] Packer base=${base} count=${count}`
    );

    for (
        let index =
            count - 1;
        index >= 0;
        index--
    ) {

        const replacement =
            dictionary[
                index
            ];

        if (
            !replacement
        ) {

            continue;
        }

        source =
            source.replace(
                new RegExp(
                    `\\b${index.toString(base)}\\b`,
                    "g"
                ),
                replacement
            );
    }

    return source;
}


// ==========================================================
// DECODE PACKER
// ==========================================================

function decodePackedString(
    value
) {

    return String(
        value ||
        ""
    )
        .replace(
            /\\(x[\da-fA-F]{2}|u[\da-fA-F]{4}|.)/g,
            (
                match,
                escape
            ) => {

                if (
                    escape.startsWith(
                        "x"
                    ) ||
                    escape.startsWith(
                        "u"
                    )
                ) {

                    return String.fromCharCode(
                        Number.parseInt(
                            escape.slice(
                                1
                            ),
                            16
                        )
                    );
                }

                return ({
                    b: "\b",
                    f: "\f",
                    n: "\n",
                    r: "\r",
                    t: "\t",
                    v: "\v"
                })[
                    escape
                ] ??
                escape;
            }
        );
}
