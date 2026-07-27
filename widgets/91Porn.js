WidgetMetadata = {
  id: "nsfw.91porn",
  title: "91Porn",
  description: "获取 91Porn 分类、搜索与播放资源",
  author: "匿名 / MaskedHeroQAQ",
  version: "0.12.0",
  requiredVersion: "0.0.2",
  site: "https://91porn.com",
  detailCacheDuration: 60,
  globalParams: [
    {
      name: "base_url",
      title: "基础 URL",
      type: "input",
      value: "https://91porn.com",
    },
  ],
  modules: [
    {
      id: "91porn.site-search",
      title: "站内搜索（点右侧箭头）",
      description: "使用 91Porn 自带搜索",
      cacheDuration: 0,
      requiresWebView: false,
      functionName: "search91PornSite",
      params: [
        { name: "keyword", title: "关键词", type: "input" },
        { name: "page", title: "页码", type: "page", value: "1" },
      ],
    },
    {
      id: "91porn.list",
      title: "91Porn 视频",
      description: "按分类浏览 91Porn",
      cacheDuration: 900,
      requiresWebView: false,
      functionName: "get91pornList",
      params: [
        {
          name: "sort_by",
          title: "分类",
          type: "enumeration",
          value: "rf",
          enumOptions: [
            { title: "最近加精", value: "rf" },
            { title: "当前最热", value: "hot" },
            { title: "本月最热", value: "top" },
            { title: "本月收藏", value: "tf" },
            { title: "本月讨论", value: "md" },
            { title: "上月最热", value: "top&m=-1" },
            { title: "91 原创", value: "ori" },
            { title: "10 分钟以上", value: "long" },
            { title: "20 分钟以上", value: "longer" },
            { title: "高清", value: "hd" },
            { title: "收藏最多", value: "mf" },
          ],
        },
        { name: "page", title: "页码", type: "page", value: "1" },
      ],
    },
    {
      id: "loadResource",
      title: "加载资源",
      functionName: "loadResource",
      type: "stream",
      cacheDuration: 0,
      params: [],
    },
  ],
  search: {
    title: "搜索 91Porn",
    functionName: "search91Porn",
    params: [
      { name: "keyword", title: "关键词", type: "input" },
      { name: "page", title: "页码", type: "page", value: "1" },
    ],
  },
};

var PORN91_BASE_URL = "https://91porn.com";
var PORN91_HEADERS = {
  "Accept-Language": "zh-CN,zh;q=0.9,zh-TW;q=0.8,en;q=0.7",
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1",
};

function normalize91Base(value) {
  return String(value || PORN91_BASE_URL).replace(/\/+$/, "");
}

function absolute91Url(value, baseUrl) {
  var url = String(value || "").trim();
  if (!url) return "";
  if (url.indexOf("//") === 0) return "https:" + url;
  if (/^https?:\/\//i.test(url)) return url;
  var base = normalize91Base(baseUrl);
  return base + (url.indexOf("/") === 0 ? url : "/" + url);
}

function preview91Url(poster) {
  var filename = String(poster || "").split("/").pop() || "";
  var id = filename.split(".")[0];
  return id ? "https://vthumb.killcovid2021.com/thumb/" + id + ".mp4" : "";
}

function make91Item(card, $, baseUrl) {
  var linkNode = card.find("a[href*='view_video.php']").first();
  var link = absolute91Url(linkNode.attr("href"), baseUrl);
  var title = card.find(".video-title").first().text().replace(/\s+/g, " ").trim();
  var poster =
    card.find(".img-responsive").attr("src") ||
    card.find(".img-responsive").attr("data-original") ||
    "";
  if (!link || !title) return null;
  var item = {
    id: link,
    type: "url",
    mediaType: "movie",
    link: link,
    title: title,
    posterPath: poster,
    backdropPath: poster,
    durationText: card.find(".duration").first().text().trim(),
  };
  var preview = preview91Url(poster);
  if (preview) item.previewUrl = preview;
  return item;
}

function parse91List(html, baseUrl) {
  var $ = Widget.html.load(html);
  var items = [];
  $(".videos-text-align").each(function (_, element) {
    var card = $(element);
    if (card.closest(".col-lg-8").length) return;
    var item = make91Item(card, $, baseUrl);
    if (item) items.push(item);
  });
  return items;
}

function parse91Search(html, baseUrl) {
  var $ = Widget.html.load(html);
  var items = [];
  $(".well.well-sm").each(function (_, element) {
    var item = make91Item($(element), $, baseUrl);
    if (item) items.push(item);
  });
  return items;
}

async function request91(url, options) {
  options = options || {};
  var headers = {};
  Object.keys(PORN91_HEADERS).forEach(function (key) {
    headers[key] = PORN91_HEADERS[key];
  });
  if (options.referer) headers.Referer = options.referer;
  var response = await Widget.http.get(url, {
    headers: headers,
    params: options.params || {},
  });
  var status = response && (response.statusCode || response.status);
  if (!response || (status && status !== 200) || !response.data) {
    throw new Error("91Porn 请求失败: " + (status || "空响应"));
  }
  return response.data;
}

async function get91pornList(params) {
  params = params || {};
  var baseUrl = normalize91Base(params.base_url);
  var html = await request91(baseUrl + "/v.php", {
    referer: baseUrl + "/",
    params: {
      category: params.sort_by || "rf",
      viewtype: "basic",
      page: Math.max(1, parseInt(params.page, 10) || 1),
    },
  });
  return parse91List(html, baseUrl);
}

async function search91Porn(params) {
  params = params || {};
  var keyword = String(params.keyword || "").trim();
  if (!keyword) return [];
  var baseUrl = normalize91Base(params.base_url);
  var html = await request91(baseUrl + "/search_result.php", {
    referer: baseUrl + "/v.php",
    params: {
      search_id: keyword,
      search_type: "search_videos",
      min_duration: "",
      page: Math.max(1, parseInt(params.page, 10) || 1),
    },
  });
  return parse91Search(html, baseUrl);
}

async function search91PornSite(params) {
  return search91Porn(params || {});
}

async function loadDetail(link) {
  var html = await request91(link, { referer: PORN91_BASE_URL + "/" });
  var $ = Widget.html.load(html);
  var player = $("#player_one");
  var script = player.find("script").text();
  var encoded = (script.match(/strencode2\("(.*?)"\)/) || [])[1] || "";
  var decoded = decodeURIComponent(encoded);
  var videoUrl = decoded ? Widget.html.load(decoded)("source").attr("src") : "";
  if (!videoUrl) throw new Error("91Porn 详情页没有返回播放地址");

  var title = $("#videodetails h4").first().text().trim() || $("title").text().trim();
  return {
    id: link,
    type: "detail",
    mediaType: "movie",
    link: link,
    title: title,
    posterPath: player.attr("poster"),
    backdropPath: player.attr("poster"),
    videoUrl: videoUrl,
    playerType: "system",
  };
}

async function loadResource(params) {
  params = params || {};
  var candidate = [params.id, params.link, params.videoUrl].find(function (value) {
    return typeof value === "string" && value.indexOf("91porn.com") >= 0;
  });
  if (!candidate) return [];
  var detail = await loadDetail(candidate);
  return [
    {
      name: detail.title,
      description: "",
      url: detail.videoUrl,
    },
  ];
}

if (typeof module !== "undefined") {
  module.exports = {
    WidgetMetadata: WidgetMetadata,
    get91pornList: get91pornList,
    search91Porn: search91Porn,
    search91PornSite: search91PornSite,
    loadDetail: loadDetail,
    loadResource: loadResource,
    parse91List: parse91List,
    parse91Search: parse91Search,
  };
}
