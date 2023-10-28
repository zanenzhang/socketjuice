const User = require('../../model/User');
const DriverProfile = require('../../model/DriverProfile');
const HostProfile = require('../../model/HostProfile')
const Review = require('../../model/Review');
const ObjectId  = require('mongodb').ObjectId;


const getReviews = async (req, res) => {
    
    const { userId } = req.params

    if (!userId) {
        return res.status(400).json({ message: 'User ID Required' })
    }

    try{

        const foundUser = await User.findOne({ _id: userId })

        if(foundUser && foundUser?.isHost){

            const foundHostProfile = await HostProfile.findOne({_userId: userId})

            if(foundHostProfile){

                const receivedReviews = await Review.find({_id: {$in: foundHostProfile?.receivedReviews.map(e=>e._reviewId)} })
    
                if(receivedReviews){
                    
                    res.status(200).json({receivedReviews})
            
                } else {
                    res.status(200).json({})
                }
            }
        
        } else {

            const foundDriverProfile = await DriverProfile.findOne({_userId: userId})

            if(foundDriverProfile){

                const receivedReviews = await Review.find({_id: {$in: foundDriverProfile?.receivedReviews.map(e=>e._reviewId)} })
    
                if(receivedReviews){
                    
                    res.status(200).json({receivedReviews})
            
                } else {
                    res.status(200).json({})
                }
            }
        }

    } catch(err){

        res.status(400).json({message: "Operation failed"})
    }
}   


const addReview = async (req, res) => {

    const { givingUserId, receivingUserId, ratingStars } = req.body

    if (!givingUserId || !receivingUserId  ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        ratingStars = Number(ratingStars)

        const checkReview = await Review.findOne({_givingReviewUserId: givingUserId, _receivingReviewUserId: receivingUserId})

        if(!checkReview){

            const newReview = await Review.create({_givingReviewUserId: givingUserId, _receivingReviewUserId: receivingUserId, reviewStars: ratingStars})
            const foundGivingUser = await User.findOne({_id: givingUserId})
            const foundReceivingUser = await User.findOne({_id: receivingUserId})

            if(newReview && foundGivingUser && foundReceivingUser){

                if(foundGivingUser.isHost){

                    const foundHostProfile = await HostProfile.fineOne({_userId: foundGivingUser._id})
                    const foundDriverProfile = await DriverProfile.fineOne({_userId: foundReceivingUser._id})

                    if(foundHostProfile && foundHostProfile.receivedReviews?.length > 0){

                        foundHostProfile.receivedReviews.push({_reviewId: newReview._id, reviewStars: ratingStars})

                    } else {

                        foundHostProfile = [{_reviewId: newReview._id, reviewStars: ratingStars}]
                    }

                    if(foundDriverProfile && foundDriverProfile.receivedReviews?.length > 0){

                        foundDriverProfile.receivedReviews.push({_reviewId: newReview._id, reviewStars: ratingStars})

                    } else {

                        foundDriverProfile = [{_reviewId: newReview._id, reviewStars: ratingStars}]
                    }

                    const savedHost = await foundHostProfile.save()
                    const savedDriver = await foundDriverProfile.save()

                    if(savedHost && savedDriver){
                        return res.status(201).json({ 'Message': "Success" });
                    }
                
                } else {

                    const foundHostProfile = await HostProfile.fineOne({_userId: foundReceivingUser._id})
                    const foundDriverProfile = await DriverProfile.fineOne({_userId: foundGivingUser._id})

                    if(foundHostProfile && foundHostProfile.receivedReviews?.length > 0){

                        foundHostProfile.receivedReviews.push({_reviewId: newReview._id, reviewStars: ratingStars})

                    } else {

                        foundHostProfile = [{_reviewId: newReview._id, reviewStars: ratingStars}]
                    }

                    if(foundDriverProfile && foundDriverProfile.receivedReviews?.length > 0){

                        foundDriverProfile.receivedReviews.push({_reviewId: newReview._id, reviewStars: ratingStars})

                    } else {

                        foundDriverProfile = [{_reviewId: newReview._id, reviewStars: ratingStars}]
                    }

                    const savedHost = await foundHostProfile.save()
                    const savedDriver = await foundDriverProfile.save()

                    if(savedHost && savedDriver){
                        return res.status(201).json({ 'Message': "Success" });
                    }
                }
            }
        
        } else {

            return res.status(400).json({"Message": "Operation Failed"})
        }
        
    } catch (err) {

        console.log(err);
        return res.status(403).json({ message: 'Failed' })
    }
}


const deleteReview = async (req, res) => {

    const { givingUserId, receivingUserId, reviewId } = req.body

    if (!givingUserId || !receivingUserId || !reviewId  ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const foundGivingUser = await User.findOne({_id: givingUserId})
        const foundReceivingUser = await User.findOne({_id: receivingUserId})

        if(foundGivingUser && foundReceivingUser){

            if(foundGivingUser.isHost){

                const foundHostProfile = await HostProfile.fineOne({_userId: foundGivingUser._id})
                const foundDriverProfile = await DriverProfile.fineOne({_userId: foundReceivingUser._id})

                if(foundHostProfile && foundHostProfile.receivedReviews?.length > 0){

                    foundHostProfile.receivedReviews.pull({_reviewId: reviewId})

                } else {

                    foundHostProfile = [{_reviewId: reviewId}]
                }

                if(foundDriverProfile && foundDriverProfile.receivedReviews?.length > 0){

                    foundDriverProfile.receivedReviews.pull({_reviewId: reviewId})

                } else {

                    foundDriverProfile = [{_reviewId: reviewId}]
                }

                const savedHost = await foundHostProfile.save()
                const savedDriver = await foundDriverProfile.save()
                const deletedReview = await Review.deleteOne({_id: reviewId})

                if(savedHost && savedDriver && deletedReview){
                    return res.status(201).json({ 'Message': "Success" });
                }
            
            } else {

                const foundHostProfile = await HostProfile.fineOne({_userId: foundReceivingUser._id})
                const foundDriverProfile = await DriverProfile.fineOne({_userId: foundGivingUser._id})

                if(foundHostProfile && foundHostProfile.receivedReviews?.length > 0){

                    foundHostProfile.receivedReviews.pull({_reviewId: reviewId})

                } else {

                    foundHostProfile = [{_reviewId: reviewId}]
                }

                if(foundDriverProfile && foundDriverProfile.receivedReviews?.length > 0){

                    foundDriverProfile.receivedReviews.pull({_reviewId: reviewId})

                } else {

                    foundDriverProfile = [{_reviewId: reviewId}]
                }

                const savedHost = await foundHostProfile.save()
                const savedDriver = await foundDriverProfile.save()
                const deletedReview = await Review.deleteOne({_id: reviewId})

                if(savedHost && savedDriver && deletedReview){
                    return res.status(201).json({ 'Message': "Success" });
                }
            }
        }
        
    } catch (err) {

        console.log(err);
        return res.status(403).json({ message: 'Failed' })
    }
}



module.exports = { getReviews, addReview, deleteReview }