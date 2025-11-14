/**
 * Performance Monitoring Utilities for Development
 *
 * Provides tools to detect re-render issues, track component performance,
 * and identify potential infinite loops or excessive re-renders.
 *
 * React DevTools Profiler integration for React 19 compatibility
 *
 * @module utils/performance-monitor
 */

import React, { useEffect, useRef } from 'react';
import { debugLogger } from '../utils/debug-logger';

// React DevTools Profiler integration
// Custom performance monitoring system compatible with React 19

interface IPropChange {
    propName: string;
    oldValue: any;
    newValue: any;
    timestamp: number;
    renderNumber: number;
}

interface IRenderEvent {
    renderNumber: number;
    timestamp: number;
    duration: number;
    cause?: string;
    changedProps?: string[];
    changedState?: string[];
    changedContext?: string[];
    changedHooks?: string[];
    stackTrace?: string;
    previousRenderTime?: number;
    timeSinceLastRender?: number;
}

interface IRenderInfo {
    componentName: string;
    renderCount: number;
    lastRenderTime: number;
    totalRenderTime: number;
    averageRenderTime: number;
    props?: Record<string, any>;
    state?: Record<string, any>;
    context?: Record<string, any>;
    hooks?: Record<string, any>;
    changedProps?: string[];
    propChangeHistory?: IPropChange[];
    renderEvents?: IRenderEvent[];
    firstRenderTime?: number;
    totalTimeTracked?: number;
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

// Performance monitoring configuration
let isProfilingEnabled = false;

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
 * @param options - Additional monitoring options
 * @returns Render statistics and warnings
 */
export function useRenderMonitor(
    componentName: string,
    props?: Record<string, any>,
    options: {
        trackState?: boolean;
        trackContext?: boolean;
        trackHooks?: boolean;
        enableStackTrace?: boolean;
    } = {}
) {
    const renderCountRef = useRef(0);
    const propsRef = useRef<Record<string, any>>(props || {});
    const stateRef = useRef<Record<string, any>>({});
    const contextRef = useRef<Record<string, any>>({});
    const hooksRef = useRef<Record<string, any>>({});
    const renderStartTimeRef = useRef(0);
    const lastRenderTimeRef = useRef(0);
    const firstRenderTimeRef = useRef(Date.now());

    // Only run in development
    if (process.env.NODE_ENV !== 'development') {
        return { renderCount: 0, warnings: [], renderEvents: [] };
    }

    // Track render start
    renderStartTimeRef.current = performance.now();
    renderCountRef.current += 1;
    const currentRenderNumber = renderCountRef.current;

    useEffect(() => {
        const renderEndTime = performance.now();
        const renderDuration = renderEndTime - renderStartTimeRef.current;
        const currentTime = Date.now();
        const timeSinceLastRender = lastRenderTimeRef.current ? currentTime - lastRenderTimeRef.current : 0;

        // Get or create render info
        let info = renderTracker.get(componentName);
        if (!info) {
            info = {
                componentName,
                renderCount: 0,
                lastRenderTime: currentTime,
                totalRenderTime: 0,
                averageRenderTime: 0,
                renderEvents: [],
                firstRenderTime: currentTime,
                totalTimeTracked: 0,
            };
            renderTracker.set(componentName, info);
        }

        // Update render info
        info.renderCount = currentRenderNumber;
        info.lastRenderTime = currentTime;
        info.totalRenderTime += renderDuration;
        info.averageRenderTime = info.totalRenderTime / info.renderCount;
        info.totalTimeTracked = currentTime - (info.firstRenderTime || currentTime);

        // Initialize render events array if not exists
        if (!info.renderEvents) {
            info.renderEvents = [];
        }

        // Detect changed props, state, context, and hooks
        const changedProps: string[] = [];
        const changedState: string[] = [];
        const changedContext: string[] = [];
        const changedHooks: string[] = [];
        const propChanges: IPropChange[] = [];

        let renderCause = 'initial';

        // Check props changes - compare actual values, not just references
        if (props) {
            Object.keys(props).forEach((key) => {
                const currentValue = props[key];
                const previousValue = propsRef.current[key];

                // Deep comparison for objects/arrays, shallow for primitives
                const hasChanged = currentValue !== previousValue ||
                    (typeof currentValue === 'object' && currentValue !== null &&
                     typeof previousValue === 'object' && previousValue !== null &&
                     JSON.stringify(currentValue) !== JSON.stringify(previousValue));

                if (hasChanged) {
                    changedProps.push(key);
                    renderCause = 'props';

                    // Record the change for history
                    propChanges.push({
                        propName: key,
                        oldValue: previousValue,
                        newValue: currentValue,
                        timestamp: currentTime,
                        renderNumber: currentRenderNumber
                    });
                }
            });

            info.props = props;
            propsRef.current = { ...props }; // Store a copy to detect deep changes
        }

        // Check state changes (if tracking enabled)
        if (options.trackState && info.state) {
            Object.keys(info.state).forEach((key) => {
                if (info.state![key] !== stateRef.current[key]) {
                    changedState.push(key);
                    if (renderCause === 'initial') renderCause = 'state';
                }
            });
            stateRef.current = info.state;
        }

        // Check context changes (if tracking enabled)
        if (options.trackContext && info.context) {
            Object.keys(info.context).forEach((key) => {
                if (info.context![key] !== contextRef.current[key]) {
                    changedContext.push(key);
                    if (renderCause === 'initial') renderCause = 'context';
                }
            });
            contextRef.current = info.context;
        }

        // Check hooks changes (if tracking enabled)
        if (options.trackHooks && info.hooks) {
            Object.keys(info.hooks).forEach((key) => {
                if (info.hooks![key] !== hooksRef.current[key]) {
                    changedHooks.push(key);
                    if (renderCause === 'initial') renderCause = 'hooks';
                }
            });
            hooksRef.current = info.hooks;
        }

        // If no specific cause detected but it's not the first render, assume parent re-render
        if (renderCause === 'initial' && currentRenderNumber > 1) {
            renderCause = 'parent';
        }

        info.changedProps = changedProps;

        // Initialize or append to prop change history (keep last 20 changes)
        if (!info.propChangeHistory) {
            info.propChangeHistory = [];
        }
        info.propChangeHistory.push(...propChanges);
        if (info.propChangeHistory.length > 20) {
            info.propChangeHistory = info.propChangeHistory.slice(-20);
        }

        // Create render event
        const renderEvent: IRenderEvent = {
            renderNumber: currentRenderNumber,
            timestamp: currentTime,
            duration: renderDuration,
            cause: renderCause,
            changedProps: changedProps.length > 0 ? changedProps : undefined,
            changedState: changedState.length > 0 ? changedState : undefined,
            changedContext: changedContext.length > 0 ? changedContext : undefined,
            changedHooks: changedHooks.length > 0 ? changedHooks : undefined,
            previousRenderTime: lastRenderTimeRef.current || undefined,
            timeSinceLastRender: timeSinceLastRender > 0 ? timeSinceLastRender : undefined,
        };

        // Add stack trace if enabled (only for performance-critical renders)
        if (options.enableStackTrace && (renderDuration > THRESHOLDS.SLOW_RENDER || changedProps.length > 0)) {
            try {
                renderEvent.stackTrace = new Error().stack;
            } catch (e) {
                // Stack trace not available
            }
        }

        // Keep only last 50 render events
        info.renderEvents!.push(renderEvent);
        if (info.renderEvents!.length > 50) {
            info.renderEvents!.shift();
        }

        // Update last render time
        lastRenderTimeRef.current = currentTime;

        // Check for performance issues
        checkPerformanceIssues(info, currentTime, renderDuration, firstRenderTimeRef.current);

        // Cleanup old warnings
        cleanupOldWarnings();
    });

    return {
        renderCount: renderCountRef.current,
        warnings: warnings.filter(w => w.componentName === componentName),
        renderEvents: renderTracker.get(componentName)?.renderEvents || [],
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
 * Enable performance profiling
 */
export function enableProfiling() {
    isProfilingEnabled = true;
    console.log('[Performance Monitor] Performance profiling enabled');
}

/**
 * Disable performance profiling
 */
export function disableProfiling() {
    isProfilingEnabled = false;
    console.log('[Performance Monitor] Performance profiling disabled');
}

/**
 * Reset all tracking data
 */
export function resetPerformanceMonitor() {
    renderTracker.clear();
    warnings.length = 0;
    isProfilingEnabled = false;
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

        // Add render timeline section
        if (stat.renderEvents && stat.renderEvents.length > 0) {
            section += `\n#### 📊 Render Timeline & Causes\n\n`;
            section += `Detailed timeline of recent renders and their causes:\n\n`;

            // Show last 10 render events
            const recentEvents = stat.renderEvents.slice(-10);
            const firstEventTime = recentEvents[0]?.timestamp || Date.now();

            recentEvents.forEach((event, index) => {
                const timeSinceStart = event.timestamp - firstEventTime;
                const timeStr = timeSinceStart < 1000 ? `${timeSinceStart}ms` :
                               timeSinceStart < 60000 ? `${Math.floor(timeSinceStart / 1000)}s` :
                               `${Math.floor(timeSinceStart / 60000)}m`;

                const causeIcon = event.cause === 'props' ? '📥' :
                                event.cause === 'state' ? '💾' :
                                event.cause === 'context' ? '🔗' :
                                event.cause === 'hooks' ? '🪝' :
                                event.cause === 'parent' ? '👨‍👩‍👧‍👦' :
                                event.cause === 'initial' ? '🎯' : '❓';

                section += `**Render #${event.renderNumber}** (${timeStr}) ${causeIcon} **${event.cause}**\n`;
                section += `- Duration: ${event.duration.toFixed(2)}ms\n`;

                if (event.timeSinceLastRender && event.timeSinceLastRender > 0) {
                    const intervalStr = event.timeSinceLastRender < 1000 ? `${event.timeSinceLastRender}ms ago` :
                                      event.timeSinceLastRender < 60000 ? `${Math.floor(event.timeSinceLastRender / 1000)}s ago` :
                                      `${Math.floor(event.timeSinceLastRender / 60000)}m ago`;
                    section += `- Interval: ${intervalStr}\n`;
                }

                if (event.changedProps && event.changedProps.length > 0) {
                    section += `- Changed Props: ${event.changedProps.join(', ')}\n`;
                }

                if (event.changedState && event.changedState.length > 0) {
                    section += `- Changed State: ${event.changedState.join(', ')}\n`;
                }

                if (event.changedContext && event.changedContext.length > 0) {
                    section += `- Changed Context: ${event.changedContext.join(', ')}\n`;
                }

                if (event.changedHooks && event.changedHooks.length > 0) {
                    section += `- Changed Hooks: ${event.changedHooks.join(', ')}\n`;
                }

                // Add stack trace for problematic renders (only in detailed mode)
                if (event.stackTrace && (event.duration > THRESHOLDS.SLOW_RENDER || (event.changedProps && event.changedProps.length > 0))) {
                    section += `- Stack Trace: ${event.stackTrace.split('\n').slice(0, 3).join('\n').substring(0, 200)}...\n`;
                }

                section += `\n`;
            });

            // Add render pattern analysis
            section += `**Render Pattern Analysis:**\n`;
            const causes = recentEvents.reduce((acc, event) => {
                acc[event.cause || 'unknown'] = (acc[event.cause || 'unknown'] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            Object.entries(causes).forEach(([cause, count]) => {
                const percentage = ((count / recentEvents.length) * 100).toFixed(1);
                section += `- ${cause}: ${count} renders (${percentage}%)\n`;
            });

            // Check for rapid re-renders
            const rapidRenders = recentEvents.filter(event => event.timeSinceLastRender && event.timeSinceLastRender < 100).length;
            if (rapidRenders > recentEvents.length * 0.5) {
                section += `- ⚠️ **HIGH FREQUENCY**: ${rapidRenders}/${recentEvents.length} renders within 100ms intervals\n`;
            }
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
    // Add render events summary section
    const allRenderEvents = Array.from(renderTracker.values())
        .flatMap(stat => stat.renderEvents || [])
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20); // Last 20 render events across all components

    if (allRenderEvents.length > 0) {
        report += `---

## 📈 Recent Render Events (Last 20)

`;

        allRenderEvents.forEach((event, index) => {
            const timeAgo = Date.now() - event.timestamp;
            const timeStr = timeAgo < 1000 ? 'just now' :
                           timeAgo < 60000 ? `${Math.floor(timeAgo / 1000)}s ago` :
                           `${Math.floor(timeAgo / 60000)}m ago`;

            const causeIcon = event.cause === 'props' ? '📥' :
                            event.cause === 'state' ? '💾' :
                            event.cause === 'context' ? '🔗' :
                            event.cause === 'hooks' ? '🪝' :
                            event.cause === 'parent' ? '👨‍👩‍👧‍👦' :
                            event.cause === 'initial' ? '🎯' : '❓';

            report += `**${event.renderNumber}** ${causeIcon} **${event.cause || 'unknown'}** (${timeStr})\n`;
            report += `- Duration: ${event.duration.toFixed(2)}ms\n`;

            if (event.changedProps && event.changedProps.length > 0) {
                report += `- Props: ${event.changedProps.join(', ')}\n`;
            }

            if (event.timeSinceLastRender && event.timeSinceLastRender < 100) {
                report += `- ⚠️ Rapid re-render!\n`;
            }

            report += `\n`;
        });
    }

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
 * Hook to check if profiling is enabled
 */
export function useProfilingEnabled() {
    return isProfilingEnabled;
}

/**
 * Generate and log performance report to console
 */
export function logPerformanceReport() {
    const report = generatePerformanceReport();
    console.group('🚀 React Performance Analysis Report');
    console.log(report);
    console.groupEnd();
    return report;
}

/**
 * Simple render logger hook to track component re-renders
 * Logs when a component re-renders and what props changed
 *
 * @param name - Component name for logging
 * @param props - Component props to track changes
 */
export function useRenderLogger(name: string, props: Record<string, any>) {
    const prevProps = React.useRef<Record<string, any>>(props);
    const renderCount = React.useRef(0);
    const lastRenderTime = React.useRef(Date.now());
    const renderStack = React.useRef<string[]>([]);

    renderCount.current += 1;
    const currentTime = Date.now();
    const timeSinceLastRender = currentTime - lastRenderTime.current;

    // Capture stack trace for this render
    const stackTrace = new Error().stack || '';
    const stackLines = stackTrace.split('\n').slice(5, 10); // Get relevant stack frames

    React.useEffect(() => {
        const changedProps: string[] = [];

        // Check for changes in props
        Object.keys(props).forEach(key => {
            const current = props[key];
            const previous = prevProps.current[key];

            if (current !== previous) {
                // For objects/arrays, do a shallow comparison
                if (typeof current === 'object' && current !== null &&
                    typeof previous === 'object' && previous !== null) {
                    // Check if it's an array or plain object
                    if (Array.isArray(current) && Array.isArray(previous)) {
                        if (current.length !== previous.length ||
                            current.some((val, idx) => val !== previous[idx])) {
                            changedProps.push(key);
                        }
                    } else if (!Array.isArray(current) && !Array.isArray(previous)) {
                        // Plain object comparison
                        const currentKeys = Object.keys(current);
                        const previousKeys = Object.keys(previous);
                        if (currentKeys.length !== previousKeys.length ||
                            currentKeys.some(k => (current as any)[k] !== (previous as any)[k])) {
                            changedProps.push(key);
                        }
                    } else {
                        // Different types (object vs array, etc.)
                        changedProps.push(key);
                    }
                } else {
                    // Primitive comparison or null/undefined
                    changedProps.push(key);
                }
            }
        });

        // Analyze what might be causing re-renders
        let cause = 'unknown';
        if (changedProps.length > 0) {
            cause = 'props';
        } else if (renderCount.current > 1) {
            // Look for clues in the stack trace
            if (stackTrace.includes('useState') || stackTrace.includes('setState')) {
                cause = 'state-update';
            } else if (stackTrace.includes('useEffect')) {
                cause = 'useEffect';
            } else if (stackTrace.includes('useContext')) {
                cause = 'context';
            } else if (stackTrace.includes('useReducer')) {
                cause = 'reducer';
            } else if (stackTrace.includes('commitHookEffectListMount') || stackTrace.includes('flushPassiveEffects')) {
                cause = 'parent-re-render';
            } else {
                cause = 'internal-re-render';
            }
        }

        // Always log renders for debugging
        if (renderCount.current === 1) {
            const message = `[RenderLogger] ${name} mounted (render #${renderCount.current})`;
            console.log(message);
            debugLogger.debug(message, name, { renderCount: renderCount.current });
        } else {
            const reason = changedProps.length > 0
                ? `props: [${changedProps.join(', ')}]`
                : `internal (${cause})`;
            const message = `[RenderLogger] ${name} re-rendered (render #${renderCount.current}) after ${timeSinceLastRender}ms because: ${reason}`;
            console.log(message);

            // Also log to debug logger for AI analysis
            debugLogger.debug(message, name, {
                renderCount: renderCount.current,
                timeSinceLastRender,
                reason,
                cause,
                changedProps: changedProps.length > 0 ? changedProps : null
            });

            // Log potential causes for internal re-renders
            if (changedProps.length === 0 && renderCount.current > 2) {
                const warningData = {
                    cause,
                    stackTrace: stackLines.join('\n'),
                    suggestion: getRenderCauseSuggestion(cause, stackTrace)
                };
                console.warn(`[RenderLogger] ${name} internal re-render detected! Possible causes:`, warningData);
                debugLogger.warn(`[RenderLogger] ${name} internal re-render detected!`, name, warningData);
            }
        }

        prevProps.current = { ...props }; // Store a shallow copy
        lastRenderTime.current = currentTime;
    });
}

// Helper function to provide suggestions for render causes
function getRenderCauseSuggestion(cause: string, stackTrace: string): string {
    switch (cause) {
        case 'state-update':
            return 'Check useState setters called in render or effects without proper dependencies';
        case 'useEffect':
            return 'useEffect running without proper dependency array or cleanup function';
        case 'context':
            return 'Context value changed - check context provider memoization';
        case 'parent-re-render':
            return 'Parent component re-rendered - check if parent is memoized or has stable props';
        case 'internal-re-render':
            return 'Component re-rendering internally - check useMemo dependencies, object creation in render, or unstable references';
        default:
            return 'Unknown cause - check component logic for state updates or hook dependencies';
    }
}

/**
 * Copy performance report to clipboard
 * Returns success status
 */
export async function copyPerformanceReportToClipboard(): Promise<boolean> {
    try {
        const report = generatePerformanceReport();
        await navigator.clipboard.writeText(report);
        console.log('📋 Performance report copied to clipboard!');
        return true;
    } catch (error) {
        console.error('[Performance Monitor] Failed to copy report to clipboard:', error);
        return false;
    }
}

/**
 * Get current performance stats
 */
export function getCurrentPerformanceStats() {
    return {
        renderTracker: Array.from(renderTracker.entries()),
        warnings: [...warnings],
        isProfilingEnabled
    };
}

// Make functions available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    (window as any).performanceMonitor = {
        logReport: logPerformanceReport,
        copyReport: copyPerformanceReportToClipboard,
        getStats: getCurrentPerformanceStats,
        enableProfiling,
        disableProfiling,
        reset: resetPerformanceMonitor
    };

    console.log('🔍 Performance Monitor available globally as window.performanceMonitor');
    console.log('Usage:');
    console.log('  window.performanceMonitor.logReport() - Log detailed report to console');
    console.log('  window.performanceMonitor.copyReport() - Copy report to clipboard');
    console.log('  window.performanceMonitor.getStats() - Get current stats');
}

