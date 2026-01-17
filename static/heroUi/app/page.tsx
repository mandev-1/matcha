"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { title } from "@/components/primitives";

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      // If logged in but not set up, go to runway
      if (user && !user.is_setup) {
        router.push("/runway");
      } else {
        // If logged in and set up, go to matcha
        router.push("/matcha");
      }
    }
  }, [isAuthenticated, user, router]);

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-4xl text-center justify-center">
        <p className={title({ class: "text-2xl md:text-4xl" })}>
          This project aims to create a dating website. We set out to develop an application that facilitates connections between two potential kindred spirits, covering their entire life-changing entwinement from registration on our platform to the final meeting.
        </p>
      </div>
    </section>
  );
}
