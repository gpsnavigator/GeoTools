/**
 * English UI strings -- the source of truth for the key shape. `cs.ts` is typed against this object,
 * so a key missing in either file is a compile error.
 */
export const en = {
  appTitle: 'GeoTools',

  language: {
    /** e.g. aria-label: "Switch language to English" */
    switchTo: 'Switch language to {{language}}',
    enName: 'English',
    csName: 'Czech',
  },

  nav: {
    home: 'Home',
    tools: 'Tools',
    gpxPhotos: 'GPX & Photos',
    toggleMenu: 'Toggle menu',
    mainNavigation: 'Main navigation',
    osmCz: 'OSM.cz',
    github: 'GitHub',
  },

  footer: {
    tools: 'Tools',
    gpxPhotos: 'GPX & Photos',
    links: 'Links',
    mapyCom: 'Mapy.com',
    openStreetMap: 'OpenStreetMap',
    about: 'About',
    github: 'GitHub repository',
    copyright: '© {{year}} GeoTools  -  Geocaching & coordinate tools',
    mapData: 'Map data',
  },

  home: {
    title: 'Home',
    heading: 'GeoTools',
    intro: 'Tools and calculators for geocaching and general work with coordinates and maps. Everything runs in your browser.',
    toolsHeading: 'Tools',
    open: 'Open',
    gpxPhotosDescription: 'Show GPX waypoints and geotagged JPG photos together in a synchronized list and map.',
  },

  notFound: {
    title: 'Page not found',
    heading: 'Page not found',
    text: 'The page you are looking for does not exist.',
    back: 'Back to home',
  },

  mapExpand: {
    expandAria: 'Expand map to full screen',
    collapseAria: 'Collapse map (Esc)',
  },

  gpxPhotos: {
    title: 'GPX & Photos',
    pageHeading: 'Tools: GPX & Photos',
    intro: 'Drop GPX files and JPG photos with EXIF location. Items are sorted by DateTime and shown in a synchronized list and map view.',
    dropHint: 'Drag and drop GPX and JPG files here',
    supported: 'Supported: .gpx, .jpg, .jpeg',
    chooseFiles: 'Choose files',
    clear: 'Clear',
    warnings: 'Import warnings',
    listHeading: 'Photos & Waypoints ({{n}})',
    listHint: 'Ordered by DateTime. Click, hover, and map interactions are synchronized.',
    noItems: 'No items loaded yet.',
    openPreview: 'Open preview',
    gpxWaypointBadge: 'GPX waypoint',
    typePhoto: 'Photo',
    typeWaypoint: 'Waypoint',
    dateTimeLabel: 'DateTime:',
    unknown: 'Unknown',
    descriptionLabel: 'Description:',
    cameraLabel: 'Camera:',
    locationLabel: 'Location:',
    mapy: 'Mapy.com',
    osmCz: 'OSM.cz',
    idEditor: 'iD Editor',
    josm: 'JOSM',
    josmHint: 'Requires JOSM to be running with Remote Control enabled',
    map: 'Map',
    mapHint: 'Click marker to jump to list. Click list item to zoom marker. Hover list item to preview highlight.',
    waypoint: 'Waypoint {{n}}',
    closePreview: 'Close preview',
    showPrev: 'Show previous photo',
    showNext: 'Show next photo',
    selected: 'Selected:',
    errGpxXml: '{{name}}: failed to parse GPX XML',
    errReadFile: '{{name}}: unable to read file',
    errExifGps: '{{name}}: EXIF GPS coordinates not found',
    errExif: '{{name}}: failed to parse JPG EXIF data',
    unsupported: 'Unsupported files skipped: {{names}}',
    unknownCamera: 'Unknown camera',
  },

  sessionLog: {
    notice: 'Files stay in your browser. For testing, this session (time, file names, coordinates, waypoint details and your IP address) is logged.',
    statusIdle: 'Session log: nothing to save yet',
    statusSaving: 'Session log: saving…',
    statusSavedServer: 'Session log: saved on the server ({{time}})',
    statusSavedLocal: 'Session log: saved in this browser only ({{time}}) – no server endpoint configured',
    statusError: 'Session log: server save failed ({{error}}), kept in this browser',
    sessionId: 'Session {{id}}',
  },
} as const;

/** Widens every leaf string literal to `string`, so the Czech file has the same shape with its own texts. */
type Widen<T> = { -readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
export type Translation = Widen<typeof en>;
