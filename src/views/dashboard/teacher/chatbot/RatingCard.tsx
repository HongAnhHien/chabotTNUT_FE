import { useState } from 'react';
import { Star, X } from 'lucide-react';

interface Props {
  onSubmit: (score: number) => void;
  onSkip: () => void;
}

const RatingCard = ({ onSubmit, onSkip }: Props) => {
  const [hovered, setHovered] = useState(0);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto 10px', padding: '0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', flexShrink: 0 }}>Chatbot có hữu ích không?</span>
        <div style={{ display: 'flex', gap: 2 }}>
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => onSubmit(n)}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}
              title={`${n} sao`}
            >
              <Star size={17} color={n <= hovered ? '#f59e0b' : '#cbd5e1'} fill={n <= hovered ? '#f59e0b' : 'none'} />
            </button>
          ))}
        </div>
        <button
          onClick={onSkip}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 600, flexShrink: 0 }}
        >
          <X size={12} /> Bỏ qua
        </button>
      </div>
    </div>
  );
};

export default RatingCard;
