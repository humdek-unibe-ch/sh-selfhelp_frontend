import React from 'react';
import { Box, Card, Title, Button, Alert, Group } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { ITwoFactorAuthStyle } from '../../../../types/common/styles.types';
import { useTwoFactorAuth } from '../../../../hooks/mutations/useTwoFactorAuth';
import { TwoFactorCodeInputs } from '../../shared/common/TwoFactorCodeInputs';

interface ITwoFactorAuthStyleProps {
    style: ITwoFactorAuthStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

const TwoFactorAuthStyle: React.FC<ITwoFactorAuthStyleProps> = ({ style }) => {
    const labelSubmit = style.label_submit?.content || 'Verify';
    const alertFail = style.alert_fail?.content || 'Invalid verification code';
    const title = style.title?.content || 'Two-Factor Authentication';
    const textMd = style.text_md?.content;
    const labelExpiration2fa = style.label_expiration_2fa?.content;

    const {
        code, timer, isLoading, errorMessage, inputsRef,
        handleInputChange, handleKeyDown, handlePaste, submitCode, goToLogin,
    } = useTwoFactorAuth({ fallbackErrorMessage: alertFail });

    const allFilled = code.every(d => d);

    return (
        <Box className={style.css ?? ''}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={2} ta="center" mb="md">{title}</Title>

                {textMd && <Box mb="lg">{textMd}</Box>}

                <form autoComplete="off" onSubmit={e => { e.preventDefault(); submitCode(code); }}>
                    {errorMessage && (
                        <Alert icon={<IconX size={16} />} color="red" mb="md">
                            {errorMessage}
                        </Alert>
                    )}

                    <TwoFactorCodeInputs
                        code={code}
                        timer={timer}
                        isLoading={isLoading}
                        inputsRef={inputsRef}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        expirationLabel={labelExpiration2fa}
                    />

                    <Button type="submit" fullWidth size="lg" loading={isLoading} disabled={!allFilled || timer === 0}>
                        {labelSubmit}
                    </Button>
                </form>

                <Group justify="center" mt="lg">
                    <Button variant="subtle" size="sm" onClick={goToLogin}>
                        Back to Login
                    </Button>
                </Group>
            </Card>
        </Box>
    );
};

export default TwoFactorAuthStyle;