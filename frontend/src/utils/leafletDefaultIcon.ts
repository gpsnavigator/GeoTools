import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

/**
 * Leaflet's standard blue marker, for the maps that don't draw a type icon. Its images come from the bundle:
 * Leaflet's own default icon finds them through a CSS path lookup that breaks once Vite has bundled the CSS.
 */
export const DEFAULT_MARKER_ICON = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
