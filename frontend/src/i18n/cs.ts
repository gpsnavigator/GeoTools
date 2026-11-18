import type { Translation } from './en';

/** Czech UI strings -- must have exactly the shape of `en.ts` (enforced by the `Translation` type). */
export const cs: Translation = {
  appTitle: 'GeoTools',

  language: {
    switchTo: 'Přepnout jazyk na {{language}}',
    enName: 'angličtinu',
    csName: 'češtinu',
  },

  nav: {
    home: 'Domů',
    tools: 'Nástroje',
    gpxPhotos: 'GPX a fotky',
    toggleMenu: 'Přepnout menu',
    mainNavigation: 'Hlavní navigace',
    osmCz: 'OSM.cz',
    github: 'GitHub',
  },

  footer: {
    tools: 'Nástroje',
    gpxPhotos: 'GPX a fotky',
    links: 'Odkazy',
    mapyCom: 'Mapy.com',
    openStreetMap: 'OpenStreetMap',
    about: 'O aplikaci',
    github: 'Repozitář na GitHubu',
    copyright: '© {{year}} GeoTools  -  Nástroje pro geocaching a souřadnice',
    mapData: 'Mapová data',
  },

  home: {
    title: 'Domů',
    heading: 'GeoTools',
    intro: 'Nástroje a kalkulačky pro geocaching a obecnou práci se souřadnicemi a mapami. Vše běží ve vašem prohlížeči.',
    toolsHeading: 'Nástroje',
    open: 'Otevřít',
    gpxPhotosDescription: 'Zobrazí waypointy z GPX a JPG fotky s polohou společně v synchronizovaném seznamu a mapě.',
  },

  notFound: {
    title: 'Stránka nenalezena',
    heading: 'Stránka nenalezena',
    text: 'Hledaná stránka neexistuje.',
    back: 'Zpět na úvod',
  },

  mapExpand: {
    expandAria: 'Rozšířit mapu na celou obrazovku',
    collapseAria: 'Sbalit mapu (Esc)',
  },

  gpxPhotos: {
    title: 'GPX a fotky',
    pageHeading: 'Nástroje: GPX a fotky',
    intro: 'Přetáhněte soubory GPX a JPG fotky s polohou v EXIF. Položky jsou seřazeny podle DateTime a zobrazeny v synchronizovaném seznamu a mapě.',
    dropHint: 'Přetáhněte soubory GPX a JPG sem',
    supported: 'Podporováno: .gpx, .jpg, .jpeg',
    chooseFiles: 'Vybrat soubory',
    clear: 'Vymazat',
    warnings: 'Varování při importu',
    listHeading: 'Fotky a waypointy ({{n}})',
    listHint: 'Seřazeno podle DateTime. Kliknutí, najetí a interakce s mapou jsou synchronizovány.',
    noItems: 'Zatím nenačteny žádné položky.',
    openPreview: 'Otevřít náhled',
    gpxWaypointBadge: 'GPX waypoint',
    typePhoto: 'Fotka',
    typeWaypoint: 'Waypoint',
    dateTimeLabel: 'DateTime:',
    unknown: 'Neznámé',
    descriptionLabel: 'Popis:',
    cameraLabel: 'Kamera:',
    locationLabel: 'Umístění:',
    mapy: 'Mapy.com',
    osmCz: 'OSM.cz',
    idEditor: 'iD Editor',
    josm: 'JOSM',
    josmHint: 'Vyžaduje spuštěný JOSM s povoleným Remote Control.',
    map: 'Mapa',
    mapHint: 'Kliknutím na značku přejdete do seznamu. Kliknutím na položku seznamu přiblížíte značku. Najetím na položku seznamu zobrazíte zvýraznění.',
    waypoint: 'Waypoint {{n}}',
    closePreview: 'Zavřít náhled',
    showPrev: 'Zobrazit předchozí fotku',
    showNext: 'Zobrazit další fotku',
    selected: 'Vybráno:',
    errGpxXml: '{{name}}: nepodařilo se analyzovat GPX XML',
    errReadFile: '{{name}}: soubor se nepodařilo načíst',
    errExifGps: '{{name}}: v EXIF nenalezeny GPS souřadnice',
    errExif: '{{name}}: nepodařilo se analyzovat EXIF data z JPG',
    unsupported: 'Nepodporované soubory přeskočeny: {{names}}',
    unknownCamera: 'Neznámá kamera',
  },

  sessionLog: {
    notice: 'Soubory zůstávají ve vašem prohlížeči. Pro testovací účely se tato relace zaznamenává (čas, názvy souborů, souřadnice, údaje waypointů a vaše IP adresa).',
    statusIdle: 'Záznam relace: zatím není co uložit',
    statusSaving: 'Záznam relace: ukládám…',
    statusSavedServer: 'Záznam relace: uloženo na serveru ({{time}})',
    statusSavedLocal: 'Záznam relace: uloženo jen v tomto prohlížeči ({{time}}) – není nastaven serverový endpoint',
    statusError: 'Záznam relace: uložení na server selhalo ({{error}}), ponecháno v tomto prohlížeči',
    sessionId: 'Relace {{id}}',
  },
};
