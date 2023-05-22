const mongoose = require('mongoose');
const userModel = require('../../models/userModel');
const notification = require("../../utils/notifications");
const sendgrid = require('@sendgrid/mail');
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const constant = require('../../config/const_credential');
const SMS = require("../../utils/sms");
class notificationServices {
    constructor() {
        return {
            getUser: this.getUser.bind(this),
            sendPushNotification: this.sendPushNotification.bind(this),
            sendEmailNotification: this.sendEmailNotification.bind(this),
            emailNotification: this.emailNotification.bind(this),
            smsNotificationData: this.smsNotificationData.bind(this),
        }
    }

    async getUser(query) {
        try {
            return await userModel.find(query)
        } catch (error) {
            throw error;
        }
    }
    async emailNotification(email, subject, message) {
        const DOMAIN = 'sandboxc1a767e82fff42d7988fbca0d0bd52df.mailgun.org'
        const mg = mailgun.client({
            username: 'api',
            key: 'aa2d4e4dfdbbee4bbceeadcba3768eff-4dd50799-ad04cda8',
        });
        mg.messages
            .create(DOMAIN, {
                from: "Mailgun Sandbox <postmaster@sandboxc1a767e82fff42d7988fbca0d0bd52df.mailgun.org>",
                to: [email],
                subject: subject,
                text: message,
            })
            .then(msg => console.log(msg)) // logs response data
            .catch(err => console.log("err",err));

        // let msg = {
        //     from: {
        //         name: constant.APP_NAME,
        //         email: constant.MAILGUN.MAILGUN_DOMAIN
        //     },
        //     to: email,
        //     subject: subject,
        //     html: `<strong>${message}</strong>`,
        // }
        // let msg={
        //     from:constant.MAILGUN.MAILGUN_DOMAIN,
        //      to: email,
        //     subject: subject,
        //      text:`<strong>${message}</strong>`
        // }

        // console.log("----msg----",msg)
        // mailgun.messages()
        //     .send(msg,(error,response) => {
        //         if(error){
        //             console.log("--mail send  error--",error)
        //         }
        //         console.log('mail sent...');
        //         console.log(response)
        //     })
        // const formData = require('form-data');
        // const mailgun = require('mailgun-js');
        //         var api_key = 'aa2d4e4dfdbbee4bbceeadcba3768eff-4dd50799-ad04cda8';
        // var domain = 'www.mydomain.com';
        // var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});
        // const mailgun = new Mailgun(formData);
        // const mg = mailgun.client({
        // 	username: 'api',
        // 	key: 'aa2d4e4dfdbbee4bbceeadcba3768eff-4dd50799-ad04cda8',
        // });
        // var data = {
        //     from: 'Mailgun Sandbox <postmaster@sandboxc1a767e82fff42d7988fbca0d0bd52df.mailgun.org>',
        //     to: email,
        //     subject: subject,
        //     text: message
        //   };
        //    console.log("data----mailgun-----",data)
        //   mailgun.messages().send(data, function (error, body) {
        //     console.log("mail error--",error)
        //     console.log(body);
        //   });
        // mg.messages
        // 	.create(sandboxc1a767e82fff42d7988fbca0d0bd52df.mailgun.org, {
        // 		from: "Mailgun Sandbox <postmaster@sandboxc1a767e82fff42d7988fbca0d0bd52df.mailgun.org>",
        // 		to: email,
        // 		subject: subject,
        // 		text: message,
        // 	})
        // 	.then(msg => console.log(msg)) // logs response data
        // 	.catch(err => console.log(err));
    }



    async sendPushNotification(req) {
        try {
            console.log("sendPushNotificationData s>",req.body)
            let receiverId = [];
            let entityId = [];
            let appKey = [];
            const notificationObject = {
                type: 'Admin Notification',
                title: req.body.title,
                message: req.body.message,
            };
            if (req.body.usertype === 'specific') {
                let uservalues = req.body.uservalues.split(',');
                for (let id of uservalues) {
                    console.log('id', id)
                    let user = await this.getUser({ _id: mongoose.Types.ObjectId(id) });
                    console.log('user', user)
                    appKey.push(user[0].app_key);
                    receiverId.push(user[0]._id);
                    entityId.push(user[0]._id);
                }
            }
            if (req.body.usertype === 'all') {
                let user = await this.getUser({ app_key: { $ne: '' } });
                for (let memb of user) {
                    appKey.push(memb.app_key);
                    receiverId.push(memb._id);
                    entityId.push(memb._id);
                }
            }
            notificationObject.receiverId = receiverId;
            notificationObject.entityId = entityId;
            notificationObject.deviceTokens = appKey;
            console.log("data>>>>>>>>",notificationObject)
            await notification.PushAllNotifications(notificationObject);
            return true;
        } catch (error) {
            console.log('error',error);
            throw error;
        }
    }
    async sendEmailNotification(req) {
        try {
            if (req.body.usertype === 'specific') {
                let uservalues = req.body.uservalues.split(',');
                for (let id of uservalues) {
                    let user = await this.getUser({ _id: mongoose.Types.ObjectId(id) });
                    this.emailNotification(user[0].email, req.body.title, req.body.message)
                }
            }
            if (req.body.usertype === 'all') {
                let user = await this.getUser({ user_status: 0 });
                for (let memb of user) {
                    this.emailNotification(memb.email, req.body.title, req.body.message)
                }
            }
            return true;
        } catch (error) {
            throw error;
        }
    }
    async smsNotificationData(req) {
        try {
            let title = req.body.title;
            let message = req.body.message;
            if (req.body.usertype === 'specific') {
                let user = await this.getUser({ _id: mongoose.Types.ObjectId(req.body.uservalues) });
                for (let memb of user) {
                    const sms = new SMS(memb.mobile);
                    await sms.sendSMS(
                        memb.mobile,
                        message
                    );
                }
            }
            if (req.body.usertype === 'all') {
                let user = await this.getUser({ app_key: { $ne: '' } });
                for (let memb of user) {
                    const sms = new SMS(memb.mobile);
                    await sms.sendSMS(
                        memb.mobile,
                        message
                    );
                }
            }
            return true;
        } catch (error) {
            throw error;
        }
    }
}
module.exports = new notificationServices();