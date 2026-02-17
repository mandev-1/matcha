"use client";

import React from "react";
import { Avatar, AvatarGroup } from "@heroui/avatar";
import { Tabs, Tab } from "@heroui/tabs";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter } from "@heroui/drawer";
import { Image } from "@heroui/image";
import { Link } from "@heroui/link";
import { Tooltip } from "@heroui/tooltip";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Input, Textarea } from "@heroui/input";
import { Form } from "@heroui/form";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Spacer } from "@heroui/spacer";
import { Divider } from "@heroui/divider";
import { Skeleton } from "@heroui/skeleton";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";
import clsx from "clsx";
import { useAuth } from "@/contexts/AuthContext";
import LocationSetup from "@/components/LocationSetup";
import LocationMap from "@/components/LocationMap";
import CardProfile from "./card-profile";
import CardBasics from "./card-basics";
import CardOther from "./card-other";
import { getApiUrl, getUploadUrl } from "@/lib/apiUrl";

const LockIcon = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 24 24"
      width="1em"
      {...props}
    >
      <path
        d="M12.0011 17.3498C12.9013 17.3498 13.6311 16.6201 13.6311 15.7198C13.6311 14.8196 12.9013 14.0898 12.0011 14.0898C11.1009 14.0898 10.3711 14.8196 10.3711 15.7198C10.3711 16.6201 11.1009 17.3498 12.0011 17.3498Z"
        fill="currentColor"
      />
      <path
        d="M18.28 9.53V8.28C18.28 5.58 17.63 2 12 2C6.37 2 5.72 5.58 5.72 8.28V9.53C2.92 9.88 2 11.3 2 14.79V16.65C2 20.75 3.25 22 7.35 22H16.65C20.75 22 22 20.75 22 16.65V14.79C22 11.3 21.08 9.88 18.28 9.53ZM12 18.74C10.33 18.74 8.98 17.38 8.98 15.72C8.98 14.05 10.34 12.7 12 12.7C13.66 12.7 15.02 14.06 15.02 15.72C15.02 17.39 13.67 18.74 12 18.74ZM7.35 9.44C7.27 9.44 7.2 9.44 7.12 9.44V8.28C7.12 5.35 7.95 3.4 12 3.4C16.05 3.4 16.88 5.35 16.88 8.28V9.45C16.8 9.45 16.73 9.45 16.65 9.45H7.35V9.44Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default function Component() {
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  const {isOpen: isResetModalOpen, onOpen: onResetModalOpen, onOpenChange: onResetModalOpenChange} = useDisclosure();
  const {isOpen: isPasswordResetModalOpen, onOpen: onPasswordResetModalOpen, onOpenChange: onPasswordResetModalOpenChange} = useDisclosure();
  const {isOpen: isLocationModalOpen, onOpen: onLocationModalOpen, onOpenChange: onLocationModalOpenChange} = useDisclosure();
  const {isOpen: isImageUploadModalOpen, onOpen: onImageUploadModalOpen, onOpenChange: onImageUploadModalOpenChange} = useDisclosure();
  const { user, logout } = useAuth();

  // Add style for pink radio button inner dot
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      [data-value="female"] span[data-selected="true"] {
        background-color: #ec4899 !important;
        border-color: #ec4899 !important;
      }
      [data-value="female"] span[data-selected="true"]::before {
        background-color: #ec4899 !important;
      }
      [data-value="female"] span[data-selected="true"]::after {
        background-color: #ec4899 !important;
      }
      [data-value="female"] span[data-selected="true"] span {
        background-color: #ec4899 !important;
      }
      [data-value="female"] span[data-selected="true"] > * {
        background-color: #ec4899 !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [selectedTab, setSelectedTab] = React.useState<string>("card-preview");
  const [isResetting, setIsResetting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isResettingPassword, setIsResettingPassword] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState("");
  const [latitude, setLatitude] = React.useState<number | null>(null);
  const [longitude, setLongitude] = React.useState<number | null>(null);
  const [location, setLocation] = React.useState<string>("");
  const [locationUpdatedAt, setLocationUpdatedAt] = React.useState<string | null>(null);
  const [lastSeen, setLastSeen] = React.useState<string | null>(null);
  const [likesReceivedCount, setLikesReceivedCount] = React.useState<number>(0);
  
  // Image state
  const [userImages, setUserImages] = React.useState<(string | null)[]>(Array(5).fill(null));
  const [isUploadingImages, setIsUploadingImages] = React.useState(false);
  
  // Form state
  const [firstName, setFirstName] = React.useState<string>("");
  const [lastName, setLastName] = React.useState<string>("");
  const [email, setEmail] = React.useState<string>("");
  const [selectedGender, setSelectedGender] = React.useState<string>("");
  const [selectedPreference, setSelectedPreference] = React.useState<string>("");
  const [bio, setBio] = React.useState<string>("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState<string>("");
  const [bigFive, setBigFive] = React.useState({
    openness: "",
    conscientiousness: "",
    extraversion: "",
    agreeableness: "",
    neuroticism: "",
  });
  const [siblings, setSiblings] = React.useState<string>("");
  const [mbti, setMbti] = React.useState<string>("");
  const [caliper, setCaliper] = React.useState<string>("");

  // Reset loading state immediately when component mounts or route changes
  React.useEffect(() => {
    setIsLoading(true);
  }, []); // Only on mount/route change

  const loadProfile = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(getApiUrl("/api/profile"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          const profile = data.data;
          setFirstName(profile.first_name || "");
          setLastName(profile.last_name || "");
          setEmail(profile.email || "");
          setSelectedGender(profile.gender || "");
          // Default to "both" (bisexuality) if no preference is set
          setSelectedPreference(profile.sexual_preference || "both");
          setBio(profile.biography || "");
          // Normalize tags from server so they persist and don't reset
          const normalizedTags = (profile.tags || []).map((tag: string) => normalizeTag(tag));
          setTags(normalizedTags);
            setLatitude(profile.latitude || null);
            setLongitude(profile.longitude || null);
            setLocation(profile.location || "");
            setLocationUpdatedAt(profile.location_updated_at || null);
            setLastSeen(profile.last_seen || null);
            setLikesReceivedCount(typeof profile.likes_received_count === "number" ? profile.likes_received_count : 0);
            
            // Check if location is missing and show modal
            if (!profile.latitude || !profile.longitude) {
              // Small delay to let the page load first
              setTimeout(() => {
                onLocationModalOpen();
              }, 500);
            }
            
            // Load Big Five personality traits
            if (profile.big_five) {
              setBigFive({
                openness: profile.big_five.openness || "",
                conscientiousness: profile.big_five.conscientiousness || "",
                extraversion: profile.big_five.extraversion || "",
                agreeableness: profile.big_five.agreeableness || "",
                neuroticism: profile.big_five.neuroticism || "",
              });
            }
            
            // Load other personality fields
            setSiblings(profile.siblings || "");
            setMbti(profile.mbti || "");
            setCaliper(profile.caliper_profile || "");

            // Load images
            if (profile.images && Array.isArray(profile.images)) {
              const imagesArray = Array(5).fill(null);
              profile.images.forEach((img: { file_path: string; order_index: number }) => {
                if (img.order_index >= 0 && img.order_index < 5) {
                  // Convert relative path to full URL if needed
                  const imageUrl = img.file_path && img.file_path !== "-" 
                    ? getUploadUrl(img.file_path)
                    : null;
                  imagesArray[img.order_index] = imageUrl;
                }
              });
              setUserImages(imagesArray);
            }
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
  }, []);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Helper function to normalize tag (ensure it starts with #)
  const normalizeTag = (tag: string): string => {
    const trimmed = tag.trim();
    if (!trimmed) return trimmed;
    return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  };

  // Helper function to compare tags (without hashtag)
  const tagsMatch = (tag1: string, tag2: string): boolean => {
    const t1 = tag1.replace(/^#/, "").toLowerCase();
    const t2 = tag2.replace(/^#/, "").toLowerCase();
    return t1 === t2;
  };

  const addTag = () => {
    if (tags.length >= 5) {
      addToast({
        title: "Maximum tags reached",
        description: "You can only add up to 5 tags.",
        color: "warning",
      });
      return;
    }
    const trimmedInput = tagInput.trim();
    if (trimmedInput) {
      const normalizedTag = normalizeTag(trimmedInput);
      // Check if tag already exists (comparing without hashtag)
      const tagExists = tags.some(tag => tagsMatch(tag, normalizedTag));
      if (!tagExists) {
        setTags([...tags, normalizedTag]);
        setTagInput("");
      } else {
        addToast({
          title: "Tag already exists",
          description: "This tag has already been added.",
          color: "warning",
        });
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(getApiUrl("/api/profile"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email: email,
          gender: selectedGender,
          sexual_preference: selectedPreference,
          biography: bio,
          big_five: {
            openness: bigFive.openness,
            conscientiousness: bigFive.conscientiousness,
            extraversion: bigFive.extraversion,
            agreeableness: bigFive.agreeableness,
            neuroticism: bigFive.neuroticism,
          },
          siblings: siblings,
          mbti: mbti,
          caliper_profile: caliper,
          tags: tags.map(tag => normalizeTag(tag)), // Ensure all tags have hashtags when saving
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update profile");
      }

      addToast({
        title: "Profile updated successfully",
        description: "Your profile has been saved.",
        color: "primary",
      });
      // Refetch profile so tags and all fields stay in sync with server (prevents tags resetting)
      await loadProfile();
      setSelectedTab("card-preview");
    } catch (error) {
      console.error("Error saving profile:", error);
      addToast({
        title: "Failed to update profile",
        description: error instanceof Error ? error.message : "Please try again.",
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async (onClose: () => void) => {
    // Validate passwords
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return;
    }

    // Check for common words (any language)
    const commonWords = [
      "password", "password123", "12345678", "123456789", "qwerty", "abc123",
      "password1", "welcome", "monkey", "1234567", "letmein", "trustno1",
      "dragon", "baseball", "iloveyou", "master", "sunshine", "ashley",
      "bailey", "passw0rd", "shadow", "123123", "654321", "superman",
      "qazwsx", "michael", "football", "jesus", "ninja",
      "mustang", "princess", "qwerty123", "solo", "starwars",
      "hello", "hello123", "welcome123", "admin", "admin123", "root",
      "test", "test123", "guest", "user", "demo", "sample",
      "пароль", "пароль123", "привет", "привет123", "админ", "админ123",
      "йцукен", "пользователь", "тест", "тест123",
      "contraseña", "contrasena", "contraseña123", "hola", "hola123",
      "motdepasse", "motdepasse123", "bonjour", "bonjour123",
      "passwort", "passwort123", "hallo", "hallo123",
      "mima", "mima123", "pasuwaado",
    ];

    const lowerPassword = newPassword.toLowerCase();
    const isCommon = commonWords.some(word => lowerPassword === word || lowerPassword.includes(word));
    
    if (isCommon && newPassword !== "Test1234") {
      setPasswordError("Password cannot be a commonly used word");
      return;
    }

    setIsResettingPassword(true);
    setPasswordError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(getApiUrl("/api/profile/change-password"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to reset password");
      }

      // Clear form and close modal
      setNewPassword("");
      setConfirmPassword("");
      onClose();
      addToast({
        title: "Password reset successfully",
        description: "Your password has been updated.",
        color: "secondary",
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      setPasswordError(error instanceof Error ? error.message : "Failed to reset password. Please try again.");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleReset = async (onClose: () => void) => {
    setIsResetting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(getApiUrl("/api/profile/reset"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to reset profile");
      }

      // Close modal, logout user, and redirect to login
      onClose();
      logout();
      window.location.href = "/login";
    } catch (error) {
      console.error("Error resetting profile:", error);
      alert(error instanceof Error ? error.message : "Failed to reset profile. Please try again.");
      setIsResetting(false);
    }
  };


  return (
    <>
      <div className="profile-page-100 flex h-dvh w-full max-w-full flex-col gap-8">
        <div className="flex items-center justify-center gap-2">
          <Tabs 
            className="flex-1 justify-center"
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as string)}
          >
            <Tab key="card-preview" title="My Card" />
            <Tab key="basics" title="Basics" />
            <Tab key="settings" title="Settings" />
          </Tabs>
          <Button className="justify-center" size="sm" variant="flat" onPress={onOpen}>
            Help
          </Button>
        </div>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner size="lg" />
            <p className="mt-4 text-default-500">Loading profile...</p>
          </div>
        ) : (
          <>
        {selectedTab === "card-preview" && (
          <CardProfile
            userImages={userImages}
            firstName={firstName}
            lastName={lastName}
            user={user}
            selectedGender={selectedGender}
            bio={bio}
            tags={tags}
            selectedPreference={selectedPreference}
            mbti={mbti}
            lastSeen={lastSeen}
            likesReceivedCount={likesReceivedCount}
            onImageUploadModalOpen={onImageUploadModalOpen}
            onEditClick={() => setSelectedTab("basics")}
          />
        )}
        {selectedTab === "basics" && (
          <CardBasics
            isLoading={isLoading}
            isSaving={isSaving}
            firstName={firstName}
            lastName={lastName}
            email={email}
            user={user}
            selectedGender={selectedGender}
            selectedPreference={selectedPreference}
            bio={bio}
            tags={tags}
            tagInput={tagInput}
            siblings={siblings}
            bigFive={bigFive}
            mbti={mbti}
            caliper={caliper}
            setFirstName={setFirstName}
            setLastName={setLastName}
            setEmail={setEmail}
            setSelectedGender={setSelectedGender}
            setSelectedPreference={setSelectedPreference}
            setBio={setBio}
            setTagInput={setTagInput}
            setSiblings={setSiblings}
            setBigFive={setBigFive}
            setMbti={setMbti}
            setCaliper={setCaliper}
            addTag={addTag}
            removeTag={removeTag}
            handleSave={handleSave}
            onPasswordResetModalOpen={onPasswordResetModalOpen}
          />
        )}
        
        {selectedTab === "settings" && (
          <CardOther
            latitude={latitude}
            longitude={longitude}
            location={location}
            locationUpdatedAt={locationUpdatedAt}
            setLatitude={setLatitude}
            setLongitude={setLongitude}
            setLocation={setLocation}
            onLocationModalOpen={onLocationModalOpen}
            onResetModalOpen={onResetModalOpen}
          />
        )}
          </>
        )}

      </div>
      <Drawer
        hideCloseButton
        backdrop="blur"
        classNames={{
          base: "sm:data-[placement=right]:m-2 sm:data-[placement=left]:m-2 rounded-medium",
        }}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      >
        <DrawerContent>
          {(onClose) => (
            <>
              <DrawerHeader className="absolute top-0 inset-x-0 z-50 flex flex-row gap-2 px-2 py-2 border-b border-default-200/50 justify-between bg-content1/50 backdrop-saturate-150 backdrop-blur-lg">
                <Tooltip content="Close">
                  <Button
                    isIconOnly
                    className="text-default-400"
                    size="sm"
                    variant="light"
                    onPress={onClose}
                  >
                    <svg
                      fill="none"
                      height="20"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      width="20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="m13 17 5-5-5-5M6 17l5-5-5-5" />
                    </svg>
                  </Button>
                </Tooltip>
                <div className="w-full flex justify-start gap-2">
                  <Button
                    className="font-medium text-small text-default-500"
                    size="sm"
                    startContent={
                      <svg
                        height="16"
                        viewBox="0 0 16 16"
                        width="16"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3.85.75c-.908 0-1.702.328-2.265.933-.558.599-.835 1.41-.835 2.29V7.88c0 .801.23 1.548.697 2.129.472.587 1.15.96 1.951 1.06a.75.75 0 1 0 .185-1.489c-.435-.054-.752-.243-.967-.51-.219-.273-.366-.673-.366-1.19V3.973c0-.568.176-.993.433-1.268.25-.27.632-.455 1.167-.455h4.146c.479 0 .828.146 1.071.359.246.215.43.54.497.979a.75.75 0 0 0 1.483-.23c-.115-.739-.447-1.4-.99-1.877C9.51 1 8.796.75 7.996.75zM7.9 4.828c-.908 0-1.702.326-2.265.93-.558.6-.835 1.41-.835 2.29v3.905c0 .879.275 1.69.833 2.289.563.605 1.357.931 2.267.931h4.144c.91 0 1.705-.326 2.268-.931.558-.599.833-1.41.833-2.289V8.048c0-.879-.275-1.69-.833-2.289-.563-.605-1.357-.931-2.267-.931zm-1.6 3.22c0-.568.176-.992.432-1.266.25-.27.632-.454 1.168-.454h4.145c.54 0 .92.185 1.17.453.255.274.43.698.43 1.267v3.905c0 .569-.175.993-.43 1.267-.25.268-.631.453-1.17.453H7.898c-.54 0-.92-.185-1.17-.453-.255-.274-.43-.698-.43-1.267z"
                          fill="currentColor"
                          fillRule="evenodd"
                        />
                      </svg>
                    }
                    variant="flat"
                  >
                    Copy Link
                  </Button>
                  <Button
                    className="font-medium text-small text-default-500"
                    endContent={
                      <svg
                        fill="none"
                        height="16"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="16"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M7 17 17 7M7 7h10v10" />
                      </svg>
                    }
                    size="sm"
                    variant="flat"
                  >
                    Event Page
                  </Button>
                </div>
                <div className="flex gap-1 items-center">
                  <Tooltip content="Previous">
                    <Button isIconOnly className="text-default-500" size="sm" variant="flat">
                      <svg
                        fill="none"
                        height="16"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="16"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="m18 15-6-6-6 6" />
                      </svg>
                    </Button>
                  </Tooltip>
                  <Tooltip content="Next">
                    <Button isIconOnly className="text-default-500" size="sm" variant="flat">
                      <svg
                        fill="none"
                        height="16"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="16"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </Button>
                  </Tooltip>
                </div>
              </DrawerHeader>
              <DrawerBody className="pt-16">
                <div className="flex w-full justify-center items-center pt-4">
                  <Image
                    isBlurred
                    isZoomed
                    alt="Event image"
                    className="aspect-square w-full hover:scale-110"
                    height={300}
                    src="https://nextuipro.nyc3.cdn.digitaloceanspaces.com/components-images/places/san-francisco.png"
                  />
                </div>
                <div className="flex flex-col gap-2 py-4">
                  <h1 className="text-2xl font-bold leading-7">SF Bay Area Meetup in November</h1>
                  <p className="text-sm text-default-500">
                    555 California St, San Francisco, CA 94103
                  </p>
                  <div className="mt-4 flex flex-col gap-3">
                    <div className="flex gap-3 items-center">
                      <div className="flex-none border-1 border-default-200/50 rounded-small text-center w-11 overflow-hidden">
                        <div className="text-tiny bg-default-100 py-0.5 text-default-500">Nov</div>
                        <div className="flex items-center justify-center font-semibold text-medium h-6 text-default-500">
                          19
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-medium text-foreground font-medium">
                          Tuesday, November 19
                        </p>
                        <p className="text-small text-default-500">5:00 PM - 9:00 PM PST</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-center">
                      <div className="flex items-center justify-center border-1 border-default-200/50 rounded-small w-11 h-11">
                        <svg
                          className="text-default-500"
                          height="20"
                          viewBox="0 0 16 16"
                          width="20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g
                            fill="none"
                            fillRule="evenodd"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                          >
                            <path d="M2 6.854C2 11.02 7.04 15 8 15s6-3.98 6-8.146C14 3.621 11.314 1 8 1S2 3.62 2 6.854" />
                            <path d="M9.5 6.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0" />
                          </g>
                        </svg>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <Link
                          isExternal
                          showAnchorIcon
                          anchorIcon={
                            <svg
                              className="group-hover:text-inherit text-default-400 transition-[color,transform] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                              fill="none"
                              height="16"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              width="16"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M7 17 17 7M7 7h10v10" />
                            </svg>
                          }
                          className="group gap-x-0.5 text-medium text-foreground font-medium"
                          href="https://www.google.com/maps/place/555+California+St,+San+Francisco,+CA+94103"
                          rel="noreferrer noopener"
                        >
                          555 California St suite 500
                        </Link>
                        <p className="text-small text-default-500">San Francisco, California</p>
                      </div>
                    </div>
                    <div className="flex flex-col mt-4 gap-3 items-start">
                      <span className="text-medium font-medium">Developer resources:</span>
                      <div className="text-medium text-default-500 flex flex-col gap-2">
                        <div className="flex flex-col gap-2 mb-2">
                          <Link className="text-default-700 hover:text-primary" href="/bot-activity">
                            View Bot Activity Log →
                          </Link>
                          <Link className="text-default-700 hover:text-primary" href="/ranking">
                            View Ranking →
                          </Link>
                        </div>
                        <ol className="list-decimal list-inside space-y-2">
                          <li>
                            <Link className="text-default-700 hover:text-primary" href="/help/frequent-questions">
                              FAQ
                            </Link>
                          </li>
                          <li>
                            <Link className="text-default-700 hover:text-primary" href="/help/golang-simulation">
                              Simulating Activity
                            </Link>
                          </li>
                          <li>
                            <Link className="text-default-700 hover:text-primary" href="/help/mafia">
                              Fame Rating system
                            </Link>
                          </li>
                          <li>
                            <Link className="text-default-700 hover:text-primary" href="/help/api_explanation">
                              API
                            </Link>
                          </li>
                        </ol>
                        <p className="mt-4 text-default-400 italic">
                          Thanks for all the fish!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </DrawerBody>
              <DrawerFooter>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>

      {/* Reset Profile Modal */}
      <Modal
        isDismissable={false}
        isKeyboardDismissDisabled={true}
        isOpen={isResetModalOpen}
        onOpenChange={onResetModalOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Reset Profile
              </ModalHeader>
              <ModalBody>
                <p>
                  Are you sure you want to reset your profile? This action will delete all profile data except your name, username, email, and password.
                </p>
                <p>
                  The following information will be cleared:
                </p>
                <ul className="list-disc list-inside text-small text-default-500 space-y-1">
                  <li>Gender</li>
                  <li>Sexual preference</li>
                  <li>Biography</li>
                  <li>Hobbies & Interests</li>
                  <li>Big Five Personality Traits</li>
                  <li>Siblings information</li>
                  <li>MBTI type</li>
                  <li>Caliper profile</li>
                  <li>Profile pictures</li>
                </ul>
                <p className="text-small text-danger mt-2">
                  <strong>Note:</strong> This action will also log you out. You will need to log in again after resetting your profile.
                </p>
                <p className="text-small text-danger mt-1">
                  This action cannot be undone.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose} isDisabled={isResetting}>
                  Cancel
                </Button>
                <Button 
                  color="danger" 
                  onPress={() => handleReset(onClose)}
                  isLoading={isResetting}
                >
                  Yes, Reset Profile
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Password Reset Modal */}
      <Modal 
        isOpen={isPasswordResetModalOpen} 
        placement="top-center" 
        onOpenChange={onPasswordResetModalOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Reset Password</ModalHeader>
              <ModalBody>
                <Input
                  isRequired
                  inputMode="text"
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                    >
                      {isPasswordVisible ? (
                        <Icon className="text-2xl text-default-400 pointer-events-none" icon="solar:eye-closed-linear" />
                      ) : (
                        <Icon className="text-2xl text-default-400 pointer-events-none" icon="solar:eye-bold" />
                      )}
                    </button>
                  }
                  label="New Password"
                  placeholder="Enter your new password"
                  type={isPasswordVisible ? "text" : "password"}
                  variant="bordered"
                  value={newPassword}
                  onValueChange={(value) => {
                    setNewPassword(value);
                    setPasswordError("");
                  }}
                  errorMessage={passwordError}
                  isInvalid={!!passwordError}
                  startContent={
                    <LockIcon className="text-2xl text-default-400 pointer-events-none shrink-0" />
                  }
                />
                <Input
                  isRequired
                  inputMode="text"
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                    >
                      {isConfirmPasswordVisible ? (
                        <Icon className="text-2xl text-default-400 pointer-events-none" icon="solar:eye-closed-linear" />
                      ) : (
                        <Icon className="text-2xl text-default-400 pointer-events-none" icon="solar:eye-bold" />
                      )}
                    </button>
                  }
                  label="Confirm Password"
                  placeholder="Confirm your new password"
                  type={isConfirmPasswordVisible ? "text" : "password"}
                  variant="bordered"
                  value={confirmPassword}
                  onValueChange={(value) => {
                    setConfirmPassword(value);
                    setPasswordError("");
                  }}
                  errorMessage={newPassword && confirmPassword && newPassword !== confirmPassword ? "Passwords do not match" : ""}
                  isInvalid={!!newPassword && !!confirmPassword && newPassword !== confirmPassword}
                  startContent={
                    <LockIcon className="text-2xl text-default-400 pointer-events-none shrink-0" />
                  }
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose} isDisabled={isResettingPassword}>
                  Cancel
                </Button>
                <Button 
                  color="primary" 
                  onPress={() => handlePasswordReset(onClose)}
                  isLoading={isResettingPassword}
                  className="bg-pink-500 text-white hover:bg-pink-600"
                >
                  Reset Password
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Location Setup Modal */}
      <LocationSetup
        isOpen={isLocationModalOpen}
        onOpenChange={onLocationModalOpenChange}
        onLocationSet={(loc) => {
          setLatitude(loc.latitude);
          setLongitude(loc.longitude);
          setLocation(loc.location);
        }}
        existingLocation={{
          latitude,
          longitude,
          location,
        }}
      />

      {/* Image Upload Modal */}
      <Modal 
        isOpen={isImageUploadModalOpen} 
        onOpenChange={onImageUploadModalOpenChange}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Icon icon="solar:gallery-add-bold" className="text-2xl text-primary" />
                  <span>Upload & Manage Images</span>
                </div>
                <p className="text-sm text-default-500 font-normal mt-1">
                  Click on any slot to upload an image. Slot 1 is your profile picture.
                </p>
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-4">
                  {/* Image Carousel/Grid */}
                  <div className="grid grid-cols-5 gap-3">
                    {userImages.map((imageUrl, index) => (
                      <div
                        key={index}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                          index === 0 
                            ? "border-primary border-dashed" 
                            : "border-default-200"
                        } cursor-pointer hover:border-primary transition-colors`}
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*";
                          input.onchange = async (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (!file) return;

                            // Show preview
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const newImages = [...userImages];
                              newImages[index] = event.target?.result as string;
                              setUserImages(newImages);
                            };
                            reader.readAsDataURL(file);

                            // Upload image
                            setIsUploadingImages(true);
                            try {
                              const formData = new FormData();
                              formData.append("image", file);
                              formData.append("slot", index.toString());
                              formData.append("is_profile", index === 0 ? "1" : "0");

                              const token = localStorage.getItem("token");
                              const response = await fetch(getApiUrl("/api/profile/upload-image"), {
                                method: "POST",
                                headers: {
                                  Authorization: `Bearer ${token}`,
                                },
                                body: formData,
                              });

                              // Check if response is JSON
                              const contentType = response.headers.get("content-type");
                              if (!contentType || !contentType.includes("application/json")) {
                                const text = await response.text();
                                throw new Error(`Server error: ${text.substring(0, 100)}`);
                              }

                              const data = await response.json();
                              if (response.ok && data.success) {
                                const updatedImages = [...userImages];
                                updatedImages[index] = data.data.file_path;
                                setUserImages(updatedImages);
                                addToast({
                                  title: "Image uploaded",
                                  description: index === 0 ? "Profile image updated" : `Image ${index + 1} uploaded`,
                                  color: "success",
                                });
                              } else {
                                throw new Error(data.error || "Failed to upload image");
                              }
                            } catch (error) {
                              console.error("Error uploading image:", error);
                              addToast({
                                title: "Upload failed",
                                description: error instanceof Error ? error.message : "Failed to upload image",
                                color: "danger",
                              });
                              // Revert preview
                              const revertedImages = [...userImages];
                              revertedImages[index] = imageUrl;
                              setUserImages(revertedImages);
                            } finally {
                              setIsUploadingImages(false);
                            }
                          };
                          input.click();
                        }}
                      >
                        {imageUrl ? (
                          <>
                            <Image
                              src={imageUrl}
                              alt={`Slot ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Icon icon="solar:camera-add-linear" className="text-3xl text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-default-100">
                            <Icon icon="solar:gallery-add-linear" className="text-4xl text-default-400 mb-2" />
                            <span className="text-xs text-default-500">Click to upload</span>
                          </div>
                        )}
                        {index === 0 && (
                          <div className="absolute top-1 left-1 bg-primary text-white text-xs px-2 py-1 rounded">
                            Profile
                          </div>
                        )}
                        <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Swap Controls */}
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-semibold">Reorder Images</p>
                    <div className="flex flex-wrap gap-2">
                      {[0, 1, 2, 3].map((index) => (
                        <Button
                          key={index}
                          size="sm"
                          variant="flat"
                          color="default"
                          onPress={async () => {
                            // Swap images at index and index+1
                            const newImages = [...userImages];
                            const temp = newImages[index];
                            newImages[index] = newImages[index + 1];
                            newImages[index + 1] = temp;
                            setUserImages(newImages);

                            // Update backend
                            try {
                              const token = localStorage.getItem("token");
                              const response = await fetch(getApiUrl("/api/profile/reorder-images"), {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({
                                  slot1: index,
                                  slot2: index + 1,
                                }),
                              });

                              const data = await response.json();
                              if (response.ok && data.success) {
                                addToast({
                                  title: "Images reordered",
                                  description: `Swapped slots ${index + 1} and ${index + 2}`,
                                  color: "success",
                                });
                              } else {
                                throw new Error(data.error || "Failed to reorder images");
                              }
                            } catch (error) {
                              console.error("Error reordering images:", error);
                              addToast({
                                title: "Reorder failed",
                                description: error instanceof Error ? error.message : "Failed to reorder images",
                                color: "danger",
                              });
                              // Revert swap
                              const revertedImages = [...userImages];
                              const temp = revertedImages[index];
                              revertedImages[index] = revertedImages[index + 1];
                              revertedImages[index + 1] = temp;
                              setUserImages(revertedImages);
                            }
                          }}
                          startContent={<Icon icon="solar:swap-linear" className="text-sm" />}
                        >
                          Swap {index + 1} ↔ {index + 2}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}

