import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import L, { LatLng, LeafletEvent } from "leaflet";
import "leaflet-geosearch/dist/geosearch.css";

interface GeoSearchResultEvent extends LeafletEvent {
  location: {
    x: number; // longitude
    y: number; // latitude
    label: string;
  };
}

interface SearchControlProps {
  onLocationFound: (latlng: LatLng) => void;
}

/**
 * A React-Leaflet wrapper for the leaflet-geosearch plugin.
 * It adds a search bar to the map and calls back when a location is found.
 */
const SearchControl: React.FC<SearchControlProps> = ({ onLocationFound }) => {
  const map = useMap();

  useEffect(() => {
    const searchControl = (GeoSearchControl as any)({
      provider: new OpenStreetMapProvider(),
      style: "bar",
      showMarker: false,
      autoClose: true,
      keepResult: true,
    });

    const onShowLocation = (e: GeoSearchResultEvent) => {
      onLocationFound(new L.LatLng(e.location.y, e.location.x));
    };

    map.addControl(searchControl);
    map.on("geosearch/showlocation", onShowLocation as L.LeafletEventHandlerFn);

    return () => {
      map.off(
        "geosearch/showlocation",
        onShowLocation as L.LeafletEventHandlerFn
      );
      map.removeControl(searchControl);
    };
  }, [map, onLocationFound]);

  return null;
};

export default SearchControl;
