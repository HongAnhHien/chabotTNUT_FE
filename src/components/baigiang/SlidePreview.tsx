import { type FC, type ReactNode, Fragment } from 'react';
import type { BaiGiangNoiDung, BaiGiangSlide, Bi } from '@/infra/api/interfaces/IBaiGiang';

/**
 * Xem trước 1 slide bài giảng bằng HTML — cùng màu và bố cục với bản PPTX
 * do bộ dựng dự án 26 xuất ra (navy #1B1F55, cam #FF7A00, xanh #009FDB).
 * Khung 16:9 co giãn theo bề rộng, chữ tính theo cqw nên co theo khung.
 */
const NAVY = '#1B1F55', ORANGE = '#FF7A00', CYAN = '#009FDB', INK = '#1A1D3A', MUTED = '#5B6180', PALE = '#F3F5FA';

type Lang = 'vi' | 'en';

/** "**từ khoá**" → chữ đậm màu cam, giữ xuống dòng. */
function rich(text: string, boldColor = ORANGE): ReactNode {
  return text.split('\n').map((line, li, arr) => (
    <Fragment key={li}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i} style={{ color: boldColor }}>{part.slice(2, -2)}</strong>
          : <Fragment key={i}>{part}</Fragment>)}
      {li < arr.length - 1 && <br />}
    </Fragment>
  ));
}

const t = (x: Bi | undefined, lang: Lang) => (x ? (lang === 'en' ? x.en || x.vi : x.vi) : '');
const hint = (x: Bi | undefined, lang: Lang) => (lang === 'vi' && x?.en ? x.en : '');

interface Props { lec: BaiGiangNoiDung; index: number; lang?: Lang }

const SlidePreview: FC<Props> = ({ lec, index, lang = 'vi' }) => {
  const sd: BaiGiangSlide | undefined = lec.slides[index];
  if (!sd) return null;
  const total = lec.slides.length;
  const m = lec.meta;
  const dark = sd.layout === 'title' || sd.layout === 'closing';

  const header = (
    <>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '1.2%', background: NAVY }} />
      <div style={{ position: 'absolute', left: 0, top: '7%', height: '12%', width: '1.2%', background: ORANGE }} />
      {sd.kicker && <div style={{ fontSize: '1.3cqw', color: ORANGE, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase' }}>{t(sd.kicker, lang)}</div>}
      <div style={{ fontSize: '3.1cqw', color: NAVY, fontWeight: 700, lineHeight: 1.15, marginTop: '.4cqw' }}>{t(sd.title, lang)}</div>
      {hint(sd.title, lang) && <div style={{ fontSize: '1.45cqw', color: MUTED, fontStyle: 'italic', marginTop: '.3cqw' }}>{hint(sd.title, lang)}</div>}
    </>
  );
  const footer = (
    <div style={{ position: 'absolute', left: '5.3%', right: '5.3%', bottom: '3%', borderTop: '1px solid #DDE1EC', paddingTop: '.6cqw',
      display: 'flex', justifyContent: 'space-between', fontSize: '1.05cqw', color: MUTED }}>
      <span>{m.ma_hp} · {m.ten_mon} · {lang === 'vi' ? 'Bài' : 'Lesson'} {m.bai}</span>
      <span>{index + 1}/{total}</span>
    </div>
  );

  const numberedList = (items: Bi[], light = false) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4cqw', marginTop: '2.2cqw' }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', gap: '1.6cqw', alignItems: 'flex-start' }}>
          <span style={{ flexShrink: 0, width: '4.6cqw', height: '4.6cqw', borderRadius: '50%', background: ORANGE, color: 'white',
            display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '1.7cqw' }}>{i + 1}</span>
          <div>
            <div style={{ fontSize: '2cqw', color: light ? 'white' : INK, lineHeight: 1.3 }}>{rich(t(it, lang))}</div>
            {!light && hint(it, lang) && <div style={{ fontSize: '1.3cqw', color: MUTED, fontStyle: 'italic', marginTop: '.2cqw' }}>{hint(it, lang)}</div>}
          </div>
        </div>
      ))}
    </div>
  );

  let body: ReactNode = null;
  switch (sd.layout) {
    case 'title':
      body = (
        <div style={{ position: 'absolute', inset: 0, padding: '9% 8%', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '2.6%', background: ORANGE }} />
          <div style={{ fontSize: '1.5cqw', color: ORANGE, fontWeight: 700 }}>{m.ma_hp} · {m.ten_mon.toUpperCase()}</div>
          <div style={{ fontSize: '2cqw', color: '#9FD8F5', fontWeight: 700, marginTop: '2cqw' }}>{lang === 'vi' ? 'BÀI' : 'LESSON'} {m.bai}</div>
          <div style={{ fontSize: '4.2cqw', fontWeight: 700, lineHeight: 1.1, marginTop: '.6cqw', maxWidth: '62%' }}>{t(lec.ten_bai, lang)}</div>
          {hint(lec.ten_bai, lang) && <div style={{ fontSize: '1.8cqw', color: '#C9CCE8', fontStyle: 'italic', marginTop: '.8cqw' }}>{hint(lec.ten_bai, lang)}</div>}
          <div style={{ width: '9%', height: '.5cqw', background: ORANGE, margin: '2.6cqw 0 1.6cqw' }} />
          <div style={{ fontSize: '1.8cqw', fontWeight: 700 }}>{m.giang_vien}</div>
          <div style={{ fontSize: '1.3cqw', color: '#C9CCE8', marginTop: '.4cqw' }}>Trường Đại học Kỹ thuật Công nghiệp – ĐH Thái Nguyên</div>
        </div>
      );
      break;
    case 'bullets':
    case 'summary': {
      const items = sd.bullets === 'CLO' ? lec.clo : (sd.bullets ?? []);
      body = <>{header}{numberedList(items)}</>;
      break;
    }
    case 'question':
      body = (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '80%' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '1.2%', background: NAVY }} />
          <div style={{ fontSize: '1.3cqw', color: ORANGE, fontWeight: 700, textTransform: 'uppercase' }}>{t(sd.kicker, lang)}</div>
          <div style={{ borderLeft: `.9cqw solid ${ORANGE}`, paddingLeft: '2.2cqw', marginTop: '1.6cqw' }}>
            <div style={{ fontSize: '3.9cqw', color: NAVY, fontWeight: 700, lineHeight: 1.12 }}>{t(sd.title, lang)}</div>
            {hint(sd.title, lang) && <div style={{ fontSize: '1.6cqw', color: MUTED, fontStyle: 'italic', marginTop: '.6cqw' }}>{hint(sd.title, lang)}</div>}
          </div>
          {t(sd.sub, lang) && <div style={{ marginTop: '3cqw', background: '#E6F5FC', borderRadius: '1.2cqw', padding: '1.6cqw 2cqw', fontSize: '1.8cqw', color: NAVY, textAlign: 'center' }}>{rich(t(sd.sub, lang))}</div>}
        </div>
      );
      break;
    case 'definition':
      body = (
        <>{header}
          <div style={{ marginTop: '2.4cqw', background: PALE, borderLeft: `.9cqw solid ${NAVY}`, borderRadius: '1cqw', padding: '1.6cqw 2.4cqw' }}>
            <div style={{ fontSize: '1.1cqw', color: CYAN, fontWeight: 700 }}>{lang === 'vi' ? 'ĐỊNH NGHĨA' : 'DEFINITION'}</div>
            <div style={{ fontSize: '2.1cqw', color: INK, lineHeight: 1.35, marginTop: '.5cqw' }}>{rich(t(sd.body, lang))}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, sd.terms?.length ?? 1)}, 1fr)`, gap: '2cqw', marginTop: '2.2cqw' }}>
            {(sd.terms ?? []).map(([vi, en], i) => (
              <div key={i} style={{ border: `1.5px solid ${CYAN}`, borderRadius: '1cqw', padding: '1.1cqw', textAlign: 'center' }}>
                <div style={{ fontSize: '1.9cqw', color: NAVY, fontWeight: 700 }}>{lang === 'vi' ? vi : en}</div>
                <div style={{ fontSize: '1.3cqw', color: MUTED, fontStyle: 'italic' }}>{lang === 'vi' ? en : vi}</div>
              </div>
            ))}
          </div>
        </>
      );
      break;
    case 'cards3':
      body = (
        <>{header}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2.2cqw', marginTop: '2.4cqw' }}>
            {(sd.cards ?? []).map((c, i) => (
              <div key={i} style={{ background: PALE, borderRadius: '1.4cqw', borderTop: `.7cqw solid ${[CYAN, ORANGE, NAVY][i]}`, padding: '1.6cqw', minHeight: '24cqw', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '1cqw', alignItems: 'center' }}>
                  <span style={{ flexShrink: 0, width: '3.8cqw', height: '3.8cqw', borderRadius: '50%', background: NAVY, color: 'white', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '1.4cqw' }}>{i + 1}</span>
                  <div>
                    <div style={{ fontSize: '1.9cqw', color: NAVY, fontWeight: 700, lineHeight: 1.15 }}>{t(c.h, lang)}</div>
                    {hint(c.h, lang) && <div style={{ fontSize: '1.1cqw', color: MUTED, fontStyle: 'italic' }}>{hint(c.h, lang)}</div>}
                  </div>
                </div>
                <div style={{ fontSize: '1.6cqw', color: INK, lineHeight: 1.35, marginTop: '1.4cqw', flex: 1 }}>{rich(t(c.b, lang))}</div>
                <div style={{ fontSize: '1.2cqw', color: CYAN, fontWeight: 700 }}>{t(c.eg, lang)}</div>
              </div>
            ))}
          </div>
        </>
      );
      break;
    case 'versus':
      body = (
        <>{header}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '2cqw', alignItems: 'center', marginTop: '2.4cqw' }}>
            {[sd.left, null, sd.right].map((side, i) => side === null
              ? <span key={i} style={{ width: '6.6cqw', height: '6.6cqw', borderRadius: '50%', background: NAVY, color: 'white', display: 'grid', placeItems: 'center', fontSize: '2.4cqw' }}>⇄</span>
              : (
                <div key={i} style={{ border: `2px solid ${i === 0 ? CYAN : ORANGE}`, background: i === 0 ? '#E6F5FC' : '#FFEFE0', borderRadius: '1.4cqw', padding: '2cqw', textAlign: 'center', minHeight: '17cqw' }}>
                  <div style={{ fontSize: '2.2cqw', color: i === 0 ? CYAN : ORANGE, fontWeight: 700 }}>{t(side?.h, lang)}</div>
                  <div style={{ fontSize: '2cqw', color: NAVY, fontWeight: 700, marginTop: '1.2cqw', lineHeight: 1.3 }}>{rich(t(side?.b, lang), NAVY)}</div>
                </div>
              ))}
          </div>
          {t(sd.note, lang) && <div style={{ marginTop: '2.2cqw', background: NAVY, color: 'white', borderRadius: '1.2cqw', padding: '1.5cqw', fontSize: '1.8cqw', fontWeight: 700, textAlign: 'center' }}>{t(sd.note, lang)}</div>}
        </>
      );
      break;
    case 'example':
      body = (
        <>{header}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.6cqw', marginTop: '2.4cqw' }}>
            {(sd.rows ?? []).map(([k, v], i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '26% 1fr', gap: '1.2cqw' }}>
                <div style={{ background: [NAVY, CYAN, ORANGE][i], color: 'white', borderRadius: '1.2cqw', display: 'grid', placeItems: 'center', padding: '1.6cqw', fontSize: '1.8cqw', fontWeight: 700, textAlign: 'center' }}>{t(k, lang)}</div>
                <div style={{ background: PALE, borderRadius: '1.2cqw', padding: '1.4cqw 2cqw', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '1.75cqw', color: INK }}>{rich(t(v, lang))}</div>
                  {hint(v, lang) && <div style={{ fontSize: '1.2cqw', color: MUTED, fontStyle: 'italic' }}>{hint(v, lang)}</div>}
                </div>
              </div>
            ))}
          </div>
        </>
      );
      break;
    case 'closing':
      body = (
        <div style={{ position: 'absolute', inset: 0, padding: '5% 8%', color: 'white' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '2.6%', background: ORANGE }} />
          <div style={{ fontSize: '1.3cqw', color: ORANGE, fontWeight: 700, textTransform: 'uppercase' }}>{t(sd.kicker, lang)}</div>
          <div style={{ fontSize: '3.1cqw', fontWeight: 700, marginTop: '.4cqw' }}>{t(sd.title, lang)}</div>
          {numberedList(Array.isArray(sd.bullets) ? sd.bullets : [], true)}
          {t(sd.next, lang) && <div style={{ marginTop: '2.6cqw', background: '#2A2E7A', borderRadius: '1.2cqw', padding: '1.3cqw 2cqw', fontSize: '1.7cqw', fontWeight: 700, maxWidth: '64%' }}>
            {lang === 'vi' ? 'Tiếp theo → ' : 'Next → '}{t(sd.next, lang)}</div>}
        </div>
      );
      break;
  }

  return (
    <div style={{ width: '100%', aspectRatio: '16 / 9', containerType: 'inline-size', position: 'relative', overflow: 'hidden',
      background: dark ? NAVY : 'white', borderRadius: 10, boxShadow: '0 4px 18px rgba(27,31,85,0.14)',
      fontFamily: "'Segoe UI','Be Vietnam Pro',system-ui,sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, padding: dark ? 0 : '4.2% 5.3% 0' }}>{body}</div>
      {!dark && footer}
    </div>
  );
};

export default SlidePreview;
