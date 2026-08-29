import { fetchText } from "./http.js";
import cheerio from "cheerio-without-node-native";

const BASE_URL =
    "https://latanime.org";

export async function getEpisodeUrl(
    seriesUrl,
    season,
    episode
) {

    console.log(
        `[Latanime] Loading series: ${seriesUrl}`
    );

    const html =
        await fetchText(
            seriesUrl
        );

    const $ =
        cheerio.load(html);

    const targetEpisode =
        Number(episode);

    if (
        !Number.isInteger(
            targetEpisode
        ) ||
        targetEpisode < 1
    ) {

        console.warn(
            `[Latanime] Invalid episode: ${episode}`
        );

        return null;
    }

    let episodeUrl =
        null;

    $("a[href]").each(
        (index, element) => {

            if (
                episodeUrl
            ) {

                return;
            }

            const href =
                $(element).attr("href");

            if (
                !href
            ) {

                return;
            }

            const fullUrl =
                href.startsWith("http")
                    ? href
                    : `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`;

            const text =
                $(element)
                    .text()
                    .replace(/\s+/g, " ")
                    .trim();

            const hrefLower =
                fullUrl.toLowerCase();

            const expectedEpisode =
                `-episodio-${targetEpisode}`;

            /*
             * Latanime actualmente utiliza URLs como:
             *
             * /ver/thunder-3-episodio-1
             * /ver/thunder-3-episodio-2
             *
             * La página /anime/... ya separa las temporadas
             * cuando corresponde, por lo que primero buscamos
             * el episodio exacto dentro de la página actual.
             */

            if (
                hrefLower.includes(
                    "/ver/"
                ) &&
                hrefLower.includes(
                    expectedEpisode
                )
            ) {

                episodeUrl =
                    fullUrl;

                console.log(
                    `[Latanime] Episode found: E${targetEpisode} → ${episodeUrl}`
                );

                return;
            }

            /*
             * Fallback usando el texto visible.
             */
            const episodePattern =
                new RegExp(
                    `(?:episodio|episode|capitulo|capítulo)\\s*${targetEpisode}\\b`,
                    "i"
                );

            if (
                episodePattern.test(
                    text
                ) &&
                hrefLower.includes(
                    "/ver/"
                )
            ) {

                episodeUrl =
                    fullUrl;

                console.log(
                    `[Latanime] Episode found by text: E${targetEpisode} → ${episodeUrl}`
                );
            }
        }
    );

    if (
        !episodeUrl
    ) {

        console.warn(
            `[Latanime] Episode E${targetEpisode} not found`
        );

        return null;
    }

    return episodeUrl;
}
