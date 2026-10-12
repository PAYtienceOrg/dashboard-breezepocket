export type ChainId = 101
export type OptionType = 'call' | 'put'

/** PAYtience runs on Solana mainnet only. */
export const SOLANA: ChainId = 101
export const CHAINS: Record<ChainId, { name: string; icon: string }> = {
  101: { name: 'Solana', icon: '/icons/solana.svg' },
}

/** PreStocks tokens (prestocks.com) with a logo on its site. */
const PRESTOCKS = new Set(['ANTHROPIC', 'OPENAI', 'SPACEX', 'ANDURIL', 'NEURALINK', 'FIGUREAI', 'KALSHI', 'POLYMARKET'])
/** Icons kept as PNG; every other one is `/icons/<symbol>.svg`. */
const PNG_ICONS = new Set(['PAXG', 'SKR'])

/** Artwork is optional: an asset the backend lists without a file here falls back to `letterIcon`. */
export const iconFor = (symbol: string) =>
  PNG_ICONS.has(symbol)
    ? `/icons/${symbol.toLowerCase()}.png`
    : PRESTOCKS.has(symbol)
      ? `https://prestocks.com/logos/${symbol.toLowerCase()}.png`
      : `/icons/${symbol.toLowerCase()}.svg`

/** A stand-in icon, the asset's initial on a disc, for an asset icon that failed to load. */
export const letterIcon = (iconUrl: string) => {
  const initial = (iconUrl.match(/([^/]+)\.(?:svg|png)$/)?.[1] ?? '?').charAt(0).toUpperCase()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#5f665e"/><text x="16" y="21.5" text-anchor="middle" font-family="system-ui,sans-serif" font-size="16" font-weight="600" fill="#fff">${initial}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/** The asset filter on the Earn table. */
export type Category = 'crypto' | 'stocks' | 'etf' | 'prestocks'
export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'crypto', label: 'Crypto' },
  { id: 'stocks', label: 'Stocks' },
  { id: 'etf', label: 'ETF' },
  { id: 'prestocks', label: 'Pre-stocks' },
]
const ETFS = new Set(['SPYon', 'QQQon', 'XAGon'])
/**
 * Where the market maker prices an asset places it: PreStocks tokens, US-listed names
 * (Alpaca), and crypto for everything else. Two things the venue cannot tell are kept
 * here: which US-listed names are ETFs (XAGon tracks a silver ETF), and PAXG, a
 * gold-backed crypto token that is priced off a gold ETF.
 */
export const categoryOf = (asset: string, venue: string | null): Category =>
  venue === 'prestocks' ? 'prestocks' : ETFS.has(asset) ? 'etf' : venue === 'alpaca' && asset !== 'PAXG' ? 'stocks' : 'crypto'

/** Long-form labels shown under the ticker on the Earn table. Optional: an asset without one shows its underlying. */
const ASSET_NAMES: Record<string, string> = {
  SOL: 'Solana',
  WBTC: 'Wrapped Bitcoin',
  WETH: 'Wrapped Ether',
  JUP: 'Jupiter',
  PYTH: 'Pyth Network',
  RAY: 'Raydium',
  SKR: 'Seeker',
  PAXG: 'Tokenized Gold',
  XAGon: 'Tokenized Silver',
  TSLAon: 'Tesla',
  NVDAon: 'NVIDIA',
  HYNIXon: 'SK Hynix',
  SPYon: 'S&P 500 ETF',
  QQQon: 'Nasdaq-100 ETF',
  AAPLon: 'Apple',
  MSFTon: 'Microsoft',
  AMZNon: 'Amazon',
  GOOGLon: 'Alphabet',
  METAon: 'Meta Platforms',
  NFLXon: 'Netflix',
  COINon: 'Coinbase',
  MSTRon: 'Strategy',
  ANTHROPIC: 'Anthropic',
  OPENAI: 'OpenAI',
  SPACEX: 'SpaceX',
  ANDURIL: 'Anduril',
  NEURALINK: 'Neuralink',
  FIGUREAI: 'Figure AI',
  KALSHI: 'Kalshi',
  POLYMARKET: 'Polymarket',
}
export const assetName = (asset: string, underlying?: string | null) => ASSET_NAMES[asset] ?? underlying ?? asset

export type Market = {
  asset: string
  chainId: ChainId
  collateral: string
  strike: string
  type: OptionType
}

/**
 * The market for one asset and strategy. There is no list of assets here: the pages show
 * whatever the backend reports (`health.assets`), and every asset it reports has both
 * strategies. Sell High locks the asset itself, Buy Low locks USDC.
 */
export const marketOf = (asset: string, type: OptionType): Market => ({
  asset, chainId: SOLANA, collateral: type === 'call' ? asset : 'USDC', strike: 'USDC', type,
})

export const marketHref = (m: Market, expiryId?: string) =>
  `/earn?asset=${m.asset}&collateral=${m.collateral}&strike=${m.strike}&type=${m.type}` +
  (expiryId ? `&expiry=${expiryId}` : '')

export const CAP_SOLD = { call: 44.39, put: 52.42 }

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export type Expiry = { id: string; date: Date }

/** Last Friday of the given month, at 08:00 UTC. */
const lastFridayUTC = (year: number, month: number) => {
  const d = new Date(Date.UTC(year, month + 1, 0, 8, 0, 0))
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 2) % 7))
  return d
}

/** The next few monthly expiries, at least a week out. */
const buildExpiries = (count: number): Expiry[] => {
  const now = Date.now()
  const start = new Date()
  const out: Expiry[] = []
  for (let i = 0; out.length < count && i < 24; i++) {
    const d = lastFridayUTC(start.getUTCFullYear(), start.getUTCMonth() + i)
    if (d.getTime() - now > 7 * 86_400_000) out.push({ id: `${MONTHS[d.getUTCMonth()]}_${d.getUTCDate()}`, date: d })
  }
  return out
}

export const EXPIRIES = buildExpiries(4)

export const findExpiry = (id: string | null): Expiry => EXPIRIES.find((e) => e.id === id) ?? EXPIRIES[0]
export const expiryLabel = (e: Expiry) => e.id
export const daysToExpiry = (e: Expiry) => Math.max(1, Math.ceil((e.date.getTime() - Date.now()) / 86_400_000))

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
export const expiryLong = (e: Expiry) =>
  `${MONTHS[e.date.getUTCMonth()]} ${ordinal(e.date.getUTCDate())}, ${e.date.getUTCFullYear()}`

export const fmtPrice = (n: number) => {
  // Below one cent, four decimals would drop digits of a three-figure strike.
  const small = n > 0 && n < 0.01 ? Math.min(8, 2 - Math.floor(Math.log10(n))) : 4
  const opts = n >= 1000 ? { maximumFractionDigits: 0 } : n >= 1 ? { maximumFractionDigits: 2 } : { maximumFractionDigits: small }
  return '$' + n.toLocaleString('en-US', opts)
}
export const fmtNum = (n: number, digits = 2) =>
  n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
