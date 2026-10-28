/** Часовой пояс и часы, когда я на связи. */
export function Clock() {
  return (
    <div
      className="clock solid"
      title="Доступен с 10:00 до 19:00 UTC+3 (по мск), могу отвечать с задержкой"
    >
      <svg className="flame" viewBox="0 0 5 7" shapeRendering="crispEdges" aria-hidden="true">
        <path fill="#F28C38" d="M2 0h1v1H2zM1 1h3v2H1zM0 3h5v3H0zM1 6h3v1H1z" />
        <path fill="#F0C866" d="M2 3h1v1H2zM1 4h3v2H1z" />
      </svg>
      <span className="clock-text">
        <span>
          UTC+3 <span className="sep">·</span> <b>10:00–19:00</b>
        </span>
        <small>могу отвечать с задержкой</small>
      </span>
    </div>
  );
}
