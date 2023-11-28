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
    // use the cart information passed from the front-end to calculate the purchase unit details
    console.log(
      "shopping cart information passed from the frontend:",
      cart,
    );

    //include currency, amount here

    var amount = "21.50"
    var currency = "USD"

    if(cart[0].currency && cart[0].currency === "USD"){

        currency = cart[0].currency.toUpperCase()

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
                console.log("Original capture response", response)

                return response
            }
        }
      };

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

        console.log("Getting payments token")
    
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

                if (err  || !foundUser._id.toString() === ((decoded.userId)) ) return res.sendStatus(403);
            }
        )        

        const { userId, hostUserId, currency, paymentAmount } = req.body

        if (!userId || !hostUserId || !currency || !paymentAmount ) return res.status(400).json({ 'message': 'Missing required fields!' });

        //Get transaction list from PayPal, verify before further processing

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

            const addedPayment = await Payment.create({_sendingUserId: userId, _receivingUserId: userId, 
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
                    console.log(result)

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
                console.log("RESPONSE HERE 1", response.data)
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

            console.log("Capturing order here")
            console.log(orderID)

            if(!orderID){
               return res.status(500).json({ error: "Failed to capture order." });
            }

            const response = await captureOrder(orderID);
            if(response){
                console.log("CAPTURE RESPONSE")
                console.log(response.status)

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
                            console.log("ORDER DATA HERE")
                            console.log(orderData.data) 
                            console.log(orderData.data.purchase_units) 
                            console.log("PAYMENTS DATA HERE")
                            console.log(orderData.data.purchase_units[0]?.payments) 

                            if(orderData.status === "COMPLETED" && orderData.data.purchase_units[0]?.payments.captures[0].status === "COMPLETED"){

                                const orderId = orderData._id
                                const userId = orderData.data.purchase_units[0]?.payments.captures[0].custom_id
                                const option = orderData.data.purchase_units[0]?.payments.captures[0].reference_id
                                const currency = orderData.data.purchase_units[0]?.payments.captures[0].amount.currency_code
                                
                                const grossAmount = orderData.data.purchase_units[0]?.payments.captures[0].seller_receivable_breakdown.gross_amount
                                const netAmount = orderData.data.purchase_units[0]?.payments.captures[0].seller_receivable_breakdown.net_amount
                                const receivableAmount = orderData.data.purchase_units[0]?.payments.captures[0].seller_receivable_breakdown.receivable_amount


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

                                var checkedAmount = false
                                var payamount = 0

                                if(currency.toLowerCase() === "usd"){
                                    
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

                                } else if(currency.toLowerCase() === "cad"){
                                    
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

                                    const addedPayment = await Payment.create({_sendingUserId: userId, _receivingUserId: userId, paypalOrderId: orderId,
                                        amount: payamount, currency: currency, currencySymbol: currencySymbol, paymentToken: newToken,
                                        gross_amount: grossAmount, net_amount: netAmount, receiveable_amount: receivableAmount})

                                    if(addedPayment){

                                        const updatedProfile = await DriverProfile.updateOne({_userId: userId},{$push: {outgoingPayments: 
                                                {_paymentId: addedPayment._id, amount: payamount, currency: currency, paypalOrderId: orderId }}})

                                        if(updatedProfile){
                                            return res.status(response.status).json({orderData: orderData?.data});
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
                        }
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


module.exports = { getHostIncomingPayments, getDriverOutgoingPayments, 
    addPayment, addRefund, addPayout, 
    getBraintreeToken, addBraintreeSale,
    addPaypalOrder, capturePaypalOrder }