WidgetMetadata = {
  id: "nsfw.xvideos",
  title: "XVideos",
  description: "获取 XVideos 最新视频、频道、明星与搜索结果",
  author: "匿名 / MaskedHeroQAQ",
  version: "0.12.0",
  requiredVersion: "0.0.2",
  site: "https://www.xvideos.com",
  detailCacheDuration: 60,
  globalParams: [
    {
      name: "region",
      title: "地区",
      type: "enumeration",
      value: "cn",
      enumOptions: [
        { title: "中国大陆", value: "cn" },
        { title: "日本", value: "jp" },
        { title: "台湾", value: "tw" },
        { title: "香港", value: "hk" },
        { title: "美国", value: "us" },
      ],
    },
  ],
  modules: [
    {
      id: "xvideos.site-search",
      title: "站内搜索（点右侧箭头）",
      description: "使用 XVideos 自带关键词搜索",
      functionName: "searchXVideosSite",
      cacheDuration: 0,
      params: [
        { name: "keyword", title: "关键词", type: "input" },
        { name: "page", title: "页码", type: "page", value: "0" },
      ],
    },
    {
      id: "xvideos.new",
      title: "最新视频",
      description: "XVideos 最新视频",
      functionName: "getNewList",
      cacheDuration: 900,
      params: [{ name: "page", title: "页码", type: "page", value: "0" }],
    },
    {
      id: "xvideos.channel",
      title: "频道",
      description: "按频道名称浏览",
      functionName: "getChannelList",
      cacheDuration: 900,
      params: [
        {
          name: "channel",
          title: "频道",
          type: "input",
          placeholders: [
            { title: "JAV HD", value: "javhd" },
            { title: "Japan HDV", value: "japan-hdv" },
            { title: "1Pondo", value: "ipondo" },
          ],
        },
        { name: "page", title: "页码", type: "page", value: "0" },
      ],
    },
    {
      id: "xvideos.pornstars",
      title: "色情明星",
      description: "按明星名称浏览",
      functionName: "getPornstarsList",
      cacheDuration: 900,
      params: [
        {
          name: "pornstar",
          title: "明星",
          type: "input",
          placeholders: [
            { title: "Yui Hatano", value: "yui-hatano-1" },
            { title: "Eimi Fukada", value: "eimi-fukada" },
            { title: "Yua Mikami", value: "yua-mikami" },
          ],
        },
        { name: "page", title: "页码", type: "page", value: "0" },
      ],
    },
  ],
  search: {
    title: "搜索 XVideos",
    functionName: "searchXVideos",
    params: [
      { name: "keyword", title: "关键词", type: "input" },
      { name: "page", title: "页码", type: "page", value: "0" },
    ],
  },
};

var XVIDEOS_BASE_URL = "https://www.xvideos.com";
var XVIDEOS_HEADERS = {
  "Accept-Language": "zh-CN,zh;q=0.9,zh-TW;q=0.8,en;q=0.7",
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1",
};

function absoluteXvideosUrl(value) {
  var url = String(value || "");
  if (url.indexOf("//") === 0) return "https:" + url;
  if (/^https?:\/\//i.test(url)) return url;
  return XVIDEOS_BASE_URL + (url.indexOf("/") === 0 ? url : "/" + url);
}

function previewUrlFromThumb(value) {
  var thumb = String(value || "");
  if (!thumb || thumb.lastIndexOf("/") < 0) return "";
  return (
    thumb
      .substring(0, thumb.lastIndexOf("/"))
      .replace(/\/thumbs(169)?(xnxx)?((l*)|(poster))\//, "/videopreview/")
      .replace(/(-[0-9]+)_([0-9]+)/, "_$2$1") + "_169.mp4"
  );
}

async function getXvideosHeaders(region) {
  var selected = region || "cn";
  var storedRegion = await Widget.storage.get("xvideos.region");
  if (storedRegion !== selected) {
    try {
      var response = await Widget.http.get(
        XVIDEOS_BASE_URL + "/change-country/" + encodeURIComponent(selected),
        { headers: XVIDEOS_HEADERS },
      );
      var setCookie = response && response.headers && response.headers["set-cookie"];
      var cookieText = Array.isArray(setCookie) ? setCookie.join(";") : String(setCookie || "");
      var match = cookieText.match(/(?:^|;\s*)session_token=([^;]+)/i);
      if (match && match[1]) {
        await Widget.storage.set("xvideos.session_token", match[1]);
      }
      await Widget.storage.set("xvideos.region", selected);
    } catch (error) {
      console.warn("XVideos 地区切换失败，继续使用当前会话:", error.message || error);
    }
  }
  var token = await Widget.storage.get("xvideos.session_token");
  var headers = {};
  Object.keys(XVIDEOS_HEADERS).forEach(function (key) {
    headers[key] = XVIDEOS_HEADERS[key];
  });
  if (token) {
    var sessionHeader = ["session_token", token].join("=");
    headers["Cookie"] = sessionHeader;
  }
  return headers;
}

async function requestXvideos(url, params) {
  params = params || {};
  var headers = await getXvideosHeaders(params.region);
  var response = await Widget.http.get(url, { headers: headers });
  var status = response && (response.statusCode || response.status);
  if (!response || (status && status !== 200)) {
    throw new Error("XVideos 请求失败: " + (status || "空响应"));
  }
  return response.data;
}

function parseXvideosCards(html) {
  var $ = Widget.html.load(html);
  var items = [];
  $("#content .thumb-block:not(.thumb-ad)").each(function (_, element) {
    var card = $(element);
    var linkNode = card.find(".title a").first();
    var link = absoluteXvideosUrl(linkNode.attr("href"));
    var title = (linkNode.attr("title") || linkNode.text() || "").trim();
    var poster =
      card.find(".thumb img").attr("data-src") ||
      card.find(".thumb img").attr("src") ||
      "";
    if (!link || !title) return;
    var item = {
      id: link,
      type: "url",
      mediaType: "movie",
      link: link,
      title: title,
      posterPath: poster,
      backdropPath: poster,
    };
    var preview = previewUrlFromThumb(poster);
    if (preview) item.previewUrl = preview;
    items.push(item);
  });
  return items;
}

function mapXvideosApiItem(item) {
  var link = absoluteXvideosUrl(item.u);
  var poster = item.i || "";
  return {
    id: link,
    type: "url",
    mediaType: "movie",
    link: link,
    title: String(item.tf || item.t || "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'"),
    posterPath: poster,
    backdropPath: poster,
    previewUrl: previewUrlFromThumb(poster),
  };
}

async function getNewList(params) {
  params = params || {};
  var page = Math.max(0, parseInt(params.page, 10) || 0);
  var url = XVIDEOS_BASE_URL + (page > 0 ? "/new/" + page : "/");
  return parseXvideosCards(await requestXvideos(url, params));
}

async function searchXVideos(params) {
  params = params || {};
  var keyword = String(params.keyword || "").trim();
  if (!keyword) return [];
  var page = Math.max(0, parseInt(params.page, 10) || 0);
  var url =
    XVIDEOS_BASE_URL +
    "/?k=" +
    encodeURIComponent(keyword) +
    (page > 0 ? "&p=" + page : "");
  return parseXvideosCards(await requestXvideos(url, params));
}

async function searchXVideosSite(params) {
  return searchXVideos(params || {});
}

async function getChannelList(params) {
  params = params || {};
  var channel = String(params.channel || "").trim();
  if (!channel) return [];
  var page = Math.max(0, parseInt(params.page, 10) || 0);
  var data = await requestXvideos(
    XVIDEOS_BASE_URL +
      "/channels/" +
      encodeURIComponent(channel) +
      "/videos/best/" +
      page,
    params,
  );
  return (data && data.videos ? data.videos : []).map(mapXvideosApiItem);
}

async function getPornstarsList(params) {
  params = params || {};
  var pornstar = String(params.pornstar || "").trim();
  if (!pornstar) return [];
  var page = Math.max(0, parseInt(params.page, 10) || 0);
  var data = await requestXvideos(
    XVIDEOS_BASE_URL +
      "/pornstars/" +
      encodeURIComponent(pornstar) +
      "/videos/best/" +
      page,
    params,
  );
  return (data && data.videos ? data.videos : []).map(mapXvideosApiItem);
}

async function loadDetail(link) {
  var html = await requestXvideos(link, {});
  var $ = Widget.html.load(html);
  var videoUrl = "";
  var scriptText = $("script").text();
  [
    "html5player.setVideoUrlHigh",
    "html5player.setVideoHLS",
    "html5player.setVideoUrlLow",
  ].some(function (name) {
    var match = scriptText.match(new RegExp(name + "\\('([^']+)'"));
    if (match && match[1]) videoUrl = match[1];
    return Boolean(videoUrl);
  });

  var structured = {};
  try {
    structured = JSON.parse($('script[type="application/ld+json"]').first().text());
  } catch (_) {}
  if (!videoUrl) videoUrl = structured.contentUrl || "";
  if (!videoUrl) throw new Error("XVideos 详情页没有返回播放地址");

  var thumbnails = structured.thumbnailUrl;
  var poster = Array.isArray(thumbnails) ? thumbnails[0] : thumbnails;
  return {
    id: link,
    type: "detail",
    mediaType: "movie",
    link: link,
    title: structured.name || $("title").text().trim(),
    description: structured.description,
    releaseDate: structured.uploadDate,
    posterPath: poster,
    backdropPath: poster,
    videoUrl: videoUrl,
    playerType: "system",
  };
}

if (typeof module !== "undefined") {
  module.exports = {
    WidgetMetadata: WidgetMetadata,
    getNewList: getNewList,
    searchXVideos: searchXVideos,
    searchXVideosSite: searchXVideosSite,
    getChannelList: getChannelList,
    getPornstarsList: getPornstarsList,
    loadDetail: loadDetail,
    parseXvideosCards: parseXvideosCards,
  };
}
