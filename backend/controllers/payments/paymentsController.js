require('dotenv').config()
const User = require('../../model/User');
const DriverProfile = require('../../model/DriverProfile');
const HostProfile = require('../../model/HostProfile');
const Payment = require('../../model/Payment');

const Flags = require('../../model/Flags');
const UsageLimit = require('../../model/UsageLimit');
const BannedUser = require("../../model/BannedUser");
const  {deleteFile} = require("../../controllers/media/s3Controller");

const crypto = require('crypto');
const languageList = require('../languageCheck');
const jwt = require('jsonwebtoken');
const S3 = require("aws-sdk/clients/s3");
const fns = require('date-fns');
var _= require('lodash');
const copyFile = require('../media/s3Controller');

const wasabiPrivateBucketUSA = process.env.WASABI_PRIVATE_BUCKET_NAME_USA;
const wasabiPublicBucketUSA = process.env.WASABI_PUBLIC_BUCKET_NAME_USA;

const wasabiEndpoint = process.env.WASABI_US_EAST_ENDPOINT;
const wasabiRegion = process.env.WASABI_US_EAST_REGION;
const wasabiAccessKeyId = process.env.WASABI_ACCESS_KEY;
const wasabiSecretAccessKey = process.env.WASABI_SECRET_KEY;

const s3 = new S3({
    endpoint: wasabiEndpoint,
    region: wasabiRegion,
    accessKeyId: wasabiAccessKeyId,
    secretAccessKey: wasabiSecretAccessKey,
  })


const getHostIncomingPayments = async (req, res) => {
    
    var { userId } = req.query

    if (!userId ) {
        return res.status(400).json({ message: 'Missing required information' })
    }

    const foundHostProfile = await HostProfile.findOne({_userId: userId})

    if(foundHostProfile){

        return(res.status(200).json({payments: foundHostProfile.incomingPayments}))

    } else {

        return res.status(401).json({ message: 'Operation failed' })
    }
}   


const getDriverOutgoingPayments = async (req, res) => {
    
    var { userId } = req.query

    if (!userId ) {
        return res.status(400).json({ message: 'Missing required information' })
    }

    const foundDriverProfile = await DriverProfile.findOne({_userId: userId})

    if(foundDriverProfile){

        return(res.status(200).json({payments: foundDriverProfile.outgoingPayments}))

    } else {

        return res.status(401).json({ message: 'Operation failed' })
    }
}   


const addPayment = async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.purchiesjwt) return res.sendStatus(401);
    const refreshToken = cookies.purchiesjwt;

    User.findOne({ refreshToken }, async function(err, foundUser){

        if (err || !foundUser) return res.sendStatus(403); 
    
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {

                if (err || foundUser.username !== decoded.username || !foundUser._id.toString() === ((decoded.userId)) ) return res.sendStatus(403);
            }
        )        

        const { userId, hostUserId, currency, paymentAmount } = req.body

        if (!userId || !hostUserId || !currency || !paymentAmount ) return res.status(400).json({ 'message': 'Missing required fields!' });

        try {

            const foundHostProfile = await HostProfile.findOne({_userId: hostUserId})
            const foundDriverProfile = await DriverProfile.findOne({_userId: userId})

            if(foundHostProfile && foundDriverProfile){

                const newPayment = await Payment.create({_outgoingUserId: userId, _receivingUserId: hostUserId, amount: paymentAmount, currency: currency})

                if(newPayment){

                    if(foundHostProfile.incomingPayments?.length > 0){
                        foundHostProfile.incomingPayments.push({_paymentId: newPayment._id, amount: paymentAmount, currency: currency})
                    } else{
                        foundHostProfile.incomingPayments = [{_paymentId: newPayment._id, amount: paymentAmount, currency: currency}]
                    }

                    if(foundDriverProfile.outgoingPayments?.length > 0){
                        foundDriverProfile.outgoingPayments.push({_paymentId: newPayment._id, amount: paymentAmount, currency: currency})
                    } else{
                        foundDriverProfile.outgoingPayments = [{_paymentId: newPayment._id, amount: paymentAmount, currency: currency}]
                    }

                    const savedHost = await foundHostProfile.save()
                    const savedDriver = await foundDriverProfile.save()

                    if(savedHost && savedDriver){
                        return res.status(201).json({ message: 'Success' })
                    }
                }
            }

        } catch(err){

            return res.status(401).json({ message: 'Operation failed' })
        }
    })
}

const addRefund = async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.purchiesjwt) return res.sendStatus(401);
    const refreshToken = cookies.purchiesjwt;

    User.findOne({ refreshToken }, async function(err, foundUser){

        if (err || !foundUser) return res.sendStatus(403); 
    
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {

                if (err || foundUser.username !== decoded.username || !foundUser._id.toString() === ((decoded.userId)) ) return res.sendStatus(403);
            }
        )        

        const { userId, hostUserId, currency, paymentAmount, paymentId } = req.body

        if (!userId || !hostUserId || !currency || !paymentAmount || !paymentId || paymentAmount > 50 ){
            return res.status(400).json({ 'message': 'Missing required fields!' });
        } 

        try {

            const foundHostProfile = await HostProfile.findOne({_userId: hostUserId})
            const foundDriverProfile = await DriverProfile.findOne({_userId: userId})

            if(foundHostProfile && foundDriverProfile){

                const foundPayment = await Payment.findOne({_id: paymentId})

                if(foundPayment){

                    var checkDriver = false;
                    var checkHost = false;

                    if(foundHostProfile?.incomingPayments.some(e=>e._paymentId.toString() === paymentId)){
                        
                        var changedHost = false;
                        for(let i=0; i<foundHostProfile?.incomingPayments?.length; i++){
                            
                            if(foundHostProfile.incomingPayments[i]._paymentId.toString() === paymentId){
                                foundHostProfile.incomingPayments[i].refunded = true;
                                changedHost = true;
                                break
                            }
                        }

                        if(changedHost){
                            const updatedHostProfile = await foundHostProfile.save()
                            if(updatedHostProfile){
                                checkHost = true
                            }
                        } else {
                            checkHost = true
                        }
                    }

                    if(foundDriverProfile?.outgoingPayments.some(e=>e._paymentId.toString() === paymentId)){
                        
                        var changedDriver = false;
                        for(let i=0; i<foundDriverProfile?.outgoingPayments?.length; i++){
                            
                            if(foundDriverProfile.outgoingPayments[i]._paymentId.toString() === paymentId){
                                foundDriverProfile.outgoingPayments[i].refunded = true;
                                changedDriver = true;
                                break
                            }
                        }

                        if(changedDriver){
                            const updatedHostProfile = await foundHostProfile.save()
                            if(updatedHostProfile){
                                checkHost = true
                            }
                        } else {
                            checkHost = true
                        }
                    }

                    if(!foundPayment.refunded && checkHost && checkDriver){
                        
                        const updatedPayment = await Payment.updateOne({_id: paymentId},{$set:{refunded: true}})

                        if(updatedPayment){

                            if(foundUser.credits?.length > 0 && foundUser.credits?.some(e => e.currency === currency)){

                                for(let i=0; i<foundUser.credits?.length; i++){
                                    if(foundUser.credits[i].currency === currency){
                                        foundUser.credits[i].amount = foundUser.credits[i].amount + paymentAmount
                                    }
                                }

                            } else if(foundUser.credits?.length > 0) {

                                var currencySymbol = "$"

                                if(currency.toLowerCase() === "usd"){

                                    currencySymbol = "$"

                                } else if(currency.toLowerCase() === "cad"){

                                    currencySymbol = "$"
                                }

                                foundUser.credits.push({currency: currency, currencySymbol: currencySymbol, amount: paymentAmount})


                            } else {

                                var currencySymbol = "$"

                                if(currency.toLowerCase() === "usd"){

                                    currencySymbol = "$"

                                } else if(currency.toLowerCase() === "cad"){

                                    currencySymbol = "$"
                                }

                                foundUser.credits = [{currency: currency.toLowerCase(), currencySymbol: currencySymbol, amount: paymentAmount}]
                            }

                            const updatedCredits = await foundUser.save()

                            if(updatedCredits){
                                return res.status(201).json({ message: 'Success' })   
                            }
                        }
                    }
                }
            }

        } catch(err){

            return res.status(401).json({ message: 'Operation failed' })
        }
    })
}


module.exports = { getHostIncomingPayments, getDriverOutgoingPayments, addPayment, addRefund }