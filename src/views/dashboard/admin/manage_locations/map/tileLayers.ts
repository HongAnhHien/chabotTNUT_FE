import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import type TileSource from 'ol/source/Tile';

export const TILE_LAYERS = [
  { id: 'osm',       label: 'Bản đồ'  },
  { id: 'satellite', label: 'Vệ tinh' },
  { id: 'topo',      label: 'Địa hình'},
] as const;

export type LayerId = typeof TILE_LAYERS[number]['id'];

export function makeTileSource(id: LayerId): TileSource {
  switch (id) {
    case 'satellite':
      return new XYZ({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        maxZoom: 19,
        attributions: '© Esri',
      });
    case 'topo':
      return new XYZ({
        url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
        maxZoom: 17,
        attributions: '© OpenTopoMap',
      });
    default:
      return new OSM();
  }
}
