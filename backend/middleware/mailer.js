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
      <p>Would it be possible to reupload photos for your profile? One or more of your ID photos was unclear. Apologies for the inconvenience!</p>
      <p><a target="_" href="${process.env.API}/activate/${userId}/${hash}">${process.env.MAIL_FROM_NAME}/activate </a></p>
      <p>Thanks,</p>
      <p>The ${process.env.MAIL_FROM_NAME} team</p>
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
    
    message = `Congratulations! Your booking request was approved. Please open the app to get directions. Happy charging!`
  
  } else if (notificationType === "Rejected"){
    
      message = `Sorry! Unfortunately, your booking request was not approved or someone got to the time slot first. Please try another booking!`
  
  } else if (notificationType === "Requested"){

      message = `Awesome, a booking request was made for your charger! Please open the app to review and approve the request.`
  
  } else if (notificationType === "CancelSubmitted"){

      message = `Unfortunately, someone requested to cancel and refund their booking. Please open the app to approve or reject the cancellation and refund request.`
  
  } else if (notificationType === "Cancelled"){

    message = `Sorry, your booking request was cancelled and refunded. Accounts with high volumes of cancellations will be reviewed.`
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
      <p>The ${process.env.MAIL_FROM_NAME} team</p>
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
      <p>The ${process.env.MAIL_FROM_NAME} team</p>
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
        <p>The ${process.env.MAIL_FROM_NAME} team</p>
      `,
      attachments: [{
        filename: 'SocketJuiceLogo.png',
        path: __dirname + '/SocketJuice.png',
        cid: 'myImg'
      }]    
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
        <p>The ${process.env.MAIL_FROM_NAME} team</p>
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
        <p>The ${process.env.MAIL_FROM_NAME} team</p>
      `,
      attachments: [{
        filename: 'SocketJuiceLogo.png',
        path: __dirname + '/SocketJuice.png',
        cid: 'myImg'
      }]    
    }
  
    return sendEmail(message);
  }


  exports.sendVerifiedToAdmin = function({verifiedUserId, verifiedPhone, verifiedFirstName, verifiedLastName, verifiedAddress}) {
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
        <p>Thanks for verifying your email and phone number! </p>
        <p></p>
        <p>Cheers,</p>
        <p>The ${process.env.MAIL_FROM_NAME} team</p>
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
        <p>The ${process.env.MAIL_FROM_NAME} team</p>
      `
    }
  
    return sendEmail(message);
  }


  exports.sendReportEmail = function({submittedUser, content}) {

    const regex = /(<([^>]+)>)/gi;
    const checkedContent = content.replace(regex, "");

    const message = {
      from: process.env.EMAIL_SUPPORT,
      // to: toUser.email // in production uncomment this
      to: process.env.EMAIL_SUPPORT,
      subject: 'SocketJuice - Feedback',
      html: `
        From: ${submittedUser}
        Feedback: ${checkedContent}
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
      <p>The ${process.env.MAIL_FROM_NAME} team</p>
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
          <p>The ${process.env.MAIL_FROM_NAME} team</p>
        `,
        attachments: [{
          filename: 'SocketJuiceLogo.png',
          path: __dirname + '/SocketJuice.png',
          cid: 'myImg'
        }]
      }

    return sendEmail(message);
}