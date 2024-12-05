import Link from "next/link";
import { registerType } from "@/types/auth/auth";
import AuthSocialButtons from "./AuthSocialButtons";
import { Box, Text, Stack, Divider, Button, TextInput } from "@mantine/core";

const AuthRegister = ({ title, subtitle, subtext }: registerType) => (
  <>
    {title ? (
      <Text fw={700} size="xl" mb="md">
        {title}
      </Text>
    ) : null}

    {subtext}
    <AuthSocialButtons title="Sign up with" />

    <Box mt="lg">
      <Divider
        label={
          <Text c="dimmed" size="sm" fw={400} px="md">
            or sign up with
          </Text>
        }
        labelPosition="center"
      />
    </Box>

    <Box>
      <Stack gap="md" mb="lg">
        <TextInput
          id="name"
          name="name"
          label="Name"
          placeholder="Enter your name"
        />
        <TextInput
          id="email"
          name="email"
          label="Email Address"
          placeholder="Enter your email"
        />
        <TextInput
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="Enter your password"
        />
      </Stack>
      <Button
        fullWidth
        size="md"
        component={Link}
        href="/auth/auth1/login"
      >
        Sign Up
      </Button>
    </Box>
    {subtitle}
  </>
);

export default AuthRegister;
