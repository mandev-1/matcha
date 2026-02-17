"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Input, Textarea } from "@heroui/input";
import { Spacer } from "@heroui/spacer";
import { Divider } from "@heroui/divider";
import { Form } from "@heroui/form";
import { Tabs, Tab } from "@heroui/tabs";
import { RadioGroup, useRadio } from "@heroui/radio";
import { VisuallyHidden } from "@react-aria/visually-hidden";
import clsx from "clsx";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Chip } from "@heroui/chip";
import { Select, SelectItem } from "@heroui/select";
import { addToast, ToastProvider } from "@heroui/toast";
import { Image } from "@heroui/image";
import { Icon } from "@iconify/react";
import { getApiUrl } from "@/lib/apiUrl";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import RowSteps from "@/components/row-steps";

const CustomRadio = (props: any) => {
  const {
    Component,
    children,
    description,
    getBaseProps,
    getWrapperProps,
    getInputProps,
    getLabelProps,
    getLabelWrapperProps,
    getControlProps,
  } = useRadio(props);

  return (
    <Component
      {...getBaseProps({
        className: clsx(
          "group inline-flex items-center hover:opacity-70 active:opacity-50 justify-between flex-row-reverse tap-highlight-transparent m-0",
          "cursor-pointer border-2 border-default rounded-lg gap-4 p-4",
          "data-[selected=true]:border-primary",
          props.className,
        ),
      })}
    >
      <VisuallyHidden>
        <input {...getInputProps()} />
      </VisuallyHidden>
      <span {...getWrapperProps()}>
        <span {...getControlProps()} />
      </span>
      <div {...getLabelWrapperProps()}>
        {children && <span {...getLabelProps()}>{children}</span>}
        {description && (
          <span className="text-small text-foreground opacity-70">{description}</span>
        )}
      </div>
    </Component>
  );
};

export default function RunwayPage() {
  const router = useRouter();
  const { user, login, token } = useAuth();
  const [showStepper, setShowStepper] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const handleCompleteSetup = () => {
    setShowStepper(true);
    setCurrentStep(0);
  };

  const handleFinalStep = async () => {
    if (!user || !token) {
      console.error("User or token missing");
      return;
    }

    if (!hasAtLeastOnePhoto) {
      addToast({
        title: "At least one photo required",
        description: "Please add a profile picture (first card) before publishing your profile.",
        color: "danger",
      });
      return;
    }

    setLoading(true);
    try {
      // Save profile (gender, preference, bio, tags with same sanitization as Profile, plus personality fields)
      const tagsToSave = tags.slice(0, 5).map((t) => normalizeTag(t)).filter(Boolean);
      const profilePayload: Record<string, unknown> = {
        gender: selectedGender,
        sexual_preference: selectedPreference,
        biography: bio,
        tags: tagsToSave,
      };
      if (bigFive.openness || bigFive.conscientiousness || bigFive.extraversion || bigFive.agreeableness || bigFive.neuroticism) {
        profilePayload.big_five = bigFive;
      }
      if (mbti) profilePayload.mbti = mbti;
      if (caliper) profilePayload.caliper_profile = caliper;
      if (siblings) profilePayload.siblings = siblings;

      const profileResponse = await fetch(getApiUrl("/api/profile"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profilePayload),
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        addToast({
          title: "Failed to save profile",
          description: errorData.error || "Please try again",
          color: "danger",
        });
        setLoading(false);
        return;
      }

      // Upload photos slot by slot (only slots that have a file)
      for (let i = 0; i < 5; i++) {
        const file = pictureSlots[i];
        if (!file) continue;
        const formData = new FormData();
        formData.append("image", file);
        formData.append("slot", i.toString());
        formData.append("is_profile", i === 0 ? "1" : "0");
        const uploadRes = await fetch(getApiUrl("/api/profile/upload-image"), {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          addToast({
            title: "Upload failed",
            description: errData.error || `Failed to upload photo ${i + 1}`,
            color: "danger",
          });
          setLoading(false);
          return;
        }
      }

      // Mark setup as complete
      const response = await fetch(getApiUrl("/api/profile/setup-complete"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        if (user && token) {
          login(token, { ...user, is_setup: true });
        }
        router.push("/matcha");
      } else {
        addToast({
          title: "Setup failed",
          description: data.error || "Could not complete setup",
          color: "danger",
        });
      }
    } catch (err) {
      console.error("Error completing setup:", err);
      addToast({
        title: "Error",
        description: err instanceof Error ? err.message : "Something went wrong",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const [bio, setBio] = React.useState<string>("");
  const [errors, setErrors] = React.useState<string[]>([]);
  const [selectedGender, setSelectedGender] = React.useState<string>("");
  const [selectedPreference, setSelectedPreference] = React.useState<string>("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState<string>("");
  const [bigFive, setBigFive] = React.useState({
    openness: "",
    conscientiousness: "",
    extraversion: "",
    agreeableness: "",
    neuroticism: "",
  });
  const [mbti, setMbti] = React.useState<string>("");
  const [caliper, setCaliper] = React.useState<string>("");
  const [siblings, setSiblings] = React.useState<string>("");
  // 5 slots: index 0 = profile picture, 1–4 = additional photos
  const [pictureSlots, setPictureSlots] = React.useState<(File | null)[]>(() => Array(5).fill(null));

  // Same sanitization as Profile / discover: trim, optional # prefix, max 5 tags
  const normalizeTag = (tag: string): string => {
    const trimmed = tag.trim();
    if (!trimmed) return trimmed;
    return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed || tags.length >= 5) return;
    const normalized = normalizeTag(trimmed);
    const exists = tags.some((t) => normalizeTag(t).toLowerCase() === normalized.toLowerCase());
    if (!exists) {
      setTags([...tags, normalized]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const setPictureSlot = (index: number, file: File | null) => {
    setPictureSlots((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });
  };

  const hasAtLeastOnePhoto = pictureSlots.some((f) => f != null);
  const profilePictureSet = pictureSlots[0] != null;

  // Preview URLs for display; revoke when slots change or unmount to avoid leaks
  const [previewUrls, setPreviewUrls] = React.useState<(string | null)[]>(() => Array(5).fill(null));
  const previewUrlRef = React.useRef<(string | null)[]>([]);
  React.useEffect(() => {
    const urls = pictureSlots.map((f) => (f ? URL.createObjectURL(f) : null));
    previewUrlRef.current.forEach((u) => u && URL.revokeObjectURL(u));
    previewUrlRef.current = urls;
    setPreviewUrls(urls);
    return () => {
      previewUrlRef.current.forEach((u) => u && URL.revokeObjectURL(u));
    };
  }, [pictureSlots]);

  const validateBio = (bioText: string) => {
    const newErrors: string[] = [];
    if (!bioText.trim()) {
      newErrors.push("Bio is required");
    }
    if (bioText.length > 250) {
      newErrors.push("Bio must be less than 250 characters");
    }
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleBioSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (validateBio(bio)) {
      // Show toast notification
      addToast({
        title: "Gender and Bio set",
        timeout: 3000,
      });
      setCurrentStep(1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Create
        return (
          <div className="flex justify-center w-full">
            <Card className="w-full max-w-[500px] h-[420px] flex flex-col">
              <CardBody className="px-4 flex-1 overflow-hidden p-0">
                <ScrollShadow className="h-full px-4 py-4" size={100}>
                <div className="flex w-full flex-col mb-6">
                  <h4 className="text-large mb-4">My Gender</h4>
                  <RadioGroup
                    value={selectedGender}
                    onValueChange={setSelectedGender}
                    orientation="horizontal"
                    className="flex flex-row gap-3 w-full"
                  >
                    <CustomRadio className="flex-1 w-1/2" value="male" description="Lorem Ipsum dolor sit amet">
                      I'm a guy / boy
                    </CustomRadio>
                    <CustomRadio className="flex-1 w-1/2" value="female" description="Lorem Ipsum dolor sit amet">
                      Female gender (no penis)
                    </CustomRadio>
                  </RadioGroup>
                </div>

                <Spacer y={4} />

                <div className="flex w-full flex-col mb-6">
                  <h4 className="text-large mb-4">What I want:</h4>
                  <Tabs
                    aria-label="Preference selection"
                    selectedKey={selectedPreference}
                    onSelectionChange={(key) => setSelectedPreference(key as string)}
                    className="w-full"
                    classNames={{
                      tabList: "w-full",
                      tab: "flex-1 w-1/2",
                    }}
                  >
                    <Tab key="male" title="Male">
                      <div className="p-4">
                        I'm reading this because I want to find a guy / boy to date and chat with (and maybe more). I'm strong because I admit this, very horny, and desperate for some fun.
                      </div>
                    </Tab>
                    <Tab key="female" title="Female">
                      <div className="p-4">
                        I clicked this because I'm down to meet a woman.. and I'm lowkey chill, serious, respectable and ready to be responsible. 
                      </div>
                    </Tab>
                  </Tabs>
                </div>

                <Divider className="mb-6" />

                <CardHeader className="px-0 pt-0 pb-0">
                  <div className="flex flex-col items-start">
                    <h4 className="text-large">Bio</h4>
                    <p className="text-small text-default-500">
                      Write a short biography of your situation right now, what stage of life you are entering, where are you coming from and what is important and filling for you right now
                    </p>
                  </div>
                </CardHeader>
                <Spacer y={2} />
                <Form className="gap-0" validationBehavior="native" onSubmit={handleBioSubmit}>
                  <Textarea
                    isClearable
                    isRequired
                    errorMessage={() => (
                      <ul>
                        {errors.map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    )}
                    isInvalid={errors.length > 0}
                    label="Bio"
                    maxLength={250}
                    name="bio"
                    value={bio}
                    variant="bordered"
                    onValueChange={(value) => {
                      setBio(value);
                      validateBio(value);
                    }}
                    onClear={() => setBio("")}
                  />
                  <Spacer y={6} />
                  <Divider />
                  <div className="flex w-full flex-wrap-reverse items-center justify-between gap-2 px-4 pt-4 md:flex-wrap">
                    <p className="text-small text-default-400">
                      Max. 250 characters. <span className="text-default-500">{bio.length}/250</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <Button type="reset" variant="bordered" onPress={() => setBio("")}>
                        Cancel
                      </Button>
                      <Button 
                        color="primary" 
                        type="submit" 
                        className="bg-pink-500 text-white hover:bg-pink-600"
                        isDisabled={!selectedPreference}
                      >
                        Continue to Review
                      </Button>
                    </div>
                  </div>
                </Form>
                </ScrollShadow>
              </CardBody>
            </Card>
          </div>
        );
      case 1: // Review
        return (
          <div className="flex justify-center w-full">
            <Card className="w-full max-w-[500px] h-[420px] flex flex-col">
              <CardBody className="px-4 flex-1 overflow-hidden p-0">
                <ScrollShadow className="h-full px-4 py-4" size={100}>
                  <h2 className="text-2xl font-semibold mb-4">Review Your Profile</h2>
                  <p className="text-default-600 mb-6">
                    Review all the information you've entered before publishing your profile.
                  </p>

                  <div className="space-y-6">
                    {/* Hobbies/Tags Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Hobbies & Interests</h3>
                      <div className="flex gap-2 mb-3">
                        <Input
                          placeholder="Add a tag (e.g., #vegan, #geek)"
                          value={tagInput}
                          onValueChange={setTagInput}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addTag();
                            }
                          }}
                          variant="bordered"
                          className="flex-1"
                        />
                        <Button onPress={addTag} variant="flat" isDisabled={tags.length >= 5 || !tagInput.trim()}>
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <Chip
                            key={tag}
                            onClose={() => removeTag(tag)}
                            variant="flat"
                            color="primary"
                          >
                            {tag}
                          </Chip>
                        ))}
                      </div>
                    </div>

                    {/* Big Five Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Big Five Personality Traits</h3>
                      <div className="space-y-3">
                        <Select
                          label="Openness"
                          placeholder="Select openness level"
                          selectedKeys={bigFive.openness ? [bigFive.openness] : []}
                          onSelectionChange={(keys) => {
                            const value = Array.from(keys)[0] as string;
                            setBigFive({ ...bigFive, openness: value });
                          }}
                          variant="bordered"
                        >
                          <SelectItem key="low">Low</SelectItem>
                          <SelectItem key="medium">Medium</SelectItem>
                          <SelectItem key="high">High</SelectItem>
                        </Select>
                        <Select
                          label="Conscientiousness"
                          placeholder="Select conscientiousness level"
                          selectedKeys={bigFive.conscientiousness ? [bigFive.conscientiousness] : []}
                          onSelectionChange={(keys) => {
                            const value = Array.from(keys)[0] as string;
                            setBigFive({ ...bigFive, conscientiousness: value });
                          }}
                          variant="bordered"
                        >
                          <SelectItem key="low">Low</SelectItem>
                          <SelectItem key="medium">Medium</SelectItem>
                          <SelectItem key="high">High</SelectItem>
                        </Select>
                        <Select
                          label="Extraversion"
                          placeholder="Select extraversion level"
                          selectedKeys={bigFive.extraversion ? [bigFive.extraversion] : []}
                          onSelectionChange={(keys) => {
                            const value = Array.from(keys)[0] as string;
                            setBigFive({ ...bigFive, extraversion: value });
                          }}
                          variant="bordered"
                        >
                          <SelectItem key="low">Low</SelectItem>
                          <SelectItem key="medium">Medium</SelectItem>
                          <SelectItem key="high">High</SelectItem>
                        </Select>
                        <Select
                          label="Agreeableness"
                          placeholder="Select agreeableness level"
                          selectedKeys={bigFive.agreeableness ? [bigFive.agreeableness] : []}
                          onSelectionChange={(keys) => {
                            const value = Array.from(keys)[0] as string;
                            setBigFive({ ...bigFive, agreeableness: value });
                          }}
                          variant="bordered"
                        >
                          <SelectItem key="low">Low</SelectItem>
                          <SelectItem key="medium">Medium</SelectItem>
                          <SelectItem key="high">High</SelectItem>
                        </Select>
                        <Select
                          label="Neuroticism"
                          placeholder="Select neuroticism level"
                          selectedKeys={bigFive.neuroticism ? [bigFive.neuroticism] : []}
                          onSelectionChange={(keys) => {
                            const value = Array.from(keys)[0] as string;
                            setBigFive({ ...bigFive, neuroticism: value });
                          }}
                          variant="bordered"
                        >
                          <SelectItem key="low">Low</SelectItem>
                          <SelectItem key="medium">Medium</SelectItem>
                          <SelectItem key="high">High</SelectItem>
                        </Select>
                      </div>
                    </div>

                    {/* Siblings Section */}
                    <div>
                      <Select
                        label="Siblings"
                        placeholder="Select your sibling position"
                        selectedKeys={siblings ? [siblings] : []}
                        onSelectionChange={(keys) => {
                          const value = Array.from(keys)[0] as string;
                          setSiblings(value);
                        }}
                        variant="bordered"
                      >
                        <SelectItem key="middle_child">Middle child</SelectItem>
                        <SelectItem key="slightly_older_siblings">Slightly older siblings</SelectItem>
                        <SelectItem key="oldest_child">I'm the oldest child</SelectItem>
                        <SelectItem key="youngest_child">I'm the youngest child</SelectItem>
                        <SelectItem key="only_child">Only child</SelectItem>
                        <SelectItem key="twin">Twin</SelectItem>
                      </Select>
                    </div>

                    {/* MBTI Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">MBTI (Myers-Briggs Type Indicator)</h3>
                      <Select
                        label="MBTI Type"
                        placeholder="Select your MBTI type"
                        selectedKeys={mbti ? [mbti] : []}
                        onSelectionChange={(keys) => {
                          const value = Array.from(keys)[0] as string;
                          setMbti(value);
                        }}
                        variant="bordered"
                      >
                        <SelectItem key="INTJ">INTJ - Architect</SelectItem>
                        <SelectItem key="INTP">INTP - Thinker</SelectItem>
                        <SelectItem key="ENTJ">ENTJ - Commander</SelectItem>
                        <SelectItem key="ENTP">ENTP - Debater</SelectItem>
                        <SelectItem key="INFJ">INFJ - Advocate</SelectItem>
                        <SelectItem key="INFP">INFP - Mediator</SelectItem>
                        <SelectItem key="ENFJ">ENFJ - Protagonist</SelectItem>
                        <SelectItem key="ENFP">ENFP - Campaigner</SelectItem>
                        <SelectItem key="ISTJ">ISTJ - Logistician</SelectItem>
                        <SelectItem key="ISFJ">ISFJ - Protector</SelectItem>
                        <SelectItem key="ESTJ">ESTJ - Executive</SelectItem>
                        <SelectItem key="ESFJ">ESFJ - Consul</SelectItem>
                        <SelectItem key="ISTP">ISTP - Virtuoso</SelectItem>
                        <SelectItem key="ISFP">ISFP - Adventurer</SelectItem>
                        <SelectItem key="ESTP">ESTP - Entrepreneur</SelectItem>
                        <SelectItem key="ESFP">ESFP - Entertainer</SelectItem>
                      </Select>
                    </div>

                    {/* Caliper Profile Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Caliper Profile</h3>
                      <Select
                        label="Caliper Profile"
                        placeholder="Select your Caliper profile"
                        selectedKeys={caliper ? [caliper] : []}
                        onSelectionChange={(keys) => {
                          const value = Array.from(keys)[0] as string;
                          setCaliper(value);
                        }}
                        variant="bordered"
                      >
                        <SelectItem key="analytical">Analytical</SelectItem>
                        <SelectItem key="conceptual">Conceptual</SelectItem>
                        <SelectItem key="social">Social</SelectItem>
                        <SelectItem key="structured">Structured</SelectItem>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="bordered"
                      className="flex-1"
                      onPress={() => setCurrentStep(0)}
                    >
                      Back
                    </Button>
                    <Button
                      className="flex-1 bg-pink-500 text-white hover:bg-pink-600"
                      onPress={() => setCurrentStep(2)}
                    >
                      Continue to Publish
                    </Button>
                  </div>
                </ScrollShadow>
              </CardBody>
            </Card>
          </div>
        );
      case 2: // Publish
        return (
          <div className="flex justify-center w-full">
            <Card className="w-full max-w-[500px] h-[420px] flex flex-col">
              <CardBody className="px-4 flex-1 overflow-hidden p-0">
                <ScrollShadow className="h-full px-4 py-4" size={100}>
                  <h2 className="text-2xl font-semibold mb-4">Publish Your Profile</h2>
                  <p className="text-default-600 mb-6">
                    You're all set! Upload your photos and publish your profile to start matching with other users.
                  </p>

                  <div className="space-y-6">
                    {/* 5 photo slots: first = profile picture, then 4 more */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Upload Photos</h3>
                      <p className="text-sm text-default-500 mb-4">
                        First card is your profile picture. Add up to 5 photos by clicking each card. At least one required.
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[0, 1, 2, 3, 4].map((index) => {
                          const file = pictureSlots[index];
                          const previewUrl = previewUrls[index] ?? null;
                          return (
                            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-default-200 bg-default-100">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id={`picture-upload-${index}`}
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) setPictureSlot(index, f);
                                  e.target.value = "";
                                }}
                              />
                              <button
                                type="button"
                                className="absolute inset-0 w-full h-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
                                onClick={() => document.getElementById(`picture-upload-${index}`)?.click()}
                              >
                                {file && previewUrl ? (
                                  <>
                                    <Image
                                      alt={index === 0 ? "Profile" : `Photo ${index + 1}`}
                                      src={previewUrl}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <Icon icon="solar:camera-add-linear" className="text-2xl text-white" />
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex flex-col items-center justify-center text-default-400">
                                    <Icon icon="solar:gallery-add-linear" className="text-3xl mb-1" />
                                    <span className="text-xs">Click to upload</span>
                                  </div>
                                )}
                              </button>
                              {index === 0 && (
                                <div className="absolute top-1 left-1 bg-primary text-white text-xs px-2 py-0.5 rounded">
                                  Profile
                                </div>
                              )}
                              {file && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPictureSlot(index, null);
                                  }}
                                  className="absolute top-1 right-1 bg-danger text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-danger-600"
                                  aria-label="Remove photo"
                                >
                                  ×
                                </button>
                              )}
                              <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                                {index + 1}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-6">
                    <div className="flex gap-3">
                      <Button
                        variant="bordered"
                        className="flex-1"
                        onPress={() => setCurrentStep(1)}
                      >
                        Back
                      </Button>
                      <Button
                        className="flex-1 bg-pink-500 text-white hover:bg-pink-600"
                        onPress={handleFinalStep}
                        isLoading={loading}
isDisabled={!hasAtLeastOnePhoto}
                      title={!hasAtLeastOnePhoto ? "Add at least one photo to continue" : undefined}
                      >
                        Who will I find on Matcha?
                      </Button>
                    </div>
                    {!hasAtLeastOnePhoto && (
                      <p className="text-sm text-warning text-center">
                        Add at least one photo (e.g. profile picture in the first card) to publish.
                      </p>
                    )}
                  </div>
                </ScrollShadow>
              </CardBody>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  if (!showStepper) {
    return (
      <ProtectedRoute requireAuth={true}>
        <div className="flex h-full w-full items-center justify-center min-h-screen">
          <div className="rounded-large flex w-full max-w-2xl flex-col gap-6 px-8 pt-6 pb-10">
            <div className="text-center mb-6">
              <h1 className="text-4xl font-semibold mb-2">Welcome to Matcha</h1>
              <p className="text-default-500">Let's set up your dating profile</p>
            </div>

            <div className="bg-default-100 p-6 rounded-lg">
              <p className="text-center text-default-600">
                Profile setup form will go here
              </p>
              <p className="text-center text-sm text-default-400 mt-2">
                This is where users will complete their profile according to the project requirements
              </p>
            </div>

            <Button 
              className="w-full bg-pink-500 text-white hover:bg-pink-600"
              onPress={handleCompleteSetup}
            >
              Complete Profile Setup
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[100]">
        <ToastProvider />
      </div>
      <div className="flex h-full w-full items-center justify-center min-h-screen pb-4 md:pb-10">
        <div className="rounded-large flex w-full max-w-4xl flex-col gap-6 px-8 pt-6 pb-[15px]">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-semibold mb-2">Set Up Your Profile</h1>
            <p className="text-default-500">Follow the steps below to complete your profile</p>
          </div>

          <div className="flex justify-center w-full">
            <RowSteps
              currentStep={currentStep}
              defaultStep={0}
              steps={[
                {
                  title: "Create",
                },
                {
                  title: "Review",
                },
                {
                  title: "Publish",
                },
              ]}
              onStepChange={setCurrentStep}
            />
          </div>

          <div className="mt-8">
            {renderStepContent()}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

