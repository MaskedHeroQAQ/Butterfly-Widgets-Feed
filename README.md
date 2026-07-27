# Butterfly Widgets Feed

这是 `𝓑𝓾𝓽𝓽𝓮𝓻𝓯𝓵𝔂 ‘𝓼 𝓦𝓲𝓭𝓰𝓮𝓽𝓼` 的公开 Forward 分发仓库。

导入地址：

```text
https://raw.githubusercontent.com/MaskedHeroQAQ/Butterfly-Widgets-Feed/main/Butterfly-Widgets.fwd
```

本仓库只保存公开分发清单，以及经过兼容修复后必须公开读取的模块和数据；维护源码保存在私有仓库中。

当前自托管修复：

- 所有模块同时保留 Forward 聚合搜索和模块页面内的站内搜索；站内搜索通过标题右侧箭头输入网站专属条件。

- Jable：标准顶层搜索，直连优先，遇到 Cloudflare 验证时自动回退。
- 91Porn：新增关键词搜索，并保留分类浏览与播放资源解析。
- Pornhub：迁移到标准顶层搜索，空参数不再污染首页。
- JAVDay：修复失效的第一页搜索地址并改为自托管模块。
- JAVRate：标准顶层搜索与 Cloudflare 自动回退。
- XVideos：新增关键词搜索，并保留最新、频道与明星浏览。
- MissAV：改为自托管，增加独立站内搜索入口并保留 WebView 验证。
