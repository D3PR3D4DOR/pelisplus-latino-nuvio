import { fetchText, HEADERS } from "../http.js";

export async function resolveMixdrop(
    embedUrl
) {

    try {

        console.log(
            `[Mixdrop] Resolving: ${embedUrl}`
        );

        const embed =
            new URL(
                embedUrl
            );

        const html =
            await fetchText(
                embedUrl,
                {
                    headers: {
                        ...HEADERS,
                        "Referer": "https://latanime.org/",
                        "Accept":
                            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
                    }
                }
            );

        console.log(
            `[Mixdrop] HTML length: ${html.length}`
        );

        const videoUrl =
            extractMixdropVideoUrl(
                html
            );

        if (
            !videoUrl
        ) {

            console.warn(
                "[Mixdrop] No se pudo encontrar MDCore.wurl."
            );

            return null;
        }

        console.log(
            `[Mixdrop] Video URL: ${videoUrl}`
        );

        const origin =
            `${embed.protocol}//${embed.host}`;

        return {

            url:
                videoUrl,

            quality:
                "1080p",

            serverName:
                "Mixdrop",

            verified:
                true,

            headers: {

                ...HEADERS,

                "Referer":
                    embedUrl,

                "Origin":
                    origin,

                "Accept":
                    "video/mp4,*/*"
            },

            behaviorHints: {

                notWebReady:
                    false
            }
        };

    } catch (
        error
    ) {

        console.error(
            `[Mixdrop] Error: ${error.message}`
        );

        return null;
    }
}


// ======================================================
// EXTRACT MIXDROP VIDEO URL
// ======================================================

function extractMixdropVideoUrl(
    html
) {

    // --------------------------------------------------
    // Intentar primero por si alguna versión ya expone
    // MDCore.wurl directamente.
    // --------------------------------------------------

    const direct =
        extractWurl(
            html
        );

    if (
        direct
    ) {

        console.log(
            "[Mixdrop] MDCore.wurl encontrado directamente."
        );

        return normalizeVideoUrl(
            direct
        );
    }

    // --------------------------------------------------
    // Buscar todos los eval(...)
    // --------------------------------------------------

    const evalMatches =
        [
            ...html.matchAll(
                /eval\s*\(\s*function\s*\(\s*p\s*,\s*a\s*,\s*c\s*,\s*k\s*,\s*e\s*,\s*d\s*\)/gi
            )
        ];

    console.log(
        `[Mixdrop] Eval candidates: ${evalMatches.length}`
    );

    // --------------------------------------------------
    // Procesar cada eval desde su posición.
    //
    // No intentamos asumir que el bloque completo tenga
    // siempre exactamente la misma estructura.
    // --------------------------------------------------

    for (
        const match of evalMatches
    ) {

        const start =
            match.index;

        if (
            typeof start !==
            "number"
        ) {

            continue;
        }

        const block =
            extractEvalBlock(
                html,
                start
            );

        if (
            !block
        ) {

            continue;
        }

        const unpacked =
            unpackMixdropEval(
                block
            );

        if (
            !unpacked
        ) {

            continue;
        }

        console.log(
            `[Mixdrop] Unpacked length: ${unpacked.length}`
        );

        const wurl =
            extractWurl(
                unpacked
            );

        if (
            wurl
        ) {

            console.log(
                "[Mixdrop] MDCore.wurl encontrado."
            );

            return normalizeVideoUrl(
                wurl
            );
        }
    }

    return null;
}


// ======================================================
// EXTRACT EVAL BLOCK
// ======================================================

function extractEvalBlock(
    html,
    start
) {

    // Buscamos el final natural del script.
    // Esto evita depender de que la cantidad de argumentos
    // del unpacker sea siempre la misma.

    const scriptEnd =
        html.indexOf(
            "</script>",
            start
        );

    if (
        scriptEnd === -1
    ) {

        return html.slice(
            start
        );
    }

    return html.slice(
        start,
        scriptEnd
    );
}


// ======================================================
// UNPACK MIXDROP EVAL
// ======================================================

function unpackMixdropEval(
    block
) {

    try {

        // ==================================================
        // FORMATO CON COMILLAS SIMPLES
        //
        // ('PAYLOAD',10,31,'DICTIONARY'.split('|')
        //
        // El número 31/34/etc. se detecta automáticamente.
        // ==================================================

        let match =
            block.match(
                /\(\s*'((?:\\'|[^'])*)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'((?:\\'|[^'])*)'\.split\(\s*'\|'\s*\)/i
            );

        if (
            match
        ) {

            return decodePacked(
                match[1],
                Number(match[2]),
                Number(match[3]),
                match[4]
            );
        }

        // ==================================================
        // FORMATO CON COMILLAS DOBLES
        // ==================================================

        match =
            block.match(
                /\(\s*"((?:\\"|[^"])*)"\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*"((?:\\"|[^"])*)"\.split\(\s*"\|"\s*\)/i
            );

        if (
            match
        ) {

            return decodePacked(
                match[1],
                Number(match[2]),
                Number(match[3]),
                match[4]
            );
        }

        console.warn(
            "[Mixdrop] No se encontró payload + dictionary."
        );

    } catch (
        error
    ) {

        console.warn(
            `[Mixdrop] Error unpacking eval: ${error.message}`
        );
    }

    return null;
}


// ======================================================
// DECODE PACKED DATA
// ======================================================

function decodePacked(
    packed,
    base,
    count,
    dictionaryText
) {

    try {

        const dictionary =
            dictionaryText.split(
                "|"
            );

        console.log(
            `[Mixdrop] Dictionary: ${dictionary.length} elementos | base=${base} | count=${count}`
        );

        let unpacked =
            packed.replace(
                /\b(\d+)\b/g,
                (
                    full,
                    index
                ) => {

                    const i =
                        Number(
                            index
                        );

                    if (
                        i >= 0 &&
                        i < dictionary.length
                    ) {

                        return (
                            dictionary[i] ??
                            full
                        );
                    }

                    return full;
                }
            );

        // --------------------------------------------------
        // Si no apareció MDCore, hacemos una segunda pasada
        // limitada a referencias numéricas válidas.
        // --------------------------------------------------

        if (
            !/MDCore/i.test(
                unpacked
            )
        ) {

            unpacked =
                replacePackedWords(
                    packed,
                    dictionary
                );
        }

        if (
            /MDCore\./i.test(
                unpacked
            )
        ) {

            return unpacked;
        }

    } catch (
        error
    ) {

        console.warn(
            `[Mixdrop] Error decoding packed data: ${error.message}`
        );
    }

    return null;
}


// ======================================================
// SECOND PACKED PASS
// ======================================================

function replacePackedWords(
    text,
    dictionary
) {

    return text.replace(
        /\b(\d+)\b/g,
        (
            full,
            index
        ) => {

            const i =
                Number(
                    index
                );

            return (
                dictionary[i] ??
                full
            );
        }
    );
}


// ======================================================
// EXTRACT MDCore.wurl
// ======================================================

function extractWurl(
    text
) {

    if (
        typeof text !==
        "string"
    ) {

        return null;
    }

    const patterns = [

        /MDCore\.wurl\s*=\s*["']([^"']+)["']/i,

        /MDCore\s*\[\s*["']wurl["']\s*\]\s*=\s*["']([^"']+)["']/i,

        /\bwurl\s*=\s*["']([^"']+\.mp4[^"']*)["']/i
    ];

    for (
        const pattern of patterns
    ) {

        const match =
            text.match(
                pattern
            );

        if (
            match &&
            match[1]
        ) {

            return match[1].trim();
        }
    }

    return null;
}


// ======================================================
// NORMALIZE VIDEO URL
// ======================================================

function normalizeVideoUrl(
    value
) {

    let url =
        String(
            value || ""
        ).trim();

    if (
        !url
    ) {

        return null;
    }

    if (
        url.startsWith("//")
    ) {

        url =
            `https:${url}`;
    }

    if (
        !/^https?:\/\//i.test(
            url
        )
    ) {

        return null;
    }

    return url;
}
