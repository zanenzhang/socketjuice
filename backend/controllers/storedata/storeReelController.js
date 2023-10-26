const StoreVisitors = require('../../model/StoreVisitors');
const User = require('../../model/User');
const LastVisited = require('../../model/LastVisited');
const Peoplefollowers = require('../../model/Peoplefollowers');
const Peoplefollowing = require('../../model/Peoplefollowing');
const RecentlyVisited = require('../../model/RecentlyVisited');
const ObjectId  = require('mongodb').ObjectId;


const getStoreVisitors = async (req, res) => {

    const { profileUserId, loggedUserId } = req.query

    if( !profileUserId || !loggedUserId ){
        return res.status(400).json({ message: 'Missing required fields!' })
    }

    var preShuffled = ["drake@purchies.com", "rihanna@purchies.com", "miley@purchies.com", "matt@purchies.com", 
            "kevin@purchies.com", "therock@purchies.com", "adele@purchies.com", "gordon@purchies.com", "george@purchies.com",
            "tom@purchies.com", "michelle@purchies.com", "jackie@purchies.com"]

    var random = Math.random()
    var shuffled = preShuffled.sort(() => 0.5 - random);
    var end = 1 + Math.ceil(random * 4)

    var publicUserEmailList = shuffled.slice(0, end)

    const visitorsReel = await StoreVisitors.findOne({ _userId: profileUserId })
    const publicAccounts = await User.find({email: {$in: publicUserEmailList}}).select("_id")
    
    if(visitorsReel && publicAccounts){

        const recentTime = new Date( Date.now() - (20 * 60 * 1000))
        var visitorsList = [];

        const preVisitorsList = visitorsReel.visitors
            .filter(function(item){
                if (item.timestamp > recentTime){
                    return item
                } 
            })
            .map(function(item){
                return item._userId
            })

        //Add fan accounts to visitorslist in store reel controller

        if(preVisitorsList?.length < 12){
            visitorsList = [...preVisitorsList, ...publicAccounts.slice(0, Math.min(11 - preVisitorsList?.length, 3))]
        } else {
            visitorsList = [...preVisitorsList]
        }
            
        const peopleFollowing = await Peoplefollowing.findOne({_userId: loggedUserId}).select("allPeopleFollowing")

        if(peopleFollowing){

            const storeVisitorsFollowing = await User.find({$or:[{ _id: {$in: peopleFollowing.allPeopleFollowing.map(e=>e._followingId)}},
                {_id: loggedUserId}]}).limit(10).select("_id username roles profilePicURL privacySetting")

            if(storeVisitorsFollowing){

                const storeVisitorsPublic = await User.find({$and:[{_id:{$in: visitorsList }},
                    {_id:{$nin: storeVisitorsFollowing.map(e=>e._id)}}, {privacySetting: 1}] }).limit(12).
                select("_id username roles profilePicURL privacySetting")

                if(storeVisitorsPublic){

                    let storeVisitorProfiles = [...storeVisitorsFollowing, ...storeVisitorsPublic]

                    if(storeVisitorProfiles){
                
                        res.status(200).json(storeVisitorProfiles)
                    
                    } else {
                        return res.status(400).json({ message: 'Failed!' })
                    }
                }
            } else {

                const storeVisitorProfiles = await User.find({$and:[{_id:{$in: visitorsList }},
                    {privacySetting: 1}] }).limit(12).select("_id username roles profilePicURL privacySetting")
    
                if(storeVisitorProfiles){
                
                    res.status(200).json(storeVisitorProfiles)
                
                } else {
                    return res.status(400).json({ message: 'Failed!' })
                }
            }

        } else {

            const storeVisitorProfiles = await User.find({$and:[{_id:{$in: visitorsList }},
                {privacySetting: 1}] }).limit(12).select("_id username roles profilePicURL privacySetting")

            if(storeVisitorProfiles){
            
                res.status(200).json(storeVisitorProfiles)
            
            } else {
                return res.status(400).json({ message: 'Failed!' })
            }
        }

    } else {

        return res.status(200).json([])
    }
}

const addStoreVisitor = async(req, res) =>{

    const { profileUserId, loggedUserId, userOrStore} = req.body

    if (!profileUserId || !loggedUserId || userOrStore === '2' || loggedUserId === profileUserId) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    try {

        var doneLastVisited = false;
        var doneRecentlyVisited = false;
        var doneStoreVisitors = false;

        const lastVisited = await LastVisited.findOne({_userId: loggedUserId });
        const recentlyVisited = await RecentlyVisited.findOneAndUpdate({ _userId: loggedUserId },{"$set":{lastVisitedTime: Date.now()}});
        const storeVisitors = await StoreVisitors.findOne({ _userId: profileUserId });

        if(lastVisited){

            if(lastVisited?._lastStoreId){

                if(lastVisited._lastStoreId.toString() === (profileUserId) ){

                    lastVisited.timestamp = Date.now()

                    const addedLastVisited = await lastVisited.save();

                    if(addedLastVisited){
                        
                        doneLastVisited = true;
                    }
                
                } else {

                    const clearVisitors = await StoreVisitors.findOne({ _userId: lastVisited._lastStoreId})

                    if(clearVisitors){

                        if(clearVisitors?.visitors){

                            const pulledVisitor = await clearVisitors.visitors.pull({_userId: loggedUserId })

                            if(pulledVisitor){

                                lastVisited._lastStoreId = profileUserId;
                                lastVisited.timestamp = Date.now();

                                const addedLastVisited = await lastVisited.save()
                                const savedClearVisitors = await clearVisitors.save()

                                if(addedLastVisited && savedClearVisitors){
                                    doneLastVisited = true;
                                }
                            }
                        }
                    }   
                }

            } else {

                lastVisited._lastStoreId = profileUserId
                lastVisited.timestamp = Date.now();

                const addedLastVisited = await lastVisited.save()

                if(addedLastVisited){
                    doneLastVisited = true;
                }
                    
            }
        }

        if(recentlyVisited){

            if(recentlyVisited._visitedStores?.length === 0 ){
                
                recentlyVisited._visitedStores = [{_userId: profileUserId, timestamp: Date.now()}]

                const addedRecentlyVisited = await recentlyVisited.save()

                if(addedRecentlyVisited){
                    doneRecentlyVisited = true;
                }

            } else if(recentlyVisited._visitedStores?.some(e => e._userId.toString() === ((profileUserId)))){

                    const addedRecentlyVisited = await RecentlyVisited.findOneAndUpdate({ _userId: loggedUserId, "_visitedStores._userId": profileUserId },{$set:{ "_visitedStores.$.timestamp": Date.now()}});
                
                    if(addedRecentlyVisited){
                        doneRecentlyVisited = true;
                    }
                
            } else {

                recentlyVisited._visitedStores.push({_userId: profileUserId, timestamp: Date.now()})

                const addedRecentlyVisited = await recentlyVisited.save()

                if(addedRecentlyVisited){
                    doneRecentlyVisited = true;
                }
            }
            
        } 

        if(storeVisitors){

            if( storeVisitors.visitors?.length === 0){

                storeVisitors.visitors = [{_userId: loggedUserId, timestamp: Date.now() }]

                const addedStoreVisitors = await storeVisitors.save()

                if(addedStoreVisitors){
                    doneStoreVisitors = true;
                }

            } else if ( storeVisitors.visitors.some(e => e._userId.toString() === ((loggedUserId)))){

                const addedStoreVisitors = await StoreVisitors.findOneAndUpdate({_userId: profileUserId, 'visitors._userId': loggedUserId },{$set: {"visitors.$.timestamp": Date.now()}})
            
                if(addedStoreVisitors){
                    doneStoreVisitors = true;
                }

            } else {

                storeVisitors.visitors.push({_userId: loggedUserId, timestamp: Date.now() })

                const addedStoreVisitors = await storeVisitors.save()

                if(addedStoreVisitors){
                    doneStoreVisitors = true;
                }
            }        
        
        } else {

            let storeVisitors = new StoreVisitors({
                "_userId": profileUserId,
                "visitors": [{_userId: loggedUserId, timestamp: Date.now() }]
              });

              const savedStoreVisitors = await storeVisitors.save()

              if(savedStoreVisitors){
                doneStoreVisitors = true;
              }
        }

        if(doneLastVisited && doneRecentlyVisited && doneStoreVisitors){

            return res.status(201).json("Added store visitor")

        } else {

            return res.status(401).json("Operation failed")
        }

    } catch (err){

        console.log(err)

        return res.status(401).json({message: err})
    }
}




const removeStoreVisitor = async(req, res) =>{

    const { profileUserId, loggedUserId} = req.body

    if (!profileUserId || !loggedUserId || loggedUserId === profileUserId) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    try {

        const storeVisitors = await StoreVisitors.updateOne({ _userId: profileUserId },{$pull:{visitors:{_userId: loggedUserId }}});

        if(storeVisitors){

            return res.status(201).json("Removed store visitor");        
        }   
               
    } catch (err){

        console.log(err)

        return res.status(401).json({message: err})
    }
}



module.exports = { getStoreVisitors, addStoreVisitor, removeStoreVisitor }