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
    <HeroUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full min-w-0" justify="start">
        <NavbarBrand as="li" className="gap-2 md:gap-3 max-w-fit shrink-0">
          <NextLink className="flex justify-start items-center gap-1" href={isAuthenticated && user ? (user.is_setup ? "/matcha" : "/runway") : "/"}>
            <Logo size={120} height={40} className="w-20 h-7 sm:w-24 sm:h-8 md:w-[120px] md:h-10" />
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      {/* Mobile: notifications + menu dropdown (visible on small screens) */}
      <NavbarContent className="flex md:hidden basis-1/3" justify="end">
        {isAuthenticated ? (
          <>
            <NavbarItem>
              <NotificationBell />
            </NavbarItem>
            <NavbarItem>
              <Dropdown
                classNames={{
                  content: "py-1 px-1 border border-default-200 bg-content1",
                }}
              >
                <DropdownTrigger>
                  <Button isIconOnly variant="light" aria-label="Menu">
                    <Icon icon="solar:menu-dots-linear" className="text-xl" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Mobile menu">
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
                    <DropdownItem
                      key="logout"
                      className="text-danger"
                      color="danger"
                      startContent={<Icon icon="solar:logout-2-linear" className="text-danger" width={18} />}
                      onPress={handleLogout}
                    >
                      Logout
                    </DropdownItem>
                  </DropdownSection>
                  <DropdownSection>
                    <DropdownItem
                      key="find-love"
                      as={Link}
                      href="/matcha"
                      startContent={<HeartFilledIcon className="text-danger" />}
                      className="text-pink-500"
                    >
                      Find Love
                    </DropdownItem>
                  </DropdownSection>
                </DropdownMenu>
              </Dropdown>
            </NavbarItem>
          </>
        ) : (
          <NavbarItem>
            <Button
              as={Link}
              size="sm"
              className="text-default-600 bg-default-100"
              href="/sign-up"
              startContent={<HeartFilledIcon className="text-danger" />}
              variant="flat"
            >
              Join
            </Button>
          </NavbarItem>
        )}
      </NavbarContent>

      {/* Desktop: full nav (hidden on small screens) */}
      <NavbarContent
        className="hidden md:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        {isAuthenticated ? (
          <>
            <NavbarItem>
              <NotificationBell />
            </NavbarItem>
            <NavbarItem>
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
                    <DropdownItem
                      key="logout"
                      className="text-danger"
                      color="danger"
                      startContent={<Icon icon="solar:logout-2-linear" className="text-danger" width={18} />}
                      onPress={handleLogout}
                    >
                      Logout
                    </DropdownItem>
                  </DropdownSection>
                </DropdownMenu>
              </Dropdown>
            </NavbarItem>
            <NavbarItem>
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
          <NavbarItem>
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
