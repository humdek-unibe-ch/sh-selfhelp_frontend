/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { FormFileCell, getFormFilePaths, getRecordIdsWithFiles } from '../FormFileCell';

/**
 * D5: Admin → Data showed form uploads only as a raw path. File cells now offer
 * view/download links to the access-checked route, never the raw storage path.
 */
const SINGLE = 'uploads/form-files/user_1/section_4113/field_file/1793113614_5a2aa377_report.pdf';
const MULTI = JSON.stringify([
  'uploads/form-files/user_1/section_4113/field_file/1793113614_5a2aa377_a.png',
  'uploads/form-files/user_1/section_4113/field_file/1793113615_0b1c2d3e_b.png',
]);

describe('getFormFilePaths', () => {
  it('reads single and multi-file values and ignores other cells', () => {
    expect(getFormFilePaths(SINGLE)).toEqual([SINGLE]);
    expect(getFormFilePaths(MULTI)).toHaveLength(2);
    expect(getFormFilePaths('just text')).toEqual([]);
    expect(getFormFilePaths('["a","b"]')).toEqual([]);
    expect(getFormFilePaths(null)).toEqual([]);
  });
});

describe('getRecordIdsWithFiles', () => {
  it('keeps only the shown rows that hold uploads, for the table zip', () => {
    const rows = [
      { record_id: 165, section_4115: MULTI },
      { record_id: 164, section_4114: 'note only' },
      { record_id: 163, section_4115: SINGLE },
    ];
    expect(getRecordIdsWithFiles(rows)).toEqual([165, 163]);
  });
});

describe('FormFileCell', () => {
  it('links view and download to the protected route with the original file name', () => {
    renderWithProviders(<FormFileCell recordId={157} fieldKey="section_4115" paths={[SINGLE]} />);

    const view = screen.getByRole('link', { name: 'View report.pdf' });
    const download = screen.getByRole('link', { name: 'Download report.pdf' });
    expect(view).toHaveAttribute('href', '/api/forms/files/157/section_4115?index=0');
    expect(view).toHaveAttribute('target', '_blank');
    expect(download).toHaveAttribute('href', '/api/forms/files/157/section_4115?index=0');
    expect(download).toHaveAttribute('download', 'report.pdf');
    expect(screen.queryByText(/uploads\/form-files/)).not.toBeInTheDocument();
  });

  it('shows a multi-file field as one button opening a list with every file and a zip download', async () => {
    renderWithProviders(<FormFileCell recordId={9} fieldKey="photos" paths={getFormFilePaths(MULTI)} />);

    expect(screen.queryByRole('link', { name: 'Download b.png' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '2 files' }));

    expect(await screen.findByRole('link', { name: 'Download b.png' })).toHaveAttribute('href', '/api/forms/files/9/photos?index=1');
    expect(screen.getByRole('link', { name: 'View a.png' })).toHaveAttribute('href', '/api/forms/files/9/photos?index=0');
    expect(screen.getByRole('link', { name: 'Download all (zip)' })).toHaveAttribute('href', '/api/forms/files/9/photos/zip');
  });
});
