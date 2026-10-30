/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Modal, Stack, Select, Box, Text, Loader, Alert, Paper, ScrollArea, Code, Group } from '@mantine/core';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageVersionApi } from '../../../../../api/admin/page-version.api';
import { REACT_QUERY_CONFIG } from '../../../../../config/react-query.config';
import { type IPageVersion } from '../../../../../types/responses/admin/page-version.types';
import DOMPurify from 'isomorphic-dompurify';
import classes from './VersionComparisonViewer.module.css';

interface IVersionComparisonViewerProps {
    opened: boolean;
    onClose: () => void;
    pageId: number;
    versions: IPageVersion[];
    initialVersion1Id?: number;
    initialVersion2Id?: number;
}

export function VersionComparisonViewer({
    opened,
    onClose,
    pageId,
    versions,
    initialVersion1Id,
    initialVersion2Id
}: IVersionComparisonViewerProps) {
    // The backend diffs version (old) -> draft (new), so keep the draft (-1) in Version 2.
    const draftLast = (v1: number | null, v2: number | null): [number | null, number | null] =>
        v1 === -1 && v2 !== -1 ? [v2, v1] : [v1, v2];
    const [version1Id, setVersion1Id] = useState<number | null>(() => draftLast(initialVersion1Id || null, initialVersion2Id || null)[0]);
    const [version2Id, setVersion2Id] = useState<number | null>(() => draftLast(initialVersion1Id || null, initialVersion2Id || null)[1]);
    const setVersions = (v1: number | null, v2: number | null) => {
        const [first, second] = draftLast(v1, v2);
        setVersion1Id(first);
        setVersion2Id(second);
    };
    const [format, setFormat] = useState<'unified' | 'side_by_side' | 'json_patch' | 'summary'>('side_by_side');

    // Update state when modal opens with new initial values. Render-phase
    // update tracking the previous inputs (matching the previous effect's
    // [opened, initialVersion1Id, initialVersion2Id] dependency).
    const [prevOpened, setPrevOpened] = useState(opened);
    const [prevInitial1, setPrevInitial1] = useState(initialVersion1Id);
    const [prevInitial2, setPrevInitial2] = useState(initialVersion2Id);
    if (prevOpened !== opened || prevInitial1 !== initialVersion1Id || prevInitial2 !== initialVersion2Id) {
        setPrevOpened(opened);
        setPrevInitial1(initialVersion1Id);
        setPrevInitial2(initialVersion2Id);
        if (opened) {
            setVersions(initialVersion1Id || null, initialVersion2Id || null);
        }
    }

    // Handle draft comparison specially
    const isDraftComparison = version2Id === -1;
    const draftVersionId = version1Id;
    const isSameVersion = version1Id !== null && version1Id === version2Id;

    const { data: comparison, isLoading, error } = useQuery({
        queryKey: isDraftComparison
            ? ['draft-comparison', pageId, draftVersionId, format]
            : REACT_QUERY_CONFIG.QUERY_KEYS.VERSION_COMPARISON(pageId, version1Id, version2Id, format),
        queryFn: () => isDraftComparison
            ? PageVersionApi.compareDraftWithVersion(pageId!, draftVersionId!, format)
            : PageVersionApi.compareVersions(pageId!, version1Id!, version2Id!, { format }),
        enabled: !!pageId && !isSameVersion && (isDraftComparison ? !!draftVersionId : !!version1Id && !!version2Id),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });

    const versionOptions = versions.map(v => ({
        value: v.id.toString(),
        label: v.version_name || `Version ${v.version_number}`
    }));

    // side_by_side is an HTML table, unified is text, json_patch/summary are objects.
    const diff = comparison?.diff;
    const diffText = typeof diff === 'string' ? diff : JSON.stringify(diff ?? null, null, 2);
    const hasNoDifferences = isSameVersion || (!!comparison && (diffText.trim() === '' || diffText === '[]'));
    const diffHtml = useMemo(() => {
        return DOMPurify.sanitize(typeof diff === 'string' ? diff : '', {
            ALLOWED_TAGS: ['table', 'thead', 'tbody', 'tr', 'th', 'td', 'del', 'ins', 'span'],
            ALLOWED_ATTR: ['class', 'colspan'],
        });
    }, [diff]);

    return (
      <Modal
        opened={opened}
        onClose={onClose}
        title="Compare Versions"
        size="xl"
        fullScreen
        closeOnEscape
      >
        <Stack gap="md" h="calc(100vh - 120px)">
          <Paper p="md" withBorder>
            <Group grow>
              <Select
                label="Version 1"
                placeholder="Select first version"
                data={versionOptions}
                value={version1Id?.toString() || null}
                onChange={(value) =>
                  setVersions(value ? parseInt(value) : null, version2Id)
                }
              />
              <Select
                label="Version 2"
                placeholder="Select second version"
                data={versionOptions}
                value={version2Id?.toString() || null}
                onChange={(value) =>
                  setVersions(version1Id, value ? parseInt(value) : null)
                }
              />
              <Select
                label="Format"
                data={[
                  { value: "side_by_side", label: "Side by Side" },
                  { value: "unified", label: "Unified Diff" },
                  { value: "json_patch", label: "JSON Patch" },
                  { value: "summary", label: "Summary" },
                ]}
                value={format}
                onChange={(value) => setFormat(value as 'unified' | 'side_by_side' | 'json_patch' | 'summary')}
              />
            </Group>
          </Paper>

          <Box style={{ flex: 1, overflow: "hidden" }}>
            {isLoading && (
              <Stack align="center" justify="center" h="100%">
                <Loader size="lg" />
                <Text>Loading comparison...</Text>
              </Stack>
            )}

            {error && (
              <Alert color="red" title="Error">
                Failed to load comparison
              </Alert>
            )}

            {hasNoDifferences && (
              <Stack align="center" justify="center" h="100%">
                <Text c="dimmed">No differences between these versions</Text>
              </Stack>
            )}

            {!isLoading && !error && comparison && !hasNoDifferences && (
              <ScrollArea h="100%">
                {format === "side_by_side" ? (
                  <div className={classes.sideBySide} dangerouslySetInnerHTML={{ __html: diffHtml }} />
                ) : (
                  <Code block style={{ whiteSpace: "pre-wrap" }}>
                    {diffText}
                  </Code>
                )}
              </ScrollArea>
            )}

            {(!version1Id || !version2Id) && (
              <Stack align="center" justify="center" h="100%">
                <Text c="dimmed">Select two versions to compare</Text>
              </Stack>
            )}
          </Box>
        </Stack>
      </Modal>
    );
}

