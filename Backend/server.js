const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]); // Google DNS
dns.setDefaultResultOrder("ipv4first");

require('dotenv').config()
const app = require('./src/app')
const connectDB = require('./src/config/db')

connectDB()

const PORT = process.env.PORT || 4000

app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`)
})