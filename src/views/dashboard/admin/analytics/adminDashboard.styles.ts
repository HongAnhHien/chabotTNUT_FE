const CSS = `
  @keyframes ad-fade  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes ad-pop   { 0%{transform:scale(.96);opacity:0} 100%{transform:scale(1);opacity:1} }
  @keyframes ad-spin  { to{transform:rotate(360deg)} }

  .ad-hero {
    border-radius:18px;
    padding:24px 26px;
    color:white;
    position:relative;
    overflow:hidden;
    animation:ad-fade .3s ease both;
    box-shadow:0 10px 28px rgba(15,23,42,0.14);
  }

  .ad-card {
    background:white;
    border:1px solid #e8edf3;
    border-radius:14px;
    box-shadow:0 1px 3px rgba(15,23,42,0.04);
    animation:ad-fade .3s ease both;
  }

  .ad-section-title {
    display:flex; align-items:center; gap:9px;
    margin:0 0 14px;
  }

  .ad-quicklink {
    display:flex; align-items:center; gap:13px;
    padding:16px 18px; border-radius:14px;
    background:white; border:1px solid #e8edf3;
    cursor:pointer; text-align:left; width:100%;
    transition:all .16s; box-shadow:0 1px 3px rgba(15,23,42,0.04);
    animation:ad-pop .32s cubic-bezier(.34,1.4,.64,1) both;
  }
  .ad-quicklink:hover {
    border-color:rgba(47,107,63,0.3);
    box-shadow:0 6px 16px rgba(15,23,42,0.08);
    transform:translateY(-2px);
  }

  .ad-stat-card {
    background:white;
    border:1px solid #e8edf3;
    border-radius:12px;
    padding:16px 20px;
    display:flex; align-items:center; gap:14px;
    box-shadow:0 1px 3px rgba(15,23,42,0.04);
    animation:ad-pop .32s cubic-bezier(.34,1.4,.64,1) both;
  }

  .ad-select {
    font-size:0.78rem; border:1.5px solid rgba(47,107,63,0.2);
    border-radius:10px; padding:7px 30px 7px 13px;
    background:white; color:#1e293b;
    appearance:none; cursor:pointer; transition:border-color .15s;
  }
  .ad-select:hover { border-color:rgba(47,107,63,0.4); }

  .ad-input {
    font-size:0.78rem; border:1.5px solid rgba(47,107,63,0.2);
    border-radius:10px; padding:7px 13px;
    background:white; color:#1e293b; transition:border-color .15s;
  }
  .ad-input:focus { outline:none; border-color:rgba(47,107,63,0.5); }

  .ad-btn-primary {
    display:flex; align-items:center; gap:6px;
    font-size:0.78rem; font-weight:700; color:white;
    background:linear-gradient(120deg,#1e4429,#2F6B3F);
    border:none; border-radius:10px; padding:8px 16px;
    cursor:pointer; transition:all .15s; box-shadow:0 3px 10px rgba(47,107,63,0.25);
  }
  .ad-btn-primary:disabled { opacity:.5; cursor:not-allowed; }
  .ad-btn-primary:not(:disabled):hover { filter:brightness(1.08); transform:translateY(-1px); }

  .ad-topic-row { animation:ad-fade .25s ease both; }

  @media (max-width:900px) {
    .ad-stats-grid-3 { grid-template-columns:repeat(2,1fr) !important; }
  }
  @media (max-width:640px) {
    .ad-stats-grid-3, .ad-stats-grid-4 { grid-template-columns:1fr 1fr !important; }
  }
`;

export default CSS;
