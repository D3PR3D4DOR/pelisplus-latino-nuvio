/**
 * Embed69 Resolver
 */

import { fetchText } from "./http.js";
import { solvePow } from "./pow.js";
import { decryptAES } from "./crypto.js";

export async function resolveEmbed69(url) {
    console.log(`[Embed69] Opening: ${url}`);

    const html = await fetchText(url);

    const challenge = extractChallenge(html);
    const difficulty = extractDifficulty(html);
    const salt = extractSalt(html);
    const dataLink = extractDataLink(html);

    if (!challenge || !Number.isInteger(difficulty) || difficulty < 0 || !salt) {
        throw new Error("[Embed69] No se pudieron extraer los datos de Proof of Work.");
    }

    if (!Array.isArray(dataLink)) {
        throw new Error("[Embed69] No se pudo extraer dataLink.");
    }

    const { aesKey } = await solvePow(challenge, difficulty, salt);

    for (const file of dataLink) {
        for (const embedsKey of ["sortedEmbeds", "downloadEmbeds"]) {
            const embeds = file?.[embedsKey];

            if (!Array.isArray(embeds)) {
                continue;
            }

            for (const embed of embeds) {
                if (!embed?.link || typeof embed.link !== "string") {
                    continue;
                }

                const link = await decryptAES(embed.link, aesKey);

                if (link) {
                    embed.link = link;
                }
            }
        }
    }

    return dataLink;
}

function extractChallenge(html) {

    const match = html.match(
        /const\s+POW_CHALLENGE\s*=\s*['"]([^'"]+)['"]/
    );

    return match ? match[1] : "";
}

function extractDifficulty(html) {

    const match = html.match(
        /const\s+POW_DIFFICULTY\s*=\s*(\d+)/
    );

    return match ? Number(match[1]) : 0;
}

function extractSalt(html) {

    const match = html.match(
        /const\s+POW_SALT\s*=\s*['"]([^'"]+)['"]/
    );

    return match ? match[1] : "";
}

function extractDataLink(html) {
    const match = html.match(
        /let\s+dataLink\s*=\s*(\[[\s\S]*?\]);/
    );

    if (!match) {
        return null;
    }

    try {
        return JSON.parse(match[1]);
    } catch (err) {
        throw new Error(`[Embed69] Error parseando dataLink: ${err.message}`);
    }
}
