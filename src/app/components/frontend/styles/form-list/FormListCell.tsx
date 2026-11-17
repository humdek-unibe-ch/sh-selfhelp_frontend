/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Anchor, Badge, Group, Text, VisuallyHidden } from '@mantine/core';
import type { IFormListColumn, TFormListCellValue } from '../../../../../shared';
import { FormListApi } from '../../../../../api/frontend/form-list.api';
import { formatListCell, isFileCell } from '../../../../../utils/form-list.utils';

interface IFormListCellProps {
    value: TFormListCellValue | undefined;
    column: IFormListColumn;
}

/**
 * One cell, drawn from what the server sent: text, a badge, a number, a date
 * or the download links of a file column. Nothing is computed here; a file
 * link is the server's download route, never a storage path.
 */
export function FormListCell({ value, column }: IFormListCellProps) {
    if (isFileCell(value)) {
        const files = value.files;
        if (files.length === 0) {
            return <EmptyCell />;
        }
        if (column.format === 'image') {
            const first = files[0];
            return (
                <Anchor href={FormListApi.fileHref(first.url)} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element -- authorized proxy URL from the server */}
                    <img
                        src={FormListApi.fileHref(first.url)}
                        alt={first.name}
                        style={{ maxHeight: 40, maxWidth: 72, objectFit: 'cover', display: 'block' }}
                    />
                </Anchor>
            );
        }
        return (
            <Group gap="xs" wrap="wrap">
                {files.map((file) => (
                    <Anchor
                        key={file.index}
                        href={FormListApi.fileHref(file.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="sm"
                    >
                        {file.name}
                    </Anchor>
                ))}
            </Group>
        );
    }

    const text = formatListCell(value, column.format);
    if (text === '') {
        return <EmptyCell />;
    }
    if (column.format === 'badge') {
        return <Badge variant="light" style={{ maxWidth: '100%' }}>{text}</Badge>;
    }
    return <>{text}</>;
}

function EmptyCell() {
    return (
        <>
            <Text span c="dimmed" aria-hidden="true">&mdash;</Text>
            <VisuallyHidden>Empty</VisuallyHidden>
        </>
    );
}
