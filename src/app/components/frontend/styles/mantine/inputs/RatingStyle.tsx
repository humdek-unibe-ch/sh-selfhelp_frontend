import React, { useState, useEffect, useContext } from 'react';
import { Rating, Input } from '@mantine/core';
import {
  IconMoodCry,
  IconMoodSad,
  IconMoodSmile,
  IconMoodHappy,
  IconMoodCrazyHappy,
} from '@tabler/icons-react';
import { getFieldContent, castMantineSize } from '../../../../../../utils/style-field-extractor';
import IconComponent from '../../../../shared/common/IconComponent';
import { IRatingStyle } from '../../../../../../types/common/styles.types';
import { FormFieldValueContext } from '../../FormStyle';

/**
 * Props interface for RatingStyle component
 */
interface IRatingStyleProps {
    style: IRatingStyle;
}

/**
 * Get icon style with color and size
 * @param color - Mantine color name
 * @param size - Icon size in pixels
 * @returns CSS style object
 */
const getIconStyle = (color?: string, size: number = 24) => ({
  width: size,
  height: size,
  color: color ? `var(--mantine-color-${color}-7)` : undefined,
});

/**
 * Convert Mantine size to icon size in pixels
 * @param mantineSize - Mantine size value
 * @returns Icon size in pixels
 */
const getIconSizeFromMantineSize = (mantineSize: string): number => {
  switch (mantineSize) {
    case 'xs':
      return 16;
    case 'sm':
      return 20;
    case 'md':
      return 24;
    case 'lg':
      return 28;
    case 'xl':
      return 32;
    default:
      return 24;
  }
};

/**
 * Get empty icon for smiley rating
 * @param value - Rating value (1-5)
 * @param size - Icon size in pixels
 * @returns Icon component or null
 */
const getEmptyIcon = (value: number, size: number = 24) => {
  const iconStyle = getIconStyle(undefined, size);

  switch (value) {
    case 1:
      return <IconMoodCry style={iconStyle} />;
    case 2:
      return <IconMoodSad style={iconStyle} />;
    case 3:
      return <IconMoodSmile style={iconStyle} />;
    case 4:
      return <IconMoodHappy style={iconStyle} />;
    case 5:
      return <IconMoodCrazyHappy style={iconStyle} />;
    default:
      return null;
  }
};

/**
 * Get full icon for smiley rating with color
 * @param value - Rating value (1-5)
 * @param size - Icon size in pixels
 * @returns Icon component or null
 */
const getFullIcon = (value: number, size: number = 24) => {
  switch (value) {
    case 1:
      return <IconMoodCry style={getIconStyle('red', size)} />;
    case 2:
      return <IconMoodSad style={getIconStyle('orange', size)} />;
    case 3:
      return <IconMoodSmile style={getIconStyle('yellow', size)} />;
    case 4:
      return <IconMoodHappy style={getIconStyle('lime', size)} />;
    case 5:
      return <IconMoodCrazyHappy style={getIconStyle('green', size)} />;
    default:
      return null;
  }
};

/**
 * RatingStyle component renders a Mantine Rating component for star ratings.
 * Supports controlled input, customizable count, fractions, smiles, custom empty/full icons, and highlight selected only.
 *
 * @component
 * @param {IRatingStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Rating with styled configuration
 */
const RatingStyle: React.FC<IRatingStyleProps> = ({ style }) => {
    // Extract standard input field values
    const label = getFieldContent(style, 'label');
    const description = getFieldContent(style, 'description');
    const name = getFieldContent(style, 'name');
    const disabled = getFieldContent(style, 'disabled') === '1';
    const readonly = getFieldContent(style, 'readonly') === '1';
    const initialValue = parseFloat(getFieldContent(style, 'value') || '0');

    // Extract rating-specific field values
    const useSmiles = getFieldContent(style, 'mantine_rating_use_smiles') === '1';
    const emptyIconName = getFieldContent(style, 'mantine_rating_empty_icon');
    const fullIconName = getFieldContent(style, 'mantine_rating_full_icon');
    const highlightSelectedOnly = getFieldContent(style, 'mantine_rating_highlight_selected_only') === '1' || useSmiles ;
    const baseCount = parseInt(getFieldContent(style, 'mantine_rating_count') || '5') as 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
    const fractions = parseInt(getFieldContent(style, 'mantine_rating_fractions') || '1') as 1 | 2 | 3 | 4 | 5;

    // When smiles are enabled, force count to 5
    const count = useSmiles ? 5 : baseCount;

    // Extract Mantine styling field values
    const size = castMantineSize(getFieldContent(style, 'mantine_size'));
    const color = getFieldContent(style, 'mantine_color') || 'yellow';

    // Calculate icon size from Mantine size for proper scaling
    const iconSize = getIconSizeFromMantineSize(size);

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Get form context for pre-populated values
    const formContext = useContext(FormFieldValueContext);
    const formValue = formContext && name ? formContext.getFieldValue(name) : null;

    // Initialize rating value from form context or style configuration
    const [ratingValue, setRatingValue] = useState<number>(() => {
        if (formValue !== null) {
            // Use form value if available
            return parseFloat(formValue) || initialValue;
        }
        // Fallback to style configuration
        return initialValue;
    });

    // Update rating value when form context changes (for record editing)
    useEffect(() => {
        if (formValue !== null) {
            const parsedValue = parseFloat(formValue);
            if (!isNaN(parsedValue)) {
                setRatingValue(parsedValue);
            }
        }
    }, [formValue]);

    // Handle rating change for controlled input
    const handleRatingChange = (value: number) => {
        setRatingValue(value);
        // Here you would typically call an onChange callback passed from parent
        // For now, we just update local state
    };

    // Get icon components - use smiley icons if useSmiles is enabled, otherwise use custom icons
    const emptyIcon = useSmiles
        ? ((value: number) => getEmptyIcon(value, iconSize))
        : (emptyIconName ? <IconComponent iconName={emptyIconName} size={iconSize} /> : undefined);
    const fullIcon = useSmiles
        ? ((value: number) => getFullIcon(value, iconSize))
        : (fullIconName ? <IconComponent iconName={fullIconName} size={iconSize} /> : undefined);

    // Build style object
    const styleObj: React.CSSProperties = {};

    const ratingComponent = (
        <Rating
            name={name}
            value={ratingValue}
            onChange={handleRatingChange}
            count={count}
            fractions={fractions}
            readOnly={readonly || disabled}
            size={size}
            color={color}
            className={cssClass}
            style={styleObj}
            emptySymbol={emptyIcon}
            fullSymbol={fullIcon}
            highlightSelectedOnly={highlightSelectedOnly}
        />
    );

    // Wrap component with label or description if present
    const wrappedComponent = label || description ? (
        <Input.Wrapper
            label={label}
            description={description}
            className={cssClass}
            style={styleObj}
        >
            {ratingComponent}
        </Input.Wrapper>
    ) : (
        ratingComponent
    );

    return wrappedComponent;

};

export default RatingStyle;

