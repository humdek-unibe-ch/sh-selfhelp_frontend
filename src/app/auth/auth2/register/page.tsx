"use client";
import Link from 'next/link';
import PageContainer from '@/app/components/container/PageContainer';
import AuthRegister from '../../authForms/AuthRegister';
import Logo from '@/app/admin/layout/shared/logo/Logo';
import { Box, Grid, Paper, Text, Stack, Container } from '@mantine/core';

export default function Register2() {
  return (
    <PageContainer title="Register Page" description="this is Sample page">
      <Box
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
        <Container fluid style={{ height: '100vh' }}>
          <Grid gutter={0} justify="center">
            <Grid.Col
              span={{ base: 12, sm: 12, lg: 5, xl: 4 }}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Paper shadow="md" p="xl" style={{ width: '100%', maxWidth: '450px', position: 'relative', zIndex: 1 }}>
                <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Logo />
                </Box>
                <AuthRegister
                  subtext={
                    <Text c="dimmed" size="lg" ta="center" mb="md">
                      Your Social Campaigns
                    </Text>
                  }
                  subtitle={
                    <Stack gap="xs" mt="lg">
                      <Text c="dimmed" size="lg" fw={500}>
                        Already have an Account?
                      </Text>
                      <Text
                        component={Link}
                        href="/auth/auth2/login"
                        fw={500}
                        style={{
                          textDecoration: 'none',
                          color: 'var(--mantine-color-blue-6)'
                        }}
                      >
                        Sign In
                      </Text>
                    </Stack>
                  }
                />
              </Paper>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>
    </PageContainer>
  );
}



