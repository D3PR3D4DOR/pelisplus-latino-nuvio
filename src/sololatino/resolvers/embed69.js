import {
    fetchText
} from "../http.js";


// ==========================================================
// EMBED69 RESOLVER
// ==========================================================

export async function resolveEmbed69(
    url
) {

    if (
        !url ||
        typeof url !== "string"
    ) {

        throw new Error(
            "Embed69: URL inválida"
        );
    }

    console.log(
        "[Embed69] Opening:",
        url
    );

    const html =
        await fetchText(
            url
        );

    // ------------------------------------------------------
    // Datos necesarios para el PoW
    // ------------------------------------------------------

    const challengeMatch =
        html.match(
            /const\s+POW_CHALLENGE\s*=\s*['"]([^'"]+)['"]/
        );

    const difficultyMatch =
        html.match(
            /const\s+POW_DIFFICULTY\s*=\s*(\d+)/
        );

    const saltMatch =
        html.match(
            /const\s+POW_SALT\s*=\s*['"]([^'"]+)['"]/
        );

    const dataMatch =
        html.match(
            /let\s+dataLink\s*=\s*(\[[\s\S]*?\]);/
        );

    if (
        !challengeMatch ||
        !difficultyMatch ||
        !saltMatch ||
        !dataMatch
    ) {

        throw new Error(
            "Embed69: no se encontraron los datos necesarios"
        );
    }

    const challenge =
        challengeMatch[1];

    const difficulty =
        Number(
            difficultyMatch[1]
        );

    const salt =
        saltMatch[1];

    let dataLink;

    try {

        dataLink =
            JSON.parse(
                dataMatch[1]
            );

    } catch {

        throw new Error(
            "Embed69: dataLink no es JSON válido"
        );
    }

    if (
        !Array.isArray(
            dataLink
        )
    ) {

        throw new Error(
            "Embed69: dataLink no es un array"
        );
    }

    console.log(
        "[Embed69] Files:",
        dataLink.length
    );

    // ------------------------------------------------------
    // Resolver PoW
    // ------------------------------------------------------

    const {
        aesKey
    } =
        await solvePow(
            challenge,
            difficulty,
            salt
        );

    // ------------------------------------------------------
    // Descifrar enlaces
    // ------------------------------------------------------

    for (
        const file of
        dataLink
    ) {

        await decryptEmbeds(
            file?.sortedEmbeds,
            aesKey
        );

        await decryptEmbeds(
            file?.downloadEmbeds,
            aesKey
        );
    }

    return dataLink;
}


// ==========================================================
// DESCIFRAR LISTA DE EMBEDS
// ==========================================================

async function decryptEmbeds(
    embeds,
    aesKey
) {

    if (
        !Array.isArray(
            embeds
        )
    ) {

        return;
    }

    for (
        const embed of
        embeds
    ) {

        if (
            !embed?.link
        ) {

            continue;
        }

        try {

            const decrypted =
                await decryptAES(
                    embed.link,
                    aesKey
                );

            if (
                decrypted
            ) {

                embed.link =
                    decrypted;
            }

        } catch (
            error
        ) {

            console.warn(
                "[Embed69] Error descifrando embed:",
                error.message
            );
        }
    }
}


// ==========================================================
// PROOF OF WORK
// ==========================================================

async function solvePow(
    challenge,
    difficulty,
    salt
) {

    if (
        !Number.isFinite(
            difficulty
        ) ||
        difficulty < 0
    ) {

        throw new Error(
            "Embed69: dificultad PoW inválida"
        );
    }

    const target =
        "0".repeat(
            difficulty
        );

    let nonce =
        0;

    while (
        true
    ) {

        const hash =
            await sha256Hex(
                challenge +
                nonce
            );

        if (
            hash.startsWith(
                target
            )
        ) {

            console.log(
                "[Embed69] PoW solved:",
                nonce
            );

            const aesKey =
                await sha256Bytes(
                    challenge +
                    nonce +
                    salt
                );

            return {
                nonce,
                aesKey
            };
        }

        nonce++;
    }
}


// ==========================================================
// SHA-256
// ==========================================================

async function sha256Bytes(
    text
) {

    const data =
        new TextEncoder()
            .encode(
                text
            );

    const hash =
        await crypto.subtle.digest(
            "SHA-256",
            data
        );

    return new Uint8Array(
        hash
    );
}


async function sha256Hex(
    text
) {

    const bytes =
        await sha256Bytes(
            text
        );

    return Array.from(
        bytes
    )
        .map(
            byte =>
                byte
                    .toString(16)
                    .padStart(
                        2,
                        "0"
                    )
        )
        .join("");
}


// ==========================================================
// BASE64 → BYTES
// ==========================================================

function base64ToBytes(
    value
) {

    const binary =
        atob(
            value
        );

    const bytes =
        new Uint8Array(
            binary.length
        );

    for (
        let i = 0;
        i < binary.length;
        i++
    ) {

        bytes[i] =
            binary.charCodeAt(
                i
            );
    }

    return bytes;
}


// ==========================================================
// AES-CBC
// ==========================================================

async function decryptAES(
    encryptedBase64,
    aesKey
) {

    const raw =
        base64ToBytes(
            encryptedBase64
        );

    if (
        raw.length <= 16
    ) {

        throw new Error(
            "Ciphertext demasiado corto"
        );
    }

    const iv =
        raw.slice(
            0,
            16
        );

    const ciphertext =
        raw.slice(
            16
        );

    const key =
        await crypto.subtle.importKey(
            "raw",
            aesKey.slice(
                0,
                32
            ),
            {
                name:
                    "AES-CBC"
            },
            false,
            [
                "decrypt"
            ]
        );

    const decrypted =
        await crypto.subtle.decrypt(
            {
                name:
                    "AES-CBC",

                iv
            },

            key,

            ciphertext
        );

    return new TextDecoder()
        .decode(
            decrypted
        );
}
