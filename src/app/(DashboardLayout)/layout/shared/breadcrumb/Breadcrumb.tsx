import React from "react";
import { Grid, Typography, Box, Breadcrumbs, Theme } from "@mui/material";
import NextLink from "next/link";

import breadcrumbImg from "/public/images/breadcrumb/ChatBc.png";
import {
  IconArrowRight,
  IconChevronRight,
  IconCircle,
} from "@tabler/icons-react";
import Image from "next/image";

interface BreadCrumbType {
  subtitle?: string;
  items?: any[];
  title: string;
  children?: JSX.Element;
}

const Breadcrumb = ({ subtitle, items, title, children }: BreadCrumbType) => (
  <Grid
    container
    sx={{
      my: "24px",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <Grid item xs={12} sm={6} lg={8} mb={1}>
      <Typography variant="h3">{title}</Typography>
      <Typography
        color="textSecondary"
        variant="h5"
        fontWeight={400}
        mt={0.8}
        mb={0}
      >
        {subtitle}
      </Typography>
      <Breadcrumbs
        separator={<IconChevronRight size="16" style={{ margin: "0 5px" }} />}
        sx={{ alignItems: "center", mt: items ? "10px" : "" }}
        aria-label="breadcrumb"
      >
        {items
          ? items.map((item) => (
              <div key={item.title}>
                {item.to ? (
                  <NextLink href={item.to} passHref>
                    <Typography color="textSecondary">{item.title}</Typography>
                  </NextLink>
                ) : (
                  <Typography color="textPrimary">{item.title}</Typography>
                )}
              </div>
            ))
          : ""}
      </Breadcrumbs>
    </Grid>
  </Grid>
);

export default Breadcrumb;
