import { resolveMp4Upload } from "./mp4upload.js";
import { resolveHexload } from "./hexload.js";
import { resolveMixdrop } from "./mixdrop.js";

export function getResolver(serverName) {

    const name =
        String(serverName || "")
            .toLowerCase()
            .trim();

    if (name.includes("mp4upload")) {
        return resolveMp4Upload;
    }

    if (name.includes("hexload")) {
        return resolveHexload;
    }

    if (name.includes("mixdrop")) {
        return resolveMixdrop;
    }

    return null;
}
