const nodemailer = require('nodemailer')
const config = require('../config/config')

function createSmtpTransporter() {
    if (config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS) {
        return nodemailer.createTransport({
            host: config.SMTP_HOST,
            port: config.SMTP_PORT,
            secure: config.SMTP_SECURE,
            auth: {
                user: config.SMTP_USER,
                pass: config.SMTP_PASS
            },
            requireTLS: !config.SMTP_SECURE
        })
    }

    return nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true
    })
}

const smtpTransporter = createSmtpTransporter()

async function verifySmtpTransporter() {
    if (!config.SMTP_HOST) {
        console.log('SMTP is not configured; using buffered local transport only.')
        return false
    }

    try {
        await smtpTransporter.verify()
        console.log('SMTP transport verified successfully.')
        return true
    } catch (error) {
        console.error('SMTP verification failed:', error.message)
        return false
    }
}

verifySmtpTransporter()

async function sendViaSmtp(to, subject, text, html) {
    const info = await smtpTransporter.sendMail({
        from: config.SMTP_FROM || config.SMTP_USER || 'no-reply@task-orbit.local',
        to,
        subject,
        text,
        html
    })

    console.log('Message sent: %s', info.messageId)
    if (info.accepted?.length) {
        console.log('Accepted recipients: %s', info.accepted.join(', '))
    }
    if (info.rejected?.length) {
        console.warn('Rejected recipients: %s', info.rejected.join(', '))
    }

    if (!config.SMTP_HOST) {
        console.log('SMTP is not configured; message was buffered locally for development only.')
    }

    return {
        delivered: Boolean(config.SMTP_HOST) && !info.rejected?.length,
        accepted: info.accepted || [],
        rejected: info.rejected || [],
        messageId: info.messageId,
        envelope: info.envelope || null,
        provider: config.SMTP_HOST ? 'smtp' : 'stream'
    }
}

const sendEmail = async (to, subject, text, html) => {
    try {
        return await sendViaSmtp(to, subject, text, html)
    } catch (error) {
        console.error('Error sending email:', error.message)
        return { delivered: false, error: error.message }
    }
}

module.exports = { sendEmail }