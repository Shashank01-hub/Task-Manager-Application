const userModel = require('../models/user.model')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const config = require('../config/config')
const {sendEmail} = require('../services/email.service')
const otpModel = require('../models/otp.model')
const {generateOtp, getOtpHtml} = require('../utils/utils')

//register

async function registerUser(req, res) {
    let createdUser = null
    let createdOtp = null

    try{
    const {username, email, password, role} = req.body

    if(!username || !email || !password){
        return res.status(400).json({
            message: "All fields are required"
        })
    }

    const isUserAlreadyExists = await userModel.findOne({
        $or: [
            {username},
            {email}
        ]
    })

    if(isUserAlreadyExists){
        return res.status(400).json({
            message: "User already exist"
        })
    }

    const hash = await bcrypt.hash(password, 10)

    const user = await userModel.create({
        username,
        email,
        password: hash,
        role
    })
    createdUser = user

    const otp = generateOtp()
    const html = getOtpHtml(otp)
    
    const otpHash = await bcrypt.hash(otp, 10)
    createdOtp = await otpModel.create({
        email,
        user: user._id,
        otpHash
    })
    const emailResult = await sendEmail(email, "OTP Verification", `Your OTP code is ${otp}`, html)

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

        if ((!username && !email) || !password) {
            return res.status(400).json({
                message: "Username/email and password are required"
            })
        }

    const isUserFound = await userModel.findOne({
        $or: [
            {username},
            {email}
        ]
    })

    if(!isUserFound){
        return res.status(401).json({
            message: "User not found"
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

    res.cookie("token", token, {
        httpOnly: true,
        sameSite: 'lax'
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
    res.clearCookie("token", {
        httpOnly: true,
        sameSite: 'lax'
    });
    res.status(200).json({
        message: "User logged out successfully"
    })
}

async function verifyEmail(req, res) {
    try {
        const {otp, email} = req.body
        const normalizedEmail = String(email || '').trim().toLowerCase()
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

module.exports = {registerUser, loginUser, logoutUser, verifyEmail}