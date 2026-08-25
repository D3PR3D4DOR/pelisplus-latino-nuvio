/**
 * Embed69 AES
 */

function base64ToBytes(base64) {

    const binary = atob(base64);

    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
}

export async function decryptAES(encryptedBase64, aesKey) {

    try {

        const raw = base64ToBytes(encryptedBase64);

        const iv = raw.slice(0, 16);

        const ciphertext = raw.slice(16);

        const key = await crypto.subtle.importKey(
            "raw",
            aesKey.slice(0, 32),
            { name: "AES-CBC" },
            false,
            ["decrypt"]
        );

        const decrypted = await crypto.subtle.decrypt(
            {
                name: "AES-CBC",
                iv
            },
            key,
            ciphertext
        );

        return new TextDecoder().decode(decrypted);

    } catch (err) {

        console.error("[AES]", err);

        return null;

    }

}