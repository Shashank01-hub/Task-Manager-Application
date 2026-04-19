const mongoose = require('mongoose')
const config = require('./config')

async function connectDB() {
    try{
        await mongoose.connect(config.MONGO_URI)
        console.log("Connected to DB")
    } catch (error) {
        console.log("Database connection failed")
        console.log(error.message)
    }
}

module.exports = connectDB