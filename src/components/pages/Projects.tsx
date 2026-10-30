import Image, { type StaticImageData } from 'next/image';

import filmCourse from '@/assets/projects/film-course.webp';
import fizkulture from '@/assets/projects/fizkulture.webp';
import fogShepherd from '@/assets/projects/fog-shepherd.webp';
import miller from '@/assets/projects/miller.webp';
import mindforge from '@/assets/projects/mindforge.webp';
import pigeonPost from '@/assets/projects/pigeon-post.webp';
import {
  type Project,
  PROJECT_GROUPS,
  PROJECT_VPN_NOTE,
  PROJECTS,
  PROJECTS_AUTHORSHIP,
} from '@/content/profile';
import { needsVpn } from '@/lib/projects';

const SHOTS: Record<string, StaticImageData> = {
  'film-course': filmCourse,
  mindforge,
  'fog-shepherd': fogShepherd,
  miller,
  'pigeon-post': pigeonPost,
  fizkulture,
};

function ProjectCard({ project: p }: { project: Project }) {
  return (
    <article
      id={`project-${p.id}`}
      tabIndex={-1}
      aria-labelledby={`project-${p.id}-title`}
      className="pr-card glass"
    >
      <div className="pr-in">
        <Image className="pr-shot" src={SHOTS[p.id]} alt={p.shot} />
        <div className="pr-body">
          <h4 id={`project-${p.id}-title`}>{p.title}</h4>
          <p className="pr-about">{p.about}</p>
          <ul className="chips" aria-label="Стек">
            {p.stack.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <div className="pr-links">
            <a
              className="btn btn-accent btn-sm"
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Открыть<span className="sr-only"> «{p.title}» в новой вкладке</span>{' '}
              <span aria-hidden="true">↗</span>
            </a>
            {p.repo && (
              <a className="btn btn-sm" href={p.repo} target="_blank" rel="noopener noreferrer">
                Код<span className="sr-only"> «{p.title}» в новой вкладке</span>{' '}
                <span aria-hidden="true">↗</span>
              </a>
            )}
            {needsVpn(p.url) && <p className="pr-vpn">{PROJECT_VPN_NOTE}</p>}
          </div>
        </div>
      </div>
    </article>
  );
}

export function Projects() {
  return (
    <div className="wrap">
      <header className="page-head glass" data-s>
        <h2 id="page-projects-title">Проекты</h2>
        <p>{PROJECTS_AUTHORSHIP}</p>
      </header>
      {PROJECT_GROUPS.map((group) => (
        <section key={group} className="pr-group" aria-labelledby={`projects-${group}`} data-s>
          <h3 className="pr-group-h solid" id={`projects-${group}`}>
            {group}
          </h3>
          <div className="pr-grid">
            {PROJECTS.filter((p) => p.group === group).map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
