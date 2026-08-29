/**
 * sololatino - Built from src/sololatino/
 * Generated: 2026-08-29T00:28:31.913Z
 */
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/sololatino/index.js
var sololatino_exports = {};
__export(sololatino_exports, {
  getStreams: () => getStreams
});
module.exports = __toCommonJS(sololatino_exports);

// src/sololatino/http.js
var BASE_URL = "https://sololatino.net";
var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36";
var HEADERS = {
  "User-Agent": USER_AGENT,
  "Accept": "*/*",
  "Accept-Language": "es-AR,es;q=0.9,en;q=0.8"
};
function fetchText(_0) {
  return __async(this, arguments, function* (url, options = {}) {
    const response = yield fetch(
      url,
      __spreadProps(__spreadValues({}, options), {
        headers: __spreadValues(__spreadValues({}, HEADERS), options.headers || {})
      })
    );
    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${url}`
      );
    }
    return yield response.text();
  });
}
function fetchJson(_0) {
  return __async(this, arguments, function* (url, options = {}) {
    const text = yield fetchText(
      url,
      options
    );
    try {
      return JSON.parse(
        text
      );
    } catch (e) {
      throw new Error(
        `Respuesta JSON inv\xE1lida: ${url}`
      );
    }
  });
}
function getSetCookieHeader(response) {
  try {
    return response.headers.get(
      "set-cookie"
    ) || "";
  } catch (e) {
    return "";
  }
}
function getCookieValue(rawCookie, name) {
  if (!rawCookie || !name) {
    return null;
  }
  const regex = new RegExp(
    `(?:^|,\\s*)${escapeRegExp(name)}=([^;]+)`,
    "i"
  );
  const match = String(
    rawCookie
  ).match(
    regex
  );
  return match ? match[1] : null;
}
function buildCookieHeader(rawCookie) {
  if (!rawCookie) {
    return "";
  }
  const cookies = [];
  const xsrf = getCookieValue(
    rawCookie,
    "XSRF-TOKEN"
  );
  const session = getCookieValue(
    rawCookie,
    "sololatinonet-session"
  );
  if (xsrf) {
    cookies.push(
      `XSRF-TOKEN=${xsrf}`
    );
  }
  if (session) {
    cookies.push(
      `sololatinonet-session=${session}`
    );
  }
  return cookies.join(
    "; "
  );
}
function getXsrfToken(rawCookie) {
  const value = getCookieValue(
    rawCookie,
    "XSRF-TOKEN"
  );
  if (!value) {
    return null;
  }
  try {
    return decodeURIComponent(
      value
    );
  } catch (e) {
    return value;
  }
}
function escapeRegExp(value) {
  return String(
    value
  ).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

// src/sololatino/tmdb.js
var TMDB_API_KEY = "c9755d2e8df3a75213cae8e91c03e743";
var TMDB_BASE = "https://api.themoviedb.org/3";
function getMovie(tmdbId) {
  return __async(this, null, function* () {
    const url = `${TMDB_BASE}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=es-ES`;
    const data = yield fetchJson(
      url
    );
    const translations = yield getTranslations(
      tmdbId,
      "movie"
    );
    return {
      id: tmdbId,
      mediaType: "movie",
      title: data.title || "",
      originalTitle: data.original_title || "",
      year: getYear(
        data.release_date
      ),
      releaseDate: data.release_date || null,
      translationTitles: translations
    };
  });
}
function getTv(tmdbId) {
  return __async(this, null, function* () {
    const url = `${TMDB_BASE}/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=es-ES`;
    const data = yield fetchJson(
      url
    );
    const translations = yield getTranslations(
      tmdbId,
      "tv"
    );
    return {
      id: tmdbId,
      mediaType: "tv",
      title: data.name || "",
      originalTitle: data.original_name || "",
      year: getYear(
        data.first_air_date
      ),
      releaseDate: data.first_air_date || null,
      translationTitles: translations
    };
  });
}
function getTranslations(tmdbId, mediaType) {
  return __async(this, null, function* () {
    var _a, _b;
    const type = mediaType === "movie" ? "movie" : "tv";
    const url = `${TMDB_BASE}/${type}/${tmdbId}/translations?api_key=${TMDB_API_KEY}`;
    try {
      const data = yield fetchJson(
        url
      );
      if (!Array.isArray(
        data == null ? void 0 : data.translations
      )) {
        return [];
      }
      const titles = [];
      for (const translation of data.translations) {
        const value = mediaType === "movie" ? (_a = translation == null ? void 0 : translation.data) == null ? void 0 : _a.title : (_b = translation == null ? void 0 : translation.data) == null ? void 0 : _b.name;
        if (typeof value !== "string") {
          continue;
        }
        const title = value.trim();
        if (!title) {
          continue;
        }
        titles.push({
          title,
          language: (translation == null ? void 0 : translation.iso_639_1) || null,
          country: (translation == null ? void 0 : translation.iso_3166_1) || null
        });
      }
      const seen = /* @__PURE__ */ new Set();
      const unique = [];
      for (const item of titles) {
        const key = item.title.trim().toLowerCase();
        if (seen.has(
          key
        )) {
          continue;
        }
        seen.add(
          key
        );
        unique.push(
          item
        );
      }
      console.log(
        `[TMDB] Traducciones encontradas: ${unique.length}`
      );
      return unique;
    } catch (error) {
      console.warn(
        "[TMDB] No se pudieron obtener traducciones:",
        error.message
      );
      return [];
    }
  });
}
function getYear(date) {
  if (!date || typeof date !== "string") {
    return null;
  }
  const year = Number(
    date.slice(
      0,
      4
    )
  );
  return Number.isInteger(
    year
  ) ? year : null;
}

// src/sololatino/search.js
function searchSoloLatino(media) {
  return __async(this, null, function* () {
    const titleQueries = buildTitleQueries(
      media
    );
    console.log(
      `[SoloLatino] Title queries: ${titleQueries.length}`
    );
    console.log(
      "[SoloLatino] Searching ALL language titles..."
    );
    const allResults = [];
    for (const query of titleQueries) {
      console.log(
        "[SoloLatino] Searching title:",
        query
      );
      try {
        const results = yield searchByQuery(
          query
        );
        allResults.push(
          ...results
        );
      } catch (error) {
        console.warn(
          `[SoloLatino] Search failed for "${query}":`,
          error.message
        );
      }
    }
    let unique = deduplicateResults(
      allResults
    );
    console.log(
      `[SoloLatino] Results after language search: ${unique.length}`
    );
    const strong = findStrongMatch(
      unique,
      media
    );
    if (strong) {
      console.log(
        "[SoloLatino] Language search found:",
        strong.title
      );
      return unique;
    }
    const variantQueries = buildVariantQueries(
      media,
      titleQueries
    );
    console.log(
      `[SoloLatino] Additional variants: ${variantQueries.length}`
    );
    for (const query of variantQueries) {
      console.log(
        "[SoloLatino] Searching variant:",
        query
      );
      try {
        const results = yield searchByQuery(
          query
        );
        allResults.push(
          ...results
        );
        unique = deduplicateResults(
          allResults
        );
        const match = findStrongMatch(
          unique,
          media
        );
        if (match) {
          console.log(
            "[SoloLatino] Variant found:",
            match.title
          );
          return unique;
        }
      } catch (error) {
        console.warn(
          `[SoloLatino] Variant failed for "${query}":`,
          error.message
        );
      }
    }
    return unique;
  });
}
function buildTitleQueries(media) {
  const queries = [];
  addQuery(
    queries,
    media == null ? void 0 : media.title
  );
  addQuery(
    queries,
    media == null ? void 0 : media.originalTitle
  );
  if (Array.isArray(
    media == null ? void 0 : media.translationTitles
  )) {
    for (const translation of media.translationTitles) {
      const title = typeof translation === "string" ? translation : translation == null ? void 0 : translation.title;
      addQuery(
        queries,
        title
      );
    }
  }
  if (Array.isArray(
    media == null ? void 0 : media.alternativeTitles
  )) {
    for (const alternative of media.alternativeTitles) {
      const title = typeof alternative === "string" ? alternative : alternative == null ? void 0 : alternative.title;
      addQuery(
        queries,
        title
      );
    }
  }
  return queries;
}
function buildVariantQueries(media, originalQueries) {
  const variants = [];
  for (const title of originalQueries) {
    addVariant(
      variants,
      removeAccents(
        title
      )
    );
    if (/[-_]/.test(
      title
    )) {
      addVariant(
        variants,
        title.replace(
          /[-_]+/g,
          " "
        )
      );
    }
    if (/\s/.test(
      title
    )) {
      addVariant(
        variants,
        title.replace(
          /\s+/g,
          ""
        )
      );
    }
    const clean = removeAccents(
      title
    );
    if (/\s/.test(
      clean
    )) {
      addVariant(
        variants,
        clean.replace(
          /\s+/g,
          ""
        )
      );
    }
    if (/[^\p{L}\p{N}\s]/u.test(
      title
    )) {
      addVariant(
        variants,
        title.replace(
          /[^\p{L}\p{N}]+/gu,
          " "
        )
      );
    }
  }
  return variants;
}
function addQuery(queries, value) {
  if (typeof value !== "string") {
    return;
  }
  const query = value.trim();
  if (!query) {
    return;
  }
  const normalized = normalizeSearchValue(
    query
  );
  if (!normalized) {
    return;
  }
  if (queries.some(
    (existing) => normalizeSearchValue(
      existing
    ) === normalized
  )) {
    return;
  }
  queries.push(
    query
  );
}
function addVariant(variants, value) {
  if (typeof value !== "string") {
    return;
  }
  const variant = value.replace(
    /\s+/g,
    " "
  ).trim();
  if (!variant) {
    return;
  }
  const normalized = normalizeSearchValue(
    variant
  );
  if (!normalized) {
    return;
  }
  if (variants.some(
    (existing) => normalizeSearchValue(
      existing
    ) === normalized
  )) {
    return;
  }
  variants.push(
    variant
  );
}
function searchByQuery(query) {
  return __async(this, null, function* () {
    const url = `${BASE_URL}/buscar?q=` + encodeURIComponent(
      query
    );
    const html = yield fetchText(
      url
    );
    const results = [];
    const regex = /href=["']([^"']*\/(pelicula|serie)\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while (match = regex.exec(
      html
    )) {
      const rawUrl = match[1];
      const type = match[2].toLowerCase();
      const rawTitle = match[3].replace(
        /<[^>]+>/g,
        " "
      ).replace(
        /\s+/g,
        " "
      ).trim();
      if (!rawTitle) {
        continue;
      }
      const url2 = new URL(
        rawUrl,
        BASE_URL
      ).href;
      results.push({
        title: cleanResultTitle(
          rawTitle
        ),
        rawTitle,
        year: extractYear(
          rawTitle
        ),
        type,
        url: url2,
        slug: getSlug(
          url2
        )
      });
    }
    console.log(
      `[SoloLatino] Results for "${query}": ${results.length}`
    );
    return results;
  });
}
function findStrongMatch(results, media) {
  if (!Array.isArray(
    results
  )) {
    return null;
  }
  const wantedTitles = [
    media == null ? void 0 : media.title,
    media == null ? void 0 : media.originalTitle,
    ...Array.isArray(
      media == null ? void 0 : media.translationTitles
    ) ? media.translationTitles.map(
      (item) => typeof item === "string" ? item : item == null ? void 0 : item.title
    ) : [],
    ...Array.isArray(
      media == null ? void 0 : media.alternativeTitles
    ) ? media.alternativeTitles.map(
      (item) => typeof item === "string" ? item : item == null ? void 0 : item.title
    ) : []
  ].filter(Boolean).map(
    normalizeTitle
  ).filter(Boolean);
  const wantedType = (media == null ? void 0 : media.mediaType) === "movie" ? "pelicula" : "serie";
  for (const result of results) {
    if (result.type !== wantedType) {
      continue;
    }
    if ((media == null ? void 0 : media.year) && result.year && result.year !== media.year) {
      continue;
    }
    const resultTitle = normalizeTitle(
      result.title
    );
    const slug = normalizeTitle(
      result.slug || ""
    );
    for (const wanted of wantedTitles) {
      if (resultTitle === wanted || slug === wanted) {
        return result;
      }
    }
  }
  return null;
}
function normalizeTitle(value) {
  return String(
    value || ""
  ).normalize(
    "NFD"
  ).replace(
    /[\u0300-\u036f]/g,
    ""
  ).toLowerCase().replace(
    /[^a-z0-9]+/g,
    " "
  ).replace(
    /\s+/g,
    " "
  ).trim();
}
function normalizeSearchValue(value) {
  return String(
    value || ""
  ).normalize(
    "NFD"
  ).replace(
    /[\u0300-\u036f]/g,
    ""
  ).toLowerCase().replace(
    /\s+/g,
    " "
  ).trim();
}
function removeAccents(value) {
  return String(
    value || ""
  ).normalize(
    "NFD"
  ).replace(
    /[\u0300-\u036f]/g,
    ""
  );
}
function cleanResultTitle(value) {
  return String(
    value || ""
  ).replace(
    /^\s*(pel[ií]cula|serie|anime|dibujos?)\s*★?\s*\d+(?:\.\d+)?\s*/i,
    ""
  ).replace(
    /\b(19|20)\d{2}\b/g,
    " "
  ).replace(
    /\s+/g,
    " "
  ).trim();
}
function extractYear(value) {
  const match = String(
    value || ""
  ).match(
    /\b(19|20)\d{2}\b/
  );
  return match ? Number(
    match[0]
  ) : null;
}
function getSlug(url) {
  try {
    const parsed = new URL(
      url
    );
    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts.length ? parts[parts.length - 1] : "";
  } catch (e) {
    return "";
  }
}
function deduplicateResults(results) {
  const seen = /* @__PURE__ */ new Set();
  return results.filter(
    (result) => {
      if (!(result == null ? void 0 : result.url)) {
        return false;
      }
      if (seen.has(
        result.url
      )) {
        return false;
      }
      seen.add(
        result.url
      );
      return true;
    }
  );
}

// src/sololatino/series.js
function getEpisodeUrl(seriesUrl, season, episode) {
  return __async(this, null, function* () {
    if (!seriesUrl || !Number.isInteger(
      Number(season)
    ) || !Number.isInteger(
      Number(episode)
    )) {
      return null;
    }
    const seasonNumber = Number(season);
    const episodeNumber = Number(episode);
    console.log(
      `[SoloLatino] Buscando S${seasonNumber}E${episodeNumber}:`,
      seriesUrl
    );
    const html = yield fetchText(
      seriesUrl,
      {
        headers: {
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Referer": "https://sololatino.net/"
        }
      }
    );
    const directPath = `/temporada-${seasonNumber}/episodio-${episodeNumber}`;
    const directRegex = new RegExp(
      `href=["']([^"']*${escapeRegExp2(directPath)}[^"']*)["']`,
      "i"
    );
    const directMatch = html.match(
      directRegex
    );
    if (directMatch) {
      const url = new URL(
        decodeHtml(
          directMatch[1]
        ),
        seriesUrl
      ).href;
      console.log(
        "[SoloLatino] Episode encontrado:",
        url
      );
      return url;
    }
    const genericRegex = /href=["']([^"']*\/temporada-\d+\/episodio-\d+[^"']*)["']/gi;
    let match;
    while (match = genericRegex.exec(
      html
    )) {
      const href = decodeHtml(
        match[1]
      );
      const normalized = href.replace(
        /\\/g,
        "/"
      );
      const expected = `temporada-${seasonNumber}/episodio-${episodeNumber}`;
      if (normalized.toLowerCase().includes(
        expected.toLowerCase()
      )) {
        const url = new URL(
          normalized,
          seriesUrl
        ).href;
        console.log(
          "[SoloLatino] Episode encontrado:",
          url
        );
        return url;
      }
    }
    const jsonLdBlocks = extractJsonLd(
      html
    );
    for (const data of jsonLdBlocks) {
      const found = findEpisodeInJsonLd(
        data,
        seasonNumber,
        episodeNumber
      );
      if (found) {
        const url = new URL(
          found,
          seriesUrl
        ).href;
        console.log(
          "[SoloLatino] Episode JSON-LD:",
          url
        );
        return url;
      }
    }
    console.log(
      `[SoloLatino] No se encontr\xF3 S${seasonNumber}E${episodeNumber}`
    );
    return null;
  });
}
function extractJsonLd(html) {
  const blocks = [];
  const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while (match = regex.exec(
    html
  )) {
    const text = match[1].trim();
    if (!text) {
      continue;
    }
    try {
      blocks.push(
        JSON.parse(
          text
        )
      );
    } catch (e) {
    }
  }
  return blocks;
}
function findEpisodeInJsonLd(data, season, episode) {
  if (Array.isArray(
    data
  )) {
    for (const item of data) {
      const result = findEpisodeInJsonLd(
        item,
        season,
        episode
      );
      if (result) {
        return result;
      }
    }
    return null;
  }
  if (!data || typeof data !== "object") {
    return null;
  }
  const seasonNumber = Number(
    data.seasonNumber
  );
  const episodeNumber = Number(
    data.episodeNumber
  );
  if (seasonNumber === season && episodeNumber === episode) {
    if (data.url) {
      return data.url;
    }
    if (data.mainEntityOfPage) {
      if (typeof data.mainEntityOfPage === "string") {
        return data.mainEntityOfPage;
      }
      if (data.mainEntityOfPage.url) {
        return data.mainEntityOfPage.url;
      }
    }
  }
  for (const value of Object.values(
    data
  )) {
    if (value && typeof value === "object") {
      const result = findEpisodeInJsonLd(
        value,
        season,
        episode
      );
      if (result) {
        return result;
      }
    }
  }
  return null;
}
function decodeHtml(value) {
  return String(
    value || ""
  ).replace(
    /&amp;/gi,
    "&"
  ).replace(
    /&quot;/gi,
    '"'
  ).replace(
    /&#39;/gi,
    "'"
  ).replace(
    /&lt;/gi,
    "<"
  ).replace(
    /&gt;/gi,
    ">"
  ).replace(
    /&#x2F;/gi,
    "/"
  ).replace(
    /&#47;/gi,
    "/"
  );
}
function escapeRegExp2(value) {
  return String(
    value
  ).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

// src/sololatino/episode.js
function getEpisodeServers(episodeUrl) {
  return __async(this, null, function* () {
    var _a;
    if (!episodeUrl || typeof episodeUrl !== "string") {
      return [];
    }
    console.log(
      "[SoloLatino] Fetching episode:",
      episodeUrl
    );
    const html = yield fetchText(
      episodeUrl,
      {
        headers: {
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Referer": `${BASE_URL}/`
        }
      }
    );
    const servers = [];
    const regex = /<[^>]*data-server-btn[^>]*data-player-token=["']([^"']+)["'][^>]*>([\s\S]*?)<\/[^>]+>/gi;
    let match;
    while (match = regex.exec(html)) {
      const token = match[1];
      const label = match[2].replace(
        /<[^>]+>/g,
        " "
      ).replace(
        /\s+/g,
        " "
      ).trim();
      const before = html.slice(
        Math.max(
          0,
          match.index - 2e3
        ),
        match.index
      );
      const languageMatches = [
        ...before.matchAll(
          /data-lang-group=["']([^"']+)["']/gi
        )
      ];
      const language = languageMatches.length ? languageMatches[languageMatches.length - 1][1] : null;
      servers.push({
        label: label || "Servidor",
        language,
        playerToken: token,
        hasPlayerToken: Boolean(
          token
        ),
        episodeUrl
      });
    }
    console.log(
      "[SoloLatino] Servers found:",
      servers.length
    );
    for (const server of servers) {
      console.log(
        `[SoloLatino] ${server.label} | ${(_a = server.language) != null ? _a : "?"} | token=${server.hasPlayerToken}`
      );
    }
    return servers;
  });
}
function resolvePlayerUrl(server) {
  return __async(this, null, function* () {
    if (!(server == null ? void 0 : server.playerToken)) {
      throw new Error(
        "Servidor sin playerToken"
      );
    }
    if (!(server == null ? void 0 : server.episodeUrl)) {
      throw new Error(
        "Servidor sin episodeUrl"
      );
    }
    console.log(
      "[SoloLatino] Resolving player:",
      server.label
    );
    const csrfResponse = yield fetch(
      `${BASE_URL}/sanctum/csrf-cookie`,
      {
        headers: __spreadProps(__spreadValues({}, HEADERS), {
          "Accept": "*/*",
          "Referer": server.episodeUrl,
          "Origin": BASE_URL
        })
      }
    );
    console.log(
      "[SoloLatino] CSRF HTTP:",
      csrfResponse.status
    );
    if (csrfResponse.status !== 204) {
      throw new Error(
        `CSRF HTTP ${csrfResponse.status}`
      );
    }
    const rawCookie = getSetCookieHeader(
      csrfResponse
    );
    console.log(
      "[SoloLatino] CSRF Set-Cookie:",
      rawCookie.length
    );
    if (!rawCookie) {
      throw new Error(
        "No se recibi\xF3 Set-Cookie"
      );
    }
    const xsrfToken = getXsrfToken(
      rawCookie
    );
    if (!xsrfToken) {
      throw new Error(
        "No se obtuvo XSRF-TOKEN"
      );
    }
    const cookieHeader = buildCookieHeader(
      rawCookie
    );
    if (!cookieHeader) {
      throw new Error(
        "No se pudo construir Cookie header"
      );
    }
    console.log(
      "[SoloLatino] Cookie header:",
      cookieHeader.length
    );
    const response = yield fetch(
      `${BASE_URL}/api/player-url`,
      {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "X-XSRF-TOKEN": xsrfToken,
          "Cookie": cookieHeader,
          "Referer": server.episodeUrl,
          "Origin": BASE_URL,
          "User-Agent": HEADERS["User-Agent"]
        },
        body: JSON.stringify({
          t: server.playerToken
        })
      }
    );
    console.log(
      "[SoloLatino] player-url HTTP:",
      response.status
    );
    const text = yield response.text();
    console.log(
      "[SoloLatino] player-url response:",
      text
    );
    if (!response.ok) {
      throw new Error(
        `player-url HTTP ${response.status}: ${text}`
      );
    }
    let data;
    try {
      data = JSON.parse(
        text
      );
    } catch (e) {
      throw new Error(
        "player-url no devolvi\xF3 JSON v\xE1lido"
      );
    }
    if (!(data == null ? void 0 : data.url)) {
      throw new Error(
        "player-url no devolvi\xF3 una URL"
      );
    }
    return {
      url: data.url,
      type: data.type || "iframe",
      server: server.label,
      language: server.language || null
    };
  });
}

// src/sololatino/resolvers/embed69.js
function resolveEmbed69(url) {
  return __async(this, null, function* () {
    if (!url || typeof url !== "string") {
      throw new Error(
        "Embed69: URL inv\xE1lida"
      );
    }
    console.log(
      "[Embed69] Opening:",
      url
    );
    const html = yield fetchText(
      url
    );
    const challengeMatch = html.match(
      /const\s+POW_CHALLENGE\s*=\s*['"]([^'"]+)['"]/
    );
    const difficultyMatch = html.match(
      /const\s+POW_DIFFICULTY\s*=\s*(\d+)/
    );
    const saltMatch = html.match(
      /const\s+POW_SALT\s*=\s*['"]([^'"]+)['"]/
    );
    const dataMatch = html.match(
      /let\s+dataLink\s*=\s*(\[[\s\S]*?\]);/
    );
    if (!challengeMatch || !difficultyMatch || !saltMatch || !dataMatch) {
      throw new Error(
        "Embed69: no se encontraron los datos necesarios"
      );
    }
    const challenge = challengeMatch[1];
    const difficulty = Number(
      difficultyMatch[1]
    );
    const salt = saltMatch[1];
    let dataLink;
    try {
      dataLink = JSON.parse(
        dataMatch[1]
      );
    } catch (e) {
      throw new Error(
        "Embed69: dataLink no es JSON v\xE1lido"
      );
    }
    if (!Array.isArray(
      dataLink
    )) {
      throw new Error(
        "Embed69: dataLink no es un array"
      );
    }
    console.log(
      "[Embed69] Files:",
      dataLink.length
    );
    const {
      aesKey
    } = yield solvePow(
      challenge,
      difficulty,
      salt
    );
    for (const file of dataLink) {
      yield decryptEmbeds(
        file == null ? void 0 : file.sortedEmbeds,
        aesKey
      );
      yield decryptEmbeds(
        file == null ? void 0 : file.downloadEmbeds,
        aesKey
      );
    }
    return dataLink;
  });
}
function decryptEmbeds(embeds, aesKey) {
  return __async(this, null, function* () {
    if (!Array.isArray(
      embeds
    )) {
      return;
    }
    for (const embed of embeds) {
      if (!(embed == null ? void 0 : embed.link)) {
        continue;
      }
      try {
        const decrypted = yield decryptAES(
          embed.link,
          aesKey
        );
        if (decrypted) {
          embed.link = decrypted;
        }
      } catch (error) {
        console.warn(
          "[Embed69] Error descifrando embed:",
          error.message
        );
      }
    }
  });
}
function solvePow(challenge, difficulty, salt) {
  return __async(this, null, function* () {
    if (!Number.isFinite(
      difficulty
    ) || difficulty < 0) {
      throw new Error(
        "Embed69: dificultad PoW inv\xE1lida"
      );
    }
    const target = "0".repeat(
      difficulty
    );
    let nonce = 0;
    while (true) {
      const hash = yield sha256Hex(
        challenge + nonce
      );
      if (hash.startsWith(
        target
      )) {
        console.log(
          "[Embed69] PoW solved:",
          nonce
        );
        const aesKey = yield sha256Bytes(
          challenge + nonce + salt
        );
        return {
          nonce,
          aesKey
        };
      }
      nonce++;
    }
  });
}
function sha256Bytes(text) {
  return __async(this, null, function* () {
    const data = new TextEncoder().encode(
      text
    );
    const hash = yield crypto.subtle.digest(
      "SHA-256",
      data
    );
    return new Uint8Array(
      hash
    );
  });
}
function sha256Hex(text) {
  return __async(this, null, function* () {
    const bytes = yield sha256Bytes(
      text
    );
    return Array.from(
      bytes
    ).map(
      (byte) => byte.toString(16).padStart(
        2,
        "0"
      )
    ).join("");
  });
}
function base64ToBytes(value) {
  const binary = atob(
    value
  );
  const bytes = new Uint8Array(
    binary.length
  );
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(
      i
    );
  }
  return bytes;
}
function decryptAES(encryptedBase64, aesKey) {
  return __async(this, null, function* () {
    const raw = base64ToBytes(
      encryptedBase64
    );
    if (raw.length <= 16) {
      throw new Error(
        "Ciphertext demasiado corto"
      );
    }
    const iv = raw.slice(
      0,
      16
    );
    const ciphertext = raw.slice(
      16
    );
    const key = yield crypto.subtle.importKey(
      "raw",
      aesKey.slice(
        0,
        32
      ),
      {
        name: "AES-CBC"
      },
      false,
      [
        "decrypt"
      ]
    );
    const decrypted = yield crypto.subtle.decrypt(
      {
        name: "AES-CBC",
        iv
      },
      key,
      ciphertext
    );
    return new TextDecoder().decode(
      decrypted
    );
  });
}

// src/sololatino/hls.js
function extractHlsVariants(playlist, masterUrl) {
  if (!playlist || typeof playlist !== "string") {
    return [];
  }
  const lines = playlist.split(
    /\r?\n/
  );
  const variants = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith(
      "#EXT-X-STREAM-INF:"
    )) {
      continue;
    }
    let location = null;
    for (let j = i + 1; j < lines.length; j++) {
      const candidate = lines[j].trim();
      if (!candidate) {
        continue;
      }
      if (candidate.startsWith(
        "#"
      )) {
        continue;
      }
      location = candidate;
      break;
    }
    if (!location) {
      continue;
    }
    let resolvedUrl;
    try {
      resolvedUrl = new URL(
        location,
        masterUrl
      ).href;
    } catch (e) {
      continue;
    }
    const resolution = line.match(
      /RESOLUTION=\s*\d+x(\d+)/i
    );
    let quality = "auto";
    if (resolution) {
      quality = `${resolution[1]}p`;
    }
    const bandwidth = line.match(
      /BANDWIDTH=\s*(\d+)/i
    );
    variants.push({
      url: resolvedUrl,
      quality,
      bandwidth: bandwidth ? Number(
        bandwidth[1]
      ) : null
    });
  }
  return variants;
}
function sortByQuality(variants) {
  return [
    ...Array.isArray(
      variants
    ) ? variants : []
  ].sort(
    (a, b) => qualityNumber(
      b == null ? void 0 : b.quality
    ) - qualityNumber(
      a == null ? void 0 : a.quality
    )
  );
}
function qualityNumber(quality) {
  const match = String(
    quality || ""
  ).match(
    /(\d+)p/i
  );
  if (!match) {
    return 0;
  }
  return Number(
    match[1]
  );
}
function deduplicateVariants(variants) {
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  for (const variant of Array.isArray(
    variants
  ) ? variants : []) {
    if (!(variant == null ? void 0 : variant.url)) {
      continue;
    }
    if (seen.has(
      variant.url
    )) {
      continue;
    }
    seen.add(
      variant.url
    );
    result.push(
      variant
    );
  }
  return result;
}
function parseHlsPlaylist(playlist, masterUrl) {
  const variants = extractHlsVariants(
    playlist,
    masterUrl
  );
  const unique = deduplicateVariants(
    variants
  );
  return sortByQuality(
    unique
  );
}

// src/sololatino/resolvers/vidhide.js
function resolveVidhide(url) {
  return __async(this, null, function* () {
    if (!url || typeof url !== "string") {
      throw new Error(
        "Vidhide: URL inv\xE1lida"
      );
    }
    console.log(
      "[Vidhide] Opening:",
      url
    );
    const html = yield fetchText(
      url
    );
    const unpacked = unpackPacker(
      html
    );
    const sources = extractSources(
      unpacked,
      url
    );
    if (sources.length === 0) {
      throw new Error(
        "Vidhide: no se encontraron fuentes HLS"
      );
    }
    console.log(
      "[Vidhide] Sources:",
      sources.length
    );
    const streams = [];
    for (const source of sources) {
      try {
        console.log(
          "[Vidhide] Master:",
          source.url
        );
        const controller = new AbortController();
        const timeout = setTimeout(
          () => controller.abort(),
          1e4
        );
        let response;
        try {
          response = yield fetch(
            source.url,
            {
              headers: __spreadProps(__spreadValues({}, HEADERS), {
                Referer: url,
                Origin: new URL(
                  url
                ).origin
              }),
              signal: controller.signal
            }
          );
        } finally {
          clearTimeout(
            timeout
          );
        }
        console.log(
          "[Vidhide] HTTP:",
          response.status
        );
        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}`
          );
        }
        const playlist = yield response.text();
        console.log(
          "[Vidhide] Playlist:",
          playlist.length
        );
        console.log(
          "[Vidhide] HLS:",
          playlist.trimStart().startsWith(
            "#EXTM3U"
          )
        );
        const variants = parseHlsPlaylist(
          playlist,
          source.url
        );
        console.log(
          "[Vidhide] Variants:",
          variants.length
        );
        if (variants.length > 0) {
          streams.push(
            ...variants
          );
          continue;
        }
        streams.push({
          url: source.url,
          quality: source.quality || "auto"
        });
      } catch (error) {
        console.warn(
          "[Vidhide] Error:",
          error.message
        );
        streams.push({
          url: source.url,
          quality: source.quality || "auto"
        });
      }
    }
    const result = deduplicateStreams(
      streams
    );
    console.log(
      "[Vidhide] Returning:",
      result.length
    );
    return result;
  });
}
function extractSources(source, pageUrl) {
  const sources = [];
  const matches = source.matchAll(
    /["'](hls4|hls3|hls2)["']\s*:\s*["']([^"']+)["']/gi
  );
  for (const match of matches) {
    const type = match[1].toLowerCase();
    let value = match[2];
    value = value.replace(
      /\\\//g,
      "/"
    ).replace(
      /\\u002f/gi,
      "/"
    ).replace(
      /\\u003a/gi,
      ":"
    ).replace(
      /&amp;/gi,
      "&"
    );
    let absoluteUrl;
    try {
      absoluteUrl = new URL(
        value,
        pageUrl
      ).href;
    } catch (e) {
      continue;
    }
    if (!absoluteUrl.includes(
      ".m3u8"
    )) {
      continue;
    }
    sources.push({
      url: absoluteUrl,
      quality: "auto",
      priority: Number(
        type.slice(
          -1
        )
      )
    });
  }
  return deduplicateSources(
    sources
  ).sort(
    (a, b) => b.priority - a.priority
  ).slice(
    0,
    1
  );
}
function unpackPacker(html) {
  const match = html.match(
    /eval\(function\(p,a,c,k,e,d\)\{[\s\S]*?\}\('((?:\\.|[^'])*)',(\d+),(\d+),'((?:\\.|[^'])*)'\.split\('\|'\)\)\)/
  );
  if (!match) {
    return html;
  }
  let source = decodePackedString(
    match[1]
  );
  const base = Number(
    match[2]
  );
  const count = Number(
    match[3]
  );
  const dictionary = decodePackedString(
    match[4]
  ).split(
    "|"
  );
  for (let index = count - 1; index >= 0; index--) {
    const replacement = dictionary[index];
    if (!replacement) {
      continue;
    }
    const token = index.toString(
      base
    );
    source = source.replace(
      new RegExp(
        `\\b${token}\\b`,
        "g"
      ),
      replacement
    );
  }
  return source;
}
function decodePackedString(value) {
  return String(
    value || ""
  ).replace(
    /\\(x[\da-fA-F]{2}|u[\da-fA-F]{4}|.)/g,
    (match, escape) => {
      var _a;
      if (escape.startsWith(
        "x"
      )) {
        return String.fromCharCode(
          Number.parseInt(
            escape.slice(1),
            16
          )
        );
      }
      if (escape.startsWith(
        "u"
      )) {
        return String.fromCharCode(
          Number.parseInt(
            escape.slice(1),
            16
          )
        );
      }
      const escapes = {
        b: "\b",
        f: "\f",
        n: "\n",
        r: "\r",
        t: "	",
        v: "\v"
      };
      return (_a = escapes[escape]) != null ? _a : escape;
    }
  );
}
function deduplicateSources(sources) {
  const seen = /* @__PURE__ */ new Set();
  return sources.filter(
    (source) => {
      if (!(source == null ? void 0 : source.url)) {
        return false;
      }
      if (seen.has(
        source.url
      )) {
        return false;
      }
      seen.add(
        source.url
      );
      return true;
    }
  );
}
function deduplicateStreams(streams) {
  const seen = /* @__PURE__ */ new Set();
  return streams.filter(
    (stream) => {
      if (!(stream == null ? void 0 : stream.url)) {
        return false;
      }
      if (seen.has(
        stream.url
      )) {
        return false;
      }
      seen.add(
        stream.url
      );
      return true;
    }
  );
}

// src/sololatino/resolvers/streamwish2.js
var PROXY_BASE = "https://plugin1.duckdns.org";
function resolveStreamwish2(url) {
  return __async(this, null, function* () {
    console.log(
      `[StreamWish2] Opening: ${url}`
    );
    const hanerixUrl = getHanerixUrl(
      url
    );
    if (!hanerixUrl) {
      throw new Error(
        `[StreamWish2] No se pudo convertir la URL a Hanerix: ${url}`
      );
    }
    console.log(
      `[StreamWish2] Hanerix: ${hanerixUrl}`
    );
    const proxyPlayerUrl = `${PROXY_BASE}/hanerix?url=` + encodeURIComponent(
      hanerixUrl
    );
    console.log(
      `[StreamWish2] Hanerix proxy: ${proxyPlayerUrl}`
    );
    const player = yield fetchPage(
      proxyPlayerUrl,
      "https://hglink.to/"
    );
    player.url = hanerixUrl;
    console.log(
      `[StreamWish2] Hanerix HTML length: ${player.html.length}`
    );
    if (player.html.length < 2e3) {
      throw new Error(
        `[StreamWish2] Hanerix devolvi\xF3 un HTML inesperadamente peque\xF1o: ${player.html.length} bytes`
      );
    }
    const unpacked = unpackPacker2(
      player.html
    );
    const hlsSources = extractHlsSources(
      unpacked,
      player.url
    );
    console.log(
      `[StreamWish2] HLS sources: ${hlsSources.length}`
    );
    for (const source of hlsSources) {
      console.log(
        `[StreamWish2] ${source.type} -> ${source.url}`
      );
    }
    const masterSource = hlsSources.find(
      (source) => source.type === "hls3"
    ) || hlsSources.find(
      (source) => source.type === "hls4"
    ) || hlsSources.find(
      (source) => source.type === "hls2"
    );
    if (!masterSource) {
      throw new Error(
        `[StreamWish2] No se encontr\xF3 ninguna fuente HLS. ${getHlsDiagnostic(
          unpacked,
          player.html
        )}`
      );
    }
    const masterUrl = masterSource.url;
    console.log(
      `[StreamWish2] Master: ${masterUrl}`
    );
    const master = yield fetchHls(
      masterUrl,
      hanerixUrl
    );
    console.log(
      `[StreamWish2] Master HTTP ${master.status}`
    );
    console.log(
      `[StreamWish2] Master length: ${master.text.length}`
    );
    const variants = extractHlsVariants2(
      master.text,
      masterUrl
    );
    console.log(
      `[StreamWish2] Variants encontrados: ${variants.length}`
    );
    for (const variant of variants) {
      console.log(
        `[StreamWish2] ${variant.quality} -> ${variant.url}`
      );
    }
    if (variants.length === 0) {
      throw new Error(
        "[StreamWish2] No se encontraron variantes HLS en el master."
      );
    }
    const streams = [];
    const seen = /* @__PURE__ */ new Set();
    for (const variant of variants) {
      if (!(variant == null ? void 0 : variant.url)) {
        continue;
      }
      if (seen.has(
        variant.url
      )) {
        continue;
      }
      seen.add(
        variant.url
      );
      const proxyUrl = `${PROXY_BASE}/streamwish/playlist.m3u8?url=` + encodeURIComponent(
        variant.url
      );
      streams.push({
        url: proxyUrl,
        quality: variant.quality || "auto"
      });
      console.log(
        `[StreamWish2] Proxy ${variant.quality}: ${proxyUrl}`
      );
    }
    streams.sort(
      (a, b) => qualityNumber2(
        b.quality
      ) - qualityNumber2(
        a.quality
      )
    );
    console.log(
      `[StreamWish2] Returning ${streams.length} streams`
    );
    return streams;
  });
}
function getHanerixUrl(url) {
  try {
    const parsed = new URL(
      url
    );
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === "hglink.to" || hostname.endsWith(
      ".hglink.to"
    )) {
      parsed.hostname = "hanerix.com";
      return parsed.href;
    }
    if (hostname === "hanerix.com" || hostname.endsWith(
      ".hanerix.com"
    )) {
      return parsed.href;
    }
    return null;
  } catch (e) {
    return null;
  }
}
function fetchPage(url, referer) {
  return __async(this, null, function* () {
    const headers = __spreadValues({}, HEADERS);
    if (referer) {
      headers.Referer = referer;
    }
    const response = yield fetch(
      url,
      {
        headers,
        redirect: "follow"
      }
    );
    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status} for ${url}`
      );
    }
    return {
      url: response.url || url,
      html: yield response.text()
    };
  });
}
function fetchHls(url, referer) {
  return __async(this, null, function* () {
    const refererUrl = new URL(
      referer
    );
    const response = yield fetch(
      url,
      {
        headers: __spreadProps(__spreadValues({}, HEADERS), {
          Referer: referer,
          Origin: refererUrl.origin
        })
      }
    );
    if (!response.ok) {
      throw new Error(
        `[StreamWish2] HLS HTTP ${response.status}: ${url}`
      );
    }
    return {
      url,
      status: response.status,
      text: yield response.text()
    };
  });
}
function extractHlsSources(source, pageUrl) {
  const sources = [];
  const pattern1 = /["']?(hls[234])["']?\s*:\s*["']([^"']+)["']/gi;
  let match;
  while ((match = pattern1.exec(
    source
  )) !== null) {
    addHlsSource(
      sources,
      match[1],
      match[2],
      pageUrl
    );
  }
  const pattern2 = /\b(hls[234])\b\s*=\s*["']([^"']+)["']/gi;
  while ((match = pattern2.exec(
    source
  )) !== null) {
    addHlsSource(
      sources,
      match[1],
      match[2],
      pageUrl
    );
  }
  return sources;
}
function addHlsSource(sources, type, value, pageUrl) {
  const normalizedType = String(
    type || ""
  ).toLowerCase().trim();
  if (normalizedType !== "hls2" && normalizedType !== "hls3" && normalizedType !== "hls4") {
    return;
  }
  let cleanValue = String(
    value || ""
  );
  cleanValue = cleanValue.replace(
    /\\\//g,
    "/"
  ).replace(
    /\\u002f/gi,
    "/"
  ).replace(
    /\\u003a/gi,
    ":"
  ).replace(
    /&amp;/gi,
    "&"
  );
  try {
    const absoluteUrl = new URL(
      cleanValue,
      pageUrl
    ).href;
    if (sources.some(
      (source) => source.type === normalizedType && source.url === absoluteUrl
    )) {
      return;
    }
    sources.push({
      type: normalizedType,
      url: absoluteUrl
    });
  } catch (e) {
    console.log(
      `[StreamWish2] URL HLS inv\xE1lida: ${cleanValue}`
    );
  }
}
function extractHlsVariants2(playlist, masterUrl) {
  const lines = String(
    playlist || ""
  ).split(
    /\r?\n/
  );
  const variants = [];
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index].trim();
    if (!line.startsWith(
      "#EXT-X-STREAM-INF:"
    )) {
      continue;
    }
    let location = null;
    for (let next = index + 1; next < lines.length; next++) {
      const candidate = lines[next].trim();
      if (!candidate) {
        continue;
      }
      if (candidate.startsWith(
        "#"
      )) {
        continue;
      }
      location = candidate;
      break;
    }
    if (!location) {
      continue;
    }
    const resolution = line.match(
      /(?:^|,)RESOLUTION=\d+x(\d+)(?:,|$)/i
    );
    const name = line.match(
      /(?:^|,)NAME="?([^",]+)"?(?:,|$)/i
    );
    let quality = "auto";
    if (resolution) {
      quality = `${resolution[1]}p`;
    } else if (name) {
      quality = name[1].trim();
    }
    try {
      const absoluteUrl = new URL(
        location,
        masterUrl
      ).href;
      if (variants.some(
        (variant) => variant.url === absoluteUrl
      )) {
        continue;
      }
      variants.push({
        url: absoluteUrl,
        quality
      });
    } catch (e) {
      console.log(
        `[StreamWish2] Variant URL inv\xE1lida: ${location}`
      );
    }
  }
  return variants;
}
function qualityNumber2(value) {
  const match = String(
    value || ""
  ).match(
    /(\d+)p/i
  );
  return match ? Number(
    match[1]
  ) : 0;
}
function getHlsDiagnostic(source, rawHtml) {
  const sourceText = String(
    source || ""
  );
  const htmlText = String(
    rawHtml || ""
  );
  const sourceLower = sourceText.toLowerCase();
  const htmlLower = htmlText.toLowerCase();
  return `RAW_HTML=${htmlText.length} | UNPACKED=${sourceText.length} | RAW_HLS2=${htmlLower.includes("hls2")} | RAW_HLS3=${htmlLower.includes("hls3")} | RAW_HLS4=${htmlLower.includes("hls4")} | UNPACKED_HLS2=${sourceLower.includes("hls2")} | UNPACKED_HLS3=${sourceLower.includes("hls3")} | UNPACKED_HLS4=${sourceLower.includes("hls4")}`;
}
function unpackPacker2(html) {
  const match = html.match(
    /eval\(function\(p,a,c,k,e,d\)\{[\s\S]*?\}\('((?:\\.|[^'])*)',(\d+),(\d+),'((?:\\.|[^'])*)'\.split\('\|'\)\)\)/
  );
  if (!match) {
    console.log(
      "[StreamWish2] No se encontr\xF3 c\xF3digo Packer."
    );
    return html;
  }
  let source = decodePackedString2(
    match[1]
  );
  const base = Number(
    match[2]
  );
  const count = Number(
    match[3]
  );
  const dictionary = decodePackedString2(
    match[4]
  ).split(
    "|"
  );
  console.log(
    `[StreamWish2] Packer base=${base} count=${count}`
  );
  for (let index = count - 1; index >= 0; index--) {
    const replacement = dictionary[index];
    if (!replacement) {
      continue;
    }
    source = source.replace(
      new RegExp(
        `\\b${index.toString(base)}\\b`,
        "g"
      ),
      replacement
    );
  }
  return source;
}
function decodePackedString2(value) {
  return String(
    value || ""
  ).replace(
    /\\(x[\da-fA-F]{2}|u[\da-fA-F]{4}|.)/g,
    (match, escape) => {
      var _a;
      if (escape.startsWith(
        "x"
      ) || escape.startsWith(
        "u"
      )) {
        return String.fromCharCode(
          Number.parseInt(
            escape.slice(
              1
            ),
            16
          )
        );
      }
      return (_a = {
        b: "\b",
        f: "\f",
        n: "\n",
        r: "\r",
        t: "	",
        v: "\v"
      }[escape]) != null ? _a : escape;
    }
  );
}

// src/sololatino/resolvers/voe.js
function resolveVoe(url) {
  return __async(this, null, function* () {
    console.log(
      `[VOE] Opening: ${url}`
    );
    if (!url || typeof url !== "string") {
      return [];
    }
    try {
      const response = yield fetchVoePage(
        url
      );
      console.log(
        `[VOE] Final URL: ${response.url}`
      );
      console.log(
        `[VOE] HTML length: ${response.html.length}`
      );
      if (isAltchaPage(
        response.html
      )) {
        console.log(
          "[VOE] P\xE1gina protegida por ALTCHA"
        );
        console.log(
          "[VOE] Se requiere verificaci\xF3n manual"
        );
        return [];
      }
      const source = extractSourceFromHtml(
        response.html
      );
      if (!source) {
        console.log(
          "[VOE] No se encontr\xF3 data.source"
        );
        return [];
      }
      console.log(
        `[VOE] Source: ${source}`
      );
      const streams = yield resolveSource(
        source,
        response.url
      );
      console.log(
        `[VOE] Returning: ${streams.length}`
      );
      return streams;
    } catch (error) {
      console.warn(
        `[VOE] Error: ${error.message}`
      );
      return [];
    }
  });
}
function fetchVoePage(url) {
  return __async(this, null, function* () {
    let currentUrl = url;
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = yield fetch(
        currentUrl,
        {
          headers: __spreadValues({}, HEADERS),
          redirect: "follow"
        }
      );
      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }
      const html = yield response.text();
      const finalUrl = response.url || currentUrl;
      if (finalUrl !== currentUrl) {
        console.log(
          `[VOE] HTTP redirect: ${finalUrl}`
        );
        currentUrl = finalUrl;
      }
      const locationMatch = html.match(
        /(?:window\.)?location(?:\.href)?\s*=\s*["']([^"']+)["']/i
      );
      const metaRefresh = html.match(
        /<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^"']*url=([^"']+)["']/i
      );
      const redirect = (locationMatch == null ? void 0 : locationMatch[1]) || (metaRefresh == null ? void 0 : metaRefresh[1]);
      if (redirect) {
        const nextUrl = new URL(
          redirect,
          currentUrl
        ).href;
        if (nextUrl !== currentUrl) {
          console.log(
            `[VOE] HTML redirect: ${nextUrl}`
          );
          currentUrl = nextUrl;
          continue;
        }
      }
      return {
        url: currentUrl,
        html
      };
    }
    throw new Error(
      "Demasiados redirects VOE"
    );
  });
}
function extractSourceFromHtml(html) {
  if (!html) {
    return null;
  }
  const match = html.match(
    /<script\s+type=["']application\/json["']\s*>\s*([\s\S]*?)\s*<\/script>/i
  );
  if (!match) {
    return null;
  }
  let payload;
  try {
    payload = JSON.parse(
      match[1]
    );
  } catch (error) {
    console.warn(
      "[VOE] JSON payload inv\xE1lido:",
      error.message
    );
    return null;
  }
  const encoded = Array.isArray(
    payload
  ) ? payload[0] : payload;
  if (typeof encoded !== "string") {
    return null;
  }
  try {
    const decoded = decodeVoePayload(
      encoded
    );
    const data = JSON.parse(
      decoded
    );
    if (data == null ? void 0 : data.source) {
      return data.source;
    }
  } catch (error) {
    console.warn(
      "[VOE] Error decodificando payload:",
      error.message
    );
  }
  return null;
}
function decodeVoePayload(encoded) {
  let value = encoded.replace(
    /[a-zA-Z]/g,
    (char) => {
      const code = char.charCodeAt(
        0
      );
      const base = code <= 90 ? 65 : 97;
      return String.fromCharCode(
        (code - base + 13) % 26 + base
      );
    }
  );
  const noise = [
    "@$",
    "^^",
    "~@",
    "%?",
    "*~",
    "!!",
    "#&"
  ];
  for (const token of noise) {
    value = value.split(
      token
    ).join("");
  }
  const stage1 = Buffer.from(
    value,
    "base64"
  ).toString(
    "utf8"
  );
  if (!stage1) {
    throw new Error(
      "Base64 stage 1 vac\xEDo"
    );
  }
  let shifted = "";
  for (let index = 0; index < stage1.length; index++) {
    shifted += String.fromCharCode(
      stage1.charCodeAt(
        index
      ) - 3
    );
  }
  const reversed = shifted.split("").reverse().join("");
  const stage2 = Buffer.from(
    reversed,
    "base64"
  ).toString(
    "utf8"
  );
  if (!stage2) {
    throw new Error(
      "Base64 stage 2 vac\xEDo"
    );
  }
  return stage2;
}
function resolveSource(source, referer) {
  return __async(this, null, function* () {
    const normalized = String(
      source || ""
    ).trim();
    if (!normalized) {
      return [];
    }
    if (/\.m3u8(?:\?|$)/i.test(
      normalized
    )) {
      console.log(
        "[VOE] Source es M3U8"
      );
      try {
        const playlist = yield fetchPlaylist(
          normalized,
          referer
        );
        console.log(
          `[VOE] Playlist length: ${playlist.length}`
        );
        const variants = extractHlsVariants3(
          playlist,
          normalized
        );
        console.log(
          `[VOE] Variants: ${variants.length}`
        );
        if (variants.length > 0) {
          for (const variant of variants) {
            console.log(
              `[VOE] ${variant.quality} -> ${variant.url}`
            );
          }
          return variants.map(
            (variant) => ({
              url: variant.url,
              quality: variant.quality,
              headers: buildHeaders(
                referer
              )
            })
          );
        }
      } catch (error) {
        console.warn(
          "[VOE] Error leyendo HLS:",
          error.message
        );
      }
      return [
        {
          url: normalized,
          quality: "auto",
          headers: buildHeaders(
            referer
          )
        }
      ];
    }
    return [
      {
        url: normalized,
        quality: "auto",
        headers: buildHeaders(
          referer
        )
      }
    ];
  });
}
function fetchPlaylist(url, referer) {
  return __async(this, null, function* () {
    const headers = buildHeaders(
      referer
    );
    const response = yield fetch(
      url,
      {
        headers,
        redirect: "follow"
      }
    );
    if (!response.ok) {
      throw new Error(
        `HLS HTTP ${response.status}`
      );
    }
    return response.text();
  });
}
function buildHeaders(referer) {
  const headers = __spreadValues({}, HEADERS);
  if (referer) {
    headers.Referer = referer;
    try {
      headers.Origin = new URL(
        referer
      ).origin;
    } catch (e) {
    }
  }
  return headers;
}
function extractHlsVariants3(playlist, masterUrl) {
  const lines = String(
    playlist || ""
  ).split(
    /\r?\n/
  ).map(
    (line) => line.trim()
  );
  const variants = [];
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (!line.startsWith(
      "#EXT-X-STREAM-INF:"
    )) {
      continue;
    }
    let streamUrl = null;
    for (let next = index + 1; next < lines.length; next++) {
      const candidate = lines[next].trim();
      if (!candidate) {
        continue;
      }
      if (candidate.startsWith(
        "#"
      )) {
        continue;
      }
      streamUrl = candidate;
      break;
    }
    if (!streamUrl) {
      continue;
    }
    const resolution = line.match(
      /RESOLUTION=\d+x(\d+)/i
    );
    const frameRate = line.match(
      /FRAME-RATE=([\d.]+)/i
    );
    const bandwidth = line.match(
      /BANDWIDTH=(\d+)/i
    );
    let quality = "auto";
    if (resolution) {
      quality = `${resolution[1]}p`;
    } else if (bandwidth) {
      quality = `${bandwidth[1]}bps`;
    }
    try {
      const absolute = new URL(
        streamUrl,
        masterUrl
      ).href;
      if (variants.some(
        (variant) => variant.url === absolute
      )) {
        continue;
      }
      variants.push({
        url: absolute,
        quality,
        frameRate: frameRate ? Number(
          frameRate[1]
        ) : null
      });
    } catch (e) {
      console.warn(
        `[VOE] URL HLS inv\xE1lida: ${streamUrl}`
      );
    }
  }
  variants.sort(
    (a, b) => qualityNumber3(
      b.quality
    ) - qualityNumber3(
      a.quality
    )
  );
  return variants;
}
function qualityNumber3(quality) {
  const match = String(
    quality || ""
  ).match(
    /(\d+)p/i
  );
  return match ? Number(
    match[1]
  ) : 0;
}
function isAltchaPage(html) {
  const text = String(
    html || ""
  );
  return /<altcha-widget\b/i.test(
    text
  ) || /access-form/i.test(
    text
  ) && /altcha/i.test(
    text
  );
}

// src/sololatino/resolvers/xupalace.js
function resolveXupala\u0441e(url) {
  return __async(this, null, function* () {
    if (!url || typeof url !== "string") {
      throw new Error(
        "Xupala\u0441e: URL inv\xE1lida"
      );
    }
    console.log(
      "[Xupala\u0441e] Opening:",
      url
    );
    const html = yield fetchText(
      url
    );
    console.log(
      "[Xupala\u0441e] HTML length:",
      html.length
    );
    const servers = extractXupala\u0441eServers(
      html
    );
    console.log(
      "[Xupala\u0441e] Servidores encontrados:",
      servers.length
    );
    const streams = [];
    for (const server of servers) {
      console.log(
        `[Xupala\u0441e] ${server.name} -> ${server.url}`
      );
      const name = normalizeServerName(
        server.name
      );
      if (name === "vidhide") {
        try {
          const variants = yield resolveVidhide(
            server.url
          );
          if (!Array.isArray(
            variants
          )) {
            continue;
          }
          for (const variant of variants) {
            if (!(variant == null ? void 0 : variant.url)) {
              continue;
            }
            streams.push({
              name: `Xupala\u0441e \u2022 VidHide \u2022 ${variant.quality || "auto"}`,
              quality: variant.quality || "auto",
              url: variant.url,
              language: "LAT",
              headers: variant.headers || {}
            });
          }
        } catch (error) {
          console.warn(
            `[Xupala\u0441e] Vidhide error: ${error.message}`
          );
        }
        continue;
      }
      if (name === "streamwish") {
        try {
          const variants = yield resolveStreamwish2(
            server.url
          );
          if (Array.isArray(
            variants
          )) {
            for (const variant of variants) {
              if (!(variant == null ? void 0 : variant.url)) {
                continue;
              }
              streams.push({
                name: `Xupala\u0441e \u2022 StreamWish \u2022 ${variant.quality || "auto"}`,
                quality: variant.quality || "auto",
                url: variant.url,
                language: "LAT",
                headers: variant.headers || {}
              });
            }
          }
        } catch (error) {
          console.warn(
            `[Xupala\u0441e] StreamWish error: ${error.message}`
          );
        }
        continue;
      }
      if (name === "streamwish") {
        try {
          const variants = yield resolveStreamwish2(
            server.url
          );
          if (Array.isArray(
            variants
          )) {
            for (const variant of variants) {
              if (!(variant == null ? void 0 : variant.url)) {
                continue;
              }
              streams.push({
                name: `Xupala\u0441e \u2022 StreamWish \u2022 ${variant.quality || "auto"}`,
                quality: variant.quality || "auto",
                url: variant.url,
                language: "LAT",
                headers: variant.headers || {}
              });
            }
          }
        } catch (error) {
          console.warn(
            `[Xupala\u0441e] StreamWish error: ${error.message}`
          );
        }
        continue;
      }
      if (name === "voe") {
        try {
          const variants = yield resolveVoe(
            server.url
          );
          if (Array.isArray(
            variants
          )) {
            for (const variant of variants) {
              if (!(variant == null ? void 0 : variant.url)) {
                continue;
              }
              streams.push({
                name: `Xupala\u0441e \u2022 VOE \u2022 ${variant.quality || "auto"}`,
                quality: variant.quality || "auto",
                url: variant.url,
                language: "LAT",
                headers: variant.headers || {}
              });
            }
          }
        } catch (error) {
          console.warn(
            `[Xupala\u0441e] VOE error: ${error.message}`
          );
        }
        continue;
      }
      console.log(
        `[Xupala\u0441e] Servidor todav\xEDa no implementado: ${server.name}`
      );
    }
    const unique = deduplicateStreams2(
      streams
    );
    console.log(
      "[Xupala\u0441e] Final streams:",
      unique.length
    );
    return unique;
  });
}
function extractXupala\u0441eServers(html) {
  const servers = [];
  const seen = /* @__PURE__ */ new Set();
  const liMatches = html.matchAll(
    /<li\b[^>]*>[\s\S]*?<\/li>/gi
  );
  for (const match of liMatches) {
    const block = match[0];
    if (!block.includes(
      "go_to_playerVast"
    )) {
      continue;
    }
    const urlMatch = block.match(
      /go_to_playerVast\(\s*['"]([^'"]+)['"]/i
    );
    if (!urlMatch) {
      continue;
    }
    const url = decodeHtmlEntities(
      urlMatch[1]
    ).trim();
    if (!url) {
      continue;
    }
    const nameMatch = block.match(
      /<span[^>]*>\s*([^<]+?)\s*<\/span>/i
    );
    if (!nameMatch) {
      continue;
    }
    const name = decodeHtmlEntities(
      nameMatch[1]
    ).replace(
      /\s+/g,
      " "
    ).trim().toLowerCase();
    if (!name) {
      continue;
    }
    const key = `${name}|${url}`;
    if (seen.has(
      key
    )) {
      continue;
    }
    seen.add(
      key
    );
    servers.push({
      name,
      url
    });
  }
  return servers;
}
function normalizeServerName(value) {
  return String(
    value || ""
  ).trim().toLowerCase().replace(
    /\s+/g,
    ""
  );
}
function decodeHtmlEntities(value) {
  return String(
    value || ""
  ).replace(
    /&amp;/gi,
    "&"
  ).replace(
    /&quot;/gi,
    '"'
  ).replace(
    /&#39;/gi,
    "'"
  ).replace(
    /&lt;/gi,
    "<"
  ).replace(
    /&gt;/gi,
    ">"
  );
}
function deduplicateStreams2(streams) {
  const seen = /* @__PURE__ */ new Set();
  return streams.filter(
    (stream) => {
      if (!(stream == null ? void 0 : stream.url)) {
        return false;
      }
      if (seen.has(
        stream.url
      )) {
        return false;
      }
      seen.add(
        stream.url
      );
      return true;
    }
  );
}

// src/sololatino/extractor.js
function extractStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    console.log(
      "[SoloLatino] extractStreams()"
    );
    console.log(
      "[SoloLatino] TMDB:",
      tmdbId
    );
    console.log(
      "[SoloLatino] Type:",
      mediaType
    );
    console.log(
      "[SoloLatino] Season:",
      season
    );
    console.log(
      "[SoloLatino] Episode:",
      episode
    );
    try {
      const media = mediaType === "movie" ? yield getMovie(
        tmdbId
      ) : yield getTv(
        tmdbId
      );
      if (!(media == null ? void 0 : media.title)) {
        console.log(
          "[SoloLatino] No se obtuvo informaci\xF3n de TMDB"
        );
        return [];
      }
      console.log(
        "[SoloLatino] TMDB:",
        media.title,
        media.year
      );
      const results = yield searchSoloLatino(
        media
      );
      console.log(
        "[SoloLatino] Total results:",
        results.length
      );
      if (results.length === 0) {
        console.log(
          "[SoloLatino] No search results"
        );
        return [];
      }
      const selected = selectResult(
        results,
        media,
        mediaType
      );
      if (!selected) {
        console.log(
          "[SoloLatino] No se encontr\xF3 coincidencia"
        );
        return [];
      }
      console.log(
        "[SoloLatino] Selected:",
        selected.title
      );
      console.log(
        "[SoloLatino] URL:",
        selected.url
      );
      let contentUrl = selected.url;
      if (mediaType === "tv") {
        if (!Number.isInteger(
          Number(
            season
          )
        ) || !Number.isInteger(
          Number(
            episode
          )
        )) {
          console.log(
            "[SoloLatino] TV requiere season y episode"
          );
          return [];
        }
        contentUrl = yield getEpisodeUrl(
          selected.url,
          Number(
            season
          ),
          Number(
            episode
          )
        );
        if (!contentUrl) {
          console.log(
            `[SoloLatino] No se encontr\xF3 S${season}E${episode}`
          );
          return [];
        }
        console.log(
          "[SoloLatino] Episode:",
          contentUrl
        );
      }
      const servers = yield getEpisodeServers(
        contentUrl
      );
      console.log(
        "[SoloLatino] Servers:",
        servers.length
      );
      if (servers.length === 0) {
        return [];
      }
      const streams = [];
      const processedPlayers = /* @__PURE__ */ new Set();
      for (const server of servers) {
        if (!(server == null ? void 0 : server.playerToken)) {
          console.log(
            "[SoloLatino] Server sin token:",
            server == null ? void 0 : server.label
          );
          continue;
        }
        console.log(
          "[SoloLatino] Processing server:",
          server.label
        );
        try {
          const player = yield resolvePlayerUrl(
            server
          );
          if (!(player == null ? void 0 : player.url)) {
            console.log(
              "[SoloLatino] Player sin URL:",
              server.label
            );
            continue;
          }
          console.log(
            "[SoloLatino] Player:",
            player.url
          );
          if (processedPlayers.has(
            player.url
          )) {
            console.log(
              "[SoloLatino] Player duplicado:",
              player.url
            );
            continue;
          }
          processedPlayers.add(
            player.url
          );
          if (false) {
            console.log(
              "[SoloLatino] Resolver: PelisSeriesHoy"
            );
            try {
              const resolved = yield resolvePelisSeriesHoy(
                player.url,
                contentUrl
              );
              console.log(
                `[PelisSeriesHoy] Streams: ${resolved.length}`
              );
              for (const stream of resolved) {
                if (!(stream == null ? void 0 : stream.url)) {
                  continue;
                }
                streams.push({
                  name: stream.name || "SoloLatino PelisSeriesHoy",
                  title: media.title,
                  url: stream.url,
                  quality: stream.quality || "auto",
                  language: server.language || "LAT",
                  headers: stream.headers || {}
                });
              }
            } catch (error) {
              console.warn(
                "[SoloLatino] PelisSeriesHoy error:",
                error.message
              );
            }
            continue;
          }
          if (isEmbed69(
            player.url
          )) {
            console.log(
              "[SoloLatino] Resolver: Embed69"
            );
            const files = yield resolveEmbed69(
              player.url
            );
            console.log(
              "[Embed69] Files:",
              Array.isArray(
                files
              ) ? files.length : 0
            );
            if (!Array.isArray(
              files
            )) {
              continue;
            }
            for (const file of files) {
              if (!Array.isArray(
                file == null ? void 0 : file.sortedEmbeds
              )) {
                continue;
              }
              const processedEmbeds = /* @__PURE__ */ new Set();
              for (const embed of file.sortedEmbeds) {
                if (!(embed == null ? void 0 : embed.link)) {
                  continue;
                }
                const embedUrl = embed.link;
                if (processedEmbeds.has(
                  embedUrl
                )) {
                  continue;
                }
                processedEmbeds.add(
                  embedUrl
                );
                const serverName = String(
                  embed.servername || ""
                ).trim().toLowerCase();
                console.log(
                  "[SoloLatino] Embed69 server:",
                  serverName,
                  "->",
                  embedUrl
                );
                if (serverName === "vidhide") {
                  console.log(
                    "[SoloLatino] Resolver Embed69 -> Vidhide"
                  );
                  try {
                    const resolved = yield resolveVidhide(
                      embedUrl
                    );
                    if (!Array.isArray(
                      resolved
                    )) {
                      continue;
                    }
                    for (const stream of resolved) {
                      if (!(stream == null ? void 0 : stream.url)) {
                        continue;
                      }
                      streams.push({
                        name: `SoloLatino Vidhide ${stream.quality || "auto"} \u2705`,
                        title: media.title,
                        url: stream.url,
                        quality: stream.quality || "auto",
                        language: embed.video_language || server.language || "LAT",
                        headers: stream.headers || {}
                      });
                    }
                  } catch (error) {
                    console.warn(
                      "[SoloLatino] Embed69 Vidhide error:",
                      error.message
                    );
                  }
                  continue;
                }
                if (serverName === "streamwish") {
                  console.log(
                    "[SoloLatino] Resolver Embed69 -> StreamWish"
                  );
                  try {
                    const resolved = yield resolveStreamwish2(
                      embedUrl
                    );
                    if (!Array.isArray(
                      resolved
                    )) {
                      continue;
                    }
                    for (const stream of resolved) {
                      if (!(stream == null ? void 0 : stream.url)) {
                        continue;
                      }
                      streams.push({
                        name: `SoloLatino StreamWish ${stream.quality || "auto"} \u2705`,
                        title: media.title,
                        url: stream.url,
                        quality: stream.quality || "auto",
                        language: embed.video_language || server.language || "LAT",
                        headers: stream.headers || {}
                      });
                    }
                  } catch (error) {
                    console.warn(
                      "[SoloLatino] Embed69 StreamWish error:",
                      error.message
                    );
                  }
                  continue;
                }
                if (false) {
                  console.log(
                    "[SoloLatino] Resolver Embed69 -> VOE"
                  );
                  try {
                    const resolved = yield resolveVoe(
                      embedUrl
                    );
                    if (Array.isArray(
                      resolved
                    )) {
                      for (const stream of resolved) {
                        if (!(stream == null ? void 0 : stream.url)) {
                          continue;
                        }
                        streams.push({
                          name: `SoloLatino VOE ${stream.quality || "auto"} \u2705`,
                          title: media.title,
                          url: stream.url,
                          quality: stream.quality || "auto",
                          language: server.language || "LAT",
                          headers: stream.headers || {}
                        });
                      }
                    }
                  } catch (error) {
                    console.warn(
                      "[SoloLatino] Embed69 VOE error:",
                      error.message
                    );
                  }
                  continue;
                }
                console.log(
                  "[SoloLatino] Embed69 server no soportado todav\xEDa:",
                  serverName,
                  embedUrl
                );
              }
            }
            continue;
          }
          if (isXupala\u0441e(
            player.url
          )) {
            console.log(
              "[SoloLatino] Resolver: Xupala\u0441e"
            );
            try {
              const resolved = yield resolveXupala\u0441e(
                player.url
              );
              if (!Array.isArray(
                resolved
              )) {
                continue;
              }
              console.log(
                "[Xupala\u0441e] Streams:",
                resolved.length
              );
              for (const stream of resolved) {
                if (!(stream == null ? void 0 : stream.url)) {
                  continue;
                }
                streams.push({
                  name: `${String(stream.name || "SoloLatino Xupala\u0441e").replace(/\s✅$/, "")} \u2705`,
                  title: media.title,
                  url: stream.url,
                  quality: stream.quality || "auto",
                  language: stream.language || server.language || "LAT",
                  headers: stream.headers || {}
                });
              }
            } catch (error) {
              console.warn(
                "[SoloLatino] Xupala\u0441e error:",
                error.message
              );
            }
            continue;
          }
          console.log(
            "[SoloLatino] Player no soportado todav\xEDa:",
            player.url
          );
        } catch (error) {
          console.warn(
            `[SoloLatino] Server failed: ${server.label}:`,
            error.message
          );
        }
      }
      const unique = deduplicateStreams3(
        streams
      );
      console.log(
        "[SoloLatino] Final streams:",
        unique.length
      );
      return unique;
    } catch (error) {
      console.error(
        "[SoloLatino] ERROR:",
        error.message
      );
      return [];
    }
  });
}
function selectResult(results, media, mediaType) {
  const wantedTitles = [
    media.title,
    media.originalTitle,
    ...Array.isArray(
      media.translationTitles
    ) ? media.translationTitles.map(
      (item) => typeof item === "string" ? item : item == null ? void 0 : item.title
    ) : [],
    ...Array.isArray(
      media.alternativeTitles
    ) ? media.alternativeTitles.map(
      (item) => typeof item === "string" ? item : item == null ? void 0 : item.title
    ) : []
  ].filter(
    Boolean
  ).map(
    normalizeTitle2
  ).filter(
    Boolean
  );
  const wantedType = mediaType === "movie" ? "pelicula" : "serie";
  const sameYear = results.filter(
    (result) => result.type === wantedType && (!media.year || result.year === media.year)
  );
  for (const result of sameYear) {
    const resultTitle = normalizeTitle2(
      cleanTitle(
        result.title
      )
    );
    for (const wanted of wantedTitles) {
      if (resultTitle === wanted) {
        console.log(
          "[SoloLatino] Match exacto:",
          result.title
        );
        return result;
      }
    }
  }
  for (const result of sameYear) {
    const resultTitle = normalizeTitle2(
      cleanTitle(
        result.title
      )
    );
    for (const wanted of wantedTitles) {
      if (resultTitle.includes(
        wanted
      ) || wanted.includes(
        resultTitle
      )) {
        console.log(
          "[SoloLatino] Match por t\xEDtulo:",
          result.title
        );
        return result;
      }
    }
  }
  for (const result of sameYear) {
    const slug = getSlug2(
      result.url
    );
    for (const wanted of wantedTitles) {
      if (slug === wanted || slug.includes(
        wanted
      ) || wanted.includes(
        slug
      )) {
        console.log(
          "[SoloLatino] Match por slug:",
          slug
        );
        return result;
      }
    }
  }
  for (const result of sameYear) {
    const resultTitle = normalizeTitle2(
      cleanTitle(
        result.title
      )
    );
    const resultTokens = new Set(
      resultTitle.split(
        /\s+/
      ).filter(
        (token) => token.length >= 2 && !STOP_WORDS.has(
          token
        )
      )
    );
    for (const wanted of wantedTitles) {
      const wantedTokens = wanted.split(
        /\s+/
      ).filter(
        (token) => token.length >= 2 && !STOP_WORDS.has(
          token
        )
      );
      if (wantedTokens.length === 0) {
        continue;
      }
      let matches = 0;
      for (const token of wantedTokens) {
        if (resultTokens.has(
          token
        )) {
          matches++;
        }
      }
      const ratio = matches / wantedTokens.length;
      if (ratio >= 0.6) {
        console.log(
          "[SoloLatino] Match por tokens:",
          result.title
        );
        return result;
      }
    }
  }
  const sameType = results.filter(
    (result) => result.type === wantedType
  );
  for (const result of sameType) {
    const resultTitle = normalizeTitle2(
      cleanTitle(
        result.title
      )
    );
    for (const wanted of wantedTitles) {
      if (resultTitle === wanted || resultTitle.includes(
        wanted
      ) || wanted.includes(
        resultTitle
      )) {
        return result;
      }
    }
  }
  console.log(
    "[SoloLatino] No matching result"
  );
  return null;
}
var STOP_WORDS = /* @__PURE__ */ new Set([
  "the",
  "a",
  "an",
  "of",
  "and",
  "el",
  "la",
  "los",
  "las",
  "un",
  "una",
  "de",
  "del",
  "y"
]);
function normalizeTitle2(value) {
  return String(
    value || ""
  ).normalize(
    "NFD"
  ).replace(
    /[\u0300-\u036f]/g,
    ""
  ).toLowerCase().replace(
    /[^a-z0-9]+/g,
    " "
  ).replace(
    /\s+/g,
    " "
  ).trim();
}
function cleanTitle(value) {
  return String(
    value || ""
  ).replace(
    /^\s*(pel[ií]cula|serie|anime|dibujos?)\s*★?\s*\d+(?:\.\d+)?\s*/i,
    ""
  ).replace(
    /\b(19|20)\d{2}\b/g,
    " "
  ).replace(
    /\s+/g,
    " "
  ).trim();
}
function getSlug2(url) {
  try {
    const parsed = new URL(
      url
    );
    const parts = parsed.pathname.split("/").filter(
      Boolean
    );
    if (parts.length === 0) {
      return "";
    }
    return normalizeTitle2(
      parts[parts.length - 1]
    );
  } catch (e) {
    return "";
  }
}
function isEmbed69(url) {
  try {
    return new URL(
      url
    ).hostname.toLowerCase().includes(
      "embed69.org"
    );
  } catch (e) {
    return false;
  }
}
function isXupala\u0441e(url) {
  try {
    return new URL(
      url
    ).hostname.toLowerCase().includes(
      "xupalace.org"
    );
  } catch (e) {
    return false;
  }
}
function deduplicateStreams3(streams) {
  const seen = /* @__PURE__ */ new Set();
  return streams.filter(
    (stream) => {
      if (!(stream == null ? void 0 : stream.url)) {
        return false;
      }
      if (seen.has(
        stream.url
      )) {
        return false;
      }
      seen.add(
        stream.url
      );
      return true;
    }
  );
}

// src/sololatino/index.js
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    return yield extractStreams(
      tmdbId,
      mediaType,
      season,
      episode
    );
  });
}
