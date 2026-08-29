export const BASE_URL =
    "https://sololatino.net";

export const USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
    "AppleWebKit/537.36 (KHTML, like Gecko) " +
    "Chrome/146.0.0.0 Safari/537.36";

export const HEADERS = {

    "User-Agent":
        USER_AGENT,

    "Accept":
        "*/*",

    "Accept-Language":
        "es-AR,es;q=0.9,en;q=0.8"
};


// ==========================================================
// FETCH TEXT
// ==========================================================

export async function fetchText(
    url,
    options = {}
) {

    const response =
        await fetch(
            url,
            {
                ...options,

                headers: {
                    ...HEADERS,
                    ...(options.headers || {})
                }
            }
        );

    if (
        !response.ok
    ) {

        throw new Error(
            `HTTP ${response.status}: ${url}`
        );
    }

    return await response.text();
}


// ==========================================================
// FETCH JSON
// ==========================================================

export async function fetchJson(
    url,
    options = {}
) {

    const text =
        await fetchText(
            url,
            options
        );

    try {

        return JSON.parse(
            text
        );

    } catch {

        throw new Error(
            `Respuesta JSON inválida: ${url}`
        );
    }
}


// ==========================================================
// SET-COOKIE
//
// IMPORTANTE:
// Hermes/Nuvio no nos devuelve correctamente
// getSetCookie(), pero sí headers.get("set-cookie").
// ==========================================================

export function getSetCookieHeader(
    response
) {

    try {

        return (
            response.headers.get(
                "set-cookie"
            ) || ""
        );

    } catch {

        return "";
    }
}


// ==========================================================
// EXTRAER COOKIE
// ==========================================================

export function getCookieValue(
    rawCookie,
    name
) {

    if (
        !rawCookie ||
        !name
    ) {

        return null;
    }

    const regex =
        new RegExp(
            `(?:^|,\\s*)${escapeRegExp(name)}=([^;]+)`,
            "i"
        );

    const match =
        String(
            rawCookie
        ).match(
            regex
        );

    return match
        ? match[1]
        : null;
}


// ==========================================================
// CONSTRUIR COOKIE HEADER
// ==========================================================

export function buildCookieHeader(
    rawCookie
) {

    if (
        !rawCookie
    ) {

        return "";
    }

    const cookies = [];

    const xsrf =
        getCookieValue(
            rawCookie,
            "XSRF-TOKEN"
        );

    const session =
        getCookieValue(
            rawCookie,
            "sololatinonet-session"
        );

    if (
        xsrf
    ) {

        cookies.push(
            `XSRF-TOKEN=${xsrf}`
        );
    }

    if (
        session
    ) {

        cookies.push(
            `sololatinonet-session=${session}`
        );
    }

    return cookies.join(
        "; "
    );
}


// ==========================================================
// XSRF TOKEN
// ==========================================================

export function getXsrfToken(
    rawCookie
) {

    const value =
        getCookieValue(
            rawCookie,
            "XSRF-TOKEN"
        );

    if (!value) {
        return null;
    }

    try {

        return decodeURIComponent(
            value
        );

    } catch {

        return value;
    }
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
