import { type FC, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  MessageCircle,
  BookOpen,
  BarChart3,
  GraduationCap,
  Map,
  Bell,
  ArrowRight,
  Play,
  ChevronRight,
  Calendar,
  Users,
  FileText,
  ThumbsUp,
  Menu,
  X,
} from 'lucide-react';
import logoTNUT from '@/assets/logo_tnut/logo_tnut.png';
import bgHome from '@/assets/logo_tnut/bg_home.png';

const NAV_LINKS = [
  { label: 'Trang chủ', active: true },
  { label: 'Hỏi đáp' },
  { label: 'Ôn tập' },
  { label: 'Cố vấn học tập' },
  { label: 'Lộ trình học' },
  { label: 'Tài nguyên' },
  { label: 'Thông báo' },
];

const FEATURE_ICONS = [
  { icon: MessageCircle,  label: 'Hỏi đáp',          sub: 'mọi lúc, mọi nơi' },
  { icon: BookOpen,       label: 'Ôn tập',            sub: 'hiệu quả'         },
  { icon: BarChart3,      label: 'Theo dõi tiến độ',  sub: 'học tập'          },
  { icon: GraduationCap, label: 'Cố vấn học tập',    sub: 'thông minh'       },
  { icon: Map,            label: 'Lộ trình học tập',  sub: 'cá nhân hóa'     },
  { icon: Bell,           label: 'Nhắc lịch học, thi',sub: 'không bỏ lỡ'    },
];

const ORBIT_R  = 250;
const ICON_BOX = 52;

const ORBIT_CSS = `
  @keyframes orbit-cw  { to { transform: rotate(360deg);  } }
  @keyframes orbit-ccw { to { transform: rotate(-360deg); } }
  @keyframes core-ping {
    0%,100% { transform:translate(-50%,-50%) scale(1);    opacity:.5;  }
    50%     { transform:translate(-50%,-50%) scale(1.22); opacity:.12; }
  }
  @keyframes core-ping2 {
    0%,100% { transform:translate(-50%,-50%) scale(1);    opacity:.35; }
    50%     { transform:translate(-50%,-50%) scale(1.28); opacity:.08; }
  }
  @keyframes track-glow { 0%,100% { opacity:.35; } 50% { opacity:.7; } }
  @keyframes mobile-fade-up { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }

  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style:none; scrollbar-width:none; }
`;

const NOTIFICATIONS = [
  {
    tag: 'Thông báo',
    tagColor: 'text-blue-600',
    icon: <FileText className="w-5 h-5 text-blue-500" />,
    title: 'Lịch thi học kỳ II năm học 2023–2024',
    date: '20/05/2024',
  },
  {
    tag: 'Học vụ',
    tagColor: 'text-green-600',
    icon: (
      <span className="flex items-center justify-center w-5 h-5 rounded border-2 border-green-500 text-green-500 text-xs font-bold">✓</span>
    ),
    title: 'Đăng ký học phần học kỳ I năm học 2024–2025',
    date: '18/05/2024',
  },
  {
    tag: 'Học bổng',
    tagColor: 'text-orange-500',
    icon: <Bell className="w-5 h-5 text-orange-400" />,
    title: 'Học bổng khuyến khích học tập học kỳ II năm 2023–2024',
    date: '17/05/2024',
  },
];

const STATS = [
  { icon: Users,         value: '10.000+', label: 'Sinh viên tin dùng'    },
  { icon: MessageCircle, value: '50.000+', label: 'Câu hỏi đã giải đáp'  },
  { icon: FileText,      value: '5.000+',  label: 'Tài liệu học tập'      },
  { icon: ThumbsUp,      value: '98%',     label: 'Hài lòng'              },
];

const FEATURE_CARDS = [
  { icon: MessageCircle, title: 'Hỏi đáp AI',          desc: 'Giải đáp thắc mắc về môn học, bài tập, kiến thức chuyên ngành'       },
  { icon: BookOpen,      title: 'Ôn tập & Luyện đề',   desc: 'Tổng hợp tài liệu, đề thi, bài tập và luyện đề theo chủ đề'          },
  { icon: GraduationCap,title: 'Cố vấn học tập',       desc: 'Tư vấn chọn môn, kế hoạch học tập, định hướng ngành nghề'            },
  { icon: Map,           title: 'Lộ trình học tập',    desc: 'Cá nhân hóa lộ trình học tập theo mục tiêu của bạn'                  },
  { icon: Bell,          title: 'Nhắc lịch & Theo dõi',desc: 'Nhắc lịch học, lịch thi, theo dõi tiến độ và kết quả học tập'       },
];

const Home: FC = () => {
  const navigate   = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="min-h-screen flex flex-col font-sans overflow-x-hidden" style={{ background: '#eef4ff' }}>
      <style>{ORBIT_CSS}</style>

      {/* Background */}
      <div
        className="fixed w-full h-full inset-0 bg-cover bg-center bg-no-repeat pointer-events-none z-0"
        style={{ backgroundImage: `url(${bgHome})` }}
      />

      {/* ════════════ NAVBAR ════════════ */}
      <header className="sticky top-0 z-50 w-full px-3 sm:px-6 py-3 sm:py-5">
        <div
          className="w-full flex items-center gap-3 sm:gap-6 px-3 sm:px-5 h-14 rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.35)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(255,255,255,0.55)',
            boxShadow: '0 4px 24px rgba(99,140,255,0.10), 0 1px 0 rgba(255,255,255,0.8) inset',
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <img src={logoTNUT} alt="TNUT" className="h-16 w-16 sm:h-20 sm:w-20 object-contain drop-shadow" />
          </div>

          {/* Divider (desktop) */}
          <div className="hidden lg:block h-5 w-px bg-blue-200/60 shrink-0" />

          {/* Nav Links (desktop) */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1">
            {NAV_LINKS.map(link => (
              <button
                key={link.label}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  link.active
                    ? 'text-blue-700 font-semibold'
                    : 'text-slate-600/90 hover:text-blue-700 hover:bg-white/50'
                }`}
                style={link.active ? {
                  background: 'rgba(255,255,255,0.70)',
                  boxShadow: '0 2px 8px rgba(99,140,255,0.14), inset 0 1px 0 rgba(255,255,255,1)',
                  border: '1px solid rgba(147,197,253,0.5)',
                } : undefined}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Spacer on mobile */}
          <div className="flex-1 lg:hidden" />

          {/* Login button */}
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 sm:px-5 py-2 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:brightness-110 shrink-0"
            style={{
              background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
              boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
            }}
          >
            Đăng nhập
            <svg className="w-4 h-4 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>

          {/* Hamburger (mobile) */}
          <button
            className="lg:hidden p-2 rounded-xl text-blue-700 hover:bg-white/50 transition-colors shrink-0"
            onClick={() => setMobileMenu(v => !v)}
            aria-label="Menu"
          >
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile nav dropdown */}
        {mobileMenu && (
          <div
            className="lg:hidden mx-3 mt-1 rounded-2xl p-3 flex flex-col gap-1"
            style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.7)',
              boxShadow: '0 8px 24px rgba(99,140,255,0.12)',
              animation: 'mobile-fade-up .2s ease both',
            }}
          >
            {NAV_LINKS.map(link => (
              <button
                key={link.label}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-colors ${
                  link.active ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                }`}
                onClick={() => setMobileMenu(false)}
              >
                {link.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ════════════ MAIN ════════════ */}
      <main className="relative z-10 flex-1">
        <section className="w-full px-3 sm:px-6 lg:px-10 pt-6 sm:pt-10 lg:pt-12 pb-8 sm:pb-12">

          {/* Grid: 1 col mobile → 2 col md → 3 col desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_2fr_1fr] gap-6 lg:gap-10 items-start">

            {/* ── Left: Text ── (order 1 always) */}
            <div className="flex flex-col justify-center pt-2 lg:pt-8 pb-4 order-1">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-blue-900 leading-tight">
                TNUT<br />
                <span className="text-blue-700">Academic Assistant</span>
              </h1>
              <p className="mt-3 text-blue-800 font-semibold text-sm sm:text-base">
                Trợ lý học tập & Cố vấn học tập thông minh dành cho sinh viên TNUT
              </p>
              <p className="mt-2 text-slate-500 text-sm leading-relaxed max-w-sm">
                Đồng hành cùng bạn trên hành trình chinh phục tri thức, định hướng tương lai và phát triển bản thân toàn diện.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col xs:flex-row sm:flex-row items-start sm:items-center gap-3 mt-5 sm:mt-6">
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800 text-white font-semibold text-sm px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-lg transition-colors w-full sm:w-auto justify-center sm:justify-start"
                >
                  <BookOpen className="w-4 h-4" />
                  Bắt đầu ngay
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button className="flex items-center gap-2 border border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold text-sm px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-colors w-full sm:w-auto justify-center sm:justify-start">
                  <Play className="w-4 h-4 fill-blue-700" />
                  Khám phá tính năng
                </button>
              </div>

              {/* Stats: 2 cols on mobile, 4 on large */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-10 bg-white/70 backdrop-blur rounded-2xl p-3 sm:p-4 shadow-sm border border-blue-100">
                {STATS.map(s => (
                  <div key={s.label} className="flex flex-col items-center text-center gap-1">
                    <s.icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    <span className="text-base sm:text-lg font-black text-blue-900">{s.value}</span>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 leading-tight">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Center: Orbit (desktop only) ── */}
            <div className="hidden lg:flex relative items-center justify-center order-2" style={{ height: 600, overflow: 'hidden' }}>
              {/* Radial glow */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(99,140,255,.13) 0%, rgba(147,197,253,.06) 45%, transparent 72%)',
              }} />

              {/* Orbit track ring */}
              <div className="absolute rounded-full pointer-events-none" style={{
                width: ORBIT_R * 2, height: ORBIT_R * 2,
                top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                border: '1.5px solid rgba(99,140,255,.28)',
                boxShadow: '0 0 18px rgba(99,140,255,.1), inset 0 0 18px rgba(99,140,255,.06)',
                animation: 'track-glow 3s ease-in-out infinite',
              }} />

              {/* Inner dashed ring */}
              <div className="absolute rounded-full pointer-events-none" style={{
                width: ORBIT_R * .72, height: ORBIT_R * .72,
                top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                border: '1px dashed rgba(147,197,253,.22)',
              }} />

              {/* Track dots */}
              {[0,30,60,90,120,150,180,210,240,270,300,330].map(deg => {
                const isMain = deg % 60 === 0;
                const sz = isMain ? 5 : 3;
                return (
                  <div key={deg} className="absolute pointer-events-none" style={{
                    top: '50%', left: '50%',
                    height: 0, width: ORBIT_R,
                    transformOrigin: 'left center',
                    transform: `rotate(${deg}deg)`,
                  }}>
                    <div style={{
                      position: 'absolute',
                      left: ORBIT_R - sz / 2,
                      top: -sz / 2,
                      width: sz, height: sz,
                      borderRadius: '50%',
                      background: isMain ? 'rgba(99,140,255,.65)' : 'rgba(147,197,253,.38)',
                    }} />
                  </div>
                );
              })}

              {/* Spinning icons */}
              <div className="absolute inset-0" style={{ animation: 'orbit-cw 14s linear infinite', willChange: 'transform' }}>
                {FEATURE_ICONS.map(({ icon: Icon, label, sub }, i) => {
                  const startDeg = i * 60;
                  return (
                    <div key={label} className="absolute" style={{
                      top: '50%', left: '50%',
                      height: 0, width: ORBIT_R,
                      transformOrigin: 'left center',
                      transform: `rotate(${startDeg}deg)`,
                    }}>
                      <div style={{ position: 'absolute', left: ORBIT_R - ICON_BOX / 2, top: -ICON_BOX / 2 }}>
                        <div style={{ transform: `rotate(-${startDeg}deg)` }}>
                          <div style={{ animation: 'orbit-ccw 14s linear infinite', willChange: 'transform' }}>
                            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                              <div style={{
                                width: ICON_BOX, height: ICON_BOX,
                                borderRadius: 14,
                                background: 'rgba(255,255,255,.88)',
                                backdropFilter: 'blur(14px)',
                                WebkitBackdropFilter: 'blur(14px)',
                                border: '1px solid rgba(147,197,253,.55)',
                                boxShadow: '0 4px 20px rgba(99,140,255,.18), inset 0 1px 0 rgba(255,255,255,.9)',
                                display:'flex', alignItems:'center', justifyContent:'center',
                              }}>
                                <Icon style={{ width:22, height:22, color:'#2563eb' }} />
                              </div>
                              <span style={{ fontSize:10, fontWeight:700, color:'#1e3a8a', whiteSpace:'nowrap', lineHeight:1.3 }}>{label}</span>
                              <span style={{ fontSize:9, color:'#94a3b8', lineHeight:1.2 }}>{sub}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Right: Notifications ── order-2 on mobile (below text), order-3 on desktop */}
            <div className="flex flex-col gap-4 order-2 md:order-2 lg:order-3">
              {/* Notification Panel */}
              <div className="bg-white/90 backdrop-blur rounded-2xl shadow-md border border-blue-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-blue-900 text-sm">Thông báo mới</span>
                  </div>
                  <button className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                    Xem tất cả <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {NOTIFICATIONS.map(n => (
                    <div key={n.title} className="flex items-start gap-2.5 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <div className="mt-0.5 shrink-0">{n.icon}</div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-[10px] font-semibold ${n.tagColor}`}>{n.tag}</span>
                        <p className="text-[11px] text-slate-700 font-medium leading-snug line-clamp-2 mt-0.5">{n.title}</p>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {n.date}
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-1" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Quote Card */}
              <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-4 sm:p-5 shadow-lg text-white">
                <div className="text-3xl font-black text-blue-300/60 leading-none mb-2">"</div>
                <p className="text-sm font-semibold leading-relaxed">
                  Tri thức là sức mạnh,<br />
                  kỷ luật là chìa khóa,<br />
                  công nghệ là trợ thủ đắc lực.
                </p>
                <p className="text-blue-300 text-[11px] mt-3 font-medium">– TNUT Academic Assistant –</p>
              </div>

              {/* Feature icons mini grid — visible only on mobile/tablet (no orbit shown) */}
              <div className="lg:hidden grid grid-cols-3 gap-2">
                {FEATURE_ICONS.map(({ icon: Icon, label }) => (
                  <div key={label}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl text-center"
                    style={{ background:'rgba(255,255,255,0.7)', border:'1px solid rgba(147,197,253,0.3)' }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-blue-700" />
                    </div>
                    <span className="text-[10px] font-700 text-blue-900 leading-tight font-semibold">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ════════════ FEATURE STRIP ════════════ */}
        {/* Desktop: horizontal strip */}
        <div className="hidden lg:block relative z-10 mx-10 mb-6" style={{
          background: 'rgba(255,255,255,0.45)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.55)',
          borderRadius: 16,
          boxShadow: '0 2px 16px rgba(99,140,255,0.08)',
        }}>
          <div className="flex items-stretch divide-x divide-blue-100/60 px-10 py-3">
            {FEATURE_CARDS.map(card => (
              <button key={card.title} className="flex-1 flex items-center gap-2.5 px-4 py-3 hover:bg-blue-50/50 transition-colors text-left group min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
                  <card.icon className="w-4 h-4 text-blue-700" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-blue-900 text-xs leading-tight">{card.title}</div>
                  <div className="text-slate-400 text-[10px] leading-tight truncate mt-0.5">{card.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile/Tablet: horizontal scroll strip */}
        <div className="lg:hidden relative z-10 mx-3 sm:mx-6 mb-6 rounded-2xl overflow-hidden" style={{
          background: 'rgba(255,255,255,0.45)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.55)',
          boxShadow: '0 2px 16px rgba(99,140,255,0.08)',
        }}>
          <div className="flex overflow-x-auto hide-scrollbar px-3 py-2 gap-2">
            {FEATURE_CARDS.map(card => (
              <button key={card.title} className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-blue-50/60 transition-colors text-left group"
                style={{ minWidth: 160 }}>
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
                  <card.icon className="w-3.5 h-3.5 text-blue-700" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-blue-900 text-[11px] leading-tight whitespace-nowrap">{card.title}</div>
                  <div className="text-slate-400 text-[9px] leading-tight line-clamp-1 mt-0.5">{card.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <footer className="relative z-10 text-center pb-4">
          <p className="text-[10px] text-slate-400/70 tracking-widest px-4">
            ✦ &nbsp;TNUT Academic Assistant – Đồng hành cùng sinh viên trên hành trình tri thức&nbsp; ✦
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Home;
