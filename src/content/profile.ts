/** Все тексты сайта в одном месте: правьте здесь, вёрстка подтянется сама. */

export const SITE = {
  /** Адрес, где будет жить сайт. Нужен для canonical, sitemap и Open Graph. */
  url: 'https://mirudistok32.github.io/portfolio/',
  name: 'Станислав Постников',
  role: 'Senior Frontend-разработчик',
  title: 'Станислав Постников — Senior Frontend-разработчик (Next.js, React, TypeScript)',
  description:
    'Senior Frontend-разработчик из Санкт-Петербурга: Next.js, React, TypeScript. 8 лет коммерческого опыта, UI-библиотеки, производительность, SEO и AI-assisted разработка. Рассматриваю предложения.',
  city: 'Санкт-Петербург',
  email: 'mirudistok32@yandex.ru',
  telegram: 'postnikov_st',
  github: 'mirudistok32',
  /** PDF из public/. Если поставить null, кнопка станет «Запросить резюме» и поведёт в Telegram. */
  cv: 'postnikov-cv.pdf' as string | null,
};

export const PAGES = [
  { id: 'about', label: 'Обо мне' },
  { id: 'experience', label: 'Опыт' },
  { id: 'contacts', label: 'Контакты' },
] as const;

export const ROT_WORDS = ['грузятся быстро', 'не бесят', 'работают везде', 'хвалят на ревью'];

export const FACTS = [
  { value: '8 лет 5 мес', label: 'в коммерческой разработке' },
  { value: 'Senior', label: 'Next.js · React · TypeScript' },
  { value: 'AI-assisted', label: 'Claude Code, Cursor, MCP' },
];

export interface Quest {
  /** Якорь главы: #job-<id>. */
  id: string;
  company: string;
  role: string;
  period: string;
  short: string;
  /** Одна строка для ленты опыта на витрине. */
  headline: string;
  about: string;
  /** Крупные цифры над текстом главы. */
  stats?: [string, string][];
  /** Абзацы о том, что сделано. **Так** выделяется главное. */
  story: string[];
  stack: string[];
  fun: string;
}

export const QUESTS: Quest[] = [
  {
    id: 'simbirsoft',
    company: 'SimbirSoft',
    role: 'Senior Frontend-разработчик',
    period: 'Октябрь 2024 — сейчас · 2 года 1 месяц',
    short: 'Senior · 2024 — сейчас',
    headline: 'PropTech: промо-сайты 18 ЖК, общая UI-библиотека, −18 000 строк дублей',
    about:
      'Сайт девелопера премиальной недвижимости: корпоративный раздел, промо-сайты 18 жилых комплексов и онлайн-подбор квартир с ипотечным калькулятором.',
    stats: [
      ['−18 000', 'строк дублирующего кода'],
      ['7 ЖК', 'переехали на общий компонент карты'],
      ['1 образ', 'Docker на все стенды'],
    ],
    story: [
      'Вынес Яндекс-карту в общий компонент UI-библиотеки и перевёл на него 7 жилых комплексов: из кодовой базы ушло **18 000 строк** дублирующего кода. Участвовал в миграции на Next.js 15 и перенёс переменные окружения в runtime, так что теперь на все стенды едет **один Docker-образ**.',
      'Сверстал по Figma десятки анимированных страниц на **GSAP** и ускорил LCP слайдеров. Настроил для команды AI-агентов: написал skills и подключил **MCP** к Jira, Confluence, GitLab, Figma, SonarQube и Sentry.',
      'Провожу технические собеседования и код-ревью, **менторю** новичков.',
    ],
    stack: [
      'Next.js 15',
      'React 18',
      'TypeScript',
      'Zustand',
      'GraphQL',
      'GSAP',
      'Electron',
      'Storybook',
    ],
    fun: 'Удалил 18 тысяч строк и ничего не сломал. Почти.',
  },
  {
    id: 'zvuk',
    company: 'Звук',
    role: 'Middle Frontend-разработчик',
    period: 'Апрель 2021 — октябрь 2024 · 3 года 7 месяцев',
    short: 'Middle · 2021 — 2024',
    headline: 'Стриминг: аудиоплеер и библиотека аналитики Clickstream',
    about: 'Стриминг музыки, подкастов и аудиокниг (ранее СберЗвук).',
    story: [
      'Участвовал в разработке **аудиоплеера** и размечал в нём аналитику. Написал **Clickstream** — библиотеку отправки событий аналитики на Protobuf, интегрировал Google Analytics и Яндекс Метрику.',
      'Делал модальные окна авторизации, попапы уведомлений, эмбеды и маркетинговые страницы. Документировал фичи в Confluence.',
    ],
    stack: ['Next.js', 'TypeScript', 'MobX', 'GraphQL', 'Lerna', 'Protobuf', 'Rollup'],
    fun: 'Почти четыре года кодил под музыку. Иногда под ту, которую сам и чинил.',
  },
  {
    id: 'simbirsoft-2020',
    company: 'SimbirSoft',
    role: 'Middle Frontend-разработчик',
    period: 'Сентябрь 2020 — апрель 2021 · 8 месяцев',
    short: 'Middle · 2020 — 2021',
    headline: 'Внутренняя соцсеть: архитектура клиента, лид команды',
    about: 'Внутренняя социальная сеть компании.',
    story: [
      'Построил **архитектуру** клиентской части приложения, реализовал работу с API, формы и презентационные компоненты. Был **лидом команды** разработки и проводил код-ревью.',
    ],
    stack: ['React', 'Redux', 'TypeScript', 'Jest', 'SCSS'],
    fun: 'Впервые стал тем, кто говорит «давайте созвонимся».',
  },
  {
    id: 'abbyy',
    company: 'ABBYY',
    role: 'Middle Frontend-разработчик',
    period: 'Январь — сентябрь 2020 · 9 месяцев',
    short: 'Middle · 2020',
    headline: 'Распознавание сканов: работа с документом и настройками',
    about: 'Приложение для распознавания старых сканов и переноса их в редактируемый документ.',
    story: [
      'Делал добавление страниц и работу с **документом**, форму с валидацией для таблицы дополнительных настроек. Описал существующий функционал в документации.',
    ],
    stack: ['React', 'TypeScript', 'Knockout.js', 'jQuery', 'SCSS'],
    fun: 'Knockout.js в 2020 году. Выжил и стал сильнее.',
  },
  {
    id: 'timesheet',
    company: 'Учёт рабочего времени',
    role: 'Middle Frontend-разработчик',
    period: 'Июль 2019 — январь 2020 · 7 месяцев',
    short: 'Middle · 2019',
    headline: 'Таблица учёта рабочего времени для производства',
    about: 'Электронная таблица учёта рабочего времени для производства.',
    story: [
      'Интегрировал приложение с **базой данных** и внутренними JS-библиотеками компании. Сделал списки пользователей и объединение их в группы.',
    ],
    stack: ['React', 'Redux', 'TypeScript', 'Formik', 'Jest'],
    fun: 'Считал чужие рабочие часы. Свои считать боялся.',
  },
  {
    id: 'freelance',
    company: 'Фриланс',
    role: 'Верстальщик',
    period: 'Июнь 2018 — июль 2019 · 1 год 2 месяца',
    short: 'Старт · 2018 — 2019',
    headline: 'Адаптивные сайты, личные кабинеты, SEO',
    about: 'Магазин брендовой одежды, SPA для чтения и публикации произведений, фитнес-блог.',
    story: [
      'Верстал многостраничные **адаптивные** сайты по макетам Photoshop, делал личные кабинеты, формы обратной связи и авторизации. Настроил **SEO** и сборку на Gulp.',
    ],
    stack: ['HTML', 'SCSS', 'JavaScript', 'jQuery', 'React', 'Gulp'],
    fun: 'Первый уровень: jQuery, Photoshop и вера в себя.',
  },
];

export const HR_ROWS: [string, string][] = [
  ['Роль', 'Senior Frontend-разработчик'],
  ['Опыт', '8 лет 5 месяцев'],
  ['Стек', 'Next.js, React, TypeScript, MobX, Zustand, GraphQL'],
  ['Сейчас', 'SimbirSoft, PropTech'],
  ['Формат', 'Офис или удалённо, Санкт-Петербург, готов к командировкам'],
  ['Занятость', 'Полная, частичная или проектная'],
];

/** Шуточная строка в конце карточки HR: видна на сайте, но в «Скопировать профиль» не попадает. */
export const HR_JOKE: [string, string] = ['Слабость', 'Двигаю кнопки на 1px'];

export const KNOWS_ABOUT = [
  'Next.js',
  'React',
  'TypeScript',
  'MobX',
  'Zustand',
  'Redux',
  'GraphQL',
  'REST API',
  'Storybook',
  'Jest',
  'Vitest',
  'GSAP',
  'SEO',
  'Web Performance',
  'AI-assisted development',
  'MCP',
];
