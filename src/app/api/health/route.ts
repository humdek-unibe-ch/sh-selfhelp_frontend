/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * `GET /api/health` — liveness probe for the Next.js BFF process.
 *
 * Deliberately dependency-free: it never touches Symfony, cookies, or the
 * database. A `200` here means "the Node server booted and is serving HTTP",
 * which is exactly the signal the publish verification workflow needs after a
 * production `next build` + `next start` (a successful build does NOT prove the
 * server actually boots). It also doubles as a load-balancer / container
 * liveness endpoint and an uptime-monitor target in real deployments.
 *
 * This is liveness, not readiness — it intentionally does not check backend
 * connectivity so a transient Symfony outage never marks the frontend unhealthy
 * and gets it killed/rescheduled. Add a separate `/api/ready` if a readiness
 * (dependencies reachable) signal is ever required.
 */

import { NextResponse } from 'next/server';

// Never statically cache: the probe must reflect the live running process.
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
    return NextResponse.json(
        {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: Math.round(process.uptime()),
            version: process.env.npm_package_version ?? 'unknown',
        },
        {
            status: 200,
            headers: { 'Cache-Control': 'no-store' },
        }
    );
}
