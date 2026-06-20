import { useState } from 'react';
import { ImageOff, Images } from 'lucide-react';
import ImagesDetailDialog from '../dialogs/ImagesDetailDialog';
import type { ILocation } from '@/infra/api/interfaces/ILocation';
import { getImageUrl } from '@/helper/image_url';

const ImageCell = ({ row }: { row: { original: ILocation } }) => {
  const [open, setOpen] = useState(false);
  const images = row.original.images ?? [];
  const thumb  = getImageUrl(images[0]?.url);

  return (
    <div className="flex justify-center w-auto items-center gap-2">
      <button
        type="button"
        onClick={() => images.length > 0 && setOpen(true)}
        className={`relative w-12 h-12 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center transition-opacity ${
          images.length > 0 ? 'hover:opacity-80 cursor-pointer' : 'cursor-default opacity-50'
        }`}
        title={images.length > 0 ? `${images.length} ảnh` : 'Không có ảnh'}
      >
        {thumb ? (
          <img src={thumb} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImageOff className="w-4 h-4 text-muted-foreground" />
        )}
        {images.length > 1 && (
          <span className="absolute bottom-0.5 right-0.5 flex items-center gap-0.5 bg-black/60 text-white text-[9px] font-bold px-1 rounded leading-tight">
            <Images className="w-2.5 h-2.5" />{images.length}
          </span>
        )}
      </button>

      <ImagesDetailDialog
        open={open}
        onClose={() => setOpen(false)}
        images={images}
        locationName={row.original.ten_xa}
      />
    </div>
  );
};

export default ImageCell;
