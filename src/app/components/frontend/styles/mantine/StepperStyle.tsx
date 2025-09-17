import React, { useState, useCallback } from 'react';
import { Stepper, Button, Group } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { castMantineRadius, castMantineSize, getFieldContent } from '../../../../../utils/style-field-extractor';
import { IStepperStyle } from '../../../../../types/common/styles.types';
import IconComponent from '../../../shared/common/IconComponent';

/**
 * Props interface for StepperStyle component
 */
interface IStepperStyleProps {
    style: IStepperStyle;
}

/**
 * StepperStyle component renders a Mantine Stepper component for multi-step processes.
 * Supports horizontal/vertical orientation, custom active step, navigation buttons,
 * step click navigation, form integration, and comprehensive styling options.
 *
 * @component
 * @param {IStepperStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Stepper with child stepper items
 */
const StepperStyle: React.FC<IStepperStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values using the new unified field structure
    const initialActive = parseInt(getFieldContent(style, 'mantine_stepper_active') || '0');
    const orientation = getFieldContent(style, 'mantine_orientation') || 'horizontal';
    const allowNextClicks = getFieldContent(style, 'mantine_stepper_allow_next_clicks') === '1';
    const size = castMantineSize(getFieldContent(style, 'mantine_size')) || 'sm';
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const radius = castMantineRadius(getFieldContent(style, 'mantine_radius')) || 'md';
    const iconSize = parseInt(getFieldContent(style, 'mantine_icon_size') || '16');

    // Navigation and interaction fields
    const allowStepSelect = getFieldContent(style, 'mantine_stepper_allow_step_select') === '1';
    const showNavigation = getFieldContent(style, 'mantine_stepper_show_navigation') === '1';
    const backEnabled = getFieldContent(style, 'mantine_stepper_back_enabled') === '1';
    const useLastStepAsCompleted = getFieldContent(style, 'mantine_stepper_use_last_step_as_completed') === '1';

    // Label fields (translatable)
    const nextLabel = getFieldContent(style, 'mantine_stepper_next_label') || 'Next';
    const backLabel = getFieldContent(style, 'mantine_stepper_back_label') || 'Back';

    // Icon fields
    const completedIconName = getFieldContent(style, 'mantine_stepper_completed_icon');

    // Mantine styling
    const useMantineStyle = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // State for active step management
    const [active, setActive] = useState(initialActive);

    // Navigation handlers
    const nextStep = useCallback(() => {
        if (active < children.length - 1) {
            setActive(active + 1);
        }
    }, [active, children.length]);

    const prevStep = useCallback(() => {
        if (active > 0) {
            setActive(active - 1);
        }
    }, [active]);

    const goToStep = useCallback((stepIndex: number) => {
        if (stepIndex >= 0 && stepIndex < children.length) {
            setActive(stepIndex);
        }
    }, [children.length]);

    // Prepare completed icon
    const completedIcon = completedIconName ? <IconComponent iconName={completedIconName} size={iconSize} /> : undefined;

    // Determine total steps for navigation logic
    const totalSteps = children.length;


    return (
        <div className={cssClass}>
            <Stepper
                active={active}
                onStepClick={allowStepSelect ? goToStep : undefined}
                orientation={orientation as 'horizontal' | 'vertical'}
                allowNextStepsSelect={allowNextClicks}
                size={size}
                color={color}
                radius={radius}
                completedIcon={completedIcon}
            >
                {children.map((child: any, index: number) => {
                    if (!child) return null;

                    // Extract step properties
                    const stepLabel = getFieldContent(child, 'label') || '';
                    const stepDescription = getFieldContent(child, 'description') || '';
                    const withIcon = getFieldContent(child, 'mantine_stepper_step_with_icon') === '1';
                    const iconName = getFieldContent(child, 'mantine_left_icon');
                    const loading = getFieldContent(child, 'mantine_stepper_step_loading') === '1';
                    const stepCssClass = "section-" + child.id + " " + (child.css ?? '');

                    // Get icon component
                    const stepIcon = withIcon && iconName ? <IconComponent iconName={iconName} size={16} /> : undefined;

                    // Get step children
                    const stepChildren = Array.isArray(child.children) ? child.children : [];

                    // Check if this is the last step and should be treated as completed
                    if (useLastStepAsCompleted && index === children.length - 1) {
                        return (
                            <Stepper.Completed
                                key={index}
                            >
                                {stepChildren && stepChildren.length > 0 ? (
                                    stepChildren.map((stepChild: any, stepIndex: number) => (
                                        stepChild ? <BasicStyle key={stepIndex} style={stepChild} /> : null
                                    ))
                                ) : (
                                    // Default content when no children
                                    <div style={{ padding: '1rem 0' }}>
                                        Step content for "{stepLabel}"
                                    </div>
                                )}
                            </Stepper.Completed>
                        );
                    }

                    return (
                        <Stepper.Step
                            key={index}
                            label={stepLabel}
                            description={stepDescription}
                            icon={stepIcon}
                            loading={loading}
                            className={stepCssClass}
                        >
                            {stepChildren && stepChildren.length > 0 ? (
                                stepChildren.map((stepChild: any, stepIndex: number) => (
                                    stepChild ? <BasicStyle key={stepIndex} style={stepChild} /> : null
                                ))
                            ) : (
                                // Default content when no children
                                <div style={{ padding: '1rem 0' }}>
                                    Step content for "{stepLabel}"
                                </div>
                            )}
                        </Stepper.Step>
                    );
                })}
            </Stepper>

            {/* Navigation buttons */}
            {showNavigation && active < totalSteps && (
                <Group justify="center" mt="xl" className='mantine-stepper-navigation-buttons'>
                    {backEnabled && (
                        <Button
                            variant="default"
                            onClick={prevStep}
                            className='mantine-stepper-back-button'
                            disabled={active === 0}
                            color={color}
                        >
                            {backLabel}
                        </Button>
                    )}
                    {true && (
                        <Button
                            onClick={nextStep}
                            className='mantine-stepper-next-button'
                            disabled={active === totalSteps - 1}
                            color={color}
                        >
                            {nextLabel}
                        </Button>
                    )}
                </Group>
            )}
        </div>
    );
};

export default StepperStyle;

