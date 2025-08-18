/**
 * Debug Logger Utility
 * Provides structured logging for development and testing environments.
 * 
 * @module utils/debug-logger
 */

import { DEBUG_CONFIG } from '../config/debug.config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface ILogEntry {
    level: LogLevel;
    message: string;
    component?: string;
    data?: any;
    timestamp: string;
}

class DebugLogger {
    private logs: ILogEntry[] = [];
    private maxLogs = 1000; // Keep last 1000 logs

    private shouldLog(level: LogLevel): boolean {
        if (!DEBUG_CONFIG.logging.enabled) return false;
        
        const levels: Record<LogLevel, number> = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
        
        return levels[level] >= levels[DEBUG_CONFIG.logging.level];
    }

    private formatMessage(level: LogLevel, message: string, component?: string): string {
        const timestamp = DEBUG_CONFIG.logging.showTimestamp 
            ? `[${new Date().toISOString()}]` 
            : '';
        
        const componentName = DEBUG_CONFIG.logging.showComponent && component 
            ? `[${component}]` 
            : '';
        
        const levelIcon = {
            debug: '🐛',
            info: 'ℹ️',
            warn: '⚠️',
            error: '❌'
        }[level];
        
        return `${timestamp} ${levelIcon} ${componentName} ${message}`.trim();
    }

    private addLog(level: LogLevel, message: string, component?: string, data?: any): void {
        const logEntry: ILogEntry = {
            level,
            message,
            component,
            data,
            timestamp: new Date().toISOString()
        };

        this.logs.push(logEntry);
        
        // Keep only the last maxLogs entries
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }

        // Store in window for debugging
        if (typeof window !== 'undefined') {
            (window as any).__DEBUG_LOGS__ = this.logs;
        }
    }

    debug(message: string, component?: string, data?: any): void {
        if (!this.shouldLog('debug')) return;
        
        const formattedMessage = this.formatMessage('debug', message, component);

        this.addLog('debug', message, component, data);
    }

    info(message: string, component?: string, data?: any): void {
        if (!this.shouldLog('info')) return;
        
        const formattedMessage = this.formatMessage('info', message, component);

        this.addLog('info', message, component, data);
    }

    warn(message: string, component?: string, data?: any): void {
        if (!this.shouldLog('warn')) return;
        
        const formattedMessage = this.formatMessage('warn', message, component);

        this.addLog('warn', message, component, data);
    }

    error(message: string, component?: string, data?: any): void {
        if (!this.shouldLog('error')) return;
        
        const formattedMessage = this.formatMessage('error', message, component);

        this.addLog('error', message, component, data);
    }

    /**
     * Performance timing utility
     */
    time(label: string, component?: string): void {
        if (!this.shouldLog('debug')) return;

        this.debug(`Timer started: ${label}`, component);
    }

    timeEnd(label: string, component?: string): void {
        if (!this.shouldLog('debug')) return;

        this.debug(`Timer ended: ${label}`, component);
    }

    /**
     * Group logging for related operations
     */
    group(label: string, component?: string): void {
        if (!this.shouldLog('debug')) return;
        const formattedLabel = this.formatMessage('debug', label, component);
        console.group(formattedLabel);
    }

    groupEnd(): void {
        if (!this.shouldLog('debug')) return;
        console.groupEnd();
    }

    /**
     * Get all stored logs
     */
    getLogs(): ILogEntry[] {
        return [...this.logs];
    }

    /**
     * Clear all logs
     */
    clearLogs(): void {
        this.logs = [];
        if (typeof window !== 'undefined') {
            (window as any).__DEBUG_LOGS__ = [];
        }
    }

    /**
     * Export logs as JSON
     */
    exportLogs(): string {
        return JSON.stringify(this.logs, null, 2);
    }
}

// Create singleton instance
export const debugLogger = new DebugLogger();

// Convenience functions
export const debug = debugLogger.debug.bind(debugLogger);
export const info = debugLogger.info.bind(debugLogger);
export const warn = debugLogger.warn.bind(debugLogger);
export const error = debugLogger.error.bind(debugLogger); 