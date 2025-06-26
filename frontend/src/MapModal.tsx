import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { LatLngExpression, LatLng } from "leaflet";

// Fix for a common Leaflet/React bug where marker icons don't show.
// @ts-ignore - This is a well-known workaround for a Leaflet/Webpack issue.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

interface MapClickHandlerProps {
  onMapClick: (latlng: LatLng) => void;
}
const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onMapClick }) => {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
};

interface ChangeViewProps {
  center: LatLngExpression;
  zoom: number;
}
const ChangeView: React.FC<ChangeViewProps> = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

interface Coords {
  lat: number;
  lng: number;
}

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSet: (latlng: LatLng) => void;
  initialCoords: Coords | null;
}

const MapModal: React.FC<MapModalProps> = ({
  isOpen,
  onClose,
  onLocationSet,
  initialCoords,
}) => {
  const [position, setPosition] = useState<LatLng | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPosition(
        initialCoords ? new LatLng(initialCoords.lat, initialCoords.lng) : null
      );
    }
  }, [isOpen, initialCoords]);

  if (!isOpen) {
    return null;
  }

  const handleSetLocation = () => {
    if (position) {
      onLocationSet(position);
      onClose();
    }
  };

  const mapCenter: LatLngExpression = position
    ? [position.lat, position.lng]
    : initialCoords
    ? [initialCoords.lat, initialCoords.lng]
    : [51.505, -0.09];

  const mapZoom = position || initialCoords ? 13 : 5;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Select Location on Map</h3>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          className="map-container"
        >
          <ChangeView center={mapCenter} zoom={mapZoom} />
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={setPosition} />
          {position && <Marker position={position} />}
        </MapContainer>
        <div className="modal-actions">
          <button
            type="button"
            onClick={handleSetLocation}
            disabled={!position}
          >
            Set Location
          </button>
          <button type="button" onClick={onClose} className="button-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapModal;
