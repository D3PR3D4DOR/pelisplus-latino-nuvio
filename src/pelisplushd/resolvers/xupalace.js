/**
 * Xupalace Resolver
 */

import { fetchText } from "../http.js";

export async function resolveXupalace(url) {

    console.log(`[Xupalace] Opening ${url}`);

    const html = await fetchText(url);

    return {
        server: "xupalace",
        url,
        html
    };

}