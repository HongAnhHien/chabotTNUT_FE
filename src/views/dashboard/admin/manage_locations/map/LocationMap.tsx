import { type FC, useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindow } from '@react-google-maps/api';
import { ImageOff, Images, Loader2, Maximize2, Minimize2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { ILocation, IMapLocation } from '@/infra/api/interfaces/ILocation';
import { useManageLocationsStore } from '../stores/location_store';
import LocationApi from '@/infra/location/location_api';
import { getImageUrl } from '@/helper/image_url';
import ImagesDetailDialog from '../dialogs/ImagesDetailDialog';

// ── Config ────────────────────────────────────────────────────────────────────
const MAP_CENTER = { lat: 22.0, lng: 105.5 };
const DEFAULT_ZOOM = 7;

const VIETNAM_NORTH_BOUNDS = {
  north: 24.5,
  south: 20.0,
  east:  110.0,
  west:  100.0,
};

// ── Colors ────────────────────────────────────────────────────────────────────
const NGUY_CO_COLOR: Record<string, string> = {
  'cao':        '#dc2626',
  'trung bình': '#ea580c',
  'thấp':       '#16a34a',
};

const LEGEND: [string, string][] = [
  ['Nguy cơ cao',        '#dc2626'],
  ['Nguy cơ trung bình', '#ea580c'],
  ['Nguy cơ thấp',       '#16a34a'],
];

const getColor = (nguyCo?: string) =>
  NGUY_CO_COLOR[nguyCo?.toLowerCase() ?? ''] ?? '#6b7280';

const makeSvgUrl = (color: string, size: number) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
    `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${color}" stroke="white" stroke-width="2"/>` +
    `</svg>`,
  )}`;

// ── Map types ─────────────────────────────────────────────────────────────────
const MAP_TYPES = [
  { id: 'roadmap'   as const, label: 'Bản đồ'  },
  { id: 'satellite' as const, label: 'Vệ tinh' },
];
type MapTypeId = 'roadmap' | 'satellite';

// ── Popup ─────────────────────────────────────────────────────────────────────
function PopupContent({
  loc,
  full,
  loading,
}: {
  loc: IMapLocation;
  full: ILocation | null;
  loading: boolean;
}) {
  const [imgOpen, setImgOpen] = useState(false);
  const nguyCo = loc.cham_diem?.nguy_co;
  const color  = getColor(nguyCo);
  const images = full?.images ?? [];
  const thumb  = getImageUrl(images[0]?.url);

  return (
    <div className="space-y-1.5 min-w-44 max-w-56">
      {/* Thumbnail */}
      <button
        type="button"
        onClick={() => images.length > 0 && setImgOpen(true)}
        className={`relative w-full h-28 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center transition-opacity ${
          images.length > 0 ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'
        }`}
        title={images.length > 0 ? `${images.length} ảnh` : 'Không có ảnh'}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        ) : thumb ? (
          <img src={thumb} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImageOff className="w-6 h-6 text-gray-300" />
        )}
        {images.length > 1 && (
          <span className="absolute bottom-1 right-1 flex items-center gap-0.5 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-tight">
            <Images className="w-3 h-3" />{images.length}
          </span>
        )}
      </button>
       
 <p className="text-xs text-muted-foreground">{loc._id}</p>
      <p className="font-semibold text-sm text-gray-900 leading-tight">{loc.ten_xa}</p>
      {(loc.ten_huyen || loc.ten_tinh) && (
        <p className="text-xs text-gray-500">
          {[loc.ten_huyen, loc.ten_tinh].filter(Boolean).join(', ')}
        </p>
      )}
      {nguyCo && (
        <Badge
          className="text-xs border-0 capitalize"
          style={{ backgroundColor: `${color}20`, color }}
        >
          Nguy cơ {nguyCo}
        </Badge>
      )}
      <p className="text-[10px] font-mono text-gray-400">
        {loc.toa_do.lat.toFixed(5)}, {loc.toa_do.lng.toFixed(5)}
      </p>

      <ImagesDetailDialog
        open={imgOpen}
        onClose={() => setImgOpen(false)}
        images={images}
        locationName={loc.ten_xa}
      />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const LocationMap: FC = () => {
  const { mapLocations, isMapLoading, fetchMapData } = useManageLocationsStore();

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '',
  });

  const [activeLocation, setActiveLocation] = useState<IMapLocation | null>(null);
  const [fullLoc,        setFullLoc]        = useState<ILocation | null>(null);
  const [loadingPopup,   setLoadingPopup]   = useState(false);
  const [isFullscreen,   setIsFullscreen]   = useState(false);
  const [mapTypeId,      setMapTypeId]      = useState<MapTypeId>('roadmap');
  const [hoveredId,      setHoveredId]      = useState<string | null>(null);

  const handleMarkerClick = useCallback(async (loc: IMapLocation) => {
    setActiveLocation(loc);
    setFullLoc(null);
    setLoadingPopup(true);
    try {
      const res = await LocationApi.getLocationById(loc._id);
      setFullLoc(res.data.location);
    } finally {
      setLoadingPopup(false);
    }
  }, []);

  useEffect(() => {
    if (mapLocations.length === 0) fetchMapData();
  }, [fetchMapData, mapLocations.length]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((v) => !v);
    setActiveLocation(null);
    setFullLoc(null);
  }, []);
  console.log('Rendering LocationMap with', { mapLocations, isMapLoading, isLoaded,activeLocation });

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {LEGEND.map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="inline-block w-3 h-3 rounded-full border-2 border-white shadow"
              style={{ backgroundColor: color }}
            />
            {label}
          </div>
        ))}
      </div>

      {/* Map wrapper */}
      <div
        className={
          isFullscreen
            ? 'fixed inset-0 z-50'
            : 'relative z-0 rounded-xl overflow-hidden border border-border shadow-sm'
        }
      >
        {/* Loading overlay */}
        {(isMapLoading || !isLoaded) && (
          <div className="absolute inset-0 z-100 flex items-center justify-center bg-white/60">
            <span className="text-sm text-muted-foreground">Đang tải dữ liệu...</span>
          </div>
        )}

        {/* Map type switcher */}
        <div className="absolute bottom-6 left-3 z-60 flex rounded-lg overflow-hidden border border-border shadow bg-white/95 backdrop-blur-sm">
          {MAP_TYPES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMapTypeId(id)}
              className={`px-2.5 py-1.5 text-[11px] font-medium transition-colors border-r border-border last:border-0 ${
                mapTypeId === id
                  ? 'bg-[#2F6B3F] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Fullscreen toggle */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          className="absolute top-3 right-3 z-60 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm border border-border shadow text-xs font-medium text-gray-700 hover:bg-white transition-colors"
        >
          {isFullscreen
            ? <><Minimize2 className="h-3.5 w-3.5" /> Thu nhỏ</>
            : <><Maximize2 className="h-3.5 w-3.5" /> Toàn màn hình</>
          }
        </button>

        {isLoaded && (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: isFullscreen ? '100vh' : 520 }}
            center={MAP_CENTER}
            zoom={DEFAULT_ZOOM}
            mapTypeId={mapTypeId}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              gestureHandling: 'greedy',
              restriction: {
                latLngBounds: VIETNAM_NORTH_BOUNDS,
                strictBounds: false,
              },
            }}
          >
            {mapLocations.map((loc) => {
              const color     = getColor(loc.cham_diem?.nguy_co);
              const isHovered = hoveredId === loc._id;
              const size      = isHovered ? 20 : 16;
              return (
                <MarkerF
                  key={loc._id}
                  position={{ lat: loc.toa_do.lat, lng: loc.toa_do.lng }}
                  icon={{
                    url:        makeSvgUrl(color, size),
                    scaledSize: new google.maps.Size(size, size),
                    anchor:     new google.maps.Point(size / 2, size / 2),
                  }}
                  onMouseOver={() => setHoveredId(loc._id)}
                  onMouseOut={() => setHoveredId(null)}
                  onClick={() => handleMarkerClick(loc)}
                />
              );
            })}

            {activeLocation && (
              <InfoWindow
                position={{ lat: activeLocation.toa_do.lat, lng: activeLocation.toa_do.lng }}
                onCloseClick={() => setActiveLocation(null)}
                options={{ pixelOffset: new google.maps.Size(0, -8) }}
              >
                <PopupContent loc={activeLocation} full={fullLoc} loading={loadingPopup} />
              </InfoWindow>
            )}
          </GoogleMap>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-right">
        {mapLocations.length} địa điểm · © Google Maps
      </p>
    </div>
  );
};

export default LocationMap;
