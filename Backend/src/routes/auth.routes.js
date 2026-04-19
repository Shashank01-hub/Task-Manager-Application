const express = require('express')
const authController = require('../controllers/auth.controllers')

const router = express.Router()

router.post('/register', authController.registerUser)
router.post('/login', authController.loginUser)
router.post('/logout', authController.logoutUser)
router.post('/verify-email', authController.verifyEmail)

module.exports = router

