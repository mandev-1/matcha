"use client";

import React, { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import type { Heading } from "./MarkdownRenderer";

interface ScrollSpyProps {
  headings: Heading[];
}

export default function ScrollSpy({ headings }: ScrollSpyProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (headings.length === 0) return;

    const observerOptions: IntersectionObserverInit = {
      rootMargin: "-80px 0px -60% 0px", // active when in top ~40% of viewport (below fixed header)
      threshold: [0, 0.25, 0.5, 0.75, 1],
    };

    const visible = new Map<string, number>(); // id -> intersection ratio

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visible.set(entry.target.id, entry.intersectionRatio);
        } else {
          visible.delete(entry.target.id);
        }
      });
      // Pick the active heading: first in document order that is visible
      for (let i = 0; i < headings.length; i++) {
        if (visible.has(headings[i].id)) {
          setActiveId(headings[i].id);
          return;
        }
      }
    }, observerOptions);

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    // Set first heading as active initially (after a tick so DOM is ready)
    const t = requestAnimationFrame(() => {
      if (headings.length > 0) {
        setActiveId(headings[0].id);
      }
    });

    return () => {
      cancelAnimationFrame(t);
      headings.forEach((heading) => {
        const element = document.getElementById(heading.id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [headings]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80; // Offset for fixed header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveId(id);
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <Card className="sticky top-24 w-64 max-h-[calc(100vh-8rem)] overflow-y-auto bg-default-50 dark:bg-default-100">
      <CardBody className="p-4">
        <h3 className="text-sm font-semibold mb-3 text-default-700 dark:text-default-300 uppercase tracking-wide">
          Table of Contents
        </h3>
        <nav className="space-y-1">
          {headings.map((heading) => {
            const isActive = activeId === heading.id;
            const paddingLeft = `${(heading.level - 1) * 12}px`;
            
            return (
              <a
                key={heading.id}
                href={`#${heading.id}`}
                onClick={(e) => handleClick(e, heading.id)}
                className={`block text-sm transition-colors duration-200 py-1 ${
                  isActive
                    ? "text-primary font-medium"
                    : "text-default-600 dark:text-default-400 hover:text-primary"
                }`}
                style={{ paddingLeft }}
              >
                {heading.text}
              </a>
            );
          })}
        </nav>
      </CardBody>
    </Card>
  );
}
