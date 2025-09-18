import React, { useState, useEffect } from 'react';
import { Radio, Tooltip, Group, Text, Input } from '@mantine/core';
import BasicStyle from '../../BasicStyle';
import { getFieldContent, castMantineSize } from '../../../../../../utils/style-field-extractor';
import { IRadioStyle } from '../../../../../../types/common/styles.types';

/**
 * Props interface for RadioStyle component
 */
interface IRadioStyleProps {
    style: IRadioStyle;
}

/**
 * Unified RadioStyle component that handles both single radio buttons and radio groups.
 * Can render as:
 * - Single Radio: When no mantine_radio_options are provided
 * - Radio.Group: When mantine_radio_options are provided (renders multiple options)
 * - Radio Cards: When mantine_radio_card is enabled with options (renders Radio.Card components)
 *
 * Features:
 * - Label position control (left/right)
 * - Variant options (default/outline)
 * - Tooltip support
 * - Card-style rendering with descriptions
 * - Form integration with controlled state
 *
 * Usage for Radio Cards:
 * Set mantine_radio_options with descriptions and enable mantine_radio_card
 * Example: [{"value":"option1","text":"Premium Plan","description":"Best for businesses"}]
 *
 * @component
 * @param {IRadioStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Radio component(s)
 */
const RadioStyle: React.FC<IRadioStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values using the new unified field structure
    const label = getFieldContent(style, 'label');
    const name = getFieldContent(style, 'name');
    const value = getFieldContent(style, 'value');
    const description = getFieldContent(style, 'description');
    const orientation = getFieldContent(style, 'mantine_orientation') || 'vertical';
    const size = castMantineSize(getFieldContent(style, 'mantine_size'));
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const required = getFieldContent(style, 'is_required') === '1';
    const disabled = getFieldContent(style, 'disabled') === '1';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // New fields
    const labelPosition = getFieldContent(style, 'mantine_radio_label_position') || 'right';
    const variant = getFieldContent(style, 'mantine_radio_variant') || 'default';
    const useRadioCard = getFieldContent(style, 'mantine_radio_card') === '1';
    const tooltipLabel = getFieldContent(style, 'mantine_tooltip_label');
    const tooltipPosition = getFieldContent(style, 'mantine_tooltip_position') || 'top';
    const useInputWrapper = getFieldContent(style, 'mantine_use_input_wrapper') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // State for controlled component
    const [selectedValue, setSelectedValue] = useState<string>(value || '');

    // Update state when value prop changes
    useEffect(() => {
        setSelectedValue(value || '');
    }, [value]);

    // Parse radio options from JSON textarea
    let radioOptions: Array<{ value: string; text: string; description?: string }> = [];
    try {
        const optionsJson = getFieldContent(style, 'mantine_radio_options');
        if (optionsJson) {
            const parsed = JSON.parse(optionsJson);
            // Handle both old format (label/text) and new format with description
            radioOptions = parsed.map((option: any) => ({
                value: option.value,
                text: option.text || option.label || option.value,
                description: option.description
            }));
        }
    } catch (error) {
        console.warn('Invalid JSON in mantine_radio_options:', error);
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
    const createRadioComponent = (radioProps: any, isCard: boolean = false, option?: any) => {
        let radioElement;

        if (isCard && option) {
            // Create proper Radio.Card structure like in Mantine docs
            radioElement = (
                <Radio.Card
                    {...radioProps}
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
            radioElement = <Radio {...radioProps} />;
        }

        // Wrap with tooltip if tooltipLabel is provided
        if (tooltipLabel && tooltipLabel.trim()) {
            return (
                <Tooltip
                    label={tooltipLabel}
                    position={tooltipPosition as any}
                    disabled={disabled}
                >
                    {radioElement}
                </Tooltip>
            );
        }

        return radioElement;
    };

    // Helper function to create radio with label positioning (only for non-card mode)
    const createRadioWithLabel = (radioProps: any, radioLabel?: string, isCard: boolean = false, option?: any) => {
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
        if (use_mantine_style) {
            const radioGroupElement = (
                <Radio.Group
                    name={name}
                    value={selectedValue}
                    onChange={handleChange}
                    label={useInputWrapper ? undefined : label}
                    required={required}
                    className={cssClass}
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
                        {children.map((child: any, index: number) => (
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
                        description={description}
                        required={required}
                    >
                        {radioGroupElement}
                    </Input.Wrapper>
                );
            }

            return radioGroupElement;
        }

        // Fallback to basic radio group when Mantine styling is disabled
        const basicRadioGroupElement = (
            <fieldset className={cssClass} style={styleObj}>
                {label && !useInputWrapper && <legend>{label}</legend>}
                <div style={{
                    display: 'flex',
                    flexDirection: orientation === 'horizontal' ? 'row' : 'column',
                    gap: '8px'
                }}>
                {radioOptions.map((option, index) => (
                    <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '8px',
                        padding: useRadioCard ? '12px' : '0',
                        border: useRadioCard ? '1px solid #e0e0e0' : 'none',
                        borderRadius: useRadioCard ? '4px' : '0',
                        backgroundColor: useRadioCard ? '#f8f9fa' : 'transparent'
                    }}>
                        <input
                            type="radio"
                            name={name}
                            value={option.value}
                            checked={selectedValue === option.value}
                            onChange={(e) => handleChange(e.target.value)}
                            required={required}
                            disabled={disabled}
                            style={{ marginRight: '8px' }}
                        />
                        <div style={{ flex: 1 }}>
                            <label style={{ marginRight: '16px', fontWeight: '500' }}>
                                {option.text}
                            </label>
                            {option.description && (
                                <div style={{ fontSize: '0.875em', color: '#666', marginTop: '2px' }}>
                                    {option.description}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                    {/* Render any child RadioStyle components for backwards compatibility */}
                    {children.map((child: any, index: number) => (
                        child ? <BasicStyle key={`child-${index}`} style={child} /> : null
                    ))}
                </div>
            </fieldset>
        );

        // Wrap with Input.Wrapper if enabled
        if (useInputWrapper) {
            return (
                <Input.Wrapper
                    label={label}
                    description={description}
                    required={required}
                >
                    {basicRadioGroupElement}
                </Input.Wrapper>
            );
        }

        return basicRadioGroupElement;
    }

    // Single radio button (when no options are provided)
    const singleValue = value || style.id.toString();

    if (use_mantine_style) {
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
                    description={description}
                    required={required}
                >
                    {singleRadioElement}
                </Input.Wrapper>
            );
        }

        return singleRadioElement;
    }

    // Fallback to basic radio input when Mantine styling is disabled
    const basicRadioElement = (
        <input
            type="radio"
            name={name}
            value={singleValue}
            required={required}
            disabled={disabled}
            className={cssClass}
            style={styleObj}
        />
    );

    // Wrap with Input.Wrapper if enabled
    if (useInputWrapper) {
        return (
            <Input.Wrapper
                label={label}
                description={description}
                required={required}
            >
                {basicRadioElement}
            </Input.Wrapper>
        );
    }

    return basicRadioElement;
};

export default RadioStyle;
