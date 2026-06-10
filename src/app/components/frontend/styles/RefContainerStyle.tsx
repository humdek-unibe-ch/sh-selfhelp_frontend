/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import BasicStyle from './BasicStyle';
import { IRefContainerStyle } from '../../../../types/common/styles.types';

interface IRefContainerStyleProps {
    style: IRefContainerStyle;
}

// Renders children directly with no wrapper — refContainer is a structural
// reuse mechanism, not a visual container.
const RefContainerStyle: React.FC<IRefContainerStyleProps> = ({ style }) => {
    const children = Array.isArray(style.children) ? style.children : [];
    return (
        <>
            {children.map((child: any, index: number) =>
                child ? <BasicStyle key={index} style={child} /> : null
            )}
        </>
    );
};

export default RefContainerStyle;
