/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React, { useState, useContext } from 'react';
import { Radio, Tooltip, Group, Text, Input } from '@mantine/core';
import BasicStyle from '../../BasicStyle';
import { type IRadioStyle } from '../../../../../../types/common/styles.types';
import { FormFieldValueContext } from '../../FormStyle';
import parse from "html-react-parser";
import { sanitizeHtmlForParsing, sanitizeHtmlForInline } from '../../../../../../utils/html-sanitizer.utils';
import { castMantineSize } from '../../../../../../utils/style-field-extractor';

/**
 * Props interface for RadioStyle component
 */
interface IRadioStyleProps {
    style: IRadioStyle;
    styleProps: Record<string, string>;
    cssClass: string;
}

/** Parsed radio option shape from the `radio_options` JSON field. */
interface IRadioOption {
    value: string;
    text: string;
    description?: string;
}

/** Loosely-typed prop bag passed to the Mantine `Radio` / `Radio.Card` element. */
type TRadioProps = { style?: React.CSSProperties;[key: string]: unknown };

/**
 * Unified RadioStyle component that handles both single radio buttons and radio groups.
 * Can render as:
 * - Single Radio: When no radio_options are provided
 * - Radio.Group: When radio_options are provided (renders multiple options)
 * - Radio Cards: When web_radio_card is enabled with options (renders Radio.Card components)
 *
 * Features:
 * - Label position control (left/right)
 * - Variant options (default/outline)
 * - Tooltip support
 * - Card-style rendering with descriptions
 * - Form integration with controlled state
 *
 * Usage for Radio Cards:
 * Set radio_options with descriptions and enable web_radio_card
 * Example: [{"value":"option1","text":"Premium Plan","description":"Best for businesses"}]
 *
 * @component
 * @param {IRadioStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Radio component(s)
 */
const RadioStyle: React.FC<IRadioStyleProps> = ({ style, styleProps, cssClass }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values using the new unified field structure
    const label = style.label?.content;
    const name = style.name?.content;
    const value = style.value?.content;
    const description = style.description?.content || '';
    const orientation = style.orientation?.content || 'vertical';
    const size = castMantineSize(style.size?.content);
    const color = style.color?.content || 'blue';
    const required = style.is_required?.content === '1';
    const disabled = style.disabled?.content === '1';
    // New fields
    const labelPosition = style.web_radio_label_position?.content || 'right';
    const variant = style.web_radio_variant?.content || 'default';
    const useRadioCard = style.web_radio_card?.content === '1';
    const tooltipLabel = style.tooltip_label?.content;
    const tooltipPosition = style.web_tooltip_position?.content || 'top';
    const useInputWrapper = style.web_use_input_wrapper?.content === '1';

    // Handle CSS field - use direct property from API response

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Get form context for pre-populated values
    const formContext = useContext(FormFieldValueContext);
    const formValue = formContext && name ? formContext.getFieldValue(name) : null;

    // State for controlled component - use form value if available, otherwise use style value
    const [selectedValue, setSelectedValue] = useState<string>(() => {
        return (formValue && typeof formValue === 'string') ? formValue : (value || '');
    });

    // Keep state in sync with the (async) form value via a render-phase update
    // instead of an effect; the sentinel initial runs it on first render too,
    // and prevValue mirrors the original [formValue, value] deps.
    const [prevFormValue, setPrevFormValue] = useState<unknown>(() => ({}));
    const [prevValue, setPrevValue] = useState(value);
    if (prevFormValue !== formValue || prevValue !== value) {
        setPrevFormValue(formValue);
        setPrevValue(value);
        if (formValue !== null && typeof formValue === 'string') {
            setSelectedValue(formValue);
        } else {
            setSelectedValue(value || '');
        }
    }

    // Parse radio options from JSON textarea
    let radioOptions: IRadioOption[] = [];
    try {
        const optionsJson = style.radio_options?.content;
        if (optionsJson) {
            const parsed = JSON.parse(optionsJson) as Array<{ value: string; text?: string; label?: string; description?: string }>;
            // Handle both old format (label/text) and new format with description
            radioOptions = parsed.map((option) => ({
                value: option.value,
                text: option.text || option.label || option.value,
                description: option.description
            }));
        }
    } catch (error) {
        console.warn('Invalid JSON in radio_options:', error);
        radioOptions = [];
    }

    // Handle value change for form integration
    const handleChange = (newValue: string) => {
        setSelectedValue(newValue);

        // Dispatch change event for form integration
        const event = new CustomEvent('radioChange', {
            detail: { name, value: newValue, styleId: style.id }
        });
        window.dispatchEvent(event);
    };

    // Helper function to create radio component with tooltip
    const createRadioComponent = (radioProps: TRadioProps, isCard: boolean = false, option?: IRadioOption) => {
        let radioElement;

        if (isCard && option) {
            // Create proper Radio.Card structure like in Mantine docs
            radioElement = (
                <Radio.Card
                    {...(radioProps as React.ComponentProps<typeof Radio.Card>)}
                    radius="md"
                    style={{
                        padding: '16px',
                        border: '1px solid var(--mantine-color-default-border)',
                        backgroundColor: 'var(--mantine-color-body)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            backgroundColor: 'var(--mantine-color-default-hover)',
                            borderColor: 'var(--mantine-color-default-border-hover)',
                        },
                        ...radioProps.style
                    }}
                >
                    <Group wrap="nowrap" align="flex-start" gap="sm">
                        <Radio.Indicator />
                        <div style={{ flex: 1 }}>
                            <Text size="sm" fw={500} style={{ marginBottom: '4px' }}>
                                {option.text}
                            </Text>
                            {option.description && (
                                <Text size="xs" c="dimmed">
                                    {option.description}
                                </Text>
                            )}
                        </div>
                    </Group>
                </Radio.Card>
            );
        } else {
            // Regular Radio component
            radioElement = <Radio {...(radioProps as React.ComponentProps<typeof Radio>)} />;
        }

        // Wrap with tooltip if tooltipLabel is provided
        if (tooltipLabel && tooltipLabel.trim()) {
            return (
                <Tooltip
                    label={tooltipLabel}
                    position={tooltipPosition as React.ComponentProps<typeof Tooltip>['position']}
                    disabled={disabled}
                >
                    {radioElement}
                </Tooltip>
            );
        }

        return radioElement;
    };

    // Helper function to create radio with label positioning (only for non-card mode)
    const createRadioWithLabel = (radioProps: TRadioProps, radioLabel?: string, isCard: boolean = false, option?: IRadioOption) => {
        if (isCard || !radioLabel) return createRadioComponent(radioProps, isCard, option);

        const radioComponent = createRadioComponent(radioProps, false, option);

        if (labelPosition === 'left') {
            return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{radioLabel}</span>
                    {radioComponent}
                </div>
            );
        }

        // Default right position
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {radioComponent}
                <span>{radioLabel}</span>
            </div>
        );
    };

    // If we have radio options, render as a Radio.Group
    if (radioOptions.length > 0) {
            const radioGroupElement = (
                <Radio.Group
                    name={name}
                    value={selectedValue}
                    onChange={handleChange}
                    label={useInputWrapper ? undefined : label}
                    required={required}
                    className={cssClass} {...styleProps}
                    style={styleObj}
                >
                    <div style={{
                        display: 'flex',
                        flexDirection: orientation === 'horizontal' ? 'row' : 'column',
                        gap: 'var(--mantine-spacing-sm)'
                    }}>
                        {radioOptions.map((option, index) => (
                            <div key={index} style={{ marginBottom: useRadioCard ? '8px' : '0' }}>
                                {createRadioWithLabel({
                                    value: option.value,
                                    size,
                                    color,
                                    disabled,
                                    variant: !useRadioCard && variant === 'outline' ? 'outline' : undefined,
                                }, option.text, useRadioCard, option)}
                            </div>
                        ))}

                        {/* Render any child RadioStyle components for backwards compatibility */}
                        {children.map((child, index: number) => (
                            child ? <BasicStyle key={`child-${index}`} style={child} /> : null
                        ))}
                    </div>
                </Radio.Group>
            );

            // Wrap with Input.Wrapper if enabled
            if (useInputWrapper) {
                return (
                    <Input.Wrapper
                        label={label}
                        description={parse(sanitizeHtmlForParsing(description))}
                        required={required}
                    >
                        {radioGroupElement}
                    </Input.Wrapper>
                );
            }

            return radioGroupElement;
    }

    // Single radio button (when no options are provided)
    const singleValue = value || style.id.toString();

        const singleRadioElement = createRadioWithLabel({
            name,
            value: singleValue,
            description: useInputWrapper ? undefined : description,
            required,
            disabled,
            size,
            color,
            variant: !useRadioCard && variant === 'outline' ? 'outline' : undefined,
            className: cssClass,
            style: styleObj
        }, useInputWrapper ? undefined : label, false); // Single radio never uses card mode

        // Wrap with Input.Wrapper if enabled
        if (useInputWrapper) {
            return (
                <Input.Wrapper
                    label={label}
                    description={parse(sanitizeHtmlForInline(description))}
                    required={required}
                >
                    {singleRadioElement}
                </Input.Wrapper>
            );
        }

        return singleRadioElement;
};

export default RadioStyle;
