import React from 'react';
import type { ITableCellStyle } from '../../../types/common/styles.types';
import { Table } from '@mantine/core';
import BasicStyle from './BasicStyle';

interface ITableCellStyleProps {
    style: ITableCellStyle;
}

const TableCellStyle: React.FC<ITableCellStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    return (
        <Table.Td className={style.css}>
            {children.map((childStyle, index) => (
                childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
            ))}
        </Table.Td>
    );
};

export default TableCellStyle; 