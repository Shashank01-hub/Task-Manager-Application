const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },

    title: {
        type: String,
        required: true
    },

    description: {
        type: String
    },

    status: {
        type: String,
        enum: ["pending", "completed"],
        default: "pending"
    },

    priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium"
    },

    dueDate: {
        type: Date
    }
}, {
    timestamps: true
})

const taskModel = mongoose.model("task", taskSchema)

module.exports = taskModel