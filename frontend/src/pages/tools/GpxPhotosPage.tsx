import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Tooltip, useMap } from 'react-leaflet';
import L, { DivIcon } from 'leaflet';
import exifr from 'exifr';

import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { useI18nDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatDateTime } from '../../utils/dateTime';
import { idEditorUrl, josmLoadAndZoomUrl, mapyComUrl, osmCzUrl } from '../../utils/externalLinks';
import { escapeHtml, htmlToText } from '../../utils/html';
import { DEFAULT_MARKER_ICON } from '../../utils/leafletDefaultIcon';
import { DEFAULT_MAP_CENTER } from '../../utils/mapDefaults';
import ExternalLink from '../../components/ExternalLink';
import BaseLayersControl from '../../components/map/BaseLayersControl';
import ExpandableMap from '../../components/map/ExpandableMap';

type ParsedItemType = 'gpxWaypoint' | 'photo';

type BaseParsedItem = {
  id: string;
  type: ParsedItemType;
  name: string;
  dateTime: string | null;
  lat: number;
  lon: number;
};

type GpxWaypointItem = BaseParsedItem & {
  type: 'gpxWaypoint';
  description: string;
};

type PhotoItem = BaseParsedItem & {
  type: 'photo';
  cameraName: string;
  fileName: string;
  previewUrl: string;
};

type ParsedItem = GpxWaypointItem | PhotoItem;

type ParsedGpxResult = {
  items: GpxWaypointItem[];
  errors: string[];
};

type ParsedPhotoResult = {
  items: PhotoItem[];
  errors: string[];
};

const INITIAL_ZOOM = 7;
const HOVER_OUTLINE_CLASS = 'gpx-photos-item-hover';
const ACTIVE_OUTLINE_CLASS = 'gpx-photos-item-active';

function itemDateTimeMillis(item: ParsedItem): number {
  if (!item.dateTime) {
    return Number.MAX_SAFE_INTEGER;
  }

  const parsed = Date.parse(item.dateTime);
  if (Number.isNaN(parsed)) {
    return Number.MAX_SAFE_INTEGER;
  }

  return parsed;
}

function normalizeDateTimeForKey(dateTime: string | null): string {
  if (!dateTime) {
    return '';
  }

  const parsed = new Date(dateTime);
  if (Number.isNaN(parsed.getTime())) {
    return dateTime.trim();
  }

  return parsed.toISOString();
}

function buildDedupKey(item: ParsedItem): string {
  return [
    item.type,
    item.name.trim().toLowerCase(),
    item.lat.toFixed(7),
    item.lon.toFixed(7),
    normalizeDateTimeForKey(item.dateTime),
  ].join('|');
}

function parseExifDate(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return null;
}

function parseCameraName(exifData: Record<string, unknown>, t: TFunction): string {
  const make = typeof exifData.Make === 'string' ? exifData.Make.trim() : '';
  const model = typeof exifData.Model === 'string' ? exifData.Model.trim() : '';

  if (make && model) {
    return `${make} ${model}`;
  }

  if (model) {
    return model;
  }

  if (make) {
    return make;
  }

  return t('gpxPhotos.unknownCamera');
}

function createPhotoDivIcon(item: PhotoItem, active: boolean, hovered: boolean): DivIcon {
  const outlineClass = active ? ACTIVE_OUTLINE_CLASS : hovered ? HOVER_OUTLINE_CLASS : '';

  return L.divIcon({
    className: '',
    html: `
      <div class="gpx-photo-marker ${outlineClass}">
        <img src="${item.previewUrl}" alt="${escapeHtml(item.fileName)}" />
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}

function parseWaypointNodes(doc: XMLDocument, t: TFunction): GpxWaypointItem[] {
  const nodes = Array.from(doc.getElementsByTagNameNS('*', 'wpt'));

  return nodes
    .map((node, index) => {
      const latRaw = node.getAttribute('lat');
      const lonRaw = node.getAttribute('lon');
      const lat = latRaw ? Number(latRaw) : Number.NaN;
      const lon = lonRaw ? Number(lonRaw) : Number.NaN;

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return null;
      }

      const name = node.getElementsByTagNameNS('*', 'name')[0]?.textContent?.trim() || t('gpxPhotos.waypoint', { n: index + 1 });
      // A <desc> may be HTML, so show its text rather than the markup.
      const desc = htmlToText(node.getElementsByTagNameNS('*', 'desc')[0]?.textContent?.trim() || '');
      const time = node.getElementsByTagNameNS('*', 'time')[0]?.textContent?.trim() || null;

      return {
        id: `wpt-${index}-${name}-${lat}-${lon}`,
        type: 'gpxWaypoint' as const,
        name,
        dateTime: time,
        lat,
        lon,
        description: desc,
      };
    })
    .filter((item): item is GpxWaypointItem => item !== null);
}

function parseGpxFile(file: File, t: TFunction): Promise<ParsedGpxResult> {
  return file.text()
    .then((content) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'application/xml');
      const parseError = doc.querySelector('parsererror');

      if (parseError) {
        return {
          items: [],
          errors: [t('gpxPhotos.errGpxXml', { name: file.name })],
        };
      }

      return {
        items: parseWaypointNodes(doc, t),
        errors: [],
      };
    })
    .catch(() => ({
      items: [],
      errors: [t('gpxPhotos.errReadFile', { name: file.name })],
    }));
}

async function parsePhotoFile(file: File, t: TFunction): Promise<ParsedPhotoResult> {
  const previewUrl = URL.createObjectURL(file);

  try {
    const exifData = await exifr.parse(file, {
      gps: true,
      tiff: true,
      exif: true,
    }) as Record<string, unknown> | null;

    const latitude = typeof exifData?.latitude === 'number' ? exifData.latitude : null;
    const longitude = typeof exifData?.longitude === 'number' ? exifData.longitude : null;

    if (latitude === null || longitude === null) {
      URL.revokeObjectURL(previewUrl);
      return {
        items: [],
        errors: [t('gpxPhotos.errExifGps', { name: file.name })],
      };
    }

    const dateTime = parseExifDate(exifData?.DateTimeOriginal)
      ?? parseExifDate(exifData?.CreateDate)
      ?? parseExifDate(exifData?.DateTimeDigitized)
      ?? null;

    const photo: PhotoItem = {
      id: `photo-${file.name}-${latitude}-${longitude}-${file.size}`,
      type: 'photo',
      name: file.name,
      fileName: file.name,
      dateTime,
      lat: latitude,
      lon: longitude,
      cameraName: parseCameraName(exifData ?? {}, t),
      previewUrl,
    };

    return {
      items: [photo],
      errors: [],
    };
  } catch {
    URL.revokeObjectURL(previewUrl);
    return {
      items: [],
      errors: [t('gpxPhotos.errExif', { name: file.name })],
    };
  }
}

const FitMapBounds: React.FC<{ items: ParsedItem[] }> = ({ items }) => {
  const map = useMap();

  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    if (items.length === 1) {
      map.setView([items[0].lat, items[0].lon], 16);
      return;
    }

    const bounds = L.latLngBounds(items.map(item => [item.lat, item.lon] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
  }, [items, map]);

  return null;
};

const GpxPhotosPage: React.FC = () => {
  const { t } = useTranslation();
  useI18nDocumentTitle('gpxPhotos.title');
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [expandedPhotoId, setExpandedPhotoId] = useState<string | null>(null);

  const listRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const markerRefs = useRef<Record<string, L.Marker | null>>({});
  const mapRef = useRef<L.Map | null>(null);
  const objectUrlsRef = useRef<string[]>([]);

  const mergeAndDeduplicateItems = useCallback((existingItems: ParsedItem[], incomingItems: ParsedItem[]): ParsedItem[] => {
    const merged: ParsedItem[] = [...existingItems];
    const seen = new Set(existingItems.map(buildDedupKey));

    incomingItems.forEach((item) => {
      const key = buildDedupKey(item);
      if (seen.has(key)) {
        if (item.type === 'photo') {
          URL.revokeObjectURL(item.previewUrl);
        }
        return;
      }

      seen.add(key);
      merged.push(item);
    });

    return merged;
  }, []);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    };
  }, []);

  const sortedItems = useMemo(() => {
    const next = [...items];
    next.sort((a, b) => {
      const aTime = itemDateTimeMillis(a);
      const bTime = itemDateTimeMillis(b);
      if (aTime !== bTime) {
        return aTime - bTime;
      }
      return a.name.localeCompare(b.name);
    });
    return next;
  }, [items]);

  const sortedPhotos = useMemo(
    () => sortedItems.filter((item): item is PhotoItem => item.type === 'photo'),
    [sortedItems]
  );

  const itemMap = useMemo(() => new Map(sortedItems.map(item => [item.id, item])), [sortedItems]);

  const highlightMapItem = useCallback((itemId: string | null) => {
    setActiveItemId(itemId);
  }, []);

  const jumpToListItem = useCallback((itemId: string) => {
    const node = listRefs.current[itemId];
    if (!node) {
      return;
    }

    node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  const focusMapOnItem = useCallback((item: ParsedItem) => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    map.flyTo([item.lat, item.lon], Math.max(map.getZoom(), 16), {
      duration: 0.4,
    });

    const marker = markerRefs.current[item.id];
    if (marker) {
      marker.openTooltip();
    }
  }, []);

  const handleMapMarkerClick = useCallback((itemId: string) => {
    highlightMapItem(itemId);
    jumpToListItem(itemId);
  }, [highlightMapItem, jumpToListItem]);

  const resetItems = useCallback(() => {
    objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    objectUrlsRef.current = [];
    setItems([]);
    setErrors([]);
    setActiveItemId(null);
    setHoveredItemId(null);
  }, []);

  const processFiles = useCallback(async (incomingFiles: FileList | File[]) => {
    const fileArray = Array.from(incomingFiles);
    if (fileArray.length === 0) {
      return;
    }

    const gpxFiles = fileArray.filter(file => file.name.toLowerCase().endsWith('.gpx'));
    const jpgFiles = fileArray.filter(file => {
      const lower = file.name.toLowerCase();
      return lower.endsWith('.jpg') || lower.endsWith('.jpeg');
    });

    const unsupportedFiles = fileArray.filter(file => !gpxFiles.includes(file) && !jpgFiles.includes(file));

    const gpxResults = await Promise.all(gpxFiles.map(file => parseGpxFile(file, t)));
    const photoResults = await Promise.all(jpgFiles.map(file => parsePhotoFile(file, t)));

    const newItems: ParsedItem[] = [];
    const newErrors: string[] = [];

    gpxResults.forEach(result => {
      newItems.push(...result.items);
      newErrors.push(...result.errors);
    });

    photoResults.forEach(result => {
      newItems.push(...result.items);
      newErrors.push(...result.errors);
    });

    if (unsupportedFiles.length > 0) {
      newErrors.push(t('gpxPhotos.unsupported', { names: unsupportedFiles.map(file => file.name).join(', ') }));
    }

    setItems((prevItems) => {
      const mergedItems = mergeAndDeduplicateItems(prevItems, newItems);

      const activePhotoUrls = new Set(
        mergedItems
          .filter((item): item is PhotoItem => item.type === 'photo')
          .map(item => item.previewUrl)
      );

      objectUrlsRef.current = Array.from(activePhotoUrls);

      return mergedItems;
    });

    setErrors((prevErrors) => {
      if (prevErrors.length === 0) {
        return newErrors;
      }
      if (newErrors.length === 0) {
        return prevErrors;
      }
      return [...prevErrors, ...newErrors];
    });

    setActiveItemId(null);
    setHoveredItemId(null);
  }, [mergeAndDeduplicateItems, t]);

  const onDropZoneDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    await processFiles(event.dataTransfer.files);
  }, [processFiles]);

  const onDropZoneDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const onDropZoneDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const activeItem = activeItemId ? itemMap.get(activeItemId) ?? null : null;
  const expandedPhoto = expandedPhotoId
    ? sortedPhotos.find((photo) => photo.id === expandedPhotoId) ?? null
    : null;
  const expandedPhotoIndex = expandedPhoto
    ? sortedPhotos.findIndex((photo) => photo.id === expandedPhoto.id)
    : -1;
  const previousPhoto = expandedPhotoIndex > 0 ? sortedPhotos[expandedPhotoIndex - 1] : null;
  const nextPhoto = expandedPhotoIndex >= 0 && expandedPhotoIndex < sortedPhotos.length - 1
    ? sortedPhotos[expandedPhotoIndex + 1]
    : null;

  return (
    <div className="space-y-4">
      <style>{`
        .gpx-photo-marker {
          width: 38px;
          height: 38px;
          border-radius: 6px;
          overflow: hidden;
          border: 2px solid #ffffff;
          box-shadow: 0 1px 6px rgba(0, 0, 0, 0.45);
          background: #111827;
        }
        .gpx-photo-marker img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .gpx-photo-marker.${HOVER_OUTLINE_CLASS} {
          border-color: #f59e0b;
        }
        .gpx-photo-marker.${ACTIVE_OUTLINE_CLASS} {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2), 0 1px 6px rgba(0, 0, 0, 0.45);
        }
      `}</style>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">{t('gpxPhotos.pageHeading')}</h1>
        <p className="mt-1 text-sm text-gray-600">{t('gpxPhotos.intro')}</p>
      </div>

      <div
        onDragOver={onDropZoneDragOver}
        onDragLeave={onDropZoneDragLeave}
        onDrop={onDropZoneDrop}
        className={`rounded-lg border-2 border-dashed p-6 text-center transition ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
        }`}
      >
        <p className="text-sm text-gray-700">{t('gpxPhotos.dropHint')}</p>
        <p className="text-xs text-gray-500 mt-1">{t('gpxPhotos.supported')}</p>
        <div className="mt-3">
          <label className="inline-flex cursor-pointer items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            {t('gpxPhotos.chooseFiles')}
            <input
              type="file"
              multiple
              accept=".gpx,.jpg,.jpeg"
              onChange={(event) => {
                if (event.target.files) {
                  void processFiles(event.target.files);
                }
              }}
              className="hidden"
            />
          </label>
          <button
            type="button"
            onClick={resetItems}
            className="ml-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            {t('gpxPhotos.clear')}
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">{t('gpxPhotos.warnings')}</p>
          <ul className="list-disc pl-5 mt-1 space-y-0.5">
            {errors.map((error, index) => (
              <li key={`${error}-${index}`}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.45fr]">
        <section className="min-h-[70vh] rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900">{t('gpxPhotos.listHeading', { n: sortedItems.length })}</h2>
            <p className="text-xs text-gray-500">{t('gpxPhotos.listHint')}</p>
          </div>

          <div className="max-h-[calc(100vh-320px)] overflow-y-auto p-3 space-y-2">
            {sortedItems.length === 0 && (
              <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                {t('gpxPhotos.noItems')}
              </div>
            )}

            {sortedItems.map((item) => {
              const isActive = item.id === activeItemId;
              const isHovered = item.id === hoveredItemId;

              return (
                <div
                  key={item.id}
                  ref={node => {
                    listRefs.current[item.id] = node;
                  }}
                  onClick={() => {
                    highlightMapItem(item.id);
                    focusMapOnItem(item);
                  }}
                  onMouseEnter={() => setHoveredItemId(item.id)}
                  onMouseLeave={() => setHoveredItemId(null)}
                  className={`cursor-pointer rounded-lg border p-3 transition ${
                    isActive
                      ? 'border-blue-500 bg-blue-50'
                      : isHovered
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex gap-3">
                    {item.type === 'photo' ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setExpandedPhotoId(item.id);
                        }}
                        className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-gray-200"
                        title={t('gpxPhotos.openPreview')}
                      >
                        <img src={item.previewUrl} alt={item.fileName} className="h-full w-full object-cover" />
                      </button>
                    ) : (
                      <div className="h-16 w-16 shrink-0 rounded-md border border-gray-200 bg-gray-100 flex items-center justify-center text-xs text-gray-600 text-center px-1">
                        {t('gpxPhotos.gpxWaypointBadge')}
                      </div>
                    )}

                    <div className="min-w-0 flex-1 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] uppercase tracking-wide ${
                          item.type === 'photo' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.type === 'photo' ? t('gpxPhotos.typePhoto') : t('gpxPhotos.typeWaypoint')}
                        </span>
                        <span className="font-semibold text-gray-900 truncate" title={item.name}>{item.name}</span>
                      </div>

                      <div className="mt-1 text-xs text-gray-500">
                        {t('gpxPhotos.dateTimeLabel')} {item.dateTime ? formatDateTime(item.dateTime) : t('gpxPhotos.unknown')}
                      </div>

                      {item.type === 'gpxWaypoint' ? (
                        <>
                          <div className="mt-1 whitespace-pre-line text-xs text-gray-600">{t('gpxPhotos.descriptionLabel')} {item.description || '-'}</div>
                        </>
                      ) : (
                        <>
                          <div className="mt-1 text-xs text-gray-600">{t('gpxPhotos.cameraLabel')} {item.cameraName}</div>
                        </>
                      )}

                      <div className="mt-2 text-xs text-gray-700">
                        <span className="font-medium">{t('gpxPhotos.locationLabel')}</span> {item.lat.toFixed(5)}, {item.lon.toFixed(5)}
                        {' '}(<ExternalLink href={mapyComUrl(item.lat, item.lon)}>{t('gpxPhotos.mapy')}</ExternalLink>)
                        {' | '}(<ExternalLink href={osmCzUrl(item.lat, item.lon)}>{t('gpxPhotos.osmCz')}</ExternalLink>)
                        {' | '}(<ExternalLink href={idEditorUrl(item.lat, item.lon)}>{t('gpxPhotos.idEditor')}</ExternalLink>)
                        {' | '}(<ExternalLink href={josmLoadAndZoomUrl(item.lat, item.lon)} title={t('gpxPhotos.josmHint')}>{t('gpxPhotos.josm')}</ExternalLink>)
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="min-h-[70vh] rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900">{t('gpxPhotos.map')}</h2>
            <p className="text-xs text-gray-500">{t('gpxPhotos.mapHint')}</p>
          </div>

          <ExpandableMap defaultHeightClass="h-[calc(100%-64px)] min-h-[66vh] w-full" wrapperClassName="rounded-none border-0">
            {(resizer) => (
              <MapContainer
                center={DEFAULT_MAP_CENTER}
                zoom={INITIAL_ZOOM}
                className="h-full w-full"
                ref={(instance) => {
                  if (instance) {
                    mapRef.current = instance;
                  }
                }}
              >
                {resizer}
                <BaseLayersControl />

                <FitMapBounds items={sortedItems} />

                {sortedItems.map((item) => {
                  const isActive = item.id === activeItemId;
                  const isHovered = item.id === hoveredItemId;

                  return (
                    <Marker
                      key={item.id}
                      position={[item.lat, item.lon]}
                      icon={item.type === 'photo' ? createPhotoDivIcon(item, isActive, isHovered) : DEFAULT_MARKER_ICON}
                      ref={(marker) => {
                        markerRefs.current[item.id] = marker;
                      }}
                      eventHandlers={{
                        click: () => handleMapMarkerClick(item.id),
                        mouseover: () => setHoveredItemId(item.id),
                        mouseout: () => setHoveredItemId(prev => (prev === item.id ? null : prev)),
                      }}
                    >
                      <Tooltip direction="top" offset={[0, -14]} opacity={1}>
                        <div className="text-xs">
                          <div className="font-semibold">{item.name}</div>
                          <div>{item.lat.toFixed(5)}, {item.lon.toFixed(5)}</div>
                          {item.type === 'photo' ? <div>{t('gpxPhotos.typePhoto')}</div> : <div>{t('gpxPhotos.typeWaypoint')}</div>}
                        </div>
                      </Tooltip>
                    </Marker>
                  );
                })}
              </MapContainer>
            )}
          </ExpandableMap>
        </section>
      </div>

      {expandedPhoto && (
        <div
          className="fixed inset-0 z-[1200] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setExpandedPhotoId(null)}
        >
          <div className="relative group max-h-[90vh] max-w-[90vw] rounded-lg bg-white p-3 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              aria-label={t('gpxPhotos.closePreview')}
              onClick={() => setExpandedPhotoId(null)}
              className="absolute right-2 top-2 z-30 h-8 w-8 rounded-full bg-black/75 text-lg leading-none text-white transition hover:bg-black"
            >
              &times;
            </button>

            {previousPhoto && (
              <div className="absolute inset-y-0 left-0 z-10 w-1/4 flex items-center justify-start pl-2 group/left">
                <button
                  type="button"
                  aria-label={t('gpxPhotos.showPrev')}
                  onClick={() => setExpandedPhotoId(previousPhoto.id)}
                  className="pointer-events-none opacity-0 group-hover/left:pointer-events-auto group-hover/left:opacity-100 rounded-full bg-black/55 px-3 py-2 text-2xl leading-none text-white transition hover:bg-black/75"
                >
                  &#8249;
                </button>
              </div>
            )}

            {nextPhoto && (
              <div className="absolute inset-y-0 right-0 z-10 w-1/4 flex items-center justify-end pr-2 group/right">
                <button
                  type="button"
                  aria-label={t('gpxPhotos.showNext')}
                  onClick={() => setExpandedPhotoId(nextPhoto.id)}
                  className="pointer-events-none opacity-0 group-hover/right:pointer-events-auto group-hover/right:opacity-100 rounded-full bg-black/55 px-3 py-2 text-2xl leading-none text-white transition hover:bg-black/75"
                >
                  &#8250;
                </button>
              </div>
            )}

            <img src={expandedPhoto.previewUrl} alt={expandedPhoto.fileName} className="max-h-[82vh] max-w-[86vw] object-contain" />
          </div>
        </div>
      )}

      {activeItem && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          {t('gpxPhotos.selected')} <span className="font-semibold">{activeItem.name}</span> ({activeItem.type === 'photo' ? t('gpxPhotos.typePhoto') : t('gpxPhotos.typeWaypoint')})
        </div>
      )}
    </div>
  );
};

export default GpxPhotosPage;
