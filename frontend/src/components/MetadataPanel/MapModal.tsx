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

// MUI Imports
import { Modal, Box, Typography, Button } from "@mui/material";

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

const modalStyle = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90%",
  maxWidth: 800,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

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
    <Modal open={isOpen} onClose={onClose} aria-labelledby="map-modal-title">
      <Box sx={modalStyle}>
        <Typography id="map-modal-title" variant="h6" component="h2">
          Select Location on Map
        </Typography>

        <Box
          sx={{
            height: "500px",
            width: "100%",
            mt: 2,
            borderRadius: 1,
            overflow: "hidden",
          }}
        >
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%" }}
          >
            <ChangeView center={mapCenter} zoom={mapZoom} />
            <TileLayer
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onMapClick={setPosition} />
            {position && <Marker position={position} />}
          </MapContainer>
        </Box>

        <Box
          sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}
        >
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSetLocation}
            disabled={!position}
          >
            Set Location
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default MapModal;
