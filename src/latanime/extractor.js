import { getMovie, getTv } from "./tmdb.js";
import { searchLatanime } from "./search.js";
import { getEpisodeUrl } from "./series.js";
import { fetchText } from "./http.js";
import { getResolver } from "./resolvers/index.js";

import cheerio from "cheerio-without-node-native";


// ======================================================
// MAIN EXTRACTOR
// ======================================================

export async function extractStreams(
    tmdbId,
    mediaType,
    season,
    episode
) {

    console.log(
        `[Latanime] Searching TMDB ID: ${tmdbId}`
    );

    // ==================================================
    // TMDB
    // ==================================================

    const media =
        mediaType === "movie"
            ? await getMovie(tmdbId)
            : await getTv(tmdbId);

    console.log(
        "[Latanime] TMDB:",
        media
    );

    // ==================================================
    // SEARCH
    // ==================================================

    const results =
        await searchLatanimeByAllTitles(
            media
        );

    console.log(
        `[Latanime] Total unique results: ${results.length}`
    );

    if (
        results.length === 0
    ) {

        console.log(
            "[Latanime] No search results found."
        );

        return [];
    }

    // ==================================================
    // SELECT LANGUAGE VARIANTS
    // ==================================================

    const selectedResults =
        selectResults(
            results,
            media,
            mediaType === "tv"
                ? season
                : null
        );

    if (
        selectedResults.length === 0
    ) {

        console.log(
            "[Latanime] No matching result found."
        );

        return [];
    }

    console.log(
        `[Latanime] Selected results: ${selectedResults.length}`
    );

    for (
        const selected of selectedResults
    ) {

        if (!selected) {
            continue;
        }

        console.log(
            `[Latanime] Selected: ${selected.title}`
        );

        console.log(
            `[Latanime] Language: ${selected.language || "unknown"}`
        );

        console.log(
            `[Latanime] URL: ${selected.url}`
        );
    }

    // ==================================================
    // PROCESS ALL SELECTED LANGUAGE VARIANTS
    // ==================================================

    const streams =
        [];

    const processedEpisodeUrls =
        new Set();

    for (
        const selected of selectedResults
    ) {

        if (!selected) {
            continue;
        }

        // ==============================================
        // EPISODE
        // ==============================================

        let episodeUrl =
            selected.url;

        if (
            mediaType === "tv"
        ) {

            if (
                !Number.isInteger(
                    Number(season)
                ) ||
                !Number.isInteger(
                    Number(episode)
                )
            ) {

                throw new Error(
                    "[Latanime] A TV request requires season and episode numbers."
                );
            }

            episodeUrl =
                await getEpisodeUrl(
                    selected.url,
                    season,
                    episode
                );

            if (
                !episodeUrl
            ) {

                console.warn(
                    `[Latanime] Episode S${season}E${episode} not found for ${selected.language || "unknown"}`
                );

                continue;
            }

            console.log(
                `[Latanime] ${languageLabel(selected.language)} episode URL: ${episodeUrl}`
            );
        }

        // ==============================================
        // DEDUPLICATE EPISODE
        // ==============================================

        const episodeKey =
            `${selected.language || "unknown"}|${episodeUrl}`;

        if (
            processedEpisodeUrls.has(
                episodeKey
            )
        ) {

            continue;
        }

        processedEpisodeUrls.add(
            episodeKey
        );

        // ==============================================
        // EPISODE HTML
        // ==============================================

        const episodeHtml =
            await fetchText(
                episodeUrl
            );

        console.log(
            `[Latanime] Episode HTML length: ${episodeHtml.length}`
        );

        // ==============================================
        // SERVERS
        // ==============================================

        const servers =
            extractServers(
                episodeHtml,
                episodeUrl
            );

        console.log(
            `[Latanime] Servers found for ${languageLabel(selected.language)}: ${servers.length}`
        );

        // ==============================================
        // RESOLVE
        // ==============================================

        for (
            const server of servers
        ) {

            console.log(
                `[Latanime] Processing server: ${server.name} (${languageLabel(selected.language)})`
            );

            let resolver =
                getResolver(
                    server.name
                );

            // ==========================================
            // FALLBACK: IDENTIFY SERVER BY URL
            // ==========================================

            if (
                !resolver
            ) {

                resolver =
                    getResolverByUrl(
                        server.url
                    );

                if (
                    resolver
                ) {

                    console.log(
                        `[Latanime] Resolver found by URL for: ${server.name}`
                    );
                }
            }

            if (
                !resolver
            ) {

                console.log(
                    `[Latanime] No resolver for: ${server.name}`
                );

                continue;
            }

            try {

                const resolved =
                    await resolver(
                        server.url
                    );

                if (
                    !resolved ||
                    !resolved.url
                ) {

                    console.warn(
                        `[Latanime] Resolver returned no stream: ${server.name}`
                    );

                    continue;
                }

                const quality =
                    resolved.quality ||
                    "HD";

                const serverName =
                    resolved.serverName ||
                    server.name;

                const language =
                    languageLabel(
                        selected.language
                    );

                const streamUrl =
                    resolved.url;

                // ==========================================
                // STREAM DEDUPLICATION
                // ==========================================

                const duplicate =
                    streams.some(
                        stream =>
                            stream.url ===
                            streamUrl &&
                            stream.title ===
                            `${language} • ${serverName} • ${quality}`
                    );

                if (
                    duplicate
                ) {

                    continue;
                }

                streams.push({

                    name:
                        `Latanime • ${language} • ${serverName}`,

                    title:
                        `${language} • ${serverName} • ${quality}`,

                    quality,

                    url:
                        streamUrl,

                    verified:
                        resolved.verified === true,

                    headers:
                        resolved.headers ||
                        {},

                    behaviorHints:
                        resolved.behaviorHints ||
                        {
                            notWebReady: false
                        }
                });

                console.log(
                    `[Latanime] Stream added: ${language} / ${serverName} / ${quality}`
                );

            } catch (
                error
            ) {

                console.warn(
                    `[Latanime] Resolver failed for ${server.name}: ${error.message}`
                );
            }
        }
    }

    console.log(
        `[Latanime] Final streams: ${streams.length}`
    );

    return streams;
}


// ======================================================
// EXTRACT SERVERS
// ======================================================

function extractServers(
    html,
    pageUrl
) {

    const $ =
        cheerio.load(
            html
        );

    const servers =
        [];

    const seen =
        new Set();

    $("a.play-video[data-player]").each(
        (index, element) => {

            const encoded =
                $(element).attr(
                    "data-player"
                );

            if (
                !encoded
            ) {

                return;
            }

            const name =
                $(element)
                    .text()
                    .replace(
                        /\s+/g,
                        " "
                    )
                    .trim();

            const url =
                decodeBase64(
                    encoded
                );

            if (
                !url ||
                !/^https?:\/\//i.test(
                    url
                )
            ) {

                return;
            }

            const key =
                url
                    .trim()
                    .toLowerCase();

            if (
                seen.has(
                    key
                )
            ) {

                return;
            }

            seen.add(
                key
            );

            servers.push({

                name:
                    name ||
                    "Unknown",

                url:
                    url.trim(),

                pageUrl
            });
        }
    );

    return servers;
}


// ======================================================
// GET RESOLVER BY URL
// ======================================================

function getResolverByUrl(
    serverUrl
) {

    if (
        typeof serverUrl !==
        "string"
    ) {

        return null;
    }

    let hostname =
        "";

    try {

        hostname =
            new URL(
                serverUrl
            )
                .hostname
                .toLowerCase();

    } catch (
        error
    ) {

        return null;
    }

    // ==============================================
    // MP4UPLOAD
    // ==============================================

    if (
        hostname ===
        "mp4upload.com" ||
        hostname.endsWith(
            ".mp4upload.com"
        )
    ) {

        return getResolver(
            "mp4upload"
        );
    }

    // ==============================================
    // HEXLOAD
    // ==============================================

    if (
        hostname ===
        "hexload.com" ||
        hostname.endsWith(
            ".hexload.com"
        )
    ) {

        return getResolver(
            "hexload"
        );
    }

    return null;
}


// ======================================================
// BASE64
// ======================================================

function decodeBase64(
    value
) {

    try {

        let input =
            String(
                value || ""
            )
                .trim()
                .replace(
                    /\s+/g,
                    ""
                );

        if (
            !input
        ) {

            return null;
        }

        input =
            input
                .replace(
                    /-/g,
                    "+"
                )
                .replace(
                    /_/g,
                    "/"
                );

        while (
            input.length % 4 !==
            0
        ) {

            input += "=";
        }

        return (
            atob(
                input
            ) ||
            null
        );

    } catch (
        error
    ) {

        console.warn(
            `[Latanime] Base64 decode error: ${error.message}`
        );

        return null;
    }
}


// ======================================================
// SEARCH ALL TITLES
// ======================================================

async function searchLatanimeByAllTitles(
    media
) {

    const titles =
        [];

    addTitle(
        titles,
        media.title
    );

    addTitle(
        titles,
        media.originalTitle
    );

    if (
        Array.isArray(
            media.alternativeTitles
        )
    ) {

        for (
            const title of media.alternativeTitles
        ) {

            addTitle(
                titles,
                title
            );
        }
    }

    const searchTitles =
        expandSearchTitles(
            titles
        );

    console.log(
        `[Latanime] Search variants: ${searchTitles.length}`
    );

    const allResults =
        [];

    const seen =
        new Set();

    for (
        const title of searchTitles
    ) {

        try {

            const found =
                await searchLatanime(
                    title
                );

            console.log(
                `[Latanime] Results for "${title}": ${found.length}`
            );

            for (
                const result of found
            ) {

                if (
                    !result?.url
                ) {

                    continue;
                }

                if (
                    seen.has(
                        result.url
                    )
                ) {

                    continue;
                }

                seen.add(
                    result.url
                );

                allResults.push(
                    result
                );
            }

        } catch (
            error
        ) {

            console.warn(
                `[Latanime] Search failed for "${title}": ${error.message}`
            );
        }
    }

    // ==================================================
    // PARTIAL FALLBACK SEARCH
    // ==================================================

    if (
        allResults.length === 0
    ) {

        console.log(
            "[Latanime] No results with normal title searches. Trying partial searches..."
        );

        const partialTitles =
            buildPartialSearchTitles(
                titles
            );

        for (
            const title of partialTitles
        ) {

            try {

                console.log(
                    `[Latanime] Partial search: ${title}`
                );

                const found =
                    await searchLatanime(
                        title
                    );

                for (
                    const result of found
                ) {

                    if (
                        !result?.url
                    ) {

                        continue;
                    }

                    if (
                        seen.has(
                            result.url
                        )
                    ) {

                        continue;
                    }

                    seen.add(
                        result.url
                    );

                    allResults.push(
                        result
                    );
                }

            } catch (
                error
            ) {

                console.warn(
                    `[Latanime] Partial search failed for "${title}": ${error.message}`
                );
            }
        }
    }

    return allResults;
}


// ======================================================
// PARTIAL SEARCH TITLES
// ======================================================

function buildPartialSearchTitles(
    titles
) {

    const result =
        [];

    const seen =
        new Set();

    for (
        const title of titles
    ) {

        const normalized =
            String(
                title || ""
            )
                .replace(
                    /[–—_-]+/g,
                    " "
                )
                .replace(
                    /[,.;:()[\]]/g,
                    " "
                )
                .replace(
                    /\s+/g,
                    " "
                )
                .trim();

        if (
            !normalized
        ) {

            continue;
        }

        const words =
            normalized
                .split(
                    " "
                )
                .filter(
                    word =>
                        word.length >= 2
                );

        // Primeras 2 palabras
        if (
            words.length >= 2
        ) {

            addPartial(
                result,
                seen,
                words.slice(
                    0,
                    2
                ).join(
                    " "
                )
            );
        }

        // Primeras 3 palabras
        if (
            words.length >= 3
        ) {

            addPartial(
                result,
                seen,
                words.slice(
                    0,
                    3
                ).join(
                    " "
                )
            );
        }

        // Primera palabra distintiva
        if (
            words.length >= 1
        ) {

            const first =
                words[0];

            if (
                first.length >= 4
            ) {

                addPartial(
                    result,
                    seen,
                    first
                );
            }
        }

        // Últimas 3 palabras
        if (
            words.length >= 3
        ) {

            const tail =
                words.slice(
                    -3
                ).join(
                    " "
                );

            addPartial(
                result,
                seen,
                tail
            );
        }
    }

    return result;
}


function addPartial(
    result,
    seen,
    value
) {

    const clean =
        String(
            value || ""
        ).trim();

    if (
        !clean
    ) {

        return;
    }

    const key =
        normalizeTitle(
            clean
        );

    if (
        seen.has(
            key
        )
    ) {

        return;
    }

    seen.add(
        key
    );

    result.push(
        clean
    );
}


// ======================================================
// ADD TITLE
// ======================================================

function addTitle(
    titles,
    title
) {

    if (
        typeof title !==
        "string"
    ) {

        return;
    }

    const clean =
        title.trim();

    if (
        !clean
    ) {

        return;
    }

    const exists =
        titles.some(
            item =>
                normalizeTitle(
                    item
                ) ===
                normalizeTitle(
                    clean
                )
        );

    if (
        !exists
    ) {

        titles.push(
            clean
        );
    }
}


// ======================================================
// EXPAND SEARCH TITLES
// ======================================================

function expandSearchTitles(
    titles
) {

    const result =
        [];

    const seen =
        new Set();

    const add =
        title => {

            if (
                typeof title !==
                "string"
            ) {

                return;
            }

            const clean =
                title.trim();

            if (
                !clean
            ) {

                return;
            }

            const key =
                normalizeTitle(
                    clean
                );

            if (
                seen.has(
                    key
                )
            ) {

                return;
            }

            seen.add(
                key
            );

            result.push(
                clean
            );
        };

    for (
        const title of titles
    ) {

        add(
            title
        );

        const noDiacritics =
            title
                .normalize(
                    "NFD"
                )
                .replace(
                    /[\u0300-\u036f]/g,
                    ""
                );

        add(
            noDiacritics
        );

        const separated =
            noDiacritics
                .replace(
                    /[-–—_]+/g,
                    " "
                )
                .replace(
                    /\s+/g,
                    " "
                )
                .trim();

        add(
            separated
        );

        const compact =
            separated
                .replace(
                    /[^a-zA-Z0-9]+/g,
                    " "
                )
                .split(
                    /\s+/
                )
                .filter(
                    Boolean
                )
                .join(
                    ""
                );

        if (
            compact.length >= 4
        ) {

            add(
                compact
            );
        }

        const words =
            separated
                .split(
                    /\s+/
                )
                .filter(
                    Boolean
                );

        if (
            words.length > 1
        ) {

            add(
                words.join("")
            );
        }
    }

    return result;
}


// ======================================================
// SELECT RESULTS
// ======================================================

function selectResults(
    results,
    media,
    requestedSeason
) {

    let candidates =
        results;

    // ==================================================
    // SEASON FILTER
    // ==================================================

    if (
        requestedSeason !== null &&
        requestedSeason !== undefined
    ) {

        const targetSeason =
            Number(
                requestedSeason
            );

        const seasonResults =
            candidates.filter(
                result =>
                    Number(
                        result.season
                    ) ===
                    targetSeason
            );

        const unknownSeasonResults =
            candidates.filter(
                result =>
                    result.season === null ||
                    result.season === undefined
            );

        if (
            seasonResults.length > 0
        ) {

            candidates =
                seasonResults;

            console.log(
                `[Latanime] Season filter S${targetSeason}: ${seasonResults.length} result(s)`
            );

        } else if (
            unknownSeasonResults.length > 0
        ) {

            candidates =
                unknownSeasonResults;

            console.log(
                `[Latanime] No explicit S${targetSeason} result found; using ${unknownSeasonResults.length} result(s) with unknown season.`
            );

        } else {

            console.log(
                `[Latanime] No explicit S${targetSeason} result found.`
            );

            return [];
        }
    }

    // ==================================================
    // REMOVE STRONG AUXILIARY CONTENT
    // ==================================================

    const mainResults =
        candidates.filter(
            result =>
                !isStrongAuxiliaryResult(
                    result
                )
        );

    if (
        mainResults.length > 0
    ) {

        candidates =
            mainResults;
    }

    // ==================================================
    // TITLES
    // ==================================================

    const titles =
        [];

    addTitle(
        titles,
        media.title
    );

    addTitle(
        titles,
        media.originalTitle
    );

    if (
        Array.isArray(
            media.alternativeTitles
        )
    ) {

        for (
            const title of media.alternativeTitles
        ) {

            addTitle(
                titles,
                title
            );
        }
    }

    const normalizedTitles =
        titles.map(
            normalizeTitle
        );

    // ==================================================
    // SCORE
    // ==================================================

    const scored =
        candidates.map(
            result => {

                const cleanTitle =
                    cleanResultTitle(
                        result.title
                    );

                const normalizedResult =
                    normalizeTitle(
                        cleanTitle
                    );

                let score =
                    0;

                // ======================================
                // EXACT TITLE
                // ======================================

                if (
                    normalizedTitles.includes(
                        normalizedResult
                    )
                ) {

                    score += 100;
                }

                // ======================================
                // FLEXIBLE TITLE
                // ======================================

                for (
                    const title of normalizedTitles
                ) {

                    if (
                        !title
                    ) {

                        continue;
                    }

                    if (
                        normalizedResult.includes(
                            title
                        ) ||
                        title.includes(
                            normalizedResult
                        )
                    ) {

                        score += 50;
                    }

                    const resultWords =
                        new Set(
                            normalizedResult.split(
                                " "
                            )
                        );

                    const titleWords =
                        title.split(
                            " "
                        );

                    for (
                        const word of titleWords
                    ) {

                        if (
                            word.length >= 3 &&
                            resultWords.has(
                                word
                            )
                        ) {

                            score += 5;
                        }
                    }
                }

                // ======================================
                // YEAR
                // ======================================

                if (
                    media.year &&
                    result.year &&
                    Number(
                        media.year
                    ) ===
                    Number(
                        result.year
                    )
                ) {

                    score += 25;
                }

                // ======================================
                // LANGUAGE
                // ======================================

                if (
                    result.language ===
                    "latino"
                ) {

                    score += 10;

                } else if (
                    result.language ===
                    "castellano"
                ) {

                    score += 5;
                }

                // ======================================
                // NORMAL / SPECIAL
                // ======================================

                if (
                    isSpecialVariant(
                        result
                    )
                ) {

                    score -= 20;

                } else {

                    score += 10;
                }

                return {
                    result,
                    score
                };
            }
        );

    // ==================================================
    // LANGUAGE GROUPS
    // ==================================================

    const latino =
        scored
            .filter(
                item =>
                    normalizeLanguage(
                        item.result.language
                    ) ===
                    "latino"
            )
            .sort(
                (a, b) =>
                    b.score -
                    a.score
            );

    const castellano =
        scored
            .filter(
                item =>
                    normalizeLanguage(
                        item.result.language
                    ) ===
                    "castellano"
            )
            .sort(
                (a, b) =>
                    b.score -
                    a.score
            );

    const unknown =
        scored
            .filter(
                item =>
                    !normalizeLanguage(
                        item.result.language
                    )
            )
            .sort(
                (a, b) =>
                    b.score -
                    a.score
            );

    // ==================================================
    // SELECT LATINO
    // ==================================================

    const selected =
        [];

    if (
        latino.length > 0
    ) {

        selected.push(
            selectBestLanguageResult(
                latino
            )
        );
    }

    // ==================================================
    // SELECT CASTELLANO
    // ==================================================

    if (
        castellano.length > 0
    ) {

        selected.push(
            selectBestLanguageResult(
                castellano
            )
        );
    }

    // ==================================================
    // UNKNOWN LANGUAGE FALLBACK
    // ==================================================

    if (
        selected.length === 0 &&
        unknown.length > 0
    ) {

        selected.push(
            selectBestLanguageResult(
                unknown
            )
        );
    }

    console.log(
        "[Latanime] Resultados seleccionados:"
    );

    for (
        const result of selected
    ) {

        if (!result) {
            continue;
        }

        console.log(
            `  ${languageLabel(result.language)} → ${result.title} → ${result.url}`
        );
    }

    return selected.filter(
        Boolean
    );
}


// ======================================================
// SELECT BEST RESULT FOR LANGUAGE
// ======================================================

function selectBestLanguageResult(
    scoredResults
) {

    if (
        scoredResults.length === 0
    ) {

        return null;
    }

    // ==================================================
    // NORMAL VERSION FIRST
    // ==================================================

    const normal =
        scoredResults.filter(
            item =>
                !isSpecialVariant(
                    item.result
                )
        );

    if (
        normal.length > 0
    ) {

        return normal[0].result;
    }

    // ==================================================
    // SPECIAL FALLBACK
    // ==================================================

    return scoredResults[0].result;
}


// ======================================================
// STRONG AUXILIARY CONTENT
// ======================================================

function isStrongAuxiliaryResult(
    result
) {

    const title =
        String(
            result?.title || ""
        ).toLowerCase();

    const url =
        String(
            result?.url || ""
        ).toLowerCase();

    const text =
        `${title} ${url}`;

    const patterns = [

        "memory snow",

        "hyouketsu no kizuna",

        "break time",

        "pelicula",

        "película",

        "corto"
    ];

    return patterns.some(
        pattern =>
            text.includes(
                pattern
            )
    );
}


// ======================================================
// SPECIAL VARIANT
// ======================================================

function isSpecialVariant(
    result
) {

    const title =
        String(
            result?.title || ""
        ).toLowerCase();

    const url =
        String(
            result?.url || ""
        ).toLowerCase();

    const text =
        `${title} ${url}`;

    return (
        text.includes(
            "director's cut"
        ) ||
        text.includes(
            "directors cut"
        ) ||
        text.includes(
            "director cut"
        )
    );
}


// ======================================================
// LANGUAGE
// ======================================================

function normalizeLanguage(
    language
) {

    const value =
        String(
            language || ""
        )
            .toLowerCase()
            .trim();

    if (
        value.includes(
            "latino"
        )
    ) {

        return "latino";
    }

    if (
        value.includes(
            "castellano"
        )
    ) {

        return "castellano";
    }

    return null;
}


// ======================================================
// LANGUAGE LABEL
// ======================================================

function languageLabel(
    language
) {

    const normalized =
        normalizeLanguage(
            language
        );

    if (
        normalized ===
        "latino"
    ) {

        return "Latino";
    }

    if (
        normalized ===
        "castellano"
    ) {

        return "Castellano";
    }

    return "Audio";
}


// ======================================================
// CLEAN RESULT TITLE
// ======================================================

function cleanResultTitle(
    title
) {

    return String(
        title || ""
    )
        .replace(
            /\b(?:latino|castellano|subtitulado|sub)\b/gi,
            ""
        )
        .replace(
            /\bS\d+\b/gi,
            ""
        )
        .replace(
            /\btemporada\s+\d+\b/gi,
            ""
        )
        .replace(
            /\bdirector'?s?\s+cut\b/gi,
            ""
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();
}


// ======================================================
// NORMALIZE TITLE
// ======================================================

function normalizeTitle(
    title
) {

    if (
        typeof title !==
        "string"
    ) {

        return "";
    }

    return title
        .normalize(
            "NFD"
        )
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            " "
        )
        .trim();
}
