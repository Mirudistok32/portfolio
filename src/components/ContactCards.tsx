import { CopyButton, HrCopy, TrackedLink } from '@/components/Actions';
import { HR_JOKE, HR_ROWS, SITE } from '@/content/profile';

/** Блоки стоят и на витрине, и на «Контактах», поэтому id внутри собираются из префикса. */

const [mailUser, mailHost] = SITE.email.split('@');

export function ContactLinks({ id }: { id: string }) {
  return (
    <ul className="links">
      <li data-s>
        <TrackedLink
          achievement="tg"
          className="link primary"
          href={`https://t.me/${SITE.telegram}`}
        >
          <span className="ic" aria-hidden="true">
            TG
          </span>
          <span className="t">
            <small>Telegram · отвечаю быстрее всего</small>
            <b>@{SITE.telegram}</b>
          </span>
          <span className="arr" aria-hidden="true">
            ↗
          </span>
        </TrackedLink>
      </li>
      <li data-s>
        {/* два действия: адрес открывает почтовую программу, кнопка рядом копирует его */}
        <div className="link glass">
          <a className="link-main" href={`mailto:${SITE.email}`}>
            <span className="ic ic-violet" aria-hidden="true">
              @
            </span>
            <span className="t">
              <small>Почта</small>
              {/* в узкой карточке адрес переносится перед «@», а не посреди имени */}
              <b id={`${id}-mail`}>
                {mailUser}
                <wbr />@{mailHost}
              </b>
            </span>
          </a>
          <CopyButton
            text={SITE.email}
            message="Почта скопирована. Жду письмо, а не рассылку."
            fallbackId={`${id}-mail`}
            label="Скопировать почту"
          />
        </div>
      </li>
      <li data-s>
        <TrackedLink
          achievement="window"
          className="link glass"
          href={`https://github.com/${SITE.github}`}
        >
          <span className="ic ic-teal" aria-hidden="true">
            GH
          </span>
          <span className="t">
            <small>GitHub</small>
            <b>{SITE.github}</b>
          </span>
          <span className="arr" aria-hidden="true">
            ↗
          </span>
        </TrackedLink>
      </li>
    </ul>
  );
}

export function HrCard({ id, heading: H }: { id: string; heading: 'h2' | 'h3' }) {
  return (
    <section className="hr glass" data-s aria-labelledby={`${id}-title`}>
      <div className="hr-head">
        <H id={`${id}-title`}>Коротко для HR</H>
        <span>30 секунд</span>
      </div>
      <dl id={`${id}-list`}>
        {[...HR_ROWS, HR_JOKE].map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <HrCopy rows={HR_ROWS} listId={`${id}-list`} />
    </section>
  );
}
