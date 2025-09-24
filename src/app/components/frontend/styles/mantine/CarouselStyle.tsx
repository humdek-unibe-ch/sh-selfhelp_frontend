import React from 'react';
import { Carousel } from '@mantine/carousel';
import BasicStyle from '../BasicStyle';
import { ICarouselStyle } from '../../../../../types/common/styles.types';
import IconComponent from '../../../shared/common/IconComponent';

/**
 * Props interface for CarouselStyle component
 * @interface ICarouselStyleProps
 * @property {ICarouselStyle} style - The carousel style configuration object
 */
/**
 * Props interface for ICarouselStyle component
 */
interface ICarouselStyleProps {
    style: ICarouselStyle;
    styleProps: Record<string, any>;
    cssClass: string;
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
const CarouselStyle: React.FC<ICarouselStyleProps> = ({ style, styleProps, cssClass }) => {
    // Extract field values using the unified field extraction utility
    const use_mantine_style = style.use_mantine_style?.content === '1';

    // Extract Mantine Carousel props
    const height = style.mantine_height?.content;
    const slideSize = style.mantine_carousel_slide_size?.content;
    const slideGap = style.mantine_carousel_slide_gap?.content;
    const orientation = style.mantine_orientation?.content as 'horizontal' | 'vertical';
    const withControls = style.has_controls?.content === '1';
    const withIndicators = style.has_indicators?.content === '1';
    const controlSize = style.mantine_control_size?.content;
    const controlsOffset = style.mantine_carousel_controls_offset?.content;
    const nextControlIcon = style.mantine_carousel_next_control_icon?.content;
    const previousControlIcon = style.mantine_carousel_previous_control_icon?.content;
    const loop = style.mantine_loop?.content === '1';
    const dragFree = style.drag_free?.content === '1';
    const align = style.mantine_carousel_align?.content as 'start' | 'center' | 'end';
    const containScroll = style.mantine_carousel_contain_scroll?.content as 'auto' | 'trimSnaps' | 'keepSnaps';
    const skipSnaps = style.skip_snaps?.content === '1';
    const inViewThreshold = style.mantine_carousel_in_view_threshold?.content;
    const duration = style.mantine_carousel_duration?.content;
    const emblaOptionsString = style.mantine_carousel_embla_options?.content;

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
            {...styleProps} className={cssClass}
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
};

export default CarouselStyle;