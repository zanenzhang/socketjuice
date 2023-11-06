require('dotenv').config()
const Axios = require('axios');
const User = require("../../model/User");
const UsageLimit = require("../../model/UsageLimit");


async function getCoordinates (req, res) {

    const {placeId, userId} = req.query

    if (!placeId || !userId) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    const foundUser = await User.findOne({_id: userId})
    const foundLimits = await UsageLimit.findOne({_userId: userId})
    
    var doneOperation = false;
    var todaysDate = new Date().toLocaleDateString()

    if(foundUser && foundLimits){

        if(foundLimits.numberOfGoogleCoordRequests?.length > 0){

            if(foundLimits.numberOfGoogleCoordRequests?.some(e=>e.date === todaysDate)){

                for(let i=0; i< foundLimits.numberOfGoogleCoordRequests.length; i++){

                    if(foundLimits.numberOfGoogleCoordRequests[i].date === todaysDate){

                        if(foundLimits.numberOfGoogleCoordRequests[i].requestsNumber >= 200){
                            
                            return res.status(401).json({ message: 'Reached bookmarks limit for today' })
                        
                        } else {

                            foundLimits.numberOfGoogleCoordRequests[i].requestsNumber = 
                                foundLimits.numberOfGoogleCoordRequests[i].requestsNumber + 1
                            
                            const savedLimits = await foundLimits.save()

                            if(savedLimits){
                                doneOperation = true;
                            }
                            
                            break;
                        }
                    }
                }
            
            } else {

                foundLimits.numberOfGoogleCoordRequests.push({date: todaysDate, requestsNumber: 1 })

                const savedLimits = await foundLimits.save()
                
                if(savedLimits){
                    doneOperation = true;
                }
            }

        } else {

            foundLimits.numberOfGoogleCoordRequests.push({date: todaysDate, requestsNumber: 1 })
            
            const savedLimits = await foundLimits.save()

            if(savedLimits){
                doneOperation = true;
            }
        }
        
        const latlong = await Axios.get(`https://maps.googleapis.com/maps/api/geocode/json?place_id=${placeId}&key=${process.env.GOOGLE_MAPS_API_KEY}`)

        if(latlong && doneOperation){

            return res.status(200).json({latlong: latlong.data})
        
        } else {
            
            return res.status(401).json({ message: 'Operation failed' })
        }

    } else {

        return res.status(401).json({ message: 'Operation failed' })
    }
}

//check verification token
async function getMatrix (req, res) {

    var {originString, destinationString, userId} = req.query

    if (!originString || !destinationString || !userId) {
        return res.status(400).json({ message: 'Missing required info' })
    }

    const foundUser = await User.findOne({_id: userId})
    const foundLimits = await UsageLimit.findOne({_userId: userId})
    
    var doneOperation = false;
    var todaysDate = new Date().toLocaleDateString()

    if(foundUser && foundLimits){

        if(foundLimits.numberOfGoogleMatrixRequests?.length > 0){

            if(foundLimits.numberOfGoogleMatrixRequests?.some(e=>e.date === todaysDate)){

                for(let i=0; i< foundLimits.numberOfGoogleMatrixRequests.length; i++){

                    if(foundLimits.numberOfGoogleMatrixRequests[i].date === todaysDate){

                        if(foundLimits.numberOfGoogleMatrixRequests[i].requestsNumber >= 200){
                            
                            return res.status(401).json({ message: 'Reached bookmarks limit for today' })
                        
                        } else {

                            foundLimits.numberOfGoogleMatrixRequests[i].requestsNumber = 
                                foundLimits.numberOfGoogleMatrixRequests[i].requestsNumber + 1
                            
                            const savedLimits = await foundLimits.save()

                            if(savedLimits){
                                doneOperation = true;
                            }
                            
                            break;
                        }
                    }
                }
            
            } else {

                foundLimits.numberOfGoogleMatrixRequests.push({date: todaysDate, requestsNumber: 1 })

                const savedLimits = await foundLimits.save()
                
                if(savedLimits){
                    doneOperation = true;
                }
            }

        } else {

            foundLimits.numberOfGoogleMatrixRequests.push({date: todaysDate, requestsNumber: 1 })
            const savedLimits = await foundLimits.save()
            if(savedLimits){
                doneOperation = true;
            }
        }
        
        const matrix = await Axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json?departure_time=now&origins=${originString}&destinations=${destinationString}&key=${process.env.GOOGLE_MAPS_API_KEY}`)

        if(matrix && doneOperation){
            
            return res.status(200).json({matrix: matrix.data})
        
        } else {
            return res.status(401).json({ message: 'Operation failed' })
        }

    } else {

        return res.status(401).json({ message: 'Operation failed' })
    }
}


module.exports = { getCoordinates, getMatrix }