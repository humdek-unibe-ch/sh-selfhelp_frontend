import { FC } from "react";
import { useSelector } from "@/store/hooks";
import Link from "next/link";
import { AppState } from "@/store/store";
import Image from "next/image";
import { Box } from '@mantine/core';

const AuthLogo = () => {
  const customizer = useSelector((state: AppState) => state.customizer);

  const logoContent = (
    <Box
      component={Link}
      href="/"
      style={{
        height: customizer.TopbarHeight,
        width: customizer.isCollapse ? 40 : 180,
        overflow: "hidden",
        display: "block",
      }}
    >
      {customizer.activeMode === "dark" ? (
        <Image
          src={customizer.activeDir === "ltr" 
            ? "/images/logos/light-logo.svg"
            : "/images/logos/light-rtl-logo.svg"}
          alt="logo"
          height={customizer.TopbarHeight}
          width={174}
          priority
        />
      ) : (
        <Image
          src={customizer.activeDir === "ltr"
            ? "/images/logos/dark-logo.svg"
            : "/images/logos/dark-logo-rtl.svg"}
          alt="logo"
          height={customizer.TopbarHeight}
          width={174}
          priority
        />
      )}
    </Box>
  );

  return logoContent;
};

export default AuthLogo;
