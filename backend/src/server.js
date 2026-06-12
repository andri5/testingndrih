import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import swaggerUi from 'swagger-ui-express'
import authRoutes from './routes/authRoutes.js'
import scenarioRoutes from './routes/scenarioRoutes.js'
import searchRoutes from './routes/searchRoutes.js'
import stepTypeRoutes from './routes/stepTypeRoutes.js'
import fileRoutes from './routes/fileRoutes.js'
import importRoutes from './routes/importRoutes.js'
import executionRoutes from './routes/executionRoutes.js'
import recorderRoutes from './routes/recorderRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'
import chainRoutes from './routes/chainRoutes.js'
import schedulerRoutes from './routes/schedulerRoutes.js'
import parallelExecutionRoutes from './routes/parallelExecutionRoutes.js'
import browserMatrixRoutes from './routes/browserMatrixRoutes.js'
import smokeTestRoutes from './routes/smokeTestRoutes.js'
import stressTestRoutes from './routes/stressTestRoutes.js'
import securityTestRoutes from './routes/securityTestRoutes.js'
import apiTestRoutes from './routes/apiTestRoutes.js'
import issueRoutes from './routes/issueRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import apiTokenRoutes from './routes/apiTokenRoutes.js'
import ciRoutes from './routes/ciRoutes.js'
import environmentRoutes from './routes/environmentRoutes.js'
import visualRegressionRoutes from './routes/visualRegressionRoutes.js'
import userRoutes from './routes/userRoutes.js'
import { errorHandler } from './middleware/auth.js'
import { swaggerSpec } from './lib/swagger.js'
import { validateProductionSecurity } from './lib/productionSecurity.js'

validateProductionSecurity()

const app = express()
const PORT = process.env.PORT || 5001

// Middleware — allow Cloudflare Turnstile on login/register
const cspDirectives = helmet.contentSecurityPolicy.getDefaultDirectives()
cspDirectives['script-src'] = ["'self'", 'https://challenges.cloudflare.com']
cspDirectives['frame-src'] = ["'self'", 'https://challenges.cloudflare.com']
cspDirectives['child-src'] = ["'self'", 'https://challenges.cloudflare.com']
cspDirectives['connect-src'] = ["'self'", 'https://challenges.cloudflare.com']
cspDirectives['img-src'] = ["'self'", 'data:', 'https://challenges.cloudflare.com']
cspDirectives['worker-src'] = ["'self'", 'blob:']
cspDirectives['style-src'] = [...(cspDirectives['style-src'] || ["'self'"]), 'https://fonts.googleapis.com']
cspDirectives['font-src'] = [...(cspDirectives['font-src'] || ["'self'"]), 'https://fonts.gstatic.com']

app.use(
  helmet({
    contentSecurityPolicy: { directives: cspDirectives },
  })
)
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Rate limiting
let limiter
if (process.env.NODE_ENV === 'test') {
  // Disable rate limiting in test environment
  limiter = (req, res, next) => next()
} else {
  limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // limit each IP to 1000 requests per windowMs
  })
}
app.use('/api/', limiter)

// Public config for SPA (Turnstile site key at runtime — no frontend rebuild required)
app.get('/api/config/public', (req, res) => {
  const turnstileSiteKey = (
    process.env.TURNSTILE_SITE_KEY ||
    process.env.VITE_TURNSTILE_SITE_KEY ||
    ''
  ).trim()
  res.json({
    turnstileSiteKey,
  })
})

// Health check endpoint
app.get('/health', (req, res) => {
  if (process.env.MAINTENANCE_MODE === 'true') {
    return res.status(503).json({
      status: 'maintenance',
      message: 'Scheduled maintenance in progress',
      timestamp: new Date().toISOString(),
    })
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/scenarios', scenarioRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/step-types', stepTypeRoutes)
app.use('/api/files', fileRoutes)
app.use('/api/import', importRoutes)
app.use('/api/executions', executionRoutes)
app.use('/api/recorder', recorderRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/chains', chainRoutes)
app.use('/api/scheduler', schedulerRoutes)
app.use('/api/parallel', parallelExecutionRoutes)
app.use('/api/browser-matrix', browserMatrixRoutes)
app.use('/api/smoke', smokeTestRoutes)
app.use('/api/stress', stressTestRoutes)
app.use('/api/security', securityTestRoutes)
app.use('/api/api-tests', apiTestRoutes)
app.use('/api/issues', issueRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/tokens', apiTokenRoutes)
app.use('/api/ci', ciRoutes)
app.use('/api/environments', environmentRoutes)
app.use('/api/visual-regression', visualRegressionRoutes)
app.use('/api/users', userRoutes)

// Swagger API docs — available at /api/docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Test Sambil Ngopi Coy API Docs',
  swaggerOptions: { persistAuthorization: true }
}))
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

// Serve screenshot files
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use('/api/screenshots', express.static(path.resolve(__dirname, '../uploads/screenshots')))
app.use('/api/visual', express.static(path.resolve(__dirname, '../uploads/visual')))
app.use('/api/videos', express.static(path.resolve(__dirname, '../uploads/videos')))

// ── Combined-mode: serve built React frontend (Docker) ─────────────────────
// When the container includes a /app/public/index.html (built frontend),
// Express serves the React SPA at / so frontend + backend share one port.
const publicDir = path.resolve(__dirname, '../public')

function getTurnstileSiteKey() {
  return (process.env.TURNSTILE_SITE_KEY || process.env.VITE_TURNSTILE_SITE_KEY || '').trim()
}

function serveSpaIndex(req, res) {
  const indexPath = path.join(publicDir, 'index.html')
  let html = fs.readFileSync(indexPath, 'utf8')
  const siteKey = getTurnstileSiteKey()

  if (siteKey && !html.includes('name="turnstile-site-key"')) {
    const safeKey = siteKey.replace(/"/g, '&quot;')
    html = html.replace(
      '</head>',
      `  <meta name="turnstile-site-key" content="${safeKey}">\n</head>`
    )
  }

  res.type('html').send(html)
}

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir))
  // SPA fallback — inject Turnstile site key meta for captcha on login/register
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next()
    serveSpaIndex(req, res)
  })
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method
  })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500
  })
})

// Global error handlers — prevent unhandled rejections from crashing the process
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection:', reason?.message || reason)
})
process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception:', err.message)
  // Don't exit — keep server running for non-fatal errors
  // Only truly fatal errors (OOM, etc.) should kill the process
})

// Start server
app.listen(PORT, async () => {
  console.log(`\n✅ Backend server running on http://localhost:${PORT}`)
  console.log(`📚 API docs (Swagger): http://localhost:${PORT}/api/docs`)
  console.log(`🏥 Health check: http://localhost:${PORT}/health\n`)

  // Housekeeping: expired reset tokens + stale failed migration rows
  try {
    const { cleanupExpiredResetTokens, cleanupFailedMigrationRecords } =
      await import('./services/maintenanceService.js')
    const tokens = await cleanupExpiredResetTokens()
    const migrations = await cleanupFailedMigrationRecords()
    if (tokens > 0 || migrations > 0) {
      console.log(
        `[MAINTENANCE] Cleared ${tokens} expired reset token(s), ${migrations} failed migration record(s)`
      )
    }
  } catch (err) {
    console.warn('[MAINTENANCE] Skipped:', err.message)
  }

  // Phase 2.4: Initialize scheduler
  try {
    const { schedulerService } = await import('./services/schedulerService.js')
    await schedulerService.initialize()
  } catch (err) {
    console.error('Failed to initialize scheduler:', err.message)
  }
})

export default app
