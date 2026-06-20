import { type FC } from 'react';
import { MapPin, Calendar, User, BarChart3 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useManageLocationsStore } from '../stores/location_store';
import { getImageUrl } from '@/helper/image_url';

const NGUY_CO_COLOR: Record<string, string> = {
  'cao':        'bg-red-100 text-red-700',
  'trung bình': 'bg-yellow-100 text-yellow-700',
  'thấp':       'bg-emerald-100 text-emerald-700',
};

const CHAM_DIEM_LABELS: Record<string, string> = {
  do_doc:   'Độ dốc',
  taluy:    'Taluy',
  lop_phu:  'Lớp phủ',
  loai_dat: 'Loại đất',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

const LocationDetailDialog: FC = () => {
  const { dialogMode, selected, isLoading, closeDialog } = useManageLocationsStore();
  const open = dialogMode === 'detail';

  const nguyCo  = selected?.cham_diem?.nguy_co ?? '';
  const badgeCls = NGUY_CO_COLOR[nguyCo.toLowerCase()] ?? 'bg-gray-100 text-gray-700';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeDialog()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ color: '#1e4429' }}>Chi tiết địa điểm</DialogTitle>
        </DialogHeader>

        {isLoading || !selected ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            Đang tải...
          </div>
        ) : (
          <div className="space-y-5">
            {/* Location header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">{selected.ten_xa}</h3>
                {(selected.ten_huyen || selected.ten_tinh) && (
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{[selected.ten_huyen, selected.ten_tinh].filter(Boolean).join(', ')}</span>
                  </div>
                )}
              </div>
              {nguyCo && (
                <Badge className={`text-xs border-0 shrink-0 capitalize ${badgeCls}`}>
                  Nguy cơ {nguyCo}
                </Badge>
              )}
            </div>

            {/* Chấm điểm */}
            {selected.cham_diem && (
              <div className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <BarChart3 className="h-4 w-4" style={{ color: '#2F6B3F' }} />
                  Chấm điểm
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(CHAM_DIEM_LABELS).map(([key, label]) => {
                    const raw = (selected.cham_diem as Record<string, unknown>)?.[key];
                    if (!raw || typeof raw !== 'object') return null;
                    const field = raw as { diem?: number | null; mo_ta?: string };
                    return (
                      <div key={key} className="rounded-lg bg-muted/40 px-3 py-2">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        {field.diem != null && (
                          <p className="text-sm font-semibold mt-0.5">{field.diem}</p>
                        )}
                        {field.mo_ta && (
                          <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">
                            {field.mo_ta}
                          </p>
                        )}
                        {field.diem == null && !field.mo_ta && (
                          <p className="text-sm text-muted-foreground mt-0.5">—</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Coordinates */}
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">Tọa độ:</span>
              <code className="bg-muted px-2 py-0.5 rounded text-xs">
                {selected.toa_do.lat.toFixed(6)}, {selected.toa_do.lng.toFixed(6)}
              </code>
            </div>

            {/* Images */}
            {selected.images.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Hình ảnh</p>
                <div className="grid grid-cols-2 gap-2">
                  {selected.images.map((img, i) => (
                    <div key={i} className="rounded-lg overflow-hidden border border-border">
                      <img
                        src={getImageUrl(img.url)}
                        alt={img.caption ?? `Ảnh ${i + 1}`}
                        className="w-full h-32 object-cover"
                      />
                      {img.caption && (
                        <p className="text-xs text-muted-foreground px-2 py-1 truncate">{img.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-t border-border pt-3">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span>{selected.created_by?.name ?? '—'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(selected.createdAt)}</span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LocationDetailDialog;
