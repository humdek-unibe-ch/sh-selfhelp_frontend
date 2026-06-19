/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import BasicStyle from './BasicStyle';
import { type IDataContainerStyle, type TStyle } from '../../../../types/common/styles.types';

interface IDataContainerStyleProps {
    style: IDataContainerStyle;
    cssClass: string;
}

// data-container is a data-scoped wrapper. The backend resolves the `scope`
// data context and interpolates the subtree's `{{field}}` values server-side, so
// the web renderer renders the already-resolved children through the normal
// recursive dispatcher (no second renderer), mirroring the mobile DataContainer.
const DataContainerStyle: React.FC<IDataContainerStyleProps> = ({ style, cssClass }) => {
    const children = Array.isArray(style.children) ? style.children : [];
    return (
        <div className={cssClass}>
            {children.map((child: TStyle, index: number) =>
                child ? <BasicStyle key={index} style={child} /> : null
            )}
        </div>
    );
};

export default DataContainerStyle;
