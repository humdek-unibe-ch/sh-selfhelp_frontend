/**
 * Performance Monitoring Utilities for Development
 * 
 * Provides tools to detect re-render issues, track component performance,
 * and identify potential infinite loops or excessive re-renders.
 * 
 * Custom implementation optimized for React 19
 * 
 * @module utils/performance-monitor
 */

import React, { useEffect, useRef, useState } from 'react';

// Note: why-did-you-render is not compatible with React 19
// Our custom monitoring hooks provide the same functionality without compatibility issues

interface IPropChange {
    propName: string;
    oldValue: any;
    newValue: any;
    timestamp: number;
    renderNumber: number;
}

interface IRenderInfo {
    componentName: string;
    renderCount: number;
    lastRenderTime: number;
    totalRenderTime: number;
    averageRenderTime: number;
    props?: Record<string, any>;
    changedProps?: string[];
    propChangeHistory?: IPropChange[];
}

interface IPerformanceWarning {
    type: 'excessive-renders' | 'slow-render' | 'unstable-props' | 'infinite-loop';
    componentName: string;
    message: string;
    details?: any;
    timestamp: number;
}

// Global store for render tracking
const renderTracker = new Map<string, IRenderInfo>();
const warnings: IPerformanceWarning[] = [];

// Configuration thresholds
const THRESHOLDS = {
    EXCESSIVE_RENDERS: 50,           // Warn if component renders more than this in 10 seconds
    SLOW_RENDER: 16,                 // Warn if render takes longer than 16ms (60fps)
    INFINITE_LOOP_DETECTION: 100,    // Detect potential infinite loop
    WARNING_WINDOW: 10000,           // Time window for excessive render detection (10 seconds)
};

/**
 * Hook to monitor component render performance
 * Only active in development mode
 * 
 * @param componentName - Name of the component being monitored
 * @param props - Component props to track changes
 * @returns Render statistics and warnings
 */
export function useRenderMonitor(componentName: string, props?: Record<string, any>) {
    const renderCountRef = useRef(0);
    const propsRef = useRef<Record<string, any>>(props || {});
    const renderStartTimeRef = useRef(0);
    const firstRenderTimeRef = useRef(Date.now());

    // Only run in development
    if (process.env.NODE_ENV !== 'development') {
        return { renderCount: 0, warnings: [] };
    }

    // Track render start
    renderStartTimeRef.current = performance.now();
    renderCountRef.current += 1;

    useEffect(() => {
        const renderEndTime = performance.now();
        const renderDuration = renderEndTime - renderStartTimeRef.current;
        const currentTime = Date.now();

        // Get or create render info
        let info = renderTracker.get(componentName);
        if (!info) {
            info = {
                componentName,
                renderCount: 0,
                lastRenderTime: currentTime,
                totalRenderTime: 0,
                averageRenderTime: 0,
            };
            renderTracker.set(componentName, info);
        }

        // Update render info
        info.renderCount = renderCountRef.current;
        info.lastRenderTime = currentTime;
        info.totalRenderTime += renderDuration;
        info.averageRenderTime = info.totalRenderTime / info.renderCount;

        // Detect changed props and record history
        if (props) {
            const changedProps: string[] = [];
            const propChanges: IPropChange[] = [];
            
            Object.keys(props).forEach((key) => {
                if (props[key] !== propsRef.current[key]) {
                    changedProps.push(key);
                    
                    // Record the change for history
                    propChanges.push({
                        propName: key,
                        oldValue: propsRef.current[key],
                        newValue: props[key],
                        timestamp: currentTime,
                        renderNumber: info.renderCount
                    });
                }
            });
            
            info.changedProps = changedProps;
            info.props = props;
            
            // Initialize or append to prop change history (keep last 20 changes)
            if (!info.propChangeHistory) {
                info.propChangeHistory = [];
            }
            info.propChangeHistory.push(...propChanges);
            if (info.propChangeHistory.length > 20) {
                info.propChangeHistory = info.propChangeHistory.slice(-20);
            }
            
            propsRef.current = props;
        }

        // Check for performance issues
        checkPerformanceIssues(info, currentTime, renderDuration, firstRenderTimeRef.current);

        // Cleanup old warnings
        cleanupOldWarnings();
    });

    return {
        renderCount: renderCountRef.current,
        warnings: warnings.filter(w => w.componentName === componentName),
    };
}

/**
 * Check for performance issues and log warnings
 */
function checkPerformanceIssues(
    info: IRenderInfo,
    currentTime: number,
    renderDuration: number,
    firstRenderTime: number
) {
    const timeSinceFirstRender = currentTime - firstRenderTime;

    // Check for excessive renders
    if (info.renderCount > THRESHOLDS.EXCESSIVE_RENDERS && timeSinceFirstRender < THRESHOLDS.WARNING_WINDOW) {
        addWarning({
            type: 'excessive-renders',
            componentName: info.componentName,
            message: `Component rendered ${info.renderCount} times in ${(timeSinceFirstRender / 1000).toFixed(1)}s`,
            details: {
                renderCount: info.renderCount,
                averageRenderTime: info.averageRenderTime.toFixed(2),
                changedProps: info.changedProps,
            },
            timestamp: currentTime,
        });
    }

    // Check for potential infinite loop
    if (info.renderCount > THRESHOLDS.INFINITE_LOOP_DETECTION && timeSinceFirstRender < 5000) {
        addWarning({
            type: 'infinite-loop',
            componentName: info.componentName,
            message: `Possible infinite loop detected: ${info.renderCount} renders in ${(timeSinceFirstRender / 1000).toFixed(1)}s`,
            details: {
                renderCount: info.renderCount,
                changedProps: info.changedProps,
            },
            timestamp: currentTime,
        });
    }

    // Check for slow renders
    if (renderDuration > THRESHOLDS.SLOW_RENDER) {
        addWarning({
            type: 'slow-render',
            componentName: info.componentName,
            message: `Slow render detected: ${renderDuration.toFixed(2)}ms`,
            details: {
                renderDuration: renderDuration.toFixed(2),
                changedProps: info.changedProps,
            },
            timestamp: currentTime,
        });
    }

    // Check for unstable props (props changing on every render)
    if (info.changedProps && info.changedProps.length > 0 && info.renderCount > 5) {
        const propChangeFrequency = info.renderCount / info.changedProps.length;
        if (propChangeFrequency > 0.8) {
            addWarning({
                type: 'unstable-props',
                componentName: info.componentName,
                message: `Unstable props detected: ${info.changedProps.join(', ')} change frequently`,
                details: {
                    changedProps: info.changedProps,
                    renderCount: info.renderCount,
                },
                timestamp: currentTime,
            });
        }
    }
}

/**
 * Add a warning to the global warnings array
 * Prevents duplicate warnings within a short time window
 */
function addWarning(warning: IPerformanceWarning) {
    // Check if similar warning exists in last 5 seconds
    const recentWarning = warnings.find(
        (w) =>
            w.componentName === warning.componentName &&
            w.type === warning.type &&
            warning.timestamp - w.timestamp < 5000
    );

    if (!recentWarning) {
        warnings.push(warning);
        console.warn(`[Performance Monitor] ${warning.message}`, warning.details);
    }
}

/**
 * Remove warnings older than 1 minute
 */
function cleanupOldWarnings() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Remove old warnings
    while (warnings.length > 0 && warnings[0].timestamp < oneMinuteAgo) {
        warnings.shift();
    }
}

/**
 * Get all render statistics
 */
export function getRenderStats(): IRenderInfo[] {
    return Array.from(renderTracker.values());
}

/**
 * Get all warnings
 */
export function getWarnings(): IPerformanceWarning[] {
    return [...warnings];
}

/**
 * Reset all tracking data
 */
export function resetPerformanceMonitor() {
    renderTracker.clear();
    warnings.length = 0;
}

/**
 * Hook to track why a component re-rendered
 * Shows which props/state changed
 * 
 * @param componentName - Name of the component
 * @param props - Props to track
 */
export function useWhyDidYouUpdate(componentName: string, props: Record<string, any>) {
    const previousProps = useRef<Record<string, any> | undefined>({});

    if (process.env.NODE_ENV !== 'development') {
        return;
    }

    useEffect(() => {
        if (previousProps.current) {
            const allKeys = Object.keys({ ...previousProps.current, ...props });
            const changedProps: Record<string, { from: any; to: any }> = {};

            allKeys.forEach((key) => {
                if (previousProps.current![key] !== props[key]) {
                    changedProps[key] = {
                        from: previousProps.current![key],
                        to: props[key],
                    };
                }
            });

            if (Object.keys(changedProps).length > 0) {
                console.log(`[Why Did You Update] ${componentName}`, changedProps);
            }
        }

        previousProps.current = props;
    });
}

/**
 * Hook to detect component mount/unmount cycles
 * Useful for detecting unnecessary unmounting
 * 
 * @param componentName - Name of the component
 */
export function useMountMonitor(componentName: string) {
    const mountCountRef = useRef(0);
    const mountTimeRef = useRef(Date.now());

    if (process.env.NODE_ENV !== 'development') {
        return;
    }

    useEffect(() => {
        mountCountRef.current += 1;
        const mountTime = Date.now();
        const timeSinceLastMount = mountTime - mountTimeRef.current;

        if (mountCountRef.current > 1) {
            console.log(
                `[Mount Monitor] ${componentName} remounted (${mountCountRef.current} times, ${timeSinceLastMount}ms since last mount)`
            );

            // Warn if component is remounting frequently
            if (mountCountRef.current > 5 && timeSinceLastMount < 5000) {
                console.warn(
                    `[Mount Monitor] ${componentName} is remounting frequently. Check if parent is creating new keys.`
                );
            }
        }

        mountTimeRef.current = mountTime;

        return () => {
            console.log(`[Mount Monitor] ${componentName} unmounted`);
        };
    }, [componentName]);
}

/**
 * Performance monitoring component wrapper
 * Wraps any component with performance monitoring
 */
export function withPerformanceMonitor<P extends Record<string, any>>(
    Component: React.ComponentType<P>,
    componentName?: string
): React.ComponentType<P> {
    const PerformanceMonitoredComponent: React.FC<P> = (props: P) => {
        const name = componentName || Component.displayName || Component.name || 'Anonymous';
        useRenderMonitor(name, props);
        useMountMonitor(name);

        return React.createElement(Component, props);
    };

    PerformanceMonitoredComponent.displayName = `PerformanceMonitored(${componentName || Component.displayName || Component.name || 'Component'})`;
    
    return PerformanceMonitoredComponent;
}

/**
 * Generate a comprehensive performance report for debugging
 * This report is optimized for AI analysis to identify and fix rendering issues
 * 
 * @returns Markdown-formatted report with all performance data
 */
export function generatePerformanceReport(): string {
    const stats = getRenderStats();
    const warnings = getWarnings();
    const timestamp = new Date().toISOString();
    
    // Sort components by render count (highest first)
    const sortedStats = [...stats].sort((a, b) => b.renderCount - a.renderCount);
    
    // Categorize components by severity
    const critical = sortedStats.filter(s => s.renderCount > 50);
    const problematic = sortedStats.filter(s => s.renderCount > 20 && s.renderCount <= 50);
    const concerning = sortedStats.filter(s => s.renderCount > 10 && s.renderCount <= 20);
    const acceptable = sortedStats.filter(s => s.renderCount >= 4 && s.renderCount <= 10);
    const normal = sortedStats.filter(s => s.renderCount < 4);
    
    let report = `# 🐛 React Performance Analysis Report

**Generated:** ${timestamp}
**Total Components Tracked:** ${stats.length}
**Total Warnings:** ${warnings.length}

---

## 📊 Executive Summary

`;

    // Summary statistics
    if (critical.length > 0) {
        report += `### 🔥 CRITICAL ISSUES (${critical.length} components)\n`;
        report += `**Immediate Action Required** - These components have excessive renders (>50) indicating potential infinite loops\n\n`;
    }
    
    if (problematic.length > 0) {
        report += `### 🚨 PROBLEMATIC (${problematic.length} components)\n`;
        report += `**High Priority** - These components render too frequently (20-50 renders)\n\n`;
    }
    
    if (concerning.length > 0) {
        report += `### ⚠️ CONCERNING (${concerning.length} components)\n`;
        report += `**Medium Priority** - These components should be investigated (11-20 renders)\n\n`;
    }
    
    if (acceptable.length > 0) {
        report += `### ℹ️ ACCEPTABLE (${acceptable.length} components)\n`;
        report += `**Low Priority** - Slightly elevated but may be normal (4-10 renders)\n\n`;
    }
    
    if (normal.length > 0) {
        report += `### ✅ NORMAL (${normal.length} components)\n`;
        report += `These components have healthy render counts (1-3 renders)\n\n`;
    }

    report += `---

## 🔍 Detailed Component Analysis

`;

    // Helper function to safely stringify values
    const safeStringify = (value: any): string => {
        if (value === undefined) return 'undefined';
        if (value === null) return 'null';
        if (typeof value === 'function') return '[Function]';
        if (typeof value === 'object') {
            try {
                const seen = new WeakSet();
                return JSON.stringify(value, (key, val) => {
                    if (typeof val === 'object' && val !== null) {
                        if (seen.has(val)) return '[Circular]';
                        seen.add(val);
                    }
                    if (typeof val === 'function') return '[Function]';
                    return val;
                }, 2);
            } catch {
                return '[Complex Object]';
            }
        }
        return String(value);
    };

    // Function to format component details
    const formatComponent = (stat: IRenderInfo, severity: string) => {
        let section = `### ${severity} ${stat.componentName}\n\n`;
        section += `**Render Count:** ${stat.renderCount}\n`;
        section += `**Average Render Time:** ${stat.averageRenderTime.toFixed(2)}ms\n`;
        section += `**Total Render Time:** ${stat.totalRenderTime.toFixed(2)}ms\n`;
        
        if (stat.changedProps && stat.changedProps.length > 0) {
            section += `**Last Changed Props:** ${stat.changedProps.join(', ')}\n`;
        }
        
        if (stat.props) {
            section += `\n**Current Props Structure:**\n\`\`\`json\n${JSON.stringify(
                Object.keys(stat.props).reduce((acc, key) => {
                    acc[key] = typeof stat.props![key];
                    return acc;
                }, {} as Record<string, string>),
                null,
                2
            )}\n\`\`\`\n`;
        }
        
        // Add detailed prop change history
        if (stat.propChangeHistory && stat.propChangeHistory.length > 0) {
            section += `\n#### 📝 Why Did You Update - Detailed Change Log\n\n`;
            section += `This shows exactly what changed, when, and the before/after values:\n\n`;
            
            // Group changes by render number
            const changesByRender = stat.propChangeHistory.reduce((acc, change) => {
                if (!acc[change.renderNumber]) {
                    acc[change.renderNumber] = [];
                }
                acc[change.renderNumber].push(change);
                return acc;
            }, {} as Record<number, IPropChange[]>);
            
            Object.entries(changesByRender).forEach(([renderNum, changes]) => {
                const firstChange = changes[0];
                const timeAgo = Date.now() - firstChange.timestamp;
                const timeStr = timeAgo < 1000 ? 'just now' : 
                               timeAgo < 60000 ? `${Math.floor(timeAgo / 1000)}s ago` :
                               `${Math.floor(timeAgo / 60000)}m ago`;
                
                section += `**Render #${renderNum}** (${timeStr}):\n`;
                
                changes.forEach(change => {
                    section += `- \`${change.propName}\` changed:\n`;
                    section += `  - **From:** ${safeStringify(change.oldValue)}\n`;
                    section += `  - **To:** ${safeStringify(change.newValue)}\n`;
                    
                    // Detect common issues
                    if (change.oldValue === change.newValue) {
                        section += `  - ⚠️ **ISSUE:** Same value, different reference (not memoized!)\n`;
                    } else if (typeof change.oldValue === 'object' && typeof change.newValue === 'object') {
                        try {
                            if (JSON.stringify(change.oldValue) === JSON.stringify(change.newValue)) {
                                section += `  - ⚠️ **ISSUE:** Objects are equal but references differ (needs memoization)\n`;
                            }
                        } catch {
                            // Can't compare, skip
                        }
                    }
                });
                section += `\n`;
            });
            
            section += `\n**Analysis:**\n`;
            const propChangeCounts = stat.propChangeHistory.reduce((acc, change) => {
                acc[change.propName] = (acc[change.propName] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            
            Object.entries(propChangeCounts).forEach(([propName, count]) => {
                if (count === stat.renderCount) {
                    section += `- ⚠️ \`${propName}\` changed on **EVERY render** (${count}/${stat.renderCount}) - Likely not memoized!\n`;
                } else if (count > stat.renderCount * 0.5) {
                    section += `- ⚠️ \`${propName}\` changed frequently (${count}/${stat.renderCount} renders)\n`;
                } else {
                    section += `- \`${propName}\` changed occasionally (${count}/${stat.renderCount} renders)\n`;
                }
            });
        }
        
        section += `\n`;
        return section;
    };

    // Add critical components
    if (critical.length > 0) {
        report += `## 🔥 CRITICAL COMPONENTS (Immediate Fix Required)\n\n`;
        critical.forEach(stat => {
            report += formatComponent(stat, '🔥');
        });
    }

    // Add problematic components
    if (problematic.length > 0) {
        report += `## 🚨 PROBLEMATIC COMPONENTS\n\n`;
        problematic.forEach(stat => {
            report += formatComponent(stat, '🚨');
        });
    }

    // Add concerning components
    if (concerning.length > 0) {
        report += `## ⚠️ CONCERNING COMPONENTS\n\n`;
        concerning.forEach(stat => {
            report += formatComponent(stat, '⚠️');
        });
    }

    // Add warnings section
    if (warnings.length > 0) {
        report += `---

## ⚠️ Performance Warnings

`;
        
        const groupedWarnings = warnings.reduce((acc, warning) => {
            if (!acc[warning.componentName]) {
                acc[warning.componentName] = [];
            }
            acc[warning.componentName].push(warning);
            return acc;
        }, {} as Record<string, IPerformanceWarning[]>);

        Object.entries(groupedWarnings).forEach(([componentName, componentWarnings]) => {
            report += `### ${componentName}\n\n`;
            componentWarnings.forEach(warning => {
                const icon = warning.type === 'infinite-loop' ? '🔥' : 
                            warning.type === 'excessive-renders' ? '🚨' :
                            warning.type === 'slow-render' ? '⏱️' : '⚠️';
                
                report += `**${icon} ${warning.type.toUpperCase()}**\n`;
                report += `- ${warning.message}\n`;
                
                if (warning.details) {
                    report += `\`\`\`json\n${JSON.stringify(warning.details, null, 2)}\n\`\`\`\n`;
                }
                report += `\n`;
            });
        });
    }

    // Add diagnostic questions
    report += `---

## 🎯 AI Diagnostic Assistant Prompt

Please analyze the above performance data and help me fix the rendering issues. For each problematic component:

1. **Identify the root cause:**
   - Are props being recreated on every render?
   - Is the component being unnecessarily unmounted/remounted?
   - Are there missing \`useMemo\` or \`useCallback\` optimizations?
   - Is there a context provider causing cascading re-renders?
   - Are there unstable references in dependency arrays?

2. **Provide specific fixes:**
   - Show me exactly which props need memoization
   - Identify which \`useEffect\` hooks need fixing
   - Suggest where to add \`React.memo\`, \`useMemo\`, or \`useCallback\`
   - Point out any anti-patterns in my code

3. **Prioritize fixes:**
   - Which components should I fix first?
   - What will have the biggest performance impact?

4. **Code examples:**
   - Show me before/after code for each fix
   - Explain why the fix works

---

## 📋 Additional Context Needed

To better diagnose these issues, please also provide:

1. **Component Source Code** - Share the code of the problematic components
2. **Parent Components** - Show how these components are being rendered
3. **Context Providers** - Share any context providers used by these components
4. **React Query Hooks** - If using data fetching, share the hook implementations
5. **Console Logs** - Copy the \`[Why Did You Update]\` logs from the browser console

---

## 🔗 Related Files to Check

Based on common React performance issues, check these areas:

- \`src/app/components/contexts/*\` - Context providers
- \`src/hooks/*\` - Custom hooks
- \`src/providers/*\` - Provider components
- Component files for: ${sortedStats.slice(0, 5).map(s => s.componentName).join(', ')}

---

**Report End** - Copy this entire report and send it to your AI assistant for analysis.
`;

    return report;
}

/**
 * Copy performance report to clipboard
 * Returns success status
 */
export async function copyPerformanceReportToClipboard(): Promise<boolean> {
    try {
        const report = generatePerformanceReport();
        await navigator.clipboard.writeText(report);
        return true;
    } catch (error) {
        console.error('[Performance Monitor] Failed to copy report to clipboard:', error);
        return false;
    }
}

