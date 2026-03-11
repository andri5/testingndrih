import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import authRoutes from './routes/authRoutes.js'
import scenarioRoutes from './routes/scenarioRoutes.js'
import searchRoutes from './routes/searchRoutes.js'
import stepTypeRoutes from './routes/stepTypeRoutes.js'
import fileRoutes from './routes/fileRoutes.js'
import importRoutes from './routes/importRoutes.js'
import executionRoutes from './routes/executionRoutes.js'
import qaseRoutes from './routes/qaseRoutes.js'
import { errorHandler } from './middleware/auth.js'

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
  max: 100 // limit each IP to 100 requests per windowMs
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

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'testingndrih API - Automated Web Testing Platform',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      scenarios: '/api/scenarios',
      execution: '/api/executions'
    }
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
app.use('/api/qase', qaseRoutes)

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

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ Backend server running on http://localhost:${PORT}`)
  console.log(`📡 API documentation: http://localhost:${PORT}/`)
  console.log(`🏥 Health check: http://localhost:${PORT}/health\n`)
})

export default app
