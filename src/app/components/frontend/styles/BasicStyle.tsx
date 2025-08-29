import React, { lazy, Suspense } from 'react';
import { TStyle } from '../../../../types/common/styles.types';

// Lazy load style components to reduce initial bundle size
const AlertStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.AlertStyle })));
const ButtonStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.ButtonStyle })));
const CardStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.CardStyle })));
const CarouselStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.CarouselStyle })));
const ContainerStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.ContainerStyle })));
const DivStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.DivStyle })));
const FormUserInputStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.FormUserInputStyle })));
const HeadingStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.HeadingStyle })));
const ImageStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.ImageStyle })));
const InputStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.InputStyle })));
const JumbotronStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.JumbotronStyle })));
const LinkStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.LinkStyle })));
const LoginStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.LoginStyle })));
const MarkdownStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.MarkdownStyle })));
const RegisterStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.RegisterStyle })));
const SelectStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.SelectStyle })));
const TabsStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.TabsStyle })));
const TextareaStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.TextareaStyle })));
const VideoStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.VideoStyle })));
const AudioStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.AudioStyle })));
const FigureStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.FigureStyle })));
const PlaintextStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.PlaintextStyle })));
const RawTextStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.RawTextStyle })));
const RadioStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.RadioStyle })));
const CheckboxStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.CheckboxStyle })));
const SliderStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.SliderStyle })));
const FormStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.FormStyle })));
const ProgressBarStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.ProgressBarStyle })));
const ModalStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.ModalStyle })));
const HtmlTagStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.HtmlTagStyle })));
const JsonStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.JsonStyle })));
const QuizStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.QuizStyle })));
const NavigationContainerStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.NavigationContainerStyle })));
const AccordionListStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.AccordionListStyle })));
const NestedListStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.NestedListStyle })));
const SortableListStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.SortableListStyle })));
const ValidateStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.ValidateStyle })));
const ResetPasswordStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.ResetPasswordStyle })));
const TwoFactorAuthStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.TwoFactorAuthStyle })));
const TableStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.TableStyle })));
const TableRowStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.TableRowStyle })));
const TableCellStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.TableCellStyle })));
const ShowUserInputStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.ShowUserInputStyle })));
const UnknownStyle = lazy(() => import('./SelfHelpStyles').then(module => ({ default: module.UnknownStyle })));

// Loading fallback for lazy-loaded components
const StyleLoadingFallback = () => (
    <div style={{ minHeight: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '16px', height: '16px', border: '2px solid #e0e0e0', borderTop: '2px solid #007acc', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style jsx>{`
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `}</style>
    </div>
);

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
     * Helper function to wrap lazy-loaded components with Suspense
     */
    const renderWithSuspense = (Component: React.LazyExoticComponent<any>, props: any) => (
        <Suspense fallback={<StyleLoadingFallback />}>
            <Component {...props} />
        </Suspense>
    );

    /**
     * Renders the appropriate style component based on style_name
     */
    switch (style.style_name) {
        // Authentication Styles
        case 'login':
            return renderWithSuspense(LoginStyle, { style });
        case 'register':
            return renderWithSuspense(RegisterStyle, { style });
        case 'validate':
            return renderWithSuspense(ValidateStyle, { style });
        case 'resetPassword':
            return renderWithSuspense(ResetPasswordStyle, { style });
        case 'twoFactorAuth':
            return renderWithSuspense(TwoFactorAuthStyle, { style });

        // Container & Layout Styles
        case 'container':
            return renderWithSuspense(ContainerStyle, { style });
        case 'jumbotron':
            return renderWithSuspense(JumbotronStyle, { style });
        case 'card':
            return renderWithSuspense(CardStyle, { style });
        case 'div':
            return renderWithSuspense(DivStyle, { style });
        case 'alert':
            return renderWithSuspense(AlertStyle, { style });

        // Text & Content Styles
        case 'heading':
            return renderWithSuspense(HeadingStyle, { style });
        case 'markdown':
        case 'markdownInline':
            return renderWithSuspense(MarkdownStyle, { style });
        case 'plaintext':
            return renderWithSuspense(PlaintextStyle, { style });
        case 'rawText':
            return renderWithSuspense(RawTextStyle, { style });
        case 'htmlTag':
            return renderWithSuspense(HtmlTagStyle, { style });

        // Media Styles
        case 'image':
            return renderWithSuspense(ImageStyle, { style });
        case 'carousel':
            return renderWithSuspense(CarouselStyle, { style });
        case 'video':
            return renderWithSuspense(VideoStyle, { style });
        case 'audio':
            return renderWithSuspense(AudioStyle, { style });
        case 'figure':
            return renderWithSuspense(FigureStyle, { style });

        // Navigation & Links Styles
        case 'button':
            return renderWithSuspense(ButtonStyle, { style });
        case 'link':
            return renderWithSuspense(LinkStyle, { style });

        // Form & Input Styles
        case 'form':
            return renderWithSuspense(FormStyle, { style });
        case 'formUserInput':
        case 'formUserInputLog':
        case 'formUserInputRecord':
            return renderWithSuspense(FormUserInputStyle, { style: style as any });
        case 'textarea':
            return renderWithSuspense(TextareaStyle, { style });
        case 'input':
            return renderWithSuspense(InputStyle, { style });
        case 'select':
            return renderWithSuspense(SelectStyle, { style });
        case 'radio':
            return renderWithSuspense(RadioStyle, { style });
        case 'checkbox':
            return renderWithSuspense(CheckboxStyle, { style });
        case 'slider':
            return renderWithSuspense(SliderStyle, { style });

        // Tab Styles
        case 'tabs':
            return renderWithSuspense(TabsStyle, { style });
        case 'tab':
            // Tab components are handled within TabsStyle
            return null;

        // Table Styles
        case 'table':
            return renderWithSuspense(TableStyle, { style });
        case 'tableRow':
            return renderWithSuspense(TableRowStyle, { style });
        case 'tableCell':
            return renderWithSuspense(TableCellStyle, { style });

        // Navigation & Container Styles
        case 'navigationContainer':
            return renderWithSuspense(NavigationContainerStyle, { style });

        // List & Navigation Styles
        case 'accordionList':
            return renderWithSuspense(AccordionListStyle, { style });
        case 'nestedList':
            return renderWithSuspense(NestedListStyle, { style });
        case 'sortableList':
            return renderWithSuspense(SortableListStyle, { style });

        // Progress & UI Elements
        case 'progressBar':
            return renderWithSuspense(ProgressBarStyle, { style });
        case 'quiz':
            return renderWithSuspense(QuizStyle, { style });
        case 'json':
            return renderWithSuspense(JsonStyle, { style });
        case 'showUserInput':
            return renderWithSuspense(ShowUserInputStyle, { style });

        // Unknown/Unsupported styles
        default:
            return renderWithSuspense(UnknownStyle, { style });
    }
};

export default BasicStyle;