const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

exports.getCode = async (req, res) => {
    client
        .verify
        .services(process.env.VERIFY_SERVICE_SID)
        .verifications
        .create({
            to: `+${req.query.phonenumber}`,
            channel: req.query.channel
        })
        .then(data => {
            res.status(200).send(data);
        })
};

exports.verifyCode = async (req, res) => {
    client
        .verify
        .services(process.env.VERIFY_SERVICE_SID)
        .verificationChecks
        .create({
            to: `+${req.query.phonenumber}`,
            code: req.query.code
        })
        .then(data => {
            res.status(200).send(data);
        });
};

const createService = async(req, res) => {
    client.verify.services.create({ friendlyName: 'phoneVerification' })
        .then(service => console.log(service.sid))
}

createService();

const sendVerification = async(req, res, number) => {

    client.verify.v2.services(process.env.TWILIO_VERIFICATION_SID)
        .verifications
        .create({to: `${number}`, channel: 'sms'})
        .then( verification => 
            console.log(verification.status)
        ); 
}

//check verification token
const checkVerification = async(req, res, number, code) => {
    return new Promise((resolve, reject) => {
        client.verify.v2.services(process.env.TWILIO_VERIFICATION_SID)
            .verificationChecks
            .create({to: `${number}`, code: `${code}`})
            .then(verification_check => {
                resolve(verification_check.status)
            });
    })
}

module.exports = {
    sendVerification,
    checkVerification
}