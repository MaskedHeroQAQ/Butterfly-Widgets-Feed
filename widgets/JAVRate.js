var WidgetMetadata = {
  id: "ti.bemarkt.javrate",
  title: "JAVRate",
  description: "获取 JAVRate 推荐（Cloudflare 自动回退）",
  author: "Ti / MaskedHeroQAQ",
  site: "https://www.javrate.com/",
  version: "1.4.0",
  requiredVersion: "0.0.2",
  detailCacheDuration: 60,
  modules: [
    {
      id: "javrate.browse",
      title: "按分类浏览",
      description: "浏览 JAVRate 影片",
      requiresWebView: true,
      functionName: "getJAVRateContent",
      cacheDuration: 900,
      params: [
        {
          name: "categoryPath",
          title: "分类",
          type: "enumeration",
          value: "/movie/new/",
          enumOptions: [
            { title: "最新发布", value: "/movie/new/" },
            { title: "无码A片", value: "/menu/uncensored/" },
            { title: "日本A片", value: "/menu/censored/" },
            { title: "国产AV", value: "/menu/chinese/" },
            { title: "热门排行", value: "/best/" },
            { title: "评分最高", value: "/movie/top/" },
          ],
        },
        { name: "page", title: "页码", type: "page", value: "1" },
      ],
    },
    {
      id: "javrate.search",
      title: "搜索",
      description: "按番号、标题或演员搜索 JAVRate",
      requiresWebView: true,
      functionName: "searchJAVRate",
      cacheDuration: 900,
      params: [
        { name: "query", title: "搜索词", type: "input" },
        { name: "page", title: "页码", type: "page", value: "1" },
      ],
    },
  ],
  search: {
    title: "搜索 JAVRate",
    functionName: "searchJAVRate",
    params: [
      { name: "query", title: "搜索词", type: "input" },
      { name: "page", title: "页码", type: "page", value: "1" },
    ],
  },
};

var JAVRATE_BASE_URL = "https://www.javrate.com";
var JINA_READER_URL = "https://r.jina.ai/";
var PLACEHOLDER_IMAGE =
  "https://placehold.co/200x300/A8D19E/F6F7F1?text=JAVRate&font=source-sans-pro";
var JAVRATE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  Referer: JAVRATE_BASE_URL + "/",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
};

function absoluteJavrateUrl(path) {
  if (/^https?:\/\//i.test(path || "")) return path;
  return JAVRATE_BASE_URL + (String(path || "").startsWith("/") ? path : "/" + path);
}

function buildCategoryUrl(path, page) {
  var normalizedPath = path || "/movie/new/";
  var currentPage = parseInt(page, 10) || 1;
  var trimmed = normalizedPath.endsWith("/")
    ? normalizedPath.slice(0, -1)
    : normalizedPath;

  if (normalizedPath.indexOf("/menu/") === 0) {
    return absoluteJavrateUrl(trimmed + "/5-2-" + currentPage);
  }
  if (currentPage === 1) return absoluteJavrateUrl(normalizedPath);
  if (normalizedPath.indexOf("/best/") === 0) {
    return absoluteJavrateUrl(trimmed + "?page=" + currentPage);
  }
  return absoluteJavrateUrl(trimmed + "/" + currentPage + ".html");
}

function cleanMarkdown(value) {
  return String(value || "")
    .replace(/\\([\\`*_[\]{}()#+\-.!])/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseJavrateHtml(html) {
  var $ = Widget.html.load(html);
  var items = [];
  $('div[class^="movie-grid-new-"] .mgn-item').each(function () {
    var card = $(this);
    var linkNode = card.find(".mgn-title a").first();
    var link = absoluteJavrateUrl(linkNode.attr("href") || "");
    if (!/\/Movie\/Detail\//i.test(link)) return;

    var titleNode = card.find(".mgn-title h3").first();
    var number = titleNode.find("strong").first().text().trim();
    var titleClone = titleNode.clone();
    titleClone.find("strong").remove();
    var title = (number + " " + titleClone.text().trim()).trim();
    if (!title) return;

    var poster =
      card.find(".mgn-picture img.mgn-cover").attr("src") || PLACEHOLDER_IMAGE;
    poster = poster.replace(/\\/g, "/");
    var rating = card.find(".mgn-rating .score-label").text().trim();
    var genre = card.find(".mgn-badges .mgn-badge-type").text().trim();
    var dateNode = card.find(".mgn-date").clone();
    dateNode.find("svg").remove();
    var releaseDate = dateNode.text().trim();

    items.push({
      id: link,
      type: "url",
      title: title,
      posterPath: poster,
      backdropPath: poster,
      link: link,
      releaseDate: releaseDate || undefined,
      rating: rating || undefined,
      genreTitle: genre || undefined,
      mediaType: "movie",
    });
  });
  return items;
}

function parseJavrateMarkdown(markdown) {
  var text = String(markdown || "");
  var pattern =
    /\[!\[Image\s+\d+:\s*([^\]]+)\]\((https?:\/\/[^)\s]+)\)\]\((https:\/\/www\.javrate\.com\/Movie\/Detail\/[^)\s]+)\s+"([\s\S]*?)"\)/gi;
  var items = [];
  var seen = {};
  var match;

  while ((match = pattern.exec(text))) {
    var code = cleanMarkdown(match[1]);
    var poster = match[2];
    var link = match[3];
    var title = cleanMarkdown(match[4]) || code;
    if (seen[link]) continue;
    seen[link] = true;
    items.push({
      id: link,
      type: "url",
      title: title,
      posterPath: poster,
      backdropPath: poster,
      link: link,
      mediaType: "movie",
    });
  }
  return items;
}

async function requestText(url, headers) {
  var response = await Widget.http.get(url, { headers: headers || JAVRATE_HEADERS });
  if (!response || typeof response.data !== "string" || !response.data.trim()) {
    throw new Error("上游未返回有效文本");
  }
  return response.data;
}

async function fetchJavrateItems(url) {
  var directError;
  try {
    var html = await requestText(url, JAVRATE_HEADERS);
    var directItems = parseJavrateHtml(html);
    if (directItems.length > 0) return directItems;
    directError = new Error("直连响应未包含影片，可能命中 Cloudflare 验证");
  } catch (error) {
    directError = error;
  }

  try {
    var markdown = await requestText(JINA_READER_URL + url, {
      Accept: "text/plain",
    });
    var fallbackItems = parseJavrateMarkdown(markdown);
    if (fallbackItems.length > 0) return fallbackItems;
    throw new Error("Reader 响应未包含影片");
  } catch (fallbackError) {
    throw new Error(
      "JAVRate 加载失败；直连：" +
        (directError ? directError.message : "未知错误") +
        "；回退：" +
        fallbackError.message
    );
  }
}

async function getJAVRateContent(params) {
  params = params || {};
  var url = buildCategoryUrl(params.categoryPath || "/movie/new/", params.page || 1);
  return fetchJavrateItems(url);
}

async function searchJAVRate(params) {
  params = params || {};
  var query = String(params.query || params.keyword || "").trim();
  var page = parseInt(params.page, 10) || 1;
  if (!query) throw new Error("请输入搜索关键词");

  var url =
    JAVRATE_BASE_URL +
    "/search/" +
    encodeURIComponent(query) +
    (page > 1 ? "?page=" + page + "&sort=5" : "");
  return fetchJavrateItems(url);
}

function parseDuration(value) {
  var match = String(value || "").match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return undefined;
  return [match[1] || 0, match[2] || 0, match[3] || 0]
    .map(function (part) {
      return String(part).padStart(2, "0");
    })
    .join(":");
}

function parseJavrateDetail(html, link) {
  var $ = Widget.html.load(html);
  var titleNode = $("h1.mb-2.mt-1").first();
  var number = titleNode.find("strong.fg-main").first().text().trim();
  var titleClone = titleNode.clone();
  titleClone.find("strong").remove();
  var title = (number + " " + titleClone.text().trim()).trim();
  var videoUrl;
  var poster;
  var description;
  var durationText;

  try {
    var schemaText = $('script[type="application/ld+json"]').first().html();
    if (schemaText) {
      var schema = JSON.parse(schemaText);
      videoUrl = schema.contentUrl || schema.embedUrl;
      poster = Array.isArray(schema.thumbnailUrl)
        ? schema.thumbnailUrl[0]
        : schema.thumbnailUrl;
      description = schema.description;
      durationText = parseDuration(schema.duration);
      if (!title) title = schema.name || schema.headline || "";
    }
  } catch (error) {
    console.log("JAVRate LD+JSON 解析失败: " + error.message);
  }

  if (!videoUrl) videoUrl = $(".player-box iframe").attr("src");
  if (!poster) {
    poster =
      $(".main-content img").first().attr("src") ||
      $(".fixed-background-img").attr("src") ||
      PLACEHOLDER_IMAGE;
  }
  if (!description) description = $(".description-text").text().trim();

  return {
    id: link,
    type: "detail",
    title: title || "JAVRate",
    videoUrl: videoUrl,
    description: description || undefined,
    durationText: durationText,
    posterPath: poster,
    backdropPath: $(".fixed-background-img").attr("src") || poster,
    link: link,
    mediaType: "movie",
    customHeaders: videoUrl
      ? {
          Referer: "https://iframe.mediadelivery.net/",
          "User-Agent": JAVRATE_HEADERS["User-Agent"],
        }
      : undefined,
  };
}

async function loadDetail(link) {
  var html = await requestText(link, JAVRATE_HEADERS);
  var detail = parseJavrateDetail(html, link);
  if (!detail.videoUrl) {
    throw new Error("详情页未返回播放地址，请在 Forward 的 WebView 完成站点验证后重试");
  }
  return detail;
}

if (typeof module !== "undefined") {
  module.exports = {
    WidgetMetadata: WidgetMetadata,
    getJAVRateContent: getJAVRateContent,
    searchJAVRate: searchJAVRate,
    loadDetail: loadDetail,
    parseJavrateHtml: parseJavrateHtml,
    parseJavrateMarkdown: parseJavrateMarkdown,
  };
}
