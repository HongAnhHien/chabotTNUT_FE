const CSS = `
  @keyframes adv-fade   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes adv-pop    { 0%{transform:scale(.96);opacity:0} 100%{transform:scale(1);opacity:1} }
  @keyframes adv-spin   { to{transform:rotate(360deg)} }

  .adv-card {
    background:white;
    border:1px solid #e8edf3;
    border-radius:14px;
    box-shadow:0 1px 3px rgba(15,23,42,0.04);
    animation:adv-fade .3s ease both;
  }

  .adv-hero {
    border-radius:16px;
    padding:20px 24px;
    color:white;
    position:relative;
    overflow:hidden;
    animation:adv-fade .3s ease both;
    box-shadow:0 8px 24px rgba(15,23,42,0.12);
  }

  .adv-stats-grid {
    display:grid;
    grid-template-columns:repeat(3,1fr);
    gap:14px;
  }
  .adv-stat-card {
    background:white;
    border:1px solid #e8edf3;
    border-radius:12px;
    padding:16px 20px;
    display:flex; align-items:center; gap:14px;
    box-shadow:0 1px 3px rgba(15,23,42,0.04);
    animation:adv-pop .32s cubic-bezier(.34,1.4,.64,1) both;
  }

  .adv-student-row {
    display:flex; align-items:center; gap:12px;
    padding:11px 14px; border-radius:12px;
    background:white; border:1px solid #eef0f5;
    cursor:pointer; text-align:left; width:100%;
    transition:all .14s; animation:adv-fade .25s ease both;
  }
  .adv-student-row:hover {
    border-color:rgba(37,99,235,0.25);
    box-shadow:0 3px 10px rgba(15,23,42,0.06);
    transform:translateY(-1px);
  }

  .adv-component-card {
    border-radius:12px;
    padding:14px;
    animation:adv-pop .3s cubic-bezier(.34,1.4,.64,1) both;
  }

  .adv-history-row {
    border-radius:10px;
    padding:10px 12px;
    background:#f8fafc;
    border:1px solid #eef0f5;
  }

  @media (max-width:900px) {
    .adv-stats-grid { grid-template-columns:repeat(2,1fr); }
  }
  @media (max-width:600px) {
    .adv-stats-grid { grid-template-columns:1fr; }
  }
`;

export default CSS;
