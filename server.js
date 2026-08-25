const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PORT = 8090;
const BASE_URL = process.env.BASE_URL || null;


// ======================================================
// IP LOCAL
// ======================================================

function getLocalIp() {

    const interfaces =
        os.networkInterfaces();

    for (const name of Object.keys(interfaces)) {

        for (const iface of interfaces[name]) {

            if (
                iface.family === "IPv4" &&
                !iface.internal
            ) {
                return iface.address;
            }
        }
    }

    return "localhost";
}


// ======================================================
// MIME TYPES
// ======================================================

const mimeTypes = {
    ".json": "application/json",
    ".js": "application/javascript",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".ico": "image/x-icon",
    ".html": "text/html",
    ".m3u8": "application/vnd.apple.mpegurl",
    ".ts": "video/mp2t",
    ".txt": "text/plain"
};


// ======================================================
// STREAMWISH HEADERS
// ======================================================

const STREAMWISH_HEADERS = {

    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",

    "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",

    "Accept-Language":
        "es-AR,es;q=0.9,en-US;q=0.8,en;q=0.7",

    "Referer":
        "https://hanerix.com/",

    "Origin":
        "https://hanerix.com",

    "Upgrade-Insecure-Requests":
        "1"
};


// ======================================================
// HANERIX HEADERS
// ======================================================

const HANERIX_HEADERS = {

    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",

    "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",

    "Accept-Language":
        "es-AR,es;q=0.9,en-US;q=0.8,en;q=0.7",

    "Referer":
        "https://hglink.to/",

    "Upgrade-Insecure-Requests":
        "1"
};


// ======================================================
// HOST VALIDATION
// ======================================================

function isAllowedProxyHost(
    hostname
) {

    const host =
        hostname
            .toLowerCase()
            .trim();

    // --------------------------------------------------
    // Bloquear localhost
    // --------------------------------------------------

    if (
        host === "localhost" ||
        host.endsWith(".localhost")
    ) {
        return false;
    }

    // --------------------------------------------------
    // Bloquear IPv4
    // --------------------------------------------------

    const ipv4 =
        host.match(
            /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1})$/
        );

    if (ipv4) {

        const a =
            Number(
                ipv4[1]
            );

        const b =
            Number(
                ipv4[2]
            );

        // Validación básica
        if (
            a > 255 ||
            b > 255 ||
            Number(ipv4[3]) > 255 ||
            Number(ipv4[4]) > 255
        ) {
            return false;
        }

        // 0.0.0.0/8
        if (
            a === 0
        ) {
            return false;
        }

        // 10.0.0.0/8
        if (
            a === 10
        ) {
            return false;
        }

        // 127.0.0.0/8
        if (
            a === 127
        ) {
            return false;
        }

        // 169.254.0.0/16
        if (
            a === 169 &&
            b === 254
        ) {
            return false;
        }

        // 172.16.0.0/12
        if (
            a === 172 &&
            b >= 16 &&
            b <= 31
        ) {
            return false;
        }

        // 192.168.0.0/16
        if (
            a === 192 &&
            b === 168
        ) {
            return false;
        }

        // 100.64.0.0/10
        if (
            a === 100 &&
            b >= 64 &&
            b <= 127
        ) {
            return false;
        }

        // 198.18.0.0/15
        if (
            a === 198 &&
            (b === 18 || b === 19)
        ) {
            return false;
        }
    }

    // --------------------------------------------------
    // Bloquear dominios locales habituales
    // --------------------------------------------------

    if (
        host.endsWith(".local") ||
        host.endsWith(".internal") ||
        host.endsWith(".lan")
    ) {
        return false;
    }

    // --------------------------------------------------
    // Aceptar cualquier hostname público
    // --------------------------------------------------

    return true;
}


// ======================================================
// HOSTS HANERIX / HGLINK
// ======================================================

function isHanerixHost(
    hostname
) {

    return (

        hostname ===
            "hanerix.com" ||

        hostname.endsWith(
            ".hanerix.com"
        ) ||

        hostname ===
            "hglink.to" ||

        hostname.endsWith(
            ".hglink.to"
        )
    );
}


// ======================================================
// FETCH HTTPS
// ======================================================

function fetchHttps(
    url,
    headers,
    callback
) {

    let target;

    try {

        target =
            new URL(
                url
            );

    } catch (
        error
    ) {

        callback(
            error
        );

        return;
    }

    if (
        target.protocol !==
        "https:"
    ) {

        callback(
            new Error(
                "Only HTTPS upstream URLs are allowed."
            )
        );

        return;
    }

    const https =
        require("https");

    https.get(
        url,
        {
            headers
        },
        response => {

            callback(
                null,
                response
            );
        }
    ).on(
        "error",
        error => {

            callback(
                error
            );
        }
    );
}


// ======================================================
// REWRITE HLS PLAYLIST
// ======================================================

function rewritePlaylist(
    playlist,
    playlistUrl,
    proxyBase
) {

    const lines =
        playlist.split(
            /\r?\n/
        );

    return lines
        .map(
            line => {

                const value =
                    line.trim();

                if (
                    !value
                ) {
                    return line;
                }

                // Mantener tags HLS
                if (
                    value.startsWith("#")
                ) {
                    return line;
                }

                try {

                    const absoluteUrl =
                        new URL(
                            value,
                            playlistUrl
                        ).href;

                    return (
                        `${proxyBase}/streamwish/segment?url=` +
                        encodeURIComponent(
                            absoluteUrl
                        )
                    );

                } catch {

                    return line;
                }
            }
        )
        .join(
            "\n"
        );
}


// ======================================================
// STREAMWISH PLAYLIST PROXY
// ======================================================

function handleStreamwishPlaylist(
    req,
    res,
    proxyBase
) {

    const requestUrl =
        new URL(
            req.url,
            `http://${req.headers.host}`
        );

    const target =
        requestUrl.searchParams.get(
            "url"
        );

    if (
        !target
    ) {

        res.writeHead(
            400
        );

        res.end(
            "Missing url parameter"
        );

        return;
    }

    let parsed;

    try {

        parsed =
            new URL(
                target
            );

    } catch {

        res.writeHead(
            400
        );

        res.end(
            "Invalid URL"
        );

        return;
    }

    if (
        !isAllowedProxyHost(
            parsed.hostname
        )
    ) {

        res.writeHead(
            403
        );

        res.end(
            "Host not allowed"
        );

        return;
    }

    console.log(
        `[StreamWish Proxy] Playlist -> ${target}`
    );

    fetchHttps(
        target,
        STREAMWISH_HEADERS,
        (
            error,
            upstream
        ) => {

            if (
                error
            ) {

                console.error(
                    "[StreamWish Proxy] Playlist error:",
                    error.message
                );

                res.writeHead(
                    502
                );

                res.end(
                    "Upstream error"
                );

                return;
            }

            let body =
                "";

            upstream.setEncoding(
                "utf8"
            );

            upstream.on(
                "data",
                chunk => {

                    body += chunk;
                }
            );

            upstream.on(
                "end",
                () => {

                    console.log(
                        `[StreamWish Proxy] Playlist status: ${upstream.statusCode}`
                    );

                    if (
                        upstream.statusCode !==
                        200
                    ) {

                        res.writeHead(
                            upstream.statusCode ||
                            502
                        );

                        res.end(
                            body
                        );

                        return;
                    }

                    const rewritten =
                        rewritePlaylist(
                            body,
                            target,
                            proxyBase
                        );

                    res.writeHead(
                        200,
                        {
                            "Content-Type":
                                "application/vnd.apple.mpegurl",

                            "Access-Control-Allow-Origin":
                                "*",

                            "Cache-Control":
                                "no-cache"
                        }
                    );

                    res.end(
                        rewritten
                    );

                    console.log(
                        "[StreamWish Proxy] Playlist reescrita"
                    );
                }
            );
        }
    );
}


// ======================================================
// STREAMWISH SEGMENT PROXY
// ======================================================

function handleStreamwishSegment(
    req,
    res
) {

    const requestUrl =
        new URL(
            req.url,
            `http://${req.headers.host}`
        );

    const target =
        requestUrl.searchParams.get(
            "url"
        );

    if (
        !target
    ) {

        res.writeHead(
            400
        );

        res.end(
            "Missing url parameter"
        );

        return;
    }

    let parsed;

    try {

        parsed =
            new URL(
                target
            );

    } catch {

        res.writeHead(
            400
        );

        res.end(
            "Invalid URL"
        );

        return;
    }

    if (
        !isAllowedProxyHost(
            parsed.hostname
        )
    ) {

        res.writeHead(
            403
        );

        res.end(
            "Host not allowed"
        );

        return;
    }

    console.log(
        `[StreamWish Proxy] Segment -> ${target}`
    );

    fetchHttps(
        target,
        STREAMWISH_HEADERS,
        (
            error,
            upstream
        ) => {

            if (
                error
            ) {

                console.error(
                    "[StreamWish Proxy] Segment error:",
                    error.message
                );

                res.writeHead(
                    502
                );

                res.end(
                    "Upstream error"
                );

                return;
            }

            console.log(
                `[StreamWish Proxy] Segment status: ${upstream.statusCode}`
            );

            res.writeHead(
                upstream.statusCode ||
                502,
                {
                    "Content-Type":
                        upstream.headers[
                            "content-type"
                        ] ||
                        "video/mp2t",

                    "Access-Control-Allow-Origin":
                        "*",

                    "Cache-Control":
                        "no-cache"
                }
            );

            upstream.pipe(
                res
            );
        }
    );
}


// ======================================================
// HANERIX PROXY
// ======================================================

function handleHanerix(
    req,
    res
) {

    const requestUrl =
        new URL(
            req.url,
            `http://${req.headers.host}`
        );

    let target =
        requestUrl.searchParams.get(
            "url"
        );

    if (
        !target
    ) {

        res.writeHead(
            400
        );

        res.end(
            "Missing url parameter"
        );

        return;
    }

    let parsed;

    try {

        parsed =
            new URL(
                target
            );

    } catch {

        res.writeHead(
            400
        );

        res.end(
            "Invalid URL"
        );

        return;
    }

    // ==================================================
    // HGLINK -> HANERIX
    // ==================================================

    if (
        parsed.hostname ===
            "hglink.to" ||
        parsed.hostname.endsWith(
            ".hglink.to"
        )
    ) {

        parsed.hostname =
            "hanerix.com";

        target =
            parsed.href;

        console.log(
            `[Hanerix Proxy] HGLINK convertido a: ${target}`
        );
    }

    if (
        !isHanerixHost(
            parsed.hostname
        )
    ) {

        res.writeHead(
            403
        );

        res.end(
            "Hanerix host not allowed"
        );

        return;
    }

    console.log(
        `[Hanerix Proxy] -> ${target}`
    );

    fetchHttps(
        target,
        HANERIX_HEADERS,
        (
            error,
            upstream
        ) => {

            if (
                error
            ) {

                console.error(
                    "[Hanerix Proxy] Error:",
                    error.message
                );

                res.writeHead(
                    502
                );

                res.end(
                    "Hanerix upstream error"
                );

                return;
            }

            let body =
                "";

            upstream.setEncoding(
                "utf8"
            );

            upstream.on(
                "data",
                chunk => {

                    body += chunk;
                }
            );

            upstream.on(
                "end",
                () => {

                    console.log(
                        `[Hanerix Proxy] Status: ${upstream.statusCode}`
                    );

                    console.log(
                        `[Hanerix Proxy] HTML length: ${body.length}`
                    );

                    res.writeHead(
                        upstream.statusCode ||
                        502,
                        {
                            "Content-Type":
                                "text/html; charset=utf-8",

                            "Access-Control-Allow-Origin":
                                "*",

                            "Cache-Control":
                                "no-cache"
                        }
                    );

                    res.end(
                        body
                    );
                }
            );
        }
    );
}


// ======================================================
// HTTP SERVER
// ======================================================

const server =
    http.createServer(
        (
            req,
            res
        ) => {

            console.log(
                `${req.method} ${req.url}`
            );

            // --------------------------------------------------
            // CORS
            // --------------------------------------------------

            res.setHeader(
                "Access-Control-Allow-Origin",
                "*"
            );

            res.setHeader(
                "Access-Control-Allow-Methods",
                "GET, OPTIONS"
            );

            res.setHeader(
                "Access-Control-Allow-Headers",
                "*"
            );

            if (
                req.method ===
                "OPTIONS"
            ) {

                res.writeHead(
                    200
                );

                res.end();

                return;
            }

            const ip =
                getLocalIp();

            const proxyBase =
                BASE_URL ||
                `http://${ip}:${PORT}`;

            // ==================================================
            // HANERIX
            // ==================================================

            if (
                req.url.startsWith(
                    "/hanerix"
                )
            ) {

                handleHanerix(
                    req,
                    res
                );

                return;
            }

            // ==================================================
            // STREAMWISH PLAYLIST
            // ==================================================

            if (
                req.url.startsWith(
                    "/streamwish/playlist.m3u8"
                )
            ) {

                handleStreamwishPlaylist(
                    req,
                    res,
                    proxyBase
                );

                return;
            }

            // ==================================================
            // STREAMWISH SEGMENT
            // ==================================================

            if (
                req.url.startsWith(
                    "/streamwish/segment"
                )
            ) {

                handleStreamwishSegment(
                    req,
                    res
                );

                return;
            }

            // ==================================================
            // ARCHIVOS NORMALES
            // ==================================================

            let filePath =
                path.join(
                    __dirname,
                    req.url === "/"
                        ? "index.html"
                        : req.url
                );

            // Seguridad
            if (
                !filePath.startsWith(
                    __dirname
                )
            ) {

                res.writeHead(
                    403
                );

                res.end(
                    "Forbidden"
                );

                return;
            }

            const extname =
                path.extname(
                    filePath
                );

            const contentType =
                mimeTypes[
                    extname
                ] ||
                "application/octet-stream";

            fs.readFile(
                filePath,
                (
                    err,
                    content
                ) => {

                    if (
                        err
                    ) {

                        if (
                            err.code ===
                            "ENOENT"
                        ) {

                            if (
                                req.url ===
                                "/"
                            ) {

                                res.writeHead(
                                    200,
                                    {
                                        "Content-Type":
                                            "text/plain"
                                    }
                                );

                                res.end(
                                    "Nuvio Providers Server Running. Access /manifest.json to see the manifest."
                                );

                                return;
                            }

                            res.writeHead(
                                404
                            );

                            res.end(
                                `File not found: ${req.url}`
                            );

                            return;
                        }

                        res.writeHead(
                            500
                        );

                        res.end(
                            `Server Error: ${err.code}`
                        );

                        return;
                    }

                    res.writeHead(
                        200,
                        {
                            "Content-Type":
                                contentType
                        }
                    );

                    res.end(
                        content
                    );
                }
            );
        }
    );


// ======================================================
// START
// ======================================================

server.listen(
    PORT,
    () => {

        const ip =
            getLocalIp();

        const publicBase =
            BASE_URL ||
            `http://${ip}:${PORT}`;

        console.log("");

        console.log(
            `🚀 Server running at: ${publicBase}/`
        );

        console.log(
            `📝 Manifest URL:      ${publicBase}/manifest.json`
        );

        console.log(
            `🎬 StreamWish Proxy: ${publicBase}/streamwish/playlist.m3u8?url=...`
        );

        console.log(
            `🌐 Hanerix Proxy:     ${publicBase}/hanerix?url=...`
        );

        console.log("");

        console.log(
            "Press Ctrl+C to stop"
        );

        console.log("");
    }
);