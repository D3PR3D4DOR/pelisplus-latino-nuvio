async function sha256Hex(text) {

    const data = new TextEncoder().encode(text);

    const hash = await crypto.subtle.digest("SHA-256", data);

    return [...new Uint8Array(hash)]
        .map(v => v.toString(16).padStart(2, "0"))
        .join("");

}

async function sha256Bytes(text) {

    const data = new TextEncoder().encode(text);

    const hash = await crypto.subtle.digest("SHA-256", data);

    return new Uint8Array(hash);

}

export async function solvePow(challenge, difficulty, salt) {

    const prefix = "0".repeat(difficulty);

    let nonce = 0;

    while (true) {

        const hash = await sha256Hex(challenge + nonce);

        if (hash.startsWith(prefix)) {

            const aesKey = await sha256Bytes(
                challenge + nonce + salt
            );

            return {
                nonce,
                aesKey
            };

        }

        nonce++;

    }

}