"use client";

import React from "react";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Image } from "@heroui/image";
import { Chip } from "@heroui/chip";
import { Icon } from "@iconify/react";

interface CardProfileProps {
  userImages: (string | null)[];
  firstName: string;
  lastName: string;
  user: { username?: string } | null;
  selectedGender: string;
  bio: string;
  tags: string[];
  selectedPreference: string;
  mbti: string;
  lastSeen: string | null;
  onImageUploadModalOpen: () => void;
  onEditClick: () => void;
}

export default function CardProfile({
  userImages,
  firstName,
  lastName,
  user,
  selectedGender,
  bio,
  tags,
  selectedPreference,
  mbti,
  lastSeen,
  onImageUploadModalOpen,
  onEditClick,
}: CardProfileProps) {
  const formatLastSeen = (lastSeenStr: string | null): string => {
    if (!lastSeenStr) return "Never";
    
    const lastSeenDate = new Date(lastSeenStr);
    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return lastSeenDate.toLocaleDateString();
  };
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full px-2 md:px-4">
      <div className="flex justify-center items-center">
        <Card isFooterBlurred className="border-none w-full h-auto md:h-[450px]" radius="lg">
          <div className="grid grid-cols-12 gap-1 md:gap-2 h-full p-1 md:p-2">
            {/* Big image on the left - 6 columns (Profile image - slot 1) */}
            <div className="col-span-12 md:col-span-6 h-[402px] md:h-full min-h-0 flex items-center justify-center bg-default-100 rounded-lg overflow-hidden">
              <Image
                alt="Main profile image"
                className="object-contain w-full h-full rounded-lg"
                src={userImages[0] || "https://heroui.com/images/hero-card.jpeg"}
              />
            </div>
            {/* 4 smaller images on the right - 3 columns each, 2 rows (slots 2-5) */}
            <div className="col-span-12 md:col-span-6 grid grid-cols-2 gap-1 md:gap-2 h-[300px] md:h-full min-h-0">
              <div className="h-full min-h-0 flex items-center justify-center bg-default-100 rounded-lg overflow-hidden">
                <Image
                  alt="Profile image 2"
                  className="object-contain w-full h-full rounded-lg"
                  src={userImages[1] || "https://heroui.com/images/hero-card.jpeg"}
                />
              </div>
              <div className="h-full min-h-0 flex items-center justify-center bg-default-100 rounded-lg overflow-hidden">
                <Image
                  alt="Profile image 3"
                  className="object-contain w-full h-full rounded-lg"
                  src={userImages[2] || "https://heroui.com/images/hero-card.jpeg"}
                />
              </div>
              <div className="h-full min-h-0 flex items-center justify-center bg-default-100 rounded-lg overflow-hidden">
                <Image
                  alt="Profile image 4"
                  className="object-contain w-full h-full rounded-lg"
                  src={userImages[3] || "https://heroui.com/images/hero-card.jpeg"}
                />
              </div>
              <div className="h-full min-h-0 flex items-center justify-center bg-default-100 rounded-lg overflow-hidden">
                <Image
                  alt="Profile image 5"
                  className="object-contain w-full h-full rounded-lg"
                  src={userImages[4] || "https://heroui.com/images/hero-card.jpeg"}
                />
              </div>
            </div>
          </div>
          <CardFooter className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
            <p className="text-tiny text-white/80">67 likes.</p>
            <Button
              className="text-tiny text-white bg-black/20"
              color="default"
              radius="lg"
              size="sm"
              variant="flat"
              onPress={onImageUploadModalOpen}
              startContent={<Icon icon="solar:gallery-add-linear" className="text-sm" />}
            >
              Upload new Images
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Profile Information */}
      <Card className="w-full relative" radius="lg">
        <Button
          className="absolute top-4 right-4 z-10"
          color="primary"
          variant="flat"
          size="sm"
          onPress={onEditClick}
          startContent={<Icon icon="solar:pen-linear" className="text-lg" />}
        >
          Edit
        </Button>
        <CardBody className="flex flex-col gap-4 p-4 md:p-6">
          {/* Name and Basic Info */}
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl md:text-3xl font-bold">
              {firstName && lastName ? `${firstName} ${lastName}` : user?.username || "Your Name"}
            </h2>
            {selectedGender && (
              <p className="text-default-500 text-sm md:text-base">
                {selectedGender === "male" ? "He/Him" : selectedGender === "female" ? "She/Her" : selectedGender}
              </p>
            )}
          </div>

          {/* Bio */}
          {bio && (
            <div className="flex flex-col gap-1">
              <p className="text-sm md:text-base text-foreground whitespace-pre-wrap">
                {bio}
              </p>
            </div>
          )}

          {/* Tags/Interests */}
          {tags && tags.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-default-600">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Chip
                    key={tag}
                    variant="flat"
                    color="primary"
                    size="sm"
                  >
                    {tag}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="flex flex-wrap gap-4 text-sm text-default-500">
            {selectedPreference && (
              <div className="flex items-center gap-1">
                <Icon icon="solar:heart-linear" className="text-lg" />
                <span>Looking for: {selectedPreference === "male" ? "Men" : selectedPreference === "female" ? "Women" : selectedPreference === "both" ? "Everyone" : "Everyone"}</span>
              </div>
            )}
            {mbti && (
              <div className="flex items-center gap-1">
                <Icon icon="solar:user-id-linear" className="text-lg" />
                <span>MBTI: {mbti}</span>
              </div>
            )}
            {lastSeen && (
              <div className="flex items-center gap-1">
                <Icon icon="solar:clock-circle-linear" className="text-lg" />
                <span>Last online: {formatLastSeen(lastSeen)}</span>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

