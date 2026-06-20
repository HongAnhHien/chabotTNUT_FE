import { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, ImageDown, Loader2, ImageOff } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ILocationImage } from '@/infra/api/interfaces/ILocation';
import { getImageUrl } from '@/helper/image_url';

async function downloadImage(url: string, filename: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

interface Props {
  open: boolean;
  onClose: () => void;
  images: ILocationImage[];
  locationName?: string;
}

export default function ImagesDetailDialog({ open, onClose, images, locationName = 'anh' }: Props) {
  const [selectedIdx,    setSelectedIdx]    = useState(0);
  const [downloadingIdx, setDownloadingIdx] = useState<number | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const hasImages = images.length > 0;
  const current   = images[selectedIdx];

  const prev = () => setSelectedIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setSelectedIdx((i) => (i + 1) % images.length);

  const handleDownloadOne = async (url: string, idx: number) => {
    setDownloadingIdx(idx);
    try { await downloadImage(getImageUrl(url), `${locationName}_${idx + 1}.jpg`); }
    finally { setDownloadingIdx(null); }
  };

  const handleDownloadAll = async () => {
    const valid = images.filter((img) => img.url);
    if (!valid.length) return;
    setDownloadingAll(true);
    try {
      for (let i = 0; i < valid.length; i++) {
        await downloadImage(getImageUrl(valid[i].url), `${locationName}_${i + 1}.jpg`);
        await new Promise((r) => setTimeout(r, 300));
      }
    } finally { setDownloadingAll(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden rounded-2xl gap-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div>
            <p className="text-sm font-semibold text-foreground">{locationName}</p>
            <p className="text-xs text-muted-foreground">{images.length} ảnh</p>
          </div>
          <div className="flex items-center gap-2">
            {hasImages && (
              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs mr-10"
                onClick={handleDownloadAll} disabled={downloadingAll}
              >
                {downloadingAll
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <ImageDown className="h-3.5 w-3.5" />}
                Tải tất cả
              </Button>
            )}
          </div>
        </div>

        {/* Main viewer */}
        <div className="relative bg-black/5 flex items-center justify-center" style={{ minHeight: 380 }}>
          {hasImages && current?.url ? (
            <img
              src={getImageUrl(current.url)}
              alt={current.caption ?? `Ảnh ${selectedIdx + 1}`}
              className="max-h-[60vh] w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground py-16">
              <ImageOff className="w-10 h-10 opacity-30" />
              <p className="text-sm">Không có ảnh</p>
            </div>
          )}

          {/* Download single */}
          {hasImages && current?.url && (
            <button
              onClick={() => handleDownloadOne(current.url, selectedIdx)}
              disabled={downloadingIdx === selectedIdx}
              className="absolute top-3 right-3 h-8 w-8 rounded-lg bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
              title="Tải ảnh này"
            >
              {downloadingIdx === selectedIdx
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Download className="h-4 w-4" />}
            </button>
          )}

          {/* Prev / Next */}
          {images.length > 1 && (
            <>
              <Button variant="secondary" size="icon"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full shadow"
                onClick={prev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full shadow"
                onClick={next}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              {/* Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, i) => (
                  <button key={i} onClick={() => setSelectedIdx(i)}
                    className={`h-1.5 rounded-full transition-all ${i === selectedIdx ? 'w-4 bg-white shadow' : 'w-1.5 bg-white/50'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Caption */}
        {current?.caption && (
          <div className="px-5 py-2 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">{current.caption}</p>
          </div>
        )}

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto px-5 py-3 border-t border-border">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedIdx(i)}
                className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                  i === selectedIdx ? 'border-[#2F6B3F] shadow-md' : 'border-border opacity-60 hover:opacity-100'
                }`}
              >
                {img.url
                  ? <img src={getImageUrl(img.url)} alt={`ảnh ${i + 1}`} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-muted flex items-center justify-center"><ImageOff className="w-4 h-4 text-muted-foreground" /></div>
                }
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
