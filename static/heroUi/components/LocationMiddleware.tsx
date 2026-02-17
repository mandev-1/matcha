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
  // HeroUI types onOpenChange as () => void but it accepts (open: boolean) at runtime
  const setModalOpen = (open: boolean) => (onOpenChange as (open?: boolean) => void)(open);
  const closeModal = () => setModalOpen(false);
  const [step, setStep] = useState<"consent" | "geolocation" | "manual" | "final">("consent");
  const [manualLocation, setManualLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [tryAgainCount, setTryAgainCount] = useState(0);
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

  const handleConsent = async () => {
    // If Try Again was clicked twice, set to Prague
    if (tryAgainCount >= 1) {
      await handleSetPrague();
      setTryAgainCount(0);
      return;
    }

    if (!("geolocation" in navigator)) {
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
        closeModal();
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
    setTryAgainCount(0);
  };

  const handleFinalDecline = () => {
    // User refused to share location - log them out
    closeModal();
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
    setModalOpen(open);
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
        closeModal();
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
      closeModal();
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
                  onPress={() => setStep("manual")}
                  className="flex-1"
                  size="lg"
                >
                  Enter Manually
                </Button>
              </div>
              <Button 
                color="danger" 
                variant="light" 
                onPress={handleFinalDecline}
                className="w-full"
                size="lg"
              >
                Refuse & Logout
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

