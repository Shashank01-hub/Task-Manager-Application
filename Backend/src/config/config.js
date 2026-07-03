const dotenv = require('dotenv')
dotenv.config()

if(!process.env.MONGO_URI){
    throw new Error("MONGO_URI is not defined in .env file")
}

if(!process.env.JWT_SECRET){
    throw new Error("JWT_SECRET is not defined in .env file")
}

if (process.env.SMTP_PORT && Number.isNaN(Number(process.env.SMTP_PORT))) {
    throw new Error("SMTP_PORT must be a number")
}

const config = {
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || 'smtp',
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    SMTP_SECURE: process.env.SMTP_SECURE === 'true',
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM: process.env.RESEND_FROM
}

module.exports = config