import L from 'leaflet';

interface ButtonControlOptions {
  position: L.ControlPosition;
  /** Accessible label, also shown as the tooltip. */
  label: string;
  /** The button's glyph or emoji. */
  text: string;
  onClick: () => void;
}

/** Adds a one-button Leaflet control styled like the zoom buttons, and returns it (for `control.remove()`). */
export function addButtonControl(map: L.Map, { position, label, text, onClick }: ButtonControlOptions): L.Control {
  const control = new L.Control({ position });

  control.onAdd = () => {
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
    const button = L.DomUtil.create('a', '', container) as HTMLAnchorElement;

    button.href = '#';
    button.setAttribute('role', 'button');
    button.setAttribute('aria-label', label);
    button.title = label;
    button.textContent = text;
    Object.assign(button.style, {
      width: '30px',
      height: '30px',
      lineHeight: '30px',
      textAlign: 'center',
      fontSize: '16px',
      fontWeight: '600',
    });

    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.on(button, 'click', (event) => {
      L.DomEvent.preventDefault(event);
      onClick();
    });

    return container;
  };

  return control.addTo(map);
}
