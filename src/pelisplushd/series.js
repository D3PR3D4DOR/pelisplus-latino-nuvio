import { fetchText } from "./http.js";
import cheerio from "cheerio-without-node-native";

export async function getEpisodeUrl(seriesUrl, season, episode) {
    const html = await fetchText(seriesUrl);
    const $ = cheerio.load(html);
    const requestedSeason = Number(season);
    const requestedEpisode = Number(episode);
    let episodeUrl = null;

    $("a[href]").each((_, element) => {
        if (episodeUrl) {
            return;
        }

        const href = $(element).attr("href");

        if (!href) {
            return;
        }

        const url = new URL(href, seriesUrl);
        const match = url.pathname.match(
            /\/(?:temporada|season)\/(\d+)\/(?:capitulo|episode)\/(\d+)\/?$/i
        );

        if (
            match &&
            Number(match[1]) === requestedSeason &&
            Number(match[2]) === requestedEpisode
        ) {
            episodeUrl = url.href;
        }
    });

    return episodeUrl;
}
