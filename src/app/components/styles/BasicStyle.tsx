import React from 'react';
import type { TStyle } from '../../../types/common/styles.types';
import {
    AlertStyle, ButtonStyle, CardStyle, CarouselStyle, ContainerStyle,
    DivStyle, FormUserInputStyle, HeadingStyle, ImageStyle, InputStyle,
    JumbotronStyle, LinkStyle, MarkdownStyle, SelectStyle, TabsStyle, 
    TextareaStyle, UnknownStyle
} from './SelfHelpStyles';

/**
 * Props interface for BasicStyle component
 * @property {TStyle} style - The style configuration object
 */
interface IBasicStyleProps {
    style: TStyle;
}

/**
 * BasicStyle is a component factory that renders different style components
 * based on the style_name property. It acts as a router for all style types.
 *
 * @param {IBasicStyleProps} props - Component props
 * @returns {JSX.Element | null} The appropriate styled component or null
 */
const BasicStyle: React.FC<IBasicStyleProps> = ({ style }) => {
    if (!style || !style.style_name) {
        return null;
    }

    // Extract common field values from the generic fields object
    const getFieldContent = (fieldName: string): any => {
        if (fieldName in style) {
            return (style as any)[fieldName]?.content;
        }
        return style.fields?.[fieldName]?.content;
    };

    /**
     * Renders the appropriate style component based on style_name
     */
    switch (style.style_name) {
        // Container & Layout Styles
        case 'container':
            return <ContainerStyle style={style} />;
        case 'jumbotron':
            return <JumbotronStyle style={style} />;
        case 'card':
            return <CardStyle style={style} />;
        case 'div':
            return <DivStyle style={style} />;
        case 'alert':
            return <AlertStyle style={style} />;

        // Text & Content Styles
        case 'heading':
            return <HeadingStyle style={style} />;
        case 'markdown':
        case 'markdownInline':
            return <MarkdownStyle style={style} />;
        case 'plaintext':
            return <p className={style.css}>{getFieldContent('text')}</p>;
        case 'rawText':
            return <pre className={style.css}>{getFieldContent('text')}</pre>;

        // Media Styles
        case 'image':
            return <ImageStyle style={style} />;
        case 'carousel':
            return <CarouselStyle style={style} />;
        case 'video':
            return <video 
                className={style.css} 
                controls
                width={getFieldContent('width')}
                height={getFieldContent('height')}
            >
                {getFieldContent('sources')?.map((source: any, index: number) => (
                    <source key={index} src={source.source} type={source.type} />
                ))}
                {getFieldContent('alt')}
            </video>;
        case 'audio':
            return <audio className={style.css} controls>
                {getFieldContent('sources')?.map((source: any, index: number) => (
                    <source key={index} src={source.source} type={source.type} />
                ))}
            </audio>;

        // Navigation & Links Styles
        case 'button':
            return <ButtonStyle style={style} />;
        case 'link':
            return <LinkStyle style={style} />;

        // Form & Input Styles
        case 'formUserInput':
        case 'formUserInputLog':
        case 'formUserInputRecord':
            return <FormUserInputStyle style={style} />;
        case 'textarea':
            return <TextareaStyle style={style} />;
        case 'input':
            return <InputStyle style={style} />;
        case 'select':
            return <SelectStyle style={style} />;

        // Tab Styles
        case 'tabs':
            return <TabsStyle style={style} />;
        case 'tab':
            // Tab components are handled within TabsStyle
            return null;

        // Table Styles
        case 'table':
            return <table className={`table ${style.css || ''}`}>
                <tbody>
                    {style.children?.map((child, index) => 
                        child ? <BasicStyle key={`${child.id.content}-${index}`} style={child} /> : null
                    )}
                </tbody>
            </table>;
        case 'tableRow':
            return <tr className={style.css}>
                {style.children?.map((child, index) => 
                    child ? <BasicStyle key={`${child.id.content}-${index}`} style={child} /> : null
                )}
            </tr>;
        case 'tableCell':
            return <td className={style.css}>
                {style.children?.map((child, index) => 
                    child ? <BasicStyle key={`${child.id.content}-${index}`} style={child} /> : null
                )}
            </td>;

        // Progress & UI Elements
        case 'progressBar':
            const progress = (parseInt(getFieldContent('count') || '0') / parseInt(getFieldContent('count_max') || '100')) * 100;
            return <div className="progress">
                <div 
                    className={`progress-bar progress-bar-${getFieldContent('type') || 'primary'} ${getFieldContent('is_striped') === '1' ? 'progress-bar-striped' : ''}`}
                    style={{ width: `${progress}%` }}
                    role="progressbar"
                >
                    {getFieldContent('has_label') === '1' && `${getFieldContent('count')}/${getFieldContent('count_max')}`}
                </div>
            </div>;

        // Unknown/Unsupported styles
        default:
            return <UnknownStyle style={style} />;
    }
};

export default BasicStyle;