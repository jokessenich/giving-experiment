export function Footer() {
  const year = new Date().getFullYear().toString().slice(-2);
  return (
    <footer className="bene">
      <div className="stamp">
        <div className="stamp-inner">passed<br />along<br />·{year}·</div>
      </div>
      <div className="words">
        Sometimes are tough, sometimes are smooth, but together we can always make it through.
        <span className="colophon">the giving experiment · est. 2026</span>
      </div>
    </footer>
  );
}
