require('dotenv').config()
const axios = require('axios');
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

const base = "https://api-m.sandbox.paypal.com";
var paypal = require('paypal-rest-sdk');

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

  paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': process.env.PAYPAL_CLIENT_KEY_CAD,
    'client_secret': process.env.PAYPAL_SECRET_KEY_CAD
  });


  const generateAccessTokenCAD = async () => {
    try {
      if (!process.env.PAYPAL_CLIENT_KEY_CAD || !process.env.PAYPAL_SECRET_KEY_CAD ) {
        throw new Error("MISSING_API_CREDENTIALS");
      }
      const auth = Buffer.from(
        process.env.PAYPAL_CLIENT_KEY_CAD + ":" + process.env.PAYPAL_SECRET_KEY_CAD,
      ).toString("base64");
      const response = await axios.post(`${base}/v1/oauth2/token`, 
        "grant_type=client_credentials",
        { headers: {
          Authorization: `Basic ${auth}`,
        },
      });
  
      if(response){
        return response.data.access_token;
      }
      
    } catch (error) {
      console.error("Failed to generate Access Token:", error);
    }
  };

  const createOrder = async (cart, userId) => {

    var amount = "21.50"
    var currency = "USD"

    if(cart[0].currency && cart[0].currency.toLowerCase() === "usd"){

        if(cart[0].option === "A"){
            amount = "21.50"
        } else if (cart[0].option === "B"){
            amount = "42.00"
        } else if (cart[0].option === "C"){
            amount = "52.50"
        }

    } else if(cart[0].currency && cart[0].currency.toLowerCase() === "cad"){

        currency = "CAD"

        if(cart[0].option === "A"){
            amount = "21.50"
        } else if (cart[0].option === "B"){
            amount = "42.00"
        } else if (cart[0].option === "C"){
            amount = "52.50"
        }
    } 
  
    const accessToken = await generateAccessTokenCAD();
    const url = `${base}/v2/checkout/orders`;
    const payload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount,
          },
          custom_id: userId,
          reference_id: cart[0].option
        },
      ],
      application_context: {
            shipping_preference: "NO_SHIPPING"
        }
    };

    if(accessToken){
        const response = await axios.post(url, JSON.stringify(payload), 
            {
                headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
                // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
                // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
                // "PayPal-Mock-Response": '{"mock_application_codes": "MISSING_REQUIRED_PARAMETER"}'
                // "PayPal-Mock-Response": '{"mock_application_codes": "PERMISSION_DENIED"}'
                // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
                },
            });   
        
        if(response){
            return response
        }
        };
    }


    const captureOrder = async (orderID) => {

        const accessToken = await generateAccessTokenCAD();

        const url = `${base}/v2/checkout/orders/${orderID}/capture`;
      
        if(accessToken){

            const response = await axios.post(url, null, {
                headers: {
                "Authorization": `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                  // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
                  // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
                //   "PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
                  // "PayPal-Mock-Response": '{"mock_application_codes": "TRANSACTION_REFUSED"}'
                  // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
                },
            });
    
            if(response){
                return response
            }
        }
      };

const getHostIncomingPayments = async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.socketjuicejwt) return res.sendStatus(401);
    const refreshToken = cookies.socketjuicejwt;

    User.findOne({ refreshToken }, async function(err, foundUser){

        if (err || !foundUser) return res.sendStatus(403); 
    
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {

                if (err || !foundUser._id.toString() === ((decoded.userId)) ) return res.sendStatus(403);
            }
        )   

        var { userId, pageNumber, dateStart, dateEnd } = req.query

        if (!userId ) {
            return res.status(400).json({ message: 'Missing required information' })
        }

        if(!pageNumber){
            pageNumber = 0
        } else {
            pageNumber = Number(pageNumber)
        }

        if(dateStart && dateEnd){
            dateStart = new Date(dateStart)
            dateEnd = new Date(dateEnd)
        }

        const foundHostProfile = await HostProfile.findOne({_userId: userId})

        if(foundHostProfile){

            var searchobj = {_id: {$in: foundHostProfile?.incomingPayments.map(e =>e._paymentId)}}

            if(dateStart && dateEnd){
                searchobj["createdAt"] = {"$gte": dateStart, "$lte": dateEnd}
            }

            const foundPayments = await Payment.find(searchobj).skip(pageNumber).limit(100)

            if(foundPayments && foundPayments?.length > 0){

                return(res.status(200).json({foundPayments: foundPayments, stop: 0}))

            } else {

                return res.status(201).json({ stop: 1})    
            }

        } else {

            return res.status(201).json({ stop: 1})    
        }
    })
}   


const getBraintreeToken = async (req, res) => {
    
    const cookies = req.cookies;

    if (!cookies?.socketjuicejwt) return res.sendStatus(401);
    const refreshToken = cookies.socketjuicejwt;

    User.findOne({ refreshToken }, async function(err, foundUser){

        if (err || !foundUser) return res.sendStatus(403); 
    
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {

                if (err || !foundUser._id.toString() === ((decoded.userId)) ) return res.sendStatus(403);
            }
        )    
        
        const { loggedUserId } = req.query
    
        if(!loggedUserId || !foundUser._id.toString() === ((loggedUserId)) ) {
            return res.status(400).json({ 'message': 'Missing required fields!' });
        }

        gateway.clientToken.generate({}, (err, response) => {
            if (err) throw err;
            res.send({ clientToken: response.clientToken });
        });

    })
}   


const getPaypalTransactions = async (req, res) => {
    
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
    
    const cookies = req.cookies;

    if (!cookies?.socketjuicejwt) return res.sendStatus(401);
    const refreshToken = cookies.socketjuicejwt;

    User.findOne({ refreshToken }, async function(err, foundUser){

        if (err || !foundUser) return res.sendStatus(403); 
    
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {

                if (err || !foundUser._id.toString() === ((decoded.userId)) ) return res.sendStatus(403);
            }
        )   

        var { userId, pageNumber, dateStart, dateEnd } = req.query

        console.log("Getting outgoing payments")
        console.log(userId, pageNumber, dateStart, dateEnd)

        if (!userId ) {
            return res.status(400).json({ message: 'Missing required information' })
        }

        if(!pageNumber){
            pageNumber = 0
        } else {
            pageNumber = Number(pageNumber)
        }

        if(dateStart && dateEnd){
            dateStart = new Date(dateStart)
            dateEnd = new Date(dateEnd)
        }

        const foundDriverProfile = await DriverProfile.findOne({_userId: userId})

        if(foundDriverProfile){

            var searchobj = {_id: {$in: foundDriverProfile?.outgoingPayments.map(e =>e._paymentId)}}

            if(dateStart && dateEnd){
                searchobj["createdAt"] = {"$gte": dateStart, "$lte": dateEnd}
            }

            const foundPayments = await Payment.find(searchobj).skip(pageNumber).limit(100)

            if(foundPayments && foundPayments?.length > 0){

                return(res.status(200).json({foundPayments: foundPayments, stop: 0}))

            } else {

                return res.status(201).json({ stop: 1})    
            }

        } else {

            return res.status(201).json({ stop: 1})    
        }
    })
}   


const addPayment = async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.socketjuicejwt) return res.sendStatus(401);
    const refreshToken = cookies.socketjuicejwt;

    User.findOne({ refreshToken }, async function(err, foundUser){

        if (err || !foundUser) return res.sendStatus(403); 
    
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {

                if (err  || !foundUser._id.toString() === ((decoded.userId)) ) return res.sendStatus(403);
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


const addPayout = async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.socketjuicejwt) return res.sendStatus(401);
    const refreshToken = cookies.socketjuicejwt;

    User.findOne({ refreshToken }, async function(err, foundUser){

        if (err || !foundUser) return res.sendStatus(403); 
    
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {

                if (err  || !foundUser._id.toString() === ((decoded.userId)) || !(Object.values(foundUser.roles).includes(5150)) ) return res.sendStatus(403);
            }
        )        

        const { userId } = req.body

        if (!userId ) return res.status(400).json({ 'message': 'Missing required fields!' });

        try {

            const checkUser = await User.findOne({_id: userId, requestedPayout: true, flagged: false})

            if(!checkUser){
            
                return res.status(400).json({ 'message': 'Failed operation!' });
            
            } else {

                const foundDriverProfile = await DriverProfile.findOne({_userId: userId})

                if(foundDriverProfile){

                    var paymentAmount = 0
                    var currency = checkUser?.requestedPayoutCurrency.toLowerCase()

                    if(currency === 'cad'){
                        
                        if(checkUser.requestedPayoutOption === "A"){

                            paymentAmount = 20
    
                        } else if(checkUser.requestedPayoutOption === "B"){
    
                            paymentAmount = 40
    
                        } else if(checkUser.requestedPayoutOption === "C"){
    
                            paymentAmount = 50
                        }
                    
                    } else if(currency === 'usd'){
                        
                        if(checkUser.requestedPayoutOption === "A"){

                            paymentAmount = 20
    
                        } else if(checkUser.requestedPayoutOption === "B"){
    
                            paymentAmount = 40
    
                        } else if(checkUser.requestedPayoutOption === "C"){
    
                            paymentAmount = 50
                        }
                    }

                    var checkAmount = false;
                    if(checkUser.credits?.length > 0){

                        for(let i=0; i<checkUser.credits?.length; i++){
                            if(checkUser.credits[i].currency.toLowerCase() === currency){
                                if(checkUser.credits[i].amount >= paymentAmount){
                                    checkUser.credits[i].amount = checkUser.credits[i].amount - paymentAmount
                                    checkAmount = true
                                    break
                                }
                            }
                        }

                        if(!checkAmount){

                            const updatedUser = await User.updateOne({_id: userId},{$set: {requestedPayout: false, requestedPayoutOption: "None"}})

                            if(updatedUser){
                                return res.status(400).json({ 'message': 'Failed operation!' });
                            }
                        } else {

                            const newPayment = await Payment.create({ _sendingUserId: userId, _receivingUserId: userId, 
                                amount: paymentAmount, currency: currency, payout: true})

                            const saveUser = await checkUser.save()
    
                            if(newPayment && saveUser){

                                console.log("Reached here new payout 0")

                                var sender_batch_id = Math.random().toString(36).substring(9);

                                var create_payout_json = {
                                    "sender_batch_header": {
                                        "sender_batch_id": sender_batch_id,
                                        "email_subject": "SocketJuice - You have received a payment!"
                                    },
                                    "items": [
                                        {
                                            "recipient_type": "EMAIL",
                                            "amount": {
                                                "value": paymentAmount,
                                                "currency": currency.toUpperCase()
                                            },
                                            "receiver": checkUser.email,
                                            "note": "Thank you.",
                                            "sender_item_id": newPayment._id.toString()
                                        }
                                    ]
                                };

                                var sync_mode = 'false';

                                paypal.payout.create(create_payout_json, sync_mode, async function (error, payout) {
                                    if (error) {
                                        console.log(error.response);
                                        throw error;
                                    } else {
                                        console.log("Create Single Payout Response");
                                        console.log(payout);

                                        if(foundDriverProfile.outgoingPayments?.length > 0){
                                            foundDriverProfile.outgoingPayments.push({_paymentId: newPayment._id, amount: paymentAmount, 
                                                currency: currency, payout: true})
                                        } else{
                                            foundDriverProfile.outgoingPayments = [{_paymentId: newPayment._id, amount: paymentAmount, 
                                                currency: currency, payout: true}]
                                        }
                
                                        const savedDriver = await foundDriverProfile.save()
                
                                        if(savedDriver){

                                            var batchId = payout.batch_header.payout_batch_id
                                            var detailsurl = `${base}/v1/payments/payouts/${batchId}/`
                                            const accessToken = await generateAccessTokenCAD();

                                            if(accessToken){
                                                const payoutDetails = await axios.get(detailsurl, {
                                                    headers: {
                                                    "Authorization": `Bearer ${accessToken}`,
                                                      "Content-Type": "application/json",
                                                    },
                                                });
    
                                                if(payoutDetails){
                                                    console.log(payoutDetails.data)
                                                    console.log(payoutDetails.data.batch_header)
                                                    console.log(payoutDetails.data.batch_header.amount)
                                                    console.log(payoutDetails.data.batch_header.fees)
                                                    console.log(payoutDetails.data.batch_header.currency_conversion)
                                                    console.log("Completed")
                                                    return res.status(201).json({ message: 'Success' })
                                                }
                                            }

                                            
                                        }
                                    }
                                });
    
                            }
                        }

                    } else {
                        
                        return res.status(400).json({ 'message': 'Failed operation!' });
                    }
                }
            }

        } catch(err){

            console.log(err)
            return res.status(401).json({ message: 'Operation failed' })
        }
    })
}


const addRefund = async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.socketjuicejwt) return res.sendStatus(401);
    const refreshToken = cookies.socketjuicejwt;

    User.findOne({ refreshToken }, async function(err, foundUser){

        if (err || !foundUser) return res.sendStatus(403); 
    
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {

                if (err  || !foundUser._id.toString() === ((decoded.userId)) ) return res.sendStatus(403);
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



const addPaymentFlag = async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.socketjuicejwt) return res.sendStatus(401);
    const refreshToken = cookies.socketjuicejwt;

    User.findOne({ refreshToken }, async function(err, foundUser){

        if (err || !foundUser) return res.sendStatus(403); 
    
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {

                if (err  || !foundUser._id.toString() === ((decoded.userId)) ) return res.sendStatus(403);
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


const removePaymentFlag = async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.socketjuicejwt) return res.sendStatus(401);
    const refreshToken = cookies.socketjuicejwt;

    User.findOne({ refreshToken }, async function(err, foundUser){

        if (err || !foundUser) return res.sendStatus(403); 
    
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {

                if (err  || !foundUser._id.toString() === ((decoded.userId)) ) return res.sendStatus(403);
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

const addBraintreeSale = async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.socketjuicejwt) return res.sendStatus(401);
    const refreshToken = cookies.socketjuicejwt;

    User.findOne({ refreshToken }, async function(err, foundUser){

        if (err || !foundUser) return res.sendStatus(403); 
    
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {

                if (err  || !foundUser._id.toString() === ((decoded.userId)) ) return res.sendStatus(403);
            }
        )        

        const { userId, nonce, currency, paymentAmount } = req.body

        if (!userId || !nonce || !currency || !paymentAmount ) return res.status(400).json({ 'message': 'Missing required fields!' });

        var payamount = Number(paymentAmount)

        if(typeof(payamount) === NaN || payamount < 0 ){
            return res.status(401).json({ message: 'Operation failed' })
        }

        var currencySymbol = "$"

        if(currency.toLowerCase() === "cad"){
            currencySymbol = "$"
        } else if(currency.toLowerCase() === "usd"){
            currencySymbol = "$"
        } else if(currency.toLowerCase() === "eur"){
            currencySymbol = "€"
        } else if(currency.toLowerCase() === "gbp"){
            currencySymbol = "£"
        } else if(currency.toLowerCase() === "inr"){
            currencySymbol = "₹"
        } else if(currency.toLowerCase() === "jpy"){
            currencySymbol = "¥"
        } else if(currency.toLowerCase() === "cny"){
            currencySymbol = "¥"
        } else if(currency.toLowerCase() === "aud"){
            currencySymbol = "$"
        } else if(currency.toLowerCase() === "nzd"){
            currencySymbol = "$"
        }

        try {

            const newToken = crypto.randomBytes(3).toString('hex')

            const addedPayment = await Payment.create({ _sendingUserId: userId, _receivingUserId: userId, 
                amount: payamount, currency: currency, currencySymbol: currencySymbol, paymentToken: newToken})

            var doneId = false;
            var customerId = ""

            if(!foundUser.braintreeId){

                const result = await gateway.customer.create({
                    firstName: foundUser.firstName,
                    lastName: foundUser.lastName,
                    email: foundUser.email
                  })

                  if(result && result.success){

                    customerId = result?.customer?.id
                    const updateuser = await User.updateOne({_id: foundUser._id},{$set:{braintreeId: result?.customer?.id}})

                    if(updateuser){
                        doneId = true
                    }

                  } else {
                    console.log("Failed customer creation")
                    doneId = true    
                  }
                
            } else {
                
                customerId = foundUser.braintreeId
                doneId = true
            }

            if(addedPayment && doneId){

                const updatedProfile = await DriverProfile.updateOne({_userId: userId},{$push: {outgoingPayments: 
                        {_paymentId: addedPayment._id, amount: payamount, currency: currency }}})

                if(updatedProfile){

                    gateway.transaction.sale(
                        {
                        amount: payamount,
                        paymentMethodNonce: nonce,
                        options: {
                            submitForSettlement: true,
                        },
                        customerId: customerId,
                        options: {
                            storeInVaultOnSuccess: true
                        }
                        },
                        (err, result) => {
                            if (err) {
                                console.log(err)
                                return res.status(401).json({ message: 'Operation failed' })
                            }
                            res.status(200).json(result);
                        }
                    );
                }
            }

        } catch(err){

            return res.status(401).json({ message: 'Operation failed' })
        }
    })
}


const addPaypalOrder = async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.socketjuicejwt) return res.sendStatus(401);
    const refreshToken = cookies.socketjuicejwt;

    User.findOne({ refreshToken }, async function(err, foundUser){

        if (err || !foundUser) return res.sendStatus(403); 
    
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {

                if (err  || !foundUser._id.toString() === ((decoded.userId)) ) return res.sendStatus(403);
            }
        )        

        try {
            // use the cart information passed from the front-end to calculate the order amount detals
            const { cart } = req.body;

            if(!cart || cart?.length < 1){
                return res.status(500).json({ error: "Failed to create order." });
            }

            const response = await createOrder(cart, foundUser._id);
            if(response){
                return res.status(response.status).json(response.data);
            }
            
          } catch (error) {
            console.error("Failed to create order:", error);
            return res.status(500).json({ error: "Failed to create order." });
          }
    })
}


const capturePaypalOrder = async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.socketjuicejwt) return res.sendStatus(401);
    const refreshToken = cookies.socketjuicejwt;

    User.findOne({ refreshToken }, async function(err, foundUser){

        if (err || !foundUser) return res.sendStatus(403); 
    
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {

                if (err  || !foundUser._id.toString() === ((decoded.userId)) ) return res.sendStatus(403);
            }
        )        

        try {

            const { orderID } = req.body;

            if(!orderID){
               return res.status(500).json({ error: "Failed to capture order." });
            }

            const response = await captureOrder(orderID);
            
            if(response){

                if(response.status === 201){

                    var dataurl = `${base}/v2/checkout/orders/${orderID}/`
                    const accessToken = await generateAccessTokenCAD();

                    if(accessToken){

                        const orderData = await axios.get(dataurl, {
                            headers: {
                            "Authorization": `Bearer ${accessToken}`,
                              "Content-Type": "application/json",
                            },
                        });
                
                        if(orderData){

                            console.log("Order data here")
                            console.log(orderData.data)

                            if(orderData.data.status === "COMPLETED" && orderData.data.purchase_units[0]?.payments.captures[0].status === "COMPLETED"){

                                const orderId = orderData.data.id
                                const userId = orderData.data.purchase_units[0]?.custom_id
                                const option = orderData.data.purchase_units[0]?.reference_id
                                const currency = orderData.data.purchase_units[0]?.payments.captures[0].amount.currency_code.toLowerCase()
                                
                                const grossAmount = orderData.data.purchase_units[0]?.payments?.captures[0].seller_receivable_breakdown.gross_amount
                                const netAmount = orderData.data.purchase_units[0]?.payments?.captures[0].seller_receivable_breakdown.net_amount
                                const receivableAmount = orderData.data.purchase_units[0]?.payments?.captures[0].seller_receivable_breakdown.receivable_amount

                                console.log(currency)
                                console.log(option)
                                console.log(netAmount)

                                var currencySymbol = "$"

                                if(currency === "cad"){
                                    currencySymbol = "$"
                                } else if(currency === "usd"){
                                    currencySymbol = "$"
                                } else if(currency === "eur"){
                                    currencySymbol = "€"
                                } else if(currency === "gbp"){
                                    currencySymbol = "£"
                                } else if(currency === "inr"){
                                    currencySymbol = "₹"
                                } else if(currency === "jpy"){
                                    currencySymbol = "¥"
                                } else if(currency === "cny"){
                                    currencySymbol = "¥"
                                } else if(currency === "aud"){
                                    currencySymbol = "$"
                                } else if(currency === "nzd"){
                                    currencySymbol = "$"
                                }

                                var checkedAmount = false
                                var payamount = 0

                                if(currency === "usd"){
                                    
                                    if(option === "A"){

                                        if(Number(netAmount?.value) > 20){

                                            checkedAmount = true
                                            payamount = 20
                                        }

                                    } else if(option === "B"){

                                        if(Number(netAmount?.value) > 40){

                                            checkedAmount = true
                                            payamount = 40
                                        }

                                    } else if (option === "C"){

                                        if(Number(netAmount?.value) > 50){

                                            checkedAmount = true
                                            payamount = 50
                                        }
                                    }

                                } else if(currency === "cad"){
                                    
                                    if(option === "A"){

                                        if(Number(netAmount?.value) > 20){

                                            checkedAmount = true
                                            payamount = 20
                                        }

                                    } else if(option === "B"){

                                        if(Number(netAmount?.value) > 40){

                                            checkedAmount = true
                                            payamount = 40
                                        }

                                    } else if (option === "C"){

                                        if(Number(netAmount?.value) > 50){

                                            checkedAmount = true
                                            payamount = 50
                                        }
                                    }
                                } 

                                if(checkedAmount){

                                    const newToken = crypto.randomBytes(3).toString('hex')

                                    const addedPayment = await Payment.create( {_sendingUserId: userId, _receivingUserId: userId, paypalOrderId: orderId,
                                        amount: payamount, currency: currency, currencySymbol: currencySymbol, paymentToken: newToken,
                                        gross_amount: grossAmount, net_amount: netAmount, receiveable_amount: receivableAmount,
                                        payin: true})

                                    if(addedPayment){

                                        const updatedProfile = await DriverProfile.updateOne({_userId: userId},{$push: {outgoingPayments: 
                                                {_paymentId: addedPayment._id, amount: payamount, currency: currency, paypalOrderId: orderId, payin: true }}})

                                        var addedCredits = false
                                        if(foundUser.credits?.length > 0){
                                            for(let i=0; i<foundUser.credits?.length; i++){
                                                if(foundUser.credits[i].currency === currency){
                                                    foundUser.credits[i].amount = foundUser.credits[i].amount + payamount
                                                    addedCredits = true
                                                    break
                                                }
                                            }
                                            if(!addedCredits){
                                                foundUser.credits.push({currency: currency, currencySymbol: currencySymbol, amount: payamount})
                                            }
                                        } else {
                                            foundUser.credits = [{currency: currency, currencySymbol: currencySymbol, amount: payamount}]
                                        }

                                        const updatedUser = await foundUser.save()

                                        if(updatedProfile && updatedUser){
                                            console.log("Captured Paypal Order")
                                            return res.status(response.status).json({orderData: orderData?.data?.purchase_units[0]?.payments?.captures[0].amount});
                                        } else {
                                            return res.status(401).json({"message": "Failed operation"})
                                        }
                                    } else {
                                        return res.status(401).json({"message": "Failed operation"})
                                    }
                                }
                            
                            } else {
                                return res.status(response.status).json({orderData: orderData?.data});
                            }
                        } else {
                            return res.status(response.status).json(response);
                        }
                    } else {
                        return res.status(response.status).json(response);
                    }
                } else {
                    return res.status(response.status).json(response);
                }
            }
            
          } catch (error) {
            console.error("Failed to create order:", error);
            return res.status(500).json({ error: "Failed to capture order." });
          }
    })
}


const requestPayout = async (req, res) => {

    const cookies = req.cookies;

    if (!cookies?.socketjuicejwt) return res.sendStatus(401);
    const refreshToken = cookies.socketjuicejwt;

    User.findOne({ refreshToken }, async function(err, foundUser){

        if (err || !foundUser) return res.sendStatus(403); 
    
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {

                if (err  || !foundUser._id.toString() === ((decoded.userId))  ) return res.sendStatus(403);
            }
        )        

        var { userId, currency, option } = req.body

        if (!userId || !currency || !option){
            return res.status(400).json({ 'message': 'Missing required fields!' });
        } 

        currency = currency.toLowerCase()

        try {

            var paymentAmount = 0

            if(currency === 'cad'){
                
                if(option === "A"){

                    paymentAmount = 20

                } else if(option === "B"){

                    paymentAmount = 40

                } else if(option === "C"){

                    paymentAmount = 50
                }
            
            } else if(currency === 'usd'){
                
                if(option === "A"){

                    paymentAmount = 20

                } else if(option === "B"){

                    paymentAmount = 40

                } else if(option === "C"){

                    paymentAmount = 50
                }
            }

            var checkAmount = false;
            if(foundUser.credits?.length > 0){

                for(let i=0; i<foundUser.credits?.length; i++){
                    if(foundUser.credits[i].currency.toLowerCase() === currency){
                        if(foundUser.credits[i].amount >= paymentAmount){
                            checkAmount = true
                            break
                        }
                    }
                }

                if(!checkAmount){

                    res.status(400).json({ message: 'Missing required information' })

                } else {

                    const updateUser = await User.updateOne({_id: userId}, {$set: {requestedPayout: true, 
                        requestedPayoutCurrency: currency.toLowerCase(), requestedPayoutOption: option}})

                    if(updateUser){

                        res.status(201).json({ message: 'Success, requested payout for user' })
                    }
                }

            } else {

                res.status(401).json({ message: 'Operation failed' })
            }

        } catch(err){

            console.log(err)
            return res.status(401).json({ message: 'Operation failed' })
        }
    })
}


module.exports = { getHostIncomingPayments, getDriverOutgoingPayments, 
    addPayment, addRefund, addPayout, getBraintreeToken, addBraintreeSale,
    addPaypalOrder, capturePaypalOrder, requestPayout }