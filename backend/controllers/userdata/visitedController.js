const User = require('../../model/User');
const StoreProfile = require('../../model/StoreProfile');
const RecentlyVisited = require('../../model/RecentlyVisited');


  const getVisited = async (req, res) => {

    const { userId } = req.params

    if (!userId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    const userVisited = await RecentlyVisited.findOne({ _userId: userId }).select("_visitedStores").sort({ "_visitedStores.timestamp": -1}).limit(10)

    if(userVisited){

      if(userVisited._visitedStores?.length > 0){

        const storeUserInfo = await User.find().
        where("_id").
        in(userVisited._visitedStores.map(e=>e._userId)).
        select("roles profilePicURL")

        const storeProfileInfo = await StoreProfile.find().
        where("_userId").
        in(userVisited._visitedStores.map(e=>e._userId)).
        select("_userId storename displayname address city region country announcements regularHours holidayHours")

        if (storeUserInfo && storeProfileInfo){
          return res.status(200).json({storeUserInfo, storeProfileInfo})
        }
      }
    } else {
      return res.status(200).json({})
    }
  }



  module.exports = { getVisited }
