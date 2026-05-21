/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import React from 'react';
import { Text } from '@mantine/core';
import { formatTime } from '../../../../hooks/useTwoFactorAuth';

interface ITwoFactorCodeInputsProps {
    code: string[];
    timer: number;
    isLoading: boolean;
    inputsRef: React.MutableRefObject<Array<HTMLInputElement | null>>;
    onChange: (index: number, value: string) => void;
    onKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
    onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
    /**
     * Optional CMS-authored label rendered as a standalone line **above**
     * the countdown (e.g. "Enter the 6-digit code we just emailed you").
     * Kept independent of the countdown so admin authors can write a full
     * sentence without the timer being appended to it.
     */
    expirationLabel?: string;
}

const inputBaseStyle: React.CSSProperties = {
    width: 45,
    height: 45,
    fontSize: 20,
    textAlign: 'center',
    border: '1px solid var(--mantine-color-default-border)',
    borderRadius: 4,
    outline: 'none',
    background: 'var(--mantine-color-body)',
    color: 'var(--mantine-color-text)',
};

const inputDisabledStyle: React.CSSProperties = {
    background: 'var(--mantine-color-default)',
    color: 'var(--mantine-color-dimmed)',
};

export const TwoFactorCodeInputs: React.FC<ITwoFactorCodeInputsProps> = ({
    code,
    timer,
    isLoading,
    inputsRef,
    onChange,
    onKeyDown,
    onPaste,
    expirationLabel,
}) => {
    const disabled = timer === 0 || isLoading;

    return (
        <>
            <div
                role="group"
                aria-label="Verification code"
                style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}
            >
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
                        disabled={disabled}
                        style={timer === 0 ? { ...inputBaseStyle, ...inputDisabledStyle } : inputBaseStyle}
                        autoFocus={i === 0}
                        aria-label={`Digit ${i + 1}`}
                    />
                ))}
            </div>

            {expirationLabel && (
                <Text size="sm" c="dimmed" ta="center" mb="xs">
                    {expirationLabel}
                </Text>
            )}

            <Text size="sm" c="dimmed" ta="center" mb="lg" role="status" aria-live="polite">
                {timer > 0 ? (
                    <>Code expires in {formatTime(timer)}</>
                ) : (
                    <span style={{ color: 'var(--mantine-color-red-6)' }}>
                        Expired. Please request a new code.
                    </span>
                )}
            </Text>
        </>
    );
};
