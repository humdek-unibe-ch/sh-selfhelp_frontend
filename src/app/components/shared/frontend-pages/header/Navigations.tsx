"use client";
import React from "react";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import { Chip } from "@mui/material";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useNavigation } from "@/hooks/useNavigation";

const Navigations = () => {
  const router = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const { menuItems } = useNavigation();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const StyledButton = styled(Button)(({ theme }) => ({
    a: {
      color: theme.palette.text.secondary,
      fontWeight: 500,
      fontSize: "15px",
    },

    "&.active": {
      backgroundColor: "rgba(93, 135, 255, 0.15)",
      a: {
        color: theme.palette.primary.main,
      },
    },
  }));

  return (
    <>
      {menuItems.map((navlink, i) => (
        <StyledButton
          color="inherit"
          className={router === navlink.href ? "active" : "not-active"}
          variant="text"
          key={i}
        >
          <NextLink href={navlink.href || '#'}>
            {navlink.title}
            {navlink.chip && (
              <Chip
                label={navlink.chip}
                size="small"
                sx={{
                  ml: "6px",
                  borderRadius: "8px",
                  color: "primary.main",
                  backgroundColor: "rgba(93, 135, 255, 0.15)",
                }}
              />
            )}
          </NextLink>
        </StyledButton>
      ))}
    </>
  );
};

export default Navigations;
