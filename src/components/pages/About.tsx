import { CvButton, TrackedLink } from '@/components/Actions';
import { ContactLinks, HrCard } from '@/components/ContactCards';
import { Portrait } from '@/components/Portrait';
import { RotWord } from '@/components/RotWord';
import { FACTS, QUESTS, SITE } from '@/content/profile';

/** Витрина: всё главное на одной странице, остальные вкладки — подробности. */
export function About() {
  return (
    <div className="wrap home">
      <div className="home-top">
        <div className="hero glass" data-s>
          <p className="eyebrow">
            <span className="status">
              <i aria-hidden="true" />
              Рассматриваю предложения
            </span>
            <span>{SITE.city} · офис или удалённо</span>
          </p>
          <TrackedLink
            achievement="window"
            className="who"
            href={`https://github.com/${SITE.github}`}
          >
            <b>{SITE.name}</b>
            <span>{SITE.role}</span>
          </TrackedLink>
          <h1 id="page-about-title">
            Делаю интерфейсы, которые <RotWord />
          </h1>
          <p className="lead">
            Восемь лет пишу интерфейсы, последние годы на Next.js, React и TypeScript:
            UI-библиотеки, производительность, SEO.
          </p>
          <div className="actions">
            <a className="btn btn-accent" href="#experience">
              Смотреть опыт{' '}
              <span className="arr" aria-hidden="true">
                →
              </span>
            </a>
            <CvButton className="btn" />
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
                  <span className="tl-when">{q.period}</span>
                  <b>
                    {q.role} · {q.company}
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
      </div>
    </div>
  );
}
