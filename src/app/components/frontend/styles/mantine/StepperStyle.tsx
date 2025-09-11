import React from 'react';
import { Stepper } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { IStepperStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for StepperStyle component
 */
interface IStepperStyleProps {
    style: IStepperStyle;
}

/**
 * StepperStyle component renders a Mantine Stepper component for multi-step processes.
 * Supports horizontal/vertical orientation and custom active step.
 *
 * @component
 * @param {IStepperStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Stepper with child stepper items
 */
const StepperStyle: React.FC<IStepperStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values using the new unified field structure
    const active = parseInt(getFieldContent(style, 'mantine_stepper_active') || '0');
    const orientation = getFieldContent(style, 'mantine_orientation') || 'horizontal';
    const allowNextClicks = getFieldContent(style, 'mantine_stepper_allow_next_clicks') === '1';
    const size = getFieldContent(style, 'mantine_size') || 'sm';
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    if (use_mantine_style) {
        return (
            <Stepper
                active={active}
                orientation={orientation as 'horizontal' | 'vertical'}
                allowNextStepsSelect={allowNextClicks}
                size={size as any}
                color={color}
                className={cssClass}
                style={styleObj}
            >
                {children.map((child: any, index: number) => (
                    child ? <BasicStyle key={index} style={child} /> : null
                ))}
            </Stepper>
        );
    }

    // Fallback to basic stepper structure when Mantine styling is disabled
    return (
        <div className={cssClass} style={{ ...styleObj }}>
            {children.map((child: any, index: number) => (
                child ? <BasicStyle key={index} style={child} /> : null
            ))}

            {/* If no children, show a sample stepper */}
            {children.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Stepper</h3>
                    <p>Add Stepper.Step and Stepper.Completed components as children to display multi-step process.</p>
                </div>
            )}
        </div>
    );
};

export default StepperStyle;

