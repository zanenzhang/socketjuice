const User = require('../../model/User');

const handleLogout = async (req, res) => {
    // On client, also delete the accessToken

    const cookies = req.cookies;
    if (!cookies?.purchiesjwt) return res.sendStatus(204); //No content
    const refreshToken = cookies.purchiesjwt;

    const {loggedUserId} = req.query

    // Is refreshToken in db?
    User.findOne({ refreshToken }, async function(err, foundUser){

        if (err){
            return res.status(500).send({msg: err.message});
        }

        if (!foundUser && foundUser._id !== loggedUserId) {
            res.clearCookie('purchiesjwt', { httpOnly: true, sameSite: 'None', secure: true });
            return res.sendStatus(204);
        }
    
        // Delete refreshToken in db
        foundUser.refreshToken = '';

        const saved = await foundUser.save()

        if(saved){
            
            res.clearCookie('purchiesjwt', { httpOnly: true, sameSite: 'None', secure: true });
            return res.sendStatus(204);

        } else {
            return res.status(500).send({msg: err.message});
        }
    });
    
}

module.exports = { handleLogout }