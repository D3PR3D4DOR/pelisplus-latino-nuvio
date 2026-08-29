import {
    BASE_URL,
    HEADERS,
    fetchText,
    getSetCookieHeader,
    getXsrfToken,
    buildCookieHeader
} from "./http.js";


// ==========================================================
// OBTENER SERVIDORES
// ==========================================================

export async function getEpisodeServers(
    episodeUrl
) {

    if (
        !episodeUrl ||
        typeof episodeUrl !== "string"
    ) {

        return [];
    }

    console.log(
        "[SoloLatino] Fetching episode:",
        episodeUrl
    );

    const html =
        await fetchText(
            episodeUrl,
            {
                headers: {
                    "Accept":
                        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

                    "Referer":
                        `${BASE_URL}/`
                }
            }
        );

    const servers = [];

    /*
     * Cada servidor utiliza:
     *
     * [data-server-btn]
     * data-player-token="..."
     *
     * Además puede pertenecer a:
     *
     * [data-lang-group]
     */

    const regex =
        /<[^>]*data-server-btn[^>]*data-player-token=["']([^"']+)["'][^>]*>([\s\S]*?)<\/[^>]+>/gi;

    let match;

    while (
        (match = regex.exec(html))
    ) {

        const token =
            match[1];

        const label =
            match[2]
                .replace(
                    /<[^>]+>/g,
                    " "
                )
                .replace(
                    /\s+/g,
                    " "
                )
                .trim();

        /*
         * Intentamos descubrir el grupo de idioma
         * alrededor del botón.
         */
        const before =
            html.slice(
                Math.max(
                    0,
                    match.index - 2000
                ),
                match.index
            );

        const languageMatches =
            [
                ...before.matchAll(
                    /data-lang-group=["']([^"']+)["']/gi
                )
            ];

        const language =
            languageMatches.length
                ? languageMatches[
                    languageMatches.length - 1
                ][1]
                : null;

        servers.push({

            label:
                label || "Servidor",

            language,

            playerToken:
                token,

            hasPlayerToken:
                Boolean(
                    token
                ),

            episodeUrl
        });
    }

    console.log(
        "[SoloLatino] Servers found:",
        servers.length
    );

    for (
        const server of
        servers
    ) {

        console.log(
            `[SoloLatino] ${server.label} | ${server.language ?? "?"} | token=${server.hasPlayerToken}`
        );
    }

    return servers;
}


// ==========================================================
// RESOLVER PLAYER URL
// ==========================================================

export async function resolvePlayerUrl(
    server
) {

    if (
        !server?.playerToken
    ) {

        throw new Error(
            "Servidor sin playerToken"
        );
    }

    if (
        !server?.episodeUrl
    ) {

        throw new Error(
            "Servidor sin episodeUrl"
        );
    }

    console.log(
        "[SoloLatino] Resolving player:",
        server.label
    );

    // ======================================================
    // 1. CSRF COOKIE
    // ======================================================

    const csrfResponse =
        await fetch(
            `${BASE_URL}/sanctum/csrf-cookie`,
            {
                headers: {
                    ...HEADERS,

                    "Accept":
                        "*/*",

                    "Referer":
                        server.episodeUrl,

                    "Origin":
                        BASE_URL
                }
            }
        );

    console.log(
        "[SoloLatino] CSRF HTTP:",
        csrfResponse.status
    );

    if (
        csrfResponse.status !== 204
    ) {

        throw new Error(
            `CSRF HTTP ${csrfResponse.status}`
        );
    }

    // ======================================================
    // 2. SET-COOKIE
    //
    // IMPORTANTE:
    // Hermes:
    //
    // headers.get("set-cookie")
    //
    // no getSetCookie()
    // ======================================================

    const rawCookie =
        getSetCookieHeader(
            csrfResponse
        );

    console.log(
        "[SoloLatino] CSRF Set-Cookie:",
        rawCookie.length
    );

    if (
        !rawCookie
    ) {

        throw new Error(
            "No se recibió Set-Cookie"
        );
    }

    // ======================================================
    // 3. XSRF TOKEN
    // ======================================================

    const xsrfToken =
        getXsrfToken(
            rawCookie
        );

    if (
        !xsrfToken
    ) {

        throw new Error(
            "No se obtuvo XSRF-TOKEN"
        );
    }

    // ======================================================
    // 4. COOKIE HEADER
    // ======================================================

    const cookieHeader =
        buildCookieHeader(
            rawCookie
        );

    if (
        !cookieHeader
    ) {

        throw new Error(
            "No se pudo construir Cookie header"
        );
    }

    console.log(
        "[SoloLatino] Cookie header:",
        cookieHeader.length
    );

    // ======================================================
    // 5. POST /api/player-url
    // ======================================================

    const response =
        await fetch(
            `${BASE_URL}/api/player-url`,
            {
                method:
                    "POST",

                headers: {

                    "Accept":
                        "application/json",

                    "Content-Type":
                        "application/json",

                    "X-Requested-With":
                        "XMLHttpRequest",

                    "X-XSRF-TOKEN":
                        xsrfToken,

                    "Cookie":
                        cookieHeader,

                    "Referer":
                        server.episodeUrl,

                    "Origin":
                        BASE_URL,

                    "User-Agent":
                        HEADERS[
                            "User-Agent"
                        ]
                },

                body:
                    JSON.stringify({
                        t:
                            server.playerToken
                    })
            }
        );

    console.log(
        "[SoloLatino] player-url HTTP:",
        response.status
    );

    const text =
        await response.text();

    console.log(
        "[SoloLatino] player-url response:",
        text
    );

    if (
        !response.ok
    ) {

        throw new Error(
            `player-url HTTP ${response.status}: ${text}`
        );
    }

    let data;

    try {

        data =
            JSON.parse(
                text
            );

    } catch {

        throw new Error(
            "player-url no devolvió JSON válido"
        );
    }

    if (
        !data?.url
    ) {

        throw new Error(
            "player-url no devolvió una URL"
        );
    }

    return {

        url:
            data.url,

        type:
            data.type ||
            "iframe",

        server:
            server.label,

        language:
            server.language ||
            null
    };
}
