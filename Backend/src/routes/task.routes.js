const express = require('express')
const taskController = require('../controllers/task.controllers')
const authMiddleware = require('../../middlewares/auth.middleware')

const router = express.Router()

router.post("/create", authMiddleware.authUser, taskController.createTask)
router.get("/get", authMiddleware.authUser, taskController.getAllTask)
router.put("/update/:id", authMiddleware.authUser, taskController.updateTask)
router.put("/complete/:id", authMiddleware.authUser, taskController.completeTask)
router.delete("/delete/:id", authMiddleware.authUser, taskController.deleteTask)
router.get("/searchAndFilter", authMiddleware.authUser, taskController.searchAndFilterTask)

module.exports = router
