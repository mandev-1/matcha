"use client";

import React from "react";
import { Card, Button, Input, TextArea, Form, RadioGroup, Chip, Tabs, Tab, Slider, TextField, Label, Description } from "@heroui/react";
import { SelectCompat } from "@/components/SelectCompat";
import { SelectItem } from "@/components/SelectItem";
import { Image } from "@/components/Image";
import { Icon } from "@iconify/react";
import { addToast } from "@/lib/addToast";
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
          <Card className="w-full h-[300px] col-span-12 sm:col-span-7">
            <Card.Header>
              <h3 className="text-xl font-semibold text-sky-300">Basic Information</h3>
            </Card.Header>
            <Card.Content className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField isRequired name="firstName" value={firstName} onChange={setFirstName}>
                  <Label>First Name</Label>
                  <Input variant="secondary" placeholder="First name" />
                </TextField>
                <TextField isRequired name="lastName" value={lastName} onChange={setLastName}>
                  <Label>Last Name</Label>
                  <Input variant="secondary" placeholder="Last name" />
                </TextField>
              </div>
              <TextField isRequired name="email" type="email" value={email} onChange={setEmail}>
                <Label>Email</Label>
                <Input variant="secondary" placeholder="Email" type="email" />
              </TextField>
            </Card.Content>
            <Card.Footer className="absolute bg-black/40 bottom-0 z-10 border-t-1 border-default-600 dark:border-default-100">
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
              <Button size="sm">
                Try now
              </Button>
            </Card.Footer>
          </Card>

          {/* Account Security */}
          <Card className="w-full h-[300px] col-span-12 sm:col-span-5">
            <Card.Header>
              <h3 className="text-xl font-semibold text-sky-300">Account Security</h3>
            </Card.Header>
            <Card.Content className="flex flex-col gap-4">
              <TextField name="username" value={user?.username || ""} isReadOnly>
                <Label>Username</Label>
                <Input variant="secondary" readOnly />
                <Description>Your username cannot be changed</Description>
              </TextField>
              <TextField name="password" value="••••••••" isReadOnly>
                <Label>Password</Label>
                <Input variant="secondary" type="password" readOnly />
                <Description>Click below to reset your password</Description>
              </TextField>
            </Card.Content>
            <Card.Footer className="justify-end">
              <Button 
                
                variant="secondary"
                onPress={onPasswordResetModalOpen}
              >
                Reset Password
              </Button>
            </Card.Footer>
          </Card>

          {/* Sexual Preference */}
          <Card className="col-span-12 sm:col-span-4 min-h-[300px]">
            <Card.Header>
              <h3 className="text-xl font-semibold text-sky-300">What I want:</h3>
            </Card.Header>
            <Card.Content className="flex flex-col gap-4">
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
                >
                  <Slider.Track>
                    <Slider.Fill />
                    <Slider.Thumb />
                  </Slider.Track>
                </Slider>
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
                >
                  <Slider.Track>
                    <Slider.Fill />
                    <Slider.Thumb />
                  </Slider.Track>
                </Slider>
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
            </Card.Content>
          </Card>

          {/* My Gender */}
          <Card className="col-span-12 sm:col-span-4 h-[300px]">
            <Card.Header className=" z-10 top-1 flex-col items-start!">
              <h3 className="text-xl font-semibold text-sky-300">My Gender</h3>
            </Card.Header>
            <Card.Content>
              <RadioGroup
                value={selectedGender}
                onChange={setSelectedGender}
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
            </Card.Content>
          </Card>

          {/* Siblings */}
          <Card className="col-span-12 sm:col-span-4 h-[300px]">
            <Card.Header>
              <h3 className="text-xl font-semibold text-sky-300">Siblings</h3>
            </Card.Header>
            <Card.Content>
              <SelectCompat
                label="Siblings"
                placeholder="Select your sibling position"
                selectedKeys={siblings ? [siblings] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  setSiblings(value);
                }}
              >
                <SelectItem key="middle_child">Middle child</SelectItem>
                <SelectItem key="slightly_older_siblings">Slightly older siblings</SelectItem>
                <SelectItem key="oldest_child">I'm the oldest child</SelectItem>
                <SelectItem key="youngest_child">I'm the youngest child</SelectItem>
                <SelectItem key="only_child">Only child</SelectItem>
                <SelectItem key="twin">Twin</SelectItem>
              </SelectCompat>
            </Card.Content>
          </Card>

          {/* Big Five Personality Traits */}
          <Card className="col-span-12 sm:col-span-8 h-[300px]">
            <Card.Header>
              <h3 className="text-xl font-semibold text-sky-300">Big Five Personality Traits</h3>
            </Card.Header>
            <Card.Content className="flex flex-col gap-4">
              <SelectCompat
                label="Openness"
                placeholder="Select openness level"
                selectedKeys={bigFive.openness ? [bigFive.openness] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  setBigFive({ ...bigFive, openness: value });
                }}
              >
                <SelectItem key="low">Low</SelectItem>
                <SelectItem key="medium">Medium</SelectItem>
                <SelectItem key="high">High</SelectItem>
              </SelectCompat>
              <SelectCompat
                label="Conscientiousness"
                placeholder="Select conscientiousness level"
                selectedKeys={bigFive.conscientiousness ? [bigFive.conscientiousness] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  setBigFive({ ...bigFive, conscientiousness: value });
                }}
              >
                <SelectItem key="low">Low</SelectItem>
                <SelectItem key="medium">Medium</SelectItem>
                <SelectItem key="high">High</SelectItem>
              </SelectCompat>
              <SelectCompat
                label="Extraversion"
                placeholder="Select extraversion level"
                selectedKeys={bigFive.extraversion ? [bigFive.extraversion] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  setBigFive({ ...bigFive, extraversion: value });
                }}
              >
                <SelectItem key="low">Low</SelectItem>
                <SelectItem key="medium">Medium</SelectItem>
                <SelectItem key="high">High</SelectItem>
              </SelectCompat>
              <SelectCompat
                label="Agreeableness"
                placeholder="Select agreeableness level"
                selectedKeys={bigFive.agreeableness ? [bigFive.agreeableness] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  setBigFive({ ...bigFive, agreeableness: value });
                }}
              >
                <SelectItem key="low">Low</SelectItem>
                <SelectItem key="medium">Medium</SelectItem>
                <SelectItem key="high">High</SelectItem>
              </SelectCompat>
              <SelectCompat
                label="Neuroticism"
                placeholder="Select neuroticism level"
                selectedKeys={bigFive.neuroticism ? [bigFive.neuroticism] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  setBigFive({ ...bigFive, neuroticism: value });
                }}
              >
                <SelectItem key="low">Low</SelectItem>
                <SelectItem key="medium">Medium</SelectItem>
                <SelectItem key="high">High</SelectItem>
              </SelectCompat>
            </Card.Content>
          </Card>

          {/* Caliper Profile */}
          <Card className="col-span-12 sm:col-span-4 h-[300px]">
            <Card.Header>
              <h3 className="text-xl font-semibold text-sky-300">Caliper Profile</h3>
            </Card.Header>
            <Card.Content>
              <SelectCompat
                label="Caliper Profile"
                placeholder="Select your Caliper profile"
                selectedKeys={caliper ? [caliper] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  setCaliper(value);
                }}
              >
                <SelectItem key="analytical">Analytical</SelectItem>
                <SelectItem key="conceptual">Conceptual</SelectItem>
                <SelectItem key="social">Social</SelectItem>
                <SelectItem key="structured">Structured</SelectItem>
              </SelectCompat>
            </Card.Content>
          </Card>

          {/* Bio */}
          <Card className="w-full h-[300px] col-span-12 sm:col-span-12">
            <Card.Header>
              <div className="flex flex-col items-start">
                <h3 className="text-xl font-semibold text-sky-300">Bio</h3>
                <p className="text-small text-default-500">
                  Write a short biography of your situation right now, what stage of life you are entering, where are you coming from and what is important and filling for you right now
                </p>
              </div>
            </Card.Header>
            <Card.Content>
              <TextField value={bio} onChange={setBio}>
                <Label>Bio</Label>
                <TextArea
                  maxLength={250}
                  variant="secondary"
                  placeholder="Write your bio..."
                  className="min-h-[100px]"
                />
              </TextField>
              <p className="text-small text-default-400 mt-2">
                Max. 250 characters. <span className="text-default-500">{bio.length}/250</span>
              </p>
            </Card.Content>
          </Card>

          {/* Hobbies & Interests */}
          <Card className="w-full h-[300px] col-span-7 sm:col-span-7">
            <Card.Header>
              <h3 className="text-xl font-semibold text-sky-300">Hobbies & Interests</h3>
            </Card.Header>
            <Card.Content className="flex flex-col gap-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag (e.g., #vegan, #geek)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  variant="secondary"
                  className="flex-1"
                  disabled={tags.length >= 5}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button 
                  onPress={addTag} 
                  variant="secondary"
                  isDisabled={tags.length >= 5 || !tagInput.trim()}
                  className="shrink-0"
                >
                  Add
                </Button>
              </div>
              {tags.length >= 5 && (
                <p className="text-small text-warning">Maximum of 5 tags reached</p>
              )}
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-default-200 bg-default-100 px-3 py-1 text-sm">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="opacity-70 hover:opacity-100 rounded-full p-0.5 -mr-1"
                      aria-label={`Remove ${tag}`}
                    >
                      <Icon icon="solar:close-circle-linear" className="text-lg" />
                    </button>
                  </span>
                ))}
              </div>
            </Card.Content>
          </Card>

          {/* MBTI */}
          <Card className="w-full h-[300px] col-span-5 sm:col-span-5">
            <Card.Header>
              <h3 className="text-xl font-semibold text-sky-300">MBTI (Myers-Briggs Type Indicator)</h3>
            </Card.Header>
            <Card.Content>
              <SelectCompat
                label="MBTI Type"
                placeholder="Select your MBTI type"
                selectedKeys={mbti ? [mbti] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  setMbti(value);
                }}
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
              </SelectCompat>
            </Card.Content>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex w-full justify-end gap-4 pb-72">
          <Button type="button" variant="secondary" onPress={() => window.location.reload()}>
            Cancel
          </Button>
          <Button type="submit" isPending={isSaving} className="bg-pink-500 text-white hover:bg-pink-600">
            Save Changes
          </Button>
        </div>
      </Form>
    </div>
  );
}

