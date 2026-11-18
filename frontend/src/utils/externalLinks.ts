/** Links out to other map and OSM sites, shared by every page that shows a location. */

/** openstreetmap.cz with its hiking-trail layers, at its default view. */
export const OSM_CZ_HOME_URL = 'https://openstreetmap.cz/#layers=dKVGB';

export const GITHUB_REPO_URL = 'https://github.com/gpsnavigator/GeoTools';

/** Mapy.com's hiking map centred on a point, with a pin on it. */
export function mapyComUrl(lat: number, lon: number): string {
  return `https://mapy.com/en/turisticka?q=${lat}%2C${lon}&source=coor&id=${lon}%2C${lat}&ds=2&x=${lon}&y=${lat}&z=17`;
}

/** openstreetmap.cz with its hiking-trail layers, zoomed in on a point. */
export function osmCzUrl(lat: number, lon: number): string {
  return `https://openstreetmap.cz/#map=19/${lat.toFixed(4)}/${lon.toFixed(4)}&layers=dKVGB`;
}

/** The iD editor on openstreetmap.org, at a point. */
export function idEditorUrl(lat: number, lon: number): string {
  return `https://www.openstreetmap.org/edit?editor=id#map=18/${lat}/${lon}`;
}

/** JOSM's remote control loading a small box around a point (JOSM must be running with Remote Control enabled). */
export function josmLoadAndZoomUrl(lat: number, lon: number): string {
  return `http://127.0.0.1:8111/load_and_zoom?left=${lon - 0.001}&right=${lon + 0.001}&top=${lat + 0.001}&bottom=${lat - 0.001}`;
}
