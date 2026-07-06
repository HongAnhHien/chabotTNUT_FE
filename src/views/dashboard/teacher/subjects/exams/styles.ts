const CSS = `
  @keyframes ex-fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
  @keyframes ex-spin { to{transform:rotate(360deg)} }
  @keyframes ex-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes ex-overlay     { from{opacity:0} to{opacity:1} }
  @keyframes ex-overlay-out { from{opacity:1} to{opacity:0} }
  @keyframes ex-drawer { from{transform:translateX(100%)} to{transform:none} }
  @keyframes ex-pop { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }

  .ex-skeleton {
    border-radius:14px;
    background:linear-gradient(90deg,#eef4ff 25%,#dbeafe 50%,#eef4ff 75%);
    background-size:200% 100%;
    animation:ex-shimmer 1.4s ease infinite;
  }

  /* ── Cards ─────────────────────────────────────────────── */
  .ex-card {
    background:#fff;border:1px solid #e7ecf3;border-radius:18px;
    padding:20px 22px;transition:border-color .15s, box-shadow .15s;
    animation:ex-fade .3s ease both;
  }
  .ex-card:hover { border-color:#bfdbfe;box-shadow:0 12px 30px rgba(37,99,235,.08); }

  .ex-badge {
    display:inline-flex;align-items:center;gap:6px;
    font-size:12.5px;font-weight:600;padding:5px 11px;border-radius:9px;
  }

  .ex-strip {
    display:flex;align-items:center;gap:16px;flex-wrap:wrap;
    margin-top:16px;padding:12px 16px;
    border-radius:12px;background:#f8fafc;border:1px solid #eef2f7;
  }

  /* ── Buttons ────────────────────────────────────────────── */
  .ex-btn {
    height:42px;padding:0 18px;border-radius:11px;
    font-family:inherit;font-size:13.5px;font-weight:700;cursor:pointer;
    display:inline-flex;align-items:center;gap:8px;
    transition:filter .13s, background .13s;white-space:nowrap;
  }
  .ex-btn:disabled { opacity:.45;cursor:not-allowed; }
  .ex-btn.primary  { background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;border:none;box-shadow:0 6px 15px rgba(37,99,235,.25); }
  .ex-btn.primary:hover:not(:disabled) { filter:brightness(1.06); }
  .ex-btn.outline-blue { background:#eff5ff;color:#2563eb;border:1px solid #bfdbfe; }
  .ex-btn.outline-blue:hover:not(:disabled) { background:#dbeafe; }
  .ex-btn.outline-gray { background:#fff;color:#475569;border:1px solid #e7ecf3; }
  .ex-btn.outline-gray:hover:not(:disabled) { background:#f8fafc; }

  /* ── Filter chips ───────────────────────────────────────── */
  .ex-chip {
    height:44px;padding:0 18px;border-radius:13px;
    font-family:inherit;font-size:13.5px;cursor:pointer;
    border:1px solid;transition:all .13s;white-space:nowrap;
  }
  .ex-chip.on  { border-color:#bfdbfe;background:#eff5ff;color:#2563eb;font-weight:700; }
  .ex-chip.off { border-color:#e7ecf3;background:#fff;color:#64748b;font-weight:600; }
  .ex-chip.off:hover { border-color:#c5d8f5;background:#f8fbff; }

  /* ── Stat cards ─────────────────────────────────────────── */
  .ex-stat-card {
    background:#fff;border:1px solid #e7ecf3;border-radius:16px;
    padding:16px 18px;display:flex;align-items:center;gap:14px;
  }

  /* ── Roster ─────────────────────────────────────────────── */
  .ex-roster-row {
    display:flex;align-items:center;gap:13px;
    padding:13px 20px;border-bottom:1px solid #f1f5f9;transition:background .12s;
  }
  .ex-roster-row:last-child { border-bottom:none; }
  .ex-roster-row:hover { background:#f8fbff; }

  .ex-rtab {
    height:34px;padding:0 13px;border-radius:10px;
    font-family:inherit;font-size:12.5px;font-weight:700;cursor:pointer;
    display:inline-flex;align-items:center;gap:7px;border:1px solid;transition:all .13s;
  }
  .ex-rtab.on  { border-color:#bfdbfe;background:#eff5ff;color:#2563eb; }
  .ex-rtab.off { border-color:#e7ecf3;background:#fff;color:#64748b; }
  .ex-rtab.off:hover { border-color:#c5d8f5; }

  /* ── Inputs ─────────────────────────────────────────────── */
  .ex-input {
    width:100%;height:42px;border:1px solid #e7ecf3;border-radius:11px;
    padding:0 12px;font-family:inherit;font-size:13px;color:#334155;
    outline:none;box-sizing:border-box;transition:border-color .15s;
  }
  .ex-input:focus { border-color:#93c5fd; }

  /* ── Modals ─────────────────────────────────────────────── */
  .ex-overlay {
    position:fixed;inset:0;background:rgba(15,23,42,.55);
    backdrop-filter:blur(4px);display:flex;align-items:center;
    justify-content:center;z-index:60;padding:16px;animation:ex-overlay .18s ease;
  }
  .ex-modal {
    background:#fff;border-radius:20px;
    box-shadow:0 30px 70px rgba(15,23,42,.32);
    overflow:hidden;animation:ex-pop .22s cubic-bezier(.2,.8,.2,1);
    width:min(420px,94vw);
  }

  /* ── List view header ───────────────────────────────────── */
  .ex-list-hdr {
    background:#fff;border-bottom:1.5px solid #e7ecf3;
    box-shadow:0 2px 10px rgba(15,23,42,.05);
    padding:16px 32px;
  }
  .ex-list-content { padding:24px 32px 52px;flex:1; }

  .ex-list-hdr-row {
    display:flex;align-items:center;gap:16px;
  }
  .ex-list-hdr-title {
    margin:0;font-size:24px;font-weight:800;letter-spacing:-.5px;color:#0f172a;
  }

  /* ── Sub-header (detail / assignment) ───────────────────── */
  .ex-sub-header {
    flex:none;background:#fff;border-bottom:1px solid #e7ecf3;
    padding:0 32px;min-height:64px;display:flex;align-items:center;
    gap:12px;flex-wrap:wrap;
  }
  /* Left group: back + divider + title */
  .ex-sub-left {
    flex:1;min-width:0;display:flex;align-items:center;gap:12px;
  }
  .ex-sub-left-text { min-width:0;flex:1; }
  .ex-sub-title {
    font-size:16px;font-weight:800;color:#0f172a;
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  }
  .ex-sub-subtitle { font-size:12px;color:#94a3b8;margin-top:1px; }
  /* Vertical divider */
  .ex-sub-divider { width:1px;height:26px;background:#e7ecf3;flex-shrink:0; }
  /* Right group: pill + buttons */
  .ex-sub-right {
    display:flex;align-items:center;gap:10px;flex-shrink:0;flex-wrap:wrap;
  }

  /* ── Main content padding ───────────────────────────────── */
  .ex-main-pad { padding:26px 32px 52px; }

  /* ── Grids ──────────────────────────────────────────────── */
  .ex-stats-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:0; }

  .ex-assign-grid {
    display:grid;grid-template-columns:minmax(0,1fr) 320px;
    gap:20px;align-items:start;
  }

  .ex-detail-grid {
    display:grid;grid-template-columns:300px minmax(0,1fr);
    gap:24px;align-items:start;
  }

  /* ── Card actions row ───────────────────────────────────── */
  .ex-card-actions {
    display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:16px;
  }

  /* ── Filter bar (roster) ────────────────────────────────── */
  .ex-filter-bar { display:flex;gap:10px;flex-wrap:wrap; }
  .ex-filter-bar > * { flex:1 1 180px;min-width:0; }
  @media(max-width:640px) {
    .ex-filter-bar > * { flex:1 1 100%;width:100%; }
  }

  /* ── Custom dropdown ─────────────────────────────────────── */
  .ex-dropdown { position:relative; }
  .ex-dropdown-trigger {
    width:100%;height:38px;display:flex;align-items:center;justify-content:space-between;
    gap:8px;padding:0 12px;border:1px solid #e7ecf3;border-radius:11px;
    background:#fff;font-family:inherit;font-size:13px;color:#334155;
    cursor:pointer;transition:border-color .15s;text-align:left;
  }
  .ex-dropdown-trigger:focus, .ex-dropdown-trigger[aria-expanded="true"] {
    border-color:#93c5fd;outline:none;
  }
  .ex-dropdown-menu {
    position:absolute;top:calc(100% + 6px);left:0;right:0;
    background:#fff;border:1px solid #e7ecf3;border-radius:13px;
    box-shadow:0 10px 30px rgba(15,23,42,.12);
    z-index:100;overflow:hidden;
    animation:ex-pop .15s cubic-bezier(.2,.8,.2,1);
  }
  .ex-dropdown-item {
    display:flex;align-items:center;justify-content:space-between;
    padding:10px 14px;font-size:13.5px;font-weight:600;color:#334155;
    cursor:pointer;transition:background .1s;gap:8px;
  }
  .ex-dropdown-item:hover  { background:#f8fbff; }
  .ex-dropdown-item.active { background:#eff5ff;color:#1d4ed8; }

  /* ── Sidebar drawer (mobile) ────────────────────────────── */
  @keyframes ex-sidebar-in  { from{transform:translateX(100%)} to{transform:translateX(0)} }
  @keyframes ex-sidebar-out { from{transform:translateX(0)} to{transform:translateX(100%)} }

  .ex-assign-rail { display:flex;flex-direction:column;gap:16px;position:sticky;top:24px;align-self:start; }
  .ex-sidebar-fab { display:none; }

  /* ══ RESPONSIVE ════════════════════════════════════════════ */

  /* 1024px — tighten grids */
  @media(max-width:1024px) {
    .ex-assign-grid { grid-template-columns:minmax(0,1fr) 290px; }
    .ex-detail-grid { grid-template-columns:270px minmax(0,1fr); }
  }

  /* 900px — single column */
  @media(max-width:900px) {
    .ex-assign-grid { grid-template-columns:1fr; }
    .ex-detail-grid { grid-template-columns:1fr; }
    .ex-stats-grid  { grid-template-columns:repeat(2,1fr); }
    .ex-detail-rail { position:static !important; }
    /* sidebar → drawer on mobile */
    .ex-assign-rail { display:none; }
    .ex-sidebar-fab {
      display:flex;align-items:center;gap:8px;
      position:fixed;bottom:24px;right:20px;z-index:50;
      height:48px;padding:0 20px;border-radius:999px;
      background:linear-gradient(135deg,#2563eb,#1d4ed8);
      color:#fff;font-family:inherit;font-size:14px;font-weight:700;
      border:none;cursor:pointer;
      box-shadow:0 8px 24px rgba(37,99,235,.38);
      transition:filter .13s;
    }
    .ex-sidebar-fab:hover { filter:brightness(1.07); }
  }

  /* 768px — medium tablet */
  @media(max-width:768px) {
    .ex-list-hdr       { padding:14px 20px; }
    .ex-list-content   { padding:18px 20px 40px; }
    .ex-sub-header     { padding:0 20px;min-height:56px; }
    .ex-main-pad       { padding:18px 20px 40px; }
    .ex-list-hdr-title { font-size:20px; }
    .ex-sub-title      { font-size:15px; }
  }

  /* 640px — mobile */
  @media(max-width:640px) {
    .ex-list-hdr       { padding:12px 16px; }
    .ex-list-content   { padding:14px 16px 36px; }
    .ex-list-hdr-row   { flex-wrap:wrap;gap:10px; }
    .ex-list-hdr-title { font-size:18px; }
    /* sub-header: left takes full row, right wraps below */
    .ex-sub-header     { padding:10px 16px;min-height:unset;gap:8px; }
    .ex-sub-left       { width:100%;flex:unset; }
    .ex-sub-divider    { display:none; }
    .ex-sub-title      { font-size:14px; }
    .ex-sub-subtitle   { display:none; }
    .ex-main-pad       { padding:14px 16px 36px; }
    .ex-card           { padding:15px 16px; }
    .ex-strip          { flex-direction:column;align-items:flex-start;gap:8px;padding:11px 13px; }
    .ex-chip           { height:38px;padding:0 14px;font-size:13px; }
    .ex-stats-grid     { grid-template-columns:1fr 1fr;gap:10px; }
    .ex-card-actions .ex-btn { flex:1;justify-content:center; }
    .ex-roster-row     { padding:11px 14px;gap:10px; }
  }

  /* 480px — small mobile */
  @media(max-width:480px) {
    .ex-stats-grid { grid-template-columns:1fr 1fr; }
    .ex-card-actions { gap:8px; }
    .ex-card-actions .ex-btn { font-size:12.5px;padding:0 12px; }
    .ex-badge { font-size:11.5px;padding:4px 9px; }
  }
`;

export default CSS;
