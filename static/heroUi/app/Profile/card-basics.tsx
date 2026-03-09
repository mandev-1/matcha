"use client";

import React from "react";
import {
  Button,
  Input,
  TextArea,
  Form,
  RadioGroup,
  Radio,
  TextField,
  Label,
  Description,
} from "@heroui/react";
import { SelectCompat } from "@/components/SelectCompat";
import { SelectItem } from "@/components/SelectItem";
import { Icon } from "@iconify/react";
import clsx from "clsx";

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
  isSendingPasswordResetLink?: boolean;
}

const radioCardClass = clsx(
  "group relative flex-col gap-2 rounded-lg border border-default-200 bg-default-50/50 dark:bg-default-100/30 px-4 py-3 transition-colors",
  "data-[selected=true]:border-primary data-[selected=true]:bg-primary/5",
  "data-[focus-visible=true]:border-primary data-[focus-visible=true]:ring-2 data-[focus-visible=true]:ring-primary/20"
);

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
  isSendingPasswordResetLink = false,
}: CardBasicsProps) {
  const preferenceOptions = [
    { value: "male", title: "Men", description: "Interested in men" },
    { value: "female", title: "Women", description: "Interested in women" },
    { value: "both", title: "Both", description: "Interested in men and women" },
  ];

  const genderOptions = [
    { value: "male", title: "Male", description: "I identify as male" },
    { value: "female", title: "Female", description: "I identify as female" },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full py-6">
        <p className="text-default-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full py-6 pb-20 md:pb-6">
      <Form onSubmit={handleSave} className="flex flex-col gap-8">
        {/* Personal information */}
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-foreground border-b border-default-200 pb-2">
            Personal information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField isRequired name="firstName" value={firstName} onChange={setFirstName}>
              <Label>First name</Label>
              <Input variant="secondary" placeholder="First name" />
            </TextField>
            <TextField isRequired name="lastName" value={lastName} onChange={setLastName}>
              <Label>Last name</Label>
              <Input variant="secondary" placeholder="Last name" />
            </TextField>
          </div>
          <TextField isRequired name="email" type="email" value={email} onChange={setEmail}>
            <Label>Email</Label>
            <Input variant="secondary" placeholder="Email" type="email" />
          </TextField>
        </section>

        {/* Account security */}
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-foreground border-b border-default-200 pb-2">
            Account security
          </h2>
          <TextField name="username" value={user?.username ?? ""} isReadOnly>
            <Label>Username</Label>
            <Input variant="secondary" readOnly />
            <Description>Username cannot be changed</Description>
          </TextField>
          <div className="flex flex-col gap-2">
            <Label>Password</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Input variant="secondary" type="password" value="••••••••" readOnly className="flex-1 min-w-0 max-w-xs" />
              <Button type="button" variant="secondary" size="sm" onPress={onPasswordResetModalOpen} isPending={isSendingPasswordResetLink}>
                Reset password
              </Button>
            </div>
            <Description>We&apos;ll send a link to your email to set a new password</Description>
          </div>
        </section>

        {/* Dating preferences */}
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-foreground border-b border-default-200 pb-2">
            Dating preferences
          </h2>
          <div className="flex flex-col gap-3">
            <Label>I'm looking for</Label>
            <RadioGroup value={selectedPreference} onChange={setSelectedPreference} name="preference" orientation="horizontal" className="gap-3">
              {preferenceOptions.map((option) => (
                <Radio key={option.value} value={option.value} className={radioCardClass}>
                  <Radio.Control className="absolute top-3 right-3 size-4">
                    <Radio.Indicator />
                  </Radio.Control>
                  <Radio.Content className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{option.title}</span>
                    <Description className="text-xs">{option.description}</Description>
                  </Radio.Content>
                </Radio>
              ))}
            </RadioGroup>
          </div>
          <div className="flex flex-col gap-3">
            <Label>My gender</Label>
            <RadioGroup value={selectedGender} onChange={setSelectedGender} name="gender" orientation="horizontal" className="gap-3">
              {genderOptions.map((option) => (
                <Radio key={option.value} value={option.value} className={radioCardClass}>
                  <Radio.Control className="absolute top-3 right-3 size-4">
                    <Radio.Indicator />
                  </Radio.Control>
                  <Radio.Content className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{option.title}</span>
                    <Description className="text-xs">{option.description}</Description>
                  </Radio.Content>
                </Radio>
              ))}
            </RadioGroup>
          </div>
        </section>

        {/* Bio */}
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-foreground border-b border-default-200 pb-2">
            Bio
          </h2>
          <TextField value={bio} onChange={setBio}>
            <Label>About you</Label>
            <TextArea
              maxLength={250}
              variant="secondary"
              placeholder="Short biography: where you're at in life, what matters to you..."
              className="min-h-[120px]"
            />
            <Description>Max 250 characters. {bio.length}/250</Description>
          </TextField>
        </section>

        {/* Tags */}
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-foreground border-b border-default-200 pb-2">
            Interests
          </h2>
          <div className="flex flex-col gap-2">
            <Label>Tags (max 5)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. #hiking #music"
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
              <Button type="button" onPress={addTag} variant="secondary" isDisabled={tags.length >= 5 || !tagInput.trim()}>
                Add
              </Button>
            </div>
            {tags.length >= 5 && (
              <Description className="text-warning">Maximum of 5 tags.</Description>
            )}
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-md border border-default-200 bg-default-100 px-2.5 py-1 text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="opacity-70 hover:opacity-100 rounded p-0.5 -mr-0.5"
                    aria-label={`Remove ${tag}`}
                  >
                    <Icon icon="solar:close-circle-linear" className="text-base" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Personality (optional) */}
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-foreground border-b border-default-200 pb-2">
            Personality (optional)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectCompat
              label="Siblings"
              placeholder="Select"
              selectedKeys={siblings ? [siblings] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;
                setSiblings(value ?? "");
              }}
            >
              <SelectItem key="only_child">Only child</SelectItem>
              <SelectItem key="oldest_child">Oldest</SelectItem>
              <SelectItem key="youngest_child">Youngest</SelectItem>
              <SelectItem key="middle_child">Middle</SelectItem>
              <SelectItem key="slightly_older_siblings">Slightly older siblings</SelectItem>
              <SelectItem key="twin">Twin</SelectItem>
            </SelectCompat>
            <SelectCompat
              label="MBTI"
              placeholder="Select type"
              selectedKeys={mbti ? [mbti] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;
                setMbti(value ?? "");
              }}
            >
              <SelectItem key="INTJ">INTJ</SelectItem>
              <SelectItem key="INTP">INTP</SelectItem>
              <SelectItem key="ENTJ">ENTJ</SelectItem>
              <SelectItem key="ENTP">ENTP</SelectItem>
              <SelectItem key="INFJ">INFJ</SelectItem>
              <SelectItem key="INFP">INFP</SelectItem>
              <SelectItem key="ENFJ">ENFJ</SelectItem>
              <SelectItem key="ENFP">ENFP</SelectItem>
              <SelectItem key="ISTJ">ISTJ</SelectItem>
              <SelectItem key="ISFJ">ISFJ</SelectItem>
              <SelectItem key="ESTJ">ESTJ</SelectItem>
              <SelectItem key="ESFJ">ESFJ</SelectItem>
              <SelectItem key="ISTP">ISTP</SelectItem>
              <SelectItem key="ISFP">ISFP</SelectItem>
              <SelectItem key="ESTP">ESTP</SelectItem>
              <SelectItem key="ESFP">ESFP</SelectItem>
            </SelectCompat>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"] as const).map((trait) => (
              <SelectCompat
                key={trait}
                label={trait.charAt(0).toUpperCase() + trait.slice(1)}
                placeholder="Select"
                selectedKeys={bigFive[trait] ? [bigFive[trait]] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  setBigFive({ ...bigFive, [trait]: value ?? "" });
                }}
              >
                <SelectItem key="low">Low</SelectItem>
                <SelectItem key="medium">Medium</SelectItem>
                <SelectItem key="high">High</SelectItem>
              </SelectCompat>
            ))}
          </div>
          <SelectCompat
            label="Caliper profile"
            placeholder="Select"
            selectedKeys={caliper ? [caliper] : []}
            onSelectionChange={(keys) => {
              const value = Array.from(keys)[0] as string;
              setCaliper(value ?? "");
            }}
          >
            <SelectItem key="analytical">Analytical</SelectItem>
            <SelectItem key="conceptual">Conceptual</SelectItem>
            <SelectItem key="social">Social</SelectItem>
            <SelectItem key="structured">Structured</SelectItem>
          </SelectCompat>
        </section>

        {/* Actions */}
        <section className="flex flex-wrap items-center justify-end gap-3 border-t border-default-200 pt-6">
          <Button type="button" variant="flat" onPress={() => window.history.back()}>
            Cancel
          </Button>
          <Button type="submit" color="primary" isPending={isSaving}>
            Save changes
          </Button>
        </section>
      </Form>
    </div>
  );
}
