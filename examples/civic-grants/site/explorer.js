(function () {
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
          const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
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
