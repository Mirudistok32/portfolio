'use client';

import { type ReactNode } from 'react';

import { SITE } from '@/content/profile';
import { unlock } from '@/lib/achievements';
import { copyText } from '@/lib/copy';

import { CopyIcon } from './icons';

/**
 * Резюме: ссылка на PDF, если он лежит в public/. Пока его нет — честная кнопка «Запросить резюме»,
 * которая ведёт в Telegram, а не обещает PDF.
 */
export function CvButton({ className, compact }: { className: string; compact?: boolean }) {
  const label = SITE.cv ? 'Резюме в PDF' : 'Запросить резюме';
  // В шапке на телефоне места мало: там остаётся просто «Резюме»
  const text = compact ? (
    <>
      <span className="cv-long">{label}</span>
      <span className="cv-short">Резюме</span>
    </>
  ) : (
    label
  );
  if (SITE.cv)
    return (
      <a className={className} href={SITE.cv} download>
        {text}
      </a>
    );
  return (
    <TrackedLink achievement="tg" className={className} href={`https://t.me/${SITE.telegram}`}>
      {text}
    </TrackedLink>
  );
}

/** Внешняя ссылка, которая заодно открывает ачивку. */
export function TrackedLink({
  achievement,
  className,
  href,
  children,
}: {
  achievement: string;
  className: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => unlock(achievement)}
    >
      {children}
    </a>
  );
}

/** Кнопка «Скопировать» со значком; в узкой карточке остаётся только значок (см. .links в CSS). */
export function CopyButton({
  text,
  message,
  fallbackId,
  label,
}: {
  text: string;
  message: string;
  fallbackId: string;
  /** Полное имя кнопки для скринридера и подсказки, например «Скопировать почту». */
  label: string;
}) {
  return (
    <button
      type="button"
      className="btn btn-sm btn-icon"
      aria-label={label}
      title={label}
      onClick={() => copyText(text, message, document.getElementById(fallbackId))}
    >
      <CopyIcon />
      <span className="btn-t">Скопировать</span>
    </button>
  );
}

export function HrCopy({ rows, listId }: { rows: [string, string][]; listId: string }) {
  return (
    <button
      type="button"
      className="btn"
      onClick={() =>
        copyText(
          [
            SITE.name,
            ...rows.map(([k, v]) => `${k}: ${v}`),
            `Почта: ${SITE.email}`,
            `Telegram: t.me/${SITE.telegram}`,
          ].join('\n'),
          'Профиль скопирован: имя, опыт, стек и контакты.',
          document.getElementById(listId),
          () => unlock('hr'),
        )
      }
    >
      Скопировать профиль
    </button>
  );
}
