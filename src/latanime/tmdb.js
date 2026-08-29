import { fetchJson } from "./http.js";

const TMDB_API_KEY =
    "439c478a771f35c05022f9feabcca01c";

const TMDB_BASE_URL =
    "https://api.themoviedb.org/3";

export async function getMovie(
    tmdbId
) {

    const data =
        await fetchJson(
            `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=es-ES`
        );

    const alternative =
        await getAlternativeTitles(
            "movie",
            tmdbId
        );

    return {
        title:
            data.title,

        originalTitle:
            data.original_title,

        year:
            getYear(
                data.release_date
            ),

        alternativeTitles:
            alternative
    };
}


export async function getTv(
    tmdbId
) {

    const data =
        await fetchJson(
            `${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=es-ES`
        );

    const alternative =
        await getAlternativeTitles(
            "tv",
            tmdbId
        );

    return {
        title:
            data.name,

        originalTitle:
            data.original_name,

        year:
            getYear(
                data.first_air_date
            ),

        alternativeTitles:
            alternative
    };
}


// ======================================================
// ALTERNATIVE TITLES
// ======================================================

async function getAlternativeTitles(
    type,
    tmdbId
) {

    try {

        const data =
            await fetchJson(
                `${TMDB_BASE_URL}/${type}/${tmdbId}/alternative_titles?api_key=${TMDB_API_KEY}`
            );

        const titles =
            [];

        // ==============================================
        // TV
        // ==============================================

        if (
            type === "tv" &&
            Array.isArray(
                data.results
            )
        ) {

            for (
                const item of data.results
            ) {

                if (
                    item?.title
                ) {

                    titles.push(
                        item.title
                    );
                }

                if (
                    item?.name
                ) {

                    titles.push(
                        item.name
                    );
                }
            }
        }

        // ==============================================
        // MOVIE
        // ==============================================

        if (
            type === "movie" &&
            Array.isArray(
                data.titles
            )
        ) {

            for (
                const item of data.titles
            ) {

                if (
                    item?.title
                ) {

                    titles.push(
                        item.title
                    );
                }
            }
        }

        return uniqueTitles(
            titles
        );

    } catch (
        error
    ) {

        console.warn(
            `[TMDB] No se pudieron obtener títulos alternativos: ${error.message}`
        );

        return [];
    }
}


// ======================================================
// UNIQUE
// ======================================================

function uniqueTitles(
    titles
) {

    const seen =
        new Set();

    const result =
        [];

    for (
        const title of titles
    ) {

        if (
            typeof title !==
            "string"
        ) {
            continue;
        }

        const clean =
            title.trim();

        if (
            !clean
        ) {
            continue;
        }

        const key =
            clean.toLowerCase();

        if (
            seen.has(key)
        ) {
            continue;
        }

        seen.add(
            key
        );

        result.push(
            clean
        );
    }

    return result;
}


// ======================================================
// YEAR
// ======================================================

function getYear(
    date
) {

    const match =
        typeof date === "string"
            ? date.match(
                /^\d{4}/
            )
            : null;

    return match
        ? Number(match[0])
        : null;
}
