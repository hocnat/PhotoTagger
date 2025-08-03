import { useMemo, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  GeoJSON,
  useMap,
} from "react-leaflet";
import L, { LatLngBounds, LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Box } from "@mui/material";
import { useGeotaggingContext } from "../context/GeotaggingContext";
import { GpsCoordinate, ImageGpsMatch } from "types";

// Fix for a common Leaflet/React bug where marker icons don't show.
// @ts-ignore - This is a well-known workaround for a Leaflet/Webpack issue.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const MapViewUpdater: React.FC = () => {
  const map = useMap();
  const { allMatches, selectedFilenames } = useGeotaggingContext();

  useEffect(() => {
    const selectedPoints = allMatches
      .filter(
        (m): m is ImageGpsMatch & { coordinates: GpsCoordinate } =>
          selectedFilenames.has(m.filename) && !!m.coordinates
      )
      .map(
        (m) => [m.coordinates.latitude, m.coordinates.longitude] as LatLngTuple
      );

    if (selectedPoints.length > 0) {
      const newBounds = new LatLngBounds(selectedPoints);
      map.fitBounds(newBounds, { padding: [50, 50] });
    }
  }, [selectedFilenames, allMatches, map]);

  return null;
};

interface GeotaggingMapProps {
  track: GeoJSON.LineString | null;
}

export const GeotaggingMap: React.FC<GeotaggingMapProps> = ({ track }) => {
  const { allMatches, selectedFilenames } = useGeotaggingContext();

  const initialBounds = useMemo(() => {
    const points = allMatches
      .filter(
        (m): m is ImageGpsMatch & { coordinates: GpsCoordinate } =>
          !!m.coordinates
      )
      .map(
        (m) => [m.coordinates.latitude, m.coordinates.longitude] as LatLngTuple
      );

    if (points.length > 0) {
      return new LatLngBounds(points);
    }
    if (track?.coordinates && track.coordinates.length > 0) {
      const trackPoints = track.coordinates.map(
        (c) => [c[1], c[0]] as LatLngTuple
      );
      return new LatLngBounds(trackPoints);
    }
    return null;
  }, [allMatches, track]);

  return (
    <Box sx={{ height: "100%", width: "100%" }}>
      <MapContainer
        bounds={
          initialBounds || [
            [51.505, -0.09],
            [51.515, -0.08],
          ]
        }
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {track && <GeoJSON data={track} />}
        {allMatches.map((match) => {
          if (!match.coordinates) return null;
          const isSelected = selectedFilenames.has(match.filename);
          return (
            <Marker
              key={match.filename}
              position={[
                match.coordinates.latitude,
                match.coordinates.longitude,
              ]}
              icon={isSelected ? redIcon : L.Icon.Default.prototype}
              zIndexOffset={isSelected ? 1000 : 0}
            />
          );
        })}
        <MapViewUpdater />
      </MapContainer>
    </Box>
  );
};
