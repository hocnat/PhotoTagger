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
import { GpsCoordinate, ImageGpsMatch, ImageFile } from "types";

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

const greenIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapViewUpdaterProps {
  images: ImageFile[];
}

const MapViewUpdater: React.FC<MapViewUpdaterProps> = ({ images }) => {
  const map = useMap();
  const { allMatches, selectedFilenames, isSelectionProtected } =
    useGeotaggingContext();
  const imageMap = useMemo(
    () => new Map(images.map((img) => [img.filename, img])),
    [images]
  );

  useEffect(() => {
    let pointsToBound: LatLngTuple[] = [];

    if (isSelectionProtected && selectedFilenames.size === 1) {
      const filename = selectedFilenames.values().next().value;
      if (filename) {
        // Case 1: A single protected file is selected. We need to bound both markers.
        const image = imageMap.get(filename);
        const match = allMatches.find((m) => m.filename === filename);

        // Add the track's coordinate (red marker)
        if (match?.coordinates) {
          pointsToBound.push([
            match.coordinates.latitude,
            match.coordinates.longitude,
          ]);
        }

        // Add the file's saved coordinate (green marker)
        const lat = image?.metadata.LatitudeCreated?.value;
        const lon = image?.metadata.LongitudeCreated?.value;
        if (lat && lon) {
          pointsToBound.push([parseFloat(lat), parseFloat(lon)]);
        }
      }
    } else {
      // Case 2: A normal selection of unprotected files. Bound all selected red markers.
      pointsToBound = allMatches
        .filter(
          (m): m is ImageGpsMatch & { coordinates: GpsCoordinate } =>
            selectedFilenames.has(m.filename) && !!m.coordinates
        )
        .map(
          (m) =>
            [m.coordinates.latitude, m.coordinates.longitude] as LatLngTuple
        );
    }

    if (pointsToBound.length > 0) {
      const newBounds = new LatLngBounds(pointsToBound);
      map.fitBounds(newBounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [selectedFilenames, allMatches, map, isSelectionProtected, imageMap]);

  return null;
};

interface GeotaggingMapProps {
  track: GeoJSON.LineString | null;
  images: ImageFile[];
}

export const GeotaggingMap: React.FC<GeotaggingMapProps> = ({
  track,
  images,
}) => {
  const { allMatches, selectedFilenames, isSelectionProtected } =
    useGeotaggingContext();
  const imageMap = useMemo(
    () => new Map(images.map((img) => [img.filename, img])),
    [images]
  );

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
        {isSelectionProtected &&
          (() => {
            const filename = selectedFilenames.values().next().value;
            if (!filename) return null;

            const image = imageMap.get(filename);
            const lat = image?.metadata.LatitudeCreated?.value;
            const lon = image?.metadata.LongitudeCreated?.value;
            if (lat && lon) {
              return (
                <Marker
                  key={`${filename}-protected`}
                  position={[parseFloat(lat), parseFloat(lon)]}
                  icon={greenIcon}
                  zIndexOffset={2000}
                />
              );
            }
            return null;
          })()}
        <MapViewUpdater images={images} />
      </MapContainer>
    </Box>
  );
};
