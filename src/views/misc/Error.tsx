import { type FC } from 'react';
import { ArrowLeft, Home, RefreshCw, AlertTriangle } from 'lucide-react';
import logoTNUT from '@/assets/logo_tnut/logo_tnut.png';

interface ErrorPageProps {
  errorCode?: string;
  title?: string;
  message?: string;
}

const CSS = `
  @keyframes err-fade { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes err-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes err-spin-slow { to{transform:rotate(360deg)} }
  .err-btn {
    display:inline-flex;align-items:center;gap:8px;padding:10px 22px;
    border-radius:12px;font-size:0.88rem;font-weight:700;cursor:pointer;
    border:none;transition:all .18s;text-decoration:none;
  }
  .err-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(37,99,235,0.2)}
`;

const ErrorPage: FC<ErrorPageProps> = ({
  errorCode = '404',
  title = 'Không tìm thấy trang',
  message = 'Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.',
}) => (
  <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#eef4ff 0%,#e0eaff 50%,#eff6ff 100%)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:"'Be Vietnam Pro',system-ui,sans-serif", position:'relative', overflow:'hidden' }}>
    <style>{CSS}</style>

    {/* Decorative blobs */}
    <div style={{ position:'absolute', top:-80, right:-80, width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle,rgba(37,99,235,0.1) 0%,transparent 70%)', pointerEvents:'none' }} />
    <div style={{ position:'absolute', bottom:-60, left:-60, width:260, height:260, borderRadius:'50%', background:'radial-gradient(circle,rgba(30,58,138,0.08) 0%,transparent 70%)', pointerEvents:'none' }} />

    {/* Logo */}
    <div style={{ marginBottom:24, animation:'err-fade .4s ease both' }}>
      <img src={logoTNUT} alt="TNUT" style={{ height:44, objectFit:'contain' }} />
    </div>

    {/* Card */}
    <div style={{ background:'white', borderRadius:24, border:'1px solid rgba(37,99,235,0.1)', boxShadow:'0 12px 48px rgba(30,58,138,0.1)', padding:'40px 36px', maxWidth:480, width:'100%', textAlign:'center', animation:'err-fade .5s ease .1s both' }}>

      {/* Icon */}
      <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
        <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,rgba(220,38,38,0.1),rgba(239,68,68,0.06))', border:'2px solid rgba(220,38,38,0.12)', display:'flex', alignItems:'center', justifyContent:'center', animation:'err-float 3s ease-in-out infinite' }}>
          <AlertTriangle size={36} color="#dc2626" strokeWidth={1.8} />
        </div>
      </div>

      {/* Error code */}
      <div style={{ fontSize:'5rem', fontWeight:900, lineHeight:1, background:'linear-gradient(135deg,#1e3a8a,#2563eb)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', marginBottom:8 }}>
        {errorCode}
      </div>

      {/* Title */}
      <h1 style={{ fontSize:'1.4rem', fontWeight:800, color:'#1e293b', margin:'0 0 10px' }}>{title}</h1>

      {/* Message */}
      <p style={{ fontSize:'0.9rem', color:'#64748b', lineHeight:1.6, margin:'0 0 28px' }}>{message}</p>

      {/* Divider */}
      <div style={{ height:1, background:'rgba(37,99,235,0.08)', margin:'0 0 24px' }} />

      {/* Actions */}
      <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
        <button onClick={() => window.history.back()} className="err-btn"
          style={{ background:'rgba(37,99,235,0.07)', color:'#1e3a8a', border:'1px solid rgba(37,99,235,0.15)' }}>
          <ArrowLeft size={15} /> Quay lại
        </button>
        <button onClick={() => window.location.reload()} className="err-btn"
          style={{ background:'rgba(37,99,235,0.07)', color:'#2563eb', border:'1px solid rgba(37,99,235,0.15)' }}>
          <RefreshCw size={15} /> Tải lại
        </button>
        <button onClick={() => window.location.href='/'} className="err-btn"
          style={{ background:'linear-gradient(135deg,#1e3a8a,#2563eb)', color:'white', boxShadow:'0 4px 16px rgba(37,99,235,0.3)' }}>
          <Home size={15} /> Trang chủ
        </button>
      </div>
    </div>

    <p style={{ marginTop:20, fontSize:'0.75rem', color:'#94a3b8', animation:'err-fade .6s ease .2s both' }}>
      © Trường Đại học Kỹ thuật Công nghiệp Thái Nguyên
    </p>
  </div>
);

export default ErrorPage;
