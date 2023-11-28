const User = require('../../model/User');
const UsageLimit = require('../../model/UsageLimit');
const languageList = require('../languageCheck');

const { sendReportEmail, sendOrderIssueEmail } = require('../../middleware/mailer')
const ObjectId  = require('mongodb').ObjectId;


const addEmailReport = async (req, res) => {

    const { loggedUserId, message } = req.body

    if (!loggedUserId || !message ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const foundUser = await User.findOne({_id: loggedUserId})

        if(foundUser){
            if(foundUser.deactivated === true){
                return
            }
            const foundLimits = await UsageLimit.findOne({_userId: loggedUserId})

            var todaysDate = new Date().toLocaleDateString()
            var doneOperation = false;

            var checkMessage = message.toLowerCase();
            
            if(foundLimits){

                for(let i=0; i < languageList.length; i++){
                        
                    if(checkMessage.indexOf(languageList[i]) !== -1){
                        
                        foundLimits.warningsCount = foundLimits.warningsCount + 3
                        
                        if(foundLimits.warningsCount >= 7){
                            
                            foundUser.deactivated = true;
                            
                            const savedLimits = await foundLimits.save();
                            const savedUser = await foundUser.save();

                            if(savedUser && savedLimits){
                                if(foundUser?.primaryGeoData){
                                    const addIPBan = await BannedUser.updateOne({admin: "admin"},{$push: {ipAddresses: {userIP: foundUser.primaryGeoData.IPv4}}})
                                    if(addIPBan){
                                        return res.status(401).json({"message":"Inappropriate content"})              
                                    }
                                } else {
                                    return res.status(401).json({"message":"Inappropriate content"})          
                                }
                            } 
                        } else {

                            const savedLimits = await foundLimits.save()

                            if(savedLimits){

                                return res.status(401).json({"message":"Inappropriate content"})  
                            }
                        }
                    }
                }

                if(foundLimits.numberOfEmailInvitations?.length > 0){

                    if(foundLimits.numberOfEmailInvitations.some(e=>e.date === todaysDate)){
    
                        for(let i=0; i< foundLimits.numberOfEmailInvitations.length; i++){
    
                            if(foundLimits.numberOfEmailInvitations[i].date === todaysDate){
        
                                if(foundLimits.numberOfEmailInvitations[i].invitationsNumber >= 10){
                                    
                                    return res.status(401).json({ message: 'Reached comment limit for today' })
                                
                                } else {
        
                                    foundLimits.numberOfEmailInvitations[i].invitationsNumber = foundLimits.numberOfEmailInvitations[i].invitationsNumber + 1
                                    const savedLimits = await foundLimits.save()
        
                                    if(savedLimits){
                                        doneOperation = true;
                                    }
                                    
                                    break;
                                }
                            }
                        }
                    
                    } else {
    
                        foundLimits.numberOfEmailInvitations.push({date: todaysDate, invitationsNumber: 1 })
                        const savedLimits = await foundLimits.save()
                        if(savedLimits){
                            doneOperation = true;
                        }
                    }
    
                } else {
    
                    foundLimits.numberOfEmailInvitations = [{date: todaysDate, invitationsNumber: 1 }]
                    const savedLimits = await foundLimits.save()
                    if(savedLimits){
                        doneOperation = true;
                    }
                }

            } else {

                return res.status(401).json({"message":"Operation failed"})  
            }

            if(doneOperation){
                const success = await sendReportEmail( {submittedUser: foundUser.email, submittedUserId: foundUser._id, content: message })
                if(success){
                    return res.status(201).json({ 'Success': `Sent email invitation! ` });
                }
            }
        }

    } catch (err) {

        return res.status(401).json({ message: 'Failed' })
    }
}

const addEmailOrders = async (req, res) => {

    const { loggedUserId, message, orderId } = req.body

    if (!loggedUserId || !message ) return res.status(400).json({ 'message': 'Missing required fields!' });

    try {

        const foundUser = await User.findOne({_id: loggedUserId})

        if(foundUser){
            if(foundUser.deactivated === true){
                return
            }
            const foundLimits = await UsageLimit.findOne({_userId: loggedUserId})

            var todaysDate = new Date().toLocaleDateString()
            var doneOperation = false;

            var checkMessage = message.toLowerCase();
            
            if(foundLimits){

                for(let i=0; i < languageList.length; i++){
                        
                    if(checkMessage.indexOf(languageList[i]) !== -1){
                        
                        foundLimits.warningsCount = foundLimits.warningsCount + 3
                        
                        if(foundLimits.warningsCount >= 7){
                            
                            foundUser.deactivated = true;
                            
                            const savedLimits = await foundLimits.save();
                            const savedUser = await foundUser.save();

                            if(savedUser && savedLimits){
                                if(foundUser?.primaryGeoData){
                                    const addIPBan = await BannedUser.updateOne({admin: "admin"},{$push: {ipAddresses: {userIP: foundUser.primaryGeoData.IPv4}}})
                                    if(addIPBan){
                                        return res.status(401).json({"message":"Inappropriate content"})              
                                    }
                                } else {
                                    return res.status(401).json({"message":"Inappropriate content"})          
                                }
                            } 
                        } else {

                            const savedLimits = await foundLimits.save()

                            if(savedLimits){

                                return res.status(401).json({"message":"Inappropriate content"})  
                            }
                        }
                    }
                }

                if(foundLimits.numberOfEmailInvitations?.length > 0){

                    if(foundLimits.numberOfEmailInvitations.some(e=>e.date === todaysDate)){
    
                        for(let i=0; i< foundLimits.numberOfEmailInvitations.length; i++){
    
                            if(foundLimits.numberOfEmailInvitations[i].date === todaysDate){
        
                                if(foundLimits.numberOfEmailInvitations[i].invitationsNumber >= 10){
                                    
                                    return res.status(401).json({ message: 'Reached comment limit for today' })
                                
                                } else {
        
                                    foundLimits.numberOfEmailInvitations[i].invitationsNumber = foundLimits.numberOfEmailInvitations[i].invitationsNumber + 1
                                    const savedLimits = await foundLimits.save()
        
                                    if(savedLimits){
                                        doneOperation = true;
                                    }
                                    
                                    break;
                                }
                            }
                        }
                    
                    } else {
    
                        foundLimits.numberOfEmailInvitations.push({date: todaysDate, invitationsNumber: 1 })
                        const savedLimits = await foundLimits.save()
                        if(savedLimits){
                            doneOperation = true;
                        }
                    }
    
                } else {
    
                    foundLimits.numberOfEmailInvitations = [{date: todaysDate, invitationsNumber: 1 }]
                    const savedLimits = await foundLimits.save()
                    if(savedLimits){
                        doneOperation = true;
                    }
                }

            } else {

                return res.status(401).json({"message":"Operation failed"})  
            }

            if(doneOperation){
                const success = await sendOrderIssueEmail( {submittedUser: foundUser.email, content: message, order: orderId })
                if(success){
                    return res.status(201).json({ 'Success': `Sent email invitation! ` });
                }
            }
        }

    } catch (err) {

        return res.status(401).json({ message: 'Failed' })
    }
}

module.exports = { addEmailReport, addEmailOrders }
