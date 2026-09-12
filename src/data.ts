import { useEffect, useState } from 'react'

// Shapes written by export_site_data.py (private model repo) into public/data/.

export type Method = 'KO' | 'SUB' | 'DEC' | 'OTHER'

export interface FormEntry { date: string; opp: string; res: 'W' | 'L' | 'D'; method: Method; round: number | null }

export interface Stats {
  height_in: number | null; reach_in: number | null; stance: string | null; age: number | null
  slpm: number | null; str_acc: number | null; sapm: number | null; str_def: number | null
  td_avg: number | null; td_acc: number | null; td_def: number | null; sub_avg: number | null
}

export interface Fighter {
  name: string; slug: string; photo: boolean; nickname: string | null
  record: [number, number, number] | null   // pro record (fighter_stats)
  ufc_record: [number, number] | null       // fallback when there is no fighter_stats row
  ufc_fights: number
  form: FormEntry[]
  stats: Stats | null
  zones: { head: number; body: number; leg: number } | null
  ufc_wins: { KO: number; SUB: number; DEC: number }
  layoff_months: number | null
  finish_fights: number; decided_fights: number
}

export interface FightResult { winner: 0 | 1 | 2; method: Method; round: number | null; time: string | null }

export interface Fight {
  order: number; main_event: boolean; num_rounds: number; title_fight: boolean
  p_win_f1: number
  /** the finish model's probability that the fight ends inside the distance */
  p_finish: number | null
  models: { catboost?: number; lightgbm?: number; xgboost?: number } | null
  fighter_1: Fighter; fighter_2: Fighter
  result: FightResult | null
}

export interface Card {
  event: { name: string; date: string; start_utc: string | null; time_accurate: boolean } | null
  fights: Fight[]
  generated_at: string
}

export interface CalBin { label: string; n: number; hits: number; avg_conf: number; hit_rate: number; ci95: [number, number] }

export interface Track {
  period: { from: string; to: string }
  n_fights: number; n_events: number
  model: { hits: number; rate: number; ci95: [number, number] }
  favourite: { hits: number; rate: number }
  coin: { rate: number }
  calibration: CalBin[]
  events: { date: string; name: string; n: number; hit: number; fav_hit: number }[]
  finish: { n: number; model_hits: number; model_rate: number | null; always_finish_rate: number | null }
  ufc_finish_rate_24m: { n: number; rate: number | null }
  generated_at: string
}

export const photoUrl = (slug: string, avatar = false) =>
  `${import.meta.env.BASE_URL}data/photos/${slug}${avatar ? '_a' : ''}.webp`

type State<T> = { status: 'loading' } | { status: 'error' } | { status: 'ok'; data: T }

const cache = new Map<string, Promise<unknown>>()

function load<T>(file: string): Promise<T> {
  if (!cache.has(file)) {
    // no-cache: the JSON is replaced after every model run, the bundle is not
    const p = fetch(`${import.meta.env.BASE_URL}data/${file}`, { cache: 'no-cache' }).then(r => {
      if (!r.ok) throw new Error(`${file}: ${r.status}`)
      return r.json()
    })
    p.catch(() => cache.delete(file))
    cache.set(file, p)
  }
  return cache.get(file) as Promise<T>
}

export function useData(): State<{ card: Card; track: Track }> & { retry: () => void } {
  const [state, setState] = useState<State<{ card: Card; track: Track }>>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let alive = true
    setState({ status: 'loading' })
    Promise.all([load<Card>('fightcard.json'), load<Track>('trackrecord.json')])
      .then(([card, track]) => alive && setState({ status: 'ok', data: { card, track } }))
      .catch(() => alive && setState({ status: 'error' }))
    return () => { alive = false }
  }, [attempt])
  return { ...state, retry: () => setAttempt(a => a + 1) }
}

export function useMedia(query: string): boolean {
  const get = () => typeof window !== 'undefined' && window.matchMedia(query).matches
  const [match, setMatch] = useState(get)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatch(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return match
}
