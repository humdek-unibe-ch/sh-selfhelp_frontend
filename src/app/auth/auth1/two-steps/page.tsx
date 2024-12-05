"use client";
import PageContainer from '@/app/components/container/PageContainer';
import AuthTwoSteps from '../../authForms/AuthTwoSteps';
import Image from 'next/image';
import Logo from '@/app/admin/layout/shared/logo/Logo';
import { Box, Grid, Container, Text } from '@mantine/core';

export default function TwoSteps() {
  return (
    <PageContainer title="Two steps Page" description="this is Sample page">
      <Container fluid style={{ overflowX: 'hidden' }}>
        <Grid gutter={0} justify="center">
          <Grid.Col
            span={{ base: 12, sm: 12, lg: 8, xl: 9 }}
            style={{
              position: 'relative',
              '&::before': {
                content: '""',
                background: 'radial-gradient(#d2f1df, #d3d7fa, #bad8f4)',
                backgroundSize: '400% 400%',
                animation: 'gradient 15s ease infinite',
                position: 'absolute',
                height: '100%',
                width: '100%',
                opacity: '0.3',
              },
            }}
          >
            <Box style={{ position: 'relative' }}>
              <Box style={{ padding: '0 1rem' }}>
                <Logo />
              </Box>
              <Box
                style={{
                  display: 'none',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 'calc(100vh - 75px)',
                  '@media (min-width: 1200px)': {
                    display: 'flex'
                  }
                }}
              >
                <Image
                  src={"/images/backgrounds/login-bg.svg"}
                  alt="bg"
                  width={500}
                  height={500}
                  style={{
                    width: '100%',
                    maxWidth: '500px',
                    maxHeight: '500px',
                  }}
                />
              </Box>
            </Box>
          </Grid.Col>
          <Grid.Col
            span={{ base: 12, sm: 12, lg: 4, xl: 3 }}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Box style={{ padding: '2rem' }}>
              <Text size="xl" fw={700}>
                Two Step Verification
              </Text>

              <Text c="dimmed" size="md" mt="md" mb="xs">
                We sent a verification code to your mobile. Enter the code from the mobile in the field
                below.
              </Text>
              <Text fw={700} mb="xs">
                ******1234
              </Text>
              <AuthTwoSteps />
            </Box>
          </Grid.Col>
        </Grid>
      </Container>
    </PageContainer>
  );
}



