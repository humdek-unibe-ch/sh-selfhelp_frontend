import React from 'react';
import type { ITableRowStyle } from '../../../types/common/styles.types';
import { Table } from '@mantine/core';
import BasicStyle from './BasicStyle';

interface ITableRowStyleProps {
    style: ITableRowStyle;
}

const TableRowStyle: React.FC<ITableRowStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    return (
        <Table.Tr className={style.css}>
            {children.map((childStyle, index) => (
                childStyle ? <BasicStyle key={`${childStyle.id.content}-${index}`} style={childStyle} /> : null
            ))}
        </Table.Tr>
    );
};

export default TableRowStyle; 