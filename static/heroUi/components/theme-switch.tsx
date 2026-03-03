"use client";

import { FC } from "react";
import { Switch } from "@heroui/react";
import { useTheme } from "next-themes";
import { useIsSSR } from "@react-aria/ssr";
import clsx from "clsx";

import { SunFilledIcon, MoonFilledIcon } from "@/components/icons";

export interface ThemeSwitchProps {
  className?: string;
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({ className }) => {
  const { theme, setTheme } = useTheme();
  const isSSR = useIsSSR();

  const isLight = theme === "light" || isSSR;

  return (
    <Switch
      isSelected={isLight}
      onChange={(isSelected) => setTheme(isSelected ? "light" : "dark")}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      className={clsx("px-px transition-opacity hover:opacity-80 cursor-pointer", className)}
    >
      <Switch.Icon>
        {isLight ? <SunFilledIcon size={22} /> : <MoonFilledIcon size={22} />}
      </Switch.Icon>
    </Switch>
  );
};
