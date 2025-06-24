import React from 'react';
import { IAlertStyle } from '../../../types/common/styles.types';
import BasicStyle from './BasicStyle';

/**
 * Props interface for AlertStyle component
 */
interface IAlertStyleProps {
    style: IAlertStyle;
}

/**
 * AlertStyle component renders a Bootstrap alert box
 * Supports different alert types and dismissible alerts
 */
const AlertStyle: React.FC<IAlertStyleProps> = ({ style }) => {
    const alertType = style.type?.content || 'primary';
    const isDismissable = style.is_dismissable?.content === '1';

    return (
        <div 
            className={`alert alert-${alertType} ${isDismissable ? 'alert-dismissible' : ''} ${style.css || ''}`}
            role="alert"
        >
            {isDismissable && (
                <button type="button" className="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            )}
            {style.children?.map((childStyle, index) => (
                childStyle ? <BasicStyle key={`${childStyle.id.content}-${index}`} style={childStyle} /> : null
            ))}
        </div>
    );
};

export default AlertStyle; 