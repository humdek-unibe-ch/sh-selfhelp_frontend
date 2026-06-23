/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import type React from 'react';
import { type IVersionStyle } from '../../../../types/common/styles.types';

interface IVersionStyleProps {
    style: IVersionStyle;
    cssClass: string;
}

// `version` is a build/version diagnostic style with no CMS content fields. The
// authoritative version surfacing lives on the admin System Maintenance page,
// not in a page section, so — like the mobile `Version` renderer — this renders
// nothing visible. It exists as a real renderer (not an `UnknownStyle`
// fallback) so the established `both`-target style satisfies web/mobile
// registry parity.
const VersionStyle: React.FC<IVersionStyleProps> = () => null;

export default VersionStyle;
