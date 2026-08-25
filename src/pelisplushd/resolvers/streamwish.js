/**
 * StreamWish Resolver
 */

import { HEADERS } from "../http.js";
import { extractHlsVariants } from "../hls.js";

export async function resolveStreamwish(url) {
    console.log(`[Streamwish] Opening ${url}`);

    const player = await getPlayerPage(url);
    const sources = extractHlsSources(player.html, player.url);

    if (sources.length === 0) {
        throw new Error("[Streamwish] No se encontró la configuración HLS del reproductor.");
    }

    for (const source of sources) {
        console.log("[Streamwish] Master:", source.url);

        const response = await fetch(source.url, {
            headers: {
                ...HEADERS,
                Referer: player.url,
                Origin: new URL(player.url).origin
            }
        });

        if (!response.ok) {
            console.warn(`[Streamwish] HTTP ${response.status} for ${source.url}`);
            continue;
        }

        const playlist = await response.text();
        const variants = extractHlsVariants(playlist, source.url);

        console.log("[Streamwish] Variant count:", variants.length);
        console.log("[Streamwish] Variants:", variants);

        if (variants.length > 0) {
            return variants;
        }
    }

    throw new Error("[Streamwish] No se encontraron variantes HLS en los masters disponibles.");
}

async function getPlayerPage(url) {
    const page = await fetchPage(url);

    if (extractHlsSources(page.html, page.url).length > 0) {
        return page;
    }

    const playerUrl = getPlayerUrl(page.html, page.url);

    if (!playerUrl) {
        throw new Error("[Streamwish] No se encontró el reproductor ni el script de redirección.");
    }

    console.log("[Streamwish] Player:", playerUrl);

    return fetchPage(playerUrl, page.url);
}

async function fetchPage(url, referer) {
    const headers = { ...HEADERS };

    if (referer) {
        headers.Referer = referer;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
        throw new Error(`HTTP error ${response.status} for ${url}`);
    }

    return {
        url: response.url || url,
        html: await response.text()
    };
}

function getPlayerUrl(html, pageUrl) {
    const redirect = html.match(
        /(?:window\.)?location(?:\.href)?\s*=\s*["']([^"']+)["']/i
    );

    if (redirect) {
        return new URL(redirect[1], pageUrl).href;
    }

    const page = new URL(pageUrl);

    if (page.hostname === "hglink.to" && /<script[^>]+src=["'][^"']*main\.js/i.test(html)) {
        page.hostname = "hanerix.com";
        return page.href;
    }

    return null;
}

function extractHlsSources(html, pageUrl) {
    const unpacked = unpackPacker(html);
    const sources = [];
    const matches = unpacked.matchAll(
        /["'](hls4|hls3|hls2)["']\s*:\s*["']([^"']+)["']/g
    );

    for (const match of matches) {
        sources.push({
            url: new URL(match[2], pageUrl).href,
            priority: Number(match[1].slice(-1))
        });
    }

    return sources.sort((left, right) => right.priority - left.priority);
}

function unpackPacker(html) {
    const match = html.match(
        /eval\(function\(p,a,c,k,e,d\)\{[\s\S]*?\}\('((?:\\.|[^'])*)',(\d+),(\d+),'((?:\\.|[^'])*)'\.split\('\|'\)\)\)/
    );

    if (!match) {
        return html;
    }

    let source = decodePackedString(match[1]);
    const base = Number(match[2]);
    const count = Number(match[3]);
    const dictionary = decodePackedString(match[4]).split("|");

    for (let index = count - 1; index >= 0; index--) {
        const replacement = dictionary[index];

        if (!replacement) {
            continue;
        }

        source = source.replace(
            new RegExp(`\\b${index.toString(base)}\\b`, "g"),
            replacement
        );
    }

    return source;
}

function decodePackedString(value) {
    return value.replace(/\\(x[\da-fA-F]{2}|u[\da-fA-F]{4}|.)/g, (match, escape) => {
        if (escape.startsWith("x") || escape.startsWith("u")) {
            return String.fromCharCode(Number.parseInt(escape.slice(1), 16));
        }

        return ({
            b: "\b",
            f: "\f",
            n: "\n",
            r: "\r",
            t: "\t",
            v: "\v"
        })[escape] ?? escape;
    });
}
