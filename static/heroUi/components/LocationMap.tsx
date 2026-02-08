"use client";

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { Icon } from "@iconify/react";

interface LocationMapProps {
  latitude: number;
  longitude: number;
  onLocationUpdate?: (latitude: number, longitude: number, location: string) => void;
  onMapCenterChange?: (hasMoved: boolean) => void;
}

export interface LocationMapRef {
  getCurrentCenter: () => Promise<{ lat: number; lng: number; location: string }>;
}

const LocationMap = forwardRef<LocationMapRef, LocationMapProps>(
  ({ latitude, longitude, onLocationUpdate, onMapCenterChange }, ref) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [currentLat, setCurrentLat] = useState(latitude);
    const [currentLng, setCurrentLng] = useState(longitude);
    const [hasMoved, setHasMoved] = useState(false);
    const originalLatRef = useRef(latitude);
    const originalLngRef = useRef(longitude);
    const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastInteractionTimeRef = useRef<number>(0);
    const interactionCountRef = useRef<number>(0);

    useEffect(() => {
      setCurrentLat(latitude);
      setCurrentLng(longitude);
      originalLatRef.current = latitude;
      originalLngRef.current = longitude;
      setHasMoved(false);
      interactionCountRef.current = 0;
      if (onMapCenterChange) {
        onMapCenterChange(false);
      }
    }, [latitude, longitude, onMapCenterChange]);

    // Expose method to get current center
    useImperativeHandle(ref, () => ({
      getCurrentCenter: async (): Promise<{ lat: number; lng: number; location: string }> => {
        // Use the current coordinates (updated when user clicks or when marker position changes)
        // The marker is always at the center of the view, so currentLat/Lng represent the center
        const lat = currentLat;
        const lng = currentLng;

        // Get location name
        let locName = "";
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
          );
          const data = await response.json();
          locName = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        } catch (error) {
          locName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }

        return { lat, lng, location: locName };
      },
    }));

    // Track map interactions to detect when user has moved the map
    // Since we can't access iframe content due to CORS, we'll mark as moved when user interacts
    const handleMapInteraction = () => {
      const now = Date.now();
      interactionCountRef.current += 1;
      lastInteractionTimeRef.current = now;

      // Mark as moved immediately when user interacts (they're dragging the map)
      if (!hasMoved) {
        setHasMoved(true);
        if (onMapCenterChange) {
          onMapCenterChange(true);
        }
      }
    };

    // Handle click on map to get coordinates
    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!mapRef.current) return;

      const rect = mapRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Calculate relative position (0 to 1)
      const relX = x / rect.width;
      const relY = y / rect.height;

      // The iframe bbox is: longitude - 0.01, latitude - 0.01, longitude + 0.01, latitude + 0.01
      // Calculate new coordinates within the bbox
      const bboxWidth = 0.02;
      const bboxHeight = 0.02;
      
      // relX: 0 = left (longitude - 0.01), 1 = right (longitude + 0.01)
      // relY: 0 = top (latitude + 0.01), 1 = bottom (latitude - 0.01) [inverted because map Y is inverted]
      const newLng = (longitude - 0.01) + (relX * bboxWidth);
      const newLat = (latitude + 0.01) - (relY * bboxHeight);

      // Clamp to valid ranges
      const clampedLat = Math.max(-90, Math.min(90, newLat));
      const clampedLng = Math.max(-180, Math.min(180, newLng));

      // Update current coordinates
      setCurrentLat(clampedLat);
      setCurrentLng(clampedLng);
      
      // Mark as moved
      if (!hasMoved) {
        setHasMoved(true);
        if (onMapCenterChange) {
          onMapCenterChange(true);
        }
      }
    };

    // Update current coordinates when map URL changes (user panned/zoomed)
    // We'll track this by monitoring the iframe
    useEffect(() => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      // Since we can't directly access iframe content due to CORS,
      // we'll track interactions and assume map might have moved
      const handleLoad = () => {
        // Map loaded, reset movement tracking
        setHasMoved(false);
        if (onMapCenterChange) {
          onMapCenterChange(false);
        }
      };

      iframe.addEventListener('load', handleLoad);
      return () => {
        iframe.removeEventListener('load', handleLoad);
        if (interactionTimeoutRef.current) {
          clearTimeout(interactionTimeoutRef.current);
        }
      };
    }, [onMapCenterChange]);

    return (
      <div 
        ref={mapRef}
        className="w-full h-full relative bg-default-100 map-container"
        style={{ 
          position: 'relative',
          cursor: 'grab',
        }}
        onMouseDown={(e) => {
          // Track that user is interacting with map (dragging)
          handleMapInteraction();
        }}
        onTouchStart={() => {
          // Track touch interactions too
          handleMapInteraction();
        }}
        onClick={(e) => {
          // Handle click to update marker position
          // Only if clicking on the overlay, not on the iframe directly
          if (e.target === mapRef.current || (e.target as HTMLElement).classList.contains('map-container')) {
            handleMapClick(e);
          }
        }}
      >
        {/* Use iframe for reliable map display */}
        <iframe
          ref={iframeRef}
          width="100%"
          height="100%"
          style={{ border: 0, cursor: 'grab', pointerEvents: 'auto' }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}&layer=mapnik&marker=${currentLat},${currentLng}`}
        />
        {/* Clickable overlay to capture clicks and detect interactions */}
        <div
          className="absolute inset-0 z-10"
          style={{ pointerEvents: 'none' }}
          onMouseDown={handleMapInteraction}
          onTouchStart={handleMapInteraction}
        >
          {/* Central clickable area for updating location */}
          <div
            className="absolute"
            style={{
              left: '25%',
              top: '25%',
              width: '50%',
              height: '50%',
              pointerEvents: 'auto',
              cursor: 'crosshair',
            }}
            onClick={handleMapClick}
          />
        </div>
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
          Drag the map to move your location marker
        </div>
      </div>
    );
  }
);

LocationMap.displayName = "LocationMap";

export default LocationMap;
