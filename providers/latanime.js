/**
 * latanime - Built from src/latanime/
 * Generated: 2026-08-28T01:10:24.703Z
 */
var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
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
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
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

// src/latanime/http.js
var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36"
  // Add other common headers like 'Referer' if needed
};
function fetchText(_0) {
  return __async(this, arguments, function* (url, options = {}) {
    console.log(`[Template] Fetching: ${url}`);
    const response = yield fetch(url, __spreadValues({
      headers: __spreadValues(__spreadValues({}, HEADERS), options.headers)
    }, options));
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} for ${url}`);
    }
    return yield response.text();
  });
}
function fetchJson(_0) {
  return __async(this, arguments, function* (url, options = {}) {
    const raw = yield fetchText(url, options);
    return JSON.parse(raw);
  });
}

// src/latanime/tmdb.js
var TMDB_API_KEY = "439c478a771f35c05022f9feabcca01c";
var TMDB_BASE_URL = "https://api.themoviedb.org/3";
function getMovie(tmdbId) {
  return __async(this, null, function* () {
    const data = yield fetchJson(
      `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=es-ES`
    );
    const alternative = yield getAlternativeTitles(
      "movie",
      tmdbId
    );
    return {
      title: data.title,
      originalTitle: data.original_title,
      year: getYear(
        data.release_date
      ),
      alternativeTitles: alternative
    };
  });
}
function getTv(tmdbId) {
  return __async(this, null, function* () {
    const data = yield fetchJson(
      `${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=es-ES`
    );
    const alternative = yield getAlternativeTitles(
      "tv",
      tmdbId
    );
    return {
      title: data.name,
      originalTitle: data.original_name,
      year: getYear(
        data.first_air_date
      ),
      alternativeTitles: alternative
    };
  });
}
function getAlternativeTitles(type, tmdbId) {
  return __async(this, null, function* () {
    try {
      const data = yield fetchJson(
        `${TMDB_BASE_URL}/${type}/${tmdbId}/alternative_titles?api_key=${TMDB_API_KEY}`
      );
      const titles = [];
      if (type === "tv" && Array.isArray(
        data.results
      )) {
        for (const item of data.results) {
          if (item == null ? void 0 : item.title) {
            titles.push(
              item.title
            );
          }
          if (item == null ? void 0 : item.name) {
            titles.push(
              item.name
            );
          }
        }
      }
      if (type === "movie" && Array.isArray(
        data.titles
      )) {
        for (const item of data.titles) {
          if (item == null ? void 0 : item.title) {
            titles.push(
              item.title
            );
          }
        }
      }
      return uniqueTitles(
        titles
      );
    } catch (error) {
      console.warn(
        `[TMDB] No se pudieron obtener t\xEDtulos alternativos: ${error.message}`
      );
      return [];
    }
  });
}
function uniqueTitles(titles) {
  const seen = /* @__PURE__ */ new Set();
  const result = [];
  for (const title of titles) {
    if (typeof title !== "string") {
      continue;
    }
    const clean = title.trim();
    if (!clean) {
      continue;
    }
    const key = clean.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(
      key
    );
    result.push(
      clean
    );
  }
  return result;
}
function getYear(date) {
  const match = typeof date === "string" ? date.match(
    /^\d{4}/
  ) : null;
  return match ? Number(match[0]) : null;
}

// src/latanime/search.js
var import_cheerio_without_node_native = __toESM(require("cheerio-without-node-native"));
var BASE_URL = "https://latanime.org";
function searchLatanime(query) {
  return __async(this, null, function* () {
    var _a, _b;
    if (!query || typeof query !== "string") {
      return [];
    }
    const url = `${BASE_URL}/buscar?q=${encodeURIComponent(query)}`;
    console.log(
      `[Latanime] Searching: ${url}`
    );
    const html = yield fetchText(
      url
    );
    const $ = import_cheerio_without_node_native.default.load(
      html
    );
    const results = [];
    $("a[href*='/anime/']").each(
      (index, element) => {
        const href = $(element).attr(
          "href"
        );
        if (!href) {
          return;
        }
        const absoluteUrl = href.startsWith("http") ? href : `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`;
        if (!absoluteUrl.includes(
          "/anime/"
        )) {
          return;
        }
        const titleElement = $(element).find(
          "h3"
        ).first();
        const title = (titleElement.length ? titleElement.text() : $(element).text()).replace(
          /\s+/g,
          " "
        ).trim();
        if (!title) {
          return;
        }
        const fullText = $(element).text().replace(
          /\s+/g,
          " "
        ).trim();
        let season = null;
        const seasonPatterns = [
          /\bS(\d{1,2})\b/i,
          /\bS(\d{1,2})E\d+\b/i,
          /\bSeason\s*(\d{1,2})\b/i,
          /\bTemporada\s*(\d{1,2})\b/i,
          /\/s(\d{1,2})[-_]/i,
          /-s(\d{1,2})-/i
        ];
        for (const pattern of seasonPatterns) {
          const match = title.match(
            pattern
          ) || absoluteUrl.match(
            pattern
          ) || fullText.match(
            pattern
          );
          if (match && match[1]) {
            season = Number(
              match[1]
            );
            break;
          }
        }
        let year = null;
        const yearMatch = fullText.match(
          /\b(19|20)\d{2}\b/
        );
        if (yearMatch) {
          year = Number(
            yearMatch[0]
          );
        }
        let language = null;
        const lowerText = fullText.toLowerCase();
        if (lowerText.includes(
          "latino"
        )) {
          language = "latino";
        } else if (lowerText.includes(
          "castellano"
        )) {
          language = "castellano";
        } else if (lowerText.includes(
          "subtitulado"
        ) || lowerText.includes(
          "sub"
        )) {
          language = "sub";
        }
        results.push({
          title,
          year,
          season,
          language,
          url: absoluteUrl
        });
      }
    );
    const seen = /* @__PURE__ */ new Set();
    const uniqueResults = results.filter(
      (result) => {
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
    console.log(
      `[Latanime] Results for "${query}": ${uniqueResults.length}`
    );
    for (const result of uniqueResults) {
      console.log(
        `[Latanime]   ${result.title} | S${(_a = result.season) != null ? _a : "?"} | ${(_b = result.year) != null ? _b : "?"} | ${result.url}`
      );
    }
    return uniqueResults;
  });
}

// src/latanime/series.js
var import_cheerio_without_node_native2 = __toESM(require("cheerio-without-node-native"));
var BASE_URL2 = "https://latanime.org";
function getEpisodeUrl(seriesUrl, season, episode) {
  return __async(this, null, function* () {
    console.log(
      `[Latanime] Loading series: ${seriesUrl}`
    );
    const html = yield fetchText(
      seriesUrl
    );
    const $ = import_cheerio_without_node_native2.default.load(html);
    const targetEpisode = Number(episode);
    if (!Number.isInteger(
      targetEpisode
    ) || targetEpisode < 1) {
      console.warn(
        `[Latanime] Invalid episode: ${episode}`
      );
      return null;
    }
    let episodeUrl = null;
    $("a[href]").each(
      (index, element) => {
        if (episodeUrl) {
          return;
        }
        const href = $(element).attr("href");
        if (!href) {
          return;
        }
        const fullUrl = href.startsWith("http") ? href : `${BASE_URL2}${href.startsWith("/") ? "" : "/"}${href}`;
        const text = $(element).text().replace(/\s+/g, " ").trim();
        const hrefLower = fullUrl.toLowerCase();
        const expectedEpisode = `-episodio-${targetEpisode}`;
        if (hrefLower.includes(
          "/ver/"
        ) && hrefLower.includes(
          expectedEpisode
        )) {
          episodeUrl = fullUrl;
          console.log(
            `[Latanime] Episode found: E${targetEpisode} \u2192 ${episodeUrl}`
          );
          return;
        }
        const episodePattern = new RegExp(
          `(?:episodio|episode|capitulo|cap\xEDtulo)\\s*${targetEpisode}\\b`,
          "i"
        );
        if (episodePattern.test(
          text
        ) && hrefLower.includes(
          "/ver/"
        )) {
          episodeUrl = fullUrl;
          console.log(
            `[Latanime] Episode found by text: E${targetEpisode} \u2192 ${episodeUrl}`
          );
        }
      }
    );
    if (!episodeUrl) {
      console.warn(
        `[Latanime] Episode E${targetEpisode} not found`
      );
      return null;
    }
    return episodeUrl;
  });
}

// src/latanime/resolvers/mp4upload.js
function resolveMp4Upload(embedUrl) {
  return __async(this, null, function* () {
    try {
      console.log(
        `[MP4Upload] Resolving: ${embedUrl}`
      );
      const html = yield fetchText(
        embedUrl,
        {
          headers: __spreadProps(__spreadValues({}, HEADERS), {
            "Referer": "https://latanime.org/"
          })
        }
      );
      console.log(
        `[MP4Upload] HTML length: ${html.length}`
      );
      const patterns = [
        /src\s*:\s*["']([^"']+\.mp4[^"']*)["']/i,
        /src\s*=\s*["']([^"']+\.mp4[^"']*)["']/i,
        /file\s*:\s*["']([^"']+\.mp4[^"']*)["']/i
      ];
      let videoUrl = null;
      for (const pattern of patterns) {
        const match = html.match(
          pattern
        );
        if (match && match[1]) {
          videoUrl = match[1];
          break;
        }
      }
      if (!videoUrl) {
        console.warn(
          "[MP4Upload] No se encontr\xF3 una fuente MP4."
        );
        return null;
      }
      if (videoUrl.startsWith("//")) {
        videoUrl = "https:" + videoUrl;
      }
      if (videoUrl.startsWith("/")) {
        const origin = new URL(
          embedUrl
        ).origin;
        videoUrl = origin + videoUrl;
      }
      videoUrl = videoUrl.trim();
      console.log(
        `[MP4Upload] MP4 encontrado: ${videoUrl}`
      );
      let verified = false;
      try {
        console.log(
          "[MP4Upload] Verificando URL..."
        );
        const check = yield fetch(
          videoUrl,
          {
            method: "HEAD",
            headers: __spreadProps(__spreadValues({}, HEADERS), {
              "Referer": embedUrl
            })
          }
        );
        console.log(
          `[MP4Upload] HEAD status: ${check.status}`
        );
        verified = check.ok;
      } catch (error) {
        console.warn(
          `[MP4Upload] HEAD failed: ${error.message}`
        );
      }
      console.log(
        `[MP4Upload] Verified: ${verified}`
      );
      return {
        url: videoUrl,
        quality: "1080p",
        serverName: "MP4Upload",
        verified,
        headers: __spreadProps(__spreadValues({}, HEADERS), {
          "Referer": embedUrl
        })
      };
    } catch (error) {
      console.error(
        `[MP4Upload] Error: ${error.message}`
      );
      return null;
    }
  });
}

// src/latanime/resolvers/hexload.js
function resolveHexload(embedUrl) {
  return __async(this, null, function* () {
    try {
      console.log(
        `[Hexload] Resolving: ${embedUrl}`
      );
      const match = String(embedUrl).match(
        /embed-([^/?#]+)$/i
      );
      if (!match || !match[1]) {
        console.warn(
          "[Hexload] No se pudo extraer el ID."
        );
        return null;
      }
      const id = match[1];
      console.log(
        `[Hexload] ID: ${id}`
      );
      const body = `op=download3&id=${encodeURIComponent(id)}&ajax=1&method_free=1&dataType=json`;
      const response = yield fetch(
        "https://hexload.com/download",
        {
          method: "POST",
          headers: __spreadProps(__spreadValues({}, HEADERS), {
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            "Referer": embedUrl
          }),
          body
        }
      );
      console.log(
        `[Hexload] HTTP status: ${response.status}`
      );
      if (!response.ok) {
        console.warn(
          `[Hexload] HTTP error: ${response.status}`
        );
        return null;
      }
      const raw = yield response.text();
      console.log(
        `[Hexload] Response length: ${raw.length}`
      );
      console.log(
        `[Hexload] Response preview: ${raw.slice(0, 300)}`
      );
      let data;
      try {
        data = JSON.parse(
          raw
        );
      } catch (error) {
        console.warn(
          `[Hexload] JSON parse failed: ${error.message}`
        );
        return null;
      }
      if (!data || data.msg !== "OK" || !data.result || !data.result.url) {
        console.warn(
          "[Hexload] La respuesta no contiene result.url."
        );
        console.log(
          "[Hexload] Parsed response:",
          data
        );
        return null;
      }
      const videoUrl = data.result.url;
      console.log(
        `[Hexload] Video URL: ${videoUrl}`
      );
      console.log(
        `[Hexload] File: ${data.result.file_name || "unknown"}`
      );
      console.log(
        `[Hexload] Size: ${data.result.size || "unknown"}`
      );
      console.log(
        `[Hexload] Content-Type: ${data.result.content_type || "unknown"}`
      );
      return {
        url: videoUrl,
        quality: "1080p",
        serverName: "Hexload",
        verified: true,
        headers: __spreadProps(__spreadValues({}, HEADERS), {
          "Referer": embedUrl
        })
      };
    } catch (error) {
      console.error(
        `[Hexload] Error: ${error.message}`
      );
      return null;
    }
  });
}

// src/latanime/resolvers/mixdrop.js
function resolveMixdrop(embedUrl) {
  return __async(this, null, function* () {
    try {
      console.log(
        `[Mixdrop] Resolving: ${embedUrl}`
      );
      const embed = new URL(
        embedUrl
      );
      const html = yield fetchText(
        embedUrl,
        {
          headers: __spreadProps(__spreadValues({}, HEADERS), {
            "Referer": "https://latanime.org/",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
          })
        }
      );
      console.log(
        `[Mixdrop] HTML length: ${html.length}`
      );
      const videoUrl = extractMixdropVideoUrl(
        html
      );
      if (!videoUrl) {
        console.warn(
          "[Mixdrop] No se pudo encontrar MDCore.wurl."
        );
        return null;
      }
      console.log(
        `[Mixdrop] Video URL: ${videoUrl}`
      );
      const origin = `${embed.protocol}//${embed.host}`;
      return {
        url: videoUrl,
        quality: "1080p",
        serverName: "Mixdrop",
        verified: true,
        headers: __spreadProps(__spreadValues({}, HEADERS), {
          "Referer": embedUrl,
          "Origin": origin,
          "Accept": "video/mp4,*/*"
        }),
        behaviorHints: {
          notWebReady: false
        }
      };
    } catch (error) {
      console.error(
        `[Mixdrop] Error: ${error.message}`
      );
      return null;
    }
  });
}
function extractMixdropVideoUrl(html) {
  const direct = extractWurl(
    html
  );
  if (direct) {
    console.log(
      "[Mixdrop] MDCore.wurl encontrado directamente."
    );
    return normalizeVideoUrl(
      direct
    );
  }
  const evalMatches = [
    ...html.matchAll(
      /eval\s*\(\s*function\s*\(\s*p\s*,\s*a\s*,\s*c\s*,\s*k\s*,\s*e\s*,\s*d\s*\)/gi
    )
  ];
  console.log(
    `[Mixdrop] Eval candidates: ${evalMatches.length}`
  );
  for (const match of evalMatches) {
    const start = match.index;
    if (typeof start !== "number") {
      continue;
    }
    const block = extractEvalBlock(
      html,
      start
    );
    if (!block) {
      continue;
    }
    const unpacked = unpackMixdropEval(
      block
    );
    if (!unpacked) {
      continue;
    }
    console.log(
      `[Mixdrop] Unpacked length: ${unpacked.length}`
    );
    const wurl = extractWurl(
      unpacked
    );
    if (wurl) {
      console.log(
        "[Mixdrop] MDCore.wurl encontrado."
      );
      return normalizeVideoUrl(
        wurl
      );
    }
  }
  return null;
}
function extractEvalBlock(html, start) {
  const scriptEnd = html.indexOf(
    "</script>",
    start
  );
  if (scriptEnd === -1) {
    return html.slice(
      start
    );
  }
  return html.slice(
    start,
    scriptEnd
  );
}
function unpackMixdropEval(block) {
  try {
    let match = block.match(
      /\(\s*'((?:\\'|[^'])*)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'((?:\\'|[^'])*)'\.split\(\s*'\|'\s*\)/i
    );
    if (match) {
      return decodePacked(
        match[1],
        Number(match[2]),
        Number(match[3]),
        match[4]
      );
    }
    match = block.match(
      /\(\s*"((?:\\"|[^"])*)"\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*"((?:\\"|[^"])*)"\.split\(\s*"\|"\s*\)/i
    );
    if (match) {
      return decodePacked(
        match[1],
        Number(match[2]),
        Number(match[3]),
        match[4]
      );
    }
    console.warn(
      "[Mixdrop] No se encontr\xF3 payload + dictionary."
    );
  } catch (error) {
    console.warn(
      `[Mixdrop] Error unpacking eval: ${error.message}`
    );
  }
  return null;
}
function decodePacked(packed, base, count, dictionaryText) {
  try {
    const dictionary = dictionaryText.split(
      "|"
    );
    console.log(
      `[Mixdrop] Dictionary: ${dictionary.length} elementos | base=${base} | count=${count}`
    );
    let unpacked = packed.replace(
      /\b(\d+)\b/g,
      (full, index) => {
        var _a;
        const i = Number(
          index
        );
        if (i >= 0 && i < dictionary.length) {
          return (_a = dictionary[i]) != null ? _a : full;
        }
        return full;
      }
    );
    if (!/MDCore/i.test(
      unpacked
    )) {
      unpacked = replacePackedWords(
        packed,
        dictionary
      );
    }
    if (/MDCore\./i.test(
      unpacked
    )) {
      return unpacked;
    }
  } catch (error) {
    console.warn(
      `[Mixdrop] Error decoding packed data: ${error.message}`
    );
  }
  return null;
}
function replacePackedWords(text, dictionary) {
  return text.replace(
    /\b(\d+)\b/g,
    (full, index) => {
      var _a;
      const i = Number(
        index
      );
      return (_a = dictionary[i]) != null ? _a : full;
    }
  );
}
function extractWurl(text) {
  if (typeof text !== "string") {
    return null;
  }
  const patterns = [
    /MDCore\.wurl\s*=\s*["']([^"']+)["']/i,
    /MDCore\s*\[\s*["']wurl["']\s*\]\s*=\s*["']([^"']+)["']/i,
    /\bwurl\s*=\s*["']([^"']+\.mp4[^"']*)["']/i
  ];
  for (const pattern of patterns) {
    const match = text.match(
      pattern
    );
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}
function normalizeVideoUrl(value) {
  let url = String(
    value || ""
  ).trim();
  if (!url) {
    return null;
  }
  if (url.startsWith("//")) {
    url = `https:${url}`;
  }
  if (!/^https?:\/\//i.test(
    url
  )) {
    return null;
  }
  return url;
}

// src/latanime/resolvers/index.js
function getResolver(serverName) {
  const name = String(serverName || "").toLowerCase().trim();
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

// src/latanime/extractor.js
var import_cheerio_without_node_native3 = __toESM(require("cheerio-without-node-native"));
function extractStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    console.log(
      `[Latanime] Searching TMDB ID: ${tmdbId}`
    );
    const media = mediaType === "movie" ? yield getMovie(tmdbId) : yield getTv(tmdbId);
    console.log(
      "[Latanime] TMDB:",
      media
    );
    const results = yield searchLatanimeByAllTitles(
      media
    );
    console.log(
      `[Latanime] Total unique results: ${results.length}`
    );
    if (results.length === 0) {
      console.log(
        "[Latanime] No search results found."
      );
      return [];
    }
    const selectedResults = selectResults(
      results,
      media,
      mediaType === "tv" ? season : null
    );
    if (selectedResults.length === 0) {
      console.log(
        "[Latanime] No matching result found."
      );
      return [];
    }
    console.log(
      `[Latanime] Selected results: ${selectedResults.length}`
    );
    for (const selected of selectedResults) {
      if (!selected) {
        continue;
      }
      console.log(
        `[Latanime] Selected: ${selected.title}`
      );
      console.log(
        `[Latanime] Language: ${selected.language || "unknown"}`
      );
      console.log(
        `[Latanime] URL: ${selected.url}`
      );
    }
    const streams = [];
    const processedEpisodeUrls = /* @__PURE__ */ new Set();
    for (const selected of selectedResults) {
      if (!selected) {
        continue;
      }
      let episodeUrl = selected.url;
      if (mediaType === "tv") {
        if (!Number.isInteger(
          Number(season)
        ) || !Number.isInteger(
          Number(episode)
        )) {
          throw new Error(
            "[Latanime] A TV request requires season and episode numbers."
          );
        }
        episodeUrl = yield getEpisodeUrl(
          selected.url,
          season,
          episode
        );
        if (!episodeUrl) {
          console.warn(
            `[Latanime] Episode S${season}E${episode} not found for ${selected.language || "unknown"}`
          );
          continue;
        }
        console.log(
          `[Latanime] ${languageLabel(selected.language)} episode URL: ${episodeUrl}`
        );
      }
      const episodeKey = `${selected.language || "unknown"}|${episodeUrl}`;
      if (processedEpisodeUrls.has(
        episodeKey
      )) {
        continue;
      }
      processedEpisodeUrls.add(
        episodeKey
      );
      const episodeHtml = yield fetchText(
        episodeUrl
      );
      console.log(
        `[Latanime] Episode HTML length: ${episodeHtml.length}`
      );
      const servers = extractServers(
        episodeHtml,
        episodeUrl
      );
      console.log(
        `[Latanime] Servers found for ${languageLabel(selected.language)}: ${servers.length}`
      );
      for (const server of servers) {
        console.log(
          `[Latanime] Processing server: ${server.name} (${languageLabel(selected.language)})`
        );
        let resolver = getResolver(
          server.name
        );
        if (!resolver) {
          resolver = getResolverByUrl(
            server.url
          );
          if (resolver) {
            console.log(
              `[Latanime] Resolver found by URL for: ${server.name}`
            );
          }
        }
        if (!resolver) {
          console.log(
            `[Latanime] No resolver for: ${server.name}`
          );
          continue;
        }
        try {
          const resolved = yield resolver(
            server.url
          );
          if (!resolved || !resolved.url) {
            console.warn(
              `[Latanime] Resolver returned no stream: ${server.name}`
            );
            continue;
          }
          const quality = resolved.quality || "HD";
          const serverName = resolved.serverName || server.name;
          const language = languageLabel(
            selected.language
          );
          const streamUrl = resolved.url;
          const duplicate = streams.some(
            (stream) => stream.url === streamUrl && stream.title === `${language} \u2022 ${serverName} \u2022 ${quality}`
          );
          if (duplicate) {
            continue;
          }
          streams.push({
            name: `Latanime \u2022 ${language} \u2022 ${serverName}`,
            title: `${language} \u2022 ${serverName} \u2022 ${quality}`,
            quality,
            url: streamUrl,
            verified: resolved.verified === true,
            headers: resolved.headers || {},
            behaviorHints: resolved.behaviorHints || {
              notWebReady: false
            }
          });
          console.log(
            `[Latanime] Stream added: ${language} / ${serverName} / ${quality}`
          );
        } catch (error) {
          console.warn(
            `[Latanime] Resolver failed for ${server.name}: ${error.message}`
          );
        }
      }
    }
    console.log(
      `[Latanime] Final streams: ${streams.length}`
    );
    return streams;
  });
}
function extractServers(html, pageUrl) {
  const $ = import_cheerio_without_node_native3.default.load(
    html
  );
  const servers = [];
  const seen = /* @__PURE__ */ new Set();
  $("a.play-video[data-player]").each(
    (index, element) => {
      const encoded = $(element).attr(
        "data-player"
      );
      if (!encoded) {
        return;
      }
      const name = $(element).text().replace(
        /\s+/g,
        " "
      ).trim();
      const url = decodeBase64(
        encoded
      );
      if (!url || !/^https?:\/\//i.test(
        url
      )) {
        return;
      }
      const key = url.trim().toLowerCase();
      if (seen.has(
        key
      )) {
        return;
      }
      seen.add(
        key
      );
      servers.push({
        name: name || "Unknown",
        url: url.trim(),
        pageUrl
      });
    }
  );
  return servers;
}
function getResolverByUrl(serverUrl) {
  if (typeof serverUrl !== "string") {
    return null;
  }
  let hostname = "";
  try {
    hostname = new URL(
      serverUrl
    ).hostname.toLowerCase();
  } catch (error) {
    return null;
  }
  if (hostname === "mp4upload.com" || hostname.endsWith(
    ".mp4upload.com"
  )) {
    return getResolver(
      "mp4upload"
    );
  }
  if (hostname === "hexload.com" || hostname.endsWith(
    ".hexload.com"
  )) {
    return getResolver(
      "hexload"
    );
  }
  return null;
}
function decodeBase64(value) {
  try {
    let input = String(
      value || ""
    ).trim().replace(
      /\s+/g,
      ""
    );
    if (!input) {
      return null;
    }
    input = input.replace(
      /-/g,
      "+"
    ).replace(
      /_/g,
      "/"
    );
    while (input.length % 4 !== 0) {
      input += "=";
    }
    return atob(
      input
    ) || null;
  } catch (error) {
    console.warn(
      `[Latanime] Base64 decode error: ${error.message}`
    );
    return null;
  }
}
function searchLatanimeByAllTitles(media) {
  return __async(this, null, function* () {
    const titles = [];
    addTitle(
      titles,
      media.title
    );
    addTitle(
      titles,
      media.originalTitle
    );
    if (Array.isArray(
      media.alternativeTitles
    )) {
      for (const title of media.alternativeTitles) {
        addTitle(
          titles,
          title
        );
      }
    }
    const searchTitles = expandSearchTitles(
      titles
    );
    console.log(
      `[Latanime] Search variants: ${searchTitles.length}`
    );
    const allResults = [];
    const seen = /* @__PURE__ */ new Set();
    for (const title of searchTitles) {
      try {
        const found = yield searchLatanime(
          title
        );
        console.log(
          `[Latanime] Results for "${title}": ${found.length}`
        );
        for (const result of found) {
          if (!(result == null ? void 0 : result.url)) {
            continue;
          }
          if (seen.has(
            result.url
          )) {
            continue;
          }
          seen.add(
            result.url
          );
          allResults.push(
            result
          );
        }
      } catch (error) {
        console.warn(
          `[Latanime] Search failed for "${title}": ${error.message}`
        );
      }
    }
    if (allResults.length === 0) {
      console.log(
        "[Latanime] No results with normal title searches. Trying partial searches..."
      );
      const partialTitles = buildPartialSearchTitles(
        titles
      );
      for (const title of partialTitles) {
        try {
          console.log(
            `[Latanime] Partial search: ${title}`
          );
          const found = yield searchLatanime(
            title
          );
          for (const result of found) {
            if (!(result == null ? void 0 : result.url)) {
              continue;
            }
            if (seen.has(
              result.url
            )) {
              continue;
            }
            seen.add(
              result.url
            );
            allResults.push(
              result
            );
          }
        } catch (error) {
          console.warn(
            `[Latanime] Partial search failed for "${title}": ${error.message}`
          );
        }
      }
    }
    return allResults;
  });
}
function buildPartialSearchTitles(titles) {
  const result = [];
  const seen = /* @__PURE__ */ new Set();
  for (const title of titles) {
    const normalized = String(
      title || ""
    ).replace(
      /[–—_-]+/g,
      " "
    ).replace(
      /[,.;:()[\]]/g,
      " "
    ).replace(
      /\s+/g,
      " "
    ).trim();
    if (!normalized) {
      continue;
    }
    const words = normalized.split(
      " "
    ).filter(
      (word) => word.length >= 2
    );
    if (words.length >= 2) {
      addPartial(
        result,
        seen,
        words.slice(
          0,
          2
        ).join(
          " "
        )
      );
    }
    if (words.length >= 3) {
      addPartial(
        result,
        seen,
        words.slice(
          0,
          3
        ).join(
          " "
        )
      );
    }
    if (words.length >= 1) {
      const first = words[0];
      if (first.length >= 4) {
        addPartial(
          result,
          seen,
          first
        );
      }
    }
    if (words.length >= 3) {
      const tail = words.slice(
        -3
      ).join(
        " "
      );
      addPartial(
        result,
        seen,
        tail
      );
    }
  }
  return result;
}
function addPartial(result, seen, value) {
  const clean = String(
    value || ""
  ).trim();
  if (!clean) {
    return;
  }
  const key = normalizeTitle(
    clean
  );
  if (seen.has(
    key
  )) {
    return;
  }
  seen.add(
    key
  );
  result.push(
    clean
  );
}
function addTitle(titles, title) {
  if (typeof title !== "string") {
    return;
  }
  const clean = title.trim();
  if (!clean) {
    return;
  }
  const exists = titles.some(
    (item) => normalizeTitle(
      item
    ) === normalizeTitle(
      clean
    )
  );
  if (!exists) {
    titles.push(
      clean
    );
  }
}
function expandSearchTitles(titles) {
  const result = [];
  const seen = /* @__PURE__ */ new Set();
  const add = (title) => {
    if (typeof title !== "string") {
      return;
    }
    const clean = title.trim();
    if (!clean) {
      return;
    }
    const key = normalizeTitle(
      clean
    );
    if (seen.has(
      key
    )) {
      return;
    }
    seen.add(
      key
    );
    result.push(
      clean
    );
  };
  for (const title of titles) {
    add(
      title
    );
    const noDiacritics = title.normalize(
      "NFD"
    ).replace(
      /[\u0300-\u036f]/g,
      ""
    );
    add(
      noDiacritics
    );
    const separated = noDiacritics.replace(
      /[-–—_]+/g,
      " "
    ).replace(
      /\s+/g,
      " "
    ).trim();
    add(
      separated
    );
    const compact = separated.replace(
      /[^a-zA-Z0-9]+/g,
      " "
    ).split(
      /\s+/
    ).filter(
      Boolean
    ).join(
      ""
    );
    if (compact.length >= 4) {
      add(
        compact
      );
    }
    const words = separated.split(
      /\s+/
    ).filter(
      Boolean
    );
    if (words.length > 1) {
      add(
        words.join("")
      );
    }
  }
  return result;
}
function selectResults(results, media, requestedSeason) {
  let candidates = results;
  if (requestedSeason !== null && requestedSeason !== void 0) {
    const targetSeason = Number(
      requestedSeason
    );
    const seasonResults = candidates.filter(
      (result) => Number(
        result.season
      ) === targetSeason
    );
    const unknownSeasonResults = candidates.filter(
      (result) => result.season === null || result.season === void 0
    );
    if (seasonResults.length > 0) {
      candidates = seasonResults;
      console.log(
        `[Latanime] Season filter S${targetSeason}: ${seasonResults.length} result(s)`
      );
    } else if (unknownSeasonResults.length > 0) {
      candidates = unknownSeasonResults;
      console.log(
        `[Latanime] No explicit S${targetSeason} result found; using ${unknownSeasonResults.length} result(s) with unknown season.`
      );
    } else {
      console.log(
        `[Latanime] No explicit S${targetSeason} result found.`
      );
      return [];
    }
  }
  const mainResults = candidates.filter(
    (result) => !isStrongAuxiliaryResult(
      result
    )
  );
  if (mainResults.length > 0) {
    candidates = mainResults;
  }
  const titles = [];
  addTitle(
    titles,
    media.title
  );
  addTitle(
    titles,
    media.originalTitle
  );
  if (Array.isArray(
    media.alternativeTitles
  )) {
    for (const title of media.alternativeTitles) {
      addTitle(
        titles,
        title
      );
    }
  }
  const normalizedTitles = titles.map(
    normalizeTitle
  );
  const scored = candidates.map(
    (result) => {
      const cleanTitle = cleanResultTitle(
        result.title
      );
      const normalizedResult = normalizeTitle(
        cleanTitle
      );
      let score = 0;
      if (normalizedTitles.includes(
        normalizedResult
      )) {
        score += 100;
      }
      for (const title of normalizedTitles) {
        if (!title) {
          continue;
        }
        if (normalizedResult.includes(
          title
        ) || title.includes(
          normalizedResult
        )) {
          score += 50;
        }
        const resultWords = new Set(
          normalizedResult.split(
            " "
          )
        );
        const titleWords = title.split(
          " "
        );
        for (const word of titleWords) {
          if (word.length >= 3 && resultWords.has(
            word
          )) {
            score += 5;
          }
        }
      }
      if (media.year && result.year && Number(
        media.year
      ) === Number(
        result.year
      )) {
        score += 25;
      }
      if (result.language === "latino") {
        score += 10;
      } else if (result.language === "castellano") {
        score += 5;
      }
      if (isSpecialVariant(
        result
      )) {
        score -= 20;
      } else {
        score += 10;
      }
      return {
        result,
        score
      };
    }
  );
  const latino = scored.filter(
    (item) => normalizeLanguage(
      item.result.language
    ) === "latino"
  ).sort(
    (a, b) => b.score - a.score
  );
  const castellano = scored.filter(
    (item) => normalizeLanguage(
      item.result.language
    ) === "castellano"
  ).sort(
    (a, b) => b.score - a.score
  );
  const unknown = scored.filter(
    (item) => !normalizeLanguage(
      item.result.language
    )
  ).sort(
    (a, b) => b.score - a.score
  );
  const selected = [];
  if (latino.length > 0) {
    selected.push(
      selectBestLanguageResult(
        latino
      )
    );
  }
  if (castellano.length > 0) {
    selected.push(
      selectBestLanguageResult(
        castellano
      )
    );
  }
  if (selected.length === 0 && unknown.length > 0) {
    selected.push(
      selectBestLanguageResult(
        unknown
      )
    );
  }
  console.log(
    "[Latanime] Resultados seleccionados:"
  );
  for (const result of selected) {
    if (!result) {
      continue;
    }
    console.log(
      `  ${languageLabel(result.language)} \u2192 ${result.title} \u2192 ${result.url}`
    );
  }
  return selected.filter(
    Boolean
  );
}
function selectBestLanguageResult(scoredResults) {
  if (scoredResults.length === 0) {
    return null;
  }
  const normal = scoredResults.filter(
    (item) => !isSpecialVariant(
      item.result
    )
  );
  if (normal.length > 0) {
    return normal[0].result;
  }
  return scoredResults[0].result;
}
function isStrongAuxiliaryResult(result) {
  const title = String(
    (result == null ? void 0 : result.title) || ""
  ).toLowerCase();
  const url = String(
    (result == null ? void 0 : result.url) || ""
  ).toLowerCase();
  const text = `${title} ${url}`;
  const patterns = [
    "memory snow",
    "hyouketsu no kizuna",
    "break time",
    "pelicula",
    "pel\xEDcula",
    "corto"
  ];
  return patterns.some(
    (pattern) => text.includes(
      pattern
    )
  );
}
function isSpecialVariant(result) {
  const title = String(
    (result == null ? void 0 : result.title) || ""
  ).toLowerCase();
  const url = String(
    (result == null ? void 0 : result.url) || ""
  ).toLowerCase();
  const text = `${title} ${url}`;
  return text.includes(
    "director's cut"
  ) || text.includes(
    "directors cut"
  ) || text.includes(
    "director cut"
  );
}
function normalizeLanguage(language) {
  const value = String(
    language || ""
  ).toLowerCase().trim();
  if (value.includes(
    "latino"
  )) {
    return "latino";
  }
  if (value.includes(
    "castellano"
  )) {
    return "castellano";
  }
  return null;
}
function languageLabel(language) {
  const normalized = normalizeLanguage(
    language
  );
  if (normalized === "latino") {
    return "Latino";
  }
  if (normalized === "castellano") {
    return "Castellano";
  }
  return "Audio";
}
function cleanResultTitle(title) {
  return String(
    title || ""
  ).replace(
    /\b(?:latino|castellano|subtitulado|sub)\b/gi,
    ""
  ).replace(
    /\bS\d+\b/gi,
    ""
  ).replace(
    /\btemporada\s+\d+\b/gi,
    ""
  ).replace(
    /\bdirector'?s?\s+cut\b/gi,
    ""
  ).replace(
    /\s+/g,
    " "
  ).trim();
}
function normalizeTitle(title) {
  if (typeof title !== "string") {
    return "";
  }
  return title.normalize(
    "NFD"
  ).replace(
    /[\u0300-\u036f]/g,
    ""
  ).toLowerCase().replace(
    /[^a-z0-9]+/g,
    " "
  ).trim();
}

// src/latanime/index.js
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    console.log("[Latanime] getStreams()");
    console.log("[Latanime] tmdbId:", tmdbId);
    console.log("[Latanime] mediaType:", mediaType);
    console.log("[Latanime] season:", season);
    console.log("[Latanime] episode:", episode);
    try {
      const streams = yield extractStreams(
        tmdbId,
        mediaType,
        season,
        episode
      );
      console.log("[Latanime] streams:", streams);
      return streams;
    } catch (error) {
      console.error("[Latanime] Error:", error.message);
      return [];
    }
  });
}
module.exports = { getStreams };
