import React from 'react';
import { Stepper } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { IStepperStepStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for StepperStepStyle component
 */
interface IStepperStepStyleProps {
    style: IStepperStepStyle;
}

/**
 * StepperStepStyle component renders a Mantine Stepper.Step component for individual step items.
 * Can contain child components and supports various step configurations.
 *
 * @component
 * @param {IStepperStepStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Stepper.Step with child content
 */
const StepperStepStyle: React.FC<IStepperStepStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values using the new unified field structure
    const label = getFieldContent(style, 'label');
    const description = getFieldContent(style, 'description');
    const withIcon = getFieldContent(style, 'mantine_stepper_step_with_icon') === '1';
    const allowClick = getFieldContent(style, 'mantine_stepper_step_allow_click') === '1';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    if (use_mantine_style) {
        return (
            <Stepper.Step
                label={label}
                description={description}
                withIcon={withIcon}
                allowStepClick={allowClick}
                className={cssClass}
                style={styleObj}
            >
                {children.map((child: any, index: number) => (
                    child ? <BasicStyle key={index} style={child} /> : null
                ))}
            </Stepper.Step>
        );
    }

    // Fallback to basic div structure when Mantine styling is disabled
    return (
        <div className={cssClass} style={{ ...styleObj, marginBottom: '16px' }}>
            {label && (
                <div style={{
                    fontWeight: 'bold',
                    marginBottom: '4px',
                    cursor: allowClick ? 'pointer' : 'default'
                }}>
                    {withIcon && <span style={{ marginRight: '8px' }}>●</span>}
                    {label}
                </div>
            )}
            {description && (
                <div style={{
                    fontSize: '0.875rem',
                    color: '#666',
                    marginBottom: '8px'
                }}>
                    {description}
                </div>
            )}
            <div style={{ paddingLeft: withIcon ? '20px' : '0' }}>
                {children.map((child: any, index: number) => (
                    child ? <BasicStyle key={index} style={child} /> : null
                ))}
            </div>
        </div>
    );
};

export default StepperStepStyle;

