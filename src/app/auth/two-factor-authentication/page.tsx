'use client';

import { Button, Paper, Title, Container, Text, Group } from '@mantine/core';
import { useTwoFactorAuth } from '../../../hooks/mutations/useTwoFactorAuth';
import { TwoFactorCodeInputs } from '../../components/shared/common/TwoFactorCodeInputs';

// TODO: Later configure this page as fallback
export default function TwoFactorAuthenticationPage() {
    const {
        code, timer, isLoading, errorMessage, inputsRef,
        handleInputChange, handleKeyDown, handlePaste, goToLogin,
    } = useTwoFactorAuth();

    return (
        <Container size={420} my={40}>
            <Paper withBorder shadow="md" p={30} radius="md">
                <Title order={3} ta="center" mb="lg">Two-Factor Authentication</Title>

                <Text size="sm" mb="lg" ta="center">
                    Please enter the 6-digit code sent to your email
                </Text>

                {errorMessage && (
                    <Text size="sm" mb="md" ta="center" c="red" fw={500}>
                        {errorMessage}
                    </Text>
                )}

                <form autoComplete="off" onSubmit={e => e.preventDefault()}>
                    <TwoFactorCodeInputs
                        code={code}
                        timer={timer}
                        isLoading={isLoading}
                        inputsRef={inputsRef}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                    />

                    <Group justify="center">
                        <Button variant="subtle" type="button" color="blue" onClick={goToLogin}>
                            Back to Login
                        </Button>
                    </Group>
                </form>
            </Paper>
        </Container>
    );
}