import Image from 'next/image';

import avatar from '@/assets/avatar.webp';
import { TrackedLink } from '@/components/Actions';
import { ContactLinks, HrCard } from '@/components/ContactCards';
import { Period } from '@/components/Period';
import { Portrait } from '@/components/Portrait';
import { RotWord } from '@/components/RotWord';
import { FACTS, PROJECTS, QUESTS, SITE } from '@/content/profile';

/** Витрина: всё главное на одной странице, остальные вкладки — подробности. */
export function About() {
  return (
    <div className="wrap home">
      <div className="home-top">
        <div className="hero glass" data-s>
          {/* имя, роль и статус — одна строка; на узком экране, где большое фото уходит вниз, рядом маленькое */}
          <div className="who">
            <Image className="who-ava" src={avatar} alt="" sizes="48px" />
            <TrackedLink
              achievement="window"
              className="who-name"
              href={`https://github.com/${SITE.github}`}
            >
              <b>{SITE.name}</b>
              <span>{SITE.roleShort}</span>
            </TrackedLink>
            <span className="status">
              <i aria-hidden="true" />
              Открыт к предложениям
            </span>
          </div>
          <h1 id="page-about-title">
            Делаю интерфейсы, которые <RotWord />
          </h1>
          <p className="lead">
            Пишу на Next.js, React и TypeScript: собираю UI-библиотеки, ускоряю загрузку страниц и
            настраиваю SEO.
          </p>
          <div className="actions">
            <a className="btn btn-accent" href="#experience">
              Смотреть опыт{' '}
              <span className="arr" aria-hidden="true">
                →
              </span>
            </a>
            {/* резюме уже в шапке, здесь — самое нужное HR действие */}
            <TrackedLink achievement="tg" className="btn" href={`https://t.me/${SITE.telegram}`}>
              Написать в Telegram
            </TrackedLink>
          </div>
          <ul className="facts">
            {FACTS.map((f) => (
              <li key={f.value}>
                <b>{f.value}</b>
                <span>{f.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <Portrait />
      </div>
      <div className="brief">
        <section className="card glass" data-s aria-labelledby="brief-exp-title">
          <div className="card-top">
            <h2 className="card-h" id="brief-exp-title">
              Опыт
            </h2>
            <a className="more" href="#experience">
              Подробнее <span aria-hidden="true">→</span>
            </a>
          </div>
          <ol className="timeline">
            {QUESTS.map((q) => (
              <li key={q.id}>
                <a href={`#job-${q.id}`}>
                  <span className="tl-when">
                    <Period text={q.period} />
                  </span>
                  {/* стрелка — признак ссылки и без наведения мышью; точка не уезжает в начало строки */}
                  <b>
                    {q.role}
                    {' · '}
                    {q.company}
                    <span className="tl-go" aria-hidden="true">
                      →
                    </span>
                  </b>
                  <span className="tl-sum">{q.headline}</span>
                </a>
              </li>
            ))}
          </ol>
        </section>
        <div className="brief-side">
          <HrCard id="brief-hr" heading="h2" />
          <ContactLinks id="brief" />
        </div>
        <section
          className="card glass brief-projects"
          data-s
          aria-labelledby="brief-projects-title"
        >
          <div className="card-top">
            <h2 className="card-h" id="brief-projects-title">
              Проекты
            </h2>
            <a className="more" href="#projects">
              Подробнее <span aria-hidden="true">→</span>
            </a>
          </div>
          <ul className="showcase">
            {PROJECTS.map((p) => (
              <li key={p.id}>
                <a href={`#project-${p.id}`}>
                  <span className="tl-when">{p.group}</span>
                  <b>
                    {p.title}
                    <span className="tl-go" aria-hidden="true">
                      →
                    </span>
                  </b>
                  <span className="tl-sum">{p.headline}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
