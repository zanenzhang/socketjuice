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

exports.sendConfirmationEmail = function({toUser, userId, hash, firstName}) {

  const message = {
    from: process.env.EMAIL_SUPPORT,
    // to: toUser.email // in production uncomment this
    to: toUser,
    subject: 'SocketJuice - Activate Account',
    html: `
      <img src = "cid:myImg" style="width:200px;"/>
      <h3> Hello ${firstName}! </h3>
      <p>Thank you for registering and welcome to ${process.env.MAIL_FROM_NAME}! Just one last step remaining...</p>
      <p>To activate your account please follow this link: <a target="_" href="${process.env.API}/activate/${userId}/${hash}">${process.env.MAIL_FROM_NAME}/activate </a></p>
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

exports.sendHostRecordEmail = function({firstName, lastName, address, city, region, country}) {
  
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
      subject: 'SocketJuice - Account Verified',
      html: `
        <img src = "cid:myImg" style="width:200px;"/>
        <h3> Hello ${firstName}! </h3>
        <p>Thanks for verifying your email! A separate link was sent to finish the activation process!</p>
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

exports.sendResetPasswordEmail = ({toUser, userId, hash}) => {
  const message = {
    from: process.env.EMAIL_SUPPORT,
    // to: toUser.email // in production uncomment this
    to: toUser,
    subject: 'SocketJuice - Reset Password',
    html: `
      <h3>Hello!</h3>
      <p>To reset your password please follow this link: <a target="_" href="${process.env.CLIENT}/inputnewpassword?userId=${userId}&hash=${hash}">${process.env.MAIL_FROM_NAME}/inputnewpassword</a></p>
      <p>Cheers,</p>
      <p>The ${process.env.MAIL_FROM_NAME} team</p>
    `
  }

  return sendEmail(message);
}


exports.sendPassResetConfirmation = ({toUser}) => {
    const message = {
        from: process.env.EMAIL_SUPPORT,
        // to: toUser.email // in production uncomment this
        to: toUser,
        subject: 'SocketJuice - Password Was Reset!',
        html: `
          <h3>Hello!</h3>
          <p>This email is to notify that your password reset is complete. </p>
          <p>Cheers,</p>
          <p>The ${process.env.MAIL_FROM_NAME} team</p>
        `
      }

    return sendEmail(message);
}