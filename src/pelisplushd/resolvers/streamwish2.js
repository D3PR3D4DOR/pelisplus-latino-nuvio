/**
 * StreamWish Resolver
 *
 * Convierte HGLINK directamente a Hanerix,
 * usa el proxy local para acceder a Hanerix,
 * encuentra todas las variantes de HLS3
 * y devuelve cada calidad a travÃ©s del proxy local.
 */

import { HEADERS } from "../http.js";

const PROXY_BASE =
    "http://192.168.124.11:8090";

export async function resolveStreamwish2(url) {

    console.log(
        `[StreamWish2] Opening: ${url}`
    );

    // ==================================================
    // 1. Convertir HGLINK directamente a HANERIX
    // ==================================================

    const hanerixUrl =
        getHanerixUrl(
            url
        );

    if (!hanerixUrl) {

        throw new Error(
            `[StreamWish2] No se pudo convertir la URL a Hanerix: ${url}`
        );
    }

    console.log(
        `[StreamWish2] Hanerix: ${hanerixUrl}`
    );

    // ==================================================
    // 2. Abrir HANERIX a travÃ©s del proxy local
    // ==================================================

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

    // Para resolver URLs relativas usamos la URL real.
    player.url =
        hanerixUrl;

    console.log(
        `[StreamWish2] Hanerix HTML length: ${player.html.length}`
    );

    // ==================================================
    // 3. Verificar contenido recibido
    // ==================================================

    if (
        player.html.length < 2000
    ) {

        throw new Error(
            `[StreamWish2] Hanerix devolviÃ³ un HTML inesperadamente pequeÃ±o: ${player.html.length} bytes`
        );
    }

    // ==================================================
    // 4. Desempaquetar Packer
    // ==================================================

    const unpacked =
        unpackPacker(
            player.html
        );

    // ==================================================
    // 5. Buscar fuentes HLS
    // ==================================================

    const hlsSources =
        extractHlsSources(
            unpacked,
            player.url
        );

    console.log(
        `[StreamWish2] HLS sources: ${hlsSources.length}`
    );

    for (
        let i = 0;
        i < hlsSources.length;
        i++
    ) {

        const source =
            hlsSources[i];

        console.log(
            `[StreamWish2] ${source.type} -> ${source.url}`
        );
    }

    // ==================================================
    // 6. Buscar HLS3
    // ==================================================

    const hls3 =
        hlsSources.find(
            source =>
                source.type === "hls3"
        );

    if (!hls3) {

        const diagnostic =
            getHlsDiagnostic(
                unpacked,
                player.html
            );

        throw new Error(
            `[StreamWish2] No se encontrÃ³ hls3. ${diagnostic}`
        );
    }

    const masterUrl =
        hls3.url;

    console.log(
        `[StreamWish2] HLS3 master: ${masterUrl}`
    );

    // ==================================================
    // 7. Descargar master.txt
    // ==================================================

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

    // ==================================================
    // 8. Buscar TODAS las variantes
    // ==================================================

    const variants =
        findVariants(
            master.text,
            masterUrl
        );

    if (
        variants.length === 0
    ) {

        throw new Error(
            "[StreamWish2] No se encontraron variantes HLS."
        );
    }

    console.log(
        `[StreamWish2] Variantes encontradas: ${variants.length}`
    );

    for (
        let i = 0;
        i < variants.length;
        i++
    ) {

        console.log(
            `[StreamWish2] ${variants[i].quality} upstream: ${variants[i].url}`
        );
    }

    // ==================================================
    // 9. Crear streams mediante el proxy
    // ==================================================

    const streams = [];

    for (
        let i = 0;
        i < variants.length;
        i++
    ) {

        const variant =
            variants[i];

        const proxyUrl =
            `${PROXY_BASE}/streamwish/playlist.m3u8?url=` +
            encodeURIComponent(
                variant.url
            );

        console.log(
            `[StreamWish2] ${variant.quality} proxy: ${proxyUrl}`
        );

        streams.push({
            url:
                proxyUrl,

            quality:
                variant.quality
        });
    }

    // ==================================================
    // 10. Devolver todas las calidades
    // ==================================================

    return streams;
}


// ======================================================
// CONVERTIR URL A HANERIX
// ======================================================

function getHanerixUrl(
    url
) {

    try {

        const parsed =
            new URL(
                url
            );

        const hostname =
            parsed.hostname.toLowerCase();

        // HGLINK -> HANERIX
        if (
            hostname === "hglink.to" ||
            hostname.endsWith(".hglink.to")
        ) {

            parsed.hostname =
                "hanerix.com";

            return parsed.href;
        }

        // Ya es Hanerix
        if (
            hostname === "hanerix.com" ||
            hostname.endsWith(".hanerix.com")
        ) {

            return parsed.href;
        }

        return null;

    } catch {

        return null;
    }
}


// ======================================================
// HTTP
// ======================================================

async function fetchPage(
    url,
    referer
) {

    const headers = {
        ...HEADERS
    };

    if (referer) {

        headers.Referer =
            referer;
    }

    const response =
        await fetch(
            url,
            {
                headers,
                redirect: "follow"
            }
        );

    if (!response.ok) {

        throw new Error(
            `HTTP ${response.status} for ${url}`
        );
    }

    return {
        url:
            response.url || url,

        html:
            await response.text()
    };
}


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

    if (!response.ok) {

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


// ======================================================
// EXTRAER FUENTES HLS
// ======================================================

function extractHlsSources(
    source,
    pageUrl
) {

    const sources = [];

    const pattern1 =
        /["']?(hls[234])["']?\s*:\s*["']([^"']+)["']/gi;

    let match;

    while (
        (match = pattern1.exec(source)) !== null
    ) {

        addHlsSource(
            sources,
            match[1],
            match[2],
            pageUrl
        );
    }

    const pattern2 =
        /\b(hls[234])\b\s*=\s*["']([^"']+)["']/gi;

    while (
        (match = pattern2.exec(source)) !== null
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


// ======================================================
// AGREGAR FUENTE HLS
// ======================================================

function addHlsSource(
    sources,
    type,
    value,
    pageUrl
) {

    const normalizedType =
        type
            .toLowerCase()
            .trim();

    if (
        normalizedType !== "hls2" &&
        normalizedType !== "hls3" &&
        normalizedType !== "hls4"
    ) {
        return;
    }

    let cleanValue =
        value;

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

        const alreadyExists =
            sources.some(
                source =>
                    source.type === normalizedType &&
                    source.url === absoluteUrl
            );

        if (
            alreadyExists
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
            `[StreamWish2] URL HLS invÃ¡lida: ${cleanValue}`
        );
    }
}


// ======================================================
// DIAGNÃ“STICO HLS
// ======================================================

function getHlsDiagnostic(
    source,
    rawHtml
) {

    const sourceLower =
        source.toLowerCase();

    const htmlLower =
        rawHtml.toLowerCase();

    const sourceHasHls2 =
        sourceLower.includes(
            "hls2"
        );

    const sourceHasHls3 =
        sourceLower.includes(
            "hls3"
        );

    const sourceHasHls4 =
        sourceLower.includes(
            "hls4"
        );

    const htmlHasHls2 =
        htmlLower.includes(
            "hls2"
        );

    const htmlHasHls3 =
        htmlLower.includes(
            "hls3"
        );

    const htmlHasHls4 =
        htmlLower.includes(
            "hls4"
        );

    const hasPacker =
        htmlLower.includes(
            "eval(function(p,a,c,k,e,d)"
        );

    return (
        `RAW_HTML=${rawHtml.length}` +
        ` | UNPACKED=${source.length}` +
        ` | RAW_HLS2=${htmlHasHls2}` +
        ` | RAW_HLS3=${htmlHasHls3}` +
        ` | RAW_HLS4=${htmlHasHls4}` +
        ` | PACKER=${hasPacker}` +
        ` | UNPACKED_HLS2=${sourceHasHls2}` +
        ` | UNPACKED_HLS3=${sourceHasHls3}` +
        ` | UNPACKED_HLS4=${sourceHasHls4}`
    );
}


// ======================================================
// ENCONTRAR TODAS LAS VARIANTES
// ======================================================

function findVariants(
    playlist,
    masterUrl
) {

    const lines =
        playlist
            .split(
                /\r?\n/
            )
            .map(
                line =>
                    line.trim()
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

        // ----------------------------------------------
        // ResoluciÃ³n
        // ----------------------------------------------

        const resolution =
            line.match(
                /RESOLUTION=\d+x(\d+)/i
            );

        // ----------------------------------------------
        // Nombre, por si el master no tiene resoluciÃ³n
        // ----------------------------------------------

        const name =
            line.match(
                /(?:^|,)NAME="?([^",]+)"?(?:,|$)/i
            );

        const next =
            lines[i + 1];

        if (
            !next ||
            next.startsWith("#")
        ) {
            continue;
        }

        let quality =
            "auto";

        if (resolution) {

            quality =
                `${Number(
                    resolution[1]
                )}p`;

        } else if (name) {

            quality =
                name[1].trim();
        }

        try {

            const streamUrl =
                new URL(
                    next,
                    masterUrl
                ).href;

            const alreadyExists =
                variants.some(
                    variant =>
                        variant.url === streamUrl
                );

            if (
                alreadyExists
            ) {
                continue;
            }

            variants.push({
                url:
                    streamUrl,

                quality:
                    quality
            });

        } catch {

            console.log(
                `[StreamWish2] Variante invÃ¡lida: ${next}`
            );
        }
    }

    // Ordenar de menor a mayor calidad.
    variants.sort(
        (a, b) =>
            qualityNumber(b.quality) -
            qualityNumber(a.quality)
    );

    return variants;
}


// ======================================================
// OBTENER NÃšMERO DE CALIDAD
// ======================================================

function qualityNumber(
    quality
) {

    const match =
        String(
            quality
        ).match(
            /(\d+)p/i
        );

    if (!match) {
        return 99999;
    }

    return Number(
        match[1]
    );
}


// ======================================================
// PACKER
// ======================================================

function unpackPacker(
    html
) {

    const match =
        html.match(
            /eval\(function\(p,a,c,k,e,d\)\{[\s\S]*?\}\('((?:\\.|[^'])*)',(\d+),(\d+),'((?:\\.|[^'])*)'\.split\('\|'\)\)\)/
        );

    if (!match) {

        console.log(
            "[StreamWish2] No se encontrÃ³ cÃ³digo Packer."
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
        ).split(
            "|"
        );

    console.log(
        `[StreamWish2] Packer base=${base} count=${count}`
    );

    for (
        let index = count - 1;
        index >= 0;
        index--
    ) {

        const replacement =
            dictionary[index];

        if (!replacement) {
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


// ======================================================
// DECODE
// ======================================================

function decodePackedString(
    value
) {

    return value.replace(
        /\\(x[\da-fA-F]{2}|u[\da-fA-F]{4}|.)/g,
        (
            match,
            escape
        ) => {

            if (
                escape.startsWith("x") ||
                escape.startsWith("u")
            ) {

                return String.fromCharCode(
                    Number.parseInt(
                        escape.slice(1),
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
            })[escape] ?? escape;
        }
    );
}
