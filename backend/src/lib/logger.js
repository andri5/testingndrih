/**
 * Winston Logger Configuration
 * Centralized logging for TestingNDRIH backend services
 * Levels: error, warn, info, debug
 * Output: Console (dev), Silent (test)
 */

import winston from 'winston'

const isDevelopment = process.env.NODE_ENV !== 'production'
const isTest = process.env.NODE_ENV === 'test'

const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
)

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : ''
    return `${timestamp} [${level}]: ${message} ${metaStr}`
  })
)

// Transports: silent in test, console elsewhere
const transports = []
if (!isTest) {
  transports.push(
    new winston.transports.Console({
      format: isDevelopment ? consoleFormat : customFormat,
      level: isDevelopment ? 'debug' : 'info'
    })
  )
}

// Create logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  format: customFormat,
  transports: transports.length > 0 ? transports : [new winston.transports.Console({ silent: true })],
  exitOnError: false,
  defaultMeta: { service: 'testingndrih-backend' }
})

// Utility functions for common logging patterns
export const logServiceStart = (serviceName) => {
  logger.info(`[${serviceName}] Service started`)
}

export const logServiceEnd = (serviceName) => {
  logger.info(`[${serviceName}] Service completed`)
}

export const logError = (context, error) => {
  logger.error(`[${context}] Error: ${error.message}`, {
    stack: error.stack,
    context
  })
}

export const logDebug = (context, message, data = {}) => {
  logger.debug(`[${context}] ${message}`, data)
}

export const logInfo = (context, message, data = {}) => {
  logger.info(`[${context}] ${message}`, data)
}

export const logWarn = (context, message, data = {}) => {
  logger.warn(`[${context}] ${message}`, data)
}

export default logger
