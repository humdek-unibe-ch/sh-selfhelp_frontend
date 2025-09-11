import React from 'react';
import { Progress, Text, Group } from '@mantine/core';
import { IProgressBarStyle } from '../../../../types/common/styles.types';
import { getFieldContent, castMantineSize, castMantineRadius } from '../../../../utils/style-field-extractor';

interface IProgressBarStyleProps {
    style: IProgressBarStyle;
}

const ProgressBarStyle: React.FC<IProgressBarStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const value = parseInt(getFieldContent(style, 'value') || '0');
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const size = castMantineSize(getFieldContent(style, 'mantine_size'));
    const radius = castMantineRadius(getFieldContent(style, 'mantine_radius'));
    const animated = getFieldContent(style, 'mantine_progress_animated') === '1';
    const striped = getFieldContent(style, 'mantine_progress_striped') === '1';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Calculate progress percentage (0-100)
    const progressValue = Math.min(100, Math.max(0, value));

    if (use_mantine_style) {
        return (
            <div className={cssClass} style={styleObj}>
                <Group justify="space-between" mb="xs">
                    <Text size="sm">Progress</Text>
                    <Text size="sm" c="dimmed">
                        {progressValue}%
                    </Text>
                </Group>
                <Progress
                    value={progressValue}
                    color={color}
                    size={size}
                    radius={radius}
                    striped={striped}
                    animated={animated}
                />
            </div>
        );
    }

    // Fallback to basic progress bar when Mantine styling is disabled
    return (
        <div className={cssClass} style={styleObj}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '14px'
            }}>
                <span>Progress</span>
                <span style={{ color: '#666' }}>{progressValue}%</span>
            </div>
            <div style={{
                width: '100%',
                height: size === 'xs' ? '4px' : size === 'sm' ? '8px' : size === 'lg' ? '16px' : size === 'xl' ? '20px' : '12px',
                backgroundColor: '#e0e0e0',
                borderRadius: '4px',
                overflow: 'hidden'
            }}>
                <div style={{
                    width: `${progressValue}%`,
                    height: '100%',
                    backgroundColor: color === 'blue' ? '#228be6' :
                                   color === 'green' ? '#40c057' :
                                   color === 'red' ? '#fa5252' :
                                   color === 'yellow' ? '#ffd43b' :
                                   color === 'cyan' ? '#22b8cf' :
                                   color === 'gray' ? '#868e96' : '#228be6',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease',
                    backgroundImage: striped ? 'linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.2) 75%, transparent 75%, transparent)' : 'none',
                    backgroundSize: striped ? '20px 20px' : 'auto',
                    animation: animated ? 'progress-stripes 1s linear infinite' : 'none'
                }} />
            </div>
        </div>
    );
};

export default ProgressBarStyle; 