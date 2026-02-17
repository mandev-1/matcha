"use client";

import React, { useEffect, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { addToast } from "@heroui/toast";
import { Icon } from "@iconify/react";
import { getApiUrl } from "@/lib/apiUrl";

interface LocationSetupProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationSet: (location: { latitude: number; longitude: number; location: string }) => void;
  existingLocation?: { latitude: number | null; longitude: number | null; location: string | null };
}

export default function LocationSetup({
  isOpen,
  onOpenChange,
  onLocationSet,
  existingLocation,
}: LocationSetupProps) {
  const [step, setStep] = useState<"check" | "consent" | "geolocation" | "manual" | "final">("check");
  const [manualLocation, setManualLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tryAgainCount, setTryAgainCount] = useState(0);
  const [locationData, setLocationData] = useState<{
    latitude: number;
    longitude: number;
    location: string;
  } | null>(null);

  // Check if user already has location
  useEffect(() => {
    if (isOpen && existingLocation?.latitude && existingLocation?.longitude) {
      // User already has location, close modal
      onOpenChange(false);
      return;
    }
    
    if (isOpen) {
      setStep("consent");
    }
  }, [isOpen, existingLocation, onOpenChange]);

  const handleConsent = async () => {
    // If Try Again was clicked twice, set to Prague
    if (tryAgainCount >= 1) {
      await handleSetPrague();
      setTryAgainCount(0);
      return;
    }

    if (!("geolocation" in navigator)) {
      // Geolocation not supported, go to manual entry
      setStep("manual");
      return;
    }

    setStep("geolocation");
    setIsLoading(true);
    setTryAgainCount(prev => prev + 1);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Try to get location name from coordinates (reverse geocoding)
        let locationName = "";
        try {
          // Using a free reverse geocoding service
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
          );
          const data = await response.json();
          locationName = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        } catch (error) {
          locationName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        }

        setLocationData({ latitude, longitude, location: locationName });
        setIsLoading(false);
        setTryAgainCount(0);
        
        // Save location
        await saveLocation({ latitude, longitude, location: locationName });
        onLocationSet({ latitude, longitude, location: locationName });
        onOpenChange(false);
        addToast({
          title: "Location saved",
          description: "Your location has been updated.",
          color: "success",
        });
      },
      (error) => {
        setIsLoading(false);
        // User denied or error occurred
        if (error.code === error.PERMISSION_DENIED) {
          setStep("final");
        } else {
          // Other error, offer manual entry
          setStep("manual");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleDecline = () => {
    setStep("final");
  };

  const handleFinalDecline = () => {
    setStep("manual");
  };

  const handleManualSubmit = async () => {
    if (!manualLocation.trim()) {
      addToast({
        title: "Location required",
        description: "Please enter a location.",
        color: "warning",
      });
      return;
    }

    setIsLoading(true);
    
    // Try to geocode the manual location
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualLocation)}&limit=1`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        
        await saveLocation({ latitude, longitude, location: display_name });
        onLocationSet({ latitude, longitude, location: display_name });
        onOpenChange(false);
        addToast({
          title: "Location saved",
          description: "Your location has been updated.",
          color: "success",
        });
      } else {
        addToast({
          title: "Location not found",
          description: "Could not find that location. Please try again.",
          color: "danger",
        });
      }
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to process location. Please try again.",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveLocation = async (location: { latitude: number; longitude: number; location: string }) => {
    const token = localStorage.getItem("token");
    const response = await fetch(getApiUrl("/api/profile"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        latitude: location.latitude,
        longitude: location.longitude,
        location: location.location,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save location");
    }
    
    // Return the response data which includes location_updated_at
    const data = await response.json();
    return data;
  };

  // Get random Prague district (Prague 1-15)
  const getRandomPragueLocation = async (): Promise<{ latitude: number; longitude: number; location: string }> => {
    // Randomly select Prague 1-15
    const districtNumber = Math.floor(Math.random() * 15) + 1;
    const locationName = `Prague ${districtNumber}, Czech Republic`;

    // Get coordinates for the Prague district
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`
      );
      const data = await response.json();

      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        return {
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          location: display_name || locationName,
        };
      }
    } catch (error) {
      console.error("Error geocoding Prague location:", error);
    }

    // Fallback: approximate center of Prague with slight random offset
    const baseLat = 50.0755;
    const baseLng = 14.4378;
    const offset = (districtNumber - 8) * 0.01; // Spread districts around Prague center
    
    return {
      latitude: baseLat + (Math.random() - 0.5) * 0.05 + offset,
      longitude: baseLng + (Math.random() - 0.5) * 0.05,
      location: locationName,
    };
  };

  const handleSetPrague = async () => {
    setIsLoading(true);
    try {
      const pragueLocation = await getRandomPragueLocation();
      await saveLocation(pragueLocation);
      onLocationSet(pragueLocation);
      onOpenChange(false);
      addToast({
        title: "Location set to Prague",
        description: `Your location has been set to ${pragueLocation.location}.`,
        color: "success",
      });
      setStep("consent");
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to set Prague location. Please try again.",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case "consent":
        return (
          <>
            <ModalHeader className="flex flex-col gap-1">Share Your Location</ModalHeader>
            <ModalBody>
              <p>
                To help you find matches nearby, we need to know your location. You can share your current location or enter it manually.
              </p>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={handleDecline}>
                Decline
              </Button>
              <Button color="primary" onPress={handleConsent} isLoading={isLoading}>
                Share Location
              </Button>
            </ModalFooter>
          </>
        );

      case "geolocation":
        return (
          <>
            <ModalHeader className="flex flex-col gap-1">Getting Your Location</ModalHeader>
            <ModalBody>
              <p>Please allow location access in your browser...</p>
            </ModalBody>
          </>
        );

      case "final":
        return (
          <>
            <ModalHeader className="flex flex-col gap-4 pb-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-warning/30 to-warning/10 flex items-center justify-center shadow-lg border-2 border-warning/20">
                    <Icon icon="solar:map-point-bold" className="text-6xl text-warning" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-danger rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-warning tracking-tight">X_X</h2>
                  <h3 className="text-lg font-semibold text-default-700">Location grab Failed</h3>
                </div>
              </div>
            </ModalHeader>
            <ModalBody className="py-4">
              <div className="flex flex-col gap-3 text-center">
                <p className="text-base leading-relaxed text-default-600">
                  We couldn't access your location, but don't worry! You can still use Matcha by setting your location manually or choosing a random Prague district.
                </p>
              </div>
            </ModalBody>
            <ModalFooter className="flex flex-col gap-3 pt-4">
              <Button 
                color="warning" 
                variant="flat" 
                onPress={handleConsent}
                isLoading={isLoading}
                startContent={<Icon icon="solar:refresh-bold" />}
                className="w-full"
                size="lg"
              >
                Try Again
              </Button>
              <div className="flex gap-3 w-full">
                <Button 
                  color="secondary" 
                  variant="flat" 
                  onPress={handleSetPrague}
                  isLoading={isLoading}
                  startContent={<Icon icon="solar:map-point-add-bold" />}
                  className="flex-1"
                  size="lg"
                >
                  Set to Prague
                </Button>
                <Button 
                  color="default" 
                  variant="flat" 
                  onPress={handleFinalDecline}
                  className="flex-1"
                  size="lg"
                >
                  Enter Manually
                </Button>
              </div>
            </ModalFooter>
          </>
        );

      case "manual":
        return (
          <>
            <ModalHeader className="flex flex-col gap-1">Enter Location Manually</ModalHeader>
            <ModalBody>
              <Input
                label="Location"
                placeholder="e.g., New York, NY or Paris, France"
                value={manualLocation}
                onValueChange={setManualLocation}
                variant="bordered"
                description="Enter a city, address, or location name"
              />
            </ModalBody>
            <ModalFooter>
              <Button color="default" variant="light" onPress={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button color="primary" onPress={handleManualSubmit} isLoading={isLoading}>
                Save Location
              </Button>
            </ModalFooter>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={step !== "geolocation"}>
      <ModalContent>
        {(onClose) => (
          <>
            {renderContent()}
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

