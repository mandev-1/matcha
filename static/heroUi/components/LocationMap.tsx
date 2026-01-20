"use client";

import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";

interface LocationMapProps {
  latitude: number;
  longitude: number;
  onLocationUpdate?: (latitude: number, longitude: number, location: string) => void;
}

export default function LocationMap({ latitude, longitude, onLocationUpdate }: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentLat, setCurrentLat] = useState(latitude);
  const [currentLng, setCurrentLng] = useState(longitude);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    setCurrentLat(latitude);
    setCurrentLng(longitude);
  }, [latitude, longitude]);

  useEffect(() => {
    if (!mapRef.current || mapLoaded) return;

    // Load OpenStreetMap tile layer
    const loadMap = () => {
      const mapContainer = mapRef.current;
      if (!mapContainer) return;

      // Create a simple tile-based map using OpenStreetMap
      const zoom = 13;
      const tileSize = 256;
      const scale = Math.pow(2, zoom);
      
      // Calculate tile coordinates
      const n = Math.pow(2, zoom);
      const xTile = Math.floor((longitude + 180) / 360 * n);
      const yTile = Math.floor((1 - Math.log(Math.tan(latitude * Math.PI / 180) + 1 / Math.cos(latitude * Math.PI / 180)) / Math.PI) / 2 * n);

      // Create map tiles
      const tiles: JSX.Element[] = [];
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          const tileX = xTile + x;
          const tileY = yTile + y;
          tiles.push(
            <img
              key={`${tileX}-${tileY}`}
              src={`https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`}
              alt=""
              className="absolute"
              style={{
                left: `${(x + 1) * 256}px`,
                top: `${(y + 1) * 256}px`,
                width: '256px',
                height: '256px',
              }}
              onLoad={() => setMapLoaded(true)}
            />
          );
        }
      }

      // For now, use a simpler iframe approach that's more reliable
      setMapLoaded(true);
    };

    loadMap();
  }, [latitude, longitude, mapLoaded]);

  const handleMapClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;

    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert pixel coordinates to lat/lng
    const zoom = 13;
    const n = Math.pow(2, zoom);
    const xTile = Math.floor((longitude + 180) / 360 * n);
    const yTile = Math.floor((1 - Math.log(Math.tan(latitude * Math.PI / 180) + 1 / Math.cos(latitude * Math.PI / 180)) / Math.PI) / 2 * n);
    
    const relX = (x / rect.width) - 0.5;
    const relY = (y / rect.height) - 0.5;
    
    const newLng = longitude + (relX * 360 / n);
    const newLat = latitude - (relY * 360 / n / Math.cos(latitude * Math.PI / 180));

    setCurrentLat(newLat);
    setCurrentLng(newLng);

    // Get location name
    let locName = "";
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}&zoom=10&addressdetails=1`
      );
      const data = await response.json();
      locName = data.display_name || `${newLat.toFixed(4)}, ${newLng.toFixed(4)}`;
    } catch (error) {
      locName = `${newLat.toFixed(4)}, ${newLng.toFixed(4)}`;
    }

    if (onLocationUpdate) {
      onLocationUpdate(newLat, newLng, locName);
    }
  };

  return (
    <div 
      ref={mapRef}
      className="w-full h-full relative cursor-crosshair bg-default-100"
      onClick={handleMapClick}
      style={{ position: 'relative' }}
    >
      {/* Use iframe for reliable map display */}
      <iframe
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${currentLat},${currentLng}`}
      />
      {/* Click overlay to update location */}
      <div 
        className="absolute inset-0 z-10 cursor-crosshair"
        onClick={handleMapClick}
        title="Click to update location"
      />
      {/* Current location marker */}
      <div 
        className="absolute z-20 pointer-events-none"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <Icon 
          icon="solar:map-point-bold" 
          className="text-3xl text-primary drop-shadow-lg"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
        />
      </div>
      {/* Instructions */}
      <div className="absolute bottom-2 left-2 right-2 z-20 bg-black/50 text-white text-xs p-2 rounded text-center pointer-events-none">
        Click on the map to update your location
      </div>
    </div>
  );
}


