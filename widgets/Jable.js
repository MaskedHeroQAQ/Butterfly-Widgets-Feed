var WidgetMetadata = {
  id: "jable",
  title: "Jable",
  description: "获取 Jable 视频（Cloudflare 自动回退）",
  author: "nibiru / MaskedHeroQAQ",
  site: "https://jable.tv",
  version: "1.3.0",
  requiredVersion: "0.0.2",
  detailCacheDuration: 60,
  modules: [
    {
      id: "jable.site-search",
      title: "站内搜索（点右侧箭头）",
      description: "使用 Jable 自带搜索，可选择排序和页码",
      requiresWebView: true,
      functionName: "searchSite",
      cacheDuration: 0,
      params: [
        { name: "keyword", title: "关键词", type: "input" },
        {
          name: "sort_by",
          title: "排序",
          type: "enumeration",
          value: "post_date",
          enumOptions: [
            { title: "最近更新", value: "post_date" },
            { title: "最多观看", value: "video_viewed" },
            { title: "近期最佳", value: "post_date_and_popularity" },
            { title: "最多收藏", value: "most_favourited" },
          ],
        },
        { name: "page", title: "页码", type: "page", value: "1" },
      ],
    },
    {
      id: "jable.hot",
      title: "热门",
      description: "浏览 Jable 热门影片",
      requiresWebView: true,
      functionName: "loadPage",
      cacheDuration: 900,
      params: [
        {
          name: "path",
          title: "栏目",
          type: "constant",
          value: "/hot/",
        },
        {
          name: "sort_by",
          title: "排序",
          type: "enumeration",
          value: "video_viewed_today",
          enumOptions: [
            { title: "今日热门", value: "video_viewed_today" },
            { title: "本周热门", value: "video_viewed_week" },
            { title: "本月热门", value: "video_viewed_month" },
            { title: "所有时间", value: "video_viewed" },
          ],
        },
        { name: "from", title: "页码", type: "page", value: "1" },
      ],
    },
    {
      id: "jable.latest",
      title: "最新",
      description: "浏览 Jable 最新影片",
      requiresWebView: true,
      functionName: "loadPage",
      cacheDuration: 900,
      params: [
        {
          name: "path",
          title: "栏目",
          type: "constant",
          value: "/new-release/",
        },
        {
          name: "sort_by",
          title: "排序",
          type: "enumeration",
          value: "latest-updates",
          enumOptions: [
            { title: "最新发布", value: "latest-updates" },
            { title: "最多观看", value: "video_viewed" },
            { title: "最多收藏", value: "most_favourited" },
          ],
        },
        { name: "from", title: "页码", type: "page", value: "1" },
      ],
    },
    {
      id: "jable.category",
      title: "分类",
      description: "按分类浏览 Jable",
      requiresWebView: true,
      functionName: "loadPage",
      cacheDuration: 900,
      params: [
        {
          name: "path",
          title: "分类",
          type: "enumeration",
          value: "/categories/chinese-subtitle/",
          enumOptions: [
            { title: "中文字幕", value: "/categories/chinese-subtitle/" },
            { title: "无码流出", value: "/categories/uncensored-leak/" },
            { title: "角色扮演", value: "/categories/roleplay/" },
            { title: "制服", value: "/categories/uniform/" },
            { title: "POV", value: "/categories/pov/" },
            { title: "黑丝", value: "/tags/black-pantyhose/" },
            { title: "丝袜", value: "/tags/pantyhose/" },
            { title: "NTR", value: "/tags/ntr/" },
            { title: "时间停止", value: "/tags/time-stop/" },
            { title: "熟女", value: "/tags/mature-woman/" },
            { title: "巨乳", value: "/tags/big-tits/" },
            { title: "人妻", value: "/tags/married-woman/" },
          ],
        },
        {
          name: "sort_by",
          title: "排序",
          type: "enumeration",
          value: "post_date",
          enumOptions: [
            { title: "最近更新", value: "post_date" },
            { title: "最多观看", value: "video_viewed" },
            { title: "最多收藏", value: "most_favourited" },
          ],
        },
        { name: "from", title: "页码", type: "page", value: "1" },
      ],
    },
  ],
  search: {
    title: "搜索 Jable",
    functionName: "search",
    params: [
      { name: "keyword", title: "关键词", type: "input" },
      { name: "page", title: "页码", type: "page", value: "1" },
    ],
  },
};

var JABLE_BASE_URL = "https://jable.tv";
var JINA_READER_URL = "https://r.jina.ai/";
var JABLE_LIST_BLOCK = "list_videos_common_videos_list";
var JABLE_SEARCH_BLOCK = "list_videos_videos_list_search_result";
var JABLE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  Referer: JABLE_BASE_URL + "/",
};

function absoluteJableUrl(path) {
  if (/^https?:\/\//i.test(path || "")) return path;
  return JABLE_BASE_URL + (String(path || "").startsWith("/") ? path : "/" + path);
}

function makeListUrl(path, sortBy, page, blockId) {
  var base = absoluteJableUrl(path);
  var separator = base.indexOf("?") >= 0 ? "&" : "?";
  return (
    base +
    separator +
    "mode=async&function=get_block&block_id=" +
    encodeURIComponent(blockId || JABLE_LIST_BLOCK) +
    "&sort_by=" +
    encodeURIComponent(sortBy || "post_date") +
    "&from=" +
    encodeURIComponent(String(page || 1))
  );
}

function cleanMarkdown(value) {
  return String(value || "")
    .replace(/\\([\\`*_[\]{}()#+\-.!])/g, "$1")
    .replace(/\*\*/g, "")
    .trim();
}

function parseJableHtml(html) {
  var $ = Widget.html.load(html);
  var items = [];
  $(".video-img-box").each(function () {
    var card = $(this);
    var titleNode = card.find(".title a").first();
    var link = titleNode.attr("href") || "";
    if (!/https?:\/\/jable\.tv\/videos\//i.test(link)) return;

    var image = card.find("img").first();
    var poster = image.attr("data-src") || image.attr("src") || "";
    var preview = image.attr("data-preview") || "";
    var duration = card.find(".absolute-bottom-right .label").first().text().trim();
    var title = titleNode.text().trim();
    if (!title) return;

    items.push({
      id: link,
      type: "url",
      title: title,
      backdropPath: poster,
      posterPath: poster,
      previewUrl: preview || undefined,
      link: link,
      mediaType: "movie",
      durationText: duration || undefined,
      description: duration || undefined,
    });
  });
  return items;
}

function parseJableMarkdown(markdown) {
  var lines = String(markdown || "").split(/\r?\n/);
  var items = [];
  var seen = {};
  var imagePattern =
    /\[!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)(?:\s+([0-9:]+))?\]\((https:\/\/jable\.tv\/videos\/[^)\s]+)\)/i;
  var titlePattern = /^#{1,6}\s+\[([^\]]+)\]\((https:\/\/jable\.tv\/videos\/[^)\s]+)\)/i;

  for (var i = 0; i < lines.length; i++) {
    var imageMatch = lines[i].match(imagePattern);
    if (!imageMatch) continue;

    var poster = imageMatch[1];
    var duration = imageMatch[2] || "";
    var link = imageMatch[3];
    var title = "";
    for (var j = i + 1; j < Math.min(i + 6, lines.length); j++) {
      var titleMatch = lines[j].match(titlePattern);
      if (titleMatch && titleMatch[2] === link) {
        title = cleanMarkdown(titleMatch[1]);
        break;
      }
    }
    if (!title || seen[link]) continue;
    seen[link] = true;
    items.push({
      id: link,
      type: "url",
      title: title,
      backdropPath: poster,
      posterPath: poster,
      link: link,
      mediaType: "movie",
      durationText: duration || undefined,
      description: duration || undefined,
    });
  }
  return items;
}

async function requestText(url, headers) {
  var response = await Widget.http.get(url, { headers: headers || JABLE_HEADERS });
  if (!response || typeof response.data !== "string" || !response.data.trim()) {
    throw new Error("上游未返回有效文本");
  }
  return response.data;
}

async function fetchJableItems(url) {
  var directError;
  try {
    var html = await requestText(url, JABLE_HEADERS);
    var directItems = parseJableHtml(html);
    if (directItems.length > 0) return directItems;
    directError = new Error("直连响应未包含影片，可能命中 Cloudflare 验证");
  } catch (error) {
    directError = error;
  }

  try {
    var markdown = await requestText(JINA_READER_URL + url, {
      Accept: "text/plain",
    });
    var fallbackItems = parseJableMarkdown(markdown);
    if (fallbackItems.length > 0) return fallbackItems;
    throw new Error("Reader 响应未包含影片");
  } catch (fallbackError) {
    throw new Error(
      "Jable 加载失败；直连：" +
        (directError ? directError.message : "未知错误") +
        "；回退：" +
        fallbackError.message
    );
  }
}

async function loadPage(params) {
  params = params || {};
  var url = makeListUrl(
    params.path || "/hot/",
    params.sort_by || "post_date",
    params.page || 1,
    JABLE_LIST_BLOCK
  );
  return fetchJableItems(url);
}

async function search(params) {
  params = params || {};
  var keyword = String(params.keyword || "").trim();
  if (!keyword) return [];
  var path = "/search/" + encodeURIComponent(keyword) + "/";
  var url = makeListUrl(
    path,
    params.sort_by || "post_date",
    params.page || params.from || 1,
    JABLE_SEARCH_BLOCK
  );
  return fetchJableItems(url);
}

async function searchSite(params) {
  return search(params || {});
}

async function loadDetail(link) {
  var html = await requestText(link, JABLE_HEADERS);
  var match = html.match(/var\s+hlsUrl\s*=\s*['"]([^'"]+)['"]/i);
  if (!match || !match[1]) {
    throw new Error("详情页未返回播放地址，请在 Forward 的 WebView 完成站点验证后重试");
  }

  var item = {
    id: link,
    type: "detail",
    videoUrl: match[1],
    mediaType: "movie",
    customHeaders: {
      Referer: link,
      "User-Agent": JABLE_HEADERS["User-Agent"],
    },
  };
  var relatedItems = parseJableHtml(html);
  if (relatedItems.length > 0) item.childItems = relatedItems;
  return item;
}

if (typeof module !== "undefined") {
  module.exports = {
    WidgetMetadata: WidgetMetadata,
    loadPage: loadPage,
    search: search,
    searchSite: searchSite,
    loadDetail: loadDetail,
    parseJableHtml: parseJableHtml,
    parseJableMarkdown: parseJableMarkdown,
  };
}
