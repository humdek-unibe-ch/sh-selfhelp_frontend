/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import BasicStyle from './BasicStyle';
import { type IEntryListStyle, type TStyle } from '../../../../types/common/styles.types';

interface IEntryListStyleProps {
    style: IEntryListStyle;
    cssClass: string;
}

// `entry-list` is data-bound on the backend: it is hydrated with one cloned
// child subtree per row from the form-log table before the page is sent to the
// client. The web renderer renders the already-cloned children through the
// normal recursive dispatcher (no second renderer), mirroring the mobile
// `EntryList`.
const EntryListStyle: React.FC<IEntryListStyleProps> = ({ style, cssClass }) => {
    const children = Array.isArray(style.children) ? style.children : [];
    return (
        <div className={cssClass}>
            {children.map((child: TStyle, index: number) =>
                child ? <BasicStyle key={index} style={child} /> : null
            )}
        </div>
    );
};

export default EntryListStyle;
