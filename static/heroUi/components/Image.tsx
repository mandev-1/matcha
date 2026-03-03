"use client";

import React from "react";
import clsx from "clsx";

/**
 * HeroUI v3 compatibility: v3 has no Image component. Use img with object-fit.
 */
export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

export const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  ({ src, alt, className, fallbackSrc, ...props }, ref) => {
    const [error, setError] = React.useState(false);
    const imgSrc = error && fallbackSrc ? fallbackSrc : src;
    return (
      <img
        ref={ref}
        src={imgSrc}
        alt={alt}
        className={clsx("object-cover", className)}
        onError={() => setError(true)}
        {...props}
      />
    );
  }
);
Image.displayName = "Image";
