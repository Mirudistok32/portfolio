/** Часы, когда я на связи. Подробности — в подсказке и на «Контактах»; на телефоне часы прячутся, там тесно. */
export function Clock() {
  return (
    <div className="clock solid" title="На связи с 10:00 до 19:00 по Москве (UTC+3)">
      <svg className="flame" viewBox="0 0 5 7" shapeRendering="crispEdges" aria-hidden="true">
        <path fill="#F28C38" d="M2 0h1v1H2zM1 1h3v2H1zM0 3h5v3H0zM1 6h3v1H1z" />
        <path fill="#F0C866" d="M2 3h1v1H2zM1 4h3v2H1z" />
      </svg>
      <span>
        <b>10:00–19:00</b> МСК
      </span>
    </div>
  );
}
