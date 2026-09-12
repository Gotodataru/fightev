import type { Fight, Fighter, Stats } from '../data'
import type { Dict, Verdict } from '../i18n'

// SVG attributes and inline styles read the same tokens as the classes, so a theme
// switch repaints them without React re-rendering anything
export const BRAND = 'var(--c-brand)'
export const ON_BRAND = 'var(--c-on-brand)'
export const CARD = 'var(--c-card)'
export const BG = 'var(--c-bg)'
export const FG = 'var(--c-z50)'
export const Z300 = 'var(--c-z300)', Z400 = 'var(--c-z400)', Z500 = 'var(--c-z500)', Z600 = 'var(--c-z600)'
export const Z700 = 'var(--c-z700)', Z800 = 'var(--c-z800)', Z900 = 'var(--c-z900)'
/** Bars and segments painted on a surface — readable on both themes. */
export const FILL = 'var(--c-fill)', FILL_DIM = 'var(--c-fill-dim)'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

/** Split a probability into two integer percentages that always sum to 100. */
export function split(p1: number): [number, number] {
  const a = Math.round(p1 * 100)
  return [a, 100 - a]
}

export function verdict(p1: number): Verdict {
  const d = Math.abs(p1 - 0.5)
  if (d < 0.04) return 'even'
  if (d < 0.10) return 'slight'
  if (d < 0.18) return 'edge'
  return 'clear'
}

export const favourite = (f: Fight) => (f.p_win_f1 >= 0.5 ? f.fighter_1 : f.fighter_2)

/** Newcomers: one or two UFC bouts — the forecast is flagged as less reliable. */
export const sparse = (f: Fighter) => f.ufc_fights <= 2
export const lowData = (f: Fight) => sparse(f.fighter_1) || sparse(f.fighter_2)

export function record(f: Fighter, t: Dict): string {
  if (f.record) {
    const [w, l, d] = f.record
    return `${w}-${l}${d ? `-${d}` : ''}`
  }
  if (f.ufc_record) return t.ufcRecord(...f.ufc_record)
  return '—'
}

export function initials(name: string) {
  const p = name.split(' ').filter(Boolean)
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase()
}

export const lastName = (name: string) => {
  const i = name.indexOf(' ')
  return i < 0 ? name : name.slice(i + 1)
}

export function modelSpread(f: Fight): { vals: [string, number][]; spread: number } | null {
  if (!f.models) return null
  const names: Record<string, string> = { catboost: 'CatBoost', lightgbm: 'LightGBM', xgboost: 'XGBoost' }
  const vals = Object.entries(f.models)
    .filter((e): e is [string, number] => typeof e[1] === 'number')
    .map(([k, v]) => [names[k] ?? k, Math.round(v * 100)] as [string, number])
  if (vals.length < 2) return null
  const nums = vals.map(v => v[1])
  return { vals, spread: Math.max(...nums) - Math.min(...nums) }
}

// ── tale of the tape ───────────────────────────────────────────────────────────

export interface TapeRow { key: string; label: string; t1: string; t2: string; adv: 0 | 1 | 2; bars: boolean; w1: number; w2: number }

type Better = 'hi' | 'lo' | null

export function tapeRows(f1: Fighter, f2: Fighter, t: Dict, lang: 'ru' | 'en'): TapeRow[] {
  const s1: Partial<Stats> = f1.stats ?? {}, s2: Partial<Stats> = f2.stats ?? {}
  const num = (d: number) => new Intl.NumberFormat(t.locale, { minimumFractionDigits: d, maximumFractionDigits: d })
  const n2 = num(2), n0 = num(0)
  const height = (v: number) => (lang === 'en' ? `${Math.floor(v / 12)}′${v % 12}″` : `${Math.round(v * 2.54)} ${t.cm}`)
  const reach = (v: number) => (lang === 'en' ? `${v}″` : `${Math.round(v * 2.54)} ${t.cm}`)
  const spec: [keyof Dict['tapeRows'], keyof Stats, Better, (v: never) => string][] = [
    ['age', 'age', null, (v: number) => String(v)],
    ['height', 'height_in', 'hi', height],
    ['reach', 'reach_in', 'hi', reach],
    ['stance', 'stance', null, (v: string) => t.stance[v] ?? v],
    ['slpm', 'slpm', 'hi', (v: number) => n2.format(v)],
    ['str_acc', 'str_acc', 'hi', (v: number) => `${n0.format(v)}%`],
    ['sapm', 'sapm', 'lo', (v: number) => n2.format(v)],
    ['str_def', 'str_def', 'hi', (v: number) => `${n0.format(v)}%`],
    ['td_avg', 'td_avg', 'hi', (v: number) => n2.format(v)],
    ['td_def', 'td_def', 'hi', (v: number) => `${n0.format(v)}%`],
  ]
  return spec.map(([key, field, better, fmt]) => {
    const v1 = s1[field] ?? null, v2 = s2[field] ?? null
    const show = (v: unknown) => (v === null || v === '' ? '—' : (fmt as (x: unknown) => string)(v))
    const numeric = typeof v1 === 'number' && typeof v2 === 'number'
    let adv: 0 | 1 | 2 = 0
    if (better && numeric && v1 !== v2) adv = (v1 > v2) === (better === 'hi') ? 1 : 2
    const bars = better !== null && numeric && Math.max(v1, v2) > 0
    const mx = numeric ? Math.max(v1, v2) : 0
    return {
      key, label: t.tapeRows[key], t1: show(v1), t2: show(v2), adv, bars,
      w1: bars ? Math.round((v1 as number) / mx * 100) : 0,
      w2: bars ? Math.round((v2 as number) / mx * 100) : 0,
    }
  })
}

// ── dates ──────────────────────────────────────────────────────────────────────

/** Event dates are calendar dates (no reliable start time) — compare as local dates. */
export function daysUntil(isoDate: string, now = new Date()): number {
  const [y, m, d] = isoDate.split('-').map(Number)
  const ev = Date.UTC(y, m - 1, d)
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((ev - today) / 86400000)
}

export function formatDate(isoDate: string, locale: string, opts: Intl.DateTimeFormatOptions) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Intl.DateTimeFormat(locale, { ...opts, timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)))
}

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
