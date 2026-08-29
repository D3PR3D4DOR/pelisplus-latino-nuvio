/**
 * Latanime Provider
 * Debug entry point.
 */

import { extractStreams } from './extractor.js';

async function getStreams(tmdbId, mediaType, season, episode) {
    console.log('[Latanime] getStreams()');
    console.log('[Latanime] tmdbId:', tmdbId);
    console.log('[Latanime] mediaType:', mediaType);
    console.log('[Latanime] season:', season);
    console.log('[Latanime] episode:', episode);

    try {
        const streams = await extractStreams(
            tmdbId,
            mediaType,
            season,
            episode
        );

        console.log('[Latanime] streams:', streams);
        return streams;
    } catch (error) {
        console.error('[Latanime] Error:', error.message);
        return [];
    }
}

module.exports = { getStreams };