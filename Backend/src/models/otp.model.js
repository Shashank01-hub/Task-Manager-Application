const mongoose = require('mongoose')

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required"]
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: [true, "User is required"]
    },
    otpHash: {
        type: String,
        required: [true, "OTP is required"]
    }
}, {
    timestamps: true
})

const otpModel = mongoose.model("otps", otpSchema)

module.exports = otpModel