import React, { useCallback, useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import { addButtonControl } from './buttonControl';

/** Placed inside a MapContainer; calls invalidateSize whenever `trigger` changes. */
const MapResizer: React.FC<{ trigger: boolean }> = ({ trigger }) => {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 50);
    return () => clearTimeout(t);
  }, [trigger, map]);
  return null;
};

const MapExpandControl: React.FC<{
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ isExpanded, onToggle }) => {
  const map = useMap();
  const { t } = useTranslation();

  useEffect(() => {
    const control = addButtonControl(map, {
      position: 'topleft',
      label: isExpanded ? t('mapExpand.collapseAria') : t('mapExpand.expandAria'),
      text: isExpanded ? '✕' : '⤢',
      onClick: onToggle,
    });

    return () => {
      control.remove();
    };
  }, [isExpanded, map, onToggle, t]);

  return null;
};

interface ExpandableMapProps {
  /** Tailwind height class(es) applied in the collapsed state, e.g. "h-52 w-full". */
  defaultHeightClass?: string;
  /** Extra classes appended to the wrapper div in collapsed state. */
  wrapperClassName?: string;
  /**
   * Render-prop pattern: children receives a `<MapResizer>` node that must be
   * placed directly inside the `<MapContainer>` so it can call invalidateSize.
   */
  children: (resizer: React.ReactNode) => React.ReactNode;
}

/**
 * Wraps a Leaflet map so the user can expand it to full-screen and collapse it
 * again. Drop in place of the wrapper `<div>` around `<MapContainer>`.
 *
 * Usage:
 * ```tsx
 * <ExpandableMap defaultHeightClass="h-52 w-full">
 *   {(resizer) => (
 *     <MapContainer ...>
 *       {resizer}
 *       ...rest of map children...
 *     </MapContainer>
 *   )}
 * </ExpandableMap>
 * ```
 */
const ExpandableMap: React.FC<ExpandableMapProps> = ({
  defaultHeightClass = 'h-52 w-full',
  wrapperClassName = '',
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpanded = useCallback(() => setIsExpanded((prev) => !prev), []);

  // Escape leaves full screen, like the collapse button.
  useEffect(() => {
    if (!isExpanded) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  return (
    <div
      style={isExpanded ? { top: 'var(--site-header-height, 0px)' } : undefined}
      className={
        isExpanded
          ? 'fixed left-0 right-0 bottom-0 z-40 bg-white'
          : `${defaultHeightClass} rounded-lg border border-gray-300 overflow-hidden relative ${wrapperClassName}`
      }
    >
      {children(
        <>
          <MapResizer trigger={isExpanded} />
          <MapExpandControl isExpanded={isExpanded} onToggle={toggleExpanded} />
        </>
      )}
    </div>
  );
};

export default ExpandableMap;
