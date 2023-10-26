const jwt = require('jsonwebtoken');
const User = require('../model/User')

const verifyJWT = (req, res, next) => {

    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.sendStatus(401);
    const splitArr = authHeader.split(' ')
    const token = splitArr[1];
    const userId = splitArr[2];
    
    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            if (err) return res.sendStatus(403);
                
            User.findOne({username: decoded.UserInfo.username, _id: userId}, function(err, foundUser){
                if(foundUser){
                    console.log("verification success")
                    next();
                } else {
                    return res.sendStatus(403);
                }
            })
            
        }
    );
}

module.exports = verifyJWT