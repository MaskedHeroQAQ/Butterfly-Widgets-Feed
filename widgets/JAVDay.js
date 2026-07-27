WidgetMetadata = {
  id: "ti.bemarkt.javday",
  title: "JAVDay",
  description: "获取 JAVDay 推荐、分类与搜索",
  author: "Ti / MaskedHeroQAQ",
  site: "https://javday.app",
  version: "1.2.0",
  requiredVersion: "0.0.2",
  detailCacheDuration: 60,
  modules: [
    {
      id: "javday.latest",
      title: "最新更新",
      description: "浏览 JAVDay 最新影片",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 900,
      params: [
        {
          name: "url",
          title: "栏目",
          type: "constant",
          value: "https://javday.app/label/new/",
        },
        { name: "page", title: "页码", type: "page", value: "1" },
      ],
    },
    {
      id: "javday.hot",
      title: "人气系列",
      description: "浏览 JAVDay 热门影片",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 900,
      params: [
        {
          name: "url",
          title: "栏目",
          type: "constant",
          value: "https://javday.app/label/hot/",
        },
        { name: "page", title: "页码", type: "page", value: "1" },
      ],
    },
    {
      id: "javday.category",
      title: "分类浏览",
      description: "按类型或厂商浏览 JAVDay",
      requiresWebView: false,
      functionName: "loadPage",
      cacheDuration: 900,
      params: [
        {
          name: "url",
          title: "分类",
          type: "enumeration",
          value: "https://javday.app/category/new-release/",
          enumOptions: [
            { title: "新作上市", value: "https://javday.app/category/new-release/" },
            { title: "有码视频", value: "https://javday.app/category/censored/" },
            { title: "无码视频", value: "https://javday.app/category/uncensored/" },
            { title: "无码流出", value: "https://javday.app/category/uncensored-leaked/" },
            { title: "杏吧视频", value: "https://javday.app/category/sex8/" },
            { title: "玩偶姐姐", value: "https://javday.app/category/hongkongdoll/" },
            { title: "国产 AV", value: "https://javday.app/category/chinese-av/" },
            { title: "麻豆传媒", value: "https://javday.app/category/madou/" },
            { title: "果冻传媒", value: "https://javday.app/category/91zhipianchang/" },
            { title: "天美传媒", value: "https://javday.app/category/timi/" },
            { title: "星空无限", value: "https://javday.app/category/xingkong/" },
            { title: "皇家华人", value: "https://javday.app/category/royalasianstudio/" },
            { title: "蜜桃影像", value: "https://javday.app/category/mtgw/" },
            { title: "精东影业", value: "https://javday.app/category/jdav/" },
            { title: "台湾 AV", value: "https://javday.app/category/twav/" },
            { title: "JVID", value: "https://javday.app/category/jvid/" },
          ],
        },
        {
          name: "sort_by",
          title: "排序",
          type: "enumeration",
          value: "new",
          enumOptions: [
            { title: "最新上架", value: "new" },
            { title: "人气最高", value: "popular" },
          ],
        },
        { name: "page", title: "页码", type: "page", value: "1" },
      ],
    },
  ],
  search: {
    title: "搜索 JAVDay",
    functionName: "search",
    params: [
      { name: "keyword", title: "女优、番号或关键词", type: "input" },
      { name: "page", title: "页码", type: "page", value: "1" },
    ],
  },
};

var JAVDAY_BASE_URL = "https://javday.app";
var JAVDAY_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1",
  Referer: JAVDAY_BASE_URL + "/",
};

function absoluteJavdayUrl(value) {
  var url = String(value || "").trim();
  if (!url) return "";
  if (url.indexOf("//") === 0) return "https:" + url;
  if (/^https?:\/\//i.test(url)) return url;
  return JAVDAY_BASE_URL + (url.indexOf("/") === 0 ? url : "/" + url);
}

function normalizeCategoryUrl(value) {
  return absoluteJavdayUrl(value)
    .replace("/index.php/", "/")
    .replace(/\/+$/, "/");
}

function extractCategoryId(value) {
  var parts = normalizeCategoryUrl(value).split("/").filter(Boolean);
  return parts[parts.length - 1] || "new-release";
}

function buildListUrl(baseUrl, sortBy, page) {
  var normalized = normalizeCategoryUrl(baseUrl);
  var currentPage = Math.max(1, parseInt(page, 10) || 1);
  if (sortBy === "popular" && normalized.indexOf("/category/") >= 0) {
    var popular =
      JAVDAY_BASE_URL + "/fiter/by/hits/id/" + encodeURIComponent(extractCategoryId(normalized));
    return currentPage > 1 ? popular + "/page/" + currentPage + "/" : popular + "/";
  }
  return currentPage > 1
    ? normalized + "page/" + currentPage + "/"
    : normalized;
}

function getCoverUrl(card) {
  var style = card.find(".videoBox-cover").attr("style") || "";
  var match = style.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
  return match && match[1] ? absoluteJavdayUrl(match[1]) : "";
}

function parseJavdayItems(html) {
  var $ = Widget.html.load(html);
  var items = [];
  $(".video-wrapper .videoBox").each(function (index, element) {
    var card = $(element);
    var link = absoluteJavdayUrl(card.attr("href"));
    var title = card.find(".videoBox-info .title").text().trim();
    var poster = getCoverUrl(card);
    if (!link || !title) return;
    items.push({
      id: link,
      type: "url",
      mediaType: "movie",
      title: title,
      link: link,
      posterPath: poster,
      backdropPath: poster,
    });
  });
  return items;
}

async function requestJavday(url) {
  var response = await Widget.http.get(url, { headers: JAVDAY_HEADERS });
  if (!response || !response.data) throw new Error("JAVDay 页面没有返回内容");
  return response.data;
}

async function loadPage(params) {
  params = params || {};
  var url = buildListUrl(
    params.url || JAVDAY_BASE_URL + "/label/new/",
    params.sort_by || "new",
    params.page || 1,
  );
  return parseJavdayItems(await requestJavday(url));
}

async function search(params) {
  params = params || {};
  var keyword = String(params.keyword || "").trim();
  if (!keyword) return [];
  var page = Math.max(1, parseInt(params.page, 10) || 1);
  var encoded = encodeURIComponent(keyword);
  var url =
    page === 1
      ? JAVDAY_BASE_URL + "/search/wd/" + encoded + "/"
      : JAVDAY_BASE_URL + "/search/page/" + page + "/wd/" + encoded + "/";
  return parseJavdayItems(await requestJavday(url));
}

function extractVideoUrl($) {
  var direct =
    $("video#J_prismPlayer").attr("src") ||
    $("source[src*='.m3u8']").attr("src") ||
    $("video source").attr("src");
  if (direct) return absoluteJavdayUrl(direct);

  var scripts = Array.from($("script"));
  for (var index = 0; index < scripts.length; index += 1) {
    var content = $(scripts[index]).html() || "";
    var match =
      content.match(/video\s*:\s*{[\s\S]*?url\s*:\s*['"]([^'"]+)['"]/i) ||
      content.match(/['"](https?:\/\/[^'"]+\.m3u8[^'"]*)['"]/i);
    if (match && match[1]) return match[1];
  }
  return "";
}

async function loadDetail(link) {
  var html = await requestJavday(link);
  var $ = Widget.html.load(html);
  var videoUrl = extractVideoUrl($);
  if (!videoUrl) throw new Error("JAVDay 详情页没有返回播放地址");

  var title = $("h1").first().text().trim() || $("title").text().trim();
  var poster =
    $("meta[property='og:image']").attr("content") ||
    $("video").attr("poster") ||
    "";
  return {
    id: link,
    type: "detail",
    mediaType: "movie",
    title: title,
    link: link,
    posterPath: absoluteJavdayUrl(poster),
    backdropPath: absoluteJavdayUrl(poster),
    videoUrl: videoUrl,
    playerType: "system",
    customHeaders: {
      Referer: link,
      "User-Agent": JAVDAY_HEADERS["User-Agent"],
    },
  };
}

if (typeof module !== "undefined") {
  module.exports = {
    WidgetMetadata: WidgetMetadata,
    loadPage: loadPage,
    search: search,
    loadDetail: loadDetail,
    parseJavdayItems: parseJavdayItems,
    buildListUrl: buildListUrl,
  };
}
