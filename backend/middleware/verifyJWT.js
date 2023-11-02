const jwt = require('jsonwebtoken');
const User = require('../model/User');
const ActivateToken = require('../model/ActivateToken');

const verifyJWT = async (req, res, next) => {

    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {

        if (!authHeader?.startsWith('Hash ')){
            
            return res.sendStatus(401);
        
        } else {

            const splitArr = authHeader.split(' ')

            if(splitArr?.length > 2){
             
                const hash = splitArr[1];
                const userId = splitArr[2];

                console.log("Checking hash")

                if(userId && hash){

                    console.log(userId)
                    console.log(hash)

                    const foundToken = await ActivateToken.findOne({_userId: userId})
                    const foundUser = await User.findOne({_id: userId, checkedMobile: false, 
                        receivedIdApproval:false, deactivated:false })

                    if(foundToken && foundUser){

                        if(foundToken.token === hash){

                            console.log("Moving on")
                            next();

                        } else {

                            return res.sendStatus(401);
                        }

                    } else {

                        return res.sendStatus(401);
                    }
                } else {
                    return res.sendStatus(401);
                }
            } else {
                return res.sendStatus(401);
            }
        }
    
    } else {

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
}

module.exports = verifyJWT