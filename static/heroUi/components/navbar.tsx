"use client";

import {
  Link,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  Avatar,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@heroui/react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";

import { HeartFilledIcon, Logo } from "@/components/icons";
import { useAuth } from "@/contexts/AuthContext";
import { useHelpDrawer } from "@/contexts/HelpDrawerContext";
import { NotificationBell } from "@/components/NotificationBell";

const DEFAULT_AVATAR =
  "https://heroui.com/images/hero-card.jpeg";

function getInitials(username: string): string {
  if (!username || username.length === 0) return "?";
  if (username.length >= 2) return username.slice(0, 2).toUpperCase();
  return username.charAt(0).toUpperCase();
}

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
    <header className="sticky top-0 z-40 w-full min-w-0 border-b border-default-200 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-7xl min-w-0 flex h-14 items-center justify-between gap-3 px-3 sm:px-4 md:px-6">
        {/* Brand */}
        <div className="flex shrink-0 min-w-0 overflow-hidden">
          <NextLink
            className="flex justify-start items-center gap-1"
            href={isAuthenticated && user ? (user.is_setup ? "/discover" : "/runway") : "/"}
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
                  <span
                    className="min-w-8 w-8 h-8 p-0 inline-flex items-center justify-center rounded-lg hover:bg-default-100 cursor-pointer"
                    aria-label="Menu"
                  >
                    <Icon icon="solar:menu-dots-linear" className="text-xl" />
                  </span>
                </DropdownTrigger>
                <Dropdown.Popover placement="bottom end" className="min-w-[11rem] py-1 px-1 border border-default-200 bg-content1 shadow-lg rounded-medium">
                <DropdownMenu aria-label="Mobile menu">
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
                      onPress={() => router.push("/discover")}
                      className="text-pink-500"
                    >
                      <HeartFilledIcon className="text-danger mr-2" />
                      Find Love
                    </DropdownItem>
                  </DropdownSection>
                </DropdownMenu>
                </Dropdown.Popover>
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
        <div className="hidden md:flex min-w-0 items-center justify-end gap-2">
          {isAuthenticated ? (
            <>
              <div className="flex shrink-0 items-center">
                <NotificationBell />
              </div>
              <Popover>
                <PopoverTrigger>
                  <span
                    className="rounded-full inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-default-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-label="Profile menu"
                    role="button"
                    tabIndex={0}
                  >
                    <Avatar size="sm" className="ring-2 ring-transparent hover:ring-default-200 transition-shadow">
                      <Avatar.Image
                        alt={user?.username ?? "User"}
                        src={DEFAULT_AVATAR}
                      />
                      <Avatar.Fallback delayMs={600}>
                        {user ? getInitials(user.username) : "?"}
                      </Avatar.Fallback>
                    </Avatar>
                  </span>
                </PopoverTrigger>
                <PopoverContent className="min-w-[12rem] p-0 border border-default-200 bg-content1 shadow-lg rounded-medium z-[100] overflow-hidden">
                  <div className="profile-menu-content flex flex-col w-full">
                    <div className="px-3 pt-3 pb-2 border-b border-default-200">
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          <Avatar.Image
                            alt={user?.username ?? "User"}
                            src={DEFAULT_AVATAR}
                          />
                          <Avatar.Fallback delayMs={600}>
                            {user ? getInitials(user.username) : "?"}
                          </Avatar.Fallback>
                        </Avatar>
                        <div className="flex flex-col gap-0 min-w-0">
                          <p className="text-sm leading-5 font-medium truncate">
                            {user?.username ?? "User"}
                          </p>
                          {user?.email && (
                            <p className="text-xs leading-none text-default-500 truncate">
                              {user.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <nav className="py-1" aria-label="Profile menu">
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left bg-transparent hover:bg-default-200 cursor-pointer rounded-none outline-none transition-colors"
                        onClick={() => router.push("/Profile")}
                      >
                        <Icon icon="solar:user-linear" className="text-default-500" width={18} />
                        My Profile
                      </button>
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left bg-transparent hover:bg-default-200 cursor-pointer rounded-none outline-none transition-colors"
                        onClick={() => setTheme((theme ?? "dark") === "light" ? "dark" : "light")}
                      >
                        {(theme ?? "dark") === "dark" ? (
                          <Icon icon="solar:sun-linear" className="text-default-500" width={18} />
                        ) : (
                          <Icon icon="solar:moon-linear" className="text-default-500" width={18} />
                        )}
                        Toggle Dark Mode
                      </button>
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left bg-transparent hover:bg-default-200 cursor-pointer rounded-none outline-none transition-colors"
                        onClick={openHelpDrawer}
                      >
                        <Icon icon="solar:question-circle-linear" className="text-default-500" width={18} />
                        Help
                      </button>
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left bg-transparent hover:bg-default-200 hover:text-danger text-danger cursor-pointer rounded-none outline-none transition-colors"
                        onClick={handleLogout}
                      >
                        <Icon icon="solar:logout-2-linear" width={18} />
                        Logout
                      </button>
                    </nav>
                  </div>
                </PopoverContent>
              </Popover>
              <Link href="/discover" className="inline-flex shrink-0 items-center gap-1.5 min-h-9 px-3 py-2 rounded-lg text-sm font-normal text-white bg-pink-500 hover:bg-pink-600 whitespace-nowrap">
                <HeartFilledIcon className="text-white shrink-0" />
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
