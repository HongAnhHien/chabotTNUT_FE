import { type FC } from 'react';
import { useEduMaps, labelMonHoc } from '@/infra/edusoft/edusoft';

/**
 * Nhãn giải mã mã môn học: hiện "năm học dự kiến" và khoa/bộ môn phụ trách (tooltip).
 * Là phụ trợ — nếu không tra được thì không hiển thị gì.
 */
const MonHocBadge: FC<{ maMon: string; className?: string }> = ({ maMon, className }) => {
  const maps = useEduMaps();
  const label = labelMonHoc(maMon, maps);
  if (!label || !label.nam_hoc) return null;

  const namNgan = label.nam_hoc.split('–')[0].trim(); // "Năm 2" từ "Năm 2 – cơ sở khối ngành"
  const tip = [label.nam_hoc, label.khoa, label.bo_mon].filter(Boolean).join(' · ')
    + (label.tin_cay ? ` (tin cậy: ${label.tin_cay})` : '');

  return (
    <span
      className={className}
      title={tip}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: '0.68rem', fontWeight: 700,
        color: '#1e3a8a', background: 'rgba(37,99,235,0.08)',
        border: '1px solid rgba(37,99,235,0.18)', borderRadius: 999,
        padding: '1px 8px', whiteSpace: 'nowrap',
      }}
    >
      {namNgan}
    </span>
  );
};

export default MonHocBadge;
