/**
 * PelisPlusHD Search
 */

import { fetchText } from "./http.js";
import cheerio from "cheerio-without-node-native";

const BASE_URL = "https://pelisplushd.bz";

export async function searchMovie(title) {
    return search(title, "a.Posters-link.movies");
}

export async function searchSeries(title) {
    return search(title, "a.Posters-link.series, a.Posters-link.animes");
}

async function search(title, selector) {
    const url = `${BASE_URL}/search?s=${encodeURIComponent(title)}`;

    console.log(`[PelisPlusHD] Searching: ${url}`);

    const html = await fetchText(url);
    const $ = cheerio.load(html);
    const results = [];

    $(selector).each((_, element) => {
        const card = $(element);
        const url = card.attr("href");
        const poster = card.find("img").attr("src");
        const rawTitle = card.find("p").text().trim();
        const rating = card.find(".rating span").text().trim();
        let title = rawTitle;
        let year = null;

        const match = rawTitle.match(/^(.*)\((\d{4})\)$/);

        if (match) {
            title = match[1].trim();
            year = Number(match[2]);
        }

        results.push({
            title,
            year,
            rating: Number.parseFloat(rating),
            poster,
            url
        });
    });

    return results;
}
