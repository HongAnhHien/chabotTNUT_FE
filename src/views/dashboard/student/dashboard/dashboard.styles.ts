const CSS = `
  @keyframes sd-fade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sd-spin { to{transform:rotate(360deg)} }

  .sd-card { background:white; border-radius:16px; border:1px solid rgba(30,58,138,0.07); box-shadow:0 2px 10px rgba(30,58,138,0.05); }
  .sd-stat-card { transition:box-shadow .18s,transform .18s; }
  .sd-stat-card:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(41,102,235,0.12) !important; }

  .sd-grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
  .sd-grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }

  .sd-heatcal-row { display:flex; gap:14px; align-items:stretch; }

  .sd-table { width:100%; border-collapse:collapse; }
  .sd-table th { text-align:left; font-size:0.68rem; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.05em; padding:10px 14px; border-bottom:1px solid #f1f5f9; white-space:nowrap; }
  .sd-table td { padding:12px 14px; border-bottom:1px solid #f8fafc; font-size:0.8rem; color:#1e293b; vertical-align:middle; }
  .sd-table tr:last-child td { border-bottom:none; }
  .sd-table tr:hover td { background:rgba(41,102,235,0.025); }

  .sd-heat-cell { transition:opacity .1s; cursor:default; }
  .sd-heat-cell:hover { opacity:.75; }

  .sd-cal-day { border-radius:7px; transition:background .12s; }
  .sd-cal-day:hover { background:rgba(41,102,235,0.06) !important; }

  .sd-score-row { transition:background .12s; cursor:pointer; }
  .sd-score-row:hover td { background:rgba(41,102,235,0.03); }

  .sd-page-content { padding:20px 24px; }
  .sd-page-header { padding:20px 24px 18px; }

  @media (max-width:1024px) {
    .sd-grid-4 { grid-template-columns:repeat(2,1fr); }
    .sd-grid-3 { grid-template-columns:repeat(2,1fr); }
  }
  @media (max-width:768px) {
    .sd-heatcal-row { flex-direction:column; }
    .sd-heatcal-cal { height:auto !important; }
  }
  @media (max-width:640px) {
    .sd-grid-4 { grid-template-columns:1fr 1fr; gap:10px; }
    .sd-grid-3 { grid-template-columns:1fr; }
    .sd-page-content { padding:12px 14px; }
    .sd-page-header { padding:14px 16px 12px; }
    .sd-table th, .sd-table td { padding:8px 10px; }
  }
`;

export default CSS;
