import { KNOWS_ABOUT, QUESTS, SITE } from '@/content/profile';

/** Микроразметка Schema.org: по ней Google и Яндекс понимают, что это страница профиля человека. */
export function JsonLd() {
  const person = {
    '@type': 'Person',
    '@id': `${SITE.url}#person`,
    name: SITE.name,
    jobTitle: SITE.role,
    description: SITE.description,
    url: SITE.url,
    image: new URL('og.png', SITE.url).toString(),
    email: `mailto:${SITE.email}`,
    address: { '@type': 'PostalAddress', addressLocality: SITE.city, addressCountry: 'RU' },
    worksFor: { '@type': 'Organization', name: QUESTS[0].company },
    knowsAbout: KNOWS_ABOUT,
    knowsLanguage: 'ru',
    sameAs: [`https://github.com/${SITE.github}`, `https://t.me/${SITE.telegram}`],
  };
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${SITE.url}#page`,
        url: SITE.url,
        name: SITE.title,
        inLanguage: 'ru',
        mainEntity: { '@id': person['@id'] },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE.url}#site`,
        url: SITE.url,
        name: SITE.name,
        inLanguage: 'ru',
      },
      person,
    ],
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
