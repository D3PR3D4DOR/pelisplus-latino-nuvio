/**
 * HLS helpers para SoloLatino.
 *
 * Este módulo NO hace requests.
 * Solamente analiza playlists y devuelve variantes.
 */


// ==========================================================
// EXTRAER VARIANTES HLS
// ==========================================================

export function extractHlsVariants(
    playlist,
    masterUrl
) {

    if (
        !playlist ||
        typeof playlist !== "string"
    ) {

        return [];
    }

    const lines =
        playlist.split(
            /\r?\n/
        );

    const variants = [];

    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        const line =
            lines[i].trim();

        if (
            !line.startsWith(
                "#EXT-X-STREAM-INF:"
            )
        ) {

            continue;
        }

        // --------------------------------------------------
        // Obtener URL correspondiente
        // --------------------------------------------------

        let location =
            null;

        for (
            let j = i + 1;
            j < lines.length;
            j++
        ) {

            const candidate =
                lines[j].trim();

            if (
                !candidate
            ) {

                continue;
            }

            // Saltar comentarios/directivas.
            if (
                candidate.startsWith(
                    "#"
                )
            ) {

                continue;
            }

            location =
                candidate;

            break;
        }

        if (
            !location
        ) {

            continue;
        }

        // --------------------------------------------------
        // Resolver URL relativa
        // --------------------------------------------------

        let resolvedUrl;

        try {

            resolvedUrl =
                new URL(
                    location,
                    masterUrl
                ).href;

        } catch {

            continue;
        }

        // --------------------------------------------------
        // Resolución
        //
        // Ejemplo:
        //
        // RESOLUTION=1280x720
        // RESOLUTION=854x480
        // --------------------------------------------------

        const resolution =
            line.match(
                /RESOLUTION=\s*\d+x(\d+)/i
            );

        let quality =
            "auto";

        if (
            resolution
        ) {

            quality =
                `${resolution[1]}p`;
        }

        // --------------------------------------------------
        // También soportamos BANDWIDTH
        // por si alguna playlist no contiene RESOLUTION.
        // --------------------------------------------------

        const bandwidth =
            line.match(
                /BANDWIDTH=\s*(\d+)/i
            );

        variants.push({

            url:
                resolvedUrl,

            quality,

            bandwidth:
                bandwidth
                    ? Number(
                        bandwidth[1]
                    )
                    : null
        });
    }

    return variants;
}


// ==========================================================
// ORDENAR POR CALIDAD
// ==========================================================

export function sortByQuality(
    variants
) {

    return [
        ...(
            Array.isArray(
                variants
            )
                ? variants
                : []
        )
    ].sort(
        (
            a,
            b
        ) =>
            qualityNumber(
                b?.quality
            ) -
            qualityNumber(
                a?.quality
            )
    );
}


// ==========================================================
// EXTRAER UNA CALIDAD
// ==========================================================

export function qualityNumber(
    quality
) {

    const match =
        String(
            quality || ""
        ).match(
            /(\d+)p/i
        );

    if (
        !match
    ) {

        return 0;
    }

    return Number(
        match[1]
    );
}


// ==========================================================
// DEDUPLICAR VARIANTES
// ==========================================================

export function deduplicateVariants(
    variants
) {

    const seen =
        new Set();

    const result = [];

    for (
        const variant of
        Array.isArray(
            variants
        )
            ? variants
            : []
    ) {

        if (
            !variant?.url
        ) {

            continue;
        }

        if (
            seen.has(
                variant.url
            )
        ) {

            continue;
        }

        seen.add(
            variant.url
        );

        result.push(
            variant
        );
    }

    return result;
}


// ==========================================================
// PROCESAR PLAYLIST
//
// Devuelve variantes ordenadas,
// sin duplicados.
// ==========================================================

export function parseHlsPlaylist(
    playlist,
    masterUrl
) {

    const variants =
        extractHlsVariants(
            playlist,
            masterUrl
        );

    const unique =
        deduplicateVariants(
            variants
        );

    return sortByQuality(
        unique
    );
}
