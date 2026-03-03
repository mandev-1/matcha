"use client";

import {
  Button,
  Link,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
} from "@heroui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";

import { HeartFilledIcon, Logo } from "@/components/icons";
import { useAuth } from "@/contexts/AuthContext";
import { useHelpDrawer } from "@/contexts/HelpDrawerContext";
import { NotificationBell } from "@/components/NotificationBell";

export const Navbar = () => {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const { onOpen: openHelpDrawer } = useHelpDrawer();
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-default-200 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-7xl flex h-14 items-center justify-between px-3 sm:px-4 md:px-6">
        {/* Brand */}
        <div className="flex basis-1/5 sm:basis-full min-w-0 shrink-0">
          <NextLink
            className="flex justify-start items-center gap-1"
            href={isAuthenticated && user ? (user.is_setup ? "/matcha" : "/runway") : "/"}
          >
            <Logo size={120} height={40} className="w-20 h-7 sm:w-24 sm:h-8 md:w-[120px] md:h-10" />
          </NextLink>
        </div>

        {/* Mobile: notifications + menu dropdown */}
        <div className="flex md:hidden basis-1/3 justify-end gap-2">
          {isAuthenticated ? (
            <>
              <div className="flex items-center">
                <NotificationBell />
              </div>
              <Dropdown>
                <DropdownTrigger>
                  <Button variant="ghost" aria-label="Menu" className="min-w-8 w-8 h-8 p-0">
                    <Icon icon="solar:menu-dots-linear" className="text-xl" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Mobile menu" className="py-1 px-1 border border-default-200 bg-content1">
                  <DropdownSection>
                    <DropdownItem
                      key="my-profile"
                      onPress={() => router.push("/Profile")}
                    >
                      <Icon icon="solar:user-linear" className="text-default-500 mr-2" width={18} />
                      My Profile
                    </DropdownItem>
                    <DropdownItem
                      key="dark-mode"
                      onPress={() => setTheme((theme ?? "dark") === "light" ? "dark" : "light")}
                    >
                      {(theme ?? "dark") === "dark" ? (
                        <Icon icon="solar:sun-linear" className="text-default-500 mr-2" width={18} />
                      ) : (
                        <Icon icon="solar:moon-linear" className="text-default-500 mr-2" width={18} />
                      )}
                      Toggle Dark Mode
                    </DropdownItem>
                    <DropdownItem
                      key="help"
                      onPress={openHelpDrawer}
                    >
                      <Icon icon="solar:question-circle-linear" className="text-default-500 mr-2" width={18} />
                      Help
                    </DropdownItem>
                    <DropdownItem
                      key="logout"
                      className="text-danger"
                      onPress={handleLogout}
                    >
                      <Icon icon="solar:logout-2-linear" className="text-danger mr-2" width={18} />
                      Logout
                    </DropdownItem>
                  </DropdownSection>
                  <DropdownSection>
                    <DropdownItem
                      key="find-love"
                      onPress={() => router.push("/matcha")}
                      className="text-pink-500"
                    >
                      <HeartFilledIcon className="text-danger mr-2" />
                      Find Love
                    </DropdownItem>
                  </DropdownSection>
                </DropdownMenu>
              </Dropdown>
            </>
          ) : (
            <Link href="/sign-up" className="inline-flex items-center gap-1.5 min-h-9 px-3 rounded-lg text-default-600 bg-default-100 border border-default-200 hover:bg-default-200 text-sm">
              <HeartFilledIcon className="text-danger" />
              Join
            </Link>
          )}
        </div>

        {/* Desktop: full nav */}
        <div className="hidden md:flex basis-1/5 sm:basis-full justify-end gap-2">
          {isAuthenticated ? (
            <>
              <div className="flex items-center">
                <NotificationBell />
              </div>
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    variant="ghost"
                    className="text-sm font-normal text-default-600"
                  >
                    Profile
                    <Icon icon="solar:alt-arrow-down-linear" className="text-default-500 ml-1" width={16} />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Profile menu" className="py-1 px-1 border border-default-200 bg-content1">
                  <DropdownSection>
                    <DropdownItem
                      key="my-profile"
                      onPress={() => router.push("/Profile")}
                    >
                      <Icon icon="solar:user-linear" className="text-default-500 mr-2" width={18} />
                      My Profile
                    </DropdownItem>
                    <DropdownItem
                      key="dark-mode"
                      onPress={() => setTheme((theme ?? "dark") === "light" ? "dark" : "light")}
                    >
                      {(theme ?? "dark") === "dark" ? (
                        <Icon icon="solar:sun-linear" className="text-default-500 mr-2" width={18} />
                      ) : (
                        <Icon icon="solar:moon-linear" className="text-default-500 mr-2" width={18} />
                      )}
                      Toggle Dark Mode
                    </DropdownItem>
                    <DropdownItem
                      key="help"
                      onPress={openHelpDrawer}
                    >
                      <Icon icon="solar:question-circle-linear" className="text-default-500 mr-2" width={18} />
                      Help
                    </DropdownItem>
                    <DropdownItem
                      key="logout"
                      className="text-danger"
                      onPress={handleLogout}
                    >
                      <Icon icon="solar:logout-2-linear" className="text-danger mr-2" width={18} />
                      Logout
                    </DropdownItem>
                  </DropdownSection>
                </DropdownMenu>
              </Dropdown>
              <Link href="/matcha" className="inline-flex items-center gap-1.5 min-h-9 px-4 rounded-lg text-sm font-normal text-white bg-pink-500 hover:bg-pink-600">
                <HeartFilledIcon className="text-white" />
                Find Love
              </Link>
            </>
          ) : (
            <Link href="/sign-up" className="inline-flex items-center gap-1.5 min-h-9 px-4 rounded-lg text-sm font-normal text-default-600 bg-default-100 border border-default-200 hover:bg-default-200">
              <HeartFilledIcon className="text-danger" />
              Join
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
