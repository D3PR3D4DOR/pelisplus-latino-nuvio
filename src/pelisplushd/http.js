/**
 * HTTP Utilities
 * Use this file for network requests and headers.
 */

export const HEADERS = {
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",

    "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",

    "Accept-Language":
        "es-AR,es;q=0.9,en-US;q=0.8,en;q=0.7",

    "Accept-Encoding":
        "gzip, deflate, br",

    "Cache-Control":
        "no-cache",

    "Pragma":
        "no-cache",

    "Upgrade-Insecure-Requests":
        "1"
};


/**
 * Fetch text content from a URL
 * @param {string} url
 * @param {object} options
 */
export async function fetchText(
    url,
    options = {}
) {

    console.log(
        `[Template] Fetching: ${url}`
    );

    const response =
        await fetch(
            url,
            {
                ...options,

                headers: {
                    ...HEADERS,
                    ...options.headers
                }
            }
        );

    if (!response.ok) {

        throw new Error(
            `HTTP error ${response.status} for ${url}`
        );
    }

    return await response.text();
}


/**
 * Fetch JSON content from a URL
 * @param {string} url
 * @param {object} options
 */
export async function fetchJson(
    url,
    options = {}
) {

    const raw =
        await fetchText(
            url,
            options
        );

    return JSON.parse(
        raw
    );
}