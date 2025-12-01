import { useEffect, useRef } from "react";
import { useStore } from "@/services/store";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = "pk.eyJ1IjoibGVvcG9sZHNlbGVnbyIsImEiOiJjbTJyeHl2cWQxbDVpMnJzYnl1aWJmMDJsIn0.3jwSQ3iHIaJifEcbOn0NvA";

interface Mapbox3DProps {
  width?: number;
  height?: number;
  zoom?: number;
}

const GeoCodeImage = ({ width = 600, height = 400, zoom = 15 }: Mapbox3DProps) => {
  const { property } = useStore((state: any) => ({
    property: state.property,
  }));

  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Initialize the map once
  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapRef.current) return;
    if (!property?.lat || !property?.lon) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      center: [property.lon, property.lat],
      zoom,
      pitch: 55,
      interactive: false,
      attributionControl: false,
    });

    new mapboxgl.Marker({ color: "#ff0000" }).setLngLat([property.lon, property.lat]).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [property?.lat, property?.lon]);

  // Update view when inputs change
  useEffect(() => {
    if (!mapRef.current) return;
    if (!property?.lat || !property?.lon) return;
    mapRef.current.setCenter([property.lon, property.lat]);
    mapRef.current.setZoom(zoom);
    mapRef.current.setPitch(55);
  }, [property?.lat, property?.lon, zoom]);

  if (!property?.lat || !property?.lon) return null;

  return <div ref={mapContainer} className="mapbox-embed" style={{ width: `${width}px`, height: `${height}px`, borderRadius: "8px", overflow: "hidden" }} />;
};

export default GeoCodeImage;
