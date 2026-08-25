/**
 * PelisPlusHD Movie Loader
 */

import { fetchText } from './http.js';

export async function loadMovie(url) {

    console.log(`[PelisPlusHD] Loading: ${url}`);

    return await fetchText(url);

}