import { getMovie, getTv } from "./tmdb.js";
import { searchMovie, searchSeries } from "./search.js";
import { loadMovie } from "./movie.js";
import { fetchText } from "./http.js";
import { resolveEmbed69 } from "./embed69.js";
import { resolveVidhide } from "./resolvers/vidhide.js";
import { resolveStreamwish2 } from "./resolvers/streamwish2.js";
import { getEpisodeUrl } from "./series.js";

export async function extractStreams(
    tmdbId,
    mediaType,
    season,
    episode
) {

    console.log(
        `[PelisPlusHD] Searching TMDB ID: ${tmdbId}`
    );

    const media =
        await getMedia(
            tmdbId,
            mediaType
        );

    console.log(
        "[PelisPlusHD] TMDB:",
        media
    );

    const results =
        await searchPelisPlus(
            media,
            mediaType
        );

    if (
        results.length === 0
    ) {
        return [];
    }

    const selected =
        selectResult(
            results,
            media
        );

    const contentUrl =
        await getContentUrl(
            selected.url,
            mediaType,
            season,
            episode
        );

    if (!contentUrl) {
        return [];
    }

    console.log(
        `[PelisPlusHD] Selected: ${contentUrl}`
    );

    const html =
        await loadMovie(
            contentUrl
        );

    const streams = [];

    // ==================================================
    // EXTRAER VIDEO[...] DE LA PÁGINA
    // ==================================================

    const matches = [
        ...html.matchAll(
            /video\[\d+\]\s*=\s*['"]([^'"]+)['"]/g
        )
    ];

    console.log(
        `[PelisPlusHD] Video embeds encontrados: ${matches.length}`
    );

    for (
        const match of matches
    ) {

        const embedUrl =
            match[1];

        console.log(
            `[PelisPlusHD] Video URL: ${embedUrl}`
        );

        // ==============================================
        // EMBED69
        // ==============================================

        if (
            embedUrl.includes(
                "embed69.org"
            )
        ) {

            await processEmbed69(
                embedUrl,
                streams
            );

            continue;
        }

        // ==============================================
        // XUPALACE
        // ==============================================

        if (
            embedUrl.includes(
                "xupalace.org"
            )
        ) {

            await processXupalaсe(
                embedUrl,
                streams
            );

            continue;
        }

        console.log(
            `[DEBUG] Embed ignorado: ${embedUrl}`
        );
    }

    // ==================================================
    // ORDENAR RESULTADOS
    // ==================================================

    streams.sort(
        (a, b) => {

            const qualityA =
                getQualityNumber(
                    a.quality
                );

            const qualityB =
                getQualityNumber(
                    b.quality
                );

            if (
                qualityA !==
                qualityB
            ) {

                return (
                    qualityB -
                    qualityA
                );
            }

            const aIsStreamWish =
                String(
                    a.name
                )
                    .toLowerCase()
                    .includes(
                        "streamwish"
                    );

            const bIsStreamWish =
                String(
                    b.name
                )
                    .toLowerCase()
                    .includes(
                        "streamwish"
                    );

            if (
                aIsStreamWish !==
                bIsStreamWish
            ) {

                return aIsStreamWish
                    ? -1
                    : 1;
            }

            return 0;
        }
    );

    return streams;
}


// ======================================================
// EMBED69
// ======================================================

async function processEmbed69(
    embedUrl,
    streams
) {

    console.log(
        `[Embed69] Opening: ${embedUrl}`
    );

    let languages;

    try {

        languages =
            await resolveEmbed69(
                embedUrl
            );

    } catch (
        error
    ) {

        console.warn(
            `[Embed69] Error: ${error.message}`
        );

        return;
    }

    console.log(
        `[DEBUG] Idiomas encontrados: ${languages.length}`
    );

    for (
        const language of languages
    ) {

        if (
            !Array.isArray(
                language.sortedEmbeds
            )
        ) {

            console.log(
                `[DEBUG] ${language.video_language}: sin sortedEmbeds`
            );

            continue;
        }

        console.log(
            `[DEBUG] ${language.video_language}: ${language.sortedEmbeds.length} servidores`
        );

        for (
            const server of language.sortedEmbeds
        ) {

            if (
                !server?.link
            ) {
                continue;
            }

            console.log(
                `[DEBUG] Servidor: ${language.video_language} -> ${server.servername} -> ${server.link}`
            );

            await processKnownServer(
                server.servername,
                server.link,
                language.video_language,
                streams
            );
        }
    }
}


// ======================================================
// XUPALACE
// ======================================================

async function processXupalaсe(
    embedUrl,
    streams
) {

    console.log(
        `[Xupalaсe] Opening: ${embedUrl}`
    );

    let html;

    try {

        html =
            await fetchText(
                embedUrl
            );

    } catch (
        error
    ) {

        console.warn(
            `[Xupalaсe] Error: ${error.message}`
        );

        return;
    }

    console.log(
        `[Xupalaсe] HTML length: ${html.length}`
    );

    const servers =
        extractXupalaсeServers(
            html
        );

    console.log(
        `[Xupalaсe] Servidores encontrados: ${servers.length}`
    );

    for (
        const server of servers
    ) {

        console.log(
            `[Xupalaсe] ${server.name} -> ${server.url}`
        );

        await processKnownServer(
            server.name,
            server.url,
            "LAT",
            streams
        );
    }
}


// ======================================================
// EXTRAER SERVIDORES XUPALACE
// ======================================================

function extractXupalaсeServers(
    html
) {

    const servers =
        [];

    const seen =
        new Set();

    const liMatches =
        html.matchAll(
            /<li\b[^>]*>[\s\S]*?<\/li>/gi
        );

    for (
        const match of liMatches
    ) {

        const block =
            match[0];

        if (
            !block.includes(
                "go_to_playerVast"
            )
        ) {
            continue;
        }

        const urlMatch =
            block.match(
                /go_to_playerVast\(\s*['"]([^'"]+)['"]/i
            );

        if (
            !urlMatch
        ) {
            continue;
        }

        const nameMatch =
            block.match(
                /<span[^>]*>\s*([^<]+?)\s*<\/span>/i
            );

        if (
            !nameMatch
        ) {
            continue;
        }

        const name =
            nameMatch[1]
                .trim()
                .toLowerCase();

        const url =
            urlMatch[1]
                .trim();

        if (
            !url
        ) {
            continue;
        }

        const key =
            `${name}|${url}`;

        if (
            seen.has(
                key
            )
        ) {
            continue;
        }

        seen.add(
            key
        );

        servers.push({
            name,
            url
        });
    }

    return servers;
}


// ======================================================
// RESOLVERS CONOCIDOS
// ======================================================

async function processKnownServer(
    serverName,
    link,
    language,
    streams
) {

    const normalizedName =
        serverName
            ?.trim()
            .toLowerCase();

    if (
        !normalizedName ||
        !link
    ) {
        return;
    }

    console.log(
        `[DEBUG] serverName normalizado: "${normalizedName}"`
    );

    let variants =
        [];

    // ==============================================
    // VIDHIDE
    // ==============================================

    if (
        normalizedName ===
        "vidhide"
    ) {

        console.log(
            `[Vidhide] Resolving: ${link}`
        );

        try {

            variants =
                await resolveVidhide(
                    link
                );

        } catch (
            error
        ) {

            console.warn(
                `[Vidhide] Error: ${error.message}`
            );

            return;
        }
    }

    // ==============================================
    // STREAMWISH
    // ==============================================

    else if (
        normalizedName ===
        "streamwish"
    ) {

        console.log(
            `[StreamWish2] Resolving: ${link}`
        );

        try {

            variants =
                await resolveStreamwish2(
                    link
                );

        } catch (
            error
        ) {

            const message =
                error?.message ||
                String(error);

            console.warn(
                `[StreamWish2] Error: ${message}`
            );

            streams.push({
                name:
                    `StreamWish ERROR: ${message}`,

                title:
                    `StreamWish error: ${message}`,

                language:
                    language,

                quality:
                    "ERROR",

                url:
                    link
            });

            return;
        }
    }

    // ==============================================
    // OTROS
    // ==============================================

    else {

        console.log(
            `[DEBUG] Servidor ignorado: "${normalizedName}"`
        );

        return;
    }

    // ==============================================
    // AGREGAR VARIANTES
    // ==============================================

    if (
        !Array.isArray(
            variants
        )
    ) {
        return;
    }

    for (
        const variant of variants
    ) {

        if (
            !variant?.url
        ) {
            continue;
        }

        let displayName;

        if (
            normalizedName ===
            "streamwish"
        ) {

            displayName =
                "StreamWish \u2022 " +
                (
                    variant.quality ||
                    "auto"
                ) +
                " \u2705";

        } else if (
            normalizedName ===
            "vidhide"
        ) {

            displayName =
                "VidHide \u2022 " +
                (
                    variant.quality ||
                    "auto"
                ) +
                " \u2705";

        } else {

            displayName =
                normalizedName +
                " \u2022 " +
                (
                    variant.quality ||
                    "auto"
                ) +
                " \u2705";
        }

        const stream = {

            name:
                displayName,

            language:
                language,

            quality:
                variant.quality ||
                "auto",

            url:
                variant.url
        };

        if (
            variant.headers
        ) {

            stream.headers =
                variant.headers;
        }

        streams.push(
            stream
        );
    }
}


// ======================================================
// QUALITY NUMBER
// ======================================================

function getQualityNumber(
    quality
) {

    const match =
        String(
            quality
        ).match(
            /(\d+)p/i
        );

    if (
        !match
    ) {
        return 0;
    }

    return Number(
        match[1]
    );
}


// ======================================================
// MEDIA
// ======================================================

async function getMedia(
    tmdbId,
    mediaType
) {

    if (
        mediaType ===
        "movie"
    ) {

        return getMovie(
            tmdbId
        );
    }

    if (
        mediaType ===
        "tv"
    ) {

        return getTv(
            tmdbId
        );
    }

    throw new Error(
        `[PelisPlusHD] Unsupported media type: ${mediaType}`
    );
}


// ======================================================
// SEARCH PELISPLUS
// ======================================================

async function searchPelisPlus(
    media,
    mediaType
) {

    const search =
        mediaType ===
        "tv"
            ? searchSeries
            : searchMovie;

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
        `[PelisPlusHD] Search variants: ${searchTitles.length}`
    );

    for (
        const title of searchTitles
    ) {

        console.log(
            `[PelisPlusHD] Search candidate: ${title}`
        );
    }

    const allResults =
        [];

    const seen =
        new Set();

    for (
        const title of searchTitles
    ) {

        try {

            const results =
                await search(
                    title
                );

            console.log(
                `[PelisPlusHD] Results for "${title}": ${results.length}`
            );

            for (
                const result of results
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
                `[PelisPlusHD] Search failed for "${title}": ${error.message}`
            );
        }
    }

    return allResults;
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
                clean.toLowerCase();

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

        add(
            noDiacritics.replace(
                /[-–—_]+/g,
                " "
            )
        );

        add(
            noDiacritics
                .replace(
                    /[-–—_]+/g,
                    " "
                )
                .replace(
                    /\s+/g,
                    " "
                )
                .trim()
        );

        const compact =
            noDiacritics
                .replace(
                    /[^a-zA-Z0-9]+/g,
                    " "
                )
                .split(
                    /\s+/
                )
                .filter(Boolean)
                .join("");

        if (
            compact.length >=
            4
        ) {

            add(
                compact
            );
        }

        const words =
            noDiacritics
                .replace(
                    /[-–—_]+/g,
                    " "
                )
                .split(
                    /\s+/
                )
                .filter(Boolean);

        if (
            words.length >
            1
        ) {

            add(
                words.join("")
            );
        }
    }

    return result;
}


// ======================================================
// CONTENT URL
// ======================================================

async function getContentUrl(
    url,
    mediaType,
    season,
    episode
) {

    if (
        mediaType ===
        "movie"
    ) {

        return url;
    }

    if (
        !Number.isInteger(
            Number(season)
        ) ||
        !Number.isInteger(
            Number(episode)
        )
    ) {

        throw new Error(
            "[PelisPlusHD] A TV request requires season and episode numbers."
        );
    }

    const episodeUrl =
        await getEpisodeUrl(
            url,
            season,
            episode
        );

    if (
        !episodeUrl
    ) {

        console.warn(
            `[PelisPlusHD] Episode S${season}E${episode} was not found.`
        );
    }

    return episodeUrl;
}


// ======================================================
// SELECT RESULT
// ======================================================

function selectResult(
    results,
    media
) {

    const sameYear =
        media.year ===
        null
            ? []
            : results.filter(
                result =>
                    result.year ===
                    media.year
            );

    const candidates =
        sameYear.length >
        0
            ? sameYear
            : results;

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

    const exactMatch =
        candidates.find(
            result =>
                normalizedTitles.includes(
                    normalizeTitle(
                        result.title
                    )
                )
        );

    if (
        exactMatch
    ) {

        return exactMatch;
    }

    const flexibleMatch =
        candidates.find(
            result =>
                isSimilarTitle(
                    result.title,
                    titles
                )
        );

    return (
        flexibleMatch ||
        candidates[0]
    );
}


// ======================================================
// SIMILAR TITLE
// ======================================================

function isSimilarTitle(
    candidate,
    titles
) {

    const candidateNormalized =
        normalizeTitle(
            candidate
        );

    if (
        !candidateNormalized
    ) {

        return false;
    }

    for (
        const title of titles
    ) {

        const normalized =
            normalizeTitle(
                title
            );

        if (
            !normalized
        ) {
            continue;
        }

        if (
            normalized.includes(
                candidateNormalized
            ) ||
            candidateNormalized.includes(
                normalized
            )
        ) {

            return true;
        }

        const compactA =
            normalized.replace(
                /\s+/g,
                ""
            );

        const compactB =
            candidateNormalized.replace(
                /\s+/g,
                ""
            );

        if (
            compactA ===
            compactB
        ) {

            return true;
        }
    }

    return false;
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