import { useEffect, type ReactNode } from 'react'
import { useData } from '../data'
import { CountUp, ReadingProgress, Reveal, SplitWords } from '../lib/motion'
import { useI18n } from '../i18n'

/** A screenshot that scrolls itself inside a window frame — the page as a visitor sees it. */
function Demo({ src, alt, tag, caption, height, dur, delay = 0 }: {
  src: string; alt: string; tag: string; caption: string; height: number; dur: number; delay?: number
}) {
  return (
    <Reveal delay={delay} className="flex flex-col gap-2.5">
      <figure className="m-0 flex flex-col gap-2.5">
        <div className="surface overflow-hidden rounded-xl border border-line bg-card">
          <div className="demo-win" style={{ height, '--win': `${height}px`, '--dur': `${dur}s` } as React.CSSProperties}>
            <img src={src} alt={alt} loading="lazy" decoding="async" />
          </div>
        </div>
        <figcaption className="text-[13px] leading-normal text-zinc-400">
          <span className="mr-2 font-semibold text-zinc-300">{tag}</span>{caption}
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

function Stat({ value, label, sub, delay = 0 }: { value: number | null; label: string; sub: string; delay?: number }) {
  return (
    <Reveal delay={delay} className="flex flex-col gap-1.5">
      {value
        ? <CountUp value={value} delay={delay} className="text-4xl font-bold leading-none tracking-[-0.02em] text-zinc-50" />
        : <span className="text-4xl font-bold leading-none tracking-[-0.02em] text-zinc-50">—</span>}
      <span className="text-[13px] text-zinc-300">{label}</span>
      <span className="text-xs leading-normal text-zinc-500">{sub}</span>
    </Reveal>
  )
}

function Para({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Reveal className="relative grid grid-cols-1 gap-2 py-6 md:grid-cols-[200px_minmax(0,1fr)] md:gap-8 md:py-7">
      <span className="line-in absolute inset-x-0 top-0 h-px bg-zinc-800" aria-hidden />
      <h2 className="m-0 text-[13px] font-semibold text-zinc-300">{title}</h2>
      <div className="text-[15px] leading-[1.7] text-zinc-400">{children}</div>
    </Reveal>
  )
}

function Decision({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <Reveal delay={((n - 1) % 2) * 90} className="surface flex flex-col gap-2 rounded-xl border border-line bg-card p-[22px] transition-colors duration-300 hover:border-zinc-700">
      <span className="font-mono text-xs text-brand">{String(n).padStart(2, '0')}</span>
      <h3 className="m-0 text-base font-semibold text-zinc-50">{title}</h3>
      <p className="m-0 text-[13px] leading-relaxed text-zinc-400">{children}</p>
    </Reveal>
  )
}

export default function Case() {
  const { lang } = useI18n()
  const data = useData()
  const ru = lang === 'ru'
  useEffect(() => { document.title = ru ? 'fightev — О проекте' : 'fightev — About' }, [ru])

  const card = data.status === 'ok' ? data.data.card : null
  const track = data.status === 'ok' ? data.data.track : null
  const fighters = card ? card.fights.flatMap(f => [f.fighter_1, f.fighter_2]) : []
  const nFights = card?.fights.length ?? 0
  const noStats = fighters.filter(f => !f.stats).length
  const noPhoto = fighters.filter(f => !f.photo).length
  const withPhoto = fighters.length - noPhoto
  const n = track?.n_fights ?? 0
  const rate = track && n ? Math.round(track.model.rate * 100) : null
  const dash = '—'
  const trails = !!track && n > 0 && track.model.rate < track.favourite.rate

  return (
    <article className="mx-auto max-w-[880px] px-4 pb-[90px] pt-10 md:px-6 md:pt-14">
      <ReadingProgress />
      <div className="eyebrow hero-in mb-3.5 text-brand">{ru ? 'О проекте — кейс' : 'About — case study'}</div>
      <h1 className="m-0 text-[32px] font-bold leading-[1.1] tracking-[-0.025em] md:text-[44px]">
        <SplitWords text={ru ? 'Прогнозы, которые основаны на реальной статистике' : 'Forecasts grounded in real statistics'} delay={80} step={45} />
      </h1>
      <p className="hero-in mb-0 mt-[18px] text-base leading-[1.65] text-zinc-400" style={{ '--d': '420ms' } as React.CSSProperties}>
        {ru
          ? 'fightev — аналитика боёв UFC на реальных данных: кард ближайшего турнира, статистика бойцов и прогноз ML-модели с честной историей точности.'
          : 'fightev is UFC fight analytics on real data: the next event’s card, fighter stats and an ML forecast with an honest accuracy record.'}
      </p>
      <div className="hero-in mt-[22px] flex flex-wrap gap-x-7 gap-y-2.5 text-[13px] text-zinc-500" style={{ '--d': '520ms' } as React.CSSProperties}>
        <span>{ru ? 'Роль' : 'Role'}: {ru ? 'продукт, дизайн, фронтенд, данные' : 'product, design, front-end, data'}</span>
        <span>{ru ? 'Стек' : 'Stack'}: React, Tailwind, Python, SQLite</span>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-7 md:grid-cols-4">
        <Stat value={nFights || null} label={ru ? 'боёв в карде' : 'fights on the card'} sub={ru ? 'с данными из базы боёв' : 'with data from the fight database'} />
        <Stat value={n || null} delay={80} label={ru ? 'прогнозов сверено' : 'forecasts checked'} sub={ru ? 'с результатами, до боя' : 'against results, recorded pre-fight'} />
        <Stat value={withPhoto || null} delay={160} label={ru ? 'фото выровнены' : 'photos aligned'} sub={ru ? 'по лицу автоматически' : 'to the face, automatically'} />
        <Stat value={7} delay={240} label={ru ? 'состояний' : 'states'} sub={ru ? 'от «нет фото» до промаха модели' : 'from “no photo” to a model miss'} />
      </div>

      <div className="mt-11 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Demo
          src={`${import.meta.env.BASE_URL}case/demo_old.webp`}
          height={300} dur={26}
          tag={ru ? 'Было' : 'Before'}
          alt={ru ? 'Прежний сайт, прокрутка: заголовок «UFC Analytics. With proof.», счётчики прибыли, тарифы и кнопки оплаты'
                  : 'The old site scrolling: the “UFC Analytics. With proof.” headline, profit counters, pricing and pay buttons'}
          caption={ru ? 'Витрина подписки: юниты прибыли, ROI, тарифы. О самих боях — ничего.'
                      : 'A subscription storefront: profit in units, ROI, pricing. Nothing about the fights themselves.'} />
        <Demo
          src={`${import.meta.env.BASE_URL}case/demo_new${ru ? '' : '_en'}.webp`}
          height={300} dur={20} delay={90}
          tag={ru ? 'Стало' : 'After'}
          alt={ru ? 'Нынешний сайт, прокрутка: афиша турнира, показатели модели и кард из двенадцати боёв'
                  : 'The current site scrolling: the event poster, the model’s figures and a card of twelve fights'}
          caption={ru ? 'Афиша турнира, счёт модели и кард: двенадцать боёв, каждый со своим прогнозом.'
                      : 'The event poster, the model’s record and the card: twelve fights, each with its own forecast.'} />
      </div>

      <section className="mt-9">
        <Reveal>
          <h2 className="m-0 mb-1.5 text-[22px] font-bold tracking-[-0.015em] text-zinc-50">
            {ru ? 'Главное действие — раскрыть бой' : 'The one action: open a fight'}
          </h2>
          <p className="mb-[18px] mt-0 max-w-[620px] text-[13px] leading-[1.55] text-zinc-400">
            {ru
              ? 'Строка боя показывает главное: кто фаворит и насколько. Клик разворачивает разбор — сравнение бойцов, прогноз на победу, досрочку и историю. Открыт всегда один бой.'
              : 'A row shows the essentials: who the favourite is and by how much. A click unfolds the breakdown — the tape, the win forecast, the finish and the history. One fight is open at a time.'}
          </p>
        </Reveal>
        <CardDemo
          closed={`${import.meta.env.BASE_URL}case/demo_card_closed${ru ? '' : '_en'}.webp`}
          open={`${import.meta.env.BASE_URL}case/demo_card_open${ru ? '' : '_en'}.webp`}
          alt={ru ? 'Карточка боя: свёрнутая строка разворачивается в разбор с прогнозом и статистикой'
                  : 'A fight card: the collapsed row unfolds into a breakdown with the forecast and stats'}
          caption={ru ? 'Одна строка — один бой. Разбор появляется на месте, без перехода на отдельную страницу.'
                      : 'One row, one fight. The breakdown appears in place, with no separate page to visit.'} />
      </section>

      <div className="mt-11">
        <Para title={ru ? 'Задача' : 'Problem'}>
          {ru
            ? 'Сайт был витриной платной подписки: статистика доходности и ссылки в Telegram. Проект стал бесплатным, и задача изменилась: болельщик за несколько секунд видит кард турнира, раскрывает любой бой и понимает, насколько можно доверять прогнозу.'
            : 'The site used to be a storefront for a paid subscription: profit stats and Telegram links. The project became free, and the job changed: a fan sees the event card in seconds, opens any fight and understands how far the forecast can be trusted.'}
        </Para>
        <Para title={ru ? 'Для кого' : 'Audience'}>
          {ru
            ? 'Болельщик UFC, который перед турниром хочет быстро понять расклад: кто фаворит, за счёт чего и насколько уверенно. Это рабочая гипотеза об аудитории, а не вывод из интервью.'
            : 'A UFC fan who wants a quick read on the card before an event: who the favourite is, why, and how confidently. That is a working hypothesis about the audience, not a finding from interviews.'}
        </Para>
        <Para title={ru ? 'Ограничения' : 'Constraints'}>
          {ru
            ? <>Данные неполные: в текущем карде у {noStats} из {fighters.length} бойцов нет подробной статистики, у {noPhoto} — фото. Модель угадывает {rate ?? dash}% победителей{trails ? ' и пока уступает рыночному ориентиру' : ''}. Интерфейс должен работать с этим, а не прятать.</>
            : <>The data is incomplete: on the current card {noStats} of {fighters.length} fighters have no detailed stats and {noPhoto} have no photo. The model picks {rate ?? dash}% of winners{trails ? ' and still trails the market benchmark' : ''}. The interface has to work with that, not hide it.</>}
        </Para>
      </div>

      <section className="mt-5">
        <Reveal><h2 className="m-0 mb-[22px] text-[22px] font-bold tracking-[-0.015em] text-zinc-50">{ru ? 'Ключевые решения' : 'Key decisions'}</h2></Reveal>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Decision n={1} title={ru ? 'Зелёный — это преимущество' : 'Green means the edge'}>
            {ru
              ? 'Цвет не привязан к стороне боя. Подсвечен тот, у кого выше вероятность или лучше показатель; второй канал — яркость, поэтому экран читается и при дальтонизме.'
              : 'Colour isn’t tied to a corner. Whoever has the higher probability or the better number is highlighted; brightness is a second channel, so the screen still reads with colour blindness.'}
          </Decision>
          <Decision n={2} title={ru ? 'Клик вместо наведения' : 'Click, not hover'}>
            {ru
              ? 'На телефоне наведения нет, а на десктопе блок раскрывался бы случайно. Открыт один бой, внутри — переключатель «Бой 6 из 12».'
              : 'Phones have no hover, and on desktop the panel would pop open by accident. One fight is open at a time, with a “Fight 6 of 12” switcher inside.'}
          </Decision>
          <Decision n={3} title={ru ? 'Неопределённость словами' : 'Uncertainty in words'}>
            {ru
              ? '51 на 49 подписано «Равный бой», а не «победит X». Новичкам с 1–2 боями — метка «мало данных».'
              : '51 to 49 is labelled “Even fight”, not “X wins”. Newcomers with 1–2 bouts get a “limited data” tag.'}
          </Decision>
          <Decision n={4} title={ru ? 'Точность — отдельной страницей' : 'Accuracy gets its own page'}>
            {ru
              ? 'Калибровка, интервалы и промахи на виду. Модель досрочки проигрывает простому правилу — это видно на графике, и рядом с её прогнозом об этом сказано прямо.'
              : 'Calibration, intervals and misses are in plain sight. The finish model trails a simple rule — the chart shows it, and the card says so next to its forecast.'}
          </Decision>
          <Decision n={5} title={ru ? 'Без ставок' : 'No betting'}>
            {ru
              ? 'Оценка рынка осталась только точкой отсчёта на странице точности. В карточках — модель и статистика бойцов.'
              : 'The market view stays a reference point on the accuracy page. The cards show the model and the fighters’ stats.'}
          </Decision>
          <Decision n={6} title={ru ? 'Фото выровнены по лицу' : 'Photos aligned to the face'}>
            {ru
              ? 'Снимки кадрированы по-разному. Скрипт находит глаза и макушку: масштаб задаёт расстояние между глазами, а макушка у всех на одной линии — головы одного размера и не обрезаны.'
              : 'Source shots are framed differently. A script finds the eyes and the crown: eye distance sets the scale and every crown sits on one line, so heads come out the same size and never cropped.'}
          </Decision>
        </div>
      </section>

      <div className="mt-11">
        <Para title={ru ? 'Что дальше' : 'Next'}>
          {ru
            ? 'Калибровка модели, чтобы уверенные проценты значили то, что обещают. Уведомление о начале турнира.'
            : 'Calibrating the model so confident percentages mean what they promise. A reminder when the event starts.'}
        </Para>
      </div>
    </article>
  )
}
