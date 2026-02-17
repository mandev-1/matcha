"use client";

import React, { useState } from "react";
import MarkdownRenderer, { type Heading } from "@/components/MarkdownRenderer";
import ScrollSpy from "@/components/ScrollSpy";

const content = `# Frequently Asked Questions

## General Questions

### What is Matcha?

Matcha is a dating platform designed to help people connect with potential partners. Our platform uses advanced matching algorithms and a unique fame rating system to help you find meaningful connections.

### How do I get started?

1. **Create an account** - Sign up with your email address
2. **Complete your profile** - Add photos, bio, and preferences
3. **Set your location** - Enable location services to find matches nearby
4. **Start browsing** - Use the Discover page to find potential matches

### How does matching work?

Our matching algorithm considers:
- **Location** - Find people near you
- **Age preferences** - Match based on your age range
- **Gender preferences** - Match based on your orientation
- **Common tags** - Connect with people who share your interests
- **Fame rating** - Discover active and engaged users

## Profile & Settings

### How do I upload photos?

1. Go to your Profile page
2. Click on the image slot you want to update
3. Select an image from your device
4. The image will be uploaded automatically

### Can I change my gender or preferences?

Yes! You can update your gender and preferences at any time from your Profile page under the "Basics" tab.

### How do I update my location?

1. Go to your Profile page
2. Click "Set Location" or "Update Location"
3. Allow location access in your browser
4. Your location will be saved automatically

## Fame Rating System

### What is the Fame Rating?

The Fame Rating is a level-based system that rewards you for being active on the platform. Your level is displayed on your profile and helps others see how engaged you are.

### How do I increase my Fame Rating?

- **Like profiles** - +0.5 points per like
- **Receive likes** - +1.0 points per like received
- **Send messages** - +0.1 points per message
- **Upload pictures** - +0.3 points per picture (max 5)
- **Get connections** - +2.0 points per mutual like
- **Profile views** - +0.05 points per view

### What level can I reach?

All users start at **Level 1**. The maximum level is **Level 100**. Users at Level 100 receive a special rainbow shadow effect on their profile cards!

## Messaging & Connections

### How do I message someone?

1. Find someone you're interested in
2. Like their profile
3. If they like you back, you'll have a connection
4. Go to the Chats page to start messaging

### What is a connection?

A connection is formed when two users like each other's profiles. Once connected, you can message each other freely.

### Can I see who viewed my profile?

Profile views are tracked and contribute to your Fame Rating, but the specific viewers are not displayed for privacy reasons.

## Technical Support

### I'm having trouble logging in

- Make sure you're using the correct email and password
- Check if your account has been verified (check your email)
- Try resetting your password if needed

### The app is not loading properly

- Clear your browser cache
- Make sure JavaScript is enabled
- Try using a different browser
- Check if the server is running (contact support if needed)

### How do I report a problem?

If you encounter any issues or have concerns, please contact our support team through the help section or email support@matcha.com

## Privacy & Safety

### Is my data safe?

Yes, we take privacy seriously. Your personal information is encrypted and stored securely. We never share your data with third parties without your consent.

### Can I delete my account?

Account deletion functionality is available in your profile settings. Please note that this action is permanent and cannot be undone.

### How do I block someone?

If you need to block a user, please contact support with the user's information, and we'll handle it promptly.

---

**Need more help?** Check out our other help pages:
- [Simulating Activity](/help/golang-simulation)
- [Fame Rating System](/help/mafia)
- [API Documentation](/help/api_explanation)
`;

export default function FAQPage() {
  const [headings, setHeadings] = useState<Heading[]>([]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="flex gap-8">
        <div className="flex-1">
          <MarkdownRenderer
            content={content}
            onHeadingsExtracted={setHeadings}
          />
        </div>
        <div className="hidden lg:block">
          <ScrollSpy headings={headings} />
        </div>
      </div>
    </div>
  );
}
