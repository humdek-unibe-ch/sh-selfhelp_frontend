"use client";
import Link from "next/link";
import { 
  Container, 
  Grid, 
  Text, 
  Stack,
  Box,
  Tooltip,
  Group,
  useMantineTheme
} from "@mantine/core";
import {
  IconBrandFacebook,
  IconBrandTwitter,
  IconBrandInstagram,
  IconBrandYoutube,
} from "@tabler/icons-react";

const footerLinks = [
  {
    children: [
      {
        title: true,
        titleText: "Company",
      },
      {
        title: false,
        titleText: "About Us",
        link: "/about",
      },
      {
        title: false,
        titleText: "Services",
        link: "/services",
      },
    ],
  },
  {
    children: [
      {
        title: true,
        titleText: "Other",
      },
      {
        title: false,
        titleText: "Privacy Policy",
        link: "/privacy-policy",
      },
      {
        title: false,
        titleText: "Contact Us",
        link: "/contact",
      },
    ],
  },
];

const Footer = () => {
  const theme = useMantineTheme();

  return (
    <>
      <Box
        component="footer"
        style={{
          backgroundColor: theme.colors.dark[7],
          marginTop: "30px",
        }}
      >
        <Container
          size="lg"
          py={{
            base: "30px",
            lg: "60px"
          }}
        >
          <Grid gutter="lg">
            {footerLinks.map((footerlink, i) => (
              <Grid.Col span={{ base: 6, sm: 4, lg: 2 }} key={i}>
                {footerlink.children.map((child, i) => (
                  <Box key={i}>
                    {child.title ? (
                      <Text fz="lg" fw={600} mb="md">
                        {child.titleText}
                      </Text>
                    ) : (
                      <Link href={`${child.link}`}>
                        <Text
                          component="span"
                          display="block"
                          py="xs"
                          c="gray.3"
                          style={{
                            '&:hover': {
                              color: theme.colors.blue[4],
                            },
                          }}
                        >
                          {child.titleText}
                        </Text>
                      </Link>
                    )}
                  </Box>
                ))}
              </Grid.Col>
            ))}
            <Grid.Col span={{ base: 6, sm: 6, lg: 2 }}>
              <Text fz="lg" fw={600} mb="md">
                Follow us
              </Text>

              <Group gap="md">
                <Tooltip label="Facebook">
                  <Link href="#">
                    <Box component="span" c="gray.0">
                      <IconBrandFacebook size={22} />
                    </Box>
                  </Link>
                </Tooltip>
                <Tooltip label="Twitter">
                  <Link href="#">
                    <Box component="span" c="gray.0">
                      <IconBrandTwitter size={22} />
                    </Box>
                  </Link>
                </Tooltip>
                <Tooltip label="Instagram">
                  <Link href="#">
                    <Box component="span" c="gray.0">
                      <IconBrandInstagram size={22} />
                    </Box>
                  </Link>
                </Tooltip>
                <Tooltip label="Youtube">
                  <Link href="#">
                    <Box component="span" c="gray.0">
                      <IconBrandYoutube size={22} />
                    </Box>
                  </Link>
                </Tooltip>
              </Group>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>
    </>
  );
};

export default Footer;
