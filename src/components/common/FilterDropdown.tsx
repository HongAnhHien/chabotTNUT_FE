import { type FC, type ReactNode, useEffect, useRef, useState } from "react";
import { Filter, ChevronDown } from "lucide-react";

export interface FilterOption {
  key: string;
  label: string;
  dot?: string;
  icon?: ReactNode;
}

interface Props {
  options: FilterOption[];
  value: string;
  onChange: (key: string) => void;
  minWidth?: number;
}

const FilterDropdown: FC<Props> = ({ options, value, onChange, minWidth = 160 }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.key === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        className={`ssd-filter-btn${value !== "all" ? " active" : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <Filter size={13} />
        {current.label}
        <ChevronDown size={12} style={{ transition: "transform .2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50, background: "white", borderRadius: 12, boxShadow: "0 8px 28px rgba(30,58,138,0.14)", border: "1px solid rgba(30,58,138,0.08)", minWidth, overflow: "hidden", animation: "ssd-fade .15s ease" }}>
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => { onChange(opt.key); setOpen(false); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: value === opt.key ? "rgba(37,99,235,0.06)" : "none", border: "none", cursor: "pointer", textAlign: "left", fontSize: "0.8rem", fontWeight: value === opt.key ? 700 : 500, color: value === opt.key ? "#2563eb" : "#334155", transition: "background .12s" }}
              onMouseEnter={(e) => { if (value !== opt.key) (e.currentTarget as HTMLElement).style.background = "rgba(37,99,235,0.04)"; }}
              onMouseLeave={(e) => { if (value !== opt.key) (e.currentTarget as HTMLElement).style.background = "none"; }}
            >
              {opt.dot && (
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: opt.dot, flexShrink: 0, display: "inline-block" }} />
              )}
              {opt.icon && <span style={{ color: "inherit" }}>{opt.icon}</span>}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
