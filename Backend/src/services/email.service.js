const nodemailer = require('nodemailer');
const config = require('../config/config');

function createTransporter() {
    if (config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS) {
        return nodemailer.createTransport({
            host: config.SMTP_HOST,
            port: config.SMTP_PORT,
            secure: config.SMTP_SECURE,
            auth: {
                user: config.SMTP_USER,
                pass: config.SMTP_PASS
            }
        })
    }

    return nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true
    })
}

const transporter = createTransporter()

const sendEmail = async(to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: config.SMTP_FROM || config.SMTP_USER || 'no-reply@task-orbit.local',
            to,
            subject,
            text,
            html
        })
        console.log("Message sent: %s", info.messageId)
        if (!config.SMTP_HOST) {
            console.log('SMTP is not configured; message was buffered locally for development only.')
        }
        return { delivered: Boolean(config.SMTP_HOST), info }
    } catch (error) {
        console.error("Error sending email:", error.message)
        return { delivered: false, error: error.message }
    }
}

module.exports = {sendEmail}