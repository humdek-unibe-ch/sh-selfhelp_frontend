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

function isLoadAsTable(style: IEntryListStyle): boolean {
    const field = style.load_as_table;
    if (field && typeof field === 'object' && 'content' in field) {
        return String(field.content ?? '') === '1';
    }
    return false;
}

// `entry-list` is data-bound on the backend: it is hydrated with one cloned
// child subtree per row from the form-log table before the page is sent to the
// client. The web renderer renders the already-cloned children through the
// normal recursive dispatcher (no second renderer), mirroring the mobile
// `EntryList`.
const EntryListStyle: React.FC<IEntryListStyleProps> = ({ style, cssClass }) => {
    const children = Array.isArray(style.children) ? style.children : [];
    const loadAsTable = isLoadAsTable(style);

    if (loadAsTable) {
        return (
            <div className={cssClass}>
                <table>
                    <tbody>
                        {children.map((child: TStyle, index: number) =>
                            child ? (
                                <tr key={index}>
                                    <td>
                                        <BasicStyle style={child} />
                                    </td>
                                </tr>
                            ) : null
                        )}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className={cssClass}>
            {children.map((child: TStyle, index: number) =>
                child ? <BasicStyle key={index} style={child} /> : null
            )}
        </div>
    );
};

export default EntryListStyle;
