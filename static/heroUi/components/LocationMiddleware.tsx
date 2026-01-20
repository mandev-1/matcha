"use client";

import React, { useEffect, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { addToast } from "@heroui/toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";

interface LocationMiddlewareProps {
  children: React.ReactNode;
}

export function LocationMiddleware({ children }: LocationMiddlewareProps) {
  const { isAuthenticated, logout, token } = useAuth();
  const router = useRouter();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [step, setStep] = useState<"consent" | "geolocation" | "manual" | "final">("consent");
  const [manualLocation, setManualLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [locationData, setLocationData] = useState<{
    latitude: number;
    longitude: number;
    location: string;
  } | null>(null);

  // Check location status on mount and periodically
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setIsChecking(false);
      return;
    }

    const checkLocation = async () => {
      try {
        const response = await fetch("/api/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          setIsChecking(false);
          return;
        }

        const data = await response.json();
        if (!data.success) {
          setIsChecking(false);
          return;
        }

        const locationUpdatedAt = data.data?.location_updated_at;
        const hasLocation = data.data?.latitude && data.data?.longitude;

        // If no location, prompt immediately
        if (!hasLocation) {
          setIsChecking(false);
          onOpen();
          return;
        }

        // If location exists, check if it's older than 30 minutes
        if (locationUpdatedAt) {
          const updatedAt = new Date(locationUpdatedAt);
          const now = new Date();
          const diffMinutes = (now.getTime() - updatedAt.getTime()) / (1000 * 60);

          if (diffMinutes >= 30) {
            setIsChecking(false);
            onOpen();
            return;
          }
        }

        setIsChecking(false);
      } catch (error) {
        console.error("Error checking location:", error);
        setIsChecking(false);
      }
    };

    checkLocation();

    // Check every 5 minutes
    const interval = setInterval(checkLocation, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, token, onOpen]);

  const handleConsent = () => {
    if (!("geolocation" in navigator)) {
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
        onOpenChange(false);
        addToast({
          title: "Location updated",
          description: "Your location has been refreshed.",
          color: "success",
        });
        setStep("consent");
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
    // User refused to share location - log them out
    onOpenChange(false);
    logout();
    router.push("/login");
    addToast({
      title: "Logged out",
      description: "we really had to log you out, because we just cant work without being provided your location",
      color: "danger",
    });
  };

  const handleModalClose = (open: boolean) => {
    // If user tries to close modal without providing location, log them out
    // This is a safety net - modal should be non-dismissable on consent/final steps
    if (!open && (step === "final" || step === "consent")) {
      handleFinalDecline();
      return;
    }
    // Allow closing only if location was successfully saved (step will be reset to "consent")
    onOpenChange(open);
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
        onOpenChange(false);
        addToast({
          title: "Location saved",
          description: "Your location has been updated.",
          color: "success",
        });
        setStep("consent");
        setManualLocation("");
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

    const data = await response.json();
    return data;
  };

  const renderContent = () => {
    switch (step) {
      case "consent":
        return (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Icon icon="solar:map-point-bold" className="text-2xl text-primary" />
                <span>Update Your Location</span>
              </div>
            </ModalHeader>
            <ModalBody>
              <p>
                Your location needs to be updated (it's been more than 30 minutes). Please share your current location to continue using the app.
              </p>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={handleDecline}>
                Refuse
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
                We need your location to continue. Are you sure you want to refuse? Location is required for the matching feature to work properly.
              </p>
              <p className="text-small text-default-500 mt-2">
                You can still enter your location manually if you prefer not to share your exact coordinates.
              </p>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={handleFinalDecline}>
                Refuse & Logout
              </Button>
              <Button color="default" variant="flat" onPress={() => setStep("manual")}>
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
              <Button color="default" variant="light" onPress={() => setStep("final")}>
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

  // Don't render anything while checking (to avoid flash)
  if (isChecking) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <Modal 
        isOpen={isOpen} 
        onOpenChange={handleModalClose} 
        isDismissable={false} 
        hideCloseButton={step === "geolocation" || step === "consent" || step === "final"}
      >
        <ModalContent>
          {(onClose) => (
            <>
              {renderContent()}
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

