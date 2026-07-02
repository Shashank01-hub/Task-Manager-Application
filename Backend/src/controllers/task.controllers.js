const taskModel = require('../models/task.model')
const userModel = require('../models/user.model')


//CREATE TASK

async function createTask(req, res){
    try{
        const status = req.body.status === 'completed' ? 'completed' : 'pending'
        const task = await taskModel.create({
            ...req.body,
            status,
            completedAt: status === 'completed' ? new Date() : null,
            user: req.user.id
        })
        res.status(201).json({
            message: "Task created successfully",
            task: task
        })
    } catch (error){
        res.status(400).json({
            message: "Something went wrong",
            error: error.message
        })
    }
}



//GET ALL TASK

async function getAllTask(req, res){
    try{
        const task = await taskModel.find({
            user: req.user.id
        })
        res.status(200).json({
            task: task
        })
    } catch (error){
        res.status(400).json({
            message: "Something went wrong",
            error: error.message
        })
    }  
}



//UPDATE TASK

async function updateTask(req, res){
    try{
        const nextStatus = req.body.status
        const updateData = {
            ...req.body
        }

        if (nextStatus === 'completed') {
            updateData.completedAt = new Date()
        }

        if (nextStatus === 'pending') {
            updateData.completedAt = null
        }

        const task = await taskModel.findOneAndUpdate({
            _id: req.params.id,
            user: req.user.id
        },
            updateData,
            {
                new: true,
            }
        )

        if(!task) {
            return res.status(404).json({
                message: "Task not found"
            })
        }
        
        res.status(200).json({
            task: task
        })

    } catch (error){
        res.status(400).json({
            message: "Something went wrong",
            error: error.message
        })
    }   
}



//MARK TASK AS COMPLETED

async function completeTask(req, res){
    try{
        const task = await taskModel.findOneAndUpdate({
            _id: req.params.id,
            user: req.user.id
        },
            {
                status: 'completed',
                completedAt: new Date()
            },
            {
                new: true,
            }
        )

        if(!task) {
            return res.status(404).json({
                message: "Task not found"
            })
        }

        res.status(200).json({
            message: "Task marked as completed",
            task
        })
    } catch (error){
        res.status(400).json({
            message: "Something went wrong",
            error: error.message
        })
    }
}



//DELETE TASK

async function deleteTask(req, res){
    try{
        const task = await taskModel.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        })
        if(!task){
            return res.status(404).json({
                message: "Task not found"
            })
        }
        res.status(200).json({
            message: "Task deleted successfully"
        })
    } catch (error){
        res.status(400).json({
            message: "Something went wrong",
            error: error.message
        })
    }   
}

//Search and filter Task

async function searchAndFilterTask(req, res){
    try{
        const {search, status, priority, page = 1, limit = 5} = req.query;
        let query = {}
        query.user = req.user.id

        //searching
        if(search){
            query.$or = [
                {title: {$regex: search, $options: "i"}},
                {description: {$regex: search, $options: "i"}}
            ]
        }

        //filtering
        if(status) {
            query.status = status
        } if(priority) {
            query.priority = priority
        }

        //pagination
        const skip = (page-1)*limit

        const task = await taskModel.find(query)
            .skip(skip)
            .limit(Number(limit))
            .sort({createdAt: -1})

        res.status(200).json({
            task: task,
            message: "Task fetched successfully"
        })

    } catch (error) {
        res.status(400).json({
            message: "Something went wrong",
            error: error.message
        })

    }
}

module.exports = {createTask, getAllTask, updateTask, deleteTask, searchAndFilterTask, completeTask}