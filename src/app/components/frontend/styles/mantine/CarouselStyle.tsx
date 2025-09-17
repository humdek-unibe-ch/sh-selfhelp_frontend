import React from 'react';
import { Carousel } from '@mantine/carousel';
import BasicStyle from '../BasicStyle';
import { ICarouselStyle } from '../../../../../types/common/styles.types';
import IconComponent from '../../../shared/common/IconComponent';
import { getFieldContent } from '../../../../../utils/style-field-extractor';

/**
 * Props interface for CarouselStyle component
 * @interface ICarouselStyleProps
 * @property {ICarouselStyle} style - The carousel style configuration object
 */
interface ICarouselStyleProps {
    style: ICarouselStyle;
}

/**
 * CarouselStyle component renders a Mantine Carousel with configurable options.
 * Supports all Mantine Carousel props including controls, indicators, orientation, and more.
 * Uses BasicStyle for rendering nested carousel slide elements.
 *
 * @component
 * @param {ICarouselStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Carousel or fallback div
 */
const CarouselStyle: React.FC<ICarouselStyleProps> = ({ style }) => {
    // Extract field values using the unified field extraction utility
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Extract Mantine Carousel props
    const height = getFieldContent(style, 'mantine_height');
    const slideSize = getFieldContent(style, 'mantine_carousel_slide_size');
    const slideGap = getFieldContent(style, 'mantine_carousel_slide_gap');
    const orientation = getFieldContent(style, 'mantine_orientation') as 'horizontal' | 'vertical';
    const withControls = getFieldContent(style, 'has_controls') === '1';
    const withIndicators = getFieldContent(style, 'has_indicators') === '1';
    const controlSize = getFieldContent(style, 'mantine_control_size');
    const controlsOffset = getFieldContent(style, 'mantine_carousel_controls_offset');
    const nextControlIcon = getFieldContent(style, 'mantine_carousel_next_control_icon');
    const previousControlIcon = getFieldContent(style, 'mantine_carousel_previous_control_icon');
    const loop = getFieldContent(style, 'mantine_loop') === '1';
    const dragFree = getFieldContent(style, 'drag_free') === '1';
    const align = getFieldContent(style, 'mantine_carousel_align') as 'start' | 'center' | 'end';
    const containScroll = getFieldContent(style, 'mantine_carousel_contain_scroll') as 'auto' | 'trimSnaps' | 'keepSnaps';
    const skipSnaps = getFieldContent(style, 'skip_snaps') === '1';
    const inViewThreshold = getFieldContent(style, 'mantine_carousel_in_view_threshold');
    const duration = getFieldContent(style, 'mantine_carousel_duration');
    const emblaOptionsString = getFieldContent(style, 'mantine_carousel_embla_options');

    // Parse Embla options if provided
    let emblaOptions: any = {};
    if (emblaOptionsString) {
        try {
            emblaOptions = JSON.parse(emblaOptionsString);
        } catch (error) {
            console.warn('Invalid Embla options JSON:', error);
        }
    }

    // Add loop and dragFree to emblaOptions if set
    if (loop) {
        emblaOptions.loop = true;
    }
    if (dragFree) {
        emblaOptions.dragFree = true;
    }
    if (align && align !== 'start') {
        emblaOptions.align = align;
    }
    if (containScroll && containScroll !== 'trimSnaps') {
        emblaOptions.containScroll = containScroll;
    }
    if (skipSnaps) {
        emblaOptions.skipSnaps = true;
    }
    if (inViewThreshold && parseFloat(inViewThreshold) > 0) {
        emblaOptions.inViewThreshold = parseFloat(inViewThreshold);
    }
    if (duration && parseInt(duration) > 0) {
        emblaOptions.duration = parseInt(duration);
    }

    // Get icon components
    const nextIcon = nextControlIcon ? <IconComponent iconName={nextControlIcon} size={16} /> : undefined;
    const previousIcon = previousControlIcon ? <IconComponent iconName={previousControlIcon} size={16} /> : undefined;

    // Generate CSS class name
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Render Mantine Carousel if enabled
    if (use_mantine_style) {
        return (
            <Carousel
                height={height}
                slideSize={slideSize}
                slideGap={slideGap}
                orientation={orientation}
                withControls={withControls}
                withIndicators={withIndicators}
                controlSize={controlSize ? parseInt(controlSize) : undefined}
                controlsOffset={controlsOffset}
                nextControlIcon={nextIcon}
                previousControlIcon={previousIcon}
                emblaOptions={emblaOptions}
                className={cssClass}
            >
                {style.children?.map((child, index) => (
                    child ? (
                        <Carousel.Slide key={index}>
                            <BasicStyle style={child} />
                        </Carousel.Slide>
                    ) : null
                ))}
            </Carousel>
        );
    }

    // Fallback to basic div if Mantine styling is disabled
    return (
        <div className={cssClass}>
            {style.children?.map((child, index) => (
                child ? (
                    <div key={index} className="carousel-slide">
                        <BasicStyle style={child} />
                    </div>
                ) : null
            ))}
        </div>
    );
};

export default CarouselStyle;