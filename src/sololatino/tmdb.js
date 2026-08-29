import {
    fetchJson
} from "./http.js";

const TMDB_API_KEY =
    "c9755d2e8df3a75213cae8e91c03e743";

const TMDB_BASE =
    "https://api.themoviedb.org/3";


// ==========================================================
// OBTENER PELÍCULA
// ==========================================================

export async function getMovie(
    tmdbId
) {

    const url =
        `${TMDB_BASE}/movie/${tmdbId}` +
        `?api_key=${TMDB_API_KEY}` +
        `&language=es-ES`;

    const data =
        await fetchJson(
            url
        );

    const translations =
        await getTranslations(
            tmdbId,
            "movie"
        );

    return {

        id:
            tmdbId,

        mediaType:
            "movie",

        title:
            data.title || "",

        originalTitle:
            data.original_title || "",

        year:
            getYear(
                data.release_date
            ),

        releaseDate:
            data.release_date || null,

        translationTitles:
            translations
    };
}


// ==========================================================
// OBTENER SERIE
// ==========================================================

export async function getTv(
    tmdbId
) {

    const url =
        `${TMDB_BASE}/tv/${tmdbId}` +
        `?api_key=${TMDB_API_KEY}` +
        `&language=es-ES`;

    const data =
        await fetchJson(
            url
        );

    const translations =
        await getTranslations(
            tmdbId,
            "tv"
        );

    return {

        id:
            tmdbId,

        mediaType:
            "tv",

        title:
            data.name || "",

        originalTitle:
            data.original_name || "",

        year:
            getYear(
                data.first_air_date
            ),

        releaseDate:
            data.first_air_date || null,

        translationTitles:
            translations
    };
}


// ==========================================================
// OBTENER TODOS LOS TÍTULOS TRADUCIDOS
// ==========================================================

async function getTranslations(
    tmdbId,
    mediaType
) {

    const type =
        mediaType === "movie"
            ? "movie"
            : "tv";

    const url =
        `${TMDB_BASE}/${type}/${tmdbId}/translations` +
        `?api_key=${TMDB_API_KEY}`;

    try {

        const data =
            await fetchJson(
                url
            );

        if (
            !Array.isArray(
                data?.translations
            )
        ) {

            return [];
        }

        const titles = [];

        for (
            const translation of
            data.translations
        ) {

            const value =
                mediaType === "movie"
                    ? translation?.data?.title
                    : translation?.data?.name;

            if (
                typeof value !== "string"
            ) {

                continue;
            }

            const title =
                value.trim();

            if (
                !title
            ) {

                continue;
            }

            titles.push({

                title,

                language:
                    translation?.iso_639_1 ||
                    null,

                country:
                    translation?.iso_3166_1 ||
                    null
            });
        }

        // --------------------------------------------------
        // Eliminar títulos repetidos
        // --------------------------------------------------

        const seen =
            new Set();

        const unique = [];

        for (
            const item of
            titles
        ) {

            const key =
                item.title
                    .trim()
                    .toLowerCase();

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

            unique.push(
                item
            );
        }

        console.log(
            `[TMDB] Traducciones encontradas: ${unique.length}`
        );

        return unique;

    } catch (
        error
    ) {

        console.warn(
            "[TMDB] No se pudieron obtener traducciones:",
            error.message
        );

        return [];
    }
}


// ==========================================================
// INFORMACIÓN COMPLETA
// ==========================================================

export async function getMediaInfo(
    tmdbId,
    mediaType
) {

    const media =
        mediaType === "movie"
            ? await getMovie(
                tmdbId
            )
            : await getTv(
                tmdbId
            );

    return media;
}


// ==========================================================
// YEAR
// ==========================================================

function getYear(
    date
) {

    if (
        !date ||
        typeof date !== "string"
    ) {

        return null;
    }

    const year =
        Number(
            date.slice(
                0,
                4
            )
        );

    return Number.isInteger(
        year
    )
        ? year
        : null;
}
