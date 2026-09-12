import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Lang = 'ru' | 'en'

// Russian plural: 1 бой, 2 боя, 5 боёв
function ruPlural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}

export type Verdict = 'even' | 'slight' | 'edge' | 'clear'

const ru = {
  locale: 'ru-RU',
  nav: { fights: 'Бои', accuracy: 'Точность модели', case: 'О проекте', menu: 'Меню', close: 'Закрыть меню', skip: 'К содержимому',
    toLight: 'Светлая тема', toDark: 'Тёмная тема' },
  langName: 'Русский',
  fights: (n: number) => `${n} ${ruPlural(n, 'бой', 'боя', 'боёв')}`,
  of: (k: number, n: number) => `${k} из ${n}`,

  // hero
  nextEvent: 'Ближайший турнир',
  eventDone: 'Турнир завершён',
  eventPast: 'Турнир прошёл · результаты скоро',
  today: 'сегодня',
  inDays: (d: number) => `через ${d} ${ruPlural(d, 'день', 'дня', 'дней')}`,
  mainEvent: 'Главный бой',
  titleFight: 'Титульный бой',
  rounds: (n: number) => `${n} ${ruPlural(n, 'раунд', 'раунда', 'раундов')}`,
  modelSays: (v: Verdict, fav: string | null, pct: number) =>
    v === 'even' ? `Модель: равный бой — ${pct}%` : `Модель: ${verdictRu[v].toLowerCase()} ${fav} — ${pct}%`,
  ctaBreakdown: 'Разбор главного боя',
  ctaFight: 'Разбор боя',
  ctaAccuracy: 'Как модель отработала',

  // list
  card: 'Кард',
  statFights: 'боёв в карде',
  statChecked: 'прогнозов сверено',
  statAccuracy: 'точность модели',
  statEvents: 'турниров в истории',
  legend: 'зелёным — преимущество по модели или статистике',
  win: 'победа',
  predictionWas: 'прогноз был',
  lowData: 'мало данных',
  lowDataLong: 'мало данных — оценка менее надёжна',
  fightNofM: (i: number, n: number): [string, string, string] => ['Бой ', String(i), ` из ${n}`],
  prevFight: 'Предыдущий бой',
  nextFight: 'Следующий бой',
  expand: (a: string, b: string) => `Раскрыть бой: ${a} против ${b}`,
  collapse: 'Свернуть бой',
  verdict: (v: Verdict) => verdictRu[v],
  ufcRecord: (w: number, l: number) => `${w}-${l} в UFC`,

  // result
  hit: 'Модель угадала',
  miss: 'Модель ошиблась',
  draw: 'Ничья или бой не состоялся',
  method: { KO: 'KO', SUB: 'сабмишн', DEC: 'решение', OTHER: 'другое' } as Record<string, string>,
  roundN: (r: number) => `${r} раунд`,

  // prediction
  winForecast: 'Прогноз на победу',
  forecastLabel: 'Прогноз модели',
  finishForecast: 'Прогноз на исход',
  finishEarly: 'Бой закончится досрочно',
  finishDecision: 'Бой закончится решением',
  finishModelNote: 'Это отдельная модель досрочки. На проверенных боях она уступает простому правилу — сверяйтесь со страницей точности.',
  fightHistory: 'История бойцов',
  trackLine: (k: number, n: number, e: number) =>
    `Модель угадала ${k} из ${n} победителей за ${e} ${ruPlural(e, 'турнир', 'турнира', 'турниров')}.`,
  howCounted: 'Как считали →',
  finishTitle: 'Досрочно или решение',
  noFights: 'нет боёв',
  finishNote: (base: number) =>
    `Доля боёв в UFC, которые закончились досрочно. Отметка — среднее по UFC за два года: ${base}%.`,

  // tape
  tape: 'Сравнение',
  tapeRows: {
    age: 'Возраст', height: 'Рост', reach: 'Размах рук', stance: 'Стойка',
    slpm: 'Удары в минуту', str_acc: 'Точность ударов', sapm: 'Пропускает в минуту',
    str_def: 'Защита от ударов', td_avg: 'Тейкдауны за 15 мин', td_def: 'Защита от тейкдаунов',
  },
  stance: { Orthodox: 'Правша', Southpaw: 'Левша', Switch: 'Свитч', 'Open Stance': 'Открытая' } as Record<string, string>,
  cm: 'см',
  noStats: 'Детальной статистики пока нет ни у одного из бойцов — обычно это новички с одним-двумя боями в UFC. Прогноз опирается на общий профиль и менее надёжен.',

  // side panel
  lastFight: (m: number) => (m < 1 ? 'Последний бой меньше месяца назад' : `Последний бой ${Math.round(m)} мес назад`),
  howWins: 'Победы',
  noWins: 'Побед в UFC пока нет',
  zones: 'Статистика по ударам',
  zoneNames: { head: 'Голова', body: 'Корпус', leg: 'Ноги' },
  notEnough: 'Мало данных',
  last5: 'Последние 5 боёв',
  noUfc: 'Нет боёв в UFC',
  vs: 'против',
  noPhoto: 'Фото пока нет',
  tabs: { p: 'Прогноз', c: 'Сравнение', s: 'Стиль' },
  disclaimer: 'Прогноз — ансамбль из трёх ML-моделей по официальной статистике боёв, записанный до боя. Модель ошибается, и мы показываем, насколько часто.',
  disclaimerShort: 'Прогноз — ансамбль из трёх ML-моделей, записанный до боя. Модель ошибается.',
  howPerformed: 'Как модель отработала →',

  // states
  loading: 'Загружаем кард…',
  errorTitle: 'Не удалось загрузить данные',
  errorText: 'Проверьте соединение и попробуйте ещё раз.',
  retry: 'Обновить',
  emptyTitle: 'Следующий турнир ещё не объявлен',
  emptyText: 'Кард появится здесь, как только UFC опубликует пары. А пока можно посмотреть, как модель отработала прошлый турнир.',
  emptyCta: (name: string) => `Итоги ${name}`,
  updated: (d: string) => `Данные обновлены ${d}`,

  // footer
  footer: {
    what: 'fightev — исследовательский аналитический проект: прогнозы ML-модели по открытой статистике боёв публикуются как есть, вместе с историей ошибок.',
    liability: 'Это информационный ресурс. Он не даёт советов по ставкам и не несёт ответственности за решения, принятые на основе этих данных, и за возможные финансовые потери. Прошлая точность не гарантирует будущую.',
    data: 'Проект не связан с UFC и не представляет его.',
    accuracy: 'Точность модели и выборка →',
  },
}

const verdictRu: Record<Verdict, string> = {
  even: 'Равный бой', slight: 'Небольшой перевес', edge: 'Перевес', clear: 'Явный фаворит',
}
const verdictEn: Record<Verdict, string> = {
  even: 'Even fight', slight: 'Slight edge', edge: 'Edge', clear: 'Clear favourite',
}

export type Dict = typeof ru

const en: Dict = {
  locale: 'en-US',
  nav: { fights: 'Fights', accuracy: 'Model accuracy', case: 'About', menu: 'Menu', close: 'Close menu', skip: 'Skip to content',
    toLight: 'Light theme', toDark: 'Dark theme' },
  langName: 'English',
  fights: (n: number) => `${n} ${n === 1 ? 'fight' : 'fights'}`,
  of: (k: number, n: number) => `${k} of ${n}`,

  nextEvent: 'Next event',
  eventDone: 'Event completed',
  eventPast: 'Event finished · results soon',
  today: 'today',
  inDays: (d: number) => (d === 1 ? 'tomorrow' : `in ${d} days`),
  mainEvent: 'Main event',
  titleFight: 'Title fight',
  rounds: (n: number) => `${n} rounds`,
  modelSays: (v: Verdict, fav: string | null, pct: number) =>
    v === 'even' ? `Model: even fight — ${pct}%` : `Model: ${verdictEn[v].toLowerCase()} to ${fav} — ${pct}%`,
  ctaBreakdown: 'Main event breakdown',
  ctaFight: 'Fight breakdown',
  ctaAccuracy: 'How the model performed',

  card: 'Fight card',
  statFights: 'fights on the card',
  statChecked: 'forecasts checked',
  statAccuracy: 'model accuracy',
  statEvents: 'events on record',
  legend: 'green marks the edge — by the model or the stats',
  win: 'win',
  predictionWas: 'forecast was',
  lowData: 'limited data',
  lowDataLong: 'limited data — less reliable',
  fightNofM: (i: number, n: number): [string, string, string] => ['Fight ', String(i), ` of ${n}`],
  prevFight: 'Previous fight',
  nextFight: 'Next fight',
  expand: (a: string, b: string) => `Expand fight: ${a} vs ${b}`,
  collapse: 'Collapse fight',
  verdict: (v: Verdict) => verdictEn[v],
  ufcRecord: (w: number, l: number) => `${w}-${l} in UFC`,

  hit: 'Model was right',
  miss: 'Model was wrong',
  draw: 'Draw or no contest',
  method: { KO: 'KO', SUB: 'submission', DEC: 'decision', OTHER: 'other' },
  roundN: (r: number) => `round ${r}`,

  winForecast: 'Win probability',
  forecastLabel: 'Model forecast',
  finishForecast: 'How it ends',
  finishEarly: 'The fight ends inside the distance',
  finishDecision: 'The fight goes to a decision',
  finishModelNote: 'This is the separate finish model. On checked fights it trails a simple rule — see the accuracy page.',
  fightHistory: 'Fighter history',
  trackLine: (k: number, n: number, e: number) =>
    `The model picked ${k} of ${n} winners across ${e} ${e === 1 ? 'event' : 'events'}.`,
  howCounted: 'How we count →',
  finishTitle: 'Finish or decision',
  noFights: 'no fights',
  finishNote: (base: number) =>
    `Share of the fighter's UFC bouts that ended inside the distance. The tick is the UFC average over two years: ${base}%.`,

  tape: 'Tale of the tape',
  tapeRows: {
    age: 'Age', height: 'Height', reach: 'Reach', stance: 'Stance',
    slpm: 'Strikes landed / min', str_acc: 'Striking accuracy', sapm: 'Strikes absorbed / min',
    str_def: 'Striking defence', td_avg: 'Takedowns / 15 min', td_def: 'Takedown defence',
  },
  stance: { Orthodox: 'Orthodox', Southpaw: 'Southpaw', Switch: 'Switch', 'Open Stance': 'Open' },
  cm: 'cm',
  noStats: 'Neither fighter has detailed numbers yet — usually newcomers with one or two UFC bouts. The forecast leans on the general profile and is less reliable.',

  lastFight: (m: number) => (m < 1 ? 'Last fought less than a month ago' : `Last fought ${Math.round(m)} mo ago`),
  howWins: 'Wins',
  noWins: 'No UFC wins yet',
  zones: 'Striking breakdown',
  zoneNames: { head: 'Head', body: 'Body', leg: 'Legs' },
  notEnough: 'Not enough data',
  last5: 'Last 5 fights',
  noUfc: 'No UFC fights',
  vs: 'vs',
  noPhoto: 'No photo yet',
  tabs: { p: 'Forecast', c: 'Tape', s: 'Style' },
  disclaimer: 'The forecast is an ensemble of three ML models trained on official fight statistics and recorded before the fight. The model makes mistakes — and we show how often.',
  disclaimerShort: 'An ensemble of three ML models, recorded before the fight. The model makes mistakes.',
  howPerformed: 'How the model performed →',

  loading: 'Loading the card…',
  errorTitle: "Couldn't load the data",
  errorText: 'Check your connection and try again.',
  retry: 'Retry',
  emptyTitle: "The next event hasn't been announced yet",
  emptyText: 'The card will appear here as soon as the UFC confirms the bouts. Meanwhile, see how the model did at the last event.',
  emptyCta: (name: string) => `Results: ${name}`,
  updated: (d: string) => `Data updated ${d}`,

  footer: {
    what: 'fightev is a research project: forecasts from an ML model built on public fight statistics, published as they are, together with the record of its misses.',
    liability: 'This is an information resource. It gives no betting advice and takes no responsibility for decisions made on this data or for any financial losses. Past accuracy does not guarantee future accuracy.',
    data: 'The project is not affiliated with UFC and does not represent it.',
    accuracy: 'Model accuracy and sample →',
  },
}

const DICTS: Record<Lang, Dict> = { ru, en }

function initialLang(): Lang {
  // ?lang=en makes a shareable link; it is consumed here (before the router reads the URL)
  // so that switching language later is not overridden on reload
  const url = new URL(window.location.href)
  const q = url.searchParams.get('lang')
  if (q) {
    url.searchParams.delete('lang')
    window.history.replaceState(window.history.state, '', url)
  }
  if (q === 'ru' || q === 'en') {
    try { localStorage.setItem('lang', q) } catch { /* storage blocked */ }
    return q
  }
  try {
    const saved = localStorage.getItem('lang')
    if (saved === 'ru' || saved === 'en') return saved
  } catch { /* storage blocked */ }
  return navigator.language?.toLowerCase().startsWith('ru') ? 'ru' : 'en'
}

const Ctx = createContext<{ lang: Lang; t: Dict; setLang: (l: Lang) => void }>({ lang: 'ru', t: ru, setLang: () => {} })

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  const value = useMemo(() => ({
    lang,
    t: DICTS[lang],
    setLang: (l: Lang) => {
      setLangState(l)
      try { localStorage.setItem('lang', l) } catch { /* storage blocked */ }
    },
  }), [lang])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useI18n = () => useContext(Ctx)
