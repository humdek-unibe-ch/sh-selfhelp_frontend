"use client";
import PageContainer from '@/app/components/container/PageContainer';
import AuthTwoSteps from '../../authForms/AuthTwoSteps';
import Logo from '@/app/admin/layout/shared/logo/Logo';
import { Box, Grid, Paper, Text, Container } from '@mantine/core';

export default function TwoSteps2() {
  return (
    <PageContainer title="Two steps Page" description="this is Sample page">
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
                <Text c="dimmed" size="lg" ta="center" mb="md">
                  We sent a verification code to your mobile. Enter the code from the mobile in the
                  field below.
                </Text>
                <Text fw={700} size="lg" ta="center" mb="md">
                  ******1234
                </Text>
                <AuthTwoSteps />
              </Paper>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>
    </PageContainer>
  );
}



