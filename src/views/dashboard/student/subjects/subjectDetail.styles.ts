const CSS = `
  @keyframes ssd-fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ssd-spin { to{transform:rotate(360deg)} }

  .ssd-header-inner { padding:14px 24px; }
  .ssd-content { flex:1; padding:20px 24px; max-width:100%; overflow:hidden; }

  .ssd-tab-bar { display:flex; gap:4px; margin-top:12px; border-bottom:1px solid #eef0f5; overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
  .ssd-tab-bar::-webkit-scrollbar { display:none; }
  .ssd-tab { display:inline-flex; align-items:center; gap:6px; padding:10px 20px; font-size:0.85rem; font-weight:600; color:#64748b; border:none; background:none; cursor:pointer; border-bottom:2.5px solid transparent; transition:color .15s,border-color .15s; white-space:nowrap; flex-shrink:0; }
  .ssd-tab:hover { color:#1e3a8a; }
  .ssd-tab.active { color:#2563eb; border-bottom-color:#2563eb; font-weight:700; }

  .ssd-meta { display:flex; flex-wrap:wrap; gap:6px 12px; margin-top:4px; align-items:center; }
  .ssd-meta span { font-size:0.68rem; }

  .ssd-file-card { background:white; border-radius:14px; border:1px solid rgba(30,58,138,0.07); padding:14px 16px; display:flex; align-items:center; gap:12px; transition:box-shadow .18s,transform .18s; animation:ssd-fade .25s ease both; min-width:0; overflow:hidden; }
  .ssd-file-card:hover { box-shadow:0 4px 18px rgba(30,58,138,0.1); transform:translateY(-1px); }
  .ssd-file-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(360px,1fr)); gap:10px; }

  .ssd-file-action { display:inline-flex; align-items:center; gap:4px; padding:5px 11px; border-radius:9px; font-size:0.7rem; font-weight:700; cursor:pointer; border:1.5px solid; transition:all .14s; white-space:nowrap; background:none; flex-shrink:0; }
  .ssd-file-action.view { border-color:rgba(37,99,235,0.2); color:#2563eb; }
  .ssd-file-action.view:hover { background:rgba(37,99,235,0.07); }
  .ssd-file-action.dl   { border-color:rgba(5,150,105,0.22); color:#059669; }
  .ssd-file-action.dl:hover   { background:rgba(5,150,105,0.07); }
  .ssd-file-action .btn-label { display:inline; }

  .ssd-asgn-row { background:white; border-radius:14px; border:1px solid rgba(30,58,138,0.07); padding:14px 18px; display:flex; align-items:center; gap:14px; transition:box-shadow .18s; animation:ssd-fade .25s ease both; }
  .ssd-asgn-row:hover { box-shadow:0 4px 18px rgba(30,58,138,0.1); }

  .ssd-search { width:100%; padding:9px 14px 9px 36px; border-radius:11px; border:1.5px solid rgba(30,58,138,0.12); font-size:0.82rem; outline:none; transition:border-color .15s; background:white; box-sizing:border-box; }
  .ssd-search:focus { border-color:#2563eb; box-shadow:0 0 0 3px rgba(37,99,235,0.1); }

  .ssd-filter-btn { display:inline-flex; align-items:center; gap:5px; padding:8px 14px; border-radius:11px; font-size:0.78rem; font-weight:600; cursor:pointer; border:1.5px solid rgba(30,58,138,0.12); background:white; color:#475569; transition:all .14s; white-space:nowrap; }
  .ssd-filter-btn:hover,.ssd-filter-btn.active { background:rgba(37,99,235,0.07); border-color:rgba(37,99,235,0.25); color:#1e3a8a; }
  .ssd-filter-btn.active { background:rgba(37,99,235,0.09); border-color:#2563eb; color:#2563eb; font-weight:700; }

  .ssd-toolbar { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
  .ssd-search-wrap { position:relative; flex:1; min-width:180px; }

  @media (max-width: 480px) {
    .ssd-file-action { padding:6px; }
    .ssd-file-action .btn-label { display:none; }
  }
  @media (max-width: 768px) {
    .ssd-file-grid { grid-template-columns:1fr; }
  }
  @media (max-width: 640px) {
    .ssd-header-inner { padding:10px 14px; }
    .ssd-content      { padding:12px 14px; }
    .ssd-tab          { padding:8px 12px; font-size:0.78rem; gap:5px; }
    .ssd-asgn-row     { flex-wrap:wrap; gap:8px; padding:12px 14px; }
    .ssd-file-card    { gap:10px; padding:12px 14px; }
    .ssd-toolbar      { flex-direction:column; gap:8px; }
    .ssd-toolbar > *  { width:100%; }
    .ssd-filter-btn   { padding:7px 10px; font-size:0.72rem; width:100%; justify-content:space-between; }
    .ssd-search-wrap  { width:100%; flex:none; }
    .ssd-meta         { gap:4px 8px; }
    .ssd-meta span    { font-size:0.63rem; }
  }
`;

export default CSS;
