const CSS = `
  @keyframes an-fade   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes an-spin   { to{transform:rotate(360deg)} }
  @keyframes an-pop    { 0%{transform:scale(.96);opacity:0} 100%{transform:scale(1);opacity:1} }
  @keyframes an-expand { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }

  .an-card {
    background:white; border:1px solid #e8edf3;
    border-radius:14px; box-shadow:0 1px 3px rgba(15,23,42,0.04);
    animation:an-pop .28s cubic-bezier(.34,1.3,.64,1) both;
  }
  .an-section { animation:an-fade .3s ease both; }

  .an-stat-grid {
    display:grid; grid-template-columns:repeat(4,1fr); gap:14px;
  }
  .an-stat-card {
    background:white; border:1px solid #e8edf3; border-radius:12px;
    padding:16px 18px; display:flex; flex-direction:column; gap:6px;
    box-shadow:0 1px 3px rgba(15,23,42,0.04);
    animation:an-pop .3s cubic-bezier(.34,1.4,.64,1) both;
  }

  /* ── Tabs ── */
  .an-tabs {
    display:flex; gap:0; padding:0 24px;
    border-bottom:1px solid #f0f4f8; background:white;
    overflow-x:auto; scrollbar-width:none;
  }
  .an-tabs::-webkit-scrollbar { display:none; }
  .an-tab-btn {
    display:flex; align-items:center; gap:6px;
    padding:10px 16px; border:none; background:none;
    font-size:0.8rem; font-weight:500; color:#64748b;
    cursor:pointer; border-bottom:2px solid transparent;
    margin-bottom:-1px; transition:color .15s, border-color .15s;
    white-space:nowrap;
  }
  .an-tab-btn:hover { color:#1e293b; }
  .an-tab-btn.active { color:#2563eb; font-weight:700; border-bottom-color:#2563eb; }
  .an-tab-badge {
    display:inline-flex; align-items:center; justify-content:center;
    min-width:18px; height:18px; padding:0 5px;
    border-radius:9px; font-size:0.7rem; font-weight:700;
    background:#f1f5f9; color:#64748b;
  }
  .an-tab-badge.red { background:rgba(220,38,38,0.1); color:#dc2626; }

  /* ── Filter chips ── */
  .an-chip-row { display:flex; gap:6px; flex-wrap:wrap; }
  .an-chip {
    display:inline-flex; align-items:center; gap:4px;
    padding:5px 12px; border-radius:20px; font-size:0.74rem; font-weight:600;
    border:1.5px solid #e2e8f0; background:white; color:#64748b;
    cursor:pointer; transition:all .13s; white-space:nowrap;
  }
  .an-chip:hover { border-color:#cbd5e1; background:#f8fafc; }
  .an-chip.active { background:rgba(37,99,235,0.08); border-color:rgba(37,99,235,0.3); color:#2563eb; }
  .an-chip.active.yellow { background:rgba(217,119,6,0.08); border-color:rgba(217,119,6,0.3); color:#d97706; }
  .an-chip.active.orange { background:rgba(234,88,12,0.08); border-color:rgba(234,88,12,0.3); color:#ea580c; }
  .an-chip.active.red    { background:rgba(220,38,38,0.08); border-color:rgba(220,38,38,0.3); color:#dc2626; }

  /* ── Toolbar: search + custom dropdown filters ── */
  .an-toolbar-row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .an-search-box { position:relative; flex:1 1 220px; min-width:200px; }

  .an-dd { position:relative; flex-shrink:0; width:180px; }
  .an-dd-trigger {
    width:100%; height:38px; display:flex; align-items:center; gap:7px;
    padding:0 12px; border-radius:10px; border:1.5px solid rgba(37,99,235,0.18); background:#fff;
    font-family:inherit; font-size:0.78rem; font-weight:600; color:#334155; cursor:pointer;
    transition:border-color .15s, background .15s, color .15s; box-sizing:border-box;
  }
  .an-dd-trigger:hover { border-color:rgba(37,99,235,0.35); background:#f8fbff; }
  .an-dd-trigger.open { border-color:rgba(37,99,235,0.5); background:#eff5ff; color:#2563eb; }
  .an-dd-trigger .an-dd-label { flex:1; text-align:left; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .an-dd-trigger .an-dd-chevron { flex-shrink:0; color:#94a3b8; transition:transform .15s; }
  .an-dd-trigger.open .an-dd-chevron { transform:rotate(180deg); color:#2563eb; }

  .an-dd-menu {
    position:absolute; top:calc(100% + 6px); left:0; right:0; z-index:30;
    background:#fff; border:1px solid #e2e8f0; border-radius:12px;
    box-shadow:0 8px 28px rgba(15,23,42,.14); padding:5px;
    animation:an-expand .14s ease both;
  }
  .an-dd-item {
    width:100%; display:flex; align-items:center; justify-content:space-between; gap:8px;
    padding:8px 11px; border-radius:8px; border:none; background:transparent;
    font-family:inherit; font-size:0.76rem; font-weight:600; color:#334155; cursor:pointer;
    text-align:left; transition:background .1s;
  }
  .an-dd-item:hover { background:#f8fafc; }
  .an-dd-item.on { color:#2563eb; background:#eff5ff; }
  .an-dd-item svg { color:#2563eb; flex-shrink:0; }

  @media(max-width:640px) {
    .an-toolbar-row { flex-direction:column; align-items:stretch; }
    .an-search-box { flex:none; width:100%; }
    .an-dd { width:100%; }
  }

  /* ── Student row ── */
  .an-student-row {
    display:flex; align-items:center; flex-wrap:wrap; gap:12px; padding:11px 14px;
    background:white; border:1px solid #e8edf3; border-radius:10px;
    transition:box-shadow .13s;
  }
  .an-student-row:hover { box-shadow:0 2px 8px rgba(15,23,42,0.06); }
  .an-student-row.warn-red    { border-left:3px solid #dc2626; }
  .an-student-row.warn-orange { border-left:3px solid #ea580c; }
  .an-student-row.warn-yellow { border-left:3px solid #d97706; }

  .an-list-header {
    display:flex; align-items:center; gap:16px; padding:0 14px 8px;
    font-size:11px; font-weight:700; color:#a3b1c6; letter-spacing:.4px; text-transform:uppercase;
  }
  .an-list-header > :nth-child(1) { width:70px; flex-shrink:0; }
  .an-list-header > :nth-child(2) { flex:1 1 180px; min-width:0; }
  .an-list-header > :nth-child(3) { flex:0 1 170px; min-width:130px; }
  .an-list-header > :nth-child(4) { flex-shrink:0; width:96px; }
  .an-list-header > :nth-child(5) { flex-shrink:0; width:110px; }
  @media (max-width:860px) {
    .an-list-header { display:none; }
  }

  .an-sticky-header {
    background:white; border-bottom:1px solid #eef0f5;
    position:sticky; top:0; z-index:20;
    box-shadow:0 2px 8px rgba(30,58,138,0.05);
  }
  .an-header-inner {
    padding:12px 24px; display:flex; align-items:center; gap:14px;
  }
  .an-content {
    padding:20px 24px; display:flex; flex-direction:column; gap:20px;
  }

  .an-back-btn {
    display:flex; align-items:center; gap:6px; padding:6px 12px;
    border-radius:8px; border:1px solid #e2e8f0; background:#f8fafc;
    color:#475569; font-size:0.76rem; font-weight:600; cursor:pointer;
    transition:all .13s; white-space:nowrap; flex-shrink:0;
  }
  .an-back-btn:hover { background:#f1f5f9; border-color:#cbd5e1; }

  .an-attention-row {
    display:flex; align-items:flex-start; gap:12px; padding:12px 14px;
    border-radius:10px; border:1px solid #fee2e2; background:#fff8f8;
    animation:an-fade .25s ease both;
    transition:background .15s;
  }
  .an-attention-row:hover { background:#fff1f1; }
  .an-attention-row.orange { border-color:#fed7aa; background:#fff8f2; }
  .an-attention-row.orange:hover { background:#fef0e4; }
  .an-attention-row.yellow { border-color:#fde68a; background:#fffdf0; }
  .an-attention-row.yellow:hover { background:#fffbe0; }

  .an-schedule-card {
    border:1px solid #e8edf3; border-radius:12px; overflow:hidden;
    background:white; animation:an-fade .3s ease both;
  }
  .an-schedule-header {
    display:flex; align-items:center; gap:12px; padding:13px 16px;
    cursor:pointer; user-select:none; transition:background .13s;
  }
  .an-schedule-header:hover { background:#f8fafc; }

  .an-progress-bar {
    height:6px; border-radius:3px; background:#e2e8f0; overflow:hidden;
  }
  .an-progress-fill {
    height:100%; border-radius:3px; transition:width .5s ease;
  }

  .an-chart-grid {
    display:grid; grid-template-columns:1fr 1fr; gap:14px;
  }
  .an-chart-card {
    background:white; border:1px solid #e8edf3; border-radius:12px;
    padding:14px 16px; box-shadow:0 1px 3px rgba(15,23,42,0.04);
  }
  .an-chart-title {
    font-size:0.74rem; font-weight:700; color:'#1e293b'; margin-bottom:8px;
  }
  .an-chart-full {
    background:white; border:1px solid #e8edf3; border-radius:12px;
    padding:14px 16px; box-shadow:0 1px 3px rgba(15,23,42,0.04);
  }

  .an-class-accordion {
    border:1px solid #e8edf3; border-radius:12px; overflow:hidden;
    animation:an-fade .3s ease both;
  }
  .an-class-acc-header {
    display:flex; align-items:center; gap:12px; padding:14px 18px;
    cursor:pointer; user-select:none; background:white; transition:background .13s;
  }
  .an-class-acc-header:hover { background:#f8fafc; }

  @media (max-width:1100px) {
    .an-stat-grid { grid-template-columns:repeat(2,1fr); }
  }
  @media (max-width:900px) {
    .an-stat-grid { grid-template-columns:repeat(2,1fr); }
    .an-header-inner { flex-wrap:wrap; gap:10px; }
  }
  @media (max-width:768px) {
    .an-header-inner { padding:10px 16px; }
    .an-content { padding:14px 16px; }
    .an-chart-grid { grid-template-columns:1fr; }
    .an-tabs { padding:0 16px; }
  }
  @media (max-width:600px) {
    .an-stat-grid { grid-template-columns:1fr 1fr; gap:10px; }
  }
  @media (max-width:480px) {
    .an-stat-grid { grid-template-columns:1fr 1fr; gap:8px; }
    .an-stat-card { padding:12px 14px; }
    .an-content { padding:10px 12px; gap:14px; }
    .an-header-inner { padding:8px 12px; }
    .an-tabs { padding:0 12px; }
    .an-tab-btn { padding:8px 12px; font-size:0.75rem; }
  }
`;

export default CSS;
