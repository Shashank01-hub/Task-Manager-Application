const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const authRoutes = require('./routes/auth.routes')
const taskRoutes = require('./routes/task.routes')
const adminRoutes = require('./routes/admin.routes')

const app = express()
app.use(express.json())
app.use(cookieParser())

const allowedOrigins = String(process.env.FRONTEND_URL || process.env.CORS_ORIGIN || '')
	.split(',')
	.map((origin) => origin.trim())
	.filter(Boolean)

app.use(
	cors({
		origin(origin, callback) {
			if (!origin) {
				return callback(null, true)
			}

			if (!allowedOrigins.length || allowedOrigins.includes(origin)) {
				return callback(null, true)
			}

			return callback(new Error('Not allowed by CORS'))
		},
		credentials: true
	})
)

app.use('/api/auth', authRoutes)
app.use('/api/task', taskRoutes)
app.use('/api/admin', adminRoutes)


module.exports = app