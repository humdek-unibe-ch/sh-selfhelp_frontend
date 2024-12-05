"use client"
import { Box, Button, Container, Text } from "@mantine/core";
import Image from "next/image";
import Link from "next/link";

const NotFound = () => (
  <Box
    style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      textAlign: "center",
      justifyContent: "center",
    }}
  >
    <Container size="md">
      <Image
        src={"/images/backgrounds/errorimg.svg"}
        alt="404" width={500} height={500}
        style={{ width: "100%", maxWidth: "500px", maxHeight: '500px' }}
      />
      <Text size="xl" fw={700} ta="center" mb="md">
        Opps!!!
      </Text>
      <Text size="lg" ta="center" mb="xl">
        This page you are looking for could not be found.
      </Text>
      <Button
        color="blue"
        variant="filled"
        component={Link}
        href="/"
      >
        Go Back to Home
      </Button>
    </Container>
  </Box>
);

export default NotFound;
