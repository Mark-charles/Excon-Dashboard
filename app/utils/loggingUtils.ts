// Logging utilities for EXCON Dashboard
// Manages error.log and task.log files as specified in projectbackground.md

export type LogLevel = 'ERROR' | 'WARN' | 'INFO'
export type TaskStatus = 'COMPLETED' | 'IN_PROGRESS' | 'PLANNED'

interface LogEntry {
  timestamp: string
  level: LogLevel
  component: string
  message: string
}

interface TaskEntry {
  timestamp: string
  status: TaskStatus
  description: string
  details?: string
}

class Logger {
  private formatTimestamp(): string {
    const now = new Date()
    return now.toISOString().replace('T', ' ').substring(0, 19)
  }

  private formatLogEntry(entry: LogEntry): string {
    return `[${entry.timestamp}] [${entry.level}] [${entry.component}] ${entry.message}\n`
  }

  private formatTaskEntry(entry: TaskEntry): string {
    const details = entry.details ? ` - ${entry.details}` : ''
    return `[${entry.timestamp}] ${entry.status} ${entry.description}${details}\n`
  }

  // Error logging for debugging and issue tracking
  error(component: string, message: string, error?: Error): void {
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level: 'ERROR',
      component,
      message: error ? `${message}: ${error.message}` : message
    }
    
    console.error(`[${entry.component}] ${entry.message}`)
    
    // In browser environment, we'll store in localStorage for now
    // In production, this would write to actual log file
    this.appendToErrorLog(this.formatLogEntry(entry))
  }

  warn(component: string, message: string): void {
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level: 'WARN',
      component,
      message
    }
    
    console.warn(`[${entry.component}] ${entry.message}`)
    this.appendToErrorLog(this.formatLogEntry(entry))
  }

  info(component: string, message: string): void {
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level: 'INFO',
      component,
      message
    }
    
    console.info(`[${entry.component}] ${entry.message}`)
    this.appendToErrorLog(this.formatLogEntry(entry))
  }

  // Task logging for project tracking
  logTask(status: TaskStatus, description: string, details?: string): void {
    const entry: TaskEntry = {
      timestamp: this.formatTimestamp(),
      status,
      description,
      details
    }
    
    console.log(`TASK ${entry.status}: ${entry.description}${details ? ` - ${details}` : ''}`)
    this.appendToTaskLog(this.formatTaskEntry(entry))
  }

  private appendToErrorLog(logLine: string): void {
    try {
      const existingLogs = localStorage.getItem('excon_error_log') || ''
      localStorage.setItem('excon_error_log', existingLogs + logLine)
    } catch (error) {
      console.error('Failed to write to error log:', error)
    }
  }

  private appendToTaskLog(logLine: string): void {
    try {
      const existingLogs = localStorage.getItem('excon_task_log') || ''
      localStorage.setItem('excon_task_log', existingLogs + logLine)
    } catch (error) {
      console.error('Failed to write to task log:', error)
    }
  }

  // Utility methods for log management
  getErrorLogs(): string {
    return localStorage.getItem('excon_error_log') || ''
  }

  getTaskLogs(): string {
    return localStorage.getItem('excon_task_log') || ''
  }

  clearErrorLogs(): void {
    localStorage.removeItem('excon_error_log')
  }

  clearTaskLogs(): void {
    localStorage.removeItem('excon_task_log')
  }

  exportLogs(): { errorLog: string; taskLog: string } {
    return {
      errorLog: this.getErrorLogs(),
      taskLog: this.getTaskLogs()
    }
  }
}

// Global logger instance
export const logger = new Logger()

// Convenience functions
export const logError = (component: string, message: string, error?: Error) => 
  logger.error(component, message, error)

export const logWarn = (component: string, message: string) => 
  logger.warn(component, message)

export const logInfo = (component: string, message: string) => 
  logger.info(component, message)

export const logTaskCompleted = (description: string, details?: string) => 
  logger.logTask('COMPLETED', description, details)

export const logTaskInProgress = (description: string, details?: string) => 
  logger.logTask('IN_PROGRESS', description, details)

export const logTaskPlanned = (description: string, details?: string) => 
  logger.logTask('PLANNED', description, details)

// Error boundary integration
export const handleComponentError = (
  component: string,
  error: Error,
  errorInfo?: { componentStack?: string }
) => {
  logError(component, `Component error: ${error.message}`, error)
  if (errorInfo?.componentStack) {
    logError(component, `Component stack: ${errorInfo.componentStack}`)
  }
}

// Global error handler
export const setupGlobalErrorHandling = () => {
  window.addEventListener('error', (event) => {
    logError('GlobalErrorHandler', `Unhandled error: ${event.message}`, event.error)
  })

  window.addEventListener('unhandledrejection', (event) => {
    logError('GlobalErrorHandler', `Unhandled promise rejection: ${event.reason}`)
  })
}
