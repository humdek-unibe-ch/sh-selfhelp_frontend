"use client";

import PageContainer from "@/app/components/container/PageContainer";
import AuthForgotPassword from "../../authForms/AuthForgotPassword";
import Image from "next/image";
import AuthLogo from "@/app/admin/layout/shared/logo/AuthLogo";
import { Box, Grid, Container, Text } from "@mantine/core";

export default function ForgotPassword() {
  return (
    <PageContainer
      title="Forgot Password Page"
      description="this is Sample page"
    >
      <Container fluid style={{ overflowX: "hidden" }}>
        <Grid gutter={0} justify="center">
          <Grid.Col
            span={{ base: 12, sm: 12, lg: 8, xl: 9 }}
            style={{
              position: "relative",
              "&::before": {
                content: '""',
                background: "radial-gradient(#d2f1df, #d3d7fa, #bad8f4)",
                backgroundSize: "400% 400%",
                animation: "gradient 15s ease infinite",
                position: "absolute",
                height: "100%",
                width: "100%",
                opacity: "0.3",
              },
            }}
          >
            <Box style={{ position: "relative" }}>
              <Box style={{ padding: "0 1rem" }}>
                <AuthLogo />
              </Box>
              <Box
                style={{
                  display: "none",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "calc(100vh - 75px)",
                  "@media (min-width: 1200px)": {
                    display: "flex"
                  }
                }}
              >
                <Image
                  src={"/images/backgrounds/login-bg.svg"}
                  alt="bg"
                  width={500}
                  height={500}
                  style={{
                    width: "100%",
                    maxWidth: "500px",
                    maxHeight: "500px",
                  }}
                />
              </Box>
            </Box>
          </Grid.Col>
          <Grid.Col
            span={{ base: 12, sm: 12, lg: 4, xl: 3 }}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <Box style={{ padding: "2rem" }}>
              <Text size="xl" fw={700}>
                Forgot your password?
              </Text>

              <Text
                c="dimmed"
                size="sm"
                style={{ marginTop: "1rem" }}
              >
                Please enter the email address associated with your account and We
                will email you a link to reset your password.
              </Text>
              <AuthForgotPassword />
            </Box>
          </Grid.Col>
        </Grid>
      </Container>
    </PageContainer>
  );
}


