export const EXPLORER_CSS_TEMPLATE = `:root {
  --bg: #f7f6f2;
  --surface: #efece4;
  --ink: #1e1d1b;
  --muted: #5c5852;
  --line: #d4cfc3;
  --accent: #98513c;
  --accent-soft: #efe3de;
  --slate: #2d546b;
  --amber: #7a5a18;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font: 17px/1.62 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.frame { max-width: 1120px; margin: 0 auto; padding: 0 24px; }
html.is-embed .report-chrome { display: none !important; }
html.is-embed .explorer-section { padding-top: 12px; }

.subnav {
  position: sticky; top: 0; z-index: 20;
  background: rgba(247, 246, 242, 0.95);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(6px);
}
.subnav-inner { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 24px; }
.subnav-links { display: flex; gap: 16px; overflow-x: auto; white-space: nowrap; font: 600 12px/1 ui-monospace, monospace; text-transform: uppercase; letter-spacing: .06em; }
.subnav-links a { color: var(--muted); text-decoration: none; }
.subnav-cta { flex-shrink: 0; border: 1px solid var(--accent); color: var(--accent); padding: 6px 10px; font: 700 12px/1 ui-monospace, monospace; text-decoration: none; text-transform: uppercase; }

.hero { padding: 44px 24px 28px; border-bottom: 1px solid var(--line); }
.kicker { font: 700 12px/1.4 ui-monospace, monospace; letter-spacing: .09em; text-transform: uppercase; color: var(--accent); }
.hero h1 { font: 700 clamp(32px, 4.6vw, 54px)/1.08 Georgia, serif; margin: 12px 0 18px; letter-spacing: -.02em; }
.lead-grid { display: grid; grid-template-columns: 1.35fr 1fr; gap: 28px; align-items: start; }
.meta-box { background: var(--surface); border-top: 2px solid var(--ink); padding: 16px 18px; font-size: 14px; }
.meta-box ul { margin: 8px 0 0; padding-left: 18px; }
.meta-more { margin-top: 10px; border-top: 1px dashed var(--line); padding-top: 8px; }
.meta-more summary { cursor: pointer; font: 700 12px/1.4 ui-monospace, monospace; color: var(--accent); text-transform: uppercase; }

.findings { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-top: 26px; }
.finding { background: var(--surface); border: 1px solid var(--line); padding: 16px; }
.finding-num { display: block; font: 700 34px/1.1 Georgia, serif; color: var(--ink); }
.finding-label { display: block; font-size: 14px; margin-top: 6px; color: var(--muted); }

.chapter { padding: 36px 24px; border-bottom: 1px solid var(--line); }
.chapter h2 { font: 700 28px/1.2 Georgia, serif; margin: 6px 0 14px; }
.specimen-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-top: 18px; }
.specimen-card { border: 1px solid var(--ink); background: #fffdf8; padding: 16px; font-size: 14px; }
.specimen-line { display: flex; justify-content: space-between; gap: 8px; padding: 6px 8px; background: var(--surface); margin-top: 6px; font-family: ui-monospace, monospace; font-size: 12.5px; }
.specimen-line.is-error { background: var(--accent-soft); border: 1px solid var(--accent); color: var(--accent); font-weight: 700; }

.explorer-section { padding: 36px 0 56px; }
.lenses { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 12px 14px; background: #fffdf8; border: 1px solid var(--line); border-left: 3px solid var(--accent); margin-bottom: 14px; }
html.is-embed .lenses { display: none; }
.lens-btn { border: 1px solid var(--line); background: var(--bg); padding: 6px 10px; font: 600 12px/1.2 ui-monospace, monospace; cursor: pointer; color: var(--ink); }
.lens-btn.is-active { background: var(--ink); color: var(--bg); border-color: var(--ink); }

.kpi-strip { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); border: 1px solid var(--ink); background: var(--surface); margin-bottom: 14px; }
.kpi-cell { padding: 14px; border-right: 1px solid var(--line); }
.kpi-cell:last-child { border-right: 0; }
.kpi-cell small { display: block; font: 700 11px/1.2 ui-monospace, monospace; text-transform: uppercase; color: var(--muted); }
.kpi-cell strong { display: block; font: 700 26px/1.2 Georgia, serif; margin-top: 4px; }

.toolbar { display: flex; flex-wrap: wrap; gap: 10px; padding: 14px; background: var(--surface); border: 1px solid var(--line); margin-bottom: 14px; align-items: center; }
.toolbar input[type="search"], .toolbar select { padding: 8px 10px; border: 1px solid var(--ink); background: #fff; font-size: 14px; }
.toolbar input[type="search"] { flex: 1 1 240px; }
.util-btn { border: 1px solid var(--ink); background: var(--bg); padding: 7px 11px; font: 700 11.5px/1 ui-monospace, monospace; text-transform: uppercase; cursor: pointer; }

.exp-row { display: grid; grid-template-columns: 120px 1.1fr 1.6fr 140px 82px; gap: 14px; padding: 14px 10px; border-bottom: 1px solid var(--line); align-items: start; font-size: 14.5px; }
.exp-row.is-head { font: 700 11.5px/1.2 ui-monospace, monospace; text-transform: uppercase; color: var(--muted); border-bottom: 2px solid var(--ink); }
.badge { display: inline-block; padding: 2px 6px; font: 700 11px/1.3 ui-monospace, monospace; border: 1px solid var(--line); margin-right: 6px; margin-top: 4px; }
.badge.is-sole { color: var(--amber); border-color: var(--amber); background: #fbf5e6; }
.badge.is-alert { color: var(--accent); border-color: var(--accent); background: var(--accent-soft); }
.src-link { display: inline-block; border: 1px solid var(--line); padding: 5px 8px; font: 700 11.5px/1 ui-monospace, monospace; color: var(--ink); text-decoration: none; text-align: center; }

@media (max-width: 1024px) {
  .lead-grid, .specimen-grid { grid-template-columns: 1fr; }
  .findings { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .exp-row { grid-template-columns: 104px 1fr 1.3fr 124px 74px; gap: 10px; }
}
@media (max-width: 760px) {
  .findings { grid-template-columns: 1fr; }
  .kpi-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .kpi-cell:last-child { grid-column: 1 / -1; }
  .exp-row.is-head { display: none; }
  .exp-row { grid-template-columns: 1fr; gap: 6px; padding: 14px 0; }
}
@media print {
  .subnav, .lenses, .toolbar { display: none !important; }
  .specimen-grid { grid-template-columns: 1fr; }
}
`;

export const EXPLORER_JS_TEMPLATE = `(function () {
  const mount = document.getElementById('data-explorer');
  if (!mount) return;
  const src = mount.getAttribute('data-src') || '../data/records.json';
  const currency = mount.getAttribute('data-currency') || 'USD';

  const state = {
    q: '',
    status: 'all',
    cat: '',
    single: false,
    sole: false,
    grant: false,
    pure: false,
    incidental: false
  };

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtMoney(n) {
    if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M ' + currency;
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k ' + currency;
    return n.toFixed(0) + ' ' + currency;
  }

  function applyQuery(qs) {
    const p = new URLSearchParams(qs);
    state.q = p.get('q') || '';
    state.status = p.get('status') || 'all';
    state.cat = p.get('cat') || '';
    state.single = p.get('single') === '1';
    state.sole = p.get('sole') === '1';
    state.grant = p.get('grant') === '1';
    state.pure = p.get('pure') === '1';
    state.incidental = p.get('incidental') === '1' || state.cat === 'incidental';
  }

  function toQuery() {
    const p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    if (state.status && state.status !== 'all') p.set('status', state.status);
    if (state.cat) p.set('cat', state.cat);
    if (state.single) p.set('single', '1');
    if (state.sole) p.set('sole', '1');
    if (state.grant) p.set('grant', '1');
    if (state.pure) p.set('pure', '1');
    if (state.incidental) p.set('incidental', '1');
    if (location.search.includes('embed=1')) p.set('embed', '1');
    return p.toString();
  }

  function matches(r) {
    if (!state.incidental && (r.category === 'incidental' || r.scope === 'incidental')) return false;
    if (state.pure && r.scope === 'mixed') return false;
    if (state.status !== 'all' && r.status !== state.status) return false;
    if (state.cat && r.category !== state.cat) return false;
    if (state.single && r.bidCount !== 1) return false;
    if (state.sole && !(r.status === 'resolved' && (r.awardMode === 'sole_source' || r.bidCount === null))) return false;
    if (state.grant && !r.grantFunded) return false;
    if (state.q) {
      const hay = [r.id, r.title, r.buyer, r.city, r.region, r.sector, ...(r.vendors || [])].join(' ').toLowerCase();
      if (!hay.includes(state.q.toLowerCase())) return false;
    }
    return true;
  }

  fetch(src)
    .then((res) => res.json())
    .then((records) => {
      applyQuery(location.search);

      function render() {
        const filtered = records.filter(matches);
        const signed = filtered.filter((r) => r.status === 'resolved' && typeof r.amount === 'number');
        const sum = signed.reduce((a, r) => a + r.amount, 0);
        const withBids = signed.filter((r) => Number.isInteger(r.bidCount));
        const singleBids = withBids.filter((r) => r.bidCount === 1);
        const singlePct = withBids.length ? ((singleBids.length / withBids.length) * 100).toFixed(1) : '0.0';
        const grantSigned = signed.filter((r) => r.grantFunded);
        const grantPct = signed.length ? ((grantSigned.length / signed.length) * 100).toFixed(1) : '0.0';

        const coreCount = records.filter((r) => r.category !== 'incidental' && r.scope !== 'incidental').length;
        const soleCount = records.filter((r) => r.category !== 'incidental' && r.status === 'resolved' && r.awardMode === 'sole_source').length;
        const pureCount = records.filter((r) => r.category !== 'incidental' && (r.scope || 'pure') === 'pure').length;
        const incCount = records.filter((r) => r.category === 'incidental' || r.scope === 'incidental').length;

        mount.innerHTML =
          '<div class="lenses" role="toolbar" aria-label="Quick investigative lenses">' +
            '<span style="font:700 11px/1 ui-monospace,monospace;color:var(--accent);text-transform:uppercase">Quick lenses:</span>' +
            '<button type="button" class="lens-btn' + (!state.sole && !state.single && !state.pure && !state.incidental && !state.cat ? ' is-active' : '') + '" data-lens="all">All core (' + coreCount + ')</button>' +
            '<button type="button" class="lens-btn' + (state.single ? ' is-active' : '') + '" data-lens="single">Single-bid awards</button>' +
            '<button type="button" class="lens-btn' + (state.sole ? ' is-active' : '') + '" data-lens="sole">Sole-source (' + soleCount + ')</button>' +
            '<button type="button" class="lens-btn' + (state.pure ? ' is-active' : '') + '" data-lens="pure">Pure scope (' + pureCount + ')</button>' +
            '<button type="button" class="lens-btn' + (state.incidental ? ' is-active' : '') + '" data-lens="inc">Incidental (' + incCount + ')</button>' +
          '</div>' +
          '<div class="kpi-strip">' +
            '<div class="kpi-cell"><small>Records in view</small><strong>' + filtered.length + '</strong></div>' +
            '<div class="kpi-cell"><small>Signed contracts</small><strong>' + signed.length + '</strong></div>' +
            '<div class="kpi-cell"><small>Signed gross value</small><strong>' + esc(fmtMoney(sum)) + '</strong></div>' +
            '<div class="kpi-cell"><small>Single-bid share</small><strong>' + singlePct + '%</strong></div>' +
            '<div class="kpi-cell"><small>Grant-backed</small><strong>' + grantPct + '%</strong></div>' +
          '</div>' +
          '<div class="toolbar">' +
            '<input type="search" id="exp-q" placeholder="Search buyer, vendor, city, ID..." value="' + esc(state.q) + '">' +
            '<label><input type="checkbox" id="exp-single"' + (state.single ? ' checked' : '') + '> Single-bid only</label>' +
            '<label><input type="checkbox" id="exp-pure"' + (state.pure ? ' checked' : '') + '> Pure scope only</label>' +
            '<button type="button" class="util-btn" id="exp-csv">Export CSV (' + filtered.length + ')</button>' +
            '<button type="button" class="util-btn" id="exp-quote">Copy quote + link</button>' +
            '<button type="button" class="util-btn" id="exp-embed">Copy iframe</button>' +
          '</div>' +
          '<div class="exp-row is-head"><div>Date / ID</div><div>Buyer</div><div>Scope &amp; Vendor</div><div style="text-align:right">Value / Bids</div><div style="text-align:right">Source</div></div>' +
          filtered.map((r) => {
            const bidBadge = r.status !== 'resolved'
              ? '<span class="badge">' + esc(r.status) + '</span>'
              : r.awardMode === 'sole_source'
                ? '<span class="badge is-sole">sole-source (no open tender)</span>'
                : r.bidCount === 1
                  ? '<span class="badge is-alert">1 bid</span>'
                  : '<span class="badge">' + esc(r.bidCount + ' bids') + '</span>';
            return (
              '<div class="exp-row">' +
                '<div style="font:12px/1.4 ui-monospace,monospace;color:var(--muted)">' + esc(r.publishedDate || '') + '<br>' + esc(r.id) + '</div>' +
                '<div><strong>' + esc(r.buyer) + '</strong><br><small style="color:var(--muted)">' + esc([r.city, r.region, r.sector].filter(Boolean).join(' · ')) + '</small></div>' +
                '<div>' + esc(r.title) +
                  (r.scope === 'mixed' ? '<div><span class="badge">mixed scope</span></div>' : '') +
                  (r.auditNote ? '<div style="font-size:12.5px;color:var(--accent);margin-top:4px">' + esc(r.auditNote) + '</div>' : '') +
                  (r.vendors && r.vendors.length ? '<div style="font-size:13px;color:var(--muted);margin-top:4px">Vendor: ' + esc(r.vendors.join('; ')) + '</div>' : '') +
                '</div>' +
                '<div style="text-align:right;font-family:ui-monospace,monospace"><strong>' + esc(fmtMoney(r.amount)) + '</strong><br>' + bidBadge + '</div>' +
                '<div style="text-align:right"><a class="src-link" href="' + esc(r.sourceUrl) + '" target="_blank" rel="noopener noreferrer">Filing ↗</a></div>' +
              '</div>'
            );
          }).join('');

        mount.querySelector('#exp-q').addEventListener('input', (e) => {
          state.q = e.target.value;
          render();
        });
        mount.querySelector('#exp-single').addEventListener('change', (e) => {
          state.single = e.target.checked;
          render();
        });
        mount.querySelector('#exp-pure').addEventListener('change', (e) => {
          state.pure = e.target.checked;
          render();
        });
        mount.querySelectorAll('[data-lens]').forEach((btn) => {
          btn.addEventListener('click', () => {
            const l = btn.getAttribute('data-lens');
            state.single = l === 'single';
            state.sole = l === 'sole';
            state.pure = l === 'pure';
            state.incidental = l === 'inc';
            state.cat = l === 'inc' ? 'incidental' : '';
            render();
          });
        });
        mount.querySelector('#exp-quote').addEventListener('click', (e) => {
          const qs = toQuery();
          const url = location.origin + location.pathname + (qs ? '?' + qs : '') + '#explorer';
          const text = 'Audited public records: ' + filtered.length + ' proceedings (' + signed.length + ' signed contracts totaling ' + fmtMoney(sum) + '). Source filings: ' + url;
          navigator.clipboard?.writeText(text);
          e.target.textContent = 'Copied quote!';
          setTimeout(() => { e.target.textContent = 'Copy quote + link'; }, 1600);
        });
        mount.querySelector('#exp-embed').addEventListener('click', (e) => {
          const embedUrl = location.origin + location.pathname + '?embed=1';
          const snippet = '<iframe src="' + embedUrl + '" width="100%" height="760" style="border:1px solid #d4cfc3" loading="lazy"></iframe>';
          navigator.clipboard?.writeText(snippet);
          e.target.textContent = 'Copied iframe!';
          setTimeout(() => { e.target.textContent = 'Copy iframe'; }, 1600);
        });
        mount.querySelector('#exp-csv').addEventListener('click', () => {
          const header = ['id', 'publishedDate', 'buyer', 'category', 'scope', 'status', 'amount', 'bidCount', 'awardMode', 'sourceUrl'];
          const rows = [header.join(',')].concat(
            filtered.map((r) => header.map((h) => '"' + String(r[h] ?? '').replace(/"/g, '""') + '"').join(','))
          );
          const blob = new Blob([rows.join('\\n')], { type: 'text/csv;charset=utf-8' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'audited-records.csv';
          a.click();
        });
      }

      document.querySelectorAll('[data-preset]').forEach((a) => {
        a.addEventListener('click', (ev) => {
          ev.preventDefault();
          applyQuery(a.getAttribute('data-preset'));
          render();
          document.getElementById('explorer')?.scrollIntoView({ behavior: 'smooth' });
        });
      });

      window.addEventListener('beforeprint', () => {
        document.querySelectorAll('details.meta-more').forEach((d) => d.setAttribute('open', 'open'));
      });

      render();
    });
})();
`;
