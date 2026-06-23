/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import BasicStyle from './BasicStyle';
import { type IEntryRecordStyle, type TStyle } from '../../../../types/common/styles.types';

interface IEntryRecordStyleProps {
    style: IEntryRecordStyle;
    cssClass: string;
}

// `entry-record` is a single-record container hydrated server-side (the backend
// injects the record's values, including `record_id`, into the cloned subtree).
// The web renderer renders the resolved children recursively, mirroring the
// mobile `EntryRecord`.
const EntryRecordStyle: React.FC<IEntryRecordStyleProps> = ({ style, cssClass }) => {
    const children = Array.isArray(style.children) ? style.children : [];
    return (
        <div className={cssClass}>
            {children.map((child: TStyle, index: number) =>
                child ? <BasicStyle key={index} style={child} /> : null
            )}
        </div>
    );
};

export default EntryRecordStyle;
