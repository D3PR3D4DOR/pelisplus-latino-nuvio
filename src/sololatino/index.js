import { extractStreams } from "./extractor.js";

async function getStreams(
    tmdbId,
    mediaType,
    season,
    episode
) {
    return await extractStreams(
        tmdbId,
        mediaType,
        season,
        episode
    );
}

export {
    getStreams
};
