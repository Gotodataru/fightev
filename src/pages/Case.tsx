import { useEffect, useRef, type ReactNode } from 'react'
import { useData } from '../data'
import { CountUp, ReadingProgress, Reveal, SplitWords } from '../lib/motion'
import { useI18n } from '../i18n'
import { useTheme } from '../theme'

const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`

/**
 * A frame the reader can open at full size. The shots are taken at 1600 px and shown in a
 * 430 px column, where the text on them is about four pixels tall — evidence nobody could
 * read. A native dialog gives Esc, focus return and a backdrop for free.
 */
function Zoom({ src, alt, children }: { src: string; alt: string; children: ReactNode }) {
  const { lang } = useI18n()
  const ref = useRef<HTMLDialogElement>(null)
  const ru = lang === 'ru'
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()}
        aria-label={`${ru ? 'Открыть крупно' : 'View full size'}: ${alt}`}
        className="group relative block w-full cursor-zoom-in rounded-xl p-0 text-left">
        {children}
        <span aria-hidden className="pointer-events-none absolute bottom-2.5 right-2.5 rounded-md bg-black/70 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
          {ru ? 'Крупно' : 'Enlarge'}
        </span>
      </button>
      <dialog ref={ref} onClick={e => { if (e.target === ref.current) ref.current?.close() }}
        className="m-auto max-h-[92vh] w-[min(1280px,94vw)] overflow-auto rounded-xl border border-line bg-card p-0 text-zinc-50 backdrop:bg-black/80">
        <div className="sticky top-0 z-10 flex justify-end bg-card p-2">
          <button type="button" onClick={() => ref.current?.close()}
            className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300">{ru ? 'Закрыть' : 'Close'}</button>
        </div>
        <img src={src} alt={alt} loading="lazy" className="block h-auto w-full" />
      </dialog>
    </>
  )
}

/** A screenshot that scrolls itself inside a window frame — the page as a visitor sees it. */
function Demo({ src, alt, tag, caption, note, height, dur, delay = 0 }: {
  src: string; alt: string; tag: string; caption: string; note?: string; height: number; dur: number; delay?: number
}) {
  return (
    <Reveal delay={delay} className="flex flex-col gap-2.5">
      <figure className="m-0 flex flex-col gap-2.5">
        <Zoom src={src} alt={alt}>
          <div className="surface overflow-hidden rounded-xl border border-line bg-card">
            <div className="demo-win" style={{ height, '--win': `${height}px`, '--dur': `${dur}s` } as React.CSSProperties}>
              <img src={src} alt="" loading="lazy" decoding="async" />
            </div>
          </div>
        </Zoom>
        <figcaption className="text-[13px] leading-normal text-zinc-400">
          <span className="mr-2 font-semibold text-zinc-300">{tag}</span>{caption}
          {note && <span className="mt-1 block text-xs text-zinc-500">{note}</span>}
        </figcaption>
      </figure>
    </Reveal>
  )
}

/** The fight card opening and closing on a loop: the interaction the redesign is built around. */
function CardDemo({ closed, open, alt, caption }: { closed: string; open: string; alt: string; caption: string }) {
  return (
    <Reveal className="flex flex-col gap-2.5">
      <figure className="m-0 flex flex-col gap-2.5">
        <div className="demo-card rounded-xl" style={{ '--h0': '84px', '--h1': '420px' } as React.CSSProperties}>
          <img src={closed} alt={alt} loading="lazy" decoding="async" className="block w-full" />
          <img src={open} alt="" aria-hidden loading="lazy" decoding="async" className="open block w-full" />
        </div>
        <figcaption className="text-[13px] leading-normal text-zinc-400">{caption}</figcaption>
      </figure>
    </Reveal>
  )
}

/** One of the states, shown rather than claimed. */
function State({ src, alt, title, children, delay = 0 }: {
  src: string; alt: string; title: string; children: ReactNode; delay?: number
}) {
  return (
    <Reveal delay={delay} className="flex flex-col gap-3">
      <figure className="m-0 flex flex-col gap-3">
        <Zoom src={src} alt={alt}>
          <div className="surface aspect-[1600/860] overflow-hidden rounded-xl border border-line bg-card">
            <img src={src} alt="" loading="lazy" decoding="async" className="block h-full w-full object-cover" />
          </div>
        </Zoom>
        <figcaption>
          <h3 className="m-0 mb-1 text-[13px] font-semibold text-zinc-50">{title}</h3>
          <p className="m-0 text-[13px] leading-[1.55] text-zinc-400">{children}</p>
        </figcaption>
      </figure>
    </Reveal>
  )
}

/** A headline figure. Numbers count up; a ratio or a range stands still. */
function Stat({ value, label, sub, delay = 0 }: { value: number | string | null; label: string; sub: string; delay?: number }) {
  const big = 'text-4xl font-bold leading-none tracking-[-0.02em] text-zinc-50'
  return (
    <Reveal delay={delay} className="flex flex-col gap-1.5">
      {typeof value === 'number'
        ? <CountUp value={value} delay={delay} className={big} />
        : <span className={big}>{value ?? '—'}</span>}
      <span className="text-[13px] text-zinc-300">{label}</span>
      <span className="text-xs leading-normal text-zinc-500">{sub}</span>
    </Reveal>
  )
}

/**
 * A row of the document's spec sheet: the term in the left column, its answer on the
 * right, a hairline above.
 *
 * These used to be h2, the same level as "Key decisions" and "Seven states" — and were
 * set at 13 px against their 22 px, so one level spoke in two voices with no rule behind
 * the difference. They are not sections; they are terms, which is what the layout has
 * said all along. As a description list they keep their place in the outline without
 * competing with the headings that introduce a grid of their own.
 */
function Para({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Reveal className="relative grid grid-cols-1 gap-2 py-6 md:grid-cols-[200px_minmax(0,1fr)] md:gap-8 md:py-7">
      <span className="line-in absolute inset-x-0 top-0 h-px bg-zinc-800" aria-hidden />
      <dt className="m-0 text-[13px] font-semibold text-zinc-300">{title}</dt>
      <dd className="m-0 text-[15px] leading-[1.7] text-zinc-400">{children}</dd>
    </Reveal>
  )
}

/** dt and dd need a dl above them; a div between the two is allowed, and a div is what
 *  Reveal renders for each row. */
const Specs = ({ className, children }: { className?: string; children: ReactNode }) => (
  <dl className={`m-0 ${className ?? ''}`}>{children}</dl>
)

/** A decision and the option it beat. The rejected half is the one that shows the thinking. */
function Decision({ n, title, alt, children }: { n: number; title: string; alt: string; children: ReactNode }) {
  return (
    <Reveal delay={((n - 1) % 2) * 90} className="surface flex flex-col gap-2 rounded-xl border border-line bg-card p-[22px] transition-colors duration-300 hover:border-zinc-700">
      <span className="font-mono text-xs text-brand">{String(n).padStart(2, '0')}</span>
      <h3 className="m-0 text-base font-semibold text-zinc-50">{title}</h3>
      <p className="m-0 text-[13px] leading-relaxed text-zinc-400">{children}</p>
      <p className="mb-0 mt-auto border-t border-hair pt-2.5 text-xs leading-relaxed text-zinc-500">{alt}</p>
    </Reveal>
  )
}

const Bullets = ({ children }: { children: ReactNode }) => (
  <ul className="m-0 flex list-none flex-col gap-2.5 p-0">{children}</ul>
)

export default function Case() {
  const { lang } = useI18n()
  const { theme } = useTheme()
  const data = useData()
  const ru = lang === 'ru'
  useEffect(() => { document.title = ru ? 'fightev — О проекте' : 'fightev — About' }, [ru])

  const card = data.status === 'ok' ? data.data.card : null
  const track = data.status === 'ok' ? data.data.track : null
  const fighters = card ? card.fights.flatMap(f => [f.fighter_1, f.fighter_2]) : []
  const noStats = fighters.filter(f => !f.stats).length
  const n = track?.n_fights ?? 0
  const rate = track && n ? Math.round(track.model.rate * 100) : null
  const dash = '—'
  const trails = !!track && n > 0 && track.model.rate < track.favourite.rate
  // the most confident bin is the evidence behind the ceiling on the verdict word
  const top = track?.calibration.length ? track.calibration[track.calibration.length - 1] : null
  // the screenshots follow the reader's theme: dark shots on a light page read as holes
  const st = (k: string) => asset(`case/states/${k}${theme === 'light' ? '-light' : ''}.webp`)
  const suffix = ru ? '' : '_en'

  return (
    // The page sits in the header's 1024 px column while the reading measure stays 880.
    // Centred as an 880 px column of its own, the eyebrow and the H1 began 72 px to the
    // right of the logo above them — the only page on the site whose first line of
    // content did not start under the mark.
    <article className="mx-auto max-w-[1024px] px-4 pb-[90px] pt-10 md:px-6 md:pt-14">
      <ReadingProgress />
      <div className="max-w-[880px]">
      <div className="eyebrow hero-in mb-3.5 text-brand">{ru ? 'О проекте — кейс' : 'About — case study'}</div>
      <h1 className="m-0 text-[32px] font-bold leading-[1.1] tracking-[-0.025em] md:text-[44px]">
        <SplitWords
          text={ru ? 'Из витрины подписки — в бесплатный разбор турнира' : 'From a subscription storefront to a free read on the card'}
          delay={80} step={45} />
      </h1>
      <p className="hero-in mb-0 mt-[18px] max-w-[680px] text-base leading-[1.65] text-zinc-400" style={{ '--d': '420ms' } as React.CSSProperties}>
        {ru
          ? 'Проект стал бесплатным, и сайту стало нечего продавать. Новая работа: за несколько секунд показать расклад турнира — и не дать при этом переоценить прогноз.'
          : 'The project went free, so the site had nothing left to sell. The new job: show how the card looks in seconds — without letting anyone overrate the forecast.'}
      </p>

      <div className="hero-in mt-7 grid grid-cols-1 gap-x-8 gap-y-3 border-y border-hair py-5 text-[13px] sm:grid-cols-3" style={{ '--d': '520ms' } as React.CSSProperties}>
        {([
          [ru ? 'Роль' : 'Role', ru ? 'Один человек: продукт, дизайн, фронтенд, данные' : 'One person: product, design, front-end, data'],
          [ru ? 'Период' : 'When', ru ? 'Сентябрь 2026' : 'September 2026'],
          [ru ? 'Стек' : 'Stack', 'React, Tailwind, Python, SQLite'],
        ] as const).map(([k, v]) => (
          <div key={k} className="flex flex-col gap-1">
            <span className="eyebrow text-zinc-500">{k}</span>
            <span className="leading-snug text-zinc-200">{v}</span>
          </div>
        ))}
      </div>

      {/* figures about the design work — not about whichever event UFC scheduled this week */}
      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-7 md:grid-cols-4">
        <Stat value={top ? `${top.hits}/${top.n}` : null}
          label={ru ? `угадано при уверенности ${top?.label ?? '65%+'}` : `called right at ${top?.label ?? '65%+'} confidence`}
          sub={ru ? 'поэтому ярлык не сильнее «Перевеса»' : 'so no label goes past “Edge”'} />
        <Stat value={6} delay={80} label={ru ? 'состояний' : 'states'} sub={ru ? 'от загрузки до промаха модели' : 'from loading to a model miss'} />
        <Stat value="3:1" delay={160} label={ru ? 'минимум контраста' : 'minimum contrast'} sub={ru ? 'у любой полосы, замерено' : 'on every bar, measured'} />
        <Stat value="0" delay={240} label={ru ? 'горизонтальных прокруток' : 'sideways scrolls'} sub={ru ? 'на ширинах 360–1440 px' : 'across 360–1440 px'} />
      </div>

      {/* One beat for the whole document: every block below the opening cluster starts
          48 px after the one above it. The cluster keeps its crescendo — 18, 28, 40 —
          because it is the run-up into the page, not part of its rhythm. Before this the
          body ran 44, 44, 36, 48, 48, 48, with nothing behind the differences. */}
      <Specs className="mt-12">
        <Para title={ru ? 'Задача' : 'Problem'}>
          {ru
            ? 'Сайт был витриной платной подписки: график доходности, юниты прибыли, ссылки в Telegram. О самих боях — ничего. Когда подписку отменили, продавать стало нечего, и сайту понадобилась другая работа: показать кард турнира, дать раскрыть любой бой и показать, насколько этому прогнозу можно верить, — так, чтобы его не переоценили.'
            : 'The site was a storefront for a paid subscription: a profit chart, units won, Telegram links. Nothing about the fights. When the subscription went away there was nothing left to sell, and the site needed a different job: show the card, let anyone open a fight, and show how far the forecast can be trusted — without letting anyone overrate it.'}
        </Para>
        <Para title={ru ? 'Ограничения' : 'Constraints'}>
          <Bullets>
            <li>
              <b className="font-semibold text-zinc-300">{ru ? 'Данных не хватает.' : 'The data has holes.'}</b>{' '}
              {ru
                ? <>Сегодня у {noStats} из {fighters.length} бойцов карда нет подробной статистики. Интерфейс обязан это показывать, а не прятать.</>
                : <>Right now {noStats} of the {fighters.length} fighters on the card have no detailed stats. The interface has to show that, not hide it.</>}
            </li>
            <li>
              <b className="font-semibold text-zinc-300">{ru ? 'Модель ошибается.' : 'The model misses.'}</b>{' '}
              {ru
                ? <>Она угадывает {rate ?? dash}% победителей{trails ? ' и пока не обогнала рыночный ориентир' : ''}. Дизайн должен передавать неопределённость, а не сглаживать её.</>
                : <>It picks {rate ?? dash}% of winners{trails ? ' and has not beaten the market benchmark yet' : ''}. The design has to carry that uncertainty rather than smooth it over.</>}
            </li>
            <li>
              <b className="font-semibold text-zinc-300">{ru ? 'Ни бэкенда, ни бюджета на исследование.' : 'No back end, no research budget.'}</b>{' '}
              {ru
                ? 'Статический хостинг, данные приезжают файлом. Исследование — два коротких теста на пяти людях, без интервью.'
                : 'Static hosting, data arrives as a file. Research is two short tests with five people, no interviews.'}
            </li>
            <li>
              <b className="font-semibold text-zinc-300">{ru ? 'Страница обязана жить без человека.' : 'The page has to run unattended.'}</b>{' '}
              {ru
                ? 'Кард и счёт модели обновляются сами после каждого турнира. Любое состояние должно выглядеть осмысленно, когда на экран никто не смотрит, — отсюда шесть состояний ниже.'
                : 'The card and the model’s record refresh themselves after every event, so every state has to look deliberate with nobody watching — hence the six below.'}
            </li>
          </Bullets>
        </Para>
        <Para title={ru ? 'Для кого' : 'Audience'}>
          {ru
            ? 'Болельщик UFC, который перед турниром хочет быстро понять расклад: кто фаворит, за счёт чего и насколько уверенно. Интервью не было: гипотеза об аудитории проверена только на понимание — тестами ниже.'
            : 'A UFC fan who wants a quick read on the card before an event: who the favourite is, why, and how confidently. There were no interviews: the audience hypothesis was tested for comprehension only — see the tests below.'}
        </Para>
      </Specs>

      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Demo
          src={asset('case/demo_old.webp')}
          height={300} dur={26}
          tag={ru ? 'Было' : 'Before'}
          alt={ru ? 'Прежний сайт, прокрутка: заголовок «UFC Analytics. With proof.», счётчики прибыли, тарифы и кнопки оплаты'
                  : 'The old site scrolling: the “UFC Analytics. With proof.” headline, profit counters, pricing and pay buttons'}
          caption={ru ? 'Витрина подписки: юниты прибыли, ROI, тарифы. О самих боях — ничего.'
                      : 'A subscription storefront: profit in units, ROI, pricing. Nothing about the fights themselves.'}
          note={ru ? 'Фото бойца на прежнем сайте было сгенерировано ИИ, с копией пояса. Здесь оно размыто, в новой версии изображения нет.'
                   : 'The fighter image on the old site was AI-generated, with a replica belt. It is blurred here; the new version has none.'} />
        <Demo
          src={asset(`case/demo_new${suffix}.webp`)}
          height={300} dur={20} delay={90}
          tag={ru ? 'Стало' : 'After'}
          alt={ru ? 'Нынешний сайт, прокрутка: название турнира, показатели модели и кард турнира целиком'
                  : 'The current site scrolling: the event name, the model’s figures and the whole card'}
          caption={ru ? 'Турнир, счёт модели рядом с рыночным ориентиром и кард целиком — каждый бой со своим прогнозом.'
                      : 'The event, the model’s record beside the market benchmark, and the whole card — every fight with its own forecast.'} />
      </div>

      <section className="mt-12">
        <Reveal>
          <h2 className="m-0 mb-1.5 text-[22px] font-bold tracking-[-0.015em] text-zinc-50">
            {ru ? 'Главное действие — раскрыть бой' : 'The one action: open a fight'}
          </h2>
          <p className="mb-[18px] mt-0 max-w-[620px] text-[13px] leading-[1.55] text-zinc-400">
            {ru
              ? 'Строка боя показывает главное: кто фаворит и насколько. Клик разворачивает разбор — прогноз на победу и досрочку, затем сравнение бойцов и их стиль. Открыт всегда один бой.'
              : 'A row shows the essentials: who the favourite is and by how much. A click unfolds the breakdown — the win and finish forecasts first, then the tape and each fighter’s style. One fight is open at a time.'}
          </p>
        </Reveal>
        <CardDemo
          closed={asset(`case/demo_card_closed${suffix}.webp`)}
          open={asset(`case/demo_card_open${suffix}.webp`)}
          alt={ru ? 'Карточка боя: свёрнутая строка разворачивается в разбор с прогнозом и статистикой'
                  : 'A fight card: the collapsed row unfolds into a breakdown with the forecast and stats'}
          caption={ru ? 'Одна строка — один бой. Разбор появляется на месте, без перехода на отдельную страницу.'
                      : 'One row, one fight. The breakdown appears in place, with no separate page to visit.'} />
      </section>

      <section className="mt-12">
        <Reveal><h2 className="m-0 mb-[22px] text-[22px] font-bold tracking-[-0.015em] text-zinc-50">{ru ? 'Ключевые решения' : 'Key decisions'}</h2></Reveal>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Decision n={1} title={ru ? 'Зелёный — это преимущество' : 'Green means the edge'}
            alt={ru ? 'Сначала разводил зелёный и нейтральный только яркостью — в светлой теме это не сходится.'
                    : 'The first attempt separated green from neutral by brightness alone; on the light theme it doesn’t work.'}>
            {ru
              ? 'Цвет не привязан к стороне боя: подсвечен тот, у кого выше вероятность или лучше показатель, а в равном бою — никто. Одной яркости не хватило: на белом фоне нейтральная полоса обязана быть тёмной и по светлоте сходится с зелёным. Поэтому сегменты разводит зазор, а каждая полоса держит не меньше 3:1 к своему фону — замерено в обеих темах и на симуляции протанопии и дейтеранопии.'
              : 'Colour isn’t tied to a corner: whoever has the higher probability or the better number is highlighted, and an even fight highlights neither. Brightness alone wasn’t enough — on a white ground the neutral bar has to be dark, which puts it level with the green. So a gap separates the segments and every bar holds at least 3:1 against its surface, measured in both themes and under simulated protanopia and deuteranopia.'}
          </Decision>
          <Decision n={2} title={ru ? 'Клик вместо наведения' : 'Click, not hover'}
            alt={ru ? 'Отдельная страница боя отпала: переход теряет кард, и сравнить соседние бои становится дорого.'
                    : 'A separate fight page lost: the jump drops the card, and comparing neighbouring fights gets expensive.'}>
            {ru
              ? 'На телефоне наведения нет, а на десктопе блок раскрывался бы случайно. Открыт один бой, внутри — переключатель «Бой N из M», так что соседний бой в одном нажатии.'
              : 'Phones have no hover, and on desktop the panel would pop open by accident. One fight is open at a time, with a “Fight N of M” switcher inside, so the next one is a single tap away.'}
          </Decision>
          <Decision n={3} title={ru ? 'Ярлык не сильнее данных' : 'The label never outruns the data'}
            alt={ru ? 'Была четвёртая ступень — «Явный фаворит» от 68%. Первой она досталась новичку с двумя боями, а при уверенности 65%+ модель угадывала половину. Ступень убрана.'
                    : 'There was a fourth step, “Clear favourite” from 68%. It landed first on a newcomer with two bouts, while at 65%+ the model called half. The step is gone.'}>
            {ru
              ? 'Процент читается как обещание: 51% — как «победит», хотя это монетка. Поэтому у прогноза есть слово: до 54% «Равный бой» без подсветки сторон, дальше «Небольшой перевес» и «Перевес». Пороги сверены с калибровкой на странице точности: самые уверенные прогнозы там сбываются хуже всего, и слову сильнее «Перевеса» нечем опереться. Новичкам с одним-двумя боями — метка «мало данных» прямо в строке.'
              : 'A percentage reads as a promise: 51% reads as “wins”, when it is a coin flip. So every forecast gets a word: up to 54% “Even fight” with neither side lit, then “Slight edge” and “Edge”. The cut-offs were checked against the calibration on the accuracy page: the most confident calls come true least often there, so nothing backs a word stronger than “Edge”. Newcomers with one or two bouts get a “limited data” tag on the row itself.'}
          </Decision>
          <Decision n={4} title={ru ? 'Точность — отдельной страницей' : 'Accuracy gets its own page'}
            alt={ru ? 'В подвале главной её не откроет никто, а в карточке каждого боя она превращается в шум.'
                    : 'In the home page footer nobody opens it; inside every fight card it turns into noise.'}>
            {ru
              ? 'Калибровка, интервалы и промахи на виду. Каждая полоса несёт свой интервал, включая рыночный ориентир: видно, что они перекрываются и разрыв не доказан. Модель досрочки превосходства над простым правилом не показала — это видно на графике, и рядом с её прогнозом сказано прямо.'
              : 'Calibration, intervals and misses are in plain sight. Every bar carries its own interval, the market benchmark included, so you can see them overlap and the gap go unproven. The finish model showed no edge over a simple rule — the chart shows it, and the card says so next to its forecast.'}
          </Decision>
          <Decision n={5} title={ru ? 'Без ставок' : 'No betting'}
            alt={ru ? 'Коэффициенты были на прежнем сайте: они тянут ответственность за чужие деньги и возвращают аналитику в витрину.'
                    : 'The old site carried odds: they bring responsibility for other people’s money and turn analysis back into a storefront.'}>
            {ru
              ? 'Оценка рынка осталась только точкой отсчёта на странице точности. В карточках — модель и статистика бойцов, и ни одной кнопки, ведущей к ставке.'
              : 'The market view stays a reference point on the accuracy page. The cards show the model and the fighters’ stats, and not one button leads to a bet.'}
          </Decision>
          <Decision n={6} title={ru ? 'Прогноз раскрывается первым' : 'The forecast opens first'}
            alt={ru ? 'Сначала первым шло сравнение: строка ведь уже показала проценты. Но при раскрытии строка сворачивается в шапку, и прогноз пропадал с экрана ровно тогда, когда о нём спросили.'
                    : 'The tape used to come first, since the row had already shown the percentages. But opening a fight folds the row into a header, so the forecast left the screen at the very moment it was asked for.'}>
            {ru
              ? 'Порядок в разборе один на всех ширинах: прогноз на победу и досрочку, затем сравнение, затем стиль. На телефоне это вкладки, и открывается «Прогноз». Именные плашки на телефоне убраны: без фото они повторяли фамилии из шапки и отнимали около 170 px до первой цифры.'
              : 'The breakdown reads in one order at every width: the win and finish forecasts, then the tape, then style. On a phone these are tabs, and “Forecast” opens. The nameplates are gone on phones: without photos they repeated the surnames in the header and cost about 170 px before the first number.'}
          </Decision>
        </div>
      </section>

      <section className="mt-12">
        <Reveal>
          <h2 className="m-0 mb-1.5 text-[22px] font-bold tracking-[-0.015em] text-zinc-50">{ru ? 'Шесть состояний' : 'Six states'}</h2>
          <p className="mb-[22px] mt-0 max-w-[620px] text-[13px] leading-[1.55] text-zinc-400">
            {ru
              ? 'Данные приходят сами и бывают неполными, а посмотреть на экран в этот момент некому. Поэтому каждое состояние нарисовано заранее — вот все шесть.'
              : 'The data arrives on its own and comes in incomplete, with nobody watching the screen when it does. So every state was drawn up front — here are all six.'}
          </p>
        </Reveal>
        <div className="grid grid-cols-1 gap-x-5 gap-y-8 md:grid-cols-2">
          <State src={st('01-loading')} title={ru ? 'Загрузка' : 'Loading'}
            alt={ru ? 'Скелет списка боёв на месте будущих карточек' : 'A skeleton of the fight list standing in for the cards'}>
            {ru ? 'Скелет повторяет будущую сетку, поэтому список не прыгает, когда данные приезжают.'
                : 'The skeleton matches the grid that follows, so nothing jumps when the data lands.'}
          </State>
          <State src={st('02-error')} delay={80} title={ru ? 'Данные не пришли' : 'The data failed'}
            alt={ru ? 'Сообщение «Не удалось загрузить данные» и кнопка «Обновить»' : 'A “couldn’t load the data” message with a retry button'}>
            {ru ? 'Говорим, что случилось, и даём кнопку — вместо пустого экрана или бесконечного скелета.'
                : 'Say what happened and offer a button — rather than an empty screen or a skeleton that never ends.'}
          </State>
          <State src={st('03-empty')} title={ru ? 'Турнир не объявлен' : 'No event announced'}
            alt={ru ? 'Сообщение о том, что кард появится позже, со ссылкой на прошлый турнир' : 'A message that the card will appear later, linking to the last event'}>
            {ru ? 'Между турнирами карда просто нет. Вместо пустоты — итоги прошлого турнира в одном нажатии.'
                : 'Between events there is no card. Instead of a void, the last event’s results are one tap away.'}
          </State>
          <State src={st('05-no-stats')} delay={80} title={ru ? 'Нет статистики' : 'No stats'}
            alt={ru ? 'Блок сравнения заменён пояснением, что подробной статистики нет' : 'The comparison module replaced by a note that detailed stats are missing'}>
            {ru ? 'Обычно это новички. Говорим об этом прямо и сразу предупреждаем, что прогноз менее надёжен.'
                : 'Usually newcomers. The panel says so outright, and warns in the same breath that the forecast is weaker.'}
          </State>
          <State src={st('06-low-data')} title={ru ? 'Мало данных' : 'Limited data'}
            alt={ru ? 'Строка боя с меткой «мало данных» рядом с вердиктом' : 'A fight row with a “limited data” tag beside the verdict'}>
            {ru ? 'Один-два боя в UFC — метка стоит в самой строке, до того как читатель поверит проценту.'
                : 'One or two UFC bouts put a tag on the row itself, before anyone takes the percentage at face value.'}
          </State>
          <State src={st('07-result')} delay={80} title={ru ? 'Бой прошёл' : 'The fight happened'}
            alt={ru ? 'Две строки прошедших боёв: одна с отметкой «Модель угадала», другая — «Модель ошиблась»' : 'Two finished rows: one marked “the model was right”, the other “the model was wrong”'}>
            {ru ? 'Прогноз остаётся на месте и получает отметку: угадал или ошибся. Промахи не убираются.'
                : 'The forecast stays where it was and gets a verdict: right or wrong. Misses are not quietly removed.'}
          </State>
        </div>
      </section>

      <Specs className="mt-12">
        <Para title={ru ? 'Что проверено' : 'What was tested'}>
          <Bullets>
            <li>
              <b className="font-semibold text-zinc-300">{ru ? 'Понятно ли, что это за сайт.' : 'Is it clear what the site is?'}</b>{' '}
              {ru
                ? 'Пять человек, минимум двое с телефона, вопрос «что это за сайт?». Порог записан до прогона: «бои» и «прогноз» должны прозвучать минимум у 4 из 5. Порог взят. На случай провала заранее было решено переписать строку в hero — не понадобилось.'
                : 'Five people, at least two on a phone, asked “what is this site?”. The bar was set before the run: “fights” and “forecast” named by at least 4 of 5. It was met. The fix planned in case of failure — rewriting the hero line — was not needed.'}
            </li>
            <li>
              <b className="font-semibold text-zinc-300">{ru ? 'Найдут ли, где проверить прогноз.' : 'Can people find where to check a forecast?'}</b>{' '}
              {ru
                ? 'Задание без слов с кнопок: «найдите, где понять, насколько прогнозам стоит верить». Порог: первый клик в «Как модель отработала» или «Точность модели» минимум у 4 из 5. Порог взят.'
                : 'A task worded without the labels on the buttons: “find where to tell how far these forecasts can be trusted”. The bar: a first click on “How the model performed” or “Model accuracy” for at least 4 of 5. It was met.'}
            </li>
            <li>
              <b className="font-semibold text-zinc-300">{ru ? 'Отклонения от протокола.' : 'Where the run left the protocol.'}</b>{' '}
              {ru
                ? 'Первый тест шёл на живом сайте, а не на кадре, показанном ровно 5 секунд, — он мягче задуманного. Одна участница не смотрит UFC и сайт не поняла: по критериям отбора её не стоило звать, но ответ засчитан как есть.'
                : 'The first test ran on the live site rather than a frame shown for exactly five seconds, so it was softer than designed. One participant does not follow UFC and did not understand the site: by the recruiting criteria she should not have been asked, but her answer counts as given.'}
            </li>
            <li>
              <b className="font-semibold text-zinc-300">{ru ? 'Чего пять человек не покажут.' : 'What five people cannot show.'}</b>{' '}
              {ru
                ? 'Вернётся ли человек к следующему турниру и верит ли цифрам, когда модель ошиблась у него на глазах.'
                : 'Whether anyone comes back for the next event, or still trusts the numbers after watching the model miss.'}
            </li>
          </Bullets>
        </Para>
        <Para title={ru ? 'Что изменилось' : 'What changed'}>
          <Bullets>
            <li>{ru
              ? 'Кард открыт целиком: каждый бой с разбором вместо трёх экранов продажи подписки.'
              : 'The whole card is open: every fight with a breakdown, in place of three screens selling a subscription.'}</li>
            <li>{ru
              ? 'Точность публикуется как есть — вместе с рыночным ориентиром, который на этой выборке впереди.'
              : 'Accuracy is published as it stands — next to the market benchmark, which is ahead on this sample.'}</li>
            <li>{ru
              ? 'Страница живёт без меня: кард и счёт модели обновляются после каждого турнира, и все шесть состояний нарисованы заранее.'
              : 'The page runs without me: the card and the model’s record refresh after every event, and all six states were drawn in advance.'}</li>
            <li>{ru
              ? 'Чего нет: интервью и данных о повторных визитах. Проверено только понимание и путь к точности.'
              : 'What’s missing: interviews and any data on return visits. Only comprehension and the path to accuracy were tested.'}</li>
          </Bullets>
        </Para>
        <Para title={ru ? 'Что дальше' : 'Next'}>
          {ru
            ? 'Повторить первый тест строго по протоколу — кадр на 5 секунд и участники из целевой аудитории. Проверить то, чего короткие тесты не покажут: возвращаются ли к сайту после турнира. Калибровка модели, чтобы уверенные проценты значили то, что обещают.'
            : 'Rerun the first test by the protocol — a five-second frame and participants from the target audience. Test what short tests cannot: whether people come back after an event. Calibrating the model so confident percentages mean what they promise.'}
        </Para>
      </Specs>
      </div>
    </article>
  )
}
