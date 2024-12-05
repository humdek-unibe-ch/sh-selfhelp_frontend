"use client"

import { Box, Container, Button, Text } from "@mantine/core";
import Image from "next/image";
import Link from "next/link";

const Maintenance = () => (
  <Box
    style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      textAlign: "center",
      justifyContent: "center"
    }}
  >
    <Container size="md">
      <Image
        src={"/images/backgrounds/maintenance2.svg"}
        alt="404" width={500} height={500}
        style={{ width: "100%", maxWidth: "500px", maxHeight: "500px" }}
      />
      <Text size="xl" ta="center" mb="md">
        Maintenance Mode!!!
      </Text>
      <Text size="lg" ta="center" mb="md">
        Website is Under Construction. Check back later!
      </Text>
      <Button
        size="md"
        component={Link}
        href="/"
      >
        Go Back to Home
      </Button>
    </Container>
  </Box>
);


export default Maintenance;
