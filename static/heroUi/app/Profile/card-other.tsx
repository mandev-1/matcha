"use client";

import React, { useRef, useEffect } from "react";
import { Card, Button } from "@heroui/react";
import { Image } from "@/components/Image";
import { Icon } from "@iconify/react";
import { addToast } from "@/lib/addToast";
import { useOverlayState } from "@heroui/react";
import { ModalCompat, ModalHeader, ModalBody, ModalFooter } from "@/components/ModalCompat";
import LocationMap, { LocationMapRef } from "@/components/LocationMap";
import { getApiUrl } from "@/lib/apiUrl";

interface CardOtherProps {
  latitude: number | null;
  longitude: number | null;
  location: string;
  locationUpdatedAt: string | null;
  setLatitude: (value: number) => void;
  setLongitude: (value: number) => void;
  setLocation: (value: string) => void;
  onLocationModalOpen: () => void;
  onResetModalOpen: () => void;
}

export default function CardOther({
  latitude,
  longitude,
  location,
  locationUpdatedAt,
  setLatitude,
  setLongitude,
  setLocation,
  onLocationModalOpen,
  onResetModalOpen,
}: CardOtherProps) {
  const mapRef = useRef<LocationMapRef>(null);
  const [hasMoved, setHasMoved] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const abortModalOverlay = useOverlayState({ defaultOpen: false });
  const { isOpen: isAbortModalOpen, open: onAbortModalOpen, setOpen: onAbortModalOpenChange } = abortModalOverlay;

  // Handle beforeunload to warn user if they're leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasMoved && !isUpdating) {
        e.preventDefault();
        e.returnValue = "You were moving your real location, do you wanna abort?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasMoved, isUpdating]);

  const handleUpdateLocation = async () => {
    if (!mapRef.current) return;

    setIsUpdating(true);
    try {
      const { lat, lng, location: locName } = await mapRef.current.getCurrentCenter();
      
      setLatitude(lat);
      setLongitude(lng);
      setLocation(locName);

      // Save to backend
      const token = localStorage.getItem("token");
      const response = await fetch(getApiUrl("/api/profile"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          location: locName,
        }),
      });

      if (response.ok) {
        setHasMoved(false);
        addToast({
          title: "Location updated",
          description: "Your location has been updated successfully.",
          color: "success",
        });
      } else {
        throw new Error("Failed to update location");
      }
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to update location. Please try again.",
        color: "danger",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full px-2 md:px-4">
      {/* Location Preview */}
      <Card className="w-full">
        <Card.Header>
          <h3 className="text-xl font-semibold text-sky-300">Location</h3>
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          {latitude && longitude ? (
            <>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Icon icon="solar:map-point-bold" className="text-xl text-primary" />
                  <p className="text-sm font-medium">{location || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}</p>
                </div>
                <div className="w-full h-[250px] rounded-lg overflow-hidden border border-default-200 bg-default-100 relative">
                  <LocationMap 
                    ref={mapRef}
                    latitude={latitude} 
                    longitude={longitude}
                    onMapCenterChange={(moved) => {
                      setHasMoved(moved);
                    }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs text-default-500">
                    <Icon icon="solar:compass-linear" className="text-sm" />
                    <span>Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
                  </div>
                  {locationUpdatedAt && (
                    <div className="flex items-center gap-2 text-xs text-default-400">
                      <Icon icon="solar:calendar-linear" className="text-sm" />
                      <span>Last updated: {new Date(locationUpdatedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                 
                  variant="secondary"
                  size="sm"
                  isDisabled={!hasMoved}
                  isPending={isUpdating}
                  onPress={handleUpdateLocation}
                >
                  Update Location
                </Button>
                <Button
                 
                  variant="secondary"
                  size="sm"
                  onPress={async () => {
                    if (!("geolocation" in navigator)) {
                      addToast({
                        title: "Geolocation not supported",
                        description: "Your browser doesn't support geolocation.",
                        color: "warning",
                      });
                      return;
                    }

                    navigator.geolocation.getCurrentPosition(
                      async (position) => {
                        const { latitude: lat, longitude: lng } = position.coords;
                        
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

                        setLatitude(lat);
                        setLongitude(lng);
                        setLocation(locName);

                        // Save to backend
                        const token = localStorage.getItem("token");
                        const response = await fetch(getApiUrl("/api/profile"), {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({
                            latitude: lat,
                            longitude: lng,
                            location: locName,
                          }),
                        });

                        if (response.ok) {
                          addToast({
                            title: "Location updated",
                            description: "Your location has been refreshed.",
                            color: "success",
                          });
                        }
                      },
                      (error) => {
                        addToast({
                          title: "Location access denied",
                          description: "Please allow location access to update your location.",
                          color: "warning",
                        });
                      },
                      {
                        enableHighAccuracy: true,
                        timeout: 10000,
                      }
                    );
                  }}
                >
                  <Icon icon="solar:refresh-linear" className="mr-1" />
                  Refresh Location
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-4 items-center py-8">
              <Icon icon="solar:map-point-linear" className="text-4xl text-default-400" />
              <p className="text-default-500 text-center">No location set</p>
              <Button
               
                onPress={onLocationModalOpen}
              >
                <Icon icon="solar:map-point-add-linear" className="mr-1" />
                Set Location
              </Button>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Reset Profile Card */}
      <div className="flex justify-center items-center">
        <Card className="border-none">
          <Image
            alt="Wipe profile"
            className="object-cover"
            height={200}
            src="https://heroui.com/images/hero-card.jpeg"
            width={200}
          />
          <Card.Footer className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
            <p className="text-tiny text-white/80">Wipe profile (dev)?</p>
            <Button
              className="text-tiny text-white bg-black/20"
             
             
              size="sm"
              variant="secondary"
              onPress={onResetModalOpen}
            >
              Reset
            </Button>
          </Card.Footer>
        </Card>
      </div>

      {/* Abort Dialog */}
      <ModalCompat 
        isOpen={isAbortModalOpen} 
        onOpenChange={onAbortModalOpenChange}
        isDismissable={false}
        hideCloseButton
      >
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-xl font-bold">Unsaved Location Changes</h2>
          </ModalHeader>
          <ModalBody>
            <p>You were moving your real location, do you wanna abort?</p>
          </ModalBody>
          <ModalFooter>
            <Button
             
              variant="secondary"
              onPress={() => {
                setHasMoved(false);
                onAbortModalOpenChange(false);
              }}
            >
              Abort
            </Button>
            <Button
             
              onPress={() => {
                onAbortModalOpenChange(false);
                handleUpdateLocation();
              }}
            >
              Save Changes
            </Button>
          </ModalFooter>
      </ModalCompat>
    </div>
  );
}

