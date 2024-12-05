import Link from "next/link";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import CustomFormLabel from "@/app/components/forms/theme-elements/CustomFormLabel";
import { Stack, Button, Box, Text, Group } from "@mantine/core";

const AuthTwoSteps = () => (
  <>
    <Box mt="lg">
      <Stack gap="md">
        <CustomFormLabel htmlFor="code">
          Type your 6 digits security code{" "}
        </CustomFormLabel>
        <Group gap="xs">
          <CustomTextField id="code" variant="outlined" w="100%" />
          <CustomTextField id="code" variant="outlined" w="100%" />
          <CustomTextField id="code" variant="outlined" w="100%" />
          <CustomTextField id="code" variant="outlined" w="100%" />
          <CustomTextField id="code" variant="outlined" w="100%" />
          <CustomTextField id="code" variant="outlined" w="100%" />
        </Group>
      </Stack>
      <Button
        fullWidth
        size="md"
        component={Link}
        href="/"
      >
        Verify My Account
      </Button>

      <Group gap="xs" mt="lg">
        <Text c="dimmed" size="sm" fw={400}>
          Didn&apos;t get the code?
        </Text>
        <Text
          component={Link}
          href="/"
          fw={500}
          style={{
            textDecoration: "none",
            color: "var(--mantine-color-blue-6)",
          }}
        >
          Resend
        </Text>
      </Group>
    </Box>
  </>
);

export default AuthTwoSteps;
