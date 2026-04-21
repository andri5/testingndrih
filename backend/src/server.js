import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import swaggerUi from 'swagger-ui-express'
import authRoutes from './routes/authRoutes.js'
import scenarioRoutes from './routes/scenarioRoutes.js'
import searchRoutes from './routes/searchRoutes.js'
import stepTypeRoutes from './routes/stepTypeRoutes.js'
import fileRoutes from './routes/fileRoutes.js'
import executionRoutes from './routes/executionRoutes.js'
import recorderRoutes from './routes/recorderRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'
import { errorHandler } from './middleware/auth.js'
import { swaggerSpec } from './lib/swagger.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5001

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
})
app.use('/api/', limiter)

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/scenarios', scenarioRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/step-types', stepTypeRoutes)
app.use('/api/files', fileRoutes)
app.use('/api/executions', executionRoutes)
app.use('/api/recorder', recorderRoutes)
app.use('/api/analytics', analyticsRoutes)

// Swagger API docs — available at /api/docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'testingndrih API Docs',
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
app.use('/api/videos', express.static(path.resolve(__dirname, '../uploads/videos')))

// ── Combined-mode: serve built React frontend (Docker) ─────────────────────
// When the container includes a /app/public/index.html (built frontend),
// Express serves the React SPA at / so frontend + backend share one port.
const publicDir = path.resolve(__dirname, '../public')
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir))
  // SPA fallback — all non-API GET requests return index.html (for React Router)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next()
    res.sendFile(path.join(publicDir, 'index.html'))
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
app.listen(PORT, () => {
  console.log(`\n✅ Backend server running on http://localhost:${PORT}`)
  console.log(`� API docs (Swagger): http://localhost:${PORT}/api/docs`)
  console.log(`🏥 Health check: http://localhost:${PORT}/health\n`)
})

export default app
