
export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

type LogEntry = {
    level: LogLevel
    message: string
    context?: string
    data?: unknown
    timestamp: string
    environment: string
}

const isDev = process.env.NODE_ENV === 'development'

class Logger {
    private log(level: LogLevel, message: string, context?: string, data?: unknown) {
        const entry: LogEntry = {
            level,
            message,
            context,
            data,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'unknown'
        }

        // In Dev, pretty print. In Prod, JSON line.
        if (isDev) {
            const color = level === 'error' ? '\x1b[31m' : level === 'warn' ? '\x1b[33m' : '\x1b[32m'
            const reset = '\x1b[0m'
            console.log(`${color}[${level.toUpperCase()}]${reset} [${context || 'Global'}] ${message}`, data || '')
        } else {
            console.log(JSON.stringify(entry))
        }
    }

    info(message: string, context?: string, data?: unknown) { this.log('info', message, context, data) }
    warn(message: string, context?: string, data?: unknown) { this.log('warn', message, context, data) }
    error(message: string, context?: string, error?: unknown) {
        // Serializing Error objects cleanly
        const errData = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error
        this.log('error', message, context, errData)
    }
    debug(message: string, context?: string, data?: unknown) { this.log('debug', message, context, data) }
}

export const logger = new Logger()
