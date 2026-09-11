import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useData, useMedia, type CalBin, type Track } from '../data'
import { useI18n, type Lang } from '../i18n'
import { BRAND, CARD, Z300, Z400, Z500, Z600, Z700, cx, formatDate } from '../lib/fight'

const pct = (v: number) => `${Math.round(v * 100)}%`

// ── copy (page-specific, depends on the numbers) ─────────────────────────────────

function copy(lang: Lang, tr: Track) {
  const { model: m, favourite: fav, coin, finish: fin } = tr
  const [lo, hi] = m.ci95.map(v => Math.round(v * 100))
  const top = tr.calibration[tr.calibration.length - 1]
  const overconfident = top && top.hit_rate < top.avg_conf - 0.05
  const topLabel = top?.label.endsWith('+') ? top.label.slice(0, -1) + (lang === 'ru' ? ' и выше' : ' and above') : top?.label
  const ns = tr.calibration.map(b => b.n)
  const finishLost = fin.model_rate !== null && fin.always_finish_rate !== null && fin.model_rate < fin.always_finish_rate
  const heavy = fin.always_finish_rate !== null && tr.ufc_finish_rate_24m.rate !== null
    && fin.always_finish_rate > tr.ufc_finish_rate_24m.rate + 0.05
  const ruFights = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? 'бой'
    : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'боя' : 'боёв')
  const loc = lang === 'ru' ? 'ru-RU' : 'en-US'
  const sameYear = tr.period.from.slice(0, 4) === tr.period.to.slice(0, 4)
  const d = (x: string, withYear = true) => formatDate(x, loc, withYear ? { day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'long' })
  const year = tr.period.to.slice(0, 4)
  // «с 14 июня по 5 сентября 2026» / "June 14 to September 5, 2026"
  const range = sameYear
    ? (lang === 'ru' ? `с ${d(tr.period.from, false)} по ${d(tr.period.to, false)} ${year}` : `${d(tr.period.from, false)} to ${d(tr.period.to, false)}, ${year}`)
    : (lang === 'ru' ? `с ${d(tr.period.from)} по ${d(tr.period.to)}` : `${d(tr.period.from)} to ${d(tr.period.to)}`)
  const events = (n: number) => lang === 'ru'
    ? `${n} ${n % 10 === 1 && n % 100 !== 11 ? 'турнире' : 'турнирах'}` : `${n} ${n === 1 ? 'event' : 'events'}`

  if (lang === 'ru') {
    return {
      title: 'fightev — Точность модели',
      eyebrow: 'Точность модели',
      h1: 'Как модель отработала',
      lead: `Каждый прогноз записывается до начала боя и потом сверяется с результатом. ${range[0].toUpperCase() + range.slice(1)} — ${tr.n_fights} ${ruFights(tr.n_fights)} на ${events(tr.n_events)}. Показываем как есть, включая слабые места.`,
      s1: 'Угадан ли победитель',
      s1sub: (m.rate <= coin.rate
        ? 'Пока модель не лучше монетки.'
        : m.rate < fav.rate
          ? 'Модель лучше монетки, но пока уступает простому правилу «выбирай фаворита по линии».'
          : 'Модель не уступает простому правилу «выбирай фаворита по линии».')
        + ` Выборка маленькая: реальная точность модели где-то между ${lo}% и ${hi}% (белая полоса).`,
      rows: ['Модель fightev', 'Фаворит по линии', 'Монетка'],
      of: (k: number, n: number) => `${k} из ${n}`,
      avg: 'в среднем',
      ci: `95% интервал: ${lo}–${hi}%`,
      s2: 'Можно ли верить уверенности',
      s2sub: 'Если модель уверена на 70%, такие бои она должна угадывать примерно в 70% случаев — точки должны лежать на диагонали. '
        + (overconfident
          ? `Пока это не так: при уверенности ${topLabel} модель угадала только ${top.hits} ${ruFights(top.hits)} из ${top.n}. Уверенным процентам на карточке рано доверять больше, чем осторожным.`
          : 'Пока точки близки к диагонали, но интервалы широкие — выборка маленькая.'),
      xAxis: 'уверенность модели в победителе',
      yAxis: 'доля угаданных',
      diag: ['идеальная', 'калибровка'],
      th: ['Уверенность', 'Боёв', 'Угадано'],
      binTip: (b: CalBin) => `Уверенность ${b.label}: угадано ${b.hits} из ${b.n} (${pct(b.hit_rate)}), 95% интервал ${pct(b.ci95[0])}–${pct(b.ci95[1])}`,
      calNote: `Вертикальные линии — 95% интервал. Они длинные, потому что в каждой группе ${Math.min(...ns)}–${Math.max(...ns)} боёв.`,
      s3: 'По турнирам',
      s3sub: 'Одна точка — один бой, для которого был записан прогноз.',
      hit: 'угадал', miss: 'ошибся',
      s4: 'Досрочно или решение',
      s4sub: finishLost
        ? 'Отдельная модель пыталась угадать, закончится ли бой досрочно. Она проиграла простому правилу, поэтому в карточках боя мы её не показываем — вместо прогноза там история самих бойцов и среднее по UFC.'
        : 'Отдельная модель пытается угадать, закончится ли бой досрочно. В карточках её нет: выборка слишком мала, чтобы доверять ей больше, чем истории самих бойцов и среднему по UFC.',
      fin: [
        ['модель досрочки', `${fin.model_hits} из ${fin.n} угадано`],
        ['правило «всегда досрочно»', heavy ? 'на тех же боях — выборке повезло с досрочками' : 'на тех же боях'],
        ['боёв в UFC заканчиваются досрочно', 'за последние два года — это отметка на карточке боя'],
      ],
      s5: 'Как считаем',
      method: [
        ['Только то, что записано до боя.', 'Прогнозы берутся из журнала запусков, пересчёт задним числом не допускается.'],
        ['Три модели, одно среднее.', 'CatBoost, LightGBM и XGBoost обучены на статистике UFCStats; на карточке — их среднее.'],
        ['Фаворит по линии — только ориентир.', 'Коэффициенты используются здесь для сравнения точности и больше нигде на сайте.'],
        ['Страница обновляется сама', 'после каждого турнира, когда в базе появляются результаты.'],
      ],
    }
  }
  return {
    title: 'fightev — Model accuracy',
    eyebrow: 'Model accuracy',
    h1: 'How the model performed',
    lead: `Every forecast is recorded before the fight and checked against the result afterwards. From ${range}: ${tr.n_fights} fights across ${events(tr.n_events)}. Shown as is, weak spots included.`,
    s1: 'Did it pick the winner?',
    s1sub: (m.rate <= coin.rate
      ? 'So far the model is no better than a coin flip.'
      : m.rate < fav.rate
        ? 'The model beats a coin flip but still trails the simple rule “pick the betting favourite”.'
        : 'The model keeps up with the simple rule “pick the betting favourite”.')
      + ` The sample is small: the true accuracy is somewhere between ${lo}% and ${hi}% (white bar).`,
    rows: ['fightev model', 'Betting favourite', 'Coin flip'],
    of: (k: number, n: number) => `${k} of ${n}`,
    avg: 'on average',
    ci: `95% interval: ${lo}–${hi}%`,
    s2: 'Can you trust the confidence?',
    s2sub: 'When the model is 70% sure, it should be right about 70% of the time — the dots should sit on the diagonal. '
      + (overconfident
        ? `Not yet: at ${topLabel} confidence it got only ${top.hits} of ${top.n} right. Don't trust the confident percentages on a card more than the cautious ones — yet.`
        : 'So far the dots are close to the diagonal, but the intervals are wide — the sample is small.'),
    xAxis: "model's confidence in the winner",
    yAxis: 'share picked correctly',
    diag: ['perfect', 'calibration'],
    th: ['Confidence', 'Fights', 'Correct'],
    binTip: (b: CalBin) => `Confidence ${b.label}: ${b.hits} of ${b.n} right (${pct(b.hit_rate)}), 95% interval ${pct(b.ci95[0])}–${pct(b.ci95[1])}`,
    calNote: `Vertical lines are 95% intervals. They are long because each group holds only ${Math.min(...ns)}–${Math.max(...ns)} fights.`,
    s3: 'By event',
    s3sub: 'One dot is one fight with a recorded forecast.',
    hit: 'right', miss: 'wrong',
    s4: 'Finish or decision',
    s4sub: finishLost
      ? "A separate model tried to predict whether a fight ends inside the distance. It lost to a simple rule, so it isn't shown on fight cards — they show the fighters' own history and the UFC average instead."
      : "A separate model tries to predict whether a fight ends inside the distance. It isn't on the cards: the sample is too small to trust it over the fighters' own history and the UFC average.",
    fin: [
      ['finish model', `${fin.model_hits} of ${fin.n} right`],
      ['“always a finish” rule', heavy ? 'on the same fights — the sample happened to be finish-heavy' : 'on the same fights'],
      ['of UFC fights end inside the distance', 'over the last two years — the tick on every fight card'],
    ],
    s5: 'Method',
    method: [
      ['Only what was recorded before the fight.', 'Forecasts come from the run log; nothing is recalculated after the fact.'],
      ['Three models, one average.', 'CatBoost, LightGBM and XGBoost are trained on UFCStats data; the card shows their average.'],
      ['The betting favourite is only a benchmark.', 'Odds are used here to compare accuracy and nowhere else on the site.'],
      ['The page updates itself', 'after every event, once the results reach the database.'],
    ],
  }
}

type Copy = ReturnType<typeof copy>

// ── layout pieces ──────────────────────────────────────────────────────────────

function H2({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-[22px]">
      <h2 className="m-0 text-[22px] font-bold tracking-[-0.015em] text-zinc-50">{children}</h2>
      {sub && <p className="mb-0 mt-1.5 max-w-[620px] text-[13px] leading-[1.55] text-zinc-400">{sub}</p>}
    </div>
  )
}

const Panel = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cx('rounded-xl border border-line bg-card p-5 md:p-7', className)}>{children}</div>
)

// ── 1. model vs baselines ──────────────────────────────────────────────────────

function CompareBars({ tr, c }: { tr: Track; c: Copy }) {
  const [lo, hi] = tr.model.ci95
  const rows: [string, number, string, string, boolean][] = [
    [c.rows[0], tr.model.rate, c.of(tr.model.hits, tr.n_fights), BRAND, true],
    [c.rows[1], tr.favourite.rate, c.of(tr.favourite.hits, tr.n_fights), Z400, false],
    [c.rows[2], tr.coin.rate, c.avg, Z700, false],
  ]
  const whisker = 'absolute bg-zinc-50/75'
  return (
    <div>
      {rows.map(([label, r, sub, col, ci], i) => (
        <div key={label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-2.5 md:h-11 md:grid-cols-[150px_minmax(0,1fr)_128px] md:py-0">
          <span className="text-[13px] text-zinc-300">{label}</span>
          <div className="relative col-span-2 row-start-2 h-5 md:col-span-1 md:row-start-auto">
            <div className="a-grow absolute inset-y-0 left-0 rounded-r" style={{ width: `${r * 100}%`, background: col, animationDelay: `${0.1 + i * 0.08}s` }} />
            {ci && (
              <div title={c.ci} aria-label={c.ci} role="img" className="absolute inset-y-0" style={{ left: `${lo * 100}%`, width: `${(hi - lo) * 100}%` }}>
                <div className={cx(whisker, 'inset-x-0 top-1/2 -mt-px h-0.5')} />
                <div className={cx(whisker, 'bottom-[3px] left-0 top-[3px] w-0.5')} />
                <div className={cx(whisker, 'bottom-[3px] right-0 top-[3px] w-0.5')} />
              </div>
            )}
          </div>
          <div className="text-right">
            <span className="text-[15px] font-semibold text-zinc-50">{pct(r)}</span>
            <span className="ml-1.5 whitespace-nowrap text-[11px] text-zinc-500">{sub}</span>
          </div>
        </div>
      ))}
      <div className="mt-1.5 grid grid-cols-1 gap-4 md:grid-cols-[150px_minmax(0,1fr)_128px]" aria-hidden>
        <span className="hidden md:block" />
        <div className="relative mx-2 h-3.5 md:mx-0">
          {[0, 25, 50, 75, 100].map(v => (
            <span key={v} className="tnum absolute -translate-x-1/2 font-mono text-[11px] text-zinc-500" style={{ left: `${v}%` }}>{v}%</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── 2. calibration ─────────────────────────────────────────────────────────────

function useWidth<T extends HTMLElement>(): [React.RefObject<T>, number] {
  const ref = useRef<T>(null)
  const [w, setW] = useState(0)
  useLayoutEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

function CalibrationChart({ bins, c }: { bins: CalBin[]; c: Copy }) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const W = Math.min(Math.max(width, 280), 560)
  const narrow = W < 440
  const H = narrow ? 280 : 330, L = narrow ? 62 : 56, R = narrow ? 16 : 110, T = 18, B = 46
  const [x0, x1, y0, y1] = [0.5, 0.75, 0.3, 1.0]
  const X = (v: number) => L + ((v - x0) / (x1 - x0)) * (W - L - R)
  const Y = (v: number) => T + (1 - (v - y0) / (y1 - y0)) * (H - T - B)
  const mono = { fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }
  const sans = { fontFamily: 'Inter, sans-serif' }
  const xs = narrow ? [0.5, 0.6, 0.7] : [0.5, 0.55, 0.6, 0.65, 0.7, 0.75]
  const hb = hover !== null ? bins[hover] : null

  return (
    <div ref={ref} className="relative w-full">
      {width > 0 && (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block max-w-full" role="img" aria-label={c.s2}>
          {[0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map(v => (
            <g key={v}>
              <line x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} stroke="#1f1f23" />
              <text x={L - 10} y={Y(v) + 4} textAnchor="end" fill={Z500} style={mono}>{Math.round(v * 100)}%</text>
            </g>
          ))}
          {xs.map(v => <text key={v} x={X(v)} y={H - B + 20} textAnchor="middle" fill={Z500} style={mono}>{Math.round(v * 100)}%</text>)}
          <line x1={X(0.5)} y1={Y(0.5)} x2={X(0.75)} y2={Y(0.75)} stroke={Z500} strokeWidth="1.5" />
          {!narrow && c.diag.map((s, i) => (
            <text key={s} x={X(0.75) + 8} y={Y(0.75) - 2 + i * 14} fill={Z500} style={{ ...sans, fontSize: 11 }}>{s}</text>
          ))}
          {bins.map((b, i) => {
            const cx_ = X(Math.min(b.avg_conf, 0.745)), cy = Y(b.hit_rate)
            return (
              <g key={b.label} tabIndex={0} role="img" aria-label={c.binTip(b)} className="cursor-default outline-none"
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)} onBlur={() => setHover(null)}>
                <line x1={cx_} x2={cx_} y1={Y(Math.min(b.ci95[1], 1))} y2={Y(Math.max(b.ci95[0], 0.3))}
                  stroke={hover === i ? Z400 : Z600} strokeWidth="2" strokeLinecap="round" />
                <circle cx={cx_} cy={cy} r="16" fill="transparent" />
                <circle cx={cx_} cy={cy} r={hover === i ? 7 : 6} fill={BRAND} stroke={CARD} strokeWidth="2" />
                <text x={cx_ + 11} y={cy + 4} fill={Z300} style={mono}>{b.hits}/{b.n}</text>
              </g>
            )
          })}
          <text x={(L + W - R) / 2} y={H - 6} textAnchor="middle" fill={Z400} style={{ ...sans, fontSize: 12 }}>{c.xAxis}</text>
          <text transform={`translate(11 ${(T + H - B) / 2}) rotate(-90)`} textAnchor="middle" fill={Z400} style={{ ...sans, fontSize: 12 }}>{c.yAxis}</text>
        </svg>
      )}
      {hb && (
        <div className="pointer-events-none absolute z-10 max-w-[240px] rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs leading-snug text-zinc-300 shadow-xl"
          style={{
            left: Math.min(X(Math.min(hb.avg_conf, 0.745)) + 14, W - 250),
            top: Math.max(Y(hb.hit_rate) - 58, 0),
          }}>
          {c.binTip(hb)}
        </div>
      )}
    </div>
  )
}

function CalibrationTable({ bins, c }: { bins: CalBin[]; c: Copy }) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-zinc-800 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
          <th className="pb-2 text-left font-semibold">{c.th[0]}</th>
          <th className="w-[52px] pb-2 text-right font-semibold">{c.th[1]}</th>
          <th className="w-[76px] pb-2 text-right font-semibold">{c.th[2]}</th>
        </tr>
      </thead>
      <tbody className="tnum font-mono text-[13px]">
        {bins.map(b => (
          <tr key={b.label} className="h-[38px] border-b border-zinc-900">
            <td className="text-zinc-300">{b.label}</td>
            <td className="text-right text-zinc-400">{b.n}</td>
            <td className="text-right text-zinc-50">{pct(b.hit_rate)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ── 3. events as unit dots ─────────────────────────────────────────────────────

function EventDots({ tr, c, lang }: { tr: Track; c: Copy; lang: Lang }) {
  const loc = lang === 'ru' ? 'ru-RU' : 'en-US'
  const dot = (hit: boolean, k: number) => (
    <span key={k} className="h-3 w-3 rounded-full"
      style={hit ? { background: BRAND } : { boxShadow: `inset 0 0 0 2px ${Z700}` }} />
  )
  return (
    <>
      <ul>
        {[...tr.events].reverse().map(e => (
          <li key={e.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-zinc-900 py-3 md:h-11 md:grid-cols-[minmax(0,1fr)_64px_200px_64px] md:gap-4 md:py-0">
            <span className="truncate text-[13px] text-zinc-300">{e.name}</span>
            <span className="font-mono text-xs text-zinc-500 md:order-none">{formatDate(e.date, loc, { day: '2-digit', month: '2-digit' })}</span>
            <div className="flex flex-wrap gap-[5px]" role="img" aria-label={`${c.of(e.hit, e.n)}`}>
              {Array.from({ length: e.n }, (_, k) => dot(k < e.hit, k))}
            </div>
            <span className="text-right font-mono text-[13px] text-zinc-50">{c.of(e.hit, e.n)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3.5 flex gap-[18px] text-xs text-zinc-400">
        <span className="inline-flex items-center gap-[7px]">{dot(true, 0)}{c.hit}</span>
        <span className="inline-flex items-center gap-[7px]">{dot(false, 1)}{c.miss}</span>
      </div>
    </>
  )
}

function Stat({ value, label, sub }: { value: string; label: string; sub: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-4xl font-bold leading-none tracking-[-0.02em] text-zinc-50">{value}</span>
      <span className="text-[13px] text-zinc-300">{label}</span>
      <span className="text-xs leading-normal text-zinc-500">{sub}</span>
    </div>
  )
}

// ── page ───────────────────────────────────────────────────────────────────────

export default function Accuracy() {
  const { lang } = useI18n()
  const data = useData()
  const wide = useMedia('(min-width: 1024px)')
  const tr = data.status === 'ok' ? data.data.track : null
  const c = tr && tr.n_fights > 0 ? copy(lang, tr) : null
  useEffect(() => { document.title = c?.title ?? 'fightev' }, [c?.title])

  if (data.status === 'loading') {
    return <div className="mx-auto max-w-[1024px] px-4 py-14 md:px-6" aria-busy="true"><div className="sk h-11 w-2/3 rounded-md" /><div className="sk mt-10 h-48 rounded-xl" /></div>
  }
  if (!tr || !c) {
    const msg = data.status === 'error'
      ? (lang === 'ru' ? 'Не удалось загрузить данные.' : "Couldn't load the data.")
      : (lang === 'ru' ? 'Прогнозов со сверенным результатом пока нет.' : 'No forecasts with a checked result yet.')
    return <div className="mx-auto max-w-[1024px] px-4 py-14 text-sm text-zinc-400 md:px-6">{msg}</div>
  }
  const fin = tr.finish
  const base = tr.ufc_finish_rate_24m.rate
  return (
    <div className="mx-auto max-w-[1024px] px-4 pb-[90px] pt-10 md:px-6 md:pt-[52px]">
      <div className="eyebrow mb-3.5 text-brand">{c.eyebrow}</div>
      <h1 className="m-0 text-[32px] font-bold leading-[1.08] tracking-[-0.025em] md:text-[44px]">{c.h1}</h1>
      <p className="mb-0 mt-4 max-w-[640px] text-[15px] leading-relaxed text-zinc-400">{c.lead}</p>

      <section className="mt-12"><H2 sub={c.s1sub}>{c.s1}</H2><Panel><CompareBars tr={tr} c={c} /></Panel></section>

      <section className="mt-[52px]">
        <H2 sub={c.s2sub}>{c.s2}</H2>
        <Panel>
          <div className={cx('grid items-center gap-9', wide ? 'grid-cols-[560px_minmax(0,1fr)]' : 'grid-cols-1')}>
            <CalibrationChart bins={tr.calibration} c={c} />
            <div>
              <CalibrationTable bins={tr.calibration} c={c} />
              <p className="mb-0 mt-3.5 text-xs leading-normal text-zinc-500">{c.calNote}</p>
            </div>
          </div>
        </Panel>
      </section>

      <section className="mt-[52px]">
        <H2 sub={c.s3sub}>{c.s3}</H2>
        <Panel className="!pt-2 md:!pt-3"><EventDots tr={tr} c={c} lang={lang} /></Panel>
      </section>

      {fin.n > 0 && fin.model_rate !== null && fin.always_finish_rate !== null && (
        <section className="mt-[52px]">
          <H2 sub={c.s4sub}>{c.s4}</H2>
          <Panel>
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-3 sm:gap-8">
              <Stat value={pct(fin.model_rate)} label={c.fin[0][0]} sub={c.fin[0][1]} />
              <Stat value={pct(fin.always_finish_rate)} label={c.fin[1][0]} sub={c.fin[1][1]} />
              {base !== null && <Stat value={pct(base)} label={c.fin[2][0]} sub={c.fin[2][1]} />}
            </div>
          </Panel>
        </section>
      )}

      <section className="mt-[52px]">
        <H2>{c.s5}</H2>
        <div className="grid grid-cols-1 gap-x-10 gap-y-3.5 text-[13px] leading-relaxed text-zinc-400 md:grid-cols-2">
          {c.method.map(([b, rest]) => <p key={b} className="m-0"><b className="font-semibold text-zinc-300">{b}</b> {rest}</p>)}
        </div>
      </section>
    </div>
  )
}
