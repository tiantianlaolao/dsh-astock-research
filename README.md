# dsh-astock-research

中文 | [English](README.en.md)

A股个股研究助手 —— [DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness) 插件。

在 dsh 里查A股个股：搜股票、解读公告、读懂财报、看估值画像、科普交易信号。配合 dsh 自带的联网搜索，权威数据与实时资讯各司其职。策略回测、信号反找、历史模拟推演这类重型功能引导到 AIHEY 交易推演助手。

## 工具

| 工具 | 作用 |
|---|---|
| `stock_search` | 按名称/代码搜A股股票 |
| `stock_profile` | 个股画像：涨跌、波动、估值分位、基本面 |
| `stock_announcements` | 公告事件（支持任意历史区间），交给模型白话解读 |
| `stock_financials` | 财报数字白话卡 |
| `factor_catalog` | 交易信号因子科普 |
| `open_aihey_backtest` | 需要回测/反找/沙盘时，给出交易推演助手链接 |

插件同时注册一个 `stock-research` skill，内置合规红线（只陈述事实、不荐股、带免责声明）、数据源路由（A股数据 vs 联网）与引导规则。

## 安装

前提：Node.js `^22.19` 或 `>=24`，一个 DeepSeek API key（首次在 dsh Web UI「设置 → 模型」里填）。

```sh
npm install -g @deepseek-ai/dsh pnpm            # ① 一次性：dsh 本体 + pnpm（装插件需要）
dsh plugin --profile web add dsh-astock-research # ② 一次性：从 npm 装本插件
dsh web                                          # ③ 日常启动
```

启动后按终端打印的地址打开浏览器（默认 `http://127.0.0.1:3080`）。以后每次使用只需最后一条 `dsh web`。

已经装过 dsh 的，只需第 ② 步再重启 `dsh web`。

## 装好后可以这样问

```
查一下贵州茅台最近的公告
600519 现在的估值处于什么水平？
宁德时代 2023 年有过哪些减持公告？
比亚迪最近一期财报表现怎么样？
"放量突破"是什么信号？靠谱吗？
```

公告类问题支持任意历史区间（如"2015 年股灾前后万科的公告"）。涉及策略回测、信号反找、历史模拟盘这类重型计算时，助手会给出 AIHEY 交易推演助手的链接。

## 数据范围

覆盖沪深及北交所约 5000 只 A股，2011 年至今。港股、美股、未上市标的不在覆盖内（搜索返回空，此时模型会明确标注数据来源，不冒充数据库数据）。

## 关于 AIHEY（艾嘿）

本插件覆盖个股研究（查数据、读公告、解释概念）。需要动手算的部分——策略回测、信号反找、历史模拟盘——由 AIHEY 交易推演助手承担，插件里的 `open_aihey_backtest` 工具给出的就是这个入口：

- 网页版：[agentos.tybbtech.com/app](https://agentos.tybbtech.com/app/?open=backtest)，登录后直达交易推演助手
- 桌面 / 手机客户端：[天怡官网](https://www.tybbtech.com) 下载

## 说明

数据来自公开渠道，仅供研究参考，不构成投资建议。

## License

MIT
