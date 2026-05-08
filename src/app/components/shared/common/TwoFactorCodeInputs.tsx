import React from 'react';
import { Text } from '@mantine/core';
import { formatTime } from '../../../../hooks/mutations/useTwoFactorAuth';

interface Props {
    code: string[];
    timer: number;
    isLoading: boolean;
    inputsRef: React.MutableRefObject<Array<HTMLInputElement | null>>;
    onChange: (index: number, value: string) => void;
    onKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
    onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
    expirationLabel?: string;
}

export const TwoFactorCodeInputs: React.FC<Props> = ({
    code,
    timer,
    isLoading,
    inputsRef,
    onChange,
    onKeyDown,
    onPaste,
    expirationLabel,
}) => (
    <>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
            {code.map((digit, i) => (
                <input
                    key={i}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    ref={el => { inputsRef.current[i] = el; }}
                    value={digit}
                    onChange={e => onChange(i, e.target.value)}
                    onKeyDown={e => onKeyDown(i, e)}
                    onPaste={i === 0 ? onPaste : undefined}
                    disabled={timer === 0 || isLoading}
                    style={{
                        width: 45,
                        height: 45,
                        fontSize: 20,
                        textAlign: 'center',
                        border: '1px solid #ddd',
                        borderRadius: 4,
                        outline: 'none',
                        background: timer === 0 ? '#f5f5f5' : '#fff',
                        color: timer === 0 ? '#aaa' : undefined,
                    }}
                    autoFocus={i === 0}
                    aria-label={`Digit ${i + 1}`}
                />
            ))}
        </div>

        <Text size="sm" c="dimmed" ta="center" mb="lg">
            {timer > 0 ? (
                expirationLabel
                    ? `${expirationLabel} ${formatTime(timer)}`
                    : `Code expires in ${formatTime(timer)}`
            ) : (
                <span style={{ color: 'red' }}>Expired. Please request a new code.</span>
            )}
        </Text>
    </>
);