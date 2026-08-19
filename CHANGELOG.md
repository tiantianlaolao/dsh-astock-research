# Changelog

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 格式，版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)。

## [0.1.1] - 2026-08-19

### 变更

- 报错友好化：网络不通 / 超时（20 秒）/ 服务限流分别给出可行动的中文提示；查询财报遇到无档案股票（新股或未覆盖）改为正常返回说明而非报工具错误
- README 安装口径改为 npm 包安装（`github:` 协议对中国大陆网络不可靠），补跨平台说明与已装用户路径

### 新增

- 英文 README（README.en.md）
- 「装好后可以这样问」示例段与两张实拍截图
- 「关于 AIHEY」章节，交代重型功能（回测 / 反找 / 模拟盘）的去处

## [0.1.0] - 2026-08-19

首个公开版本（GitHub + npm 同步发布）。

### 新增

- 6 个工具：`stock_search` / `stock_profile` / `stock_announcements`（支持任意历史区间）/ `stock_financials` / `factor_catalog` / `open_aihey_backtest`
- 内联注册 `stock-research` skill：合规红线（只陈述事实、不荐股、带免责声明）、数据源路由（A股数据库 vs 联网搜索）、引导规则
- 数据覆盖：沪深北约 5000 只 A股，2011 年至今

[0.1.1]: https://github.com/tiantianlaolao/dsh-astock-research/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/tiantianlaolao/dsh-astock-research/releases/tag/v0.1.0
