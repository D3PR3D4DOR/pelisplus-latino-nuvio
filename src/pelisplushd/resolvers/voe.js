/**
 * VOE Resolver
 */

import { fetchText } from "../http.js";

export async function resolveVoe(url) {

    console.log(`[VOE] Opening ${url}`);

    const html = await fetchText(url);

    return {
        server: "voe",
        url,
        html
    };

}