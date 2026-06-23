/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import BasicStyle from './BasicStyle';
import { type ILoopStyle, type TStyle } from '../../../../types/common/styles.types';

interface ILoopStyleProps {
    style: ILoopStyle;
    cssClass: string;
}

// `loop` is a repeater that is data-bound on the backend (the cloned subtree per
// row is produced server-side, same as `entry-list`). The web renderer renders
// the already-cloned children recursively, mirroring the mobile `Loop`.
const LoopStyle: React.FC<ILoopStyleProps> = ({ style, cssClass }) => {
    const children = Array.isArray(style.children) ? style.children : [];
    return (
        <div className={cssClass}>
            {children.map((child: TStyle, index: number) =>
                child ? <BasicStyle key={index} style={child} /> : null
            )}
        </div>
    );
};

export default LoopStyle;
