# Butterfly Widgets Feed

这是 `𝓑𝓾𝓽𝓽𝓮𝓻𝓯𝓵𝔂 ‘𝓼 𝓦𝓲𝓭𝓰𝓮𝓽𝓼` 的公开 Forward 分发仓库。

导入地址：

```text
https://raw.githubusercontent.com/MaskedHeroQAQ/Butterfly-Widgets-Feed/main/Butterfly-Widgets.fwd
```

本仓库只保存公开分发清单，以及经过兼容修复后必须公开读取的模块和数据；维护源码保存在私有仓库中。

当前自托管修复：

- Jable：直连优先，遇到 Cloudflare 验证时自动回退，并保留 WebView 详情解析。
- JAVRate：修复搜索路由并增加 Cloudflare 自动回退。
- Pornhub：统一为 Forward 的 `type: "url"` 和 `backdropPath` 数据模型。
