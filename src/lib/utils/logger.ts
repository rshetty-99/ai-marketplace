/**
 * Comprehensive logging utility for the AI Marketplace
 * Supports structured logging, different log levels, and integration with external services
 */

import { NextRequest } from 'next/server';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogContext {
  userId?: string;
  organizationId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  tags?: string[];
}

export interface LogTransport {
  log(entry: LogEntry): Promise<void> | void;
}

/**
 * Console transport for development
 */
class ConsoleTransport implements LogTransport {
  private colors = {
    [LogLevel.DEBUG]: '\x1b[36m', // Cyan
    [LogLevel.INFO]: '\x1b[32m',  // Green
    [LogLevel.WARN]: '\x1b[33m',  // Yellow
    [LogLevel.ERROR]: '\x1b[31m', // Red
    [LogLevel.FATAL]: '\x1b[35m'  // Magenta
  };

  private reset = '\x1b[0m';

  log(entry: LogEntry): void {
    const color = this.colors[entry.level] || '';
    const levelName = LogLevel[entry.level];
    const timestamp = new Date(entry.timestamp).toISOString();
    
    let output = `${color}[${timestamp}] ${levelName}:${this.reset} ${entry.message}`;
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      output += '\n  Context: ' + JSON.stringify(entry.context, null, 2);
    }
    
    if (entry.error) {
      output += '\n  Error: ' + entry.error.name + ': ' + entry.error.message;
      if (entry.error.stack && process.env.NODE_ENV === 'development') {
        output += '\n  Stack: ' + entry.error.stack;
      }
    }
    
    if (entry.tags && entry.tags.length > 0) {
      output += '\n  Tags: ' + entry.tags.join(', ');
    }

    console.log(output);
  }
}

/**
 * File transport for production logging
 */
class FileTransport implements LogTransport {
  constructor(private filename: string) {}

  async log(entry: LogEntry): Promise<void> {
    if (typeof window !== 'undefined') {
      return; // Skip file logging in browser
    }

    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const logDir = path.dirname(this.filename);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const logLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.filename, logLine);
    } catch (error) {
      console.error('Failed to write log to file:', error);
    }
  }
}

/**
 * External service transport (for services like DataDog, New Relic, etc.)
 */
class ExternalServiceTransport implements LogTransport {
  constructor(
    private endpoint: string,
    private apiKey: string,
    private headers?: Record<string, string>
  ) {}

  async log(entry: LogEntry): Promise<void> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...this.headers
        },
        body: JSON.stringify(entry)
      });

      if (!response.ok) {
        console.error('Failed to send log to external service:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending log to external service:', error);
    }
  }
}

/**
 * Main logger class
 */
export class Logger {
  private transports: LogTransport[] = [];
  private minLevel: LogLevel = LogLevel.INFO;
  private globalContext: LogContext = {};

  constructor() {
    // Default console transport
    this.addTransport(new ConsoleTransport());

    // Add file transport in production
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
      this.addTransport(new FileTransport('./logs/app.log'));
    }

    // Add external service transport if configured
    if (process.env.LOG_ENDPOINT && process.env.LOG_API_KEY) {
      this.addTransport(new ExternalServiceTransport(
        process.env.LOG_ENDPOINT,
        process.env.LOG_API_KEY
      ));
    }

    // Set log level from environment
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    if (envLevel && envLevel in LogLevel) {
      this.minLevel = LogLevel[envLevel as keyof typeof LogLevel];
    }
  }

  addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  setGlobalContext(context: LogContext): void {
    this.globalContext = { ...this.globalContext, ...context };
  }

  private async writeLog(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
    tags?: string[]
  ): Promise<void> {
    if (level < this.minLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.globalContext, ...context },
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      tags
    };

    // Write to all transports
    await Promise.all(
      this.transports.map(transport => {
        try {
          return transport.log(entry);
        } catch (error) {
          console.error('Transport error:', error);
        }
      })
    );
  }

  debug(message: string, context?: LogContext, tags?: string[]): void {
    this.writeLog(LogLevel.DEBUG, message, context, undefined, tags);
  }

  info(message: string, context?: LogContext, tags?: string[]): void {
    this.writeLog(LogLevel.INFO, message, context, undefined, tags);
  }

  warn(message: string, context?: LogContext, tags?: string[]): void {
    this.writeLog(LogLevel.WARN, message, context, undefined, tags);
  }

  error(message: string, error?: Error, context?: LogContext, tags?: string[]): void {
    this.writeLog(LogLevel.ERROR, message, context, error, tags);
  }

  fatal(message: string, error?: Error, context?: LogContext, tags?: string[]): void {
    this.writeLog(LogLevel.FATAL, message, context, error, tags);
  }

  // Convenience methods for common scenarios
  
  logRequest(req: NextRequest, context?: LogContext): void {
    const requestContext: LogContext = {
      method: req.method,
      url: req.url,
      ip: req.ip || req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      userId: req.headers.get('x-user-id') || undefined,
      organizationId: req.headers.get('x-organization-id') || undefined,
      requestId: req.headers.get('x-request-id') || crypto.randomUUID(),
      ...context
    };

    this.info('Incoming request', requestContext, ['request']);
  }

  logResponse(
    req: NextRequest,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    const responseContext: LogContext = {
      method: req.method,
      url: req.url,
      statusCode,
      duration,
      userId: req.headers.get('x-user-id') || undefined,
      organizationId: req.headers.get('x-organization-id') || undefined,
      requestId: req.headers.get('x-request-id') || undefined,
      ...context
    };

    const level = statusCode >= 500 ? LogLevel.ERROR : 
                  statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    
    const message = `Response ${statusCode} in ${duration}ms`;
    
    this.writeLog(level, message, responseContext, undefined, ['response']);
  }

  logDatabaseOperation(
    operation: string,
    collection: string,
    duration: number,
    success: boolean,
    context?: LogContext
  ): void {
    const dbContext: LogContext = {
      operation,
      collection,
      duration,
      success,
      ...context
    };

    const message = `Database ${operation} on ${collection} - ${success ? 'SUCCESS' : 'FAILED'} (${duration}ms)`;
    
    this.writeLog(
      success ? LogLevel.DEBUG : LogLevel.ERROR,
      message,
      dbContext,
      undefined,
      ['database']
    );
  }

  logPayment(
    action: string,
    paymentId: string,
    amount: number,
    currency: string,
    success: boolean,
    context?: LogContext
  ): void {
    const paymentContext: LogContext = {
      action,
      paymentId,
      amount,
      currency,
      success,
      ...context
    };

    const message = `Payment ${action} - ${success ? 'SUCCESS' : 'FAILED'}`;
    
    this.writeLog(
      LogLevel.INFO,
      message,
      paymentContext,
      undefined,
      ['payment', 'financial']
    );
  }

  logAuth(
    action: string,
    userId?: string,
    success: boolean = true,
    context?: LogContext
  ): void {
    const authContext: LogContext = {
      action,
      userId,
      success,
      ...context
    };

    const message = `Authentication ${action} - ${success ? 'SUCCESS' : 'FAILED'}`;
    
    this.writeLog(
      success ? LogLevel.INFO : LogLevel.WARN,
      message,
      authContext,
      undefined,
      ['auth', 'security']
    );
  }

  logAudit(
    action: string,
    userId: string,
    resourceType: string,
    resourceId: string,
    changes?: Record<string, any>,
    context?: LogContext
  ): void {
    const auditContext: LogContext = {
      action,
      userId,
      resourceType,
      resourceId,
      changes,
      ...context
    };

    this.info(`Audit: ${action} on ${resourceType}`, auditContext, ['audit', 'compliance']);
  }

  logPerformance(
    operation: string,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    const perfContext: LogContext = {
      operation,
      duration,
      ...metadata
    };

    const level = duration > 5000 ? LogLevel.WARN : LogLevel.DEBUG;
    const message = `Performance: ${operation} completed in ${duration}ms`;
    
    this.writeLog(level, message, perfContext, undefined, ['performance']);
  }

  // Security-related logging
  logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context?: LogContext
  ): void {
    const securityContext: LogContext = {
      event,
      severity,
      ...context
    };

    const level = severity === 'critical' ? LogLevel.FATAL :
                  severity === 'high' ? LogLevel.ERROR :
                  severity === 'medium' ? LogLevel.WARN : LogLevel.INFO;

    this.writeLog(level, `Security Event: ${event}`, securityContext, undefined, ['security']);
  }

  // Business metrics logging
  logMetric(
    metric: string,
    value: number,
    unit?: string,
    tags?: string[],
    context?: LogContext
  ): void {
    const metricContext: LogContext = {
      metric,
      value,
      unit,
      ...context
    };

    this.info(`Metric: ${metric} = ${value}${unit ? ` ${unit}` : ''}`, metricContext, ['metric', ...(tags || [])]);
  }
}

// Create global logger instance
export const logger = new Logger();

/**
 * Request logging middleware
 */
export function withRequestLogging<T>(
  handler: (req: NextRequest, ...args: any[]) => Promise<T>
) {
  return async (req: NextRequest, ...args: any[]): Promise<T> => {
    const startTime = Date.now();
    
    // Log incoming request
    logger.logRequest(req);
    
    try {
      const result = await handler(req, ...args);
      
      // Log successful response
      const duration = Date.now() - startTime;
      logger.logResponse(req, 200, duration);
      
      return result;
    } catch (error) {
      // Log error response
      const duration = Date.now() - startTime;
      const statusCode = error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode 
        : 500;
      
      logger.logResponse(req, statusCode, duration);
      logger.error('Request failed', error as Error, {
        method: req.method,
        url: req.url,
        duration
      });
      
      throw error;
    }
  };
}

/**
 * Performance monitoring decorator
 */
export function withPerformanceLogging(operationName: string) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method = descriptor.value!;

    descriptor.value = (async function (this: any, ...args: any[]) {
      const startTime = Date.now();
      
      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - startTime;
        logger.logPerformance(operationName, duration);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.logPerformance(operationName, duration, { error: true });
        throw error;
      }
    }) as T;

    return descriptor;
  };
}

// Export log utilities
export { LogLevel };
export type { LogContext, LogEntry, LogTransport };