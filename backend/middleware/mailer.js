const nodemailer = require('nodemailer');

function sendEmail(message) {
  return new Promise((res, rej) => {

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      //secure: false,
      auth: {
        user: process.env.EMAIL_USER,
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

exports.sendConfirmationEmail = function({toUser, userId, hash}) {
  const message = {
    from: process.env.EMAIL_USER,
    // to: toUser.email // in production uncomment this
    to: toUser,
    subject: 'Purchies - Activate Account',
    html: `
      <h3> Hello! </h3>
      <p>Thank you for registering and welcome to ${process.env.MAIL_FROM_NAME}! Just one last step remaining...</p>
      <p>To activate your account please follow this link: <a target="_" href="${process.env.API}/activate/${userId}/${hash}">${process.env.MAIL_FROM_NAME}/activate </a></p>
      <p>Cheers,</p>
      <p>The ${process.env.MAIL_FROM_NAME} team</p>
    `
  }

  return sendEmail(message);
}

exports.sendStoreRecordEmail = function({storename, displayname, address, primaryNumber, city, region, country, website}) {
  
  const regex = /(<([^>]+)>)/gi;
  const checkedStore = storename.replace(regex, "");
  const checkedDisplay = displayname.replace(regex, "");
  const checkedAddress = address.replace(regex, "");
  const checkedPrimaryNumber = primaryNumber.replace(regex, "");
  const checkedCity = city.replace(regex, "");
  const checkedRegion = region.replace(regex, "");
  const checkedCountry = country.replace(regex, "");
  const checkedWebsite = website.replace(regex, "");
  
  const message = {
    from: process.env.EMAIL_USER,
    // to: toUser.email // in production uncomment this
    to: 'storerecords@purchies.com',
    subject: 'Purchies - Store Record',
    html: `
      <p>${checkedStore} has just registered for an account</p>
      <p>Display name: ${checkedDisplay}</p>
      <p>Address: ${checkedAddress}</p>
      <p>Phone Number: ${checkedPrimaryNumber}</p>
      <p>City: ${checkedCity}</p> 
      <p>Region: ${checkedRegion}</p> 
      <p>Country: ${checkedCountry}</p> 
      <p>Website: ${checkedWebsite}</p> 
    `
  }

  return sendEmail(message);
}

exports.sendVerifiedEmail = function({toUser}) {
    const message = {
      from: process.env.EMAIL_USER,
      // to: toUser.email // in production uncomment this
      to: toUser,
      subject: 'Purchies - Account Verified',
      html: `
        <h3> Hello! </h3>
        <p>Thanks for verifying your account! Your account is now active!</p>
        <p>Cheers,</p>
        <p>The ${process.env.MAIL_FROM_NAME} team</p>
      `
    }
  
    return sendEmail(message);
  }

  exports.sendInvitationEmail = function({toUser, friendname, type, username}) {

    const regex = /(<([^>]+)>)/gi;
    const checkedName = friendname.replace(regex, "");

    const message = {
      from: process.env.EMAIL_USER,
      // to: toUser.email // in production uncomment this
      to: toUser,
      subject: 'Purchies - Invitation',
      html: `
        <h3> Hello! </h3>
        <p>Your friend, ${checkedName} has invited you to hang out together on <a target="_" href="https://purchies.com/">Purchies! </a></p>
        <p>You can check out your friend's profile at https://purchies.com/profile/${type}/${username} </p>
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
      from: process.env.EMAIL_USER,
      // to: toUser.email // in production uncomment this
      to: process.env.EMAIL_SUPPORT,
      subject: 'Purchies - Feedback',
      html: `
        From: ${submittedUser}
        Feedback: ${checkedContent}
      `
    }
  
    return sendEmail(message);
  }

  exports.sendOrderIssueEmail = function({submittedUser, content, order}) {

    const regex = /(<([^>]+)>)/gi;
    const checkedContent = content.replace(regex, "");

    const message = {
      from: process.env.EMAIL_USER,
      // to: toUser.email // in production uncomment this
      to: process.env.EMAIL_ORDERS,
      subject: 'Purchies - Issue With Order',
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
    from: process.env.EMAIL_USER,
    // to: toUser.email // in production uncomment this
    to: toUser,
    subject: 'Purchies - Reset Password',
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
        from: process.env.EMAIL_USER,
        // to: toUser.email // in production uncomment this
        to: toUser,
        subject: 'Purchies - Password Was Reset!',
        html: `
          <h3>Hello!</h3>
          <p>This email is to notify that your password reset is complete. </p>
          <p>Cheers,</p>
          <p>The ${process.env.MAIL_FROM_NAME} team</p>
        `
      }

    return sendEmail(message);
}