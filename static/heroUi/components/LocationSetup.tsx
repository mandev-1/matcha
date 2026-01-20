"use client";

import React, { useEffect, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { addToast } from "@heroui/toast";

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

  const handleConsent = () => {
    if (!("geolocation" in navigator)) {
      // Geolocation not supported, go to manual entry
      setStep("manual");
      return;
    }

    setStep("geolocation");
    setIsLoading(true);

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
    const response = await fetch("/api/profile", {
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
            <ModalHeader className="flex flex-col gap-1">Location Required</ModalHeader>
            <ModalBody>
              <p>
                We need your location to continue. 😢 Are you sure you want to refuse? Sorry, but location is required for the matching feature to work properly.
              </p>
              <p className="text-small text-default-500 mt-2">
                You can still enter your location manually if you prefer not to share your exact coordinates.
              </p>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={handleFinalDecline}>
                Enter Manually
              </Button>
              <Button color="primary" onPress={handleConsent}>
                Try Again
              </Button>
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

