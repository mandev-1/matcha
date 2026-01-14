"use client";

import React from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

export default function RunwayPage() {
  return (
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

        <Button className="w-full bg-pink-500 text-white hover:bg-pink-600">
          Complete Profile Setup
        </Button>
      </div>
    </div>
  );
}

