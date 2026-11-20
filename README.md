# Game Service Miniapp · 项目展示

游戏服务微信小程序的公开展示版。这里提供目录浏览的源码节选、可交互的模拟数据演示和技术文档。

**[打开在线演示](https://zihang607.github.io/game-service-miniapp-showcase/)** · [技术架构](docs/technical/architecture.md) · [源码节选](source/)

## 体验演示

试试按分类筛选、搜索「教学」或打开任意服务查看规格。也可下载仓库后直接在浏览器打开 [`docs/index.html`](docs/index.html)，无需安装依赖或启动服务器。演示中的服务、价格和规格均为虚构示例。

## 阅读源码

| 模块 | 阅读入口 |
| --- | --- |
| 目录数据契约 | [CatalogRepository](source/miniprogram/repositories/contracts/catalog.ts) · [数据类型](source/miniprogram/types/catalog.ts) |
| 数据适配 | [HTTP 目录](source/miniprogram/repositories/http-catalog.ts) · [Mock 目录](source/miniprogram/repositories/mock-catalog.ts) |
| 原生小程序组件 | [服务卡片](source/miniprogram/components/service-card/) · [搜索框](source/miniprogram/components/search-bar/) |
| Spring Boot 目录入口 | [CatalogReadController](source/backend/src/main/java/com/gameservice/backend/controller/CatalogReadController.java) |

`source/` 供代码阅读，包含部分仅存在于完整项目的依赖引用。`docs/` 中的浏览器演示可独立运行。
