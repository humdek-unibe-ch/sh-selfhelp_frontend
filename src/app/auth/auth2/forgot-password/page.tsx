"use client";
import PageContainer from '@/app/components/container/PageContainer';
import AuthForgotPassword from '../../authForms/AuthForgotPassword';
import Logo from '@/app/admin/layout/shared/logo/Logo';
import { Box, Grid, Paper, Text, Container } from '@mantine/core';

export default function ForgotPassword2() {
  return (
    <PageContainer title="Forgot Password Page" description="this is Sample page">
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
              span={{ base: 12, sm: 12, lg: 4, xl: 3 }}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Paper shadow="md" p="xl" style={{ width: '100%', maxWidth: '500px', position: 'relative', zIndex: 1 }}>
                <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Logo />
                </Box>
                <Text
                  c="dimmed"
                  ta="center"
                  size="sm"
                  fw={400}
                >
                  Please enter the email address associated with your account and We will email you a
                  link to reset your password.
                </Text>
                <AuthForgotPassword />
              </Paper>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>
    </PageContainer>
  );
}



