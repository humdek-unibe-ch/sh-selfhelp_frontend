"use client";
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Button,
  Stack,
  Divider,
  Alert,
} from "@mui/material";
import Link from "next/link";
import { loginType } from "@/types/auth/auth";
import CustomCheckbox from "@/app/components/forms/theme-elements/CustomCheckbox";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
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
        <Typography fontWeight="700" variant="h3" mb={1}>
          {title}
        </Typography>
      ) : null}

      {subtext}

      <AuthSocialButtons title="Sign in with" />
      <Box mt={3}>
        <Divider>
          <Typography
            component="span"
            color="textSecondary"
            variant="h6"
            fontWeight="400"
            position="relative"
            px={2}
          >
            or sign in with
          </Typography>
        </Divider>
      </Box>

      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <Box>
              <CustomFormLabel htmlFor="user">Email</CustomFormLabel>
              <CustomTextField
                id="user"
                name="user"
                variant="outlined"
                fullWidth
                value={formData.user}
                onChange={handleChange}
                placeholder="Enter your email"
              />
            </Box>
            <Box>
              <CustomFormLabel htmlFor="password">Password</CustomFormLabel>
              <CustomTextField
                id="password"
                name="password"
                type="password"
                variant="outlined"
                fullWidth
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
              />
            </Box>
            <Stack
              justifyContent="space-between"
              direction="row"
              alignItems="center"
              my={2}
            >
              <FormGroup>
                <FormControlLabel
                  control={<CustomCheckbox defaultChecked />}
                  label="Remeber this Device"
                />
              </FormGroup>
              <Typography
                component={Link}
                href="/auth/auth1/forgot-password"
                fontWeight="500"
                sx={{
                  textDecoration: "none",
                  color: "primary.main",
                }}
              >
                Forgot Password ?
              </Typography>
            </Stack>
            <Button
              color="primary"
              variant="contained"
              size="large"
              fullWidth
              type="submit"
              disabled={loading}
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
