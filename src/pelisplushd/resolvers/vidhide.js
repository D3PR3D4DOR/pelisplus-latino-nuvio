/**
 * Vidhide Resolver
 */

import { fetchText, HEADERS } from "../http.js";
import { extractHlsVariants } from "../hls.js";

export async function resolveVidhide(url) {
    console.log(`[Vidhide] Opening ${url}`);

    const html = await fetchText(url);
    const unpacked = unpackPacker(html);
    const sources = extractSources(unpacked, url);

    if (sources.length === 0) {
        throw new Error("[Vidhide] No se encontró la configuración de JWPlayer.");
    }

    const streams = [];

    for (const source of sources) {
        try {
            console.log("[Vidhide] Master:", source.url);

            const response = await fetch(source.url, {
                headers: {
                    ...HEADERS,
                    Referer: url,
                    Origin: new URL(url).origin
                }
            });

            console.log("[Vidhide] HTTP status:", response.status);

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status} for ${source.url}`);
            }

            const playlist = await response.text();

            console.log("[Vidhide] Playlist length:", playlist.length);
            console.log("[Vidhide] First line:", playlist.split("\n")[0]);
            console.log("[Vidhide] Is HLS:", playlist.trimStart().startsWith("#EXTM3U"));

            const variants = extractHlsVariants(playlist, source.url);

            console.log("[Vidhide] Variant count:", variants.length);
            console.log("[Vidhide] Variants:", variants);

            if (variants.length > 0) {
                streams.push(...variants);
                continue;
            }
        } catch (error) {
            console.warn(`[Vidhide] No se pudo leer el playlist ${source.url}:`, error.message);
        }

        streams.push({ url: source.url, quality: source.quality });
    }

    const result = removeDuplicates(streams);

    console.log("[Vidhide] Returning:", result);

    return result;
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

        const token = index.toString(base);
        source = source.replace(
            new RegExp(`\\b${token}\\b`, "g"),
            replacement
        );
    }

    return source;
}

function decodePackedString(value) {
    return value.replace(/\\(x[\da-fA-F]{2}|u[\da-fA-F]{4}|.)/g, (match, escape) => {
        if (escape.startsWith("x")) {
            return String.fromCharCode(Number.parseInt(escape.slice(1), 16));
        }

        if (escape.startsWith("u")) {
            return String.fromCharCode(Number.parseInt(escape.slice(1), 16));
        }

        const escapes = {
            b: "\b",
            f: "\f",
            n: "\n",
            r: "\r",
            t: "\t",
            v: "\v"
        };

        return escapes[escape] ?? escape;
    });
}

function extractSources(source, pageUrl) {
    const sources = [];
    const matches = source.matchAll(
        /["'](hls4|hls3|hls2)["']\s*:\s*["']([^"']+)["']/g
    );

    for (const match of matches) {
        const url = new URL(match[2], pageUrl).href;

        if (!url.includes(".m3u8")) {
            continue;
        }

        sources.push({
            url,
            quality: "auto",
            priority: Number(match[1].slice(-1))
        });
    }

    return sources
        .sort((left, right) => right.priority - left.priority)
        .slice(0, 1);
}

function removeDuplicates(streams) {
    const seen = new Set();

    return streams.filter(stream => {
        if (seen.has(stream.url)) {
            return false;
        }

        seen.add(stream.url);
        return true;
    });
}
