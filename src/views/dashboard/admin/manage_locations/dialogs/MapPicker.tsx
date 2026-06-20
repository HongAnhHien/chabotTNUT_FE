import { type FC, useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { Maximize2, Minimize2 } from 'lucide-react';

interface MapPickerProps {
  lat: number | undefined;
  lng: number | undefined;
  onChange: (lat: number, lng: number) => void;
}

const VIETNAM_CENTER = { lat: 21.0, lng: 105.5 };
const DEFAULT_ZOOM   = 7;
const COORD_ZOOM     = 14;

const round7 = (n: number) => Math.round(n * 1e7) / 1e7;

const MARKER_ICON_URL = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">' +
  '<circle cx="10" cy="10" r="8" fill="#2F6B3F" stroke="white" stroke-width="2.5"/>' +
  '</svg>',
)}`;

const MAP_TYPES = [
  { id: 'roadmap'   as const, label: 'Bản đồ'  },
  { id: 'satellite' as const, label: 'Vệ tinh' },
];
type MapTypeId = 'roadmap' | 'satellite';

const MapPicker: FC<MapPickerProps> = ({ lat, lng, onChange }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '',
  });

  const [mapTypeId,    setMapTypeId]    = useState<MapTypeId>('satellite');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const mapRef            = useRef<google.maps.Map | null>(null);
  // When user drags/clicks on the map itself, we skip the external-sync effect
  const internalChange    = useRef(false);

  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);

  // Freeze initial center/zoom in refs so the GoogleMap `center` prop never changes
  // (avoids the re-center-on-every-keystroke problem)
  const initialCenter = useRef(hasCoords ? { lat: lat!, lng: lng! } : VIETNAM_CENTER);
  const initialZoom   = useRef(hasCoords ? COORD_ZOOM : DEFAULT_ZOOM);

  // Pan + zoom only when lat/lng is set externally (GPS button, paste, image GPS)
  useEffect(() => {
    if (!mapRef.current || !Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return;
    if (internalChange.current) {
      internalChange.current = false;
      return;
    }
    mapRef.current.panTo({ lat: lat!, lng: lng! });
    mapRef.current.setZoom(COORD_ZOOM);
  }, [lat, lng]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    map.setMapTypeId('satellite');
  }, []);

  const handleMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    internalChange.current = true;
    onChange(round7(e.latLng.lat()), round7(e.latLng.lng()));
  }, [onChange]);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    internalChange.current = true;
    onChange(round7(e.latLng.lat()), round7(e.latLng.lng()));
  }, [onChange]);

  const toggleFullscreen = useCallback(() => setIsFullscreen((v) => !v), []);

  const mapHeight = isFullscreen ? '100vh' : 280;

  return (
    <div className="space-y-1.5 mt-3">
      <div
        className={
          isFullscreen
            ? 'fixed inset-0 z-9999'
            : 'relative rounded-lg overflow-hidden border border-border shadow-sm'
        }
      >
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: mapHeight }}
            center={initialCenter.current}
            zoom={initialZoom.current}
            mapTypeId={mapTypeId}
            onLoad={onMapLoad}
            onClick={handleMapClick}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              gestureHandling: 'greedy',
              restriction: {
                latLngBounds: { north: 24.5, south: 20.0, east: 110.0, west: 100.0 },
                strictBounds: false,
              },
            }}
          >
            {hasCoords && (
              <MarkerF
                position={{ lat: lat!, lng: lng! }}
                draggable
                onDragEnd={handleMarkerDragEnd}
                icon={{
                  url:        MARKER_ICON_URL,
                  scaledSize: new google.maps.Size(20, 20),
                  anchor:     new google.maps.Point(10, 10),
                }}
              />
            )}
          </GoogleMap>
        ) : (
          <div
            className="flex items-center justify-center bg-gray-100"
            style={{ height: mapHeight }}
          >
            <span className="text-sm text-muted-foreground">Đang tải bản đồ...</span>
          </div>
        )}

        {/* Map type switcher */}
        <div className="absolute bottom-6 left-2 z-60 flex rounded-lg overflow-hidden border border-border shadow bg-white/95 backdrop-blur-sm">
          {MAP_TYPES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => { setMapTypeId(id); mapRef.current?.setMapTypeId(id); }}
              className={`px-2.5 py-1 text-[11px] font-medium transition-colors border-r border-border last:border-0 ${
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
          type="button"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          className="absolute top-2 right-2 z-60 flex items-center gap-1 px-2 py-1 rounded-lg bg-white/90 backdrop-blur-sm border border-border shadow text-xs font-medium text-gray-700 hover:bg-white transition-colors"
        >
          {isFullscreen
            ? <><Minimize2 className="h-3.5 w-3.5" /> Thu nhỏ</>
            : <><Maximize2 className="h-3.5 w-3.5" /> Toàn màn hình</>
          }
        </button>
      </div>

      {!isFullscreen && (
        <p className="text-xs text-muted-foreground">
          Kéo điểm ghim hoặc bấm vào bản đồ để đặt tọa độ
        </p>
      )}
    </div>
  );
};

export default MapPicker;
