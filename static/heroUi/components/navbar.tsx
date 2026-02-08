"use client";

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarBrand,
  NavbarItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
} from "@heroui/dropdown";
import NextLink from "next/link";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";

import { HeartFilledIcon, Logo } from "@/components/icons";
import { useAuth } from "@/contexts/AuthContext";
import { useHelpDrawer } from "@/contexts/HelpDrawerContext";
import { NotificationBell } from "@/components/NotificationBell";

export const Navbar = () => {
  const { isAuthenticated } = useAuth();
  const { onOpen: openHelpDrawer } = useHelpDrawer();
  const { theme, setTheme } = useTheme();

  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <Logo size={120} height={40} />
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        {isAuthenticated ? (
          <>
            <NavbarItem className="hidden md:flex">
              <NotificationBell />
            </NavbarItem>
            <NavbarItem className="hidden md:flex">
              <Dropdown
                classNames={{
                  content:
                    "py-1 px-1 border border-default-200 bg-content1",
                }}
              >
                <DropdownTrigger>
                  <Button
                    variant="light"
                    className="text-sm font-normal text-default-600"
                    endContent={
                      <Icon icon="solar:alt-arrow-down-linear" className="text-default-500" width={16} />
                    }
                  >
                    Profile
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Profile menu">
                  <DropdownSection>
                    <DropdownItem
                      key="my-profile"
                      as={NextLink}
                      href="/Profile"
                      startContent={<Icon icon="solar:user-linear" className="text-default-500" width={18} />}
                    >
                      My Profile
                    </DropdownItem>
                    <DropdownItem
                      key="dark-mode"
                      startContent={
                        (theme ?? "dark") === "dark" ? (
                          <Icon icon="solar:sun-linear" className="text-default-500" width={18} />
                        ) : (
                          <Icon icon="solar:moon-linear" className="text-default-500" width={18} />
                        )
                      }
                      onPress={() => setTheme((theme ?? "dark") === "light" ? "dark" : "light")}
                    >
                      Toggle Dark Mode
                    </DropdownItem>
                    <DropdownItem
                      key="help"
                      startContent={<Icon icon="solar:question-circle-linear" className="text-default-500" width={18} />}
                      onPress={openHelpDrawer}
                    >
                      Help
                    </DropdownItem>
                  </DropdownSection>
                </DropdownMenu>
              </Dropdown>
            </NavbarItem>
            <NavbarItem className="hidden md:flex">
              <Button
                as={Link}
                className="text-sm font-normal text-white bg-pink-500 hover:bg-pink-600"
                href="/matcha"
                startContent={<HeartFilledIcon className="text-white" />}
                variant="flat"
              >
                Find Love
              </Button>
            </NavbarItem>
          </>
        ) : (
          <NavbarItem className="hidden md:flex">
            <Button
              as={Link}
              className="text-sm font-normal text-default-600 bg-default-100"
              href="/sign-up"
              startContent={<HeartFilledIcon className="text-danger" />}
              variant="flat"
            >
              Join
            </Button>
          </NavbarItem>
        )}
      </NavbarContent>
    </HeroUINavbar>
  );
};
