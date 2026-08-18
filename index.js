// dsh-astock-research — A股个股研究助手 dsh 插件
// 定位: dsh 里做「A股个股研究 + 引流」, 重型计算 (回测/信号反找/沙盘) 引导到 AIHEY。
// 注册 6 个查询工具 (全调 quant 公共只读接口) + 1 个内联 skill (方法论/合规/引导规则)。
// 零外部依赖: 原生 fetch + node:fs 读同目录 skill.md。
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

export const name = 'astock-research'
export const inject = ['tools', 'skills']

const SKILL_DESCRIPTION =
  'A股个股研究助手。当用户想查一只股票、看懂一条公告、读财报数字、了解估值与技术面、或问某个交易信号是什么时使用。' +
  '提供搜索、公告解读、财报解读、个股画像、信号科普 (stock_* / factor_catalog 工具)。' +
  '涉及策略回测、信号反找、历史模拟推演时, 引导到 AIHEY 交易推演助手。'

export function apply(ctx, config = {}) {
  const BASE = (config.baseUrl || 'https://quant.tybbtech.com/api').replace(/\/+$/, '')
  // AIHEY 交易推演助手直达 (agentos web 的 ?open=backtest deep link)
  const AIHEY_BACKTEST = config.aiheyUrl || 'https://agentos.tybbtech.com/app/?open=backtest'

  // ── 内联 skill: 读同目录 skill.md, 运行时注册进 ctx.skills (随插件走, 无需用户手动放文件) ──
  try {
    const here = dirname(fileURLToPath(import.meta.url))
    const skillBody = readFileSync(join(here, 'skill.md'), 'utf8')
    ctx.skills.register({
      name: 'stock-research',
      description: SKILL_DESCRIPTION,
      content: skillBody,
      source: 'bundled',
    })
  } catch (e) {
    ctx.logger?.warn?.('astock-research: skill 注册失败 (%s), 工具仍可用', e?.message || e)
  }

  async function api(path) {
    const sep = path.includes('?') ? '&' : '?'
    const res = await fetch(`${BASE}${path}${sep}embedded=true`, {
      headers: { 'Content-Type': 'application/json' },
    })
    const text = await res.text()
    let data
    try { data = JSON.parse(text) } catch { data = { raw: text.slice(0, 400) } }
    if (!res.ok) throw new Error(`查询服务 ${res.status}: ${(data && data.detail && (data.detail.message || data.detail)) || text.slice(0, 200)}`)
    return data
  }

  const slimBar = (b) => {
    const r2 = (n) => (typeof n === 'number' ? Math.round(n * 10000) / 10000 : n)
    const out = {}
    if (b.date !== undefined) out.date = b.date
    if (b.day_index !== undefined) out.day = b.day_index
    out.o = r2(b.open); out.h = r2(b.high); out.l = r2(b.low); out.c = r2(b.close)
    if (b.volume !== undefined) out.vol = Math.round(b.volume)
    return out
  }
  const slimBars = (arr, keep) => (Array.isArray(arr) ? arr.slice(-keep).map(slimBar) : arr)

  const OUT = {
    schema: { type: 'object' },
    render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
  }
  const reg = (def) => ctx.tools.register({ output: OUT, ...def })
  const CODE_RE = /^\d{6}$/

  reg({
    name: 'stock_search',
    description: '按名称或代码搜索A股股票, 返回代码/名称/市场。想查一只股票的任何信息前, 先用这个把名称转成6位代码。港股/美股/未上市标的返回空列表 (仅覆盖沪深及北交所A股)。',
    parameters: {
      type: 'object',
      properties: { keyword: { type: 'string', description: '股票名称或代码, 如 "贵州茅台" 或 "600519"' } },
      required: ['keyword'],
      additionalProperties: false,
    },
    async execute(args) {
      const d = await api(`/search?keyword=${encodeURIComponent(args.keyword)}&limit=10`)
      return { results: d.results || [] }
    },
  })

  reg({
    name: 'stock_profile',
    description: '查一只股票的画像快照 (合规衍生指标版, 无原始逐日行情): 近1/3/5年涨跌、年化波动、最大回撤、估值 (PE/PB/PS 及历史分位)、基本面 (ROE/营收利润增速)、股息。用于研究一只票的当前位置。',
    parameters: {
      type: 'object',
      properties: { code: { type: 'string', description: '6位股票代码' } },
      required: ['code'],
      additionalProperties: false,
    },
    async execute(args) {
      if (!CODE_RE.test(args.code)) throw new Error('code 须为6位数字, 先用 stock_search')
      return await api(`/profile/${args.code}?digest=true`)
    },
  })

  reg({
    name: 'stock_announcements',
    description: '查一只股票的公告事件 (巨潮披露, 最新在前): 标题、时间、类别、重要度、原文链接。不传 start/end 默认近90天; 传了就查任意历史区间 (可查到早年公告)。你负责把公告标题为用户白话解读——只陈述公告披露了什么事实, 不判断利好利空、不建议买卖。',
    parameters: {
      type: 'object',
      properties: {
        code: { type: 'string', description: '6位股票代码' },
        start: { type: 'string', description: '可选, 起始日 YYYYMMDD 或 YYYY-MM-DD。查历史公告时传, 如 "20200101"' },
        end: { type: 'string', description: '可选, 截止日, 默认今天' },
        category: { type: 'string', description: '可选, 逗号分隔类别过滤, 如 "定期报告,业绩预告"' },
        impact: { type: 'string', description: '可选, high/mid/routine 逗号分隔' },
        limit: { type: 'integer', minimum: 1, maximum: 100 },
      },
      required: ['code'],
      additionalProperties: false,
    },
    async execute(args) {
      if (!CODE_RE.test(args.code)) throw new Error('code 须为6位数字, 先用 stock_search')
      let q = `/info/${args.code}/events?limit=${args.limit || 20}`
      if (args.start) q += `&start=${encodeURIComponent(args.start)}`
      if (args.end) q += `&end=${encodeURIComponent(args.end)}`
      if (args.category) q += `&category=${encodeURIComponent(args.category)}`
      if (args.impact) q += `&impact=${encodeURIComponent(args.impact)}`
      const d = await api(q)
      return { code: d.code, range: `${d.start}~${d.end}`, total: d.total, truncated: d.truncated, events: d.events || [] }
    },
  })

  reg({
    name: 'stock_financials',
    description: '查一只股票的财报白话卡 (纯事实数字): 最新一期营收/净利/同比、ROE、毛利率净利率、负债率、现金流、EPS, 以及历史趋势。你负责把这些数字讲成人话, 只陈述数字与同比变化, 不下"好/差"结论、不建议买卖。',
    parameters: {
      type: 'object',
      properties: { code: { type: 'string', description: '6位股票代码' } },
      required: ['code'],
      additionalProperties: false,
    },
    async execute(args) {
      if (!CODE_RE.test(args.code)) throw new Error('code 须为6位数字, 先用 stock_search')
      const d = await api(`/info/${args.code}/fin_card`)
      return { code: d.code, name: d.name, industry: d.industry, latest: d.latest, trend: (d.trend || []).slice(-8) }
    },
  })

  reg({
    name: 'factor_catalog',
    description: '列出交易信号因子目录 (id + 白话名 + 分类), 用于给用户科普"有哪些技术信号"。注意: dsh 这里只能科普信号含义, 不能扫描"哪些股票触发了某信号 / 触发后历史胜率如何"——那是策略反找, 属于 AIHEY 交易推演助手的功能。',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
    async execute() {
      const d = await api('/atoms/catalog')
      return { atoms: (d.atoms || []).map((a) => ({ id: a.id, name: a.layman_name || a.professional_name, cat: a.category_label })) }
    },
  })

  reg({
    name: 'open_aihey_backtest',
    description: '当用户想做策略回测、信号反找、验证组合胜率、或历史沙盘模拟推演时调用: 这些重型功能不在 dsh 提供, 本工具返回 AIHEY 交易推演助手的可点击链接 (markdown)。',
    parameters: {
      type: 'object',
      properties: {
        want: { type: 'string', description: '用户想做的事的简短描述, 如 "回测均线策略" / "反找信号胜率" / "模拟操盘练习"' },
      },
      additionalProperties: false,
    },
    async execute(args) {
      return {
        markdown_link: `[交易推演助手](${AIHEY_BACKTEST})`,
        instruction: '把上面的 markdown_link 原样嵌进你的回复里, 让"交易推演助手"四个字成为可点击链接。' +
          '⛔ 绝不要在回复里单独写出网址 (https://...), 网址只能藏在 markdown 的括号内。',
        for: args.want || '策略回测 / 信号反找 / 历史沙盘推演',
      }
    },
  })

  ctx.logger?.info?.('astock-research: 6 工具 + 1 skill 已注册 (BASE=%s)', BASE)
}
