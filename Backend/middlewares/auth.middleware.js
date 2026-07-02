const jwt = require('jsonwebtoken')

function getAuthToken(req) {
    const cookieToken = req.cookies?.token
    if (cookieToken) {
        return cookieToken
    }

    const authHeader = req.headers.authorization || ''
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7).trim()
    }

    return null
}

async function authAdmin(req, res, next){
    const token = getAuthToken(req)

    if(!token){
        return res.status(401).json({
            message: "Unauthorized"
        })
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        if(decoded.role !== "admin") {
            return res.status(403).json({
                message: "You don't have access to perform this action"
            })
        }

        req.user = decoded

        next()

    } catch (error) {
        console.log(error.message);
        res.status(401).json({
            message: "Invalid token"
        })
    }
}

async function authUser(req, res, next){
    const token = getAuthToken(req)

    if(!token){
        return res.status(401).json({
            message: "Unauthorized"
        })
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        if(decoded.role !== "user"){
            return res.status(403).json({
                message: "You don't have access to perform this action"
            })
        }

        req.user = decoded

        next()
    } catch (error) {
        console.log(error.message);
        res.status(401).json({
            message: "Invalid token"
        })
    }
}

module.exports = {authUser, authAdmin}