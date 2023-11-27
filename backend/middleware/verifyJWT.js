const jwt = require('jsonwebtoken');
const User = require('../model/User');
const ActivateToken = require('../model/ActivateToken');

const verifyJWT = async (req, res, next) => {

    const authHeader = req.headers.authorization || req.headers.Authorization;

    console.log(authHeader)
    
    if (!authHeader?.startsWith('Bearer ')) {

        if (!authHeader?.startsWith('Hash ')){
            
            return res.sendStatus(401);
        
        } else {

            const splitArr = authHeader.split(' ')

            if(splitArr?.length > 2){
             
                const hash = splitArr[1];
                const userId = splitArr[2];

                console.log("Checking hash")
                console.log(typeof(hash))

                if(userId?.length > 0 && userId !== 'null' && hash?.length > 0 && hash !== 'null'){

                    console.log(userId)
                    console.log(hash)

                    const foundToken = await ActivateToken.findOne({_userId: userId})
                    const foundUser = await User.findOne({_id: userId, deactivated:false })

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

        console.log("Verifying")
        
        jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET,
            (err, decoded) => {
                if (err) return res.sendStatus(403);

                console.log(decoded)
                    
                User.findOne({_id: decoded.UserInfo.userId}, function(err, foundUser){
                    if(foundUser && foundUser._id.toString() === userId){
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