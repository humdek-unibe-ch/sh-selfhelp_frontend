"use client";
import {
  Box,
  Text,
  Checkbox,
  Button,
  Stack,
  Divider,
  Alert,
  TextInput,
  Group,
  rem,
} from "@mantine/core";
import Link from "next/link";
import { loginType } from "@/types/auth/auth";
import AuthSocialButtons from "./AuthSocialButtons";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

const AuthLogin = ({ title, subtitle, subtext }: loginType) => {
  const { login, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    user: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData);
    } catch (err) {
      // Error is handled by the useAuth hook
    }
  };

  return (
    <>
      {title ? (
        <Text fw={700} size="xl" mb="md">
          {title}
        </Text>
      ) : null}

      {subtext}

      <AuthSocialButtons title="Sign in with" />
      <Box mt="lg">
        <Divider
          label={
            <Text c="dimmed" size="sm" fw={400} px="md">
              or sign in with
            </Text>
          }
          labelPosition="center"
        />
      </Box>

      <Stack gap="md">
        {error && (
          <Alert variant="light" color="red" title="Error">
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack gap="sm">
            <TextInput
              id="user"
              name="user"
              label="Email"
              placeholder="Enter your email"
              value={formData.user}
              onChange={handleChange}
              autoComplete="username"
            />
            <TextInput
              id="password"
              name="password"
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
            <Group justify="space-between" align="center" my="sm">
              <Checkbox
                defaultChecked
                label="Remember this Device"
                size="sm"
              />
              <Text
                component={Link}
                href="/auth/auth1/forgot-password"
                fw={500}
                style={{
                  textDecoration: "none",
                  color: "var(--mantine-color-blue-6)",
                }}
              >
                Forgot Password ?
              </Text>
            </Group>
            <Button
              fullWidth
              type="submit"
              loading={loading}
              disabled={loading}
              size="md"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </Stack>
        </Box>
      </Stack>
      {subtitle}
    </>
  );
};

export default AuthLogin;
