/**
 * «Апрель 2021 — октябрь 2024 · 3 года 7 месяцев»: на узком экране строка переносится только после
 * тире или точки, а не посреди даты («апрель / 2021») или срока («3 года 7 / месяцев»).
 */
export function Period({ text }: { text: string }) {
  const [dates, length] = text.split(' · ');
  const glued = dates.replace(/ (?=\d)/g, ' ').replace(' — ', ' — ');
  return (
    <>
      {glued}
      {length && (
        <>
          {' · '}
          <span className="nw">{length}</span>
        </>
      )}
    </>
  );
}
