import React from 'react';
import { LayersControl, TileLayer } from 'react-leaflet';

const MAPY_COM_TILES_URL = `https://api.mapy.com/v1/maptiles/outdoor/256/{z}/{x}/{y}?apikey=${import.meta.env.VITE_MAPY_COM_API_KEY ?? ''}`;

/**
 * The base-map switcher every map in the app shows (top-right corner): OpenStreetMap, or Mapy.com's outdoor map,
 * which is the default. Place it first inside a MapContainer, so other top-right controls stack below it.
 */
const BaseLayersControl: React.FC = () => (
  <LayersControl position="topright">
    <LayersControl.BaseLayer name="OpenStreetMap">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
    </LayersControl.BaseLayer>
    <LayersControl.BaseLayer checked name="Mapy.com Outdoor">
      <TileLayer
        attribution='&copy; <a href="https://api.mapy.com/copyright" target="_blank" rel="noopener noreferrer">Seznam.cz a.s.</a> &amp; OpenStreetMap contributors'
        url={MAPY_COM_TILES_URL}
        minZoom={2}
        maxZoom={19}
      />
    </LayersControl.BaseLayer>
  </LayersControl>
);

export default BaseLayersControl;
