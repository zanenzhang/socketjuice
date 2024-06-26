const nodemailer = require('nodemailer');


function sendEmail(message) {
  return new Promise((res, rej) => {

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      //secure: false,
      auth: {
        user: process.env.EMAIL_SUPPORT,
        pass: process.env.EMAIL_PASSWORD
      }
    })

    transporter.sendMail(message, function(err, info) {
      if (err) {
        console.log(err)
        rej(err)
      } else {
        res(info)
      }
    })
  })
}

exports.sendReverifyEmail = function({toUser, userId, hash, firstName}) {

  const message = {
    from: process.env.EMAIL_SUPPORT,
    to: toUser,
    subject: 'SocketJuice - Please Reupload Photos For Profile',
    html: `
      <img src = "cid:myImg" style="width:200px;"/>
      <h3> Hello ${firstName}! </h3>
      <p>Welcome again to ${process.env.MAIL_FROM_NAME}!</p>
      <p>Would it be possible to reupload photos for your profile? One or more of your ID photos was unclear. Apologies for the inconvenience.</p>
      <p><a target="_" href="${process.env.API}/activate/${userId}/${hash}">${process.env.MAIL_FROM_NAME}/activate </a></p>
      <p>Thanks,</p>
      <p>The ${process.env.MAIL_FROM_NAME} Team</p>
    `,
    attachments: [{
      filename: 'SocketJuiceLogo.png',
      path: __dirname + '/SocketJuice.png',
      cid: 'myImg'
    }]
  }

  return sendEmail(message);
}

exports.sendNotiEmail = function({firstName, toUser, notificationType}) {

  var message = ""

  if(notificationType === "Approved"){
    
    message = `Congratulations! Your booking request was approved. Please open the app to get directions. You can see more information under the bookings page (outgoing bookings). Happy charging!`
  
  } else if (notificationType === "Rejected"){
    
      message = `Sorry! Unfortunately, your booking request was not approved or someone got to the time slot first. Please try another booking!`
  
  } else if (notificationType === "Requested"){

      message = `Awesome, a booking request was made for your charger! Please open the app to review and approve the request. You can see more information under the bookings page (incoming bookings).`
  
  } else if (notificationType === "CancelSubmitted"){

      message = `Unfortunately, someone requested to cancel and refund their booking. Please open the app and go to the bookings page (incoming bookings) to approve or reject the cancellation and refund request.`
  
  } else if (notificationType === "Cancelled"){

    message = `Sorry, your booking request was cancelled and refunded. You can see more information under the bookings page (outgoing bookings) in the web application. Accounts with high volumes of cancellations will be reviewed.`
  }

  console.log("Sending noti email")

  const messageObj = {
    from: process.env.EMAIL_SUPPORT,
    // add a new email address in development for notifications
    to: toUser,
    subject: 'SocketJuice - Booking Notification (No Reply)',
    html: `
      <img src = "cid:myImg" style="width:200px;"/>
      <h3> Hello ${firstName}! </h3>
      <p> ${message} </p>
      <p><a target="_" href="${process.env.API}/bookings">${process.env.MAIL_FROM_NAME}/bookings </a></p>
      <p>Thanks,</p>
      <p>The ${process.env.MAIL_FROM_NAME} Team</p>
    `,
    attachments: [{
      filename: 'SocketJuiceLogo.png',
      path: __dirname + '/SocketJuice.png',
      cid: 'myImg'
    }]
  }

  return sendEmail(messageObj);
}

exports.sendConfirmationEmail = function({toUser, userId, hash, firstName}) {

  const message = {
    from: process.env.EMAIL_SUPPORT,
    // to: toUser.email // in production uncomment this
    to: toUser,
    subject: 'SocketJuice - Activate Account',
    html: `
      <img src = "cid:myImg" style="width:200px;"/>
      <h3> Hello ${firstName}! </h3>
      <p>Thank you for registering and welcome to ${process.env.MAIL_FROM_NAME}! Just a few more things remaining...</p>
      <p>To activate your account and confirm your phone number please follow this link: <a target="_" href="${process.env.API}/activate/${userId}/${hash}">${process.env.MAIL_FROM_NAME}/activate </a></p>
      <p>Cheers,</p>
      <p>The ${process.env.MAIL_FROM_NAME} Team</p>
    `,
    attachments: [{
      filename: 'SocketJuiceLogo.png',
      path: __dirname + '/SocketJuice.png',
      cid: 'myImg'
    }]
  }

  return sendEmail(message);
}

exports.sendHostRecordEmail = function({userId, firstName, lastName, address, city, region, country}) {
  
  const regex = /(<([^>]+)>)/gi;
  const checkedFirstName = firstName.replace(regex, "");
  const checkedLastName = lastName.replace(regex, "");
  const checkedAddress = address.replace(regex, "");
  const checkedCity = city.replace(regex, "");
  const checkedRegion = region.replace(regex, "");
  const checkedCountry = country.replace(regex, "");
  
  const message = {
    from: process.env.EMAIL_SUPPORT,
    // to: toUser.email // in production uncomment this
    to: process.env.EMAIL_SUPPORT,
    subject: 'SocketJuice - Host Record',
    html: `
      <p>UserId: ${userId} </p>
      <p>${checkedFirstName}, ${checkedLastName} has just registered for an account</p>
      <p>Address: ${checkedAddress}</p>
      <p>City: ${checkedCity}</p> 
      <p>Region: ${checkedRegion}</p> 
      <p>Country: ${checkedCountry}</p> 
    `
  }

  return sendEmail(message);
}

exports.sendVerifiedEmail = function({toUser, firstName}) {
    const message = {
      from: process.env.EMAIL_SUPPORT,
      // to: toUser.email // in production uncomment this
      to: toUser,
      subject: 'SocketJuice - Email Verified',
      html: `
        <img src = "cid:myImg" style="width:200px;"/>
        <h3> Hello ${firstName}! </h3>
        <p>Thanks for verifying your email! </p>
        <p>Cheers,</p>
        <p>The ${process.env.MAIL_FROM_NAME} Team</p>
      `,
      attachments: [{
        filename: 'SocketJuiceLogo.png',
        path: __dirname + '/SocketJuice.png',
        cid: 'myImg'
      }]    
    }
  
    return sendEmail(message);
  }


  exports.sendMessageUpdate = function({toUser, firstName, fromUserFirstName}) {
    const message = {
      from: process.env.EMAIL_SUPPORT,
      // to: toUser.email // in production uncomment this
      to: toUser,
      subject: 'SocketJuice - You have received a chat message',
      html: `
        <img src = "cid:myImg" style="width:200px;"/>
        <h3> Hello ${firstName}! </h3>
        <p> You have received a chat message from ${fromUserFirstName}! </p>
        <p> This will be the only notification we send for the conversation.</p>
        <p> Please log into the web application to see the message.</p>
        <p>Cheers,</p>
        <p>The ${process.env.MAIL_FROM_NAME} Team</p>
      `,
      attachments: [{
        filename: 'SocketJuiceLogo.png',
        path: __dirname + '/SocketJuice.png',
        cid: 'myImg'
      }]    
    }
  
    return sendEmail(message);
  }


  exports.sendHelpMessage = function({submitterName, submitterPhone, submitterUserId, 
    appointmentId, problemName, problemUserId, problemPhone, comment}) {

    const message = {
      from: process.env.EMAIL_SUPPORT,
      // to: toUser.email // in production uncomment this
      to: process.env.EMAIL_SUPPORT,
      subject: `SocketJuice - Requested Help - ${submitterUserId}`,
      html: `
        <p> Submitter name ${submitterName}! </p>
        <p> Submitter phone number ${submitterPhone}! </p>
        <p> Submitter User Id ${submitterUserId}! </p>
        <p> </p>
        <p> Appointment Id ${appointmentId}! </p>
        <p> </p>
        <p> Problem person name ${problemName}! </p>
        <p> Problem person user Id ${problemUserId}! </p>
        <p> Problem person phone number ${problemPhone}! </p>
        <p> </p>
        <p>${comment} </p>
      `,
    }
  
    return sendEmail(message);
  }


  exports.sendHostProfileConfirm = function({toUser, firstName}) {
    const message = {
      from: process.env.EMAIL_SUPPORT,
      // to: toUser.email // in production uncomment this
      to: toUser,
      subject: 'SocketJuice - Host Profile Verified',
      html: `
        <img src = "cid:myImg" style="width:200px;"/>
        <h3> Hello ${firstName}! </h3>
        <p>Your charging equipment looks great, you can now accept bookings from other EV drivers and earn money! </p>
        <p>Cheers,</p>
        <p>The ${process.env.MAIL_FROM_NAME} Team</p>
      `,
      attachments: [{
        filename: 'SocketJuiceLogo.png',
        path: __dirname + '/SocketJuice.png',
        cid: 'myImg'
      }]    
    }
  
    return sendEmail(message);
  }


  exports.sendRejectedHost = function({toUser, firstName}) {
    const message = {
      from: process.env.EMAIL_SUPPORT,
      // to: toUser.email // in production uncomment this
      to: toUser,
      subject: 'SocketJuice - Require Charging Information',
      html: `
        <img src = "cid:myImg" style="width:200px;"/>
        <h3> Hello ${firstName}! </h3>
        <p> Would it be possible to reupload your charging information and content? </p>
        <p> As a reminder, the photo of the plug connector is to allow us to see the connector type (head pattern). </p>
        <p><a target="_" href="${process.env.API}/bookings">${process.env.MAIL_FROM_NAME}/bookings </a></p>
        <p>Thanks very much,</p>
        <p>The ${process.env.MAIL_FROM_NAME} Team</p>
      `,
      attachments: [{
        filename: 'SocketJuiceLogo.png',
        path: __dirname + '/SocketJuice.png',
        cid: 'myImg'
      }]    
    }
  
    return sendEmail(message);
  }


  exports.sendVerifiedToAdmin = function({verifiedUserId, verifiedPhone, verifiedFirstName, verifiedLastName}) {
    const message = {
      from: process.env.EMAIL_SUPPORT,
      // to: toUser.email // in production uncomment this
      to: process.env.EMAIL_SUPPORT,
      subject: 'SocketJuice - New Profile Submitted',
      html: `
        <p>A new user has uploaded a profile </p>
        <p>UserId: ${verifiedUserId}</p>
        <p>Phone Number: ${verifiedPhone}</p>
        <p>First Name: ${verifiedFirstName}</p>
        <p>Last Name: ${verifiedLastName}</p>
      `,
    }
  
    return sendEmail(message);
  }

  exports.sendNewHostToAdmin = function({hostUserId, hostPhone, hostFirstName, hostLastName, hostAddress}) {
    const message = {
      from: process.env.EMAIL_SUPPORT,
      // to: toUser.email // in production uncomment this
      to: process.env.EMAIL_SUPPORT,
      subject: 'SocketJuice - New Host Submitted',
      html: `
        <p>A new host has applied </p>
        <p>UserId: ${hostUserId}</p>
        <p>Phone Number: ${hostPhone}</p>
        <p>First Name: ${hostFirstName}</p>
        <p>Last Name: ${hostLastName}</p>
        <p>Address: ${hostAddress}</p>
      `,
    }
  
    return sendEmail(message);
  }

  exports.sendVerifiedAccount = function({toUser, firstName}) {
    const message = {
      from: process.env.EMAIL_SUPPORT,
      // to: toUser.email // in production uncomment this
      to: toUser,
      subject: 'SocketJuice - Account Verified',
      html: `
        <img src = "cid:myImg" style="width:200px;"/>
        <h3> Hello ${firstName}! </h3>
        <p>Thanks for verifying your email and phone number, and another thanks for submitting your profile! </p>
        <p>We will review your profile and if something is unclear, we will check back with you.</p>
        <p></p>
        <p>Welcome again to SocketJuice!</p>
        <p></p>
        <p>Cheers,</p>
        <p>The ${process.env.MAIL_FROM_NAME} Team</p>
      `,
      attachments: [{
        filename: 'SocketJuiceLogo.png',
        path: __dirname + '/SocketJuice.png',
        cid: 'myImg'
      }]    
    }
  
    return sendEmail(message);
  }


  exports.sendReceiptOutgoing = function({toUser, firstName, amount, currency, currencySymbol}) {

    var today = new Date()
    var newdate = today.toLocaleDateString()
    var newtime = today.toLocaleTimeString()

    const message = {
      from: process.env.EMAIL_SUPPORT,
      // to: toUser.email // in production uncomment this
      to: toUser,
      subject: 'SocketJuice - Outgoing Payment Receipt',
      html: `
        <img src = "cid:myImg" style="width:200px;"/>
        <h3> Hello ${firstName}! </h3>
        <p>This is a receipt for your outgoing payment. This payment has been deducted from your account balance. </p>
        <p>Details: </p>
        <p>Amount: ${currency.toUpperCase()} ${currencySymbol} ${amount.toFixed(2)} </p>
        <p>Time: ${newdate} ${newtime} </p>
        <p></p>
        <p>Cheers,</p>
        <p>The ${process.env.MAIL_FROM_NAME} Team</p>
      `,
      attachments: [{
        filename: 'SocketJuiceLogo.png',
        path: __dirname + '/SocketJuice.png',
        cid: 'myImg'
      }]    
    }
  
    return sendEmail(message);
  }


  exports.sendPayoutRejection = function({toUser, firstName}) {

    var today = new Date()
    var newdate = today.toLocaleDateString()
    var newtime = today.toLocaleTimeString()

    const message = {
      from: process.env.EMAIL_SUPPORT,
      // to: toUser.email // in production uncomment this
      to: toUser,
      subject: 'SocketJuice Payout Request',
      html: `
        <img src = "cid:myImg" style="width:200px;"/>
        <h3> Hello ${firstName}, </h3>
        <p>Your payout request unfortunately was not processed due to discrepancies in your account. Your account has been placed under review. We will follow up with you directly to clear up any issues.</p>
        <p>Details: Payout request was not processed. </p>
        <p>Time: ${newdate} ${newtime} </p>
        <p></p>
        <p>Regards,</p>
        <p>The ${process.env.MAIL_FROM_NAME} Team</p>
      `,
      attachments: [{
        filename: 'SocketJuiceLogo.png',
        path: __dirname + '/SocketJuice.png',
        cid: 'myImg'
      }]    
    }
  
    return sendEmail(message);
  }



  exports.sendReceiptIncoming = function({toUser, firstName, amount, currency, currencySymbol}) {

    var today = new Date()
    var newdate = today.toLocaleDateString()
    var newtime = today.toLocaleTimeString()

    const message = {
      from: process.env.EMAIL_SUPPORT,
      // to: toUser.email // in production uncomment this
      to: toUser,
      subject: 'SocketJuice - Incoming Payment Receipt',
      html: `
        <img src = "cid:myImg" style="width:200px;"/>
        <h3> Hello ${firstName}! </h3>
        <p>Nice! You have received a new payment in your account! </p>
        <p>This payment has been added to your account balance. </p>
        <p>Details: </p>
        <p>Amount: ${currency.toUpperCase()} ${currencySymbol} ${amount.toFixed(2)} </p>
        <p>Time: ${newdate} ${newtime} </p>
        <p></p>
        <p>Cheers,</p>
        <p>The ${process.env.MAIL_FROM_NAME} Team</p>
      `,
      attachments: [{
        filename: 'SocketJuiceLogo.png',
        path: __dirname + '/SocketJuice.png',
        cid: 'myImg'
      }]    
    }
  
    return sendEmail(message);
  }



  exports.sendInvitationEmail = function({toUser, friendname, type, username}) {

    const regex = /(<([^>]+)>)/gi;
    const checkedName = friendname.replace(regex, "");

    const message = {
      from: process.env.EMAIL_SUPPORT,
      // to: toUser.email // in production uncomment this
      to: toUser,
      subject: 'SocketJuice - Invitation',
      html: `
        <h3> Hello! </h3>
        <p>Your friend, ${checkedName} has invited you to check out <a target="_" href="https://socketjuice.com/">SocketJuice! </a></p>
        <p>Cheers,</p>
        <p>The ${process.env.MAIL_FROM_NAME} Team</p>
      `
    }
  
    return sendEmail(message);
  }


  exports.sendReportEmail = function({submittedUser, submittedUserId, content}) {

    const regex = /(<([^>]+)>)/gi;
    const checkedContent = content.replace(regex, "");

    const message = {
      from: process.env.EMAIL_SUPPORT,
      // to: toUser.email // in production uncomment this
      to: process.env.EMAIL_SUPPORT,
      subject: 'SocketJuice - Feedback',
      html: `
        <p> From: ${submittedUser} </p>
        <p> UserId: ${submittedUserId} </p>
        <p> Feedback: ${checkedContent} </p>
      `
    }
  
    return sendEmail(message);
  }

  exports.sendAppointmentIssueEmail = function({submittedUser, content, order}) {

    const regex = /(<([^>]+)>)/gi;
    const checkedContent = content.replace(regex, "");

    const message = {
      from: process.env.EMAIL_SUPPORT,
      // to: toUser.email // in production uncomment this
      to: process.env.EMAIL_SUPPORT,
      subject: 'SocketJuice - Issue With Order',
      html: `
        From: ${submittedUser}
        Order: ${order}
        Issue: ${checkedContent}
      `
    }
  
    return sendEmail(message);
  }

exports.sendResetPasswordEmail = ({toUser, firstName, userId, hash}) => {
  const message = {
    from: process.env.EMAIL_SUPPORT,
    // to: toUser.email // in production uncomment this
    to: toUser,
    subject: 'SocketJuice - Reset Password',
    html: `
      <img src = "cid:myImg" style="width:200px;"/>
      <h3>Hello ${firstName}!</h3>
      <p>To reset your password please follow this link: <a target="_" href="${process.env.CLIENT}/inputnewpassword?userId=${userId}&hash=${hash}">${process.env.MAIL_FROM_NAME}/inputnewpassword</a></p>
      <p>Cheers,</p>
      <p>The ${process.env.MAIL_FROM_NAME} Team</p>
    `,
    attachments: [{
      filename: 'SocketJuiceLogo.png',
      path: __dirname + '/SocketJuice.png',
      cid: 'myImg'
    }]
  }

  return sendEmail(message);
}


exports.sendPassResetConfirmation = ({toUser, firstName}) => {
    const message = {
        from: process.env.EMAIL_SUPPORT,
        // to: toUser.email // in production uncomment this
        to: toUser,
        subject: 'SocketJuice - Password Was Reset!',
        html: `
          <img src = "cid:myImg" style="width:200px;"/>
          <h3>Hello ${firstName}!</h3>
          <p>This email is to notify that your password reset is complete. </p>
          <p>Cheers,</p>
          <p>The ${process.env.MAIL_FROM_NAME} Team</p>
        `,
        attachments: [{
          filename: 'SocketJuiceLogo.png',
          path: __dirname + '/SocketJuice.png',
          cid: 'myImg'
        }]
      }

    return sendEmail(message);
}