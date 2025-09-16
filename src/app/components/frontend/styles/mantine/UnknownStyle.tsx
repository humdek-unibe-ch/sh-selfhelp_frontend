import React from 'react';
import { Alert, Text, Code, Group } from '@mantine/core';
import { IconAlertTriangle, IconCode } from '@tabler/icons-react';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { IBaseStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for UnknownStyle component
 * Accepts any style that extends IBaseStyle (including unknown styles)
 */
interface IUnknownStyleProps {
    style: IBaseStyle & { style_name: string };
}

/**
 * UnknownStyle component displays a clear error message when encountering an unsupported style
 * This helps developers and users understand that a style is not implemented yet
 */
const UnknownStyle: React.FC<IUnknownStyleProps> = ({ style }) => {
    // Extract basic information from the style
    const styleName = style.style_name;
    const styleId = style.id;
    const cssClass = "unknown-style section-" + styleId + " " + (style.css ?? '');

    // Extract any content that might be available
    const content = getFieldContent(style, 'content') || getFieldContent(style, 'value') || getFieldContent(style, 'message');

    return (
        <Alert
            variant="light"
            color="orange"
            title="Unknown Style Component"
            icon={<IconAlertTriangle size={20} />}
            className={cssClass}
            style={{ border: '2px dashed #fd7e14' }}
        >
            <Text size="sm" mb="xs">
                The style component <Code color="orange">{styleName}</Code> (ID: {styleId}) is not currently supported or implemented.
            </Text>

            <Group gap="xs" mb="sm">
                <IconCode size={16} />
                <Text size="sm" fw={500}>Style Information:</Text>
            </Group>

            <Text size="xs" c="dimmed" component="div" mb="sm">
                <div>• Style Name: <Code>{styleName}</Code></div>
                <div>• Style ID: <Code>{styleId}</Code></div>
                {content && <div>• Content: {content}</div>}
            </Text>

            <Text size="xs" c="dimmed">
                This component will not render any visual content. Please check the style configuration or contact the development team if you need this style implemented.
            </Text>

            {/* Render children if any exist */}
            {style.children && Array.isArray(style.children) && style.children.length > 0 && (
                <Text size="xs" mt="sm" fw={500}>
                    This style has {style.children.length} child component{style.children.length !== 1 ? 's' : ''} that may also be affected.
                </Text>
            )}
        </Alert>
    );
};

export default UnknownStyle;
