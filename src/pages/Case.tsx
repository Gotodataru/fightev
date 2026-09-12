import { useEffect, type ReactNode } from 'react'
import { useData } from '../data'
import { CountUp, Reveal, SplitWords } from '../lib/motion'
import { useI18n } from '../i18n'

function Shot({ src, alt, tag, caption, delay = 0 }: { src: string; alt: string; tag: string; caption: string; delay?: number }) {
  return (
    <Reveal delay={delay} className="flex flex-col gap-2.5">
      <figure className="m-0 flex flex-col gap-2.5">
        <div className="overflow-hidden rounded-xl border border-line bg-card">
          <img src={src} alt={alt} width={1440} height={900} loading="lazy" decoding="async" className="block w-full" />
        </div>
        <figcaption className="text-[13px] leading-normal text-zinc-400">
          <span className="mr-2 font-semibold text-zinc-300">{tag}</span>{caption}
        </figcaption>
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
    <Reveal delay={((n - 1) % 2) * 90} className="flex flex-col gap-2 rounded-xl border border-line bg-card p-[22px] transition-colors duration-300 hover:border-zinc-700">
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
      <div className="eyebrow hero-in mb-3.5 text-brand">{ru ? 'О проекте · кейс' : 'About · case study'}</div>
      <h1 className="m-0 text-[32px] font-bold leading-[1.1] tracking-[-0.025em] md:text-[44px]">
        <SplitWords text={ru ? 'Как показать прогноз, которому не стоит верить вслепую' : "How to show a forecast you shouldn't trust blindly"} delay={80} step={45} />
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
        <Stat value={nFights || null} label={ru ? 'боёв в карде' : 'fights on the card'} sub={ru ? 'с данными из базы UFCStats' : 'with data from the UFCStats base'} />
        <Stat value={n || null} delay={80} label={ru ? 'прогнозов сверено' : 'forecasts checked'} sub={ru ? 'с результатами, до боя' : 'against results, recorded pre-fight'} />
        <Stat value={withPhoto || null} delay={160} label={ru ? 'фото выровнены' : 'photos aligned'} sub={ru ? 'по лицу автоматически' : 'to the face, automatically'} />
        <Stat value={7} delay={240} label={ru ? 'состояний' : 'states'} sub={ru ? 'от «нет фото» до промаха модели' : 'from “no photo” to a model miss'} />
      </div>

      <div className="mt-11 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Shot
          src={`${import.meta.env.BASE_URL}case/before.webp`}
          tag={ru ? 'Было' : 'Before'}
          alt={ru ? 'Прежний сайт: тёмный экран с заголовком «UFC Analytics. With proof.», кнопками «Free Vault» и «Go Pro» и счётчиками прибыли в юнитах'
                  : 'The old site: a dark screen headlined “UFC Analytics. With proof.”, with “Free Vault” and “Go Pro” buttons and profit counters in units'}
          caption={ru ? 'Витрина подписки: юниты прибыли, ROI и винрейт, две кнопки на оплату. О самих боях — ничего.'
                      : 'A subscription storefront: profit in units, ROI and win rate, two buttons to pay. Nothing about the fights themselves.'} />
        <Shot
          src={`${import.meta.env.BASE_URL}case/after.webp`}
          delay={90}
          tag={ru ? 'Стало' : 'After'}
          alt={ru ? 'Нынешний сайт: главный бой турнира с фото соперников, вероятность 56 % и раскрытая карточка боя'
                  : 'The current site: the main event with both fighters’ photos, a 56% probability and an opened fight card'}
          caption={ru ? 'Кард ближайшего турнира: главный бой, вероятности словами и цифрами, рядом — сколько прогнозов модель уже угадала.'
                      : 'The next event’s card: the main fight, probabilities in words and numbers, and how many forecasts the model has got right so far.'} />
      </div>

      <div className="mt-11">
        <Para title={ru ? 'Задача' : 'Problem'}>
          {ru
            ? 'Сайт был витриной платной подписки: статистика ставок и ссылки в Telegram. Проект стал бесплатным, и задача изменилась: болельщик за несколько секунд видит кард турнира, раскрывает любой бой и понимает, насколько можно доверять прогнозу.'
            : 'The site used to be a storefront for a paid subscription: betting stats and Telegram links. The project became free, and the job changed: a fan sees the event card in seconds, opens any fight and understands how far the forecast can be trusted.'}
        </Para>
        <Para title={ru ? 'Для кого' : 'Audience'}>
          {ru
            ? 'Болельщик UFC, который перед турниром хочет быстро понять расклад: кто фаворит, за счёт чего и насколько уверенно. Это рабочая гипотеза об аудитории, а не вывод из интервью.'
            : 'A UFC fan who wants a quick read on the card before an event: who the favourite is, why, and how confidently. That is a working hypothesis about the audience, not a finding from interviews.'}
        </Para>
        <Para title={ru ? 'Ограничения' : 'Constraints'}>
          {ru
            ? <>Данные неполные: в текущем карде у {noStats} из {fighters.length} бойцов нет подробной статистики, у {noPhoto} — фото. Модель угадывает {rate ?? dash}% победителей{trails ? ' и уступает фаворитам по линии' : ''}. Интерфейс должен работать с этим, а не прятать.</>
            : <>The data is incomplete: on the current card {noStats} of {fighters.length} fighters have no detailed stats and {noPhoto} have no photo. The model picks {rate ?? dash}% of winners{trails ? ' and trails the betting favourites' : ''}. The interface has to work with that, not hide it.</>}
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
              ? 'Калибровка, интервалы и промахи на виду. Модель досрочки проиграла простому правилу — и её убрали из карточек.'
              : 'Calibration, intervals and misses are in plain sight. The finish model lost to a simple rule — so it was taken off the cards.'}
          </Decision>
          <Decision n={5} title={ru ? 'Без ставок' : 'No betting'}>
            {ru
              ? 'Коэффициенты остались только ориентиром на странице точности. В карточках — модель и статистика.'
              : 'Odds remain only as a benchmark on the accuracy page. The cards show the model and the stats.'}
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
