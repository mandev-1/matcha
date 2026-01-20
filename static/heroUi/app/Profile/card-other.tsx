"use client";

import React from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Image } from "@heroui/image";
import { Icon } from "@iconify/react";
import { addToast } from "@heroui/toast";
import LocationMap from "@/components/LocationMap";

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
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full px-2 md:px-4">
      {/* Location Preview */}
      <Card className="w-full" radius="lg">
        <CardHeader>
          <h3 className="text-xl font-semibold text-sky-300">Location</h3>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          {latitude && longitude ? (
            <>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Icon icon="solar:map-point-bold" className="text-xl text-primary" />
                  <p className="text-sm font-medium">{location || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}</p>
                </div>
                <div className="w-full h-[250px] rounded-lg overflow-hidden border border-default-200 bg-default-100 relative">
                  <LocationMap 
                    latitude={latitude} 
                    longitude={longitude}
                    onLocationUpdate={(lat, lng, loc) => {
                      setLatitude(lat);
                      setLongitude(lng);
                      setLocation(loc);
                      // Save to backend
                      const token = localStorage.getItem("token");
                      fetch("/api/profile", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                          latitude: lat,
                          longitude: lng,
                          location: loc,
                        }),
                      });
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
                  color="primary"
                  variant="flat"
                  size="sm"
                  onPress={onLocationModalOpen}
                  startContent={<Icon icon="solar:map-point-add-linear" />}
                >
                  Update Location
                </Button>
                <Button
                  color="default"
                  variant="flat"
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
                        const response = await fetch("/api/profile", {
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
                  startContent={<Icon icon="solar:refresh-linear" />}
                >
                  Refresh Location
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-4 items-center py-8">
              <Icon icon="solar:map-point-linear" className="text-4xl text-default-400" />
              <p className="text-default-500 text-center">No location set</p>
              <Button
                color="primary"
                onPress={onLocationModalOpen}
                startContent={<Icon icon="solar:map-point-add-linear" />}
              >
                Set Location
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Reset Profile Card */}
      <div className="flex justify-center items-center">
        <Card isFooterBlurred className="border-none" radius="lg">
          <Image
            alt="Wipe profile"
            className="object-cover"
            height={200}
            src="https://heroui.com/images/hero-card.jpeg"
            width={200}
          />
          <CardFooter className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
            <p className="text-tiny text-white/80">Wipe profile (dev)?</p>
            <Button
              className="text-tiny text-white bg-black/20"
              color="default"
              radius="lg"
              size="sm"
              variant="flat"
              onPress={onResetModalOpen}
            >
              Reset
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

