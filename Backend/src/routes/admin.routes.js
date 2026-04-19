const express = require('express')
const adminController = require('../controllers/admin.controllers')

const authMiddleware = require('../../middlewares/auth.middleware')

const router = express.Router()

router.get('/getAllUsers', authMiddleware.authAdmin, adminController.getAllUser)
router.delete('/deleteUser/:id', authMiddleware.authAdmin, adminController.deleteUser)
router.get('/getAllTaskOfAUser/:id', authMiddleware.authAdmin, adminController.getAllTaskOfAUser)
router.get('/getDashboardData', authMiddleware.authAdmin, adminController.getDashboardData)

module.exports = router
