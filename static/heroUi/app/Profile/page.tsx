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
import { RadioGroup, useRadio } from "@heroui/radio";
import { VisuallyHidden } from "@react-aria/visually-hidden";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Spacer } from "@heroui/spacer";
import { Divider } from "@heroui/divider";
import clsx from "clsx";
import { useAuth } from "@/contexts/AuthContext";

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

  const isPink = props.value === "female";

  return (
    <Component
      {...getBaseProps({
        className: clsx(
          "group inline-flex items-center hover:opacity-70 active:opacity-50 justify-between flex-row-reverse tap-highlight-transparent m-0",
          "cursor-pointer border-2 border-default rounded-lg gap-4 p-4",
          isPink 
            ? "data-[selected=true]:border-pink-500" 
            : "data-[selected=true]:border-primary",
          props.className,
        ),
      })}
    >
      <VisuallyHidden>
        <input {...getInputProps()} />
      </VisuallyHidden>
      <span {...getWrapperProps({
        className: clsx(
          isPink 
            ? "[&>span[data-selected=true]]:!bg-pink-500 [&>span[data-selected=true]]:!border-pink-500" 
            : "",
        ),
      })}>
        <span 
          {...getControlProps({
            className: clsx(
              isPink 
                ? "data-[selected=true]:!bg-pink-500 data-[selected=true]:!border-pink-500" 
                : "",
            ),
            style: isPink ? {
              "--heroui-primary": "#ec4899",
              "--heroui-primary-foreground": "#ffffff",
            } as React.CSSProperties : undefined,
          })} 
        />
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

export default function Component() {
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  const {isOpen: isResetModalOpen, onOpen: onResetModalOpen, onOpenChange: onResetModalOpenChange} = useDisclosure();
  const { user, logout } = useAuth();
  const [selectedTab, setSelectedTab] = React.useState<string>("basics");
  const [isResetting, setIsResetting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  
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

  // Load profile data
  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/profile", {
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
            setSelectedPreference(profile.sexual_preference || "");
            setBio(profile.biography || "");
            setTags(profile.tags || []);
            
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
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
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
      const response = await fetch("/api/profile", {
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
          tags: tags,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update profile");
      }

      alert("Profile updated successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async (onClose: () => void) => {
    setIsResetting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/profile/reset", {
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

      <div className="flex h-dvh w-full max-w-full flex-col gap-8">
        <div className="flex items-center justify-center gap-2">
          <Tabs 
            className="flex-1 justify-center"
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as string)}
          >
            <Tab key="basics" title="Basics" />
            <Tab key="settings" title="Settings" />
          </Tabs>
          <Button className="justify-center" size="sm" variant="flat" onPress={onOpen}>
            Help
          </Button>
        </div>
        {selectedTab === "basics" && (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full px-4">
            {isLoading ? (
              <p className="text-default-500">Loading profile...</p>
            ) : (
              <Form onSubmit={handleSave} className="flex flex-col gap-6">



                <div className="max-w-[900px] gap-2 grid grid-cols-12 grid-rows-2 px-8">
                                    {/* Basic Information */}

                <Card isFooterBlurred className="w-full h-[300px] col-span-12 sm:col-span-7">
                  <CardHeader>
                    <h3 className="text-xl font-semibold">Basic Information</h3>
                  </CardHeader>
                  <CardBody className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        isRequired
                        label="First Name"
                        labelPlacement="outside"
                        value={firstName}
                        onValueChange={setFirstName}
                        variant="bordered"
                      />
                      <Input
                        isRequired
                        label="Last Name"
                        labelPlacement="outside"
                        value={lastName}
                        onValueChange={setLastName}
                        variant="bordered"
                      />
                    </div>
                    <Input
                      isRequired
                      label="Email"
                      labelPlacement="outside"
                      type="email"
                      value={email}
                      onValueChange={setEmail}
                      variant="bordered"
                    />
                  </CardBody>
        <CardFooter className="absolute bg-black/40 bottom-0 z-10 border-t-1 border-default-600 dark:border-default-100">
          <div className="flex grow gap-2 items-center">
            <Image
              alt="Breathing app icon"
              className="rounded-full w-10 h-11 bg-black"
              src="https://heroui.com/images/breathing-app-icon.jpeg"
            />
            <div className="flex flex-col">
              <p className="text-tiny text-white/60">Tinder Garden</p>
              <p className="text-tiny text-white/60">Want a young wife (guaranteed)? Book in advance!</p>
            </div>
          </div>
          <Button radius="full" size="sm">
            Try now
          </Button>
        </CardFooter>
      </Card>

                      {/* Sexual Preference */}
                      <Card className="col-span-12 sm:col-span-4 h-[300px]">
                      <CardHeader>
                    <h3 className="text-xl font-semibold">What I want:</h3>
                  </CardHeader>
                  <CardBody>
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
                          I will be shown people who identify as male. These people vouched for being responsible and respectful.
                        </div>
                      </Tab>
                      <Tab key="female" title="Female">
                        <div className="p-4">
                          I will be shown females only. (Nice)
                        </div>
                      </Tab>
                    </Tabs>
                  </CardBody>
                </Card>

      <Card className="col-span-12 sm:col-span-4 h-[300px]">
        <CardHeader className=" z-10 top-1 flex-col items-start!">
                    <h3 className="text-xl font-semibold">My Gender</h3>
                  </CardHeader>
                  <CardBody>
                    <RadioGroup
                      value={selectedGender}
                      onValueChange={setSelectedGender}
                      orientation="horizontal"
                      className="flex flex-row gap-3 w-full [&>div[data-value=female]>div>span>span[data-selected=true]]:!bg-pink-500 [&>div[data-value=female]>div>span>span[data-selected=true]]:!border-pink-500"
                    >
                      <CustomRadio className="flex-1 w-1/2" value="male" description="Lorem Ipsum dolor sit amet">
                        I'm a guy / boy
                      </CustomRadio>
                      <CustomRadio className="flex-1 w-1/2" value="female" description="I identify as Female">
                        Female gender (no penis)
                      </CustomRadio>
                    </RadioGroup>
                  </CardBody>
      </Card>
                      {/* Siblings */}
                      <Card className="col-span-12 sm:col-span-4 h-[300px]">
                  <CardHeader>
                    <h3 className="text-xl font-semibold">Siblings</h3>
                  </CardHeader>
                  <CardBody>
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
                  </CardBody>
                </Card>
                      {/* Big Five Personality Traits */}
                      <Card className="col-span-12 sm:col-span-4 h-[300px]">
                      <CardHeader>
                    <h3 className="text-xl font-semibold">Big Five Personality Traits</h3>
                  </CardHeader>
                  <CardBody className="flex flex-col gap-4">
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
                  </CardBody>
                </Card>
      <Card isFooterBlurred className="w-full h-[300px] col-span-12 sm:col-span-5">
        <CardHeader className="absolute z-10 top-1 flex-col items-start">
          <p className="text-tiny text-white/60 uppercase font-bold">New</p>
          <h4 className="text-black font-medium text-2xl">Acme camera</h4>
        </CardHeader>
        <Image
          removeWrapper
          alt="Card example background"
          className="z-0 w-full h-full scale-125 -translate-y-6 object-cover"
          src="https://heroui.com/images/card-example-6.jpeg"
        />
        <CardFooter className="absolute bg-white/30 bottom-0 border-t-1 border-zinc-100/50 z-10 justify-between">
          <div>
            <p className="text-black text-tiny">Available soon.</p>
            <p className="text-black text-tiny">Get notified.</p>
          </div>
          <Button className="text-tiny" color="primary" radius="full" size="sm">
            Notify Me
          </Button>
        </CardFooter>
      </Card>

                {/* Bio */}
                <Card isFooterBlurred className="w-full h-[300px] col-span-12 sm:col-span-12">
                <CardHeader>
                    <div className="flex flex-col items-start">
                      <h3 className="text-xl font-semibold">Bio</h3>
                      <p className="text-small text-default-500">
                        Write a short biography of your situation right now, what stage of life you are entering, where are you coming from and what is important and filling for you right now
                      </p>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <Textarea
                      isClearable
                      label="Bio"
                      maxLength={250}
                      value={bio}
                      variant="bordered"
                      onValueChange={setBio}
                      onClear={() => setBio("")}
                    />
                    <p className="text-small text-default-400 mt-2">
                      Max. 250 characters. <span className="text-default-500">{bio.length}/250</span>
                    </p>
                  </CardBody>
                </Card>
    </div>





                {/* Hobbies & Interests */}
                <Card>
                  <CardHeader>
                    <h3 className="text-xl font-semibold">Hobbies & Interests</h3>
                  </CardHeader>
                  <CardBody className="flex flex-col gap-4">
                    <div className="flex gap-2">
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
                      <Button onPress={addTag} variant="flat">Add</Button>
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
                  </CardBody>
                </Card>





                {/* MBTI */}
                <Card>
                  <CardHeader>
                    <h3 className="text-xl font-semibold">MBTI (Myers-Briggs Type Indicator)</h3>
                  </CardHeader>
                  <CardBody>
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
                  </CardBody>
                </Card>

                {/* Caliper Profile */}
                <Card>
                  <CardHeader>
                    <h3 className="text-xl font-semibold">Caliper Profile</h3>
                  </CardHeader>
                  <CardBody>
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
                  </CardBody>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end gap-4 pb-8">
                  <Button type="button" variant="bordered" onPress={() => window.location.reload()}>
                    Cancel
                  </Button>
                  <Button type="submit" color="primary" isLoading={isSaving} className="bg-pink-500 text-white hover:bg-pink-600">
                    Save Changes
                  </Button>
                </div>
              </Form>
            )}
          </div>
        )}
        
        {selectedTab === "settings" && (
          <div className="flex justify-center items-center">
            <Card isFooterBlurred className="border-none" radius="lg">
              <Image
                alt="Woman listing to music"
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
                      <span className="text-medium font-medium">About the event</span>
                      <div className="text-medium text-default-500 flex flex-col gap-2">
                        <p>
                          Hey Bay Area! We are excited to announce our next meetup on Tuesday,
                          November 19th.
                        </p>
                        <p>
                          Join us for an evening of insightful discussions and hands-on workshops
                          focused on the latest developments in web development and design. Our
                          featured speakers will share their experiences with modern frontend
                          frameworks, responsive design patterns, and emerging web technologies.
                          You&apos;ll have the opportunity to network with fellow developers and
                          designers while enjoying refreshments and snacks.
                        </p>
                        <p>
                          During the main session, we&apos;ll dive deep into practical examples of
                          building scalable applications, exploring best practices for component
                          architecture, and understanding advanced state management techniques. Our
                          interactive workshop portion will let you apply these concepts directly,
                          with experienced mentors available to provide guidance and answer your
                          questions. Whether you&apos;re a seasoned developer or just starting your
                          journey, you&apos;ll find valuable takeaways from this session.
                        </p>

                        <p className="mt-4">
                          Brought to you by the{" "}
                          <Link className="text-default-700" href="https://heroui.com">
                            HeroUI team
                          </Link>
                          .
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col mt-4 gap-3 items-start">
                      <span className="text-small text-default-500">Hosted By</span>
                      <div className="flex gap-2 items-center">
                        <Avatar
                          name="HeroUI"
                          size="sm"
                          src="https://heroui.com/android-chrome-192x192.png"
                        />
                        <span className="text-small text-default-500">HeroUI Team</span>
                      </div>
                    </div>
                    <div className="flex flex-col mt-4 gap-3 items-start">
                      <span className="text-small text-default-500">105 Going</span>
                      <div className="flex gap-2 items-center">
                        <AvatarGroup
                          isBordered
                          classNames={{
                            base: "pl-2",
                            count: "text-default-500 text-tiny bg-default-100",
                          }}
                          size="sm"
                          total={101}
                        >
                          <Tooltip content="Alex">
                            <Avatar
                              className="data-[hover=true]:translate-x-0!"
                              name="Alex"
                              src="https://i.pravatar.cc/150?u=a04258114e29026708c"
                            />
                          </Tooltip>
                          <Tooltip content="Joe">
                            <Avatar
                              className="data-[hover=true]:translate-x-0!"
                              name="Joe"
                              src="https://i.pravatar.cc/150?u=a04258114e290267084"
                            />
                          </Tooltip>
                          <Tooltip content="John">
                            <Avatar
                              className="data-[hover=true]:translate-x-0!"
                              name="John"
                              src="https://i.pravatar.cc/150?u=a04258a2462d826712d"
                            />
                          </Tooltip>
                          <Tooltip content="Jane">
                            <Avatar
                              className="data-[hover=true]:translate-x-0!"
                              name="Jane"
                              src="https://i.pravatar.cc/150?u=a04258114e29026702d"
                            />
                          </Tooltip>
                        </AvatarGroup>
                      </div>
                    </div>
                  </div>
                </div>
              </DrawerBody>
              <DrawerFooter className="flex flex-col gap-1">
                <Link className="text-default-400" href="mailto:hello@heroui.com" size="sm">
                  Contact the host
                </Link>
                <Link className="text-default-400" href="mailto:hello@heroui.com" size="sm">
                  Report event
                </Link>
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
    </>
  );
}

