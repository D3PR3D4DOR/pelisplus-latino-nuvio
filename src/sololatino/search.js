import {
    BASE_URL,
    fetchText
} from "./http.js";


// ==========================================================
// BUSCAR EN SOLOLATINO
// ==========================================================

export async function searchSoloLatino(
    media
) {

    const titleQueries =
        buildTitleQueries(
            media
        );

    console.log(
        `[SoloLatino] Title queries: ${titleQueries.length}`
    );

    console.log(
        "[SoloLatino] Searching ALL language titles..."
    );

    const allResults = [];

    // ======================================================
    // FASE 1
    // BUSCAR TODOS LOS TÍTULOS DE TODOS LOS IDIOMAS
    // ======================================================

    for (
        const query of
        titleQueries
    ) {

        console.log(
            "[SoloLatino] Searching title:",
            query
        );

        try {

            const results =
                await searchByQuery(
                    query
                );

            allResults.push(
                ...results
            );

        } catch (
            error
        ) {

            console.warn(
                `[SoloLatino] Search failed for "${query}":`,
                error.message
            );
        }
    }

    let unique =
        deduplicateResults(
            allResults
        );

    console.log(
        `[SoloLatino] Results after language search: ${unique.length}`
    );

    // ======================================================
    // COMPROBAR SI TENEMOS MATCH
    // ======================================================

    const strong =
        findStrongMatch(
            unique,
            media
        );

    if (
        strong
    ) {

        console.log(
            "[SoloLatino] Language search found:",
            strong.title
        );

        return unique;
    }

    // ======================================================
    // FASE 2
    // VARIANTES ADICIONALES
    // ======================================================

    const variantQueries =
        buildVariantQueries(
            media,
            titleQueries
        );

    console.log(
        `[SoloLatino] Additional variants: ${variantQueries.length}`
    );

    for (
        const query of
        variantQueries
    ) {

        console.log(
            "[SoloLatino] Searching variant:",
            query
        );

        try {

            const results =
                await searchByQuery(
                    query
                );

            allResults.push(
                ...results
            );

            unique =
                deduplicateResults(
                    allResults
                );

            const match =
                findStrongMatch(
                    unique,
                    media
                );

            if (
                match
            ) {

                console.log(
                    "[SoloLatino] Variant found:",
                    match.title
                );

                /*
                 * Acá sí paramos:
                 *
                 * ya buscamos TODOS los idiomas
                 * y las variantes solamente eran
                 * un fallback.
                 */

                return unique;
            }

        } catch (
            error
        ) {

            console.warn(
                `[SoloLatino] Variant failed for "${query}":`,
                error.message
            );
        }
    }

    return unique;
}


// ==========================================================
// TÍTULOS DE TODOS LOS IDIOMAS
// ==========================================================

function buildTitleQueries(
    media
) {

    const queries = [];

    // ------------------------------------------------------
    // Título principal
    // ------------------------------------------------------

    addQuery(
        queries,
        media?.title
    );

    // ------------------------------------------------------
    // Título original
    // ------------------------------------------------------

    addQuery(
        queries,
        media?.originalTitle
    );

    // ------------------------------------------------------
    // TODAS las traducciones
    // ------------------------------------------------------

    if (
        Array.isArray(
            media?.translationTitles
        )
    ) {

        for (
            const translation of
            media.translationTitles
        ) {

            const title =
                typeof translation === "string"
                    ? translation
                    : translation?.title;

            addQuery(
                queries,
                title
            );
        }
    }

    // ------------------------------------------------------
    // Títulos alternativos
    // ------------------------------------------------------

    if (
        Array.isArray(
            media?.alternativeTitles
        )
    ) {

        for (
            const alternative of
            media.alternativeTitles
        ) {

            const title =
                typeof alternative === "string"
                    ? alternative
                    : alternative?.title;

            addQuery(
                queries,
                title
            );
        }
    }

    return queries;
}


// ==========================================================
// VARIANTES
// ==========================================================

function buildVariantQueries(
    media,
    originalQueries
) {

    const variants = [];

    for (
        const title of
        originalQueries
    ) {

        // --------------------------------------------------
        // Sin acentos
        // --------------------------------------------------

        addVariant(
            variants,
            removeAccents(
                title
            )
        );

        // --------------------------------------------------
        // Guiones → espacios
        // --------------------------------------------------

        if (
            /[-_]/.test(
                title
            )
        ) {

            addVariant(
                variants,
                title.replace(
                    /[-_]+/g,
                    " "
                )
            );
        }

        // --------------------------------------------------
        // Espacios → nada
        // --------------------------------------------------

        if (
            /\s/.test(
                title
            )
        ) {

            addVariant(
                variants,
                title.replace(
                    /\s+/g,
                    ""
                )
            );
        }

        // --------------------------------------------------
        // Sin acentos + espacios → nada
        // --------------------------------------------------

        const clean =
            removeAccents(
                title
            );

        if (
            /\s/.test(
                clean
            )
        ) {

            addVariant(
                variants,
                clean.replace(
                    /\s+/g,
                    ""
                )
            );
        }

        // --------------------------------------------------
        // Puntuación → espacio
        // --------------------------------------------------

        if (
            /[^\p{L}\p{N}\s]/u.test(
                title
            )
        ) {

            addVariant(
                variants,
                title.replace(
                    /[^\p{L}\p{N}]+/gu,
                    " "
                )
            );
        }
    }

    return variants;
}


// ==========================================================
// AÑADIR QUERY
// ==========================================================

function addQuery(
    queries,
    value
) {

    if (
        typeof value !== "string"
    ) {

        return;
    }

    const query =
        value
            .trim();

    if (
        !query
    ) {

        return;
    }

    const normalized =
        normalizeSearchValue(
            query
        );

    if (
        !normalized
    ) {

        return;
    }

    if (
        queries.some(
            existing =>
                normalizeSearchValue(
                    existing
                ) === normalized
        )
    ) {

        return;
    }

    queries.push(
        query
    );
}


// ==========================================================
// AÑADIR VARIANTE
// ==========================================================

function addVariant(
    variants,
    value
) {

    if (
        typeof value !== "string"
    ) {

        return;
    }

    const variant =
        value
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    if (
        !variant
    ) {

        return;
    }

    const normalized =
        normalizeSearchValue(
            variant
        );

    if (
        !normalized
    ) {

        return;
    }

    if (
        variants.some(
            existing =>
                normalizeSearchValue(
                    existing
                ) === normalized
        )
    ) {

        return;
    }

    variants.push(
        variant
    );
}


// ==========================================================
// BÚSQUEDA INDIVIDUAL
// ==========================================================

async function searchByQuery(
    query
) {

    const url =
        `${BASE_URL}/buscar?q=` +
        encodeURIComponent(
            query
        );

    const html =
        await fetchText(
            url
        );

    const results = [];

    const regex =
        /href=["']([^"']*\/(pelicula|serie)\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

    let match;

    while (
        (
            match =
                regex.exec(
                    html
                )
        )
    ) {

        const rawUrl =
            match[1];

        const type =
            match[2]
                .toLowerCase();

        const rawTitle =
            match[3]
                .replace(
                    /<[^>]+>/g,
                    " "
                )
                .replace(
                    /\s+/g,
                    " "
                )
                .trim();

        if (
            !rawTitle
        ) {

            continue;
        }

        const url =
            new URL(
                rawUrl,
                BASE_URL
            ).href;

        results.push({

            title:
                cleanResultTitle(
                    rawTitle
                ),

            rawTitle,

            year:
                extractYear(
                    rawTitle
                ),

            type,

            url,

            slug:
                getSlug(
                    url
                )
        });
    }

    console.log(
        `[SoloLatino] Results for "${query}": ${results.length}`
    );

    return results;
}


// ==========================================================
// MATCH FUERTE
// ==========================================================

function findStrongMatch(
    results,
    media
) {

    if (
        !Array.isArray(
            results
        )
    ) {

        return null;
    }

    const wantedTitles = [
        media?.title,
        media?.originalTitle,

        ...(Array.isArray(
            media?.translationTitles
        )
            ? media.translationTitles.map(
                item =>
                    typeof item === "string"
                        ? item
                        : item?.title
            )
            : []),

        ...(Array.isArray(
            media?.alternativeTitles
        )
            ? media.alternativeTitles.map(
                item =>
                    typeof item === "string"
                        ? item
                        : item?.title
            )
            : [])
    ]
        .filter(Boolean)
        .map(
            normalizeTitle
        )
        .filter(Boolean);

    const wantedType =
        media?.mediaType === "movie"
            ? "pelicula"
            : "serie";

    for (
        const result of
        results
    ) {

        if (
            result.type !==
            wantedType
        ) {

            continue;
        }

        if (
            media?.year &&
            result.year &&
            result.year !==
                media.year
        ) {

            continue;
        }

        const resultTitle =
            normalizeTitle(
                result.title
            );

        const slug =
            normalizeTitle(
                result.slug ||
                ""
            );

        for (
            const wanted of
            wantedTitles
        ) {

            if (
                resultTitle === wanted ||
                slug === wanted
            ) {

                return result;
            }
        }
    }

    return null;
}


// ==========================================================
// SELECCIONAR RESULTADO
// ==========================================================

export function selectResult(
    results,
    media,
    mediaType
) {

    const wantedTitles = [
        media?.title,
        media?.originalTitle,

        ...(Array.isArray(
            media?.translationTitles
        )
            ? media.translationTitles.map(
                item =>
                    typeof item === "string"
                        ? item
                        : item?.title
            )
            : []),

        ...(Array.isArray(
            media?.alternativeTitles
        )
            ? media.alternativeTitles.map(
                item =>
                    typeof item === "string"
                        ? item
                        : item?.title
            )
            : [])
    ]
        .filter(Boolean)
        .map(
            normalizeTitle
        )
        .filter(Boolean)
        .filter(
            (value, index, array) =>
                array.indexOf(
                    value
                ) === index
        );

    const wantedType =
        mediaType === "movie"
            ? "pelicula"
            : "serie";

    // ======================================================
    // TIPO + AÑO
    // ======================================================

    let candidates =
        results.filter(
            result =>
                result.type ===
                    wantedType &&
                (
                    !media?.year ||
                    result.year ===
                        media.year
                )
        );

    // ======================================================
    // TIPO
    // ======================================================

    if (
        candidates.length === 0
    ) {

        candidates =
            results.filter(
                result =>
                    result.type ===
                    wantedType
            );
    }

    // ======================================================
    // AÑO
    // ======================================================

    if (
        candidates.length === 0
    ) {

        candidates =
            results.filter(
                result =>
                    !media?.year ||
                    result.year ===
                        media.year
            );
    }

    // ======================================================
    // TODOS
    // ======================================================

    if (
        candidates.length === 0
    ) {

        candidates =
            results;
    }

    // ======================================================
    // EXACTO
    // ======================================================

    for (
        const result of
        candidates
    ) {

        const resultTitle =
            normalizeTitle(
                result.title
            );

        for (
            const wanted of
            wantedTitles
        ) {

            if (
                resultTitle ===
                wanted
            ) {

                console.log(
                    "[SoloLatino] Match exacto:",
                    result.title
                );

                return result;
            }
        }
    }

    // ======================================================
    // TÍTULO CONTENIDO
    // ======================================================

    for (
        const result of
        candidates
    ) {

        const resultTitle =
            normalizeTitle(
                result.title
            );

        for (
            const wanted of
            wantedTitles
        ) {

            if (
                resultTitle.includes(
                    wanted
                ) ||
                wanted.includes(
                    resultTitle
                )
            ) {

                console.log(
                    "[SoloLatino] Match por título:",
                    result.title
                );

                return result;
            }
        }
    }

    // ======================================================
    // SLUG
    // ======================================================

    for (
        const result of
        candidates
    ) {

        const slug =
            normalizeTitle(
                result.slug ||
                getSlug(
                    result.url
                )
            );

        for (
            const wanted of
            wantedTitles
        ) {

            if (
                slug === wanted ||
                slug.includes(
                    wanted
                ) ||
                wanted.includes(
                    slug
                )
            ) {

                console.log(
                    "[SoloLatino] Match por slug:",
                    result.title
                );

                return result;
            }
        }
    }

    // ======================================================
    // TOKENS
    // ======================================================

    for (
        const result of
        candidates
    ) {

        const resultTokens =
            new Set(
                normalizeTitle(
                    result.title
                )
                    .split(/\s+/)
                    .filter(
                        token =>
                            token.length >= 2 &&
                            !STOP_WORDS.has(
                                token
                            )
                    )
            );

        for (
            const wanted of
            wantedTitles
        ) {

            const wantedTokens =
                wanted
                    .split(/\s+/)
                    .filter(
                        token =>
                            token.length >= 2 &&
                            !STOP_WORDS.has(
                                token
                            )
                    );

            if (
                wantedTokens.length === 0
            ) {

                continue;
            }

            let matches =
                0;

            for (
                const token of
                wantedTokens
            ) {

                if (
                    resultTokens.has(
                        token
                    )
                ) {

                    matches++;
                }
            }

            const ratio =
                matches /
                wantedTokens.length;

            if (
                ratio >= 0.6
            ) {

                console.log(
                    "[SoloLatino] Match por tokens:",
                    result.title
                );

                return result;
            }
        }
    }

    console.log(
        "[SoloLatino] No matching result"
    );

    return null;
}


// ==========================================================
// NORMALIZAR TÍTULO
// ==========================================================

export function normalizeTitle(
    value
) {

    return String(
        value || ""
    )
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
        .replace(
            /\s+/g,
            " "
        )
        .trim();
}


// ==========================================================
// NORMALIZAR QUERY
// ==========================================================

function normalizeSearchValue(
    value
) {

    return String(
        value || ""
    )
        .normalize(
            "NFD"
        )
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .replace(
            /\s+/g,
            " "
        )
        .trim();
}


// ==========================================================
// QUITAR ACENTOS
// ==========================================================

function removeAccents(
    value
) {

    return String(
        value || ""
    )
        .normalize(
            "NFD"
        )
        .replace(
            /[\u0300-\u036f]/g,
            ""
        );
}


// ==========================================================
// LIMPIAR TÍTULO
// ==========================================================

function cleanResultTitle(
    value
) {

    return String(
        value || ""
    )
        .replace(
            /^\s*(pel[ií]cula|serie|anime|dibujos?)\s*★?\s*\d+(?:\.\d+)?\s*/i,
            ""
        )
        .replace(
            /\b(19|20)\d{2}\b/g,
            " "
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();
}


// ==========================================================
// EXTRAER AÑO
// ==========================================================

function extractYear(
    value
) {

    const match =
        String(
            value || ""
        ).match(
            /\b(19|20)\d{2}\b/
        );

    return match
        ? Number(
            match[0]
        )
        : null;
}


// ==========================================================
// SLUG
// ==========================================================

function getSlug(
    url
) {

    try {

        const parsed =
            new URL(
                url
            );

        const parts =
            parsed.pathname
                .split("/")
                .filter(Boolean);

        return parts.length
            ? parts[
                parts.length - 1
            ]
            : "";

    } catch {

        return "";
    }
}


// ==========================================================
// DEDUPLICAR RESULTADOS
// ==========================================================

function deduplicateResults(
    results
) {

    const seen =
        new Set();

    return results.filter(
        result => {

            if (
                !result?.url
            ) {

                return false;
            }

            if (
                seen.has(
                    result.url
                )
            ) {

                return false;
            }

            seen.add(
                result.url
            );

            return true;
        }
    );
}


// ==========================================================
// PALABRAS IGNORADAS
// ==========================================================

const STOP_WORDS =
    new Set([
        "the",
        "a",
        "an",
        "of",
        "and",
        "el",
        "la",
        "los",
        "las",
        "un",
        "una",
        "de",
        "del",
        "y"
    ]);
