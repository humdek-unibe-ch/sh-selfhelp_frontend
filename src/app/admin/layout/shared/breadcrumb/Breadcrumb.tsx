import React from "react";
import NextLink from "next/link";
import { IconChevronRight } from "@tabler/icons-react";
import { Grid, Title, Text, Breadcrumbs, Anchor } from '@mantine/core';

interface BreadCrumbType {
  subtitle?: string;
  items?: Array<{
    title: string;
    to?: string;
  }>;
  title: string;
  children?: JSX.Element;
}

const Breadcrumb = ({ subtitle, items, title, children }: BreadCrumbType) => (
  <Grid
    my="md"
    style={{
      position: "relative",
      overflow: "hidden",
    }}
  >
    <Grid.Col style={{ xs: 12, sm: 6, lg: 8, mb: "xs" }}>
      <Title order={3}>{title}</Title>
      {subtitle && (
        <Text c="dimmed" fz="lg" fw={400} mt="xs" mb={0}>
          {subtitle}
        </Text>
      )}
      {items && (
        <Breadcrumbs
          separator={
            <IconChevronRight 
              size="16" 
              style={{ margin: "0 5px" }} 
              color="var(--mantine-color-dimmed)"
            />
          }
          mt="xs"
        >
          {items.map((item) => (
            <div key={item.title}>
              {item.to ? (
                <NextLink href={item.to} passHref legacyBehavior>
                  <Anchor component="a" c="dimmed">
                    {item.title}
                  </Anchor>
                </NextLink>
              ) : (
                <Text>{item.title}</Text>
              )}
            </div>
          ))}
        </Breadcrumbs>
      )}
      {children}
    </Grid.Col>
  </Grid>
);

export default Breadcrumb;
