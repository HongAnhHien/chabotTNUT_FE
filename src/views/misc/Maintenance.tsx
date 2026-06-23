import { type FC } from 'react';
import { ArrowLeft, RefreshCw, Wrench, Clock } from 'lucide-react';
import logoTNUT from '@/assets/logo_tnut/logo_tnut.png';

const CSS = `
  @keyframes mn-fade { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes mn-wiggle { 0%,100%{transform:rotate(-8deg)} 50%{transform:rotate(8deg)} }
  @keyframes mn-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  .mn-btn {
    display:inline-flex;align-items:center;gap:8px;padding:10px 22px;
    border-radius:12px;font-size:0.88rem;font-weight:700;cursor:pointer;
    border:none;transition:all .18s;
  }
  .mn-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(37,99,235,0.2)}
`;

const Maintenance: FC = () => (
  <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#eef4ff 0%,#e0eaff 50%,#eff6ff 100%)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:"'Be Vietnam Pro',system-ui,sans-serif", position:'relative', overflow:'hidden' }}>
    <style>{CSS}</style>

    <div style={{ position:'absolute', top:-80, right:-80, width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle,rgba(37,99,235,0.1) 0%,transparent 70%)', pointerEvents:'none' }} />
    <div style={{ position:'absolute', bottom:-60, left:-60, width:260, height:260, borderRadius:'50%', background:'radial-gradient(circle,rgba(30,58,138,0.08) 0%,transparent 70%)', pointerEvents:'none' }} />

    {/* Logo */}
    <div style={{ marginBottom:24, animation:'mn-fade .4s ease both' }}>
      <img src={logoTNUT} alt="TNUT" style={{ height:44, objectFit:'contain' }} />
    </div>

    {/* Card */}
    <div style={{ background:'white', borderRadius:24, border:'1px solid rgba(37,99,235,0.1)', boxShadow:'0 12px 48px rgba(30,58,138,0.1)', padding:'40px 36px', maxWidth:480, width:'100%', textAlign:'center', animation:'mn-fade .5s ease .1s both' }}>

      {/* Icon */}
      <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
        <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,rgba(37,99,235,0.1),rgba(30,58,138,0.06))', border:'2px solid rgba(37,99,235,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Wrench size={36} color="#2563eb" strokeWidth={1.8} style={{ animation:'mn-wiggle 1.2s ease-in-out infinite' }} />
        </div>
      </div>

      {/* Title */}
      <div style={{ fontSize:'2rem', fontWeight:900, background:'linear-gradient(135deg,#1e3a8a,#2563eb)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', marginBottom:8, lineHeight:1.2 }}>
        Đang bảo trì
      </div>

      <p style={{ fontSize:'0.9rem', color:'#64748b', lineHeight:1.6, margin:'0 0 8px' }}>
        Hệ thống đang được nâng cấp để phục vụ bạn tốt hơn.
      </p>
      <p style={{ fontSize:'0.85rem', color:'#94a3b8', lineHeight:1.6, margin:'0 0 20px' }}>
        Đội ngũ kỹ thuật đang nỗ lực hoàn thành sớm nhất. Cảm ơn sự kiên nhẫn của bạn!
      </p>

      {/* Badge */}
      <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(37,99,235,0.07)', border:'1px solid rgba(37,99,235,0.15)', borderRadius:20, padding:'6px 14px', marginBottom:24, fontSize:'0.78rem', fontWeight:700, color:'#2563eb' }}>
        <Clock size={13} style={{ animation:'mn-pulse 1.5s ease-in-out infinite' }} /> Thời gian dự kiến: 2–3 giờ
      </div>

      <div style={{ height:1, background:'rgba(37,99,235,0.08)', margin:'0 0 24px' }} />

      <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
        <button onClick={() => window.history.back()} className="mn-btn"
          style={{ background:'rgba(37,99,235,0.07)', color:'#1e3a8a', border:'1px solid rgba(37,99,235,0.15)' }}>
          <ArrowLeft size={15} /> Quay lại
        </button>
        <button onClick={() => window.location.reload()} className="mn-btn"
          style={{ background:'linear-gradient(135deg,#1e3a8a,#2563eb)', color:'white', boxShadow:'0 4px 16px rgba(37,99,235,0.3)' }}>
          <RefreshCw size={15} /> Thử lại
        </button>
      </div>
    </div>

    <p style={{ marginTop:20, fontSize:'0.75rem', color:'#94a3b8', animation:'mn-fade .6s ease .2s both' }}>
      © Trường Đại học Kỹ thuật Công nghiệp Thái Nguyên
    </p>
  </div>
);

export default Maintenance;
