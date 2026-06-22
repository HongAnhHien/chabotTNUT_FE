import type { TTable } from './DataTable';
import { Search, X, SlidersHorizontal, Filter } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


interface Props {
  table:          TTable;
  search:         string;
  onSearchChange: (v: string) => void;
  classFilter:    string;
  onClassFilter:  (v: string) => void;
  classOptions:   string[];
}

export function ClassStudentsToolbar({ table, search, onSearchChange, classFilter, onClassFilter, classOptions }: Props) {
  const hasFilter = search !== '' || classFilter !== 'all';

  const hidable = table.getAllColumns().filter(c => c.getCanHide());

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 16px', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(37,99,235,0.08)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, flex: 1 }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          <input
            placeholder="Tìm tên hoặc mã sinh viên..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            style={{ width: '100%', paddingLeft: 32, paddingRight: search ? 32 : 12, height: 36, borderRadius: 10, border: '1px solid rgba(37,99,235,0.2)', background: 'rgba(255,255,255,0.9)', fontSize: '0.82rem', outline: 'none', color: '#1e293b' }}
          />
          {search && (
            <button onClick={() => onSearchChange('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Class filter chips */}
        {classOptions.length > 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Filter size={11} /> Lớp:
            </span>
            <button
              onClick={() => onClassFilter('all')}
              style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, border: '1px solid', cursor: 'pointer', transition: 'all .15s', background: classFilter === 'all' ? 'linear-gradient(135deg,#1e3a8a,#2563eb)' : 'rgba(255,255,255,0.8)', color: classFilter === 'all' ? 'white' : '#64748b', borderColor: classFilter === 'all' ? 'transparent' : 'rgba(37,99,235,0.2)' }}
            >
              Tất cả
            </button>
            {classOptions.map(cls => (
              <button
                key={cls}
                onClick={() => onClassFilter(classFilter === cls ? 'all' : cls)}
                style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, border: '1px solid', cursor: 'pointer', transition: 'all .15s', background: classFilter === cls ? 'linear-gradient(135deg,#1e3a8a,#2563eb)' : 'rgba(255,255,255,0.8)', color: classFilter === cls ? 'white' : '#64748b', borderColor: classFilter === cls ? 'transparent' : 'rgba(37,99,235,0.2)' }}
              >
                {cls}
              </button>
            ))}
          </div>
        )}

        {/* Clear filter */}
        {hasFilter && (
          <button
            onClick={() => { onSearchChange(''); onClassFilter('all'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.18)', color: '#dc2626', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <X size={12} /> Xóa lọc
          </button>
        )}
      </div>

      {/* Column visibility */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(37,99,235,0.2)', fontSize: '0.8rem', fontWeight: 600, color: '#1e3a8a', cursor: 'pointer' }}>
            <SlidersHorizontal size={14} /> Cột
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel>Hiển thị cột</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {hidable.map(col => (
            <DropdownMenuCheckboxItem key={col.id} checked={col.getIsVisible()} onCheckedChange={v => col.toggleVisibility(!!v)}>
              {typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
