"use client";

import React from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Form } from "@heroui/form";
import { RadioGroup } from "@heroui/radio";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Tabs, Tab } from "@heroui/tabs";
import { Slider } from "@heroui/slider";
import { Image } from "@heroui/image";
import { Icon } from "@iconify/react";
import { addToast } from "@heroui/toast";
import CustomRadio from "./CustomRadio";

interface CardBasicsProps {
  isLoading: boolean;
  isSaving: boolean;
  firstName: string;
  lastName: string;
  email: string;
  user: { username?: string } | null;
  selectedGender: string;
  selectedPreference: string;
  bio: string;
  tags: string[];
  tagInput: string;
  siblings: string;
  bigFive: {
    openness: string;
    conscientiousness: string;
    extraversion: string;
    agreeableness: string;
    neuroticism: string;
  };
  mbti: string;
  caliper: string;
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
  setEmail: (value: string) => void;
  setSelectedGender: (value: string) => void;
  setSelectedPreference: (value: string) => void;
  setBio: (value: string) => void;
  setTagInput: (value: string) => void;
  setSiblings: (value: string) => void;
  setBigFive: (value: {
    openness: string;
    conscientiousness: string;
    extraversion: string;
    agreeableness: string;
    neuroticism: string;
  }) => void;
  setMbti: (value: string) => void;
  setCaliper: (value: string) => void;
  addTag: () => void;
  removeTag: (tag: string) => void;
  handleSave: (e: React.FormEvent) => void;
  onPasswordResetModalOpen: () => void;
}

export default function CardBasics({
  isLoading,
  isSaving,
  firstName,
  lastName,
  email,
  user,
  selectedGender,
  selectedPreference,
  bio,
  tags,
  tagInput,
  siblings,
  bigFive,
  mbti,
  caliper,
  setFirstName,
  setLastName,
  setEmail,
  setSelectedGender,
  setSelectedPreference,
  setBio,
  setTagInput,
  setSiblings,
  setBigFive,
  setMbti,
  setCaliper,
  addTag,
  removeTag,
  handleSave,
  onPasswordResetModalOpen,
}: CardBasicsProps) {
  // Convert preference string to slider values
  const getSliderValues = (pref: string): { male: number; female: number } => {
    if (pref === "male") return { male: 100, female: 0 };
    if (pref === "female") return { male: 0, female: 100 };
    if (pref === "both") return { male: 100, female: 100 };
    // Default to both (bisexuality) if nothing selected
    return { male: 100, female: 100 };
  };

  // Initialize slider values from preference
  const [preferMale, setPreferMale] = React.useState<number>(() => getSliderValues(selectedPreference).male);
  const [preferFemale, setPreferFemale] = React.useState<number>(() => getSliderValues(selectedPreference).female);

  // Update sliders when preference changes externally (e.g., from server)
  React.useEffect(() => {
    const values = getSliderValues(selectedPreference);
    setPreferMale(values.male);
    setPreferFemale(values.female);
  }, [selectedPreference]);

  // Update preference string when sliders change
  const updatePreference = React.useCallback((male: number, female: number) => {
    const maleSelected = male > 0;
    const femaleSelected = female > 0;
    let newPreference: string;
    if (maleSelected && femaleSelected) {
      newPreference = "both";
    } else if (maleSelected) {
      newPreference = "male";
    } else if (femaleSelected) {
      newPreference = "female";
    } else {
      newPreference = "both"; // Default to both if nothing selected
    }
    setSelectedPreference(newPreference);
  }, [setSelectedPreference]);

  const handleMaleSliderChange = (value: number | number[]) => {
    const newValue = Array.isArray(value) ? value[0] : value;
    setPreferMale(newValue);
    updatePreference(newValue, preferFemale);
  };

  const handleFemaleSliderChange = (value: number | number[]) => {
    const newValue = Array.isArray(value) ? value[0] : value;
    setPreferFemale(newValue);
    updatePreference(preferMale, newValue);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full px-4">
        <p className="text-default-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full px-4">
      <Form onSubmit={handleSave} className="flex flex-col gap-6">
        <div className="max-w-[900px] gap-2 grid grid-cols-12 grid-rows-2 px-8">
          {/* Basic Information */}
          <Card isFooterBlurred className="w-full h-[300px] col-span-12 sm:col-span-7">
            <CardHeader>
              <h3 className="text-xl font-semibold text-sky-300">Basic Information</h3>
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

          {/* Account Security */}
          <Card className="w-full h-[300px] col-span-12 sm:col-span-5">
            <CardHeader>
              <h3 className="text-xl font-semibold text-sky-300">Account Security</h3>
            </CardHeader>
            <CardBody className="flex flex-col gap-4">
              <Input
                label="Username"
                labelPlacement="outside"
                value={user?.username || ""}
                variant="bordered"
                isReadOnly
                description="Your username cannot be changed"
              />
              <Input
                label="Password"
                labelPlacement="outside"
                type="password"
                value="••••••••"
                variant="bordered"
                isReadOnly
                description="Click below to reset your password"
                endContent={
                  <Icon icon="solar:lock-password-linear" className="text-2xl text-default-400 pointer-events-none shrink-0" />
                }
              />
            </CardBody>
            <CardFooter className="justify-end">
              <Button 
                color="primary" 
                variant="flat"
                onPress={onPasswordResetModalOpen}
              >
                Reset Password
              </Button>
            </CardFooter>
          </Card>

          {/* Sexual Preference */}
          <Card className="col-span-12 sm:col-span-4 min-h-[300px]">
            <CardHeader>
              <h3 className="text-xl font-semibold text-sky-300">What I want:</h3>
            </CardHeader>
            <CardBody className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Male</span>
                  <span className="text-xs text-default-500">{preferMale > 0 ? "Interested" : "Not interested"}</span>
                </div>
                <Slider
                  aria-label="Interest in males"
                  value={preferMale}
                  onChange={handleMaleSliderChange}
                  minValue={0}
                  maxValue={100}
                  step={1}
                  className="w-full"
                  classNames={{
                    track: "border-s-default-200",
                    filler: "bg-sky-500",
                  }}
                />
                {preferMale > 0 && (
                  <p className="text-xs text-default-500 mt-1">
                    I will be shown people who identify as male. These people vouched for being responsible and respectful.
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Female</span>
                  <span className="text-xs text-default-500">{preferFemale > 0 ? "Interested" : "Not interested"}</span>
                </div>
                <Slider
                  aria-label="Interest in females"
                  value={preferFemale}
                  onChange={handleFemaleSliderChange}
                  minValue={0}
                  maxValue={100}
                  step={1}
                  className="w-full"
                  classNames={{
                    track: "border-s-default-200",
                    filler: "bg-sky-500",
                  }}
                />
                {preferFemale > 0 && (
                  <p className="text-xs text-default-500 mt-1">
                    I will be shown females only. (Nice)
                  </p>
                )}
              </div>
              {selectedPreference === "both" && (
                <div className="bg-sky-50 dark:bg-sky-950/20 p-3 rounded-lg border border-sky-200 dark:border-sky-800">
                  <p className="text-xs text-sky-700 dark:text-sky-300">
                    🚲 You're interested in both - you're bisexual!
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* My Gender */}
          <Card className="col-span-12 sm:col-span-4 h-[300px]">
            <CardHeader className=" z-10 top-1 flex-col items-start!">
              <h3 className="text-xl font-semibold text-sky-300">My Gender</h3>
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
              <h3 className="text-xl font-semibold text-sky-300">Siblings</h3>
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
          <Card className="col-span-12 sm:col-span-8 h-[300px]">
            <CardHeader>
              <h3 className="text-xl font-semibold text-sky-300">Big Five Personality Traits</h3>
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

          {/* Caliper Profile */}
          <Card className="col-span-12 sm:col-span-4 h-[300px]">
            <CardHeader>
              <h3 className="text-xl font-semibold text-sky-300">Caliper Profile</h3>
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

          {/* Bio */}
          <Card isFooterBlurred className="w-full h-[300px] col-span-12 sm:col-span-12">
            <CardHeader>
              <div className="flex flex-col items-start">
                <h3 className="text-xl font-semibold text-sky-300">Bio</h3>
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

          {/* Hobbies & Interests */}
          <Card isFooterBlurred className="w-full h-[300px] col-span-7 sm:col-span-7">
            <CardHeader>
              <h3 className="text-xl font-semibold text-sky-300">Hobbies & Interests</h3>
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
                  isDisabled={tags.length >= 5}
                />
                <Button 
                  onPress={addTag} 
                  variant="flat"
                  isDisabled={tags.length >= 5 || !tagInput.trim()}
                >
                  Add
                </Button>
              </div>
              {tags.length >= 5 && (
                <p className="text-small text-warning">Maximum of 5 tags reached</p>
              )}
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
          <Card isFooterBlurred className="w-full h-[300px] col-span-5 sm:col-span-5">
            <CardHeader>
              <h3 className="text-xl font-semibold text-sky-300">MBTI (Myers-Briggs Type Indicator)</h3>
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
        </div>

        {/* Save Button */}
        <div className="flex w-full justify-end gap-4 pb-72">
          <Button type="button" variant="bordered" onPress={() => window.location.reload()}>
            Cancel
          </Button>
          <Button type="submit" color="primary" isLoading={isSaving} className="bg-pink-500 text-white hover:bg-pink-600">
            Save Changes
          </Button>
        </div>
      </Form>
    </div>
  );
}

