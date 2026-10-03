/**
 * cuevanapro - Built from src/cuevanapro/
 * Generated: 2026-10-03T19:25:29.874Z
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

// src/cuevanapro/extractor.js
var import_cheerio_without_node_native2 = __toESM(require("cheerio-without-node-native"));

// src/cuevanapro/search.js
var import_cheerio_without_node_native = __toESM(require("cheerio-without-node-native"));

// src/cuevanapro/http.js
var CATALOG_GATEWAY = "https://nuvio-gateway.agus-a-w.workers.dev";
function fetchCatalog(_0) {
  return __async(this, arguments, function* (url, options = {}) {
    const target = new URL(url);
    if (target.protocol !== "https:" || target.hostname !== "cuevanapro.org") {
      throw new Error(`Cat\xE1logo fuera del host permitido: ${target.hostname}`);
    }
    const response = yield fetch(
      `${CATALOG_GATEWAY}/?url=${encodeURIComponent(target.href)}`,
      options
    );
    if (!response.ok) {
      throw new Error(`Gateway HTTP ${response.status} para ${target.pathname}`);
    }
    return response.text();
  });
}
var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "es-AR,es;q=0.9,en-US;q=0.8,en;q=0.7",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache",
  "Upgrade-Insecure-Requests": "1"
};
function fetchText(_0) {
  return __async(this, arguments, function* (url, options = {}) {
    console.log(`[CuevanaPRO resolver] Fetching: ${url}`);
    const response = yield fetch(url, __spreadProps(__spreadValues({}, options), {
      headers: __spreadValues(__spreadValues({}, HEADERS), options.headers)
    }));
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} for ${url}`);
    }
    return response.text();
  });
}

// src/cuevanapro/search.js
var BASE_URL = "https://cuevanapro.org";
function searchCuevana(query, mediaType = null) {
  return __async(this, null, function* () {
    if (typeof query !== "string" || !query.trim()) {
      return [];
    }
    const normalizedQuery = query.trim().replace(/\s+/g, "+");
    const searchUrl = `${BASE_URL}/search?s=${encodeURIComponent(normalizedQuery).replace(/%2B/gi, "+")}`;
    const html = yield fetchCatalog(searchUrl);
    const $ = import_cheerio_without_node_native.default.load(html);
    const results = [];
    const seen = /* @__PURE__ */ new Set();
    $('a[href*="/anime/"], a[href*="/serie/"], a[href*="/pelicula/"]').each((_, element) => {
      var _a;
      const card = $(element);
      const href = card.attr("href");
      if (!href) {
        return;
      }
      let resultUrl;
      try {
        resultUrl = new URL(href, BASE_URL);
      } catch (e) {
        return;
      }
      if (resultUrl.hostname !== "cuevanapro.org") {
        return;
      }
      const pathType = (_a = resultUrl.pathname.split("/").filter(Boolean)[0]) == null ? void 0 : _a.toLowerCase();
      const resultType = pathType === "pelicula" ? "movie" : pathType === "serie" || pathType === "anime" ? "tv" : null;
      if (!resultType || mediaType && resultType !== mediaType) {
        return;
      }
      if (seen.has(resultUrl.href)) {
        return;
      }
      const image = card.find("img").first();
      const rawTitle = image.attr("alt") || image.attr("title") || card.text();
      const yearMatch = rawTitle.match(/\((\d{4})\)/);
      const title = rawTitle.replace(/^Ver\s+/i, "").replace(/\s*\(\d{4}\).*/, "").replace(/\s+-\s+(?:Anime|Serie|Pel[ií]cula).*$/i, "").trim();
      if (!title) {
        return;
      }
      const posterValue = image.attr("src") || image.attr("data-src") || "";
      let poster = "";
      if (posterValue) {
        try {
          poster = new URL(posterValue, BASE_URL).href;
        } catch (e) {
          poster = posterValue;
        }
      }
      const ratingValue = Number.parseFloat(
        card.find(".bg-yellow-500").first().text().trim()
      );
      seen.add(resultUrl.href);
      results.push({
        title,
        year: yearMatch ? Number(yearMatch[1]) : null,
        mediaType: resultType,
        url: resultUrl.href,
        poster,
        rating: Number.isFinite(ratingValue) ? ratingValue : null
      });
    });
    return results;
  });
}

// src/cuevanapro/tmdb.js
var TMDB_API_KEY = "c9755d2e8df3a75213cae8e91c03e743";
var TMDB_BASE_URL = "https://api.themoviedb.org/3";
function getTmdbDetails(tmdbId, mediaType) {
  return __async(this, null, function* () {
    if (!tmdbId) {
      throw new Error("Falta el TMDB ID");
    }
    if (mediaType !== "movie" && mediaType !== "tv") {
      throw new Error(`Tipo de contenido no v\xE1lido: ${mediaType}`);
    }
    const endpoint = `${TMDB_BASE_URL}/${mediaType}/${encodeURIComponent(tmdbId)}`;
    const apiKey = `api_key=${encodeURIComponent(TMDB_API_KEY)}`;
    const detailsResponse = yield fetch(
      `${endpoint}?${apiKey}&language=en-US`
    );
    if (!detailsResponse.ok) {
      throw new Error(`TMDB respondi\xF3 HTTP ${detailsResponse.status}`);
    }
    const [translationsResponse, alternativesResponse] = yield Promise.all([
      fetch(`${endpoint}/translations?${apiKey}`).catch(() => null),
      fetch(`${endpoint}/alternative_titles?${apiKey}`).catch(() => null)
    ]);
    const data = yield detailsResponse.json();
    const translationsData = (translationsResponse == null ? void 0 : translationsResponse.ok) ? yield translationsResponse.json().catch(() => null) : null;
    const alternativesData = (alternativesResponse == null ? void 0 : alternativesResponse.ok) ? yield alternativesResponse.json().catch(() => null) : null;
    const date = mediaType === "movie" ? data.release_date : data.first_air_date;
    const title = mediaType === "movie" ? data.title : data.name;
    const originalTitle = mediaType === "movie" ? data.original_title : data.original_name;
    const translatedTitles = ((translationsData == null ? void 0 : translationsData.translations) || []).map((entry) => {
      var _a, _b;
      return mediaType === "movie" ? (_a = entry.data) == null ? void 0 : _a.title : (_b = entry.data) == null ? void 0 : _b.name;
    }).filter(Boolean);
    const alternativeEntries = mediaType === "movie" ? alternativesData == null ? void 0 : alternativesData.titles : alternativesData == null ? void 0 : alternativesData.results;
    const alternativeTitles = (alternativeEntries || []).map((entry) => entry.title || entry.name).filter(Boolean);
    const aliases = [...new Set(
      [title, originalTitle, ...translatedTitles, ...alternativeTitles].filter((value) => typeof value === "string" && value.trim()).map((value) => value.trim())
    )];
    return {
      title,
      originalTitle,
      aliases,
      year: date ? Number(date.slice(0, 4)) : null
    };
  });
}

// src/cuevanapro/pow.js
function sha256Hex(text) {
  return __async(this, null, function* () {
    const data = new TextEncoder().encode(text);
    const hash = yield crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(hash)].map((v) => v.toString(16).padStart(2, "0")).join("");
  });
}
function sha256Bytes(text) {
  return __async(this, null, function* () {
    const data = new TextEncoder().encode(text);
    const hash = yield crypto.subtle.digest("SHA-256", data);
    return new Uint8Array(hash);
  });
}
function solvePow(challenge, difficulty, salt) {
  return __async(this, null, function* () {
    const prefix = "0".repeat(difficulty);
    let nonce = 0;
    while (true) {
      const hash = yield sha256Hex(challenge + nonce);
      if (hash.startsWith(prefix)) {
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

// src/cuevanapro/crypto.js
function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
function decryptAES(encryptedBase64, aesKey) {
  return __async(this, null, function* () {
    try {
      const raw = base64ToBytes(encryptedBase64);
      const iv = raw.slice(0, 16);
      const ciphertext = raw.slice(16);
      const key = yield crypto.subtle.importKey(
        "raw",
        aesKey.slice(0, 32),
        { name: "AES-CBC" },
        false,
        ["decrypt"]
      );
      const decrypted = yield crypto.subtle.decrypt(
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
  });
}

// src/cuevanapro/embed69.js
function resolveEmbed69(url) {
  return __async(this, null, function* () {
    console.log(`[Embed69] Opening: ${url}`);
    const html = yield fetchCatalog(url);
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
    const { aesKey } = yield solvePow(challenge, difficulty, salt);
    for (const file of dataLink) {
      for (const embedsKey of ["sortedEmbeds", "downloadEmbeds"]) {
        const embeds = file == null ? void 0 : file[embedsKey];
        if (!Array.isArray(embeds)) {
          continue;
        }
        for (const embed of embeds) {
          if (!(embed == null ? void 0 : embed.link) || typeof embed.link !== "string") {
            continue;
          }
          const link = yield decryptAES(embed.link, aesKey);
          if (link) {
            embed.link = link;
          }
        }
      }
    }
    return dataLink;
  });
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

// src/cuevanapro/hls.js
function extractHlsVariants(playlist, masterUrl) {
  const lines = playlist.split(/\r?\n/);
  const variants = [];
  for (let index = 0; index < lines.length; index++) {
    const streamInfo = lines[index].trim();
    if (!streamInfo.startsWith("#EXT-X-STREAM-INF:")) {
      continue;
    }
    const location = lines.slice(index + 1).find((line) => {
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
      quality: resolution ? `${resolution[1]}p` : name ? name[1] : "auto"
    });
  }
  return variants;
}

// src/cuevanapro/resolvers/vidhide.js
function resolveVidhide(url) {
  return __async(this, null, function* () {
    console.log(`[Vidhide] Opening ${url}`);
    const html = yield fetchText(url);
    const unpacked = unpackPacker(html);
    const sources = extractSources(unpacked, url);
    if (sources.length === 0) {
      throw new Error("[Vidhide] No se encontr\xF3 la configuraci\xF3n de JWPlayer.");
    }
    const streams = [];
    for (const source of sources) {
      try {
        console.log("[Vidhide] Master:", source.url);
        const response = yield fetch(source.url, {
          headers: __spreadProps(__spreadValues({}, HEADERS), {
            Referer: url,
            Origin: new URL(url).origin
          })
        });
        console.log("[Vidhide] HTTP status:", response.status);
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status} for ${source.url}`);
        }
        const playlist = yield response.text();
        console.log("[Vidhide] Playlist length:", playlist.length);
        console.log("[Vidhide] First line:", playlist.split("\n")[0]);
        console.log("[Vidhide] Is HLS:", playlist.trimStart().startsWith("#EXTM3U"));
        const variants = extractHlsVariants(playlist, source.url);
        console.log("[Vidhide] Variant count:", variants.length);
        console.log("[Vidhide] Variants:", variants);
        if (variants.length > 0) {
          streams.push(...variants);
          continue;
        }
      } catch (error) {
        console.warn(`[Vidhide] No se pudo leer el playlist ${source.url}:`, error.message);
      }
      streams.push({ url: source.url, quality: source.quality });
    }
    const result = removeDuplicates(streams);
    console.log("[Vidhide] Returning:", result);
    return result;
  });
}
function unpackPacker(html) {
  const match = html.match(
    /eval\(function\(p,a,c,k,e,d\)\{[\s\S]*?\}\('((?:\\.|[^'])*)',(\d+),(\d+),'((?:\\.|[^'])*)'\.split\('\|'\)\)\)/
  );
  if (!match) {
    return html;
  }
  let source = decodePackedString(match[1]);
  const base = Number(match[2]);
  const count = Number(match[3]);
  const dictionary = decodePackedString(match[4]).split("|");
  for (let index = count - 1; index >= 0; index--) {
    const replacement = dictionary[index];
    if (!replacement) {
      continue;
    }
    const token = index.toString(base);
    source = source.replace(
      new RegExp(`\\b${token}\\b`, "g"),
      replacement
    );
  }
  return source;
}
function decodePackedString(value) {
  return value.replace(/\\(x[\da-fA-F]{2}|u[\da-fA-F]{4}|.)/g, (match, escape) => {
    var _a;
    if (escape.startsWith("x")) {
      return String.fromCharCode(Number.parseInt(escape.slice(1), 16));
    }
    if (escape.startsWith("u")) {
      return String.fromCharCode(Number.parseInt(escape.slice(1), 16));
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
  });
}
function extractSources(source, pageUrl) {
  const sources = [];
  const matches = source.matchAll(
    /["'](hls4|hls3|hls2)["']\s*:\s*["']([^"']+)["']/g
  );
  for (const match of matches) {
    const url = new URL(match[2], pageUrl).href;
    if (!url.includes(".m3u8")) {
      continue;
    }
    sources.push({
      url,
      quality: "auto",
      priority: Number(match[1].slice(-1))
    });
  }
  return sources.sort((left, right) => right.priority - left.priority).slice(0, 1);
}
function removeDuplicates(streams) {
  const seen = /* @__PURE__ */ new Set();
  return streams.filter((stream) => {
    if (seen.has(stream.url)) {
      return false;
    }
    seen.add(stream.url);
    return true;
  });
}

// src/cuevanapro/resolvers/streamwish2.js
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
        `[StreamWish2] Hanerix devolvi\xC3\xB3 un HTML inesperadamente peque\xC3\xB1o: ${player.html.length} bytes`
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
    for (let i = 0; i < hlsSources.length; i++) {
      const source = hlsSources[i];
      console.log(
        `[StreamWish2] ${source.type} -> ${source.url}`
      );
    }
    const hls3 = hlsSources.find(
      (source) => source.type === "hls3"
    );
    if (!hls3) {
      const diagnostic = getHlsDiagnostic(
        unpacked,
        player.html
      );
      throw new Error(
        `[StreamWish2] No se encontr\xC3\xB3 hls3. ${diagnostic}`
      );
    }
    const masterUrl = hls3.url;
    console.log(
      `[StreamWish2] HLS3 master: ${masterUrl}`
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
    const variants = findVariants(
      master.text,
      masterUrl
    );
    if (variants.length === 0) {
      throw new Error(
        "[StreamWish2] No se encontraron variantes HLS."
      );
    }
    console.log(
      `[StreamWish2] Variantes encontradas: ${variants.length}`
    );
    for (let i = 0; i < variants.length; i++) {
      console.log(
        `[StreamWish2] ${variants[i].quality} upstream: ${variants[i].url}`
      );
    }
    const streams = [];
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      const proxyUrl = `${PROXY_BASE}/streamwish/playlist.m3u8?url=` + encodeURIComponent(
        variant.url
      );
      console.log(
        `[StreamWish2] ${variant.quality} proxy: ${proxyUrl}`
      );
      streams.push({
        url: proxyUrl,
        quality: variant.quality
      });
    }
    return streams;
  });
}
function getHanerixUrl(url) {
  try {
    const parsed = new URL(
      url
    );
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === "hglink.to" || hostname.endsWith(".hglink.to")) {
      parsed.hostname = "hanerix.com";
      return parsed.href;
    }
    if (hostname === "hanerix.com" || hostname.endsWith(".hanerix.com")) {
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
  while ((match = pattern1.exec(source)) !== null) {
    addHlsSource(
      sources,
      match[1],
      match[2],
      pageUrl
    );
  }
  const pattern2 = /\b(hls[234])\b\s*=\s*["']([^"']+)["']/gi;
  while ((match = pattern2.exec(source)) !== null) {
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
  const normalizedType = type.toLowerCase().trim();
  if (normalizedType !== "hls2" && normalizedType !== "hls3" && normalizedType !== "hls4") {
    return;
  }
  let cleanValue = value;
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
    const alreadyExists = sources.some(
      (source) => source.type === normalizedType && source.url === absoluteUrl
    );
    if (alreadyExists) {
      return;
    }
    sources.push({
      type: normalizedType,
      url: absoluteUrl
    });
  } catch (e) {
    console.log(
      `[StreamWish2] URL HLS inv\xC3\xA1lida: ${cleanValue}`
    );
  }
}
function getHlsDiagnostic(source, rawHtml) {
  const sourceLower = source.toLowerCase();
  const htmlLower = rawHtml.toLowerCase();
  const sourceHasHls2 = sourceLower.includes(
    "hls2"
  );
  const sourceHasHls3 = sourceLower.includes(
    "hls3"
  );
  const sourceHasHls4 = sourceLower.includes(
    "hls4"
  );
  const htmlHasHls2 = htmlLower.includes(
    "hls2"
  );
  const htmlHasHls3 = htmlLower.includes(
    "hls3"
  );
  const htmlHasHls4 = htmlLower.includes(
    "hls4"
  );
  const hasPacker = htmlLower.includes(
    "eval(function(p,a,c,k,e,d)"
  );
  return `RAW_HTML=${rawHtml.length} | UNPACKED=${source.length} | RAW_HLS2=${htmlHasHls2} | RAW_HLS3=${htmlHasHls3} | RAW_HLS4=${htmlHasHls4} | PACKER=${hasPacker} | UNPACKED_HLS2=${sourceHasHls2} | UNPACKED_HLS3=${sourceHasHls3} | UNPACKED_HLS4=${sourceHasHls4}`;
}
function findVariants(playlist, masterUrl) {
  const lines = playlist.split(
    /\r?\n/
  ).map(
    (line) => line.trim()
  );
  const variants = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith(
      "#EXT-X-STREAM-INF:"
    )) {
      continue;
    }
    const resolution = line.match(
      /RESOLUTION=\d+x(\d+)/i
    );
    const name = line.match(
      /(?:^|,)NAME="?([^",]+)"?(?:,|$)/i
    );
    const next = lines[i + 1];
    if (!next || next.startsWith("#")) {
      continue;
    }
    let quality = "auto";
    if (resolution) {
      quality = `${Number(
        resolution[1]
      )}p`;
    } else if (name) {
      quality = name[1].trim();
    }
    try {
      const streamUrl = new URL(
        next,
        masterUrl
      ).href;
      const alreadyExists = variants.some(
        (variant) => variant.url === streamUrl
      );
      if (alreadyExists) {
        continue;
      }
      variants.push({
        url: streamUrl,
        quality
      });
    } catch (e) {
      console.log(
        `[StreamWish2] Variante inv\xC3\xA1lida: ${next}`
      );
    }
  }
  variants.sort(
    (a, b) => qualityNumber(b.quality) - qualityNumber(a.quality)
  );
  return variants;
}
function qualityNumber(quality) {
  const match = String(
    quality
  ).match(
    /(\d+)p/i
  );
  if (!match) {
    return 99999;
  }
  return Number(
    match[1]
  );
}
function unpackPacker2(html) {
  const match = html.match(
    /eval\(function\(p,a,c,k,e,d\)\{[\s\S]*?\}\('((?:\\.|[^'])*)',(\d+),(\d+),'((?:\\.|[^'])*)'\.split\('\|'\)\)\)/
  );
  if (!match) {
    console.log(
      "[StreamWish2] No se encontr\xC3\xB3 c\xC3\xB3digo Packer."
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
  return value.replace(
    /\\(x[\da-fA-F]{2}|u[\da-fA-F]{4}|.)/g,
    (match, escape) => {
      var _a;
      if (escape.startsWith("x") || escape.startsWith("u")) {
        return String.fromCharCode(
          Number.parseInt(
            escape.slice(1),
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

// src/cuevanapro/extractor.js
var CUEVANA_HOST = "cuevanapro.org";
function normalizeTitle(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/^(?:(?:the|a|an|el|la|los|las|un|una|unos|unas|del|de la|de l|le|les|une|des|du|der|die|das|ein|eine|il|lo|gli|i|l|o|os|as|um|uma|uns|umas|da|das|do|dos)\s+)+/g, "").trim();
}
function findCatalogMatch(details, mediaType) {
  return __async(this, null, function* () {
    const rawQueries = [
      details.title,
      details.originalTitle,
      ...Array.isArray(details.aliases) ? details.aliases : []
    ];
    const queryMap = /* @__PURE__ */ new Map();
    for (const value of rawQueries) {
      if (typeof value !== "string" || !value.trim())
        continue;
      const query = value.trim();
      const normalized = normalizeTitle(query);
      if (normalized && !queryMap.has(normalized)) {
        queryMap.set(normalized, query);
      }
    }
    const queries = [...queryMap.values()];
    console.log(`[CuevanaPRO] T\xEDtulos consultados (${queries.length}): ${queries.join(" | ")}`);
    const wantedTitles = new Set(
      queries.map(normalizeTitle).filter(Boolean)
    );
    const seen = /* @__PURE__ */ new Set();
    for (const query of queries) {
      const results = yield searchCuevana(query, mediaType);
      for (const item of results) {
        if (!item.url || seen.has(item.url))
          continue;
        seen.add(item.url);
        const sameTitle = wantedTitles.has(normalizeTitle(item.title));
        const sameYear = !details.year || !item.year || details.year === item.year;
        if (sameTitle && sameYear) {
          return item;
        }
      }
    }
    return null;
  });
}
function findEpisodePage(seriesUrl, season, episode) {
  return __async(this, null, function* () {
    const html = yield fetchCatalog(seriesUrl);
    const $ = import_cheerio_without_node_native2.default.load(html);
    let episodeUrl = null;
    $("a[href]").each((_, element) => {
      if (episodeUrl)
        return;
      const href = $(element).attr("href");
      if (!href)
        return;
      try {
        const url = new URL(href, seriesUrl);
        if (url.protocol !== "https:" || url.hostname !== CUEVANA_HOST) {
          return;
        }
        const match = url.pathname.match(
          /\/temporada\/(\d+)\/capitulo\/(\d+)\/?$/i
        );
        if (match && Number(match[1]) === Number(season) && Number(match[2]) === Number(episode)) {
          episodeUrl = url.href;
        }
      } catch (e) {
      }
    });
    return episodeUrl;
  });
}
function findDirectVideoStreams(pageUrl, title) {
  return __async(this, null, function* () {
    const html = yield fetchCatalog(pageUrl);
    const $ = import_cheerio_without_node_native2.default.load(html);
    const streams = [];
    const seen = /* @__PURE__ */ new Set();
    $("video[src], video source[src], source[src]").each((_, element) => {
      const node = $(element);
      const rawUrl = node.attr("src");
      if (!rawUrl)
        return;
      const isInsideVideo = node.is("video") || node.closest("video").length > 0;
      const type = node.attr("type") || "";
      const looksLikeVideoFile = /\.(m3u8|mp4|m4v|webm|mov|mpd)(?:$|[?#])/i.test(rawUrl);
      if (!isInsideVideo && !type.startsWith("video/") && !looksLikeVideoFile) {
        return;
      }
      try {
        const url = new URL(rawUrl, pageUrl);
        if (url.protocol !== "https:" || seen.has(url.href))
          return;
        seen.add(url.href);
        streams.push({
          name: "CuevanaPRO",
          title,
          url: url.href,
          quality: node.attr("label") || node.attr("size") || "Auto",
          headers: { Referer: pageUrl }
        });
      } catch (e) {
      }
    });
    return streams;
  });
}
function resolveEmbedStreams(pageUrl, title) {
  return __async(this, null, function* () {
    const html = yield fetchCatalog(pageUrl);
    const $ = import_cheerio_without_node_native2.default.load(html);
    const embedUrls = /* @__PURE__ */ new Set();
    $("iframe[src]").each((_, element) => {
      const rawUrl = $(element).attr("src");
      if (!rawUrl)
        return;
      try {
        const url = new URL(rawUrl, pageUrl);
        if (url.protocol === "https:" && url.hostname === CUEVANA_HOST && url.pathname.startsWith("/vidurl/")) {
          embedUrls.add(url.href);
        }
      } catch (e) {
      }
    });
    console.log(`[CuevanaPRO] Embed69 encontrados: ${embedUrls.size}`);
    const streams = [];
    for (const embedUrl of embedUrls) {
      try {
        const languages = yield resolveEmbed69(embedUrl);
        for (const language of languages) {
          const servers = Array.isArray(language == null ? void 0 : language.sortedEmbeds) ? language.sortedEmbeds : [];
          for (const server of servers) {
            if (!(server == null ? void 0 : server.link))
              continue;
            const serverName = String(server.servername || "").trim().toLowerCase();
            let variants = [];
            try {
              if (serverName === "vidhide") {
                variants = yield resolveVidhide(server.link);
              } else if (serverName === "streamwish") {
                variants = yield resolveStreamwish2(server.link);
              } else {
                console.log(
                  `[CuevanaPRO] Resolver existente no disponible para: ${serverName}`
                );
                continue;
              }
            } catch (error) {
              console.warn(
                `[CuevanaPRO] ${serverName} fall\xF3: ${(error == null ? void 0 : error.message) || error}`
              );
              continue;
            }
            for (const variant of variants || []) {
              if (!(variant == null ? void 0 : variant.url))
                continue;
              const quality = variant.quality || "Auto";
              const stream = {
                name: `CuevanaPRO ${serverName} \u2022 ${language.video_language || "Video"}`,
                title: `${title} \u2022 ${language.video_language || "Video"} \u2022 ${quality}`,
                url: variant.url,
                quality
              };
              if (variant.headers) {
                stream.headers = variant.headers;
              }
              streams.push(stream);
            }
          }
        }
      } catch (error) {
        console.warn(
          `[CuevanaPRO] Embed69 fall\xF3: ${(error == null ? void 0 : error.message) || error}`
        );
      }
    }
    return streams;
  });
}
function extractStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    console.log(
      `[CuevanaPRO] Entrada: TMDB=${tmdbId}, tipo=${mediaType}, temporada=${season}, episodio=${episode}`
    );
    if (!tmdbId || !["movie", "tv"].includes(mediaType)) {
      return [];
    }
    const details = yield getTmdbDetails(tmdbId, mediaType);
    console.log(`[CuevanaPRO] TMDB: ${details.title} (${details.year || "?"})`);
    const match = yield findCatalogMatch(details, mediaType);
    console.log(
      `[CuevanaPRO] Coincidencia: ${match ? match.url : "ninguna"}`
    );
    if (!match)
      return [];
    let pageUrl = match.url;
    if (mediaType === "tv") {
      if (!season || !episode)
        return [];
      pageUrl = yield findEpisodePage(match.url, season, episode);
      console.log(
        `[CuevanaPRO] Episodio: ${pageUrl || "no encontrado"}`
      );
      if (!pageUrl)
        return [];
    }
    const directStreams = yield findDirectVideoStreams(pageUrl, details.title);
    const embedStreams = yield resolveEmbedStreams(pageUrl, details.title);
    const combined = [...directStreams, ...embedStreams];
    const unique = new Map(combined.map((stream) => [stream.url, stream]));
    console.log(`[CuevanaPRO] Streams: ${unique.size}`);
    const streams = [...unique.values()];
    const qualityRank = (value) => {
      const match2 = String(value || "").match(/(\d{3,4})\s*p?/i);
      return match2 ? Number(match2[1]) : 0;
    };
    const languageRank = (stream) => {
      const text = `${stream.name || ""} ${stream.title || ""}`.toUpperCase();
      if (/\bLAT(?:INO)?\b/.test(text))
        return 0;
      if (/\bESP(?:AÑOL)?\b/.test(text))
        return 1;
      if (/\bSUB(?:TITULADO)?\b/.test(text))
        return 2;
      return 3;
    };
    streams.sort(
      (a, b) => qualityRank(b.quality) - qualityRank(a.quality) || languageRank(a) - languageRank(b)
    );
    const qualityNumbers = /* @__PURE__ */ new Map([
      [1080, 1],
      [720, 2],
      [480, 3]
    ]);
    streams.forEach((stream) => {
      const quality = qualityRank(stream.quality);
      const order = qualityNumbers.get(quality) || 4;
      stream.name = `${order} \u2022 ${stream.name || "CuevanaPRO"}`;
    });
    return streams;
  });
}

// src/cuevanapro/index.js
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    try {
      return yield extractStreams(tmdbId, mediaType, season, episode);
    } catch (error) {
      console.error(`[CuevanaPRO] ${(error == null ? void 0 : error.message) || error}`);
      return [];
    }
  });
}
module.exports = { getStreams };
