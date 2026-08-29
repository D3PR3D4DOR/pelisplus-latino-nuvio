import {
    fetchText
} from "./http.js";


// ==========================================================
// OBTENER URL DE EPISODIO
// ==========================================================

export async function getEpisodeUrl(
    seriesUrl,
    season,
    episode
) {

    if (
        !seriesUrl ||
        !Number.isInteger(
            Number(season)
        ) ||
        !Number.isInteger(
            Number(episode)
        )
    ) {

        return null;
    }

    const seasonNumber =
        Number(season);

    const episodeNumber =
        Number(episode);

    console.log(
        `[SoloLatino] Buscando S${seasonNumber}E${episodeNumber}:`,
        seriesUrl
    );

    const html =
        await fetchText(
            seriesUrl,
            {
                headers: {
                    "Accept":
                        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

                    "Referer":
                        "https://sololatino.net/"
                }
            }
        );

    // ------------------------------------------------------
    // MÉTODO 1:
    // Buscar directamente:
    //
    // /temporada-1/episodio-1
    // ------------------------------------------------------

    const directPath =
        `/temporada-${seasonNumber}/episodio-${episodeNumber}`;

    const directRegex =
        new RegExp(
            `href=["']([^"']*${escapeRegExp(directPath)}[^"']*)["']`,
            "i"
        );

    const directMatch =
        html.match(
            directRegex
        );

    if (
        directMatch
    ) {

        const url =
            new URL(
                decodeHtml(
                    directMatch[1]
                ),
                seriesUrl
            ).href;

        console.log(
            "[SoloLatino] Episode encontrado:",
            url
        );

        return url;
    }

    // ------------------------------------------------------
    // MÉTODO 2:
    // Buscar cualquier enlace que tenga:
    //
    // temporada-X/episodio-Y
    // ------------------------------------------------------

    const genericRegex =
        /href=["']([^"']*\/temporada-\d+\/episodio-\d+[^"']*)["']/gi;

    let match;

    while (
        (match =
            genericRegex.exec(
                html
            ))
    ) {

        const href =
            decodeHtml(
                match[1]
            );

        const normalized =
            href
                .replace(
                    /\\/g,
                    "/"
                );

        const expected =
            `temporada-${seasonNumber}/episodio-${episodeNumber}`;

        if (
            normalized
                .toLowerCase()
                .includes(
                    expected.toLowerCase()
                )
        ) {

            const url =
                new URL(
                    normalized,
                    seriesUrl
                ).href;

            console.log(
                "[SoloLatino] Episode encontrado:",
                url
            );

            return url;
        }
    }

    // ------------------------------------------------------
    // MÉTODO 3:
    // JSON-LD
    //
    // La página puede contener información como:
    // episodeNumber
    // seasonNumber
    // partOfSeries
    // ------------------------------------------------------

    const jsonLdBlocks =
        extractJsonLd(
            html
        );

    for (
        const data of
        jsonLdBlocks
    ) {

        const found =
            findEpisodeInJsonLd(
                data,
                seasonNumber,
                episodeNumber
            );

        if (
            found
        ) {

            const url =
                new URL(
                    found,
                    seriesUrl
                ).href;

            console.log(
                "[SoloLatino] Episode JSON-LD:",
                url
            );

            return url;
        }
    }

    console.log(
        `[SoloLatino] No se encontró S${seasonNumber}E${episodeNumber}`
    );

    return null;
}


// ==========================================================
// EXTRAER JSON-LD
// ==========================================================

function extractJsonLd(
    html
) {

    const blocks = [];

    const regex =
        /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

    let match;

    while (
        (match =
            regex.exec(
                html
            ))
    ) {

        const text =
            match[1].trim();

        if (
            !text
        ) {
            continue;
        }

        try {

            blocks.push(
                JSON.parse(
                    text
                )
            );

        } catch {

            // Algunos JSON-LD pueden estar
            // incompletos o mal formados.
        }
    }

    return blocks;
}


// ==========================================================
// BUSCAR EPISODIO EN JSON-LD
// ==========================================================

function findEpisodeInJsonLd(
    data,
    season,
    episode
) {

    if (
        Array.isArray(
            data
        )
    ) {

        for (
            const item of
            data
        ) {

            const result =
                findEpisodeInJsonLd(
                    item,
                    season,
                    episode
                );

            if (
                result
            ) {

                return result;
            }
        }

        return null;
    }

    if (
        !data ||
        typeof data !== "object"
    ) {

        return null;
    }

    const seasonNumber =
        Number(
            data.seasonNumber
        );

    const episodeNumber =
        Number(
            data.episodeNumber
        );

    if (
        seasonNumber === season &&
        episodeNumber === episode
    ) {

        if (
            data.url
        ) {

            return data.url;
        }

        if (
            data.mainEntityOfPage
        ) {

            if (
                typeof data.mainEntityOfPage ===
                "string"
            ) {

                return data.mainEntityOfPage;
            }

            if (
                data.mainEntityOfPage.url
            ) {

                return data.mainEntityOfPage.url;
            }
        }
    }

    // ------------------------------------------------------
    // Buscar recursivamente en propiedades
    // ------------------------------------------------------

    for (
        const value of
        Object.values(
            data
        )
    ) {

        if (
            value &&
            typeof value === "object"
        ) {

            const result =
                findEpisodeInJsonLd(
                    value,
                    season,
                    episode
                );

            if (
                result
            ) {

                return result;
            }
        }
    }

    return null;
}


// ==========================================================
// DECODE HTML
// ==========================================================

function decodeHtml(
    value
) {

    return String(
        value || ""
    )
        .replace(
            /&amp;/gi,
            "&"
        )
        .replace(
            /&quot;/gi,
            '"'
        )
        .replace(
            /&#39;/gi,
            "'"
        )
        .replace(
            /&lt;/gi,
            "<"
        )
        .replace(
            /&gt;/gi,
            ">"
        )
        .replace(
            /&#x2F;/gi,
            "/"
        )
        .replace(
            /&#47;/gi,
            "/"
        );
}


// ==========================================================
// ESCAPE REGEX
// ==========================================================

function escapeRegExp(
    value
) {

    return String(
        value
    ).replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
}
