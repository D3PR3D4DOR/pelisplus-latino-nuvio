/**
 * HLS master playlist utilities.
 */

export function extractHlsVariants(playlist, masterUrl) {
    const lines = playlist.split(/\r?\n/);
    const variants = [];

    for (let index = 0; index < lines.length; index++) {
        const streamInfo = lines[index].trim();

        if (!streamInfo.startsWith("#EXT-X-STREAM-INF:")) {
            continue;
        }

        const location = lines.slice(index + 1).find(line => {
            const value = line.trim();

            return value && !value.startsWith("#");
        });

        if (!location) {
            continue;
        }

        const resolution = streamInfo.match(/(?:^|,)RESOLUTION=\d+x(\d+)(?:,|$)/i);
        const name = streamInfo.match(/(?:^|,)NAME="?([^",]+)"?(?:,|$)/i);

        variants.push({
            url: new URL(location.trim(), masterUrl).href,
            quality: resolution ? `${resolution[1]}p` : (name ? name[1] : "auto")
        });
    }

    return variants;
}
