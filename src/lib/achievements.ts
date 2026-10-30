import { confetti } from './fx';
import { createStore, storage } from './store';

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  desc: string;
  /** Есть подсказка — значит ачивка секретная: до открытия видна как «???». */
  hint?: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'welcome', icon: '✦', title: 'Добро пожаловать', desc: 'Открыть портфолио' },
  { id: 'explorer', icon: '◎', title: 'Картограф', desc: 'Посетить все страницы' },
  {
    id: 'dawn',
    icon: '◐',
    title: 'Утро вечера мудренее',
    desc: 'Дождаться дня на странице «Проекты»',
  },
  {
    id: 'time',
    icon: '↺',
    title: 'Машина времени',
    desc: 'Вернуться из дня обратно в ночь, как у Уэллса',
  },
  {
    id: 'world80',
    icon: '80',
    title: 'Вокруг света за 80 секунд',
    desc: 'Обойти все страницы за 80 секунд, как Филеас Фогг',
  },
  { id: 'ninja', icon: '⌘', title: 'Клавиатурный ниндзя', desc: 'Полистать страницы стрелками' },
  {
    id: 'griffin',
    icon: '7д',
    title: 'Неделя грифона',
    desc: 'Прожить неделю: 7 переходов между страницами',
  },
  { id: 'frames', icon: '24', title: '24 кадра', desc: '24 перехода, как кадров в секунде кино' },
  { id: 'quests', icon: '§', title: 'Летописец', desc: 'Пролистать все главы опыта' },
  { id: 'deck', icon: '▤', title: 'Собрал колоду', desc: 'Скопировать стек из главы опыта' },
  { id: 'warmup', icon: '+1', title: 'Разминка', desc: '5 раз нажать на портрет' },
  { id: 'dorian', icon: '▣', title: 'Портрет Дориана Грея', desc: '20 раз нажать на портрет' },
  {
    id: 'steps',
    icon: '10k',
    title: 'Дневная норма шагов',
    desc: 'Провести мышью 10 000 пикселей',
  },
  { id: 'marathon', icon: '42', title: 'Марафонец', desc: 'Провести мышью 42 195 пикселей' },
  { id: 'medal', icon: '◉', title: 'Медальон дрожит', desc: 'Включить ведьмачье чутьё' },
  { id: 'copy', icon: '⧉', title: 'Писарь', desc: 'Скопировать что-нибудь' },
  { id: 'hr', icon: 'HR', title: 'Охотник за головами', desc: 'Скопировать профиль для HR' },
  { id: 'tg', icon: '@', title: 'Нанять героя', desc: 'Открыть Telegram' },
  { id: 'window', icon: '⊞', title: 'Окно в Европу', desc: 'Открыть GitHub' },
  {
    id: 'credits',
    icon: '►',
    title: 'Сцена после титров',
    desc: 'Задержаться на «Контактах» 15 секунд',
  },
  { id: 'munchkin', icon: '10', title: 'Манчкин 10-го уровня', desc: 'Собрать 10 ачивок' },
  {
    id: 'comet',
    icon: '✷',
    title: 'Загадай желание',
    desc: 'Поймать падающую комету',
    hint: 'Иногда небо роняет звёзды',
  },
  {
    id: 'contact',
    icon: '◍',
    title: 'Космический контакт',
    desc: 'Нажать на любую планету',
    hint: 'Там, наверху, кто-то есть',
  },
  {
    id: 'mars',
    icon: '●',
    title: 'Война миров',
    desc: 'Найти Марс Уэллса',
    hint: 'Красная угроза',
  },
  {
    id: 'moon',
    icon: '◔',
    title: 'С Земли на Луну',
    desc: 'Найти Луну Жюля Верна',
    hint: 'Цель Пушечного клуба',
  },
  {
    id: 'spheres',
    icon: '✺',
    title: 'Сопряжение сфер',
    desc: 'Найти все семь планет',
    hint: 'Все семь сфер',
  },
  {
    id: 'stars',
    icon: '✶',
    title: 'Смотрящий на звёзды',
    desc: '«Все мы лежим в канаве, но некоторые смотрят на звёзды». Оскар Уайльд',
    hint: 'Минута под ночным небом',
  },
  {
    id: 'fire',
    icon: '▲',
    title: 'Погреться у костра',
    desc: 'Нажать на костёр',
    hint: 'Тепло в ночи',
  },
  {
    id: 'nautilus',
    icon: '≋',
    title: 'Наутилус',
    desc: 'Найти ручей капитана Немо',
    hint: 'Где-то журчит вода',
  },
  {
    id: 'terem',
    icon: 'Ѫ',
    title: 'Русский стиль',
    desc: 'Найти терем и храм с куполами',
    hint: 'Купола над холмами',
  },
  {
    id: 'wolf',
    icon: '••',
    title: 'Белый Волк',
    desc: 'Заметить глаза в ночном лесу',
    hint: 'Из темноты кто-то смотрит',
  },
  {
    id: 'plotva',
    icon: 'Пл',
    title: 'Плотва нашлась',
    desc: 'Набрать «плотва» на клавиатуре',
    hint: 'Имя одной лошади',
  },
  {
    id: 'owl',
    icon: 'Уу',
    title: 'Совы не то, чем кажутся',
    desc: 'Найти сову в ночном лесу',
    hint: 'Кто-то не спит по ночам',
  },
  {
    id: 'hedgehog',
    icon: 'Ёж',
    title: 'Ёжик в тумане',
    desc: 'Найти ёжика в рассветном тумане',
    hint: 'В тумане кто-то бредёт',
  },
  {
    id: 'cow',
    icon: 'Му',
    title: 'Простоквашино',
    desc: 'Погладить корову на лугу',
    hint: 'На лугу кто-то жуёт',
  },
  {
    id: 'bees',
    icon: 'Жж',
    title: 'Неправильные пчёлы',
    desc: 'Найти пасеку',
    hint: 'Что-то жужжит',
  },
  {
    id: 'pigeon',
    icon: '✉',
    title: 'Голубиная почта',
    desc: 'Поймать голубя с письмом',
    hint: 'Письмо летит по воздуху',
  },
  {
    id: 'zoo',
    icon: 'Зоо',
    title: 'Зоолог',
    desc: 'Найти всех зверей: волка, сову, ёжика, корову, пчёл и голубя',
    hint: 'Всякой твари по паре',
  },
  {
    id: 'invisible',
    icon: '?',
    title: 'Человек-невидимка',
    desc: 'Найти все секретные ачивки',
    hint: 'Всё тайное',
  },
  { id: 'final', icon: '★', title: 'Легенда', desc: 'Собрать все ачивки' },
];

export const SECRET_IDS = ACHIEVEMENTS.filter((a) => a.hint).map((a) => a.id);

/** Как ачивка выглядит в панели: секретная до открытия — «???» и подсказка вместо условия. */
export function cardOf(a: Achievement, got: boolean) {
  return !got && a.hint
    ? { icon: '?', title: '???', desc: a.hint }
    : { icon: a.icon, title: a.title, desc: a.desc };
}

/**
 * Что открывает приход на вкладку; `seen` — память о посещениях за этот показ, функция её дополняет.
 * День — с «Проектов» (2) и дальше: сразу на «Контакты» можно попасть по ссылке, и это тоже день.
 */
export function visitUnlocks(
  page: number,
  seen: { visited: Set<number>; sawDay: boolean },
  total: number,
) {
  seen.visited.add(page);
  if (page >= 2) seen.sawDay = true;
  const ids: string[] = [];
  if (seen.visited.size === total) ids.push('explorer');
  if (page === 2) ids.push('dawn');
  if (page === 0 && seen.sawDay) ids.push('time');
  return ids;
}

/** Звери в пейзаже: все вместе дают «Зоолога». */
const ZOO_IDS = ['wolf', 'owl', 'hedgehog', 'cow', 'bees', 'pigeon'];

interface AchState {
  got: string[];
  /** Найденные тайники в пейзаже: планеты, костры, ручей, терем, звери. */
  found: string[];
}

export const achStore = createStore<AchState>({ got: [], found: [] });
/** Тост ачивки, который виден сейчас. Тосты идут по одному, чтобы не закрывать контент. */
export const achToast = createStore<Achievement | null>(null);

const queue: Achievement[] = [];

/** Берёт следующий тост из очереди; пачка из трёх и больше сворачивается в один. */
function pump() {
  if (achToast.get() || !queue.length) return;
  const take = queue.splice(0, queue.length > 2 ? queue.length : 1);
  achToast.set(
    take.length === 1
      ? take[0]
      : {
          id: 'batch',
          icon: `+${take.length}`,
          title: `${take.length} ачивок разом`,
          desc: take.map((a) => a.title).join(', '),
        },
  );
  setTimeout(() => {
    achToast.set(null);
    pump();
  }, 2400);
}

const KEY_GOT = 'pv2-ach';
const KEY_FOUND = 'pv2-found';

export function loadAchievements() {
  const ids = new Set(ACHIEVEMENTS.map((a) => a.id));
  achStore.set({
    got: storage.read<string[]>(KEY_GOT, []).filter((id) => ids.has(id)),
    found: storage.read<string[]>(KEY_FOUND, []),
  });
}

/** quiet — открыть без всплывашки (ачивка всё равно видна в панели и на шкале). */
export function unlock(id: string, quiet = false) {
  const { got } = achStore.get();
  if (got.includes(id)) return;
  const next = [...got, id];
  achStore.set((s) => ({ ...s, got: next }));
  storage.write(KEY_GOT, next);
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  if (a && !quiet) {
    queue.push(a);
    pump();
  }

  if (next.length >= 10) unlock('munchkin');
  if (ZOO_IDS.every((z) => achStore.get().got.includes(z))) unlock('zoo');
  if (SECRET_IDS.every((s) => s === 'invisible' || achStore.get().got.includes(s)))
    unlock('invisible');
  if (
    id !== 'final' &&
    ACHIEVEMENTS.every((x) => x.id === 'final' || achStore.get().got.includes(x.id))
  ) {
    // сюда же приходят вложенные unlock (зоолог, невидимка) — «Легенда» и конфетти только раз
    setTimeout(() => {
      if (achStore.get().got.includes('final')) return;
      unlock('final');
      confetti();
    }, 900);
  }
}

/** Отмечает тайник найденным. Возвращает true, если нашли впервые. */
export function markFound(spotId: string) {
  const { found } = achStore.get();
  if (found.includes(spotId)) return false;
  const next = [...found, spotId];
  achStore.set((s) => ({ ...s, found: next }));
  storage.write(KEY_FOUND, next);
  return true;
}

export function resetAchievements() {
  achStore.set({ got: [], found: [] });
  storage.write(KEY_GOT, []);
  storage.write(KEY_FOUND, []);
}
