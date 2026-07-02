const taskModel = require("../models/task.model")
const userModel = require("../models/user.model")

//GET ALL USER 
async function getAllUser(req, res){
    try{
        const users = await userModel.find({role: "user"}).select("-password").lean()
        const taskStats = await taskModel.aggregate([
            {
                $group: {
                    _id: '$user',
                    totalTasks: { $sum: 1 },
                    completedTasks: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
                        }
                    }
                }
            }
        ])

        const statsByUserId = taskStats.reduce((accumulator, item) => {
            accumulator[String(item._id)] = {
                totalTasks: item.totalTasks,
                completedTasks: item.completedTasks
            }
            return accumulator
        }, {})

        const usersWithStats = users.map((user) => ({
            ...user,
            totalTasks: statsByUserId[String(user._id)]?.totalTasks || 0,
            completedTasks: statsByUserId[String(user._id)]?.completedTasks || 0
        }))
        res.status(200).json({
            message: "Users fetched successfully",
            users: usersWithStats
        })
    } catch(error){
        res.status(400).json({
            message: "Something went wrong",
            error: error.message
        })
    }
}




//DELETE USER
async function deleteUser(req, res){
    try{
        const user = await userModel.findOneAndDelete({
            _id: req.params.id
        })
        res.status(200).json({
            message: "User deleted successfully",
        })
    } catch (error){
        res.status(400).json({
            message: "Something went wrong",
            error: error.message
        })
    }
}





//GET ALL TASKS OF A USER
async function getAllTaskOfAUser(req, res){
    try{
        const task = await taskModel.find({
            user: req.params.id
        })
        res.status(200).json({
            message: "Tasks fetched successfully",
            task: task
        })
    } catch (error) {
        res.status(400).json({
            message: "Something went wrong",
            error: error.message
        })
    }
}




//GET DASHBOARD DATA
async function getDashboardData(req, res){
    try{
        const totalUsers = await userModel.countDocuments({role: "user"})
        const totalTasks = await taskModel.countDocuments()
    
        const pendingTasks = await taskModel.countDocuments({status: "pending"})
        const completedTasks = await taskModel.countDocuments({status: "completed"})
    
        res.status(200).json({
            totalUsers,
            totalTasks,
            pendingTasks,
            completedTasks
        })

    } catch(error) {
        res.status(400).json({
            message: "Something went wrong",
            error: error.message
        })
    }
}


module.exports = {getAllUser, deleteUser, getAllTaskOfAUser, getDashboardData}