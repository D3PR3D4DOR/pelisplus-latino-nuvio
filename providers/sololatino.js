/**
 * sololatino - Built from src/sololatino/
 * Generated: 2026-08-28T07:18:47.523Z
 */
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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
var TMDB_API_KEY = "c9755d2e8df3a75213cae8e91c03e743";
var SOLO = "https://sololatino.net";
var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
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
    return JSON.parse(
      text
    );
  });
}
function getTMDB(tmdbId, mediaType) {
  return __async(this, null, function* () {
    var _a;
    const type = mediaType === "movie" ? "movie" : "tv";
    const url = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&language=es-ES`;
    const data = yield fetchJson(
      url
    );
    return {
      title: type === "movie" ? data.title : data.name,
      originalTitle: type === "movie" ? data.original_title : data.original_name,
      year: Number(
        (_a = type === "movie" ? data.release_date : data.first_air_date) == null ? void 0 : _a.slice(0, 4)
      ) || null
    };
  });
}
function searchSoloLatino(title) {
  return __async(this, null, function* () {
    const url = `${SOLO}/buscar?q=` + encodeURIComponent(title);
    console.log(
      "[SoloLatino] Searching:",
      url
    );
    const html = yield fetchText(
      url
    );
    const results = [];
    const regex = /href=["']([^"']*\/(pelicula|serie)\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while (match = regex.exec(html)) {
      const itemUrl = new URL(
        match[1],
        SOLO
      ).href;
      const text = match[3].replace(
        /<[^>]+>/g,
        " "
      ).replace(
        /\s+/g,
        " "
      ).trim();
      if (!text) {
        continue;
      }
      const yearMatch = text.match(
        /\b(19|20)\d{2}\b/
      );
      results.push({
        title: text,
        year: yearMatch ? Number(
          yearMatch[0]
        ) : null,
        url: itemUrl
      });
    }
    console.log(
      `[SoloLatino] Results for "${title}": ${results.length}`
    );
    for (const result of results) {
      console.log(
        "[SoloLatino]   ",
        result.title,
        "|",
        result.year,
        "|",
        result.url
      );
    }
    return results;
  });
}
function normalize(value) {
  return String(
    value || ""
  ).normalize("NFD").replace(
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
function selectContent(results, media) {
  console.log(
    "[SoloLatino] Buscando coincidencia..."
  );
  const wantedTitles = [
    media.title,
    media.originalTitle
  ].filter(Boolean).map(normalize);
  console.log(
    "[SoloLatino] T\xEDtulos objetivo:",
    wantedTitles
  );
  let candidates = results.filter(
    (item) => !media.year || item.year === media.year
  );
  for (const item of candidates) {
    const itemTitle = normalize(
      cleanResultTitle(
        item.title
      )
    );
    for (const wanted of wantedTitles) {
      if (itemTitle === wanted || itemTitle.includes(wanted) || wanted.includes(itemTitle)) {
        console.log(
          "[SoloLatino] Match por t\xEDtulo:",
          item.title
        );
        return item;
      }
    }
  }
  for (const item of candidates) {
    const slug = getSlugFromUrl(
      item.url
    );
    if (!slug) {
      continue;
    }
    for (const wanted of wantedTitles) {
      if (slug === wanted || slug.includes(wanted) || wanted.includes(slug)) {
        console.log(
          "[SoloLatino] Match por slug:",
          item.title,
          "|",
          slug
        );
        return item;
      }
    }
  }
  for (const item of candidates) {
    const itemTitle = normalize(
      cleanResultTitle(
        item.title
      )
    );
    const itemTokens = new Set(
      itemTitle.split(/\s+/).filter(
        (token) => token.length >= 2 && !STOP_WORDS.has(token)
      )
    );
    for (const wanted of wantedTitles) {
      const wantedTokens = wanted.split(/\s+/).filter(
        (token) => token.length >= 2 && !STOP_WORDS.has(token)
      );
      if (wantedTokens.length === 0) {
        continue;
      }
      let matches = 0;
      for (const token of wantedTokens) {
        if (itemTokens.has(
          token
        )) {
          matches++;
        }
      }
      const ratio = matches / wantedTokens.length;
      if (ratio >= 0.6) {
        console.log(
          "[SoloLatino] Match por tokens:",
          item.title,
          "ratio:",
          ratio
        );
        return item;
      }
    }
  }
  console.log(
    "[SoloLatino] No se encontr\xF3 coincidencia."
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
function cleanResultTitle(value) {
  let text = String(
    value || ""
  );
  text = text.replace(
    /^\s*(pel[ií]cula|serie|anime|dibujos?)\s*★?\s*\d+(?:\.\d+)?\s*/i,
    ""
  );
  return text.replace(
    /\b(19|20)\d{2}\b/g,
    " "
  ).replace(
    /\s+/g,
    " "
  ).trim();
}
function getSlugFromUrl(url) {
  try {
    const parsed = new URL(
      url
    );
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length === 0) {
      return "";
    }
    return normalize(
      parts[parts.length - 1]
    );
  } catch (e) {
    return "";
  }
}
function extractServers(html) {
  const servers = [];
  const regex = /<[^>]*data-server-btn[^>]*data-player-token=["']([^"']+)["'][^>]*>([\s\S]*?)<\/[^>]+>/gi;
  let match;
  while (match = regex.exec(html)) {
    const label = match[2].replace(
      /<[^>]+>/g,
      " "
    ).replace(
      /\s+/g,
      " "
    ).trim();
    servers.push({
      label,
      token: match[1]
    });
  }
  return servers;
}
function getPlayerUrl(contentUrl, playerToken) {
  return __async(this, null, function* () {
    const csrfResponse = yield fetch(
      `${SOLO}/sanctum/csrf-cookie`,
      {
        headers: __spreadProps(__spreadValues({}, HEADERS), {
          "Accept": "*/*",
          "Referer": contentUrl,
          "Origin": SOLO
        })
      }
    );
    console.log(
      "[SoloLatino] CSRF:",
      csrfResponse.status
    );
    const rawCookie = csrfResponse.headers.get(
      "set-cookie"
    ) || "";
    console.log(
      "[SoloLatino] Set-Cookie:",
      rawCookie.length
    );
    const xsrfMatch = rawCookie.match(
      /(?:^|,\s*)XSRF-TOKEN=([^;]+)/i
    );
    const sessionMatch = rawCookie.match(
      /(?:^|,\s*)sololatinonet-session=([^;]+)/i
    );
    if (!xsrfMatch || !sessionMatch) {
      throw new Error(
        "No se pudieron extraer las cookies XSRF/session"
      );
    }
    const xsrf = xsrfMatch[1];
    const session = sessionMatch[1];
    const cookieHeader = `XSRF-TOKEN=${xsrf}; sololatinonet-session=${session}`;
    const response = yield fetch(
      `${SOLO}/api/player-url`,
      {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "X-XSRF-TOKEN": decodeURIComponent(
            xsrf
          ),
          "Cookie": cookieHeader,
          "Referer": contentUrl,
          "Origin": SOLO
        },
        body: JSON.stringify({
          t: playerToken
        })
      }
    );
    const text = yield response.text();
    console.log(
      "[SoloLatino] player-url:",
      response.status
    );
    if (!response.ok) {
      throw new Error(
        `player-url HTTP ${response.status}: ${text}`
      );
    }
    const data = JSON.parse(
      text
    );
    if (!(data == null ? void 0 : data.url)) {
      throw new Error(
        "player-url no devolvio URL"
      );
    }
    return data.url;
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
      (value) => value.toString(16).padStart(
        2,
        "0"
      )
    ).join("");
  });
}
function solvePow(challenge, difficulty, salt) {
  return __async(this, null, function* () {
    const prefix = "0".repeat(
      Number(
        difficulty
      )
    );
    let nonce = 0;
    while (true) {
      const hash = yield sha256Hex(
        challenge + nonce
      );
      if (hash.startsWith(
        prefix
      )) {
        return {
          nonce,
          aesKey: yield sha256Bytes(
            challenge + nonce + salt
          )
        };
      }
      nonce++;
    }
  });
}
function base64ToBytes(base64) {
  const binary = atob(
    base64
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
function decryptAES(value, aesKey) {
  return __async(this, null, function* () {
    const raw = base64ToBytes(
      value
    );
    const iv = raw.slice(
      0,
      16
    );
    const encrypted = raw.slice(
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
      ["decrypt"]
    );
    const decrypted = yield crypto.subtle.decrypt(
      {
        name: "AES-CBC",
        iv
      },
      key,
      encrypted
    );
    return new TextDecoder().decode(
      decrypted
    );
  });
}
function resolveEmbed69(url) {
  return __async(this, null, function* () {
    var _a, _b;
    console.log(
      "[Embed69] Opening:",
      url
    );
    const html = yield fetchText(
      url
    );
    const challenge = (_a = html.match(
      /const\s+POW_CHALLENGE\s*=\s*['"]([^'"]+)['"]/
    )) == null ? void 0 : _a[1];
    const difficultyMatch = html.match(
      /const\s+POW_DIFFICULTY\s*=\s*(\d+)/
    );
    const salt = (_b = html.match(
      /const\s+POW_SALT\s*=\s*['"]([^'"]+)['"]/
    )) == null ? void 0 : _b[1];
    const dataMatch = html.match(
      /let\s+dataLink\s*=\s*(\[[\s\S]*?\]);/
    );
    if (!challenge || !difficultyMatch || !salt || !dataMatch) {
      throw new Error(
        "Embed69: faltan datos"
      );
    }
    const difficulty = Number(
      difficultyMatch[1]
    );
    const dataLink = JSON.parse(
      dataMatch[1]
    );
    const solved = yield solvePow(
      challenge,
      difficulty,
      salt
    );
    for (const file of dataLink) {
      for (const key of [
        "sortedEmbeds",
        "downloadEmbeds"
      ]) {
        const embeds = file == null ? void 0 : file[key];
        if (!Array.isArray(
          embeds
        )) {
          continue;
        }
        for (const embed of embeds) {
          if (!(embed == null ? void 0 : embed.link)) {
            continue;
          }
          try {
            const decrypted = yield decryptAES(
              embed.link,
              solved.aesKey
            );
            if (decrypted) {
              embed.link = decrypted;
            }
          } catch (_) {
          }
        }
      }
    }
    return dataLink;
  });
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
    (_, escape) => {
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
function extractVidhideSources(source, pageUrl) {
  const sources = [];
  const matches = source.matchAll(
    /["'](hls4|hls3|hls2)["']\s*:\s*["']([^"']+)["']/g
  );
  for (const match of matches) {
    const url = new URL(
      match[2],
      pageUrl
    ).href;
    if (!url.includes(
      ".m3u8"
    )) {
      continue;
    }
    sources.push({
      url,
      quality: "auto",
      priority: Number(
        match[1].slice(-1)
      )
    });
  }
  return sources.sort(
    (a, b) => b.priority - a.priority
  ).slice(
    0,
    1
  );
}
function extractHlsVariants(playlist, masterUrl) {
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
    const resolution = line.match(
      /RESOLUTION=\d+x(\d+)/i
    );
    variants.push({
      url: new URL(
        location,
        masterUrl
      ).href,
      quality: resolution ? `${resolution[1]}p` : "auto"
    });
  }
  return variants.sort(
    (a, b) => qualityNumber(
      b.quality
    ) - qualityNumber(
      a.quality
    )
  );
}
function qualityNumber(value) {
  const match = String(
    value || ""
  ).match(
    /(\d+)p/i
  );
  return match ? Number(
    match[1]
  ) : 0;
}
function resolveVidhide(url) {
  return __async(this, null, function* () {
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
    const sources = extractVidhideSources(
      unpacked,
      url
    );
    if (sources.length === 0) {
      throw new Error(
        "[Vidhide] No se encontr\xF3 HLS"
      );
    }
    const streams = [];
    for (const source of sources) {
      console.log(
        "[Vidhide] Master:",
        source.url
      );
      const response = yield fetch(
        source.url,
        {
          headers: __spreadProps(__spreadValues({}, HEADERS), {
            Referer: url,
            Origin: new URL(
              url
            ).origin
          })
        }
      );
      console.log(
        "[Vidhide] HTTP:",
        response.status
      );
      if (!response.ok) {
        continue;
      }
      const playlist = yield response.text();
      console.log(
        "[Vidhide] Playlist:",
        playlist.length
      );
      const variants = extractHlsVariants(
        playlist,
        source.url
      );
      console.log(
        "[Vidhide] Variants:",
        variants.length
      );
      streams.push(
        ...variants.length ? variants : [{
          url: source.url,
          quality: source.quality
        }]
      );
    }
    return removeDuplicates(
      streams
    );
  });
}
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    try {
      console.log(
        "[SoloLatino] Request:",
        tmdbId,
        mediaType,
        season,
        episode
      );
      const media = yield getTMDB(
        tmdbId,
        mediaType
      );
      console.log(
        "[SoloLatino] TMDB:",
        media.title,
        media.year
      );
      const results = yield searchSoloLatino(
        media.title
      );
      console.log(
        "[SoloLatino] Results:",
        results.length
      );
      const selected = selectContent(
        results,
        media
      );
      if (!selected) {
        console.log(
          "[SoloLatino] No match"
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
        const seriesHtml = yield getContentPage(
          selected.url
        );
        const episodeRegex = new RegExp(
          `href=["']([^"']*\\/temporada-${Number(season)}\\/episodio-${Number(episode)}[^"']*)["']`,
          "i"
        );
        const episodeMatch = seriesHtml.match(
          episodeRegex
        );
        if (!episodeMatch) {
          console.log(
            `[SoloLatino] S${season}E${episode} not found`
          );
          return [];
        }
        contentUrl = new URL(
          decodeHtml(
            episodeMatch[1]
          ),
          SOLO
        ).href;
        console.log(
          "[SoloLatino] Episode:",
          contentUrl
        );
      }
      const pageHtml = yield getContentPage(
        contentUrl
      );
      const servers = extractServers(
        pageHtml
      );
      console.log(
        "[SoloLatino] Servers:",
        servers.length
      );
      let playerUrl = null;
      let selectedServer = null;
      for (const server of servers) {
        if (!server.token) {
          continue;
        }
        console.log(
          "[SoloLatino] Probando servidor:",
          server.label
        );
        try {
          const resolved = yield getPlayerUrl(
            contentUrl,
            server.token
          );
          console.log(
            "[SoloLatino] Player:",
            resolved
          );
          if (resolved && resolved.includes(
            "embed69.org"
          )) {
            playerUrl = resolved;
            selectedServer = server;
            console.log(
              "[SoloLatino] Embed69 encontrado:",
              server.label
            );
            break;
          }
        } catch (error) {
          console.warn(
            `[SoloLatino] ${server.label} error: ${error.message}`
          );
        }
      }
      if (!playerUrl) {
        console.log(
          "[SoloLatino] No se encontr\xF3 Embed69"
        );
        return [];
      }
      console.log(
        "[SoloLatino] Servidor seleccionado:",
        selectedServer == null ? void 0 : selectedServer.label
      );
      console.log(
        "[SoloLatino] Player:",
        playerUrl
      );
      const dataLink = yield resolveEmbed69(
        playerUrl
      );
      console.log(
        "[Embed69] Files:",
        dataLink.length
      );
      const streams = [];
      for (const file of dataLink) {
        if (!Array.isArray(
          file == null ? void 0 : file.sortedEmbeds
        )) {
          continue;
        }
        for (const embed of file.sortedEmbeds) {
          const serverName = String(
            embed.servername || ""
          ).trim().toLowerCase();
          if (serverName !== "vidhide") {
            continue;
          }
          if (!embed.link) {
            continue;
          }
          try {
            const variants = yield resolveVidhide(
              embed.link
            );
            for (const variant of variants) {
              if (!(variant == null ? void 0 : variant.url)) {
                continue;
              }
              streams.push({
                name: `SoloLatino Vidhide ${variant.quality || "auto"}`,
                title: media.title,
                url: variant.url,
                quality: variant.quality || "auto"
              });
            }
          } catch (error) {
            console.warn(
              "[Vidhide] Error:",
              error.message
            );
          }
        }
      }
      console.log(
        "[SoloLatino] Final streams:",
        streams.length
      );
      return removeDuplicates(
        streams
      );
    } catch (error) {
      console.error(
        "[SoloLatino] ERROR:",
        error.message
      );
      return [];
    }
  });
}
function getContentPage(url) {
  return __async(this, null, function* () {
    return yield fetchText(
      url,
      {
        headers: __spreadProps(__spreadValues({}, HEADERS), {
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Referer": `${SOLO}/`
        })
      }
    );
  });
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
function removeDuplicates(streams) {
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
module.exports = {
  getStreams
};
