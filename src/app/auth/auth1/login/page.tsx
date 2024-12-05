"use client"
import Link from 'next/link';
import PageContainer from '@/app/components/container/PageContainer';
import AuthLogin from '../../authForms/AuthLogin';
import Image from 'next/image';
import AuthLogo from '@/app/admin/layout/shared/logo/AuthLogo';
import { Box, Grid, Container, Text, Stack } from '@mantine/core';

export default function Login() {
  return (
    <PageContainer title="Login Page" description="this is Sample page">
      <Container fluid style={{ height: '100vh' }}>
        <Grid gutter={0} justify="center">
          <Grid.Col
            span={{ base: 12, sm: 12, lg: 7, xl: 8 }}
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
                <AuthLogo />
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
            span={{ base: 12, sm: 12, lg: 5, xl: 4 }}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Box style={{ padding: '2rem' }}>
              <AuthLogin
                title="Welcome to MaterialPro"
                subtext={
                  <Text c="dimmed" size="lg" mb="md">
                    Your Admin Dashboard
                  </Text>
                }
                subtitle={
                  <Stack gap="xs" mt="lg">
                    <Text c="dimmed" size="lg" fw={500}>
                      New to MaterialPro?
                    </Text>
                    <Text
                      component={Link}
                      href="/auth/auth1/register"
                      fw={500}
                      style={{
                        textDecoration: 'none',
                        color: 'var(--mantine-color-blue-6)'
                      }}
                    >
                      Create an account
                    </Text>
                  </Stack>
                }
              />
            </Box>
          </Grid.Col>
        </Grid>
      </Container>
    </PageContainer>
  );
}



