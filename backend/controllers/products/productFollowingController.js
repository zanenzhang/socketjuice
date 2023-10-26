const Productfollowing = require('../../model/Productfollowing');
const User = require('../../model/User');
const ObjectId  = require('mongodb').ObjectId;

const getProductFollowing = async (req, res) => {
    
    const userId = req.params.userId

    if (!userId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    try {

        const productFollowing = await Productfollowing.findOne({ _userId: userId })

        if (!productFollowing) {

            return res.status(400).json({ message: 'User not found' })

        } else {

            const profiles = await Product.find({"_id":{"$in": productFollowing.allProductFollowing.map(c => c._followingId)}},{brand_fuzzy: 0, productname_fuzzy:0})

                if (profiles){
                    return res.status(200).json(profiles)
                }
        }

    } catch (err){

        console.log(err)
    }
}

const addProductFollowing = async (req, res) => {

    const { primaryUserId, productIdToAdd } = req.body
  
      if (!primaryUserId || !productIdToAdd ) return res.status(400).json({ 'message': 'Missing required fields!' });
  
      try {
  
        const user = await Productfollowing.findOne({ _userId: primaryUserId })

        if (user) {

            const found = user.allProductFollowing?.some(e => e._followingId.toString() === ((productIdToAdd)))

            if(!found){

                user.allProductFollowing.push({"_followingId":productIdToAdd})
                user.productFollowingCount = user.productFollowingCount + 1

                const saved = await user.save()

                if(saved){
                    return res.status(201).json(user.productFollowingCount)
                }

            } else {
                
                return res.status(401).json({ message: 'Failed, user already following!' })
            }

        } else {

            return res.status(400).json({ message: 'Failed!' })
        }
  
      } catch (err) {
  
          return res.status(400).json({ message: 'Failed' })
      }
  }


  const removeProductFollowing = async (req, res) => {

    const { loggedUserId, productIdToRemove } = req.query
  
      if (!loggedUserId || !productIdToRemove ) return res.status(400).json({ 'message': 'Missing required fields!' });
  
      try {
  
        let foundUser = await Productfollowing.findOneAndUpdate({ _userId: loggedUserId }, { $pull: { allProductFollowing: { _followingId: productIdToRemove }}}, { new:true, multi:true })

        if(foundUser){

            foundUser.productFollowingCount = Math.max(foundUser.productFollowingCount - 1, 0)

            const done = await foundUser.save()

            if(done){
                return res.status(200).json(foundUser.productFollowingCount)
            }

        } else {
            return res.status(201)
        }
  
      } catch (err) {
  
          return res.status(400).json({ message: 'Failed' })
      }  
  }

module.exports = { getProductFollowing, addProductFollowing, removeProductFollowing }