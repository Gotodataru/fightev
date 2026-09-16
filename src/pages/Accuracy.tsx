import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useData, useMedia, type CalBin, type Track } from '../data'
import { useI18n, type Lang } from '../i18n'
import { BRAND, CARD, FILL, FILL_DIM, Z300, Z400, Z500, Z600, cx, formatDate } from '../lib/fight'
import { CountUp, Reveal, SplitWords } from '../lib/motion'
import { Message } from '../components/ui'

const pct = (v: number) => `${Math.round(v * 100)}%`

/**
 * The calibration chart's domain. Shared with the copy: the note has to be able to say
 * that an interval runs past the edge, and it can only know that if it reads the same
 * numbers the chart draws with.
 */
const CAL = { x0: 0.5, x1: 1.0, y0: 0.2, y1: 1.0 }
const clipped = (b: CalBin) => b.ci95[0] < CAL.y0 || b.ci95[1] > CAL.y1

/**
 * Wilson score interval — the method the pipeline already uses for the model's own
 * interval, so the two are comparable. Verified: wilson(40, 65) reproduces the
 * published [0.494, 0.724] to the digit.
 */
function wilson(hits: number, n: number): [number, number] {
  if (!n) return [0, 0]
  const z = 1.959964, p = hits / n, d = 1 + (z * z) / n
  const centre = (p + (z * z) / (2 * n)) / d
  const margin = (z / d) * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))
  return [Math.max(0, centre - margin), Math.min(1, centre + margin)]
}

// ── copy (page-specific, depends on the numbers) ─────────────────────────────────

function copy(lang: Lang, tr: Track) {
  const { model: m, favourite: fav, coin, finish: fin } = tr
  const [lo, hi] = m.ci95.map(v => Math.round(v * 100))
  // the benchmark is an estimate off the same 65 fights, so it gets an interval too;
  // without it the reader takes 71% for exact and only the model for uncertain
  const favCi = wilson(fav.hits, tr.n_fights)
  const [flo, fhi] = favCi.map(v => Math.round(v * 100))
  const overlap = m.ci95[1] >= favCi[0] && favCi[1] >= m.ci95[0]
  const behind = m.rate < fav.rate
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
      s1sub: m.rate <= coin.rate
        ? `Пока модель не лучше монетки. Её настоящая точность где-то между ${lo}% и ${hi}%.`
        : behind && overlap
          ? `Модель лучше монетки. Простое правило «выбирай того, кого фаворитом считает рынок» угадало больше — ${fav.hits} из ${tr.n_fights} против ${m.hits}. Но интервалы перекрываются: ${lo}–${hi}% у модели, ${flo}–${fhi}% у рынка. Выборка такого размера не решает, настоящий это разрыв или случайность, поэтому точнее сказать, что модель пока не обогнала рынок, а не что она ему уступает.`
          : behind
            ? `Модель лучше монетки, но уступает простому правилу «выбирай того, кого фаворитом считает рынок»: ${lo}–${hi}% против ${flo}–${fhi}%, и интервалы не пересекаются.`
            : `Модель не уступает простому правилу «выбирай того, кого фаворитом считает рынок»: ${lo}–${hi}% против ${flo}–${fhi}%.`,
      rows: ['Модель fightev', 'Рыночный ориентир', 'Монетка'],
      of: (k: number, n: number) => `${k} из ${n}`,
      avg: 'в среднем',
      ciLabel: (a: number, b: number) => `95% интервал: ${a}–${b}%`,
      ciNote: `Усы — 95% интервал: где лежала бы точность, будь боёв много. Монетка — не оценка, а точка отсчёта, поэтому у неё интервала нет.`,
      s2: 'Можно ли верить уверенности',
      s2sub: 'Если модель уверена на 70%, такие бои она должна угадывать примерно в 70% случаев — точки должны лежать на диагонали. '
        + (overconfident
          ? `Пока это не так: при уверенности ${topLabel} модель угадала только ${top.hits} ${ruFights(top.hits)} из ${top.n}. Уверенным процентам на карточке рано доверять больше, чем осторожным.`
          : 'Пока точки близки к диагонали, но интервалы широкие — выборка маленькая.'),
      xAxis: 'уверенность модели в победителе',
      yAxis: 'доля угаданных',
      diag: ['идеальная', 'калибровка'],
      zone: ['модель осторожничает', 'модель переоценивает себя'],
      th: ['Уверенность', 'Боёв', 'Угадано'],
      binTip: (b: CalBin) => `Уверенность ${b.label}: угадано ${b.hits} из ${b.n} (${pct(b.hit_rate)}), 95% интервал ${pct(b.ci95[0])}–${pct(b.ci95[1])}`,
      calNote: `Рядом с точкой — угадано из боёв в этой группе; площадь точки пропорциональна числу боёв. `
        + `Вертикальные линии — 95% интервал. Они длинные, потому что в каждой группе ${Math.min(...ns)}–${Math.max(...ns)} боёв.`
        + (tr.calibration.some(clipped) ? ' Стрелка на конце линии значит, что интервал уходит за край шкалы; точные границы — в подсказке к точке.' : ''),
      s3: 'По турнирам',
      s3sub: 'Одна точка — один бой, для которого был записан прогноз.',
      hit: 'угадал', miss: 'ошибся',
      s4: 'Досрочно или решение',
      s4sub: finishLost
        ? `Отдельная модель угадывает, закончится ли бой досрочно. Её прогноз стоит в карточке боя, но на проверенных боях она не обошла простое правило «всегда досрочно»: ${fin.model_hits} из ${fin.n} против ${Math.round(fin.always_finish_rate! * fin.n)}. Интервалы и здесь перекрываются, так что разрыв не доказан — доказано только, что превосходства над правилом модель не показала. Рядом с прогнозом об этом сказано, и история самих бойцов там же.`
        : 'Отдельная модель угадывает, закончится ли бой досрочно. Её прогноз стоит в карточке боя рядом с историей самих бойцов; выборка пока мала, поэтому доверять ему стоит с оглядкой.',
      fin: [
        ['Модель досрочки', `${fin.model_hits} из ${fin.n} угадано`],
        ['Правило «всегда досрочно»', 'на тех же боях'],
        ['Среднее по UFC', `досрочные финиши в ${tr.ufc_finish_rate_24m.n} боях за два года`],
      ],
      finNote: `Обе полосы посчитаны на одной и той же выборке — ${fin.n} ${ruFights(fin.n)} ${range}. Отметка «среднее по UFC» приводится для масштаба.`
        + (heavy ? ' На этой выборке досрочных финишей оказалось больше обычного, поэтому правилу здесь особенно повезло.' : ''),
      s6: 'Ответственность и статус проекта',
      liability: [
        ['Проект исследовательский.', `Модель обучена на открытой статистике боёв, а её прогнозы проверяются на боях ${range}: ${tr.n_fights} ${ruFights(tr.n_fights)} на ${events(tr.n_events)}. Выборка маленькая, выводы предварительные.`],
        ['Сервис аналитический и информационный.', 'Мы не принимаем ставок, не продаём прогнозы и не советуем, что делать с этими цифрами.'],
        ['Ответственность за решения — на том, кто их принимает.', 'Проект не отвечает за финансовые потери, возникшие из-за использования этих данных.'],
        ['Прошлая точность не гарантирует будущую.', 'Обе модели ошибаются, и все их ошибки показаны на этой странице.'],
        ['Проект независимый.', 'С UFC не связан и не представляет его; названия турниров и бойцов используются для указания на события.'],
      ],
      s5: 'Как считаем',
      method: [
        ['Только то, что записано до боя.', 'Прогнозы берутся из журнала запусков, пересчёт задним числом не допускается.'],
        ['Три модели, одно среднее.', 'CatBoost, LightGBM и XGBoost обучены на официальной статистике боёв; на карточке — их среднее.'],
        ['Рыночный ориентир — только точка отсчёта.', 'Оценка рынка нужна здесь, чтобы понять, насколько модель вообще полезна, и больше нигде на сайте не используется.'],
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
    s1sub: m.rate <= coin.rate
      ? `So far the model is no better than a coin flip. Its true accuracy sits somewhere between ${lo}% and ${hi}%.`
      : behind && overlap
        ? `The model beats a coin flip. The simple rule “pick whoever the market makes the favourite” picked more — ${fav.hits} of ${tr.n_fights} against ${m.hits}. But the intervals overlap: ${lo}–${hi}% for the model, ${flo}–${fhi}% for the market. A sample this size doesn't settle whether the gap is real, so the accurate claim is that the model hasn't beaten the market yet — not that it loses to it.`
        : behind
          ? `The model beats a coin flip but trails the simple rule “pick whoever the market makes the favourite”: ${lo}–${hi}% against ${flo}–${fhi}%, and the intervals don't meet.`
          : `The model keeps up with the simple rule “pick whoever the market makes the favourite”: ${lo}–${hi}% against ${flo}–${fhi}%.`,
    rows: ['fightev model', 'Market benchmark', 'Coin flip'],
    of: (k: number, n: number) => `${k} of ${n}`,
    avg: 'on average',
    ciLabel: (a: number, b: number) => `95% interval: ${a}–${b}%`,
    ciNote: `Whiskers are the 95% interval: where the accuracy would sit given many more fights. The coin flip is a reference point, not an estimate, so it has none.`,
    s2: 'Can you trust the confidence?',
    s2sub: 'When the model is 70% sure, it should be right about 70% of the time — the dots should sit on the diagonal. '
      + (overconfident
        ? `Not yet: at ${topLabel} confidence it got only ${top.hits} of ${top.n} right. Don't trust the confident percentages on a card more than the cautious ones — yet.`
        : 'So far the dots are close to the diagonal, but the intervals are wide — the sample is small.'),
    xAxis: "model's confidence in the winner",
    yAxis: 'share picked correctly',
    diag: ['perfect', 'calibration'],
    zone: ['the model underrates itself', 'the model overrates itself'],
    th: ['Confidence', 'Fights', 'Correct'],
    binTip: (b: CalBin) => `Confidence ${b.label}: ${b.hits} of ${b.n} right (${pct(b.hit_rate)}), 95% interval ${pct(b.ci95[0])}–${pct(b.ci95[1])}`,
    calNote: `Beside each dot: fights called right out of fights in that group; the dot’s area is proportional to the number of fights. `
      + `Vertical lines are 95% intervals. They are long because each group holds only ${Math.min(...ns)}–${Math.max(...ns)} fights.`
      + (tr.calibration.some(clipped) ? ' An arrow at the end of a line means the interval runs past the edge of the scale; the exact bounds are in the point’s tooltip.' : ''),
    s3: 'By event',
    s3sub: 'One dot is one fight with a recorded forecast.',
    hit: 'right', miss: 'wrong',
    s4: 'Finish or decision',
    s4sub: finishLost
      ? `A separate model predicts whether a fight ends inside the distance. Its forecast sits on every fight card, but on checked fights it did not beat the simple “always a finish” rule: ${fin.model_hits} of ${fin.n} against ${Math.round(fin.always_finish_rate! * fin.n)}. These intervals overlap too, so the gap isn't proven — only that the model showed no edge over the rule. The card says so next to the number, with the fighters' own history beside it.`
      : 'A separate model predicts whether a fight ends inside the distance. Its forecast sits on every fight card next to the fighters’ own history; the sample is still small, so read it with care.',
    fin: [
      ['Finish model', `${fin.model_hits} of ${fin.n} right`],
      ['“Always a finish” rule', 'on the same fights'],
      ['UFC average', `finishes across ${tr.ufc_finish_rate_24m.n} fights over two years`],
    ],
    finNote: `Both bars are measured on the same sample — ${fin.n} fights, ${range}. The UFC average is there for scale.`
      + (heavy ? ' This sample happened to be finish-heavy, so the rule had it especially easy here.' : ''),
    s6: 'Liability and project status',
    liability: [
      ['This is a research project.', `The model is trained on public fight statistics and its forecasts are checked on fights ${range}: ${tr.n_fights} fights across ${events(tr.n_events)}. The sample is small and the conclusions are provisional.`],
      ['The service is analytical and informational.', 'We take no bets, sell no picks and give no advice on what to do with these numbers.'],
      ['Decisions are the reader’s own.', 'The project accepts no responsibility for financial losses arising from the use of this data.'],
      ['Past accuracy does not guarantee future accuracy.', 'Both models get things wrong, and every miss is shown on this page.'],
      ['The project is independent.', 'It is not affiliated with UFC and does not represent it; event and fighter names are used to refer to the events themselves.'],
    ],
    s5: 'Method',
    method: [
      ['Only what was recorded before the fight.', 'Forecasts come from the run log; nothing is recalculated after the fact.'],
      ['Three models, one average.', 'CatBoost, LightGBM and XGBoost are trained on official fight statistics; the card shows their average.'],
      ['The market benchmark is only a reference point.', 'The market view is here to show whether the model is useful at all, and is used nowhere else on the site.'],
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
  <div className={cx('surface rounded-xl border border-line bg-card p-5 md:p-7', className)}>{children}</div>
)

// ── 1. model vs baselines ──────────────────────────────────────────────────────

interface CI { lo: number; hi: number; label: string }
/**
 * Three bars a reader has to tell apart do not fit inside one ramp of grey. Measured on
 * the panel: brand 5.24:1, neutral 4.83:1, quietest 3.28:1 — each clears WCAG 1.4.11
 * against the card, but from each other they are 1.08:1 and 1.48:1 in the light theme,
 * and a light ground cannot hold a third step (the neutral has to stay dark on white).
 * So the quietest bar stops being a fill and becomes an outline: told apart by shape,
 * which needs no luminance budget at all.
 */
type BarTone = 'win' | 'base' | 'quiet'
type BarRow = [label: string, rate: number, sub: string, tone: BarTone, ci: CI | null, own?: boolean]

function Bars({ rows, note }: { rows: BarRow[]; note?: string }) {
  // the interval gets its own lane under the bar rather than lying across it: over a
  // pale bar a white whisker sat at 2.4:1, and outlining it turned the overlap into a
  // box. On the panel alone one colour reads in both themes.
  const whisker = 'absolute bg-zinc-300'
  // an inset shadow, not a border: the bar's width is a percentage of the track and a
  // border would eat into the value it is drawing
  const paint = (t: BarTone) => t === 'quiet'
    ? { background: 'transparent', boxShadow: `inset 0 0 0 1.5px ${FILL}` }
    : { background: t === 'win' ? BRAND : FILL }
  return (
    <div>
      {rows.map(([label, r, sub, tone, ci, own], i) => (
        <div key={label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-2.5 md:min-h-11 md:grid-cols-[150px_minmax(0,1fr)_180px]">
          <span className={cx('flex items-center gap-2 text-[13px]', own ? 'font-semibold text-zinc-50' : 'text-zinc-300')}>
            {/* our own row is marked by weight and a rule in the text colour — brand green is
                reserved for "this bar won the comparison", and one hue cannot mean both */}
            {own && <span className="h-4 w-[3px] shrink-0 rounded-sm bg-zinc-50" aria-hidden />}
            {label}
          </span>
          <div className="relative col-span-2 row-start-2 h-5 md:col-span-1 md:row-start-auto">
            <div className="a-grow absolute left-0 top-0 h-3 rounded-r" style={{ width: `${r * 100}%`, ...paint(tone), animationDelay: `${0.1 + i * 0.08}s` }} />
            {ci && (
              <div title={ci.label} aria-label={ci.label} role="img" className="absolute bottom-0 h-2" style={{ left: `${ci.lo * 100}%`, width: `${(ci.hi - ci.lo) * 100}%` }}>
                <div className={cx(whisker, 'inset-x-0 top-1/2 -mt-px h-0.5')} />
                <div className={cx(whisker, 'left-0 top-0 h-2 w-0.5')} />
                <div className={cx(whisker, 'right-0 top-0 h-2 w-0.5')} />
              </div>
            )}
          </div>
          {/* value over its own caption: a long caption wraps inside the panel instead of running past its edge */}
          <div className="flex flex-col items-end text-right">
            <CountUp value={r * 100} delay={i * 80} format={v => `${Math.round(v)}%`} className="text-[15px] font-semibold text-zinc-50" />
            <span className="text-[11px] leading-snug text-zinc-500">{sub}</span>
          </div>
        </div>
      ))}
      <div className="mt-1.5 grid grid-cols-1 gap-4 md:grid-cols-[150px_minmax(0,1fr)_180px]" aria-hidden>
        <span className="hidden md:block" />
        <div className="relative mx-2 h-3.5 md:mx-0">
          {[0, 25, 50, 75, 100].map(v => (
            <span key={v} className="tnum absolute -translate-x-1/2 font-mono text-[11px] text-zinc-500" style={{ left: `${v}%` }}>{v}%</span>
          ))}
        </div>
      </div>
      {note && <p className="mb-0 mt-4 text-xs leading-normal text-zinc-500">{note}</p>}
    </div>
  )
}

const asCI = (r: [number, number], label: Copy['ciLabel']): CI =>
  ({ lo: r[0], hi: r[1], label: label(Math.round(r[0] * 100), Math.round(r[1] * 100)) })

function CompareBars({ tr, c }: { tr: Track; c: Copy }) {
  // both rows are estimates off the same fights, so both show their interval; seeing
  // the two whiskers overlap is the argument the copy makes in words
  const favCi = wilson(tr.favourite.hits, tr.n_fights)
  return (
    <Bars note={c.ciNote} rows={[
      [c.rows[0], tr.model.rate, c.of(tr.model.hits, tr.n_fights), tr.model.rate >= tr.favourite.rate ? 'win' : 'base',
        asCI(tr.model.ci95, c.ciLabel), true],
      [c.rows[1], tr.favourite.rate, c.of(tr.favourite.hits, tr.n_fights), tr.favourite.rate > tr.model.rate ? 'win' : 'base',
        asCI(favCi, c.ciLabel)],
      [c.rows[2], tr.coin.rate, c.avg, 'quiet', null],
    ]} />
  )
}

function FinishBars({ tr, c }: { tr: Track; c: Copy }) {
  const fin = tr.finish
  const base = tr.ufc_finish_rate_24m.rate
  const rows: BarRow[] = [
    [c.fin[0][0], fin.model_rate!, c.fin[0][1], fin.model_rate! >= fin.always_finish_rate! ? 'win' : 'base',
      asCI(wilson(fin.model_hits, fin.n), c.ciLabel), true],
    [c.fin[1][0], fin.always_finish_rate!, c.fin[1][1], fin.always_finish_rate! > fin.model_rate! ? 'win' : 'base',
      asCI(wilson(Math.round(fin.always_finish_rate! * fin.n), fin.n), c.ciLabel)],
  ]
  if (base !== null) rows.push([c.fin[2][0], base, c.fin[2][1], 'quiet', null])
  return (
    <>
      <Bars rows={rows} />
      <p className="mb-0 mt-4 text-xs leading-normal text-zinc-500">{c.finNote}</p>
    </>
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
  // Both axes carry the same quantity — a probability — so they must share one scale.
  // They did not: x spanned 0.25 across 394 px and y spanned 0.70 across 266 px, so a
  // point of probability was 4.15× wider than it was tall and the "perfect calibration"
  // line stood at 13.6° instead of 45°. Distance from that line is the whole message of
  // the chart, and it was being read off a distorted frame.
  // x starts at 50%: the value plotted is the model's confidence in the fighter it
  // picked, which cannot fall below a coin flip. It ends at 100% — the empty right-hand
  // side is itself a finding, the model never claims more than 69%.
  // y starts at 20%: the lowest bound of any interval here is 25.4%, and this page
  // exists to show intervals whole.
  const { x0, x1, y0, y1 } = CAL
  const W = Math.min(Math.max(width, 260), 384)
  const narrow = W < 330
  // 52 px of left margin is not decoration: a "100%" tick ends 10 px short of the plot
  // and the rotated axis title occupies x 4..18, so anything under 54 puts the two on
  // top of each other at the vertical middle of the axis. Measured, not guessed.
  const L = 56, R = 14, T = 18, B = 46
  const Wp = Math.floor((W - L - R) / 5) * 5
  const Hp = (Wp * (y1 - y0)) / (x1 - x0)   // equal px per point of probability → 45°
  const [SW, H] = [L + Wp + R, T + Hp + B]
  const X = (v: number) => L + ((Math.min(Math.max(v, x0), x1) - x0) / (x1 - x0)) * Wp
  const Y = (v: number) => T + (1 - (v - y0) / (y1 - y0)) * Hp
  const mono = { fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }
  const sans = { fontFamily: 'Inter, sans-serif' }
  // a label inside the plot sits over gridlines and over a neighbour's interval — at
  // 390 px the groups are 20 px apart and the lines ran straight through the digits.
  // The halo knocks the line out around the glyphs instead of moving the label away.
  const halo = { stroke: 'var(--c-card)', strokeWidth: 3, strokeLinejoin: 'round' as const, paintOrder: 'stroke' as const }
  // the grid keeps its step at every width so the box stays closed on all four sides;
  // only the labels thin out when there is no room for them
  const gx = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0], gy = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
  const shown = (v: number, from: number) => !narrow || Math.round((v - from) * 100) % 20 === 0
  const hb = hover !== null ? bins[hover] : null
  // area carries n, so the radius goes as its square root — four equal dots said the
  // four groups weighed the same, and 32 fights do not weigh what 12 do. The floor of 4
  // keeps a one-fight group visible; below it the dot would stop reading as a dot.
  const nMax = Math.max(...bins.map(b => b.n))
  const radius = (n: number) => Math.max(4, 9 * Math.sqrt(n / nMax))
  const tip = (v: number) => (X(v) + 14 + 240 > SW ? Math.max(X(v) - 254, 0) : X(v) + 14)

  return (
    <div ref={ref} className="relative w-full">
      {width > 0 && (
        <svg width={SW} height={H} viewBox={`0 0 ${SW} ${H}`} className="mx-auto block max-w-full" role="img" aria-label={c.s2}>
          {gy.map(v => (
            <g key={`y${v}`}>
              <line x1={L} x2={L + Wp} y1={Y(v)} y2={Y(v)} stroke="var(--c-grid)" />
              {shown(v, y0) && <text x={L - 10} y={Y(v) + 4} textAnchor="end" fill={Z500} style={mono}>{Math.round(v * 100)}%</text>}
            </g>
          ))}
          {gx.map(v => (
            <g key={`x${v}`}>
              <line x1={X(v)} x2={X(v)} y1={T} y2={T + Hp} stroke="var(--c-grid)" />
              {shown(v, x0) && <text x={X(v)} y={T + Hp + 20} textAnchor="middle" fill={Z500} style={mono}>{Math.round(v * 100)}%</text>}
            </g>
          ))}
          {/* the reference line now runs corner to corner at a true 45° */}
          <line className="draw" x1={X(0.5)} y1={Y(0.5)} x2={X(1)} y2={Y(1)} stroke={Z500} strokeWidth="1.5"
            style={{ '--len': Math.hypot(Wp, Wp) + 2 } as React.CSSProperties} />
          <g transform={`translate(${X(0.86)} ${Y(0.86)}) rotate(-45)`}>
            {c.diag.map((s, i) => (
              <text key={s} y={-16 + i * 12} textAnchor="middle" fill={Z500} style={{ ...sans, ...halo, fontSize: 11 }}>{s}</text>
            ))}
          </g>
          {/* the two halves of the frame have names: above the line the model is more
              right than it claims, below it less. Labelling them turns the space the
              model never reaches into a reading of the chart. */}
          {!narrow && (
            <>
              <text x={X(0.8)} y={Y(0.95)} textAnchor="middle" fill={Z500} style={{ ...sans, ...halo, fontSize: 11 }}>{c.zone[0]}</text>
              <text x={X(0.855)} y={Y(0.37)} textAnchor="middle" fill={Z500} style={{ ...sans, ...halo, fontSize: 11 }}>{c.zone[1]}</text>
            </>
          )}
          {bins.map((b, i) => {
            const cx_ = X(b.avg_conf), cy = Y(b.hit_rate)
            const [cutLo, cutHi] = [b.ci95[0] < y0, b.ci95[1] > y1]
            const [yLo, yHi] = [Y(Math.max(b.ci95[0], y0)), Y(Math.min(b.ci95[1], y1))]
            const ink = hover === i ? Z400 : Z600
            const r = radius(b.n)
            return (
              <g key={b.label} tabIndex={0} role="img" aria-label={c.binTip(b)} className="cursor-default outline-none"
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)} onBlur={() => setHover(null)}>
                <line className="draw" x1={cx_} x2={cx_} y1={yHi + (cutHi ? 6 : 0)} y2={yLo - (cutLo ? 6 : 0)}
                  style={{ '--len': Math.abs(yLo - yHi) + 2, '--d': `${500 + i * 120}ms` } as React.CSSProperties}
                  stroke={ink} strokeWidth="2" strokeLinecap="round" />
                {/* the page is about uncertainty; an interval leaving the frame says so
                    with an arrow instead of stopping as if it had ended there. While the
                    ceiling is 100% only the lower arrow can fire — a share cannot exceed
                    one — but the upper one keeps the rule true if the domain ever moves. */}
                {cutLo && <path d={`M${cx_ - 4} ${yLo - 7}L${cx_} ${yLo}L${cx_ + 4} ${yLo - 7}`} fill="none"
                  stroke={ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
                {cutHi && <path d={`M${cx_ - 4} ${yHi + 7}L${cx_} ${yHi}L${cx_ + 4} ${yHi + 7}`} fill="none"
                  stroke={ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
                <circle cx={cx_} cy={cy} r={Math.max(16, r + 8)} fill="transparent" />
                <circle className="pop" cx={cx_} cy={cy} r={hover === i ? r + 1.5 : r} fill={BRAND} stroke={CARD} strokeWidth="2"
                  style={{ transformOrigin: 'center', transformBox: 'fill-box', transition: 'r .2s ease', '--d': `${700 + i * 120}ms` } as React.CSSProperties} />
                <text x={cx_ + r + 6} y={cy + 4} fill={Z300} style={{ ...mono, ...halo }}>{b.hits}/{b.n}</text>
              </g>
            )
          })}
          <text x={L + Wp / 2} y={H - 6} textAnchor="middle" fill={Z400} style={{ ...sans, fontSize: 12 }}>{c.xAxis}</text>
          <text transform={`translate(11 ${T + Hp / 2}) rotate(-90)`} textAnchor="middle" fill={Z400} style={{ ...sans, fontSize: 12 }}>{c.yAxis}</text>
        </svg>
      )}
      {hb && (
        <div className="pointer-events-none absolute z-10 max-w-[240px] rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs leading-snug text-zinc-300 shadow-xl"
          style={{ left: tip(hb.avg_conf), top: Math.max(Y(hb.hit_rate) - 58, 0) }}>
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
  const dot = (hit: boolean, k: number, animate = true) => (
    <span key={k} className={cx('h-3 w-3 rounded-full', animate && 'pop')}
      style={{ ...(hit ? { background: BRAND } : { boxShadow: `inset 0 0 0 2px ${FILL_DIM}` }), '--d': `${150 + k * 45}ms` } as unknown as React.CSSProperties} />
  )
  return (
    <>
      <ul>
        {[...tr.events].reverse().map((e, j) => (
          <Reveal as="li" key={e.name} delay={Math.min(j, 8) * 50} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-zinc-900 py-3 md:h-11 md:grid-cols-[minmax(0,1fr)_64px_200px_64px] md:gap-4 md:py-0">
            <span className="text-[13px] text-zinc-300 md:truncate">{e.name}</span>
            <span className="font-mono text-xs text-zinc-500 md:order-none">{formatDate(e.date, loc, { day: '2-digit', month: '2-digit' })}</span>
            <div className="flex flex-wrap gap-[5px]" role="img" aria-label={`${c.of(e.hit, e.n)}`}>
              {Array.from({ length: e.n }, (_, k) => dot(k < e.hit, k))}
            </div>
            <span className="text-right font-mono text-[13px] text-zinc-50">{c.of(e.hit, e.n)}</span>
          </Reveal>
        ))}
      </ul>
      <div className="mt-3.5 flex gap-[18px] text-xs text-zinc-400">
        <span className="inline-flex items-center gap-[7px]">{dot(true, 0, false)}{c.hit}</span>
        <span className="inline-flex items-center gap-[7px]">{dot(false, 1, false)}{c.miss}</span>
      </div>
    </>
  )
}

// ── page ───────────────────────────────────────────────────────────────────────

export default function Accuracy() {
  const { lang, t } = useI18n()
  const data = useData()
  const wide = useMedia('(min-width: 1024px)')
  const tr = data.status === 'ok' ? data.data.track : null
  const c = tr && tr.n_fights > 0 ? copy(lang, tr) : null
  useEffect(() => { document.title = c?.title ?? 'fightev' }, [c?.title])

  if (data.status === 'loading') {
    return <div className="mx-auto max-w-[1024px] px-4 py-14 md:px-6" aria-busy="true"><div className="sk h-11 w-2/3 rounded-md" /><div className="sk mt-10 h-48 rounded-xl" /></div>
  }
  // the same message and the same way out as the home page: a bare line of text gave
  // nothing to press, and this page fails on exactly the same file
  if (data.status === 'error') {
    return (
      <Message title={t.errorTitle} text={t.errorText}>
        <button type="button" onClick={data.retry}
          className="btn btn-brand mt-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-bold text-onbrand hover:bg-brand-hover">{t.retry}</button>
      </Message>
    )
  }
  if (!tr || !c) {
    return <div className="mx-auto max-w-[1024px] px-4 py-14 text-sm text-zinc-400 md:px-6">
      {lang === 'ru' ? 'Прогнозов со сверенным результатом пока нет.' : 'No forecasts with a checked result yet.'}
    </div>
  }
  const fin = tr.finish
  return (
    <div className="mx-auto max-w-[1024px] px-4 pb-[90px] pt-10 md:px-6 md:pt-[52px]">
      <div className="eyebrow hero-in mb-3.5 text-brand">{c.eyebrow}</div>
      <h1 className="m-0 text-[32px] font-bold leading-[1.08] tracking-[-0.025em] md:text-[44px]"><SplitWords text={c.h1} delay={80} /></h1>
      <p className="hero-in mb-0 mt-4 max-w-[640px] text-[15px] leading-relaxed text-zinc-400" style={{ '--d': '300ms' } as React.CSSProperties}>{c.lead}</p>

      <Reveal as="section" className="mt-12"><H2 sub={c.s1sub}>{c.s1}</H2><Panel><CompareBars tr={tr} c={c} /></Panel></Reveal>

      <Reveal as="section" className="mt-[52px]">
        <H2 sub={c.s2sub}>{c.s2}</H2>
        <Panel>
          <div className={cx('grid items-center gap-9', wide ? 'grid-cols-[384px_minmax(0,1fr)]' : 'grid-cols-1')}>
            <CalibrationChart bins={tr.calibration} c={c} />
            <div className="max-w-[460px]">
              <CalibrationTable bins={tr.calibration} c={c} />
              <p className="mb-0 mt-3.5 text-xs leading-normal text-zinc-500">{c.calNote}</p>
            </div>
          </div>
        </Panel>
      </Reveal>

      <Reveal as="section" className="mt-[52px]">
        <H2 sub={c.s3sub}>{c.s3}</H2>
        <Panel className="!pt-2 md:!pt-3"><EventDots tr={tr} c={c} lang={lang} /></Panel>
      </Reveal>

      {fin.n > 0 && fin.model_rate !== null && fin.always_finish_rate !== null && (
        <Reveal as="section" className="mt-[52px]">
          <H2 sub={c.s4sub}>{c.s4}</H2>
          <Panel><FinishBars tr={tr} c={c} /></Panel>
        </Reveal>
      )}

      {/* the method and the liability are the same kind of block — a two-column list of
          statements closing the page — and every other section here stands on a panel.
          Only this one did not, so the two read as different kinds of thing. */}
      <Reveal as="section" className="mt-[52px]">
        <H2>{c.s5}</H2>
        <Panel>
          <div className="grid grid-cols-1 gap-x-10 gap-y-3.5 text-[13px] leading-relaxed text-zinc-400 md:grid-cols-2">
            {c.method.map(([b, rest]) => <p key={b} className="m-0"><b className="font-semibold text-zinc-300">{b}</b> {rest}</p>)}
          </div>
        </Panel>
      </Reveal>

      <Reveal as="section" className="mt-[52px]">
        <H2>{c.s6}</H2>
        <Panel>
          <div className="grid grid-cols-1 gap-x-10 gap-y-3.5 text-[13px] leading-relaxed text-zinc-400 md:grid-cols-2">
            {c.liability.map(([b, rest]) => <p key={b} className="m-0"><b className="font-semibold text-zinc-300">{b}</b> {rest}</p>)}
          </div>
        </Panel>
      </Reveal>
    </div>
  )
}
