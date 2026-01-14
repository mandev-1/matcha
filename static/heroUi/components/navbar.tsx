import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarBrand,
  NavbarItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import NextLink from "next/link";

import { HeartFilledIcon } from "@/components/icons";

export const Navbar = () => {
  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <p className="font-bold text-inherit" style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}>Matcha</p>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
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
      </NavbarContent>
    </HeroUINavbar>
  );
};
