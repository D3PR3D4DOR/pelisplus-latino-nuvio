import { HEADERS } from "../http.js";

export async function resolveHexload(
    embedUrl
) {

    try {

        console.log(
            `[Hexload] Resolving: ${embedUrl}`
        );

        const match =
            String(embedUrl)
                .match(
                    /embed-([^/?#]+)$/i
                );

        if (
            !match ||
            !match[1]
        ) {

            console.warn(
                "[Hexload] No se pudo extraer el ID."
            );

            return null;
        }

        const id =
            match[1];

        console.log(
            `[Hexload] ID: ${id}`
        );

        const body =
            `op=download3&id=${encodeURIComponent(id)}&ajax=1&method_free=1&dataType=json`;

        const response =
            await fetch(
                "https://hexload.com/download",
                {
                    method: "POST",

                    headers: {
                        ...HEADERS,

                        "Accept":
                            "application/json, text/javascript, */*; q=0.01",

                        "Content-Type":
                            "application/x-www-form-urlencoded; charset=UTF-8",

                        "X-Requested-With":
                            "XMLHttpRequest",

                        "Referer":
                            embedUrl
                    },

                    body
                }
            );

        console.log(
            `[Hexload] HTTP status: ${response.status}`
        );

        if (
            !response.ok
        ) {

            console.warn(
                `[Hexload] HTTP error: ${response.status}`
            );

            return null;
        }

        const raw =
            await response.text();

        console.log(
            `[Hexload] Response length: ${raw.length}`
        );

        console.log(
            `[Hexload] Response preview: ${raw.slice(0, 300)}`
        );

        let data;

        try {

            data =
                JSON.parse(
                    raw
                );

        } catch (
            error
        ) {

            console.warn(
                `[Hexload] JSON parse failed: ${error.message}`
            );

            return null;
        }

        if (
            !data ||
            data.msg !== "OK" ||
            !data.result ||
            !data.result.url
        ) {

            console.warn(
                "[Hexload] La respuesta no contiene result.url."
            );

            console.log(
                "[Hexload] Parsed response:",
                data
            );

            return null;
        }

        const videoUrl =
            data.result.url;

        console.log(
            `[Hexload] Video URL: ${videoUrl}`
        );

        console.log(
            `[Hexload] File: ${data.result.file_name || "unknown"}`
        );

        console.log(
            `[Hexload] Size: ${data.result.size || "unknown"}`
        );

        console.log(
            `[Hexload] Content-Type: ${data.result.content_type || "unknown"}`
        );

        return {
            url:
                videoUrl,

            quality:
                "1080p",

            serverName:
                "Hexload",

            verified:
                true,

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
            `[Hexload] Error: ${error.message}`
        );

        return null;
    }
}
