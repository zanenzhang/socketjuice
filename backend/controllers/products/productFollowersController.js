const Productfollowers = require('../../model/Productfollowers');
const User = require('../../model/User');
const ObjectId  = require('mongodb').ObjectId;


const getProductFollowers = async (req, res) => {
    
    const productId = req.params.productId

    if (!productId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    try {

        const productFollowers = await Productfollowers.findOne({ _productId: productId })

        if (!productFollowers) {
            return res.status(400).json({ message: 'Product not found' })
        
        } else {

            // const blockedProfiles = await User.find({"_id":{"$in": foundUser.blockedUsers.map(c => c._userId)}}).
            // select("_id username profilePicURL privacySetting")

            const profiles = await User.find({"_id":{"$in": productFollowers.allProductFollowers.map(c => c._followerId)}}).
                select("_id username profilePicURL privacySetting blockedUsers")

                if (profiles){
                    return res.status(200).json(profiles)
                }
        }

    } catch (err){

        console.log(err)
    }

}

const addProductFollowers = async (req, res) => {

  const { productId, userIdToAdd } = req.body

    if (!productId || !userIdToAdd ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const user = await Productfollowers.findOne({ _productId: productId })

        if (user) {

            if(user.allProductFollowers?.length > 0){

                const found = user.allProductFollowers?.some(e => e._followerId.toString() === ((userIdToAdd)) )

                if(!found){

                    user.allProductFollowers.push({ "_followerId": userIdToAdd})
                    user.productFollowersCount = user.productFollowersCount + 1

                    const saved = await user.save()
                    
                    if(saved){
                        return res.status(201).json(user.productFollowersCount)
                    }
                    
                } else {

                    return res.status(401).json({ message: 'Failed, user already followed!' })                    
                }

            } else {

                user.allProductFollowers = [{ "_followerId": userIdToAdd}]
                user.productFollowersCount = 1

                const saved = await user.save()
                
                if(saved){
                    return res.status(201).json(user.productFollowersCount)
                }
                    
            }

        } else {

            return res.status(402).json({ message: 'Failed!' })
        }

    } catch (err) {

        return res.status(403).json({ message: 'Failed' })
    }

}

const checkProductFollowers = async (req, res) => {

    const { productId, loggedUserId } = req.body
    
    try {

        const user = await Productfollowers.findOne({ _productId: productId })

        if (user) {

            const found = user.allProductFollowers.some(e => e._followerId.toString() === ((loggedUserId)))

            if(!found){
                return res.json(false)

            } else {
                return res.json(true)
            }
        } 

    } catch (err) {

        return res.status(400).json({ message: 'Failed' })
    }
}

const removeProductFollowers = async (req, res) => {

    const { productId, userIdToRemove } = req.query
  
      if (!productId || !userIdToRemove ) return res.status(400).json({ 'message': 'Missing required fields!' });
  
      try {
  
        let foundUser = await Productfollowers.findOneAndUpdate({ _productId: productId }, { $pull: { allProductFollowers: { _followerId: userIdToRemove }}}, { new:true, multi:true })

        if(foundUser){

            foundUser.productFollowersCount = Math.max(foundUser.productFollowersCount - 1, 0)

            const done = await foundUser.save()

            if(done){
                return res.status(200).json(foundUser.productFollowersCount)
            }

        } else {
            return res.status(201)
        }
  
      } catch (err) {
  
          return res.status(400).json({ message: 'Failed' })
      }
  }


module.exports = { getProductFollowers, addProductFollowers, checkProductFollowers, removeProductFollowers }