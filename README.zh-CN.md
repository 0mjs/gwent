注：基于来自 https://github.com/gwentcards/gwentcards.github.io/ 的卓越数据集

# Gwent 卡牌表 (Deno + Vite + React)

由 `data/cards.json` 驱动的交互式内存卡牌表。

## 运行

```sh
deno task dev
```

## 构建

```sh
deno task build
```

## 部署 (Vercel)

- 框架: Vite
- 安装命令: `yarn install --frozen-lockfile`
- 构建命令: `yarn build`
- 输出目录: `dist`

`vercel.json` 已配置好这些设置。

## 功能

- 为 `data/cards.json` 中的每张卡牌渲染表格
- 支持对卡牌关键字段进行搜索
- 支持卡组 (deck)、扩展包 (expansion)、领地 (territory) 和类型 (type) 的下拉筛选
- 勾选状态过滤（全部 / 已勾选 / 未勾选）
- 每行提供复选框，并支持对可见行进行批量勾选/取消勾选
- 支持按名称、卡组、扩展包、领地和类型在客户端进行排序
