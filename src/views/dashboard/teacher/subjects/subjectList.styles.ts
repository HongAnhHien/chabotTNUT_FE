const CSS = `
  @keyframes sl-fade   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sl-spin   { to{transform:rotate(360deg)} }
  @keyframes sl-pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes sl-pop    { 0%{transform:scale(.96);opacity:0} 100%{transform:scale(1);opacity:1} }
  @keyframes sl-expand { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }

  .sl-card {
    background:white;
    border:1px solid #e8edf3;
    border-radius:14px;
    box-shadow:0 1px 3px rgba(15,23,42,0.04);
  }
  .sl-subject-row { animation:sl-fade .3s ease both; }

  .sl-btn {
    display:flex; align-items:center; gap:5px;
    padding:5px 12px; border-radius:8px;
    font-size:0.76rem; font-weight:600;
    cursor:pointer; transition:all .12s; white-space:nowrap; border:none;
  }
  .sl-btn:hover { filter:brightness(0.95); }

  .sl-stats-grid {
    display:grid;
    grid-template-columns:repeat(3,1fr);
    gap:14px;
  }
  .sl-stat-card {
    background:white;
    border:1px solid #e8edf3;
    border-radius:12px;
    padding:16px 20px;
    display:flex; align-items:center; gap:14px;
    box-shadow:0 1px 3px rgba(15,23,42,0.04);
    animation:sl-pop .32s cubic-bezier(.34,1.4,.64,1) both;
  }

  /* sticky header */
  .sl-sticky-header {
    background:white;
    border-bottom:1px solid #eef0f5;
    position:sticky; top:0; z-index:20;
    box-shadow:0 2px 8px rgba(30,58,138,0.05);
  }
  .sl-header-inner {
    padding:14px 24px;
    display:flex; align-items:center; justify-content:space-between; gap:16px;
  }
  .sl-content {
    padding:20px 24px;
    display:flex; flex-direction:column; gap:20px;
  }

  /* dropdown */
  .sl-drop-btn {
    display:flex; align-items:center; gap:7px;
    padding:7px 13px; border-radius:20px;
    background:white; border:1.5px solid rgba(37,99,235,0.18);
    cursor:pointer; transition:all .15s;
  }
  .sl-drop-btn:hover { border-color:rgba(37,99,235,0.35); }
  .sl-drop-panel {
    position:absolute; top:calc(100% + 6px); right:0; z-index:50;
    background:white; border-radius:14px;
    box-shadow:0 8px 30px rgba(30,58,138,0.15);
    border:1px solid rgba(37,99,235,0.1);
    min-width:240px; overflow:hidden;
    animation:sl-fade .15s ease;
  }
  .sl-drop-item {
    width:100%; display:flex; align-items:center; gap:9px;
    padding:9px 14px; background:none; border:none;
    cursor:pointer; text-align:left; transition:background .13s;
  }
  .sl-drop-item:hover { background:rgba(37,99,235,0.04) !important; }

  @media (max-width:768px) {
    .sl-header-inner { padding:12px 16px; }
    .sl-content { padding:16px; }
    .sl-stats-grid { gap:10px; }
  }
  @media (max-width:480px) {
    .sl-stat-card { padding:12px 10px; gap:10px; }
    .sl-header-inner { flex-direction:column; align-items:flex-start; gap:10px; }
  }
`;

export default CSS;
