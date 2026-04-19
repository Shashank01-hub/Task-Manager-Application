const express = require('express')
const cookieParser = require('cookie-parser')
const authRoutes = require('./routes/auth.routes')
const taskRoutes = require('./routes/task.routes')
const adminRoutes = require('./routes/admin.routes')

const app = express()
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/task', taskRoutes)
app.use('/api/admin', adminRoutes)


module.exports = app