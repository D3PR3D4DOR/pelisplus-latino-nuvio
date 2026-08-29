import { fetchText, HEADERS } from "../http.js";

export async function resolveMp4Upload(
    embedUrl
) {

    try {

        console.log(
            `[MP4Upload] Resolving: ${embedUrl}`
        );

        const html =
            await fetchText(
                embedUrl,
                {
                    headers: {
                        ...HEADERS,
                        "Referer":
                            "https://latanime.org/"
                    }
                }
            );

        console.log(
            `[MP4Upload] HTML length: ${html.length}`
        );

        const patterns = [
            /src\s*:\s*["']([^"']+\.mp4[^"']*)["']/i,
            /src\s*=\s*["']([^"']+\.mp4[^"']*)["']/i,
            /file\s*:\s*["']([^"']+\.mp4[^"']*)["']/i
        ];

        let videoUrl =
            null;

        for (
            const pattern of patterns
        ) {

            const match =
                html.match(
                    pattern
                );

            if (
                match &&
                match[1]
            ) {

                videoUrl =
                    match[1];

                break;
            }
        }

        if (
            !videoUrl
        ) {

            console.warn(
                "[MP4Upload] No se encontró una fuente MP4."
            );

            return null;
        }

        if (
            videoUrl.startsWith("//")
        ) {

            videoUrl =
                "https:" +
                videoUrl;
        }

        if (
            videoUrl.startsWith("/")
        ) {

            const origin =
                new URL(
                    embedUrl
                ).origin;

            videoUrl =
                origin +
                videoUrl;
        }

        videoUrl =
            videoUrl.trim();

        console.log(
            `[MP4Upload] MP4 encontrado: ${videoUrl}`
        );

        // ==================================================
        // VERIFICAR DISPONIBILIDAD
        // ==================================================

        let verified =
            false;

        try {

            console.log(
                "[MP4Upload] Verificando URL..."
            );

            const check =
                await fetch(
                    videoUrl,
                    {
                        method: "HEAD",
                        headers: {
                            ...HEADERS,
                            "Referer":
                                embedUrl
                        }
                    }
                );

            console.log(
                `[MP4Upload] HEAD status: ${check.status}`
            );

            verified =
                check.ok;

        } catch (
            error
        ) {

            console.warn(
                `[MP4Upload] HEAD failed: ${error.message}`
            );
        }

        console.log(
            `[MP4Upload] Verified: ${verified}`
        );

        return {
            url:
                videoUrl,

            quality:
                "1080p",

            serverName:
                "MP4Upload",

            verified,

            headers: {
                ...HEADERS,
                "Referer":
                    embedUrl
            }
        };

    } catch (
        error
    ) {

        console.error(
            `[MP4Upload] Error: ${error.message}`
        );

        return null;
    }
}
