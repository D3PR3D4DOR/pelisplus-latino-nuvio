import {
    fetchText
} from "../http.js";

import {
    resolveVidhide
} from "./vidhide.js";

import {
    resolveStreamwish2
} from "./streamwish2.js";

import {
    resolveVoe
} from "./voe.js";


// ==========================================================
// XUPALACE RESOLVER
// ==========================================================

export async function resolveXupalaсe(
    url
) {

    if (
        !url ||
        typeof url !== "string"
    ) {

        throw new Error(
            "Xupalaсe: URL inválida"
        );
    }

    console.log(
        "[Xupalaсe] Opening:",
        url
    );

    // ======================================================
    // OBTENER HTML
    // ======================================================

    const html =
        await fetchText(
            url
        );

    console.log(
        "[Xupalaсe] HTML length:",
        html.length
    );

    // ======================================================
    // EXTRAER SERVIDORES
    // ======================================================

    const servers =
        extractXupalaсeServers(
            html
        );

    console.log(
        "[Xupalaсe] Servidores encontrados:",
        servers.length
    );

    const streams =
        [];

    // ======================================================
    // PROCESAR SERVIDORES
    // ======================================================

    for (
        const server of
        servers
    ) {

        console.log(
            `[Xupalaсe] ${server.name} -> ${server.url}`
        );

        const name =
            normalizeServerName(
                server.name
            );

        // ==================================================
        // VIDHIDE
        // ==================================================

        if (
            name ===
            "vidhide"
        ) {

            try {

                const variants =
                    await resolveVidhide(
                        server.url
                    );

                if (
                    !Array.isArray(
                        variants
                    )
                ) {

                    continue;
                }

                for (
                    const variant of
                    variants
                ) {

                    if (
                        !variant?.url
                    ) {

                        continue;
                    }

                    streams.push({

                        name:
                            `Xupalaсe • VidHide • ${variant.quality || "auto"}`,

                        quality:
                            variant.quality ||
                            "auto",

                        url:
                            variant.url,

                        language:
                            "LAT",

                        headers:
                            variant.headers ||
                            {}
                    });
                }

            } catch (
                error
            ) {

                console.warn(
                    `[Xupalaсe] Vidhide error: ${error.message}`
                );
            }

            continue;
        }

        // ==================================================
        // STREAMWISH
        // ==================================================

        if (
            name ===
            "streamwish"
        ) {

            try {

                const variants =
                    await resolveStreamwish2(
                        server.url
                    );

                if (
                    Array.isArray(
                        variants
                    )
                ) {

                    for (
                        const variant of
                        variants
                    ) {

                        if (
                            !variant?.url
                        ) {

                            continue;
                        }

                        streams.push({

                            name:
                                `Xupalaсe • StreamWish • ${variant.quality || "auto"}`,

                            quality:
                                variant.quality ||
                                "auto",

                            url:
                                variant.url,

                            language:
                                "LAT",

                            headers:
                                variant.headers ||
                                {}
                        });
                    }
                }

            } catch (
                error
            ) {

                console.warn(
                    `[Xupalaсe] StreamWish error: ${error.message}`
                );
            }

            continue;
        }
        // ==================================================
        // STREAMWISH
        // ==================================================

        if (
            name ===
            "streamwish"
        ) {

            try {

                const variants =
                    await resolveStreamwish2(
                        server.url
                    );

                if (
                    Array.isArray(
                        variants
                    )
                ) {

                    for (
                        const variant of
                        variants
                    ) {

                        if (
                            !variant?.url
                        ) {

                            continue;
                        }

                        streams.push({

                            name:
                                `Xupalaсe • StreamWish • ${variant.quality || "auto"}`,

                            quality:
                                variant.quality ||
                                "auto",

                            url:
                                variant.url,

                            language:
                                "LAT",

                            headers:
                                variant.headers ||
                                {}
                        });
                    }
                }

            } catch (
                error
            ) {

                console.warn(
                    `[Xupalaсe] StreamWish error: ${error.message}`
                );
            }

            continue;
        }
        // ==================================================
        // VOE
        // ==================================================

        if (
            name ===
            "voe"
        ) {

            try {

                const variants =
                    await resolveVoe(
                        server.url
                    );

                if (
                    Array.isArray(
                        variants
                    )
                ) {

                    for (
                        const variant of
                        variants
                    ) {

                        if (
                            !variant?.url
                        ) {

                            continue;
                        }

                        streams.push({

                            name:
                                `Xupalaсe • VOE • ${variant.quality || "auto"}`,

                            quality:
                                variant.quality ||
                                "auto",

                            url:
                                variant.url,

                            language:
                                "LAT",

                            headers:
                                variant.headers ||
                                {}
                        });
                    }
                }

            } catch (
                error
            ) {

                console.warn(
                    `[Xupalaсe] VOE error: ${error.message}`
                );
            }

            continue;
        }
        // ==================================================
        // SERVIDORES TODAVÍA NO IMPLEMENTADOS
        // ==================================================

        console.log(
            `[Xupalaсe] Servidor todavía no implementado: ${server.name}`
        );
    }

    // ======================================================
    // DEDUPLICAR
    // ======================================================

    const unique =
        deduplicateStreams(
            streams
        );

    console.log(
        "[Xupalaсe] Final streams:",
        unique.length
    );

    return unique;
}


// ==========================================================
// EXTRAER SERVIDORES XUPALACE
// ==========================================================

function extractXupalaсeServers(
    html
) {

    const servers =
        [];

    const seen =
        new Set();

    /*
     * Xupalaсe utiliza elementos <li> que contienen:
     *
     * go_to_playerVast("URL")
     *
     * y un <span> con el nombre del servidor.
     *
     * Este es el mismo patrón que ya utilizábamos
     * en PelisPlusHD.
     */

    const liMatches =
        html.matchAll(
            /<li\b[^>]*>[\s\S]*?<\/li>/gi
        );

    for (
        const match of
        liMatches
    ) {

        const block =
            match[0];

        if (
            !block.includes(
                "go_to_playerVast"
            )
        ) {

            continue;
        }

        // --------------------------------------------------
        // URL
        // --------------------------------------------------

        const urlMatch =
            block.match(
                /go_to_playerVast\(\s*['"]([^'"]+)['"]/i
            );

        if (
            !urlMatch
        ) {

            continue;
        }

        const url =
            decodeHtmlEntities(
                urlMatch[1]
            ).trim();

        if (
            !url
        ) {

            continue;
        }

        // --------------------------------------------------
        // Nombre
        // --------------------------------------------------

        const nameMatch =
            block.match(
                /<span[^>]*>\s*([^<]+?)\s*<\/span>/i
            );

        if (
            !nameMatch
        ) {

            continue;
        }

        const name =
            decodeHtmlEntities(
                nameMatch[1]
            )
                .replace(
                    /\s+/g,
                    " "
                )
                .trim()
                .toLowerCase();

        if (
            !name
        ) {

            continue;
        }

        // --------------------------------------------------
        // Deduplicar
        // --------------------------------------------------

        const key =
            `${name}|${url}`;

        if (
            seen.has(
                key
            )
        ) {

            continue;
        }

        seen.add(
            key
        );

        servers.push({

            name,

            url
        });
    }

    return servers;
}


// ==========================================================
// NORMALIZAR NOMBRE
// ==========================================================

function normalizeServerName(
    value
) {

    return String(
        value || ""
    )
        .trim()
        .toLowerCase()
        .replace(
            /\s+/g,
            ""
        );
}


// ==========================================================
// DECODIFICAR ENTIDADES HTML
// ==========================================================

function decodeHtmlEntities(
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
        );
}


// ==========================================================
// DEDUPLICAR STREAMS
// ==========================================================

function deduplicateStreams(
    streams
) {

    const seen =
        new Set();

    return streams.filter(
        stream => {

            if (
                !stream?.url
            ) {

                return false;
            }

            if (
                seen.has(
                    stream.url
                )
            ) {

                return false;
            }

            seen.add(
                stream.url
            );

            return true;
        }
    );
}



