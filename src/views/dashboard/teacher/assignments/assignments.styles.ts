const CSS = `
  @keyframes as-fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
  @keyframes as-spin { to{transform:rotate(360deg)} }
  @keyframes as-overlay     { from{opacity:0} to{opacity:1} }
  @keyframes as-overlay-out { from{opacity:1} to{opacity:0} }
  @keyframes as-drawer-in   { from{transform:translateX(100%)} to{transform:translateX(0)} }
  @keyframes as-drawer-out  { from{transform:translateX(0)} to{transform:translateX(100%)} }

  /* ── Sticky header ─────────────────────────────────────── */
  .as-list-hdr {
    background:#fff;border-bottom:1.5px solid #e7ecf3;
    box-shadow:0 2px 10px rgba(15,23,42,.05);
    padding:16px 32px;
  }
  .as-list-content { padding:24px 32px 52px; }
  .as-list-hdr-row { display:flex;align-items:flex-end;gap:16px;flex-wrap:wrap; }
  .as-list-hdr-title { margin:0;font-size:23px;font-weight:800;letter-spacing:-.4px;color:#0f172a; }

  /* ── Table card (list) ─────────────────────────────────── */
  .as-table-card { background:#fff;border:1px solid #e7ecf3;border-radius:16px;overflow:hidden; }
  .as-table-head {
    display:grid;grid-template-columns:minmax(0,2.6fr) 1fr 1.6fr 1.2fr;gap:12px;
    padding:13px 20px;background:#f8fafc;border-bottom:1px solid #eef2f7;
    font-size:11.5px;font-weight:700;letter-spacing:.4px;color:#94a3b8;text-transform:uppercase;
  }
  .as-table-row {
    display:grid;grid-template-columns:minmax(0,2.6fr) 1fr 1.6fr 1.2fr;gap:12px;
    padding:15px 20px;border-bottom:1px solid #f1f5f9;align-items:center;cursor:pointer;
    transition:background .13s;animation:as-fade .3s ease both;
  }
  .as-table-row:last-child { border-bottom:none; }
  .as-table-row:hover { background:#fbfcfe; }

  /* ── Buttons ────────────────────────────────────────────── */
  .as-btn {
    height:42px;padding:0 16px;border-radius:11px;
    font-family:inherit;font-size:13.5px;font-weight:700;cursor:pointer;
    display:inline-flex;align-items:center;gap:8px;
    transition:filter .13s, background .13s;white-space:nowrap;border:none;
  }
  .as-btn:disabled { opacity:.5;cursor:not-allowed; }
  .as-btn.primary  { background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;box-shadow:0 10px 22px rgba(37,99,235,.28); }
  .as-btn.primary:hover:not(:disabled) { filter:brightness(1.06); }
  .as-btn.outline-blue { background:#eff5ff;color:#2563eb;border:1px solid #bfdbfe; }
  .as-btn.outline-blue:hover:not(:disabled) { background:#dbeafe; }
  .as-btn.outline-gray { background:#fff;color:#475569;border:1px solid #e7ecf3; }
  .as-btn.outline-gray:hover:not(:disabled) { background:#f8fafc; }
  .as-btn.outline-amber { background:#fff;color:#64748b;border:1px solid #e7ecf3; }
  .as-btn.outline-amber:hover:not(:disabled) { background:#fffbeb;color:#b45309;border-color:#fde68a; }
  .as-btn.outline-red { background:#fff;color:#dc2626;border:1px solid #fecaca; }
  .as-btn.outline-red:hover:not(:disabled) { background:#fef2f2; }

  /* ── Sub-header (detail) ────────────────────────────────── */
  .as-back-link {
    display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;
    color:#94a3b8;cursor:pointer;margin-bottom:14px;background:none;border:none;padding:0;font-family:inherit;
    transition:color .13s;
  }
  .as-back-link:hover { color:#2563eb; }

  .as-summary-card { background:#fff;border:1px solid #e7ecf3;border-radius:16px;padding:18px 22px;margin-bottom:18px;animation:as-fade .3s ease both; }

  /* ── Grids ──────────────────────────────────────────────── */
  .as-detail-grid { display:grid;grid-template-columns:300px minmax(0,1fr);gap:18px;align-items:start; }

  /* ── Left rail: sticky on desktop, drawer on mobile ────── */
  .as-rail { display:flex;flex-direction:column;gap:16px;position:sticky;top:24px;align-self:start; }
  .as-rail-fab { display:none; }

  .as-drawer-overlay {
    position:fixed;inset:0;z-index:200;background:rgba(15,23,42,.45);backdrop-filter:blur(2px);
  }
  .as-drawer-panel {
    position:fixed;top:0;right:0;bottom:0;width:min(380px,100vw);background:#fff;z-index:201;
    display:flex;flex-direction:column;box-shadow:-16px 0 40px rgba(15,23,42,.18);
    font-family:'Be Vietnam Pro',system-ui,sans-serif;
  }
  .as-drawer-head {
    display:flex;align-items:center;justify-content:space-between;padding:16px 20px;
    border-bottom:1px solid #f1f5f9;flex-shrink:0;
  }
  .as-drawer-close {
    width:32px;height:32px;border-radius:9px;border:1px solid #e7ecf3;background:#fff;
    cursor:pointer;display:flex;align-items:center;justify-content:center;color:#64748b;
  }
  .as-drawer-body { flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:16px; }

  @media(max-width:900px) {
    .as-detail-grid { grid-template-columns:1fr; }
    .as-rail { display:none; }
    .as-rail-fab {
      display:flex;align-items:center;gap:8px;
      position:fixed;bottom:24px;right:20px;z-index:50;
      height:48px;padding:0 20px;border-radius:999px;
      background:linear-gradient(135deg,#2563eb,#1d4ed8);
      color:#fff;font-family:inherit;font-size:14px;font-weight:700;
      border:none;cursor:pointer;box-shadow:0 8px 24px rgba(37,99,235,.38);
      transition:filter .13s;
    }
    .as-rail-fab:hover { filter:brightness(1.07); }
  }

  /* ── Rail cards (quick actions / edit) ─────────────────── */
  .as-rail-card { background:#fff;border:1px solid #e7ecf3;border-radius:16px;padding:16px 18px; }
  .as-rail-label { font-size:11px;font-weight:700;letter-spacing:.5px;color:#94a3b8;text-transform:uppercase;margin-bottom:12px; }
  .as-input {
    width:100%;height:42px;border:1px solid #e7ecf3;border-radius:11px;
    padding:0 12px;font-family:inherit;font-size:13.5px;color:#334155;
    outline:none;box-sizing:border-box;transition:border-color .15s;margin-bottom:13px;
  }
  .as-input:focus { border-color:#93c5fd; }
  .as-field-label { display:block;font-size:11px;font-weight:700;letter-spacing:.4px;color:#475569;text-transform:uppercase;margin-bottom:6px; }
  .as-seg {
    height:42px;border-radius:11px;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;
    display:flex;align-items:center;justify-content:center;gap:7px;border:1.5px solid;transition:all .13s;
  }

  /* ── Gradebook card ─────────────────────────────────────── */
  .as-gradebook-card { background:#fff;border:1px solid #e7ecf3;border-radius:16px;overflow:hidden; }

  /* Toolbar: search + filter dropdown */
  .as-gb-toolbar { padding:14px 18px;border-bottom:1px solid #eef2f7;display:flex;gap:10px;flex-wrap:wrap; }
  .as-gb-search-wrap { position:relative;flex:1 1 220px;min-width:0; }
  .as-gb-search {
    width:100%;height:40px;border:1px solid #e7ecf3;background:#fff;border-radius:10px;
    padding:0 12px 0 34px;font-family:inherit;font-size:13px;color:#334155;outline:none;transition:border-color .15s;
    box-sizing:border-box;
  }
  .as-gb-search:focus { border-color:#93c5fd; }

  .as-gb-dropdown { position:relative;flex:0 0 200px; }
  .as-gb-dropdown-trigger {
    width:100%;height:40px;display:flex;align-items:center;justify-content:space-between;
    gap:8px;padding:0 12px;border:1px solid #e7ecf3;border-radius:10px;
    background:#fff;font-family:inherit;font-size:13px;color:#334155;font-weight:600;
    cursor:pointer;transition:border-color .15s;text-align:left;
  }
  .as-gb-dropdown-trigger:focus, .as-gb-dropdown-trigger[aria-expanded="true"] { border-color:#93c5fd;outline:none; }
  .as-gb-dropdown-menu {
    position:absolute;top:calc(100% + 6px);left:0;right:0;
    background:#fff;border:1px solid #e7ecf3;border-radius:12px;
    box-shadow:0 10px 30px rgba(15,23,42,.12);z-index:20;overflow:hidden;
    animation:as-fade .15s ease;
  }
  .as-gb-dropdown-item {
    display:flex;align-items:center;justify-content:space-between;
    padding:10px 14px;font-size:13.5px;font-weight:600;color:#334155;
    cursor:pointer;transition:background .1s;gap:8px;
  }
  .as-gb-dropdown-item:hover  { background:#f8fbff; }
  .as-gb-dropdown-item.active { background:#eff5ff;color:#1d4ed8; }

  .as-gb-thead {
    display:grid;grid-template-columns:minmax(0,2.4fr) 1.1fr .8fr 1.3fr .9fr;gap:10px;
    padding:11px 18px;background:#f8fafc;border-bottom:1px solid #eef2f7;
    font-size:11.5px;font-weight:700;letter-spacing:.3px;color:#94a3b8;text-transform:uppercase;
  }
  .as-gb-thead > div[data-sort] { cursor:pointer;user-select:none; }
  .as-gb-row {
    display:grid;grid-template-columns:minmax(0,2.4fr) 1.1fr .8fr 1.3fr .9fr;gap:10px;
    padding:11px 18px;border-bottom:1px solid #f1f5f9;align-items:center;transition:background .12s;
  }
  .as-gb-row:hover { background:#fbfcfe; }
  .as-gb-actions { display:flex;justify-content:flex-end; }

  /* ── Student answer view ───────────────────────────────── */
  .as-student-wrap { max-width:820px;margin:0 auto;animation:as-fade .25s ease; }
  .as-q-card { background:#fff;border:1px solid #eef2f7;border-radius:14px;padding:16px 18px; }
  .as-opt-row { display:flex;align-items:center;gap:11px;padding:10px 13px;border-radius:10px;border:1px solid; }

  @media(max-width:768px) {
    .as-list-hdr     { padding:14px 20px; }
    .as-list-content { padding:18px 20px 40px; }
    .as-table-head, .as-table-row { grid-template-columns:minmax(0,2fr) 1fr; }
    .as-table-head > div:nth-child(3), .as-table-head > div:nth-child(4),
    .as-table-row > div:nth-child(3), .as-table-row > div:nth-child(4) { display:none; }
  }
  @media(max-width:640px) {
    .as-list-hdr-title { font-size:19px; }

    .as-gb-toolbar { flex-direction:column; }
    .as-gb-search-wrap, .as-gb-dropdown { flex:1 1 100%;width:100%; }

    .as-gb-thead { display:none; }
    .as-gb-row {
      display:flex;flex-direction:column;align-items:stretch;gap:8px;
      padding:14px 16px;
    }
    .as-gb-actions { justify-content:flex-start; }
  }
`;

export default CSS;
