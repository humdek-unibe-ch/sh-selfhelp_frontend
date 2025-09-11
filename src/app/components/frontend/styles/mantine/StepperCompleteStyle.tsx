import React from 'react';
import { Stepper } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { IStepperCompleteStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for StepperCompleteStyle component
 */
interface IStepperCompleteStyleProps {
    style: IStepperCompleteStyle;
}

/**
 * StepperCompleteStyle component renders a Mantine Stepper.Completed component for completed step indicator.
 * Can contain child components and supports custom colors.
 *
 * @component
 * @param {IStepperCompleteStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Stepper.Completed with child content
 */
const StepperCompleteStyle: React.FC<IStepperCompleteStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values using the new unified field structure
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    if (use_mantine_style) {
        return (
            <div className={cssClass} style={styleObj}>
                <Stepper.Completed>
                    {children.map((child: any, index: number) => (
                        child ? <BasicStyle key={index} style={child} /> : null
                    ))}
                </Stepper.Completed>
            </div>
        );
    }

    // Fallback to basic div with checkmark when Mantine styling is disabled
    return (
        <div className={cssClass} style={{ ...styleObj, padding: '16px', textAlign: 'center' }}>
            <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'green',
                color: 'white',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 'bold',
                marginBottom: '8px'
            }}>
                ✓
            </div>
            <div>
                {children.map((child: any, index: number) => (
                    child ? <BasicStyle key={index} style={child} /> : null
                ))}
            </div>
        </div>
    );
};

export default StepperCompleteStyle;

