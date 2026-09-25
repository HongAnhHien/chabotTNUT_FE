import { type FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Presentation, ChevronRight } from 'lucide-react';
import BaiGiangApi from '@/infra/baigiang/baigiang_api';
import type { IBaiGiangSummary } from '@/infra/api/interfaces/IBaiGiang';

/** Bài giảng AI giảng viên đã duyệt của môn — ẩn nếu môn chưa có bài nào. */
const StudentBaiGiangPanel: FC<{ maMon: string }> = ({ maMon }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<IBaiGiangSummary[]>([]);

  useEffect(() => {
    let alive = true;
    BaiGiangApi.studentList(maMon).then(r => { if (alive) setItems(r.data ?? []); }).catch(() => {});
    return () => { alive = false; };
  }, [maMon]);

  if (items.length === 0) return null;

  return (
    <div style={{ background: 'white', border: '1px solid rgba(37,99,235,0.12)', borderRadius: 16, boxShadow: '0 6px 24px rgba(37,99,235,0.05)', padding: '1.25rem', marginTop: 16 }}>
      <h3 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 700, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Presentation size={17} color="#f97316" /> Bài giảng
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(b => (
          <button key={b.id} onClick={() => navigate(`/student/bai-giang/${b.id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(37,99,235,0.18)',
              background: 'white', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
            <span style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, background: '#1B1F55', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 800 }}>{b.chuong}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontWeight: 700, color: '#1e293b' }}>{b.tieu_de}</span>
              <span style={{ display: 'block', fontSize: '0.76rem', color: '#64748b', marginTop: 2 }}>
                Chương {b.chuong} · {b.so_slide} slide · {b.so_cau_hoi} câu tự kiểm tra{b.song_ngu ? ' · Việt–Anh' : ''}
              </span>
            </span>
            <ChevronRight size={18} color="#94a3b8" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default StudentBaiGiangPanel;
