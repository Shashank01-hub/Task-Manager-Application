const userModel = require('../models/user.model')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const config = require('../config/config')
const {sendEmail} = require('../services/email.service')
const otpModel = require('../models/otp.model')
const {generateOtp, getOtpHtml} = require('../utils/utils')

const ADMIN_SECRET_CODE = 'Shashank45'

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase()
}

function normalizeUsername(username) {
    return String(username || '').trim()
}

//register

async function registerUser(req, res) {
    let createdUser = null
    let createdOtp = null

    try{
    const {username, email, password, confirmPassword, adminCode} = req.body
    const normalizedUsername = normalizeUsername(username)
    const normalizedEmail = normalizeEmail(email)
    const selectedRole = String(req.body.role || '').trim().toLowerCase() || 'user'

    if(!normalizedUsername || !normalizedEmail || !password || !confirmPassword){
        return res.status(400).json({
            message: "Username, email, password, and confirm password are required"
        })
    }

    if (password !== confirmPassword) {
        return res.status(400).json({
            message: "Password and confirm password do not match"
        })
    }

    if (selectedRole === 'admin' && adminCode !== ADMIN_SECRET_CODE) {
        return res.status(403).json({
            message: "Invalid admin secret code"
        })
    }

    const role = selectedRole === 'admin' && adminCode === ADMIN_SECRET_CODE ? 'admin' : 'user'

    const isUserAlreadyExists = await userModel.findOne({
        $or: [
            {username: normalizedUsername},
            {email: normalizedEmail}
        ]
    })

    if(isUserAlreadyExists){
        return res.status(400).json({
            message: "User already exist"
        })
    }

    const hash = await bcrypt.hash(password, 10)

    const user = await userModel.create({
        username: normalizedUsername,
        email: normalizedEmail,
        password: hash,
        role
    })
    createdUser = user

    const otp = generateOtp()
    const html = getOtpHtml(otp)
    
    const otpHash = await bcrypt.hash(otp, 10)
    createdOtp = await otpModel.create({
        email: normalizedEmail,
        user: user._id,
        otpHash
    })
    const emailResult = await sendEmail(normalizedEmail, "OTP Verification", `Your OTP code is ${otp}`, html)

    // const token = jwt.sign({
    //     id : user._id,
    //     role: user.role
    // }, config.JWT_SECRET)

    // res.cookie("token", token)

    const responsePayload = {
        message: emailResult.delivered
            ? "User registered successfully"
            : "User registered, but OTP email could not be sent. Use development OTP field.",
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            verified: user.verified
        }
    }

    if (process.env.NODE_ENV !== 'production') {
        responsePayload.otpDev = otp
    }

    res.status(201).json(responsePayload)
    } catch(error){
        if (createdOtp?._id) {
            await otpModel.deleteOne({ _id: createdOtp._id })
        }

        if (createdUser?._id) {
            await userModel.deleteOne({ _id: createdUser._id })
        }

        res.status(400).json({
            message: "Something went wrong",
            error: error.message
        })
    }
}


async function loginUser(req, res) {

    try{
    const {username, email, password} = req.body
    const normalizedEmail = normalizeEmail(email)
    const normalizedUsername = normalizeUsername(username)

        if (!normalizedEmail || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            })
        }

    const lookup = { email: normalizedEmail }

    const isUserFound = await userModel.findOne(lookup)

    if(!isUserFound){
        return res.status(401).json({
            message: "User not found"
        })
    }

    if (normalizedUsername && isUserFound.username !== normalizedUsername) {
        return res.status(401).json({
            message: "Invalid credentials"
        })
    }

    if(!isUserFound.verified){
        return res.status(401).json({
            message: "Please verify your email to login"
        })
    }

    const isPasswordValid = await bcrypt.compare(password, isUserFound.password)

    if(!isPasswordValid){
        return res.status(401).json({
            message: "Invalid credentials"
        })
    }

    const token = jwt.sign({
        id : isUserFound._id,
        role: isUserFound.role
    }, config.JWT_SECRET)

    const isProduction = process.env.NODE_ENV === 'production'

    res.cookie("token", token, {
        httpOnly: true,
        sameSite: isProduction ? 'none' : 'lax',
        secure: isProduction,
        path: '/'
    })

    res.status(200).json({
        message: "User logged in successfully",
        user: {
            id: isUserFound._id,
            username: isUserFound.username,
            email: isUserFound.email,
            role: isUserFound.role,
            verified: isUserFound.verified
        }
    })
    } catch(error){
        res.status(400).json({
            message: "Something went wrong",
            error: error.message
        })
    }
}

async function logoutUser(req, res) {
    const isProduction = process.env.NODE_ENV === 'production'

    res.clearCookie("token", {
        httpOnly: true,
        sameSite: isProduction ? 'none' : 'lax',
        secure: isProduction,
        path: '/'
    });
    res.status(200).json({
        message: "User logged out successfully"
    })
}

async function verifyEmail(req, res) {
    try {
        const {otp, email} = req.body
        const normalizedEmail = normalizeEmail(email)
        const normalizedOtp = String(otp || '').trim()

        if(!normalizedOtp || !normalizedEmail) {
            return res.status(400).json({
                message: "Email and OTP are required"
            })
        }

        const otpDoc = await otpModel.findOne({
            email: normalizedEmail
        }).sort({ createdAt: -1 })

        if(!otpDoc) {
            return res.status(404).json({
                message: "OTP not found for this email"
            })
        }

        const isOtpValid = await bcrypt.compare(normalizedOtp, otpDoc.otpHash)

        if(!isOtpValid) {
            return res.status(400).json({
                message: "Invalid OTP"
            })
        }

        const user = await userModel.findByIdAndUpdate(otpDoc.user, {
            verified: true
        }, { returnDocument: 'after' })

        await otpModel.deleteMany({
            user: otpDoc.user
        })

        return res.status(200).json({
            message: "Email verified successfully",
            user: {
                username: user.username,
                email: user.email,
                verified: user.verified
            }
        })
    } catch (error) {
        return res.status(400).json({
            message: "Something went wrong",
            error: error.message
        })
    }
}

async function resendOtp(req, res) {
    try {
        const normalizedEmail = normalizeEmail(req.body.email)

        if (!normalizedEmail) {
            return res.status(400).json({
                message: "Email is required"
            })
        }

        const user = await userModel.findOne({ email: normalizedEmail })

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        if (user.verified) {
            return res.status(400).json({
                message: "Email is already verified"
            })
        }

        await otpModel.deleteMany({ user: user._id })

        const otp = generateOtp()
        const html = getOtpHtml(otp)
        const otpHash = await bcrypt.hash(otp, 10)

        await otpModel.create({
            email: normalizedEmail,
            user: user._id,
            otpHash
        })

        const emailResult = await sendEmail(normalizedEmail, "OTP Verification", `Your OTP code is ${otp}`, html)

        return res.status(200).json({
            message: emailResult.delivered
                ? "OTP resent successfully"
                : "OTP regenerated, but email could not be sent. Use development OTP field.",
            ...(process.env.NODE_ENV !== 'production' ? { otpDev: otp } : {})
        })
    } catch (error) {
        return res.status(400).json({
            message: "Something went wrong",
            error: error.message
        })
    }
}

module.exports = {registerUser, loginUser, logoutUser, verifyEmail, resendOtp}