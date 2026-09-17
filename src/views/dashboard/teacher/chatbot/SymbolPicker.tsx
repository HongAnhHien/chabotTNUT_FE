import { useState } from 'react';

/**
 * Bảng chọn ký hiệu Toán – Hóa cho ô chat.
 * Mỗi nút chèn một đoạn LaTeX vào vị trí con trỏ. Dấu `$0` = nơi đặt con trỏ sau khi chèn.
 * Toán: KaTeX ($$…$$ / $…$).  Hóa: mhchem (\ce{…}).
 */

interface Sym { l: string; t: string } // l = nhãn hiển thị, t = template chèn (có thể chứa $0)
interface Group { name: string; items: Sym[] }

const MATH: Group[] = [
  {
    name: 'Khối & cơ bản',
    items: [
      { l: '$$ $$', t: '$$$0$$' },
      { l: 'x²',   t: 'x^{$0}' },
      { l: 'xₙ',   t: 'x_{$0}' },
      { l: 'a⁄b',  t: '\\frac{$0}{}' },
      { l: '√',    t: '\\sqrt{$0}' },
      { l: 'ⁿ√',   t: '\\sqrt[$0]{}' },
      { l: '( )',  t: '\\left($0\\right)' },
      { l: '| |',  t: '\\left|$0\\right|' },
    ],
  },
  {
    name: 'Giải tích',
    items: [
      { l: '∑', t: '\\sum_{$0}^{}' },
      { l: '∏', t: '\\prod_{$0}^{}' },
      { l: '∫', t: '\\int_{$0}^{}' },
      { l: 'lim', t: '\\lim_{$0}' },
      { l: 'd⁄dx', t: '\\frac{d$0}{dx}' },
      { l: '∂', t: '\\partial ' },
      { l: '∇', t: '\\nabla ' },
      { l: 'v⃗', t: '\\vec{$0}' },
    ],
  },
  {
    name: 'Toán tử & quan hệ',
    items: [
      { l: '≤', t: '\\le ' }, { l: '≥', t: '\\ge ' }, { l: '≠', t: '\\ne ' },
      { l: '≈', t: '\\approx ' }, { l: '±', t: '\\pm ' }, { l: '×', t: '\\times ' },
      { l: '÷', t: '\\div ' }, { l: '·', t: '\\cdot ' }, { l: '∞', t: '\\infty ' },
      { l: '°', t: '^{\\circ}' }, { l: '∈', t: '\\in ' }, { l: '∉', t: '\\notin ' },
      { l: '⊂', t: '\\subset ' }, { l: '∪', t: '\\cup ' }, { l: '∩', t: '\\cap ' },
      { l: '∅', t: '\\emptyset ' }, { l: '∀', t: '\\forall ' }, { l: '∃', t: '\\exists ' },
      { l: '→', t: '\\to ' }, { l: '⇒', t: '\\Rightarrow ' }, { l: '⇔', t: '\\Leftrightarrow ' },
    ],
  },
  {
    name: 'Chữ Hy Lạp',
    items: [
      { l: 'α', t: '\\alpha ' }, { l: 'β', t: '\\beta ' }, { l: 'γ', t: '\\gamma ' },
      { l: 'δ', t: '\\delta ' }, { l: 'ε', t: '\\varepsilon ' }, { l: 'θ', t: '\\theta ' },
      { l: 'λ', t: '\\lambda ' }, { l: 'μ', t: '\\mu ' }, { l: 'π', t: '\\pi ' },
      { l: 'ρ', t: '\\rho ' }, { l: 'σ', t: '\\sigma ' }, { l: 'φ', t: '\\varphi ' },
      { l: 'ω', t: '\\omega ' }, { l: 'Δ', t: '\\Delta ' }, { l: 'Σ', t: '\\Sigma ' },
      { l: 'Ω', t: '\\Omega ' },
    ],
  },
];

const CHEM: Group[] = [
  {
    name: 'Khối hóa & phản ứng',
    items: [
      { l: '$$\\ce{ }$$', t: '$$\\ce{$0}$$' },
      { l: '→', t: ' -> ' }, { l: '⇌', t: ' <=> ' }, { l: '+', t: ' + ' },
      { l: '↑ (khí)', t: ' ^' }, { l: '↓ (↓)', t: ' v' },
      { l: 'Δ (t°)', t: '[\\Delta]' },
    ],
  },
  {
    name: 'Trạng thái & ion',
    items: [
      { l: '(r)', t: '(s)' }, { l: '(l)', t: '(l)' }, { l: '(k)', t: '(g)' }, { l: '(dd)', t: '(aq)' },
      { l: 'x²⁺', t: '^{2+}' }, { l: 'x³⁺', t: '^{3+}' }, { l: 'x⁺', t: '^{+}' },
      { l: 'x²⁻', t: '^{2-}' }, { l: 'x⁻', t: '^{-}' }, { l: 'ₙ', t: '_{$0}' },
    ],
  },
  {
    name: 'Chất thường gặp',
    items: [
      { l: 'H₂O', t: '$$\\ce{H2O}$$' }, { l: 'CO₂', t: '$$\\ce{CO2}$$' },
      { l: 'O₂', t: '$$\\ce{O2}$$' }, { l: 'H₂', t: '$$\\ce{H2}$$' },
      { l: 'HCl', t: '$$\\ce{HCl}$$' }, { l: 'H₂SO₄', t: '$$\\ce{H2SO4}$$' },
      { l: 'NaOH', t: '$$\\ce{NaOH}$$' }, { l: 'NaCl', t: '$$\\ce{NaCl}$$' },
      { l: 'NH₃', t: '$$\\ce{NH3}$$' }, { l: 'CaCO₃', t: '$$\\ce{CaCO3}$$' },
      { l: 'CH₄', t: '$$\\ce{CH4}$$' }, { l: 'C₆H₁₂O₆', t: '$$\\ce{C6H12O6}$$' },
    ],
  },
];

interface Props {
  onInsert: (template: string) => void;
  onClose: () => void;
}

const SymbolPicker = ({ onInsert, onClose }: Props) => {
  const [tab, setTab] = useState<'math' | 'chem'>('math');
  const groups = tab === 'math' ? MATH : CHEM;

  return (
    <div
      role="dialog"
      aria-label="Chọn ký hiệu Toán – Hóa"
      style={{
        position: 'absolute', bottom: 52, left: 0, zIndex: 40, width: 360, maxWidth: '92vw',
        background: 'white', border: '1px solid #e2e8f0', borderRadius: 14,
        boxShadow: '0 12px 32px rgba(15,23,42,.16)', padding: 12,
      }}
    >
      <style>{`
        .sym-btn:hover { border-color:#93c5fd !important; background:#eff6ff !important; color:#1d4ed8 !important; }
        .sym-tab.active { background:#2563eb; color:#fff; }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['math', 'chem'] as const).map(k => (
            <button key={k} onClick={() => setTab(k)}
              className={`sym-tab ${tab === k ? 'active' : ''}`}
              style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: '.78rem', fontWeight: 700, cursor: 'pointer' }}>
              {k === 'math' ? '∑ Toán' : '⚗ Hóa'}
            </button>
          ))}
        </div>
        <button onClick={onClose} title="Đóng"
          style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: '#f1f5f9', color: '#64748b', cursor: 'pointer', fontSize: 15, lineHeight: 1 }}>×</button>
      </div>

      <div style={{ maxHeight: 300, overflowY: 'auto', paddingRight: 2 }}>
        {groups.map(g => (
          <div key={g.name} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: '.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: .4, margin: '2px 2px 5px' }}>{g.name}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {g.items.map(s => (
                <button key={s.l + s.t} onClick={() => onInsert(s.t)} className="sym-btn"
                  title={s.t.replace('$0', '…')}
                  style={{ minWidth: 34, height: 32, padding: '0 8px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#334155', fontSize: '.86rem', fontWeight: 600, cursor: 'pointer', transition: 'all .12s' }}>
                  {s.l}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 6, fontSize: '.68rem', color: '#94a3b8', lineHeight: 1.4 }}>
        Mẹo: bấm <b>$$ $$</b> để mở khối công thức, rồi chọn ký hiệu chèn vào giữa. Hóa học dùng <b>$$\ce{'{…}'}$$</b>.
      </div>
    </div>
  );
};

export default SymbolPicker;
