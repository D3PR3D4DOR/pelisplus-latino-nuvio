/**
 * pelisplushd - Built from src/pelisplushd/
 * Generated: 2026-08-26T00:31:32.260Z
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

// src/pelisplushd/http.js
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
    console.log(
      `[Template] Fetching: ${url}`
    );
    const response = yield fetch(
      url,
      __spreadProps(__spreadValues({}, options), {
        headers: __spreadValues(__spreadValues({}, HEADERS), options.headers)
      })
    );
    if (!response.ok) {
      throw new Error(
        `HTTP error ${response.status} for ${url}`
      );
    }
    return yield response.text();
  });
}
function fetchJson(_0) {
  return __async(this, arguments, function* (url, options = {}) {
    const raw = yield fetchText(
      url,
      options
    );
    return JSON.parse(
      raw
    );
  });
}

// src/pelisplushd/tmdb.js
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

// src/pelisplushd/search.js
var import_cheerio_without_node_native = __toESM(require("cheerio-without-node-native"));
var BASE_URL = "https://pelisplushd.bz";
function searchMovie(title) {
  return __async(this, null, function* () {
    return search(title, "a.Posters-link.movies");
  });
}
function searchSeries(title) {
  return __async(this, null, function* () {
    return search(title, "a.Posters-link.series, a.Posters-link.animes");
  });
}
function search(title, selector) {
  return __async(this, null, function* () {
    const url = `${BASE_URL}/search?s=${encodeURIComponent(title)}`;
    console.log(`[PelisPlusHD] Searching: ${url}`);
    const html = yield fetchText(url);
    const $ = import_cheerio_without_node_native.default.load(html);
    const results = [];
    $(selector).each((_, element) => {
      const card = $(element);
      const url2 = card.attr("href");
      const poster = card.find("img").attr("src");
      const rawTitle = card.find("p").text().trim();
      const rating = card.find(".rating span").text().trim();
      let title2 = rawTitle;
      let year = null;
      const match = rawTitle.match(/^(.*)\((\d{4})\)$/);
      if (match) {
        title2 = match[1].trim();
        year = Number(match[2]);
      }
      results.push({
        title: title2,
        year,
        rating: Number.parseFloat(rating),
        poster,
        url: url2
      });
    });
    return results;
  });
}

// src/pelisplushd/movie.js
function loadMovie(url) {
  return __async(this, null, function* () {
    console.log(`[PelisPlusHD] Loading: ${url}`);
    return yield fetchText(url);
  });
}

// src/pelisplushd/pow.js
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

// src/pelisplushd/crypto.js
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

// src/pelisplushd/embed69.js
function resolveEmbed69(url) {
  return __async(this, null, function* () {
    console.log(`[Embed69] Opening: ${url}`);
    const html = yield fetchText(url);
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

// src/pelisplushd/hls.js
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

// src/pelisplushd/resolvers/vidhide.js
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

// src/pelisplushd/resolvers/streamwish2.js
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

// src/pelisplushd/series.js
var import_cheerio_without_node_native2 = __toESM(require("cheerio-without-node-native"));
function getEpisodeUrl(seriesUrl, season, episode) {
  return __async(this, null, function* () {
    const html = yield fetchText(seriesUrl);
    const $ = import_cheerio_without_node_native2.default.load(html);
    const requestedSeason = Number(season);
    const requestedEpisode = Number(episode);
    let episodeUrl = null;
    $("a[href]").each((_, element) => {
      if (episodeUrl) {
        return;
      }
      const href = $(element).attr("href");
      if (!href) {
        return;
      }
      const url = new URL(href, seriesUrl);
      const match = url.pathname.match(
        /\/(?:temporada|season)\/(\d+)\/(?:capitulo|episode)\/(\d+)\/?$/i
      );
      if (match && Number(match[1]) === requestedSeason && Number(match[2]) === requestedEpisode) {
        episodeUrl = url.href;
      }
    });
    return episodeUrl;
  });
}

// src/pelisplushd/extractor.js
function extractStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    console.log(
      `[PelisPlusHD] Searching TMDB ID: ${tmdbId}`
    );
    const media = yield getMedia(
      tmdbId,
      mediaType
    );
    console.log(
      "[PelisPlusHD] TMDB:",
      media
    );
    const results = yield searchPelisPlus(
      media,
      mediaType
    );
    if (results.length === 0) {
      return [];
    }
    const selected = selectResult(
      results,
      media
    );
    const contentUrl = yield getContentUrl(
      selected.url,
      mediaType,
      season,
      episode
    );
    if (!contentUrl) {
      return [];
    }
    console.log(
      `[PelisPlusHD] Selected: ${contentUrl}`
    );
    const html = yield loadMovie(
      contentUrl
    );
    const streams = [];
    const matches = [
      ...html.matchAll(
        /video\[\d+\]\s*=\s*['"]([^'"]+)['"]/g
      )
    ];
    console.log(
      `[PelisPlusHD] Video embeds encontrados: ${matches.length}`
    );
    for (const match of matches) {
      const embedUrl = match[1];
      console.log(
        `[PelisPlusHD] Video URL: ${embedUrl}`
      );
      if (embedUrl.includes(
        "embed69.org"
      )) {
        yield processEmbed69(
          embedUrl,
          streams
        );
        continue;
      }
      if (embedUrl.includes(
        "xupalace.org"
      )) {
        yield processXupala\u0441e(
          embedUrl,
          streams
        );
        continue;
      }
      console.log(
        `[DEBUG] Embed ignorado: ${embedUrl}`
      );
    }
    streams.sort(
      (a, b) => {
        const qualityA = getQualityNumber(
          a.quality
        );
        const qualityB = getQualityNumber(
          b.quality
        );
        if (qualityA !== qualityB) {
          return qualityB - qualityA;
        }
        const aIsStreamWish = String(
          a.name
        ).toLowerCase().includes(
          "streamwish"
        );
        const bIsStreamWish = String(
          b.name
        ).toLowerCase().includes(
          "streamwish"
        );
        if (aIsStreamWish !== bIsStreamWish) {
          return aIsStreamWish ? -1 : 1;
        }
        return 0;
      }
    );
    return streams;
  });
}
function processEmbed69(embedUrl, streams) {
  return __async(this, null, function* () {
    console.log(
      `[Embed69] Opening: ${embedUrl}`
    );
    let languages;
    try {
      languages = yield resolveEmbed69(
        embedUrl
      );
    } catch (error) {
      console.warn(
        `[Embed69] Error: ${error.message}`
      );
      return;
    }
    console.log(
      `[DEBUG] Idiomas encontrados: ${languages.length}`
    );
    for (const language of languages) {
      if (!Array.isArray(
        language.sortedEmbeds
      )) {
        console.log(
          `[DEBUG] ${language.video_language}: sin sortedEmbeds`
        );
        continue;
      }
      console.log(
        `[DEBUG] ${language.video_language}: ${language.sortedEmbeds.length} servidores`
      );
      for (const server of language.sortedEmbeds) {
        if (!(server == null ? void 0 : server.link)) {
          continue;
        }
        console.log(
          `[DEBUG] Servidor: ${language.video_language} -> ${server.servername} -> ${server.link}`
        );
        yield processKnownServer(
          server.servername,
          server.link,
          language.video_language,
          streams
        );
      }
    }
  });
}
function processXupala\u0441e(embedUrl, streams) {
  return __async(this, null, function* () {
    console.log(
      `[Xupala\u0441e] Opening: ${embedUrl}`
    );
    let html;
    try {
      html = yield fetchText(
        embedUrl
      );
    } catch (error) {
      console.warn(
        `[Xupala\u0441e] Error: ${error.message}`
      );
      return;
    }
    console.log(
      `[Xupala\u0441e] HTML length: ${html.length}`
    );
    const servers = extractXupala\u0441eServers(
      html
    );
    console.log(
      `[Xupala\u0441e] Servidores encontrados: ${servers.length}`
    );
    for (const server of servers) {
      console.log(
        `[Xupala\u0441e] ${server.name} -> ${server.url}`
      );
      yield processKnownServer(
        server.name,
        server.url,
        "LAT",
        streams
      );
    }
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
    const nameMatch = block.match(
      /<span[^>]*>\s*([^<]+?)\s*<\/span>/i
    );
    if (!nameMatch) {
      continue;
    }
    const name = nameMatch[1].trim().toLowerCase();
    const url = urlMatch[1].trim();
    if (!url) {
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
function processKnownServer(serverName, link, language, streams) {
  return __async(this, null, function* () {
    const normalizedName = serverName == null ? void 0 : serverName.trim().toLowerCase();
    if (!normalizedName || !link) {
      return;
    }
    console.log(
      `[DEBUG] serverName normalizado: "${normalizedName}"`
    );
    let variants = [];
    if (normalizedName === "vidhide") {
      console.log(
        `[Vidhide] Resolving: ${link}`
      );
      try {
        variants = yield resolveVidhide(
          link
        );
      } catch (error) {
        console.warn(
          `[Vidhide] Error: ${error.message}`
        );
        return;
      }
    } else if (normalizedName === "streamwish") {
      console.log(
        `[StreamWish2] Resolving: ${link}`
      );
      try {
        variants = yield resolveStreamwish2(
          link
        );
      } catch (error) {
        const message = (error == null ? void 0 : error.message) || String(error);
        console.warn(
          `[StreamWish2] Error: ${message}`
        );
        streams.push({
          name: `StreamWish ERROR: ${message}`,
          title: `StreamWish error: ${message}`,
          language,
          quality: "ERROR",
          url: link
        });
        return;
      }
    } else {
      console.log(
        `[DEBUG] Servidor ignorado: "${normalizedName}"`
      );
      return;
    }
    if (!Array.isArray(
      variants
    )) {
      return;
    }
    for (const variant of variants) {
      if (!(variant == null ? void 0 : variant.url)) {
        continue;
      }
      let displayName;
      if (normalizedName === "streamwish") {
        displayName = "StreamWish \u2022 " + (variant.quality || "auto") + " \u2705";
      } else if (normalizedName === "vidhide") {
        displayName = "VidHide \u2022 " + (variant.quality || "auto") + " \u2705";
      } else {
        displayName = normalizedName + " \u2022 " + (variant.quality || "auto") + " \u2705";
      }
      const stream = {
        name: displayName,
        language,
        quality: variant.quality || "auto",
        url: variant.url
      };
      if (variant.headers) {
        stream.headers = variant.headers;
      }
      streams.push(
        stream
      );
    }
  });
}
function getQualityNumber(quality) {
  const match = String(
    quality
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
function getMedia(tmdbId, mediaType) {
  return __async(this, null, function* () {
    if (mediaType === "movie") {
      return getMovie(
        tmdbId
      );
    }
    if (mediaType === "tv") {
      return getTv(
        tmdbId
      );
    }
    throw new Error(
      `[PelisPlusHD] Unsupported media type: ${mediaType}`
    );
  });
}
function searchPelisPlus(media, mediaType) {
  return __async(this, null, function* () {
    const search2 = mediaType === "tv" ? searchSeries : searchMovie;
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
      `[PelisPlusHD] Search variants: ${searchTitles.length}`
    );
    for (const title of searchTitles) {
      console.log(
        `[PelisPlusHD] Search candidate: ${title}`
      );
    }
    const allResults = [];
    const seen = /* @__PURE__ */ new Set();
    for (const title of searchTitles) {
      try {
        const results = yield search2(
          title
        );
        console.log(
          `[PelisPlusHD] Results for "${title}": ${results.length}`
        );
        for (const result of results) {
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
          `[PelisPlusHD] Search failed for "${title}": ${error.message}`
        );
      }
    }
    return allResults;
  });
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
    const key = clean.toLowerCase();
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
    add(
      noDiacritics.replace(
        /[-–—_]+/g,
        " "
      )
    );
    add(
      noDiacritics.replace(
        /[-–—_]+/g,
        " "
      ).replace(
        /\s+/g,
        " "
      ).trim()
    );
    const compact = noDiacritics.replace(
      /[^a-zA-Z0-9]+/g,
      " "
    ).split(
      /\s+/
    ).filter(Boolean).join("");
    if (compact.length >= 4) {
      add(
        compact
      );
    }
    const words = noDiacritics.replace(
      /[-–—_]+/g,
      " "
    ).split(
      /\s+/
    ).filter(Boolean);
    if (words.length > 1) {
      add(
        words.join("")
      );
    }
  }
  return result;
}
function getContentUrl(url, mediaType, season, episode) {
  return __async(this, null, function* () {
    if (mediaType === "movie") {
      return url;
    }
    if (!Number.isInteger(
      Number(season)
    ) || !Number.isInteger(
      Number(episode)
    )) {
      throw new Error(
        "[PelisPlusHD] A TV request requires season and episode numbers."
      );
    }
    const episodeUrl = yield getEpisodeUrl(
      url,
      season,
      episode
    );
    if (!episodeUrl) {
      console.warn(
        `[PelisPlusHD] Episode S${season}E${episode} was not found.`
      );
    }
    return episodeUrl;
  });
}
function selectResult(results, media) {
  const sameYear = media.year === null ? [] : results.filter(
    (result) => result.year === media.year
  );
  const candidates = sameYear.length > 0 ? sameYear : results;
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
  const exactMatch = candidates.find(
    (result) => normalizedTitles.includes(
      normalizeTitle(
        result.title
      )
    )
  );
  if (exactMatch) {
    return exactMatch;
  }
  const flexibleMatch = candidates.find(
    (result) => isSimilarTitle(
      result.title,
      titles
    )
  );
  return flexibleMatch || candidates[0];
}
function isSimilarTitle(candidate, titles) {
  const candidateNormalized = normalizeTitle(
    candidate
  );
  if (!candidateNormalized) {
    return false;
  }
  for (const title of titles) {
    const normalized = normalizeTitle(
      title
    );
    if (!normalized) {
      continue;
    }
    if (normalized.includes(
      candidateNormalized
    ) || candidateNormalized.includes(
      normalized
    )) {
      return true;
    }
    const compactA = normalized.replace(
      /\s+/g,
      ""
    );
    const compactB = candidateNormalized.replace(
      /\s+/g,
      ""
    );
    if (compactA === compactB) {
      return true;
    }
  }
  return false;
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

// src/pelisplushd/index.js
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    try {
      console.log(`[PelisPlusHD] Request: ${mediaType} ${tmdbId}`);
      const streams = yield extractStreams(tmdbId, mediaType, season, episode);
      return streams;
    } catch (error) {
      console.error(`[PelisPlusHD] Error: ${error.message}`);
      return [];
    }
  });
}
module.exports = { getStreams };
