import { fetchText } from "./http.js";
import cheerio from "cheerio-without-node-native";

const BASE_URL =
    "https://latanime.org";

export async function searchLatanime(
    query
) {

    if (
        !query ||
        typeof query !== "string"
    ) {

        return [];
    }

    const url =
        `${BASE_URL}/buscar?q=${encodeURIComponent(query)}`;

    console.log(
        `[Latanime] Searching: ${url}`
    );

    const html =
        await fetchText(
            url
        );

    const $ =
        cheerio.load(
            html
        );

    const results =
        [];

    $("a[href*='/anime/']").each(
        (index, element) => {

            const href =
                $(element).attr(
                    "href"
                );

            if (
                !href
            ) {

                return;
            }

            const absoluteUrl =
                href.startsWith("http")
                    ? href
                    : `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`;

            if (
                !absoluteUrl.includes(
                    "/anime/"
                )
            ) {

                return;
            }

            // ==========================================
            // TÍTULO REAL
            // ==========================================

            const titleElement =
                $(element).find(
                    "h3"
                ).first();

            const title =
                (
                    titleElement.length
                        ? titleElement.text()
                        : $(element).text()
                )
                    .replace(
                        /\s+/g,
                        " "
                    )
                    .trim();

            if (
                !title
            ) {

                return;
            }

            // ==========================================
            // TEMPORADA
            // ==========================================

            const fullText =
                $(element)
                    .text()
                    .replace(
                        /\s+/g,
                        " "
                    )
                    .trim();

            let season =
                null;

            const seasonPatterns = [

                /\bS(\d{1,2})\b/i,

                /\bS(\d{1,2})E\d+\b/i,

                /\bSeason\s*(\d{1,2})\b/i,

                /\bTemporada\s*(\d{1,2})\b/i,

                /\/s(\d{1,2})[-_]/i,

                /-s(\d{1,2})-/i
            ];

            for (
                const pattern of seasonPatterns
            ) {

                const match =
                    title.match(
                        pattern
                    ) ||
                    absoluteUrl.match(
                        pattern
                    ) ||
                    fullText.match(
                        pattern
                    );

                if (
                    match &&
                    match[1]
                ) {

                    season =
                        Number(
                            match[1]
                        );

                    break;
                }
            }

            // ==========================================
            // AÑO
            // ==========================================

            let year =
                null;

            const yearMatch =
                fullText.match(
                    /\b(19|20)\d{2}\b/
                );

            if (
                yearMatch
            ) {

                year =
                    Number(
                        yearMatch[0]
                    );
            }

            // ==========================================
            // IDIOMA
            // ==========================================

            let language =
                null;

            const lowerText =
                fullText.toLowerCase();

            if (
                lowerText.includes(
                    "latino"
                )
            ) {

                language =
                    "latino";

            } else if (
                lowerText.includes(
                    "castellano"
                )
            ) {

                language =
                    "castellano";

            } else if (
                lowerText.includes(
                    "subtitulado"
                ) ||
                lowerText.includes(
                    "sub"
                )
            ) {

                language =
                    "sub";
            }

            results.push({
                title,
                year,
                season,
                language,
                url:
                    absoluteUrl
            });
        }
    );

    // ==============================================
    // UNIQUE BY URL
    // ==============================================

    const seen =
        new Set();

    const uniqueResults =
        results.filter(
            result => {

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

    console.log(
        `[Latanime] Results for "${query}": ${uniqueResults.length}`
    );

    for (
        const result of uniqueResults
    ) {

        console.log(
            `[Latanime]   ${result.title} | S${result.season ?? "?"} | ${result.year ?? "?"} | ${result.url}`
        );
    }

    return uniqueResults;
}
