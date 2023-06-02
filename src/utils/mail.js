const nodemailer = require("nodemailer");
// const sendgrid = require('@sendgrid/mail');
const constant = require('../config/const_credential');
// const formData = require('form-data');
// const Mailgun = require('mailgun.js');
// const mailgun = new Mailgun(formData);
// const API_KEY = constant.MAILGUN.MAILGUN_SECRET;
// const DOMAIN = 'RITANSHU';
// const client = mailgun.client({ username: 'api', key: 'aa2d4e4dfdbbee4bbceeadcba3768eff-4dd50799-ad04cda8' });

// sendgrid.setApiKey(constant.SENDGRID_API_KEY);
module.exports = class mail {
    otp;
    msg;
    constructor(email) {
        this.email = email;
        this.otp = mail.genOtp();
    }

    async sendOtp(msg) {
        this.msg = msg;
        return true;
    }
    static genOtp() {
       return process.env.NODE_ENV == 'prod' ? `${Math.floor(1000 + Math.random() * 9000)}` : "1234" ;
    }
    async sendMail(email, message, subject) {
        if (process.env.NODE_ENV != 'prod') return true;
        console.log("--email, message, subject---",email, message, subject);
console.log("process.env.MAIL_FROM",process.env.MAIL_FROM,"process.env.MAIL_APP_KEY",process.env.MAIL_APP_KEY,"DOMAIN", process.env.MAILGUN_DOMAIN )
        const mailgun = require("mailgun-js");
        const DOMAIN = process.env.MAILGUN_DOMAIN;
        const mg = await mailgun({ apiKey: process.env.MAIL_APP_KEY, domain: DOMAIN });
        console.log('mg',mg);
        const data = {
            from: process.env.MAIL_FROM,
            to: email,
            subject: subject,
            text: message
        };
        mg.messages().send(data, function (error, body) {
            console.log(body);
        });

        // ----------
//         const DOMAIN='www.admin.Riskle.com'
//         const client = mailgun.client({
//             username: 'api',
//             key: '5f4fbbbb65c0c47ffb794e65d8be68be-f8b3d330-e982ebcf',
//         });
//         const messageData = {
//             from: 'ritanshu.img@gmail.com',
//             to: 'rpchhipa@gmail.com',
//             subject: 'hello',
//             text:'mymail',
//         };
// console.log("--messageData---",messageData);
//             client.messages.create(DOMAIN, messageData)
//             .then((res) => {
//                 console.log("-THAN---",res.data);
//             })
//             .catch((err) => {
//                 console.error("--CATCH--",err);
//             });
        
        // const DOMAIN = process.env.MAILGUN_DOMAIN
        // const mg = mailgun.client({
        //     username: process.env.MAIL_USERNAME,
        //     key: process.env.MAILGUN_SECRET
        // });
        // mg.messages
        //     .create(DOMAIN, {
        //         from: process.env.MAIL_USERNAME,
        //         to: [email],
        //         subject: subject,
        //         text:message,
        //     })
        //     .then(msg => console.log("--thn--",msg)) // logs response data
        //     .catch(err => console.log("--catch--",err)); 
            
        // let mailOptions = {
        //     from: {
        //         name: process.env.APP_NAME,
        //         email: process.env.SENDGRID_EMAIL
        //     },
        //     to: email,
        //     subject: subject,
        //     html: message,
        // };
        // sendgrid.send(mailOptions).then((response) => {
        //     console.log('mail sent...', response);
        // }).catch((error) => {
        //     console.log(`error`, error);
        // })
       
    }
}