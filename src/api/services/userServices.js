const mongoose = require("mongoose");
const randomstring = require("randomstring");
const bcrypt = require("bcrypt");
//sahil start phoneoay
const request = require('request');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const PaymentData = require('../../models/PaymentData');
//const PaymentProcess = require('./models/PaymentProcess');
//const User = require('./models/User');
//const UserBalance = require('./models/UserBalance');
//const Notification = require('./models/Notification');

//sahil end phonepay
const jwt = require("jsonwebtoken");

const moment = require("moment");
const path = require("path");
const crypto = require("crypto");
const hmacSHA256 = require("crypto-js/hmac-sha256");
const Base64 = require("crypto-js/hmac-sha256");
const CryptoJS = require("crypto-js");
const bonusReferedModel = require("../../models/bonusReferedModel");
const listmatchModel = require("../../models/listMatchesModel");
const userModel = require("../../models/userModel");
const finalResultModel = require("../../models/finalResultModel");
const tempuserModel = require("../../models/tempUserModel");
const TransactionModel = require("../../models/transactionModel");
const NotificationModel = require("../../models/notificationModel");
const AdminModel = require("../../models/adminModel");
const WithdrawModel = require("../../models/withdrawModel");
const PaymentProcessModel = require("../../models/PaymentProcessModel");
const withdrawWebhookModel = require("../../models/withdrawWebhookModel");
const offerModel = require("../../models/offerModel");
const usedOfferModel = require("../../models/usedOfferModel");
const ticketOrderModel = require("../../models/ticketOrderModel");
const JoinLeaugeModel = require("../../models/JoinLeaugeModel");
const matchChallengersModel = require("../../models/matchChallengersModel");
const constant = require("../../config/const_credential");
const NOTIFICATION_TEXT = require("../../config/notification_text");
const notification = require("../../utils/notifications");
const appUtils = require("../../utils/appUtils");
const SMS = require("../../utils/sms");
const Mail = require("../../utils/mail");
const GetBouns = require("../../utils/getBonus");
const { constants } = require("buffer");
const Cashfree = require("cashfree-sdk");
const seriesModel = require("../../models/addSeriesModel");
const seriesPriceCardModel = require("../../models/seriesPriceCardModel");
const series_leaderboardModel = require("../../models/seriesLeaderBoardModel");
const Razorpay = require('razorpay');
const Redis = require('../../utils/redis');
let instance
let USERNAME
let PASSWORD
let RAZORPAY_ACC
let KEY_SECRET
let KEY_ID
if (process.env.NODE_ENV == 'prod') {
  KEY_ID = constant.RAZORPAY_KEY_ID_LIVE,
    KEY_SECRET = constant.RAZORPAY_KEY_SECRET_LIVE,
    USERNAME = constant.RAZORPAY_KEY_ID_LIVE,
    PASSWORD = constant.RAZORPAY_KEY_SECRET_LIVE
  RAZORPAY_ACC = constant.RAZORPAY_ACC_LIVE
} else {
  KEY_ID = constant.RAZORPAY_KEY_ID_TEST
  KEY_SECRET = constant.RAZORPAY_KEY_SECRET_TEST
  USERNAME = constant.RAZORPAY_KEY_ID_TEST,
    PASSWORD = constant.RAZORPAY_KEY_SECRET_TEST
  RAZORPAY_ACC = constant.RAZORPAY_ACC_TEST
}
instance = new Razorpay({
  key_id: KEY_ID,
  key_secret: KEY_SECRET,
});

class UserServices {
  constructor() {
    return {
      addTempuser: this.addTempuser.bind(this),
      registerUser: this.registerUser.bind(this),
      loginuser: this.loginuser.bind(this),
      loginuserOTP: this.loginuserOTP.bind(this),
      logoutUser: this.logoutUser.bind(this),
      viewtransactions: this.viewtransactions.bind(this),
      blockUser: this.blockUser.bind(this),
      unBlockUser: this.unBlockUser.bind(this),
      editUserDetails_page: this.editUserDetails_page.bind(this),
      edituserdetails: this.edituserdetails.bind(this),
      adminwallet: this.adminwallet.bind(this),
      getUserDetails: this.getUserDetails.bind(this),
      addmoneyinwallet: this.addmoneyinwallet.bind(this),
      downloadalluserdetails: this.downloadalluserdetails.bind(this),
      changeYotuberStatus: this.changeYotuberStatus.bind(this),
      userFullDetails: this.userFullDetails.bind(this),
      userReferList: this.userReferList.bind(this),
      forgotPassword: this.forgotPassword.bind(this),
      socialAuthentication: this.socialAuthentication.bind(this),
      getVersion: this.getVersion.bind(this),
      matchCodeForReset: this.matchCodeForReset.bind(this),
      editProfile: this.editProfile.bind(this),
      getmainbanner: this.getmainbanner.bind(this),
      getwebslider: this.getwebslider.bind(this),
      resendOTP: this.resendOTP.bind(this),
      verifyMobileNumber: this.verifyMobileNumber.bind(this),
      verifyEmail: this.verifyEmail.bind(this),
      verifyCode: this.verifyCode.bind(this),
      allverify: this.allverify.bind(this),
      myTransactions: this.myTransactions.bind(this),
      resetPassword: this.resetPassword.bind(this),
      changePassword: this.changePassword.bind(this),
      panRequest: this.panRequest.bind(this),
      panDetails: this.panDetails.bind(this),
      bankRequest: this.bankRequest.bind(this),
      bankDetails: this.bankDetails.bind(this),
      getBalance: this.getBalance.bind(this),
      myWalletDetails: this.myWalletDetails.bind(this),
      requestWithdraw: this.requestWithdraw.bind(this),
      myWithdrawList: this.myWithdrawList.bind(this),
      requestAddCash: this.requestAddCash.bind(this),
      webhookDetail: this.webhookDetail.bind(this),
      getNotification: this.getNotification.bind(this),
      userDataWebhook: this.userDataWebhook.bind(this),
      getOffers: this.getOffers.bind(this),
      givebonusToUser: this.givebonusToUser.bind(this),
      cashfreePayoutWebhook: this.cashfreePayoutWebhook.bind(this),
      getYoutuberProfit: this.getYoutuberProfit.bind(this),
      uploadUserImage: this.uploadUserImage.bind(this),
      referBonus: this.referBonus.bind(this),
      popupNotify: this.popupNotify.bind(this),
      getAllSeries: this.getAllSeries.bind(this),
      getleaderboard: this.getleaderboard.bind(this),
      //getLeaderBoardbyCat: this.getLeaderBoardbyCat.bind(this),
      addAmountTransection: this.addAmountTransection.bind(this),
      AddAmountNotification: this.AddAmountNotification.bind(this),
      addcash1: this.addcash1.bind(this),
      referDetails: this.referDetails.bind(this),
      phonePayWebhook: this.phonePayWebhook.bind(this),
      cashfreewebhook: this.cashfreewebhook.bind(this)
    }
  }
  async findUser(data) {
    let result = await userModel.find(data);
    console.log("result...............", result)
    return result;
  }

  /**
 * @function genrateReferCode
 * @description using this function to generate refercode for user
 * @param {mobile}
 * @author 
 */
  async genrateReferCode(mobile) {
    const char = String(mobile).substring(0, 4);
    const coupon = randomstring.generate({
      charset: "alphanumeric",
      length: 4,
    });
    let referCode = `${constant.APP_SHORT_NAME}-${char}${coupon.toUpperCase()}`;
    const checkReferCode = await userModel.findOne({ refer_code: referCode });
    if (checkReferCode) {
      await genrateReferCode(mobile);
    }
    return referCode;
  }

  /**
   * @function findTempUser
   * @description using this function in other functions to run find query for temp user
   * @param data in form of an obj is required to search the data accordingly
   * @author 
   */
  async findTempUser(data) {
    let result = await tempuserModel.find(data);
    return result;
  }

  /**
   * @function findUser
   * @description using this function in other functions to run find query for user
   * @param data in form of an obj is required to search the data accordingly
   * @author 
   */
  async findUser(data) {
    let result = await userModel.find(data);
    return result;
  }

  /**
   * @function addTempUser
   * @description User Id storing for temproary
   * @param { email,mobile,password,refercode,fullname} req.body
   * @author 
   */
  async addTempuser(req) {
    try {
      console.log("--------req.body----------", req.body)
      let obj = {};
      if (req.body.email) {
        let whereObj = {
          email: req.body.email,
        };
        obj.email = req.body.email;
        let data = await this.findUser(whereObj);
        if (data.length > 0) {
          return {
            message: "The email address you have entered is already in use.",
            status: false,
            data: { email: data[0].email },
          };
        }
      }
      if (req.body.mobile) {
        let whereObj = {
          mobile: req.body.mobile,
        };
        obj.mobile = req.body.mobile;
        let data = await this.findUser(whereObj);
        if (data.length > 0) {
          return {
            message: "The mobile number you have entered is already in use.",
            status: false,
            data: { mobile: data[0].mobile },
          };
        }
      }
      let salt = bcrypt.genSaltSync(10);
      req.body.password = bcrypt.hashSync(req.body.password, salt);
      let referId;
      if (req.body.refercode) {
        let userREf = await userModel.findOne({ refer_code: req.body.refercode });
        console.log("------userREf._id-------", userREf?._id)
        if (!userREf) {
          return {
            message: "Invalid refer code ",
            status: false,
            data: "",
          };
        }
        referId = (userREf ? userREf._id : '')
      }
      const sms = new SMS(req.body.mobile);
      await sms.sendSMS(sms.mobile, `Dear Customer ${sms.otp} Riskle OTP.`);
      let tempuser = await this.findTempUser(obj);
      if (tempuser.length > 0) {
        let userFound = await tempuserModel.findOneAndUpdate(
          {
            $or: [
              { email: req.body.email || "" },
              { mobile: req.body.mobile || "" },
            ],
          },
          {
            email: req.body.email,
            mobile: req.body.mobile,
            password: req.body.password,
            username: req.body.fullname || "",
            refer_id: referId,
            // code: sms.otp || "1234",
            code:"1234",
          },
          {
            new: true,
            upsert: true,
          }
        );
        if (userFound) {
          return {
            message: "OTP is Sent to youe mobile number",
            status: true,
            data: { tempUser: userFound._id },
          };
        }
      } else {
        let addTempuserData = new tempuserModel({
          email: req.body.email,
          mobile: req.body.mobile,
          password: req.body.password,
          username: req.body.fullname || "",
          refer_id: referId,
          // code: sms.otp,
          code:"1234",
        });
        const insertTempuser = await addTempuserData.save();
        if (insertTempuser) {
          return {
            message: "OTP is Sent to your mobile number",
            status: true,
            data: { tempUser: insertTempuser._id },
          };
        }
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * @function registerUser
   * @description Save User to registeruser and remove from temporry database
   * @param { tempuser,mobile,email} req.body
   * @author 
   */
  async registerUser(req) {
    try {
      console.log("-----registerUser---", req.body);
      let TempUserWhereObj = {
        _id: req.body.tempuser,
        code: req.body.otp,
      };
      const findTempUser = await this.findTempUser(TempUserWhereObj);
      console.log("findTempUser", findTempUser)
      if (findTempUser.length == 0)
        return { message: "Invalid OTP", status: false, data: {} };
      // console.log(`findTempUser[0]`, findTempUser[0]);
      let mobileBonus = await new GetBouns().getBonus(
        constant.BONUS_TYPES.MOBILE_BONUS,
        constant.PROFILE_VERIFY_BONUS_TYPES_VALUES.FALSE
      );
      console.log("---------registerUser-->>----mobileBonus-----------", mobileBonus);
      const getReferCode = await this.genrateReferCode(findTempUser[0].mobile);
      console.log(`mobileBonus`, {
        ...findTempUser[0]._doc,
        refer_code: getReferCode,
        user_verify: { mobile_verify: 1, mobilebonus: 1 },
        userbalance: { bonus: Number(mobileBonus) },
      });
      let adduserData = new userModel({
        ...findTempUser[0]._doc,
        refer_code: getReferCode,
        user_verify: { mobile_verify: 1, mobilebonus: 1 },
        userbalance: { bonus: Number(mobileBonus) },
        app_key: req.body.appid || "",
      });
      let user = await adduserData.save();
      if (findTempUser[0].refer_id != null && findTempUser[0].refer_id && findTempUser[0].refer_id != "") {
        await userModel.updateOne(
          { _id: findTempUser[0].refer_id },
          { $inc: { totalrefercount: 1 } }
        );
      }
      const token = jwt.sign(
        { _id: user._id.toString() },
        constant.SECRET_TOKEN
      );
      await Promise.all([
        tempuserModel.deleteOne({ _id: req.body.tempuser }),
        TransactionModel.create({
          userid: user._id,
          type: constant.BONUS.MOBILE_BONUS,
          transaction_id: `${constant.APP_SHORT_NAME}-EBONUS-${Date.now()}`,
          amount: mobileBonus,
          bonus_amt: mobileBonus,
          bal_bonus_amt: mobileBonus,
          total_available_amt: mobileBonus,
        }),
        NotificationModel.create({
          title: NOTIFICATION_TEXT.BONUS.BODY(
            mobileBonus,
            constant.BONUS_NAME.mobilebonus
          ),
          userid: user._id,
        }),
        userModel.updateOne(
          {
            _id: mongoose.Types.ObjectId(user._id),
          },
          { auth_key: token }
        ),
      ]);
      console.log("------------findTempUser[0]?.refer_id----------------", findTempUser[0]?.refer_id)
      if (findTempUser[0].refer_id != null && findTempUser[0].refer_id && findTempUser[0].refer_id != "") {
        let userData = await userModel.findOne({ _id: findTempUser[0].refer_id }, { userbalance: 1 });
        if (userData) {
          let bal_bonus = (!userData.userbalance.bonus ? userData.userbalance?.bonus : 0) + constant.REFER_BONUS_TO_REFER.REFER_AMOUNT;
          console.log("--------bal_bonus------", bal_bonus)
          await TransactionModel.create({
            userid: findTempUser[0].refer_id,
            type: constant.BONUS.REFER_BONUS,
            transaction_id: `${constant.APP_SHORT_NAME}-EBONUS-${Date.now()}`,
            amount: constant.REFER_BONUS_TO_REFER.REFER_AMOUNT,
            bonus_amt: constant.REFER_BONUS_TO_REFER.REFER_AMOUNT,
            bal_bonus_amt: bal_bonus,
            total_available_amt: bal_bonus,
          })
          await userModel.updateOne(
            {
              _id: findTempUser[0]?.refer_id,
            },
            { $inc: { "userbalance.bonus": bal_bonus, "totalreferAmount": constant.REFER_BONUS_TO_REFER.REFER_AMOUNT } }
          )
        }

      }


      return {
        message: "Registration Done....",
        status: true,
        data: { auth_key: "", userid: "", token },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * @function updateUserBalanceAndUserVerify
   * @description Update balance and user_verify details
   * @param { bonusamount,userId,type,verifyType,username} payload
   * @author 
   */
  async updateUserBalanceAndUserVerify(data) {
    // console.log(`data----------------------------------`, data);
    const update = {};
    update["$inc"] = { "userbalance.bonus": data.bonusamount };
    update["code"] = "";
    if (data.verifyType != "") update[`user_verify.${data.verifyType}`] = 1;
    if (data.type != constant.PROFILE_VERIFY_BONUS_TYPES.REFER_BONUS)
      update[`user_verify.${data.type}`] = 1;
    return await userModel.findOneAndUpdate({ _id: data.userId }, update, {
      new: true,
    });
  }

  /**
   * @function givebonusToUser
   * @description Give bonus to user verification and refering
   * @param { bonusamount,userId,type,verifyType}
   * @author 
   */
  async givebonusToUser(
    bonusamount = 0,
    userId,
    type,
    verifyType = "",
    referUser
  ) {
    if (!referUser) {
      referUser = null;
    }
    // console.log(bonusamount, '------------', userId, '-----------------', type, '----------', verifyType);
    const transaction_id = `${constant.APP_SHORT_NAME}-EBONUS-${Date.now()}`;
    const balanceUpdate = await this.updateUserBalanceAndUserVerify({
      bonusamount,
      type,
      verifyType,
      userId,
    });
    if (Number(bonusamount) > 0) {
      await TransactionModel.create({
        userid: userId,
        type: constant.BONUS_NAME[type],
        transaction_id,
        transaction_by: constant.TRANSACTION_BY.APP_NAME,
        amount: bonusamount,
        paymentstatus: constant.PAYMENT_STATUS_TYPES.CONFIRMED,
        challengeid: null,
        seriesid: null,
        joinid: null,
        bonus_amt: bonusamount,
        win_amt: 0,
        addfund_amt: 0,
        bal_bonus_amt: balanceUpdate.userbalance.bonus || 0,
        bal_win_amt: balanceUpdate.userbalance.balance || 0,
        bal_fund_amt: balanceUpdate.userbalance.winning || 0,
        total_available_amt:
          balanceUpdate.userbalance.balance ||
          0 + balanceUpdate.userbalance.winning ||
          0 + balanceUpdate.userbalance.bonus ||
          0,
        withdraw_amt: 0,
        challenge_join_amt: 0,
        cons_bonus: 0,
        cons_win: 0,
        cons_amount: 0,
      });
      let bonus_refered = {}
      bonus_refered['userid'] = referUser;
      bonus_refered['fromid'] = userId;
      bonus_refered['amount'] = 51;
      bonus_refered['type'] = 'signup bonus';
      bonus_refered['txnid'] = transaction_id;

      let bonusRefModel = await bonusReferedModel.create(bonus_refered);
      console.log("---bonusRefModel--->--", bonusRefModel);

      if (type == constant.PROFILE_VERIFY_BONUS_TYPES.REFER_BONUS) {
        const dataToSave = {
          $push: {
            bonusRefered: {
              userid: mongoose.Types.ObjectId(referUser),
              amount: bonusamount,
              txnid: transaction_id,
            },
          },
        };
        await userModel.findOneAndUpdate({ _id: userId }, dataToSave, {
          new: true,
        });
      }

      const notificationObject = {
        receiverId: userId,
        deviceTokens: balanceUpdate.app_key,
        type: NOTIFICATION_TEXT.BONUS,
        title: NOTIFICATION_TEXT.BONUS.TITLE(constant.BONUS_NAME[type]),
        message: NOTIFICATION_TEXT.BONUS.BODY(
          bonusamount,
          constant.BONUS_NAME[type]
        ),
        entityId: userId,
      };
      await NotificationModel.create({
        title: notificationObject.message,
        userid: userId,
      });

      if (!balanceUpdate.app_key) {
        return true;
      }
      await notification.PushNotifications(notificationObject);
    }

    return true;
  }

  /**
   * @function loginuser
   * @description Login User By email and password And when mobile send OTP to login
   * @param { mobile,email,appid } req.body
   * @author 
   */
  async loginuser(req) {
    console.log("---req.body---", req.body)
    if (req.body.mobile) {
      let obj = {
        mobile: req.body.mobile,
      };
      const user = await this.findUser(obj);
      if (user.length == 0) {
        return {
          message: "This mobile number is not registered.",
          status: false,
          data: { auth_key: 0, userid: 0 },
        };
      }
      if (user[0].status.toLowerCase() == "blocked") {
        return {
          message:
            "You cannot login now in this account. Please contact to administartor.",
          status: false,
          data: { auth_key: 0, userid: 0 },
        };
      }
      const sms = new SMS(req.body.mobile);
      console.log("----sms.otp---", sms.otp, "--constant.APP_NAME---", constant.APP_NAME, "--")
      const otpsent = await sms.sendSMS(
        sms.mobile,
        `Dear Customer ${sms.otp} Riskle OTP.`
      );
      console.log("--otpsent---", otpsent);
      // await userModel.updateOne({ mobile: req.body.mobile }, { code: sms.otp });
      await userModel.updateOne({ mobile: req.body.mobile }, { code:"1234" });

      return {
        message: "OTP sent on your mobile number",
        status: true,
        data: {},
      };
    }
    if (req.body.email && req.body.password) {
      let obj = {
        email: req.body.email,
      };
      const user = await this.findUser(obj);
      if (user.length == 0) {
        return {
          message: "Invalid username or Password.",
          status: false,
          data: { auth_key: 0, userid: 0 },
        };
      }
      if (user[0].status.toLowerCase() == "blocked") {
        return {
          message:
            "You cannot login now in this account. Please contact to administartor.",
          status: false,
          data: { auth_key: 0, userid: 0 },
        };
      }
      if (!(await bcrypt.compare(req.body.password, user[0].password))) {
        return {
          message: "Invalid username or Password.",
          status: false,
          data: { auth_key: 0, userid: 0 },
        };
      }
      const token = jwt.sign(
        { _id: user[0]._id.toString(), refer_code: user[0].refer_code },
        constant.SECRET_TOKEN
      );
      console.log('app_key email login -->', req.body.appid)
      await userModel.updateOne(
        { _id: user[0]._id },
        { auth_key: token, app_key: req.body.appid || "" },
        { new: true }
      );
      return {
        message: "Login Successfully.",
        status: true,
        data: {
          token,
          auth_key: token,
          userid: user[0]._id,
          type: user[0].type
            ? `${user[0].type} ${constant.USER_TYPE.USER}`
            : constant.USER_TYPE.NORMAL_USER,
        },
      };
    }
    return {
      message: "Invalid username.",
      status: false,
      data: { auth_key: 0, userid: 0 },
    };
  }

  /**
   * @function logoutUser
   * @description User Logout
   * @param {  } req.body only take auth key from header
   * @author 
   */
  async logoutUser(req) {
    const user = await userModel.findOne({ _id: req.user._id });
    console.log("----------------user-----------", user)
    if (!user) {
      return {
        message: "user not found ...!",
        status: false,
        data: {},
      };
    }
    let updfatuser = await userModel.updateOne(
      { _id: user._id },
      { app_key: "" },
      { new: true }
    );
    console.log("----------------------------------updfatuser----------", updfatuser)
    return {
      message: "Logout successfully..",
      status: true,
      data: {},
    };
  }
  /**
   * @function loginuserOTP
   * @description Login User By mobile and otp
   * @param { mobile,otp,appid } req.body
   * @author 
   */
  async loginuserOTP(req) {
    console.log("-----req.body----", req.body)
    const user = await userModel.find({
      mobile: req.body.mobile,
      code: req.body.otp,
    });
    console.log("---user---", user)
    if (user.length == 0) {
      return {
        message: "Invalid OTP.",
        status: false,
        data: { auth_key: 0, userid: 0 },
      };
    }
    if (user[0].status.toLowerCase() == "blocked") {
      return {
        message:
          "You cannot login now in this account. Please contact to administartor.",
        status: false,
        data: { auth_key: 0, userid: 0 },
      };
    }
    const token = jwt.sign(
      { _id: user[0]._id.toString(), refer_code: user[0].refer_code },
      constant.SECRET_TOKEN
    );
    console.log('app_key mobile login -->', req.body.appid)
    await userModel.updateOne(
      { _id: user[0]._id },
      { auth_key: token, app_key: req.body.appid || "" },
      { new: true }
    );
    return {
      message: "Login Successfully.",
      status: true,
      data: {
        token,
        auth_key: token,
        userid: user[0]._id,
        type: user[0].type
          ? `${user[0].type} ${constant.USER_TYPE.USER}`
          : constant.USER_TYPE.NORMAL_USER,
      },
    };
  }

  async viewtransactions(req) {
    try {
      const findTransactions = await transactionModel.findOne({ userid: req.params.id });
      if (findTransactions) {
        return {
          status: true,
          data: findTransactions,
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async editUserDetails_page(req) {
    try {
      const findData = await userModel.findOne({ _id: req.params.id });
      if (!findData) {
        return {
          status: false,
        }
      } else {
        return {
          status: true,
          data: findData,
        }
      }
    } catch (error) {
      throw error;
    }

  }

  async edituserdetails(req) {
    try {
      if (req.fileValidationError) {
        return {
          status: false,
          message: req.fileValidationError
        }

      } else {
        let dataObj = req.body;
        const data = await userModel.find({ _id: dataObj.Uid });
        const checkTeam = await userModel.find({ _id: { $ne: dataObj.Uid }, team: req.body.team });
        if (checkTeam.length > 0) {
          let filePath = `public/${req.body?.typename}/${req.file?.filename}`;
          if (fs.existsSync(filePath) == true) {
            fs.unlinkSync(filePath);
          }
          return {
            status: false,
            message: `team name already exists..`
          }
        } else {

          const checkEmail = await userModel.find({ _id: { $ne: dataObj.Uid }, email: req.body.email });
          if (checkEmail.length > 0) {
            let filePath = `public/${req.body?.typename}/${req.file?.filename}`;
            if (fs.existsSync(filePath) == true) {
              fs.unlinkSync(filePath);
            }
            return {
              status: false,
              message: 'Email id already register..'
            }
          } else {
            const checkMobile = await userModel.find({ _id: { $ne: dataObj.Uid }, mobile: req.body.mobile });
            if (checkMobile.length > 0) {
              let filePath = `public/${req.body?.typename}/${req.file?.filename}`;
              if (fs.existsSync(filePath) == true) {
                fs.unlinkSync(filePath);
              }
              return {
                status: false,
                message: 'mobile number already register..'
              }
            } else {

              if (req.file) {
                if (data[0].image) {
                  let filePath = `public${data[0].image}`;
                  if (fs.existsSync(filePath) == true) {
                    fs.unlinkSync(filePath);
                  }
                }
                dataObj.image = `/${req.body?.typename}/${req.file?.filename}`;

              }
              let updatedUser = await userModel.updateOne({ _id: dataObj.Uid }, { $set: dataObj });
              if (updatedUser.modifiedCount > 0) {
                return {
                  status: true,
                  message: 'successfully update details'
                }
              } else {
                let filePath = `public/${req.body?.typename}/${req.file?.filename}`;
                if (fs.existsSync(filePath) == true) {
                  fs.unlinkSync(filePath);
                }
                return {
                  status: false,
                  message: 'something went wrong !!!'
                }
              }

            }

          }

        }
      }
    } catch (error) {
      throw error;
    }
  }




  async blockUser(req) {
    try {
      const blockUserStatus = await userModel.findOneAndUpdate({ _id: req.params.id }, { $set: { status: 'blocked' } }, { new: true });
      if (blockUserStatus.status == 'blocked') {
        return {
          status: true,
          data: blockUserStatus,
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async unBlockUser(req) {
    try {
      const unBlockUserStatus = await userModel.findOneAndUpdate({ _id: req.params.id }, { $set: { status: 'activated' } }, { new: true });
      if (unBlockUserStatus.status == 'activated') {
        return {
          status: true,
          data: unBlockUserStatus,
        }
      }
    } catch (error) {
      throw error;
    }
  }



  async getUserDetails(req) {
    try {
      const findData = await userModel.findOne({ _id: req.params.id });

      if (findData) {
        return {
          status: true,
          data: findData,
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async adminwallet(req) {
    try {
      let conditions = {};
      const { name, mobile, email } = req.query;
      if (name) {
        conditions.username = { $regex: name };
      }

      if (mobile) {
        conditions.mobile = Number(mobile);
      }


      if (email) {
        conditions.email = { $regex: email };
      }

      let userFind = await userModel.findOne(conditions);
      if (userFind) {
        return {
          status: true,
          data: userFind,
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async addmoneyinwallet(req) {
    try {
      const formData = req.body;
      let getAmount = Number(formData.amount);
      const mPassword = formData.master;
      const uID = formData.userid;
      let customMessage;
      const comparePassword = await adminModel.findOne({ masterpassword: mPassword });
      if (comparePassword) {

        let transactionsObj = {};
        let adminObject = {};
        const transactionOfUser = await userModel.findOne({ _id: uID });
        let creditOfUser = transactionOfUser.userbalance.balance;
        let winningOfUser = transactionOfUser.userbalance.winning;
        let bonusOfUser = transactionOfUser.userbalance.bonus;
        if (formData.bonustype == constant.ADMIN_WALLET_TYPE['ADD_FUND']) {
          creditOfUser += getAmount;
          transactionsObj.addfund_amt = getAmount;
          transactionsObj.type = 'Add Fund Adjustments';
          adminObject.bonustype = 'add_fund';
          customMessage = `fund amount added successfully to ${transactionOfUser.username}`;
        }
        if (formData.bonustype == constant.ADMIN_WALLET_TYPE['WINNING']) {
          winningOfUser += getAmount;
          transactionsObj.win_amt = getAmount;
          transactionsObj.type = 'Winning Adjustment';
          adminObject.bonustype = 'winning';
          customMessage = `winning amount added successfully to ${transactionOfUser.username}`;

        }
        if (formData.bonustype == constant.ADMIN_WALLET_TYPE['BONUS']) {
          bonusOfUser += getAmount;
          transactionsObj.bonus_amt = getAmount;
          transactionsObj.type = 'Bonus Adjustments';
          adminObject.bonustype = 'bonus';
          customMessage = `bonus amount added successfully to ${transactionOfUser.username}`;

        }
        let finalBalance = creditOfUser + winningOfUser + bonusOfUser;
        const updateUserBalance = await userModel.updateOne({ _id: uID }, { $set: { 'userbalance.balance': creditOfUser, 'userbalance.winning': winningOfUser, 'userbalance.bonus': bonusOfUser } });
        transactionsObj.userid = uID;
        transactionsObj.amount = formData.amount;
        transactionsObj.total_available_amt = finalBalance;
        transactionsObj.transaction_by = `${constant.APP_SHORT_NAME}`;
        transactionsObj.transaction_id = `${constant.APP_SHORT_NAME}-EBONUS-${Date.now()}`;
        transactionsObj.bal_bonus_amt = bonusOfUser;
        transactionsObj.bal_win_amt = winningOfUser;
        transactionsObj.bal_fund_amt = creditOfUser;
        transactionsObj.paymentstatus = 'confirmed';
        adminObject.moneytype = 'add_money';
        adminObject.amount = formData.amount;
        adminObject.userid = formData.userid;
        adminObject.description = formData.description;
        const adminData = new adminWalletModel(adminObject);
        const adminDataInsert = await adminData.save();
        const data = new transactionModel(transactionsObj);
        const transitionDataInsert = await data.save();
        return {
          status: true,
          data: 'successfully update'
        }
      }
      else {
        return {
          status: false,
          data: 'Please insert correct password ⚠️',
        }
      }
    } catch (error) {
      throw error;
    }
  }
  async downloadalluserdetails(req) {
    try {
      let conditions = { userid: req.params.id }
      if (req.query.start_date) {
        conditions.createdAt = { $gte: new Date(req.query.start_date) }
      }
      if (req.query.end_date) {
        conditions.createdAt = { $lt: new Date(req.query.end_date) }
      }
      if (req.query.start_date && req.query.end_date) {
        conditions.createdAt = { $gte: new Date(req.query.start_date), $lt: new Date(req.query.end_date) }
      }
      const data = await transactionModel.find(conditions).populate('userid');
      return data;

    } catch (error) {
      throw error;
    }
  }
  async changeYotuberStatus(req) {
    try {
      const data = await userModel.findOne({ _id: mongoose.Types.ObjectId(req.params.userId) }, { type: 1, username: 1 });

      if (data.type != constant.USER_TYPE.YOUTUBER && !data.type) {
        const updateStatus = await userModel.updateOne({ _id: mongoose.Types.ObjectId(req.params.userId) }, {
          $set: {
            type: constant.USER_TYPE.YOUTUBER
          }
        });
        if (updateStatus.modifiedCount > 0) {
          return {
            status: true,
            message: `${data.username} youtuber type update successfully..active`
          }
        } else {
          return {
            status: false,
            message: `${data.username} youtuber type can not update ..error`
          }
        }
      } else {
        const updateStatus = await userModel.updateOne({ _id: mongoose.Types.ObjectId(req.params.userId) }, {
          $set: {
            type: null
          }
        });
        if (updateStatus.modifiedCount > 0) {
          return {
            status: true,
            message: `${data.username} youtuber type update successfully..deactive`
          }
        } else {
          return {
            status: false,
            message: `${data.username} youtuber type can not update ..error`
          }
        }
      }
    } catch (error) {
      throw error;
    }
  }
  async userFullDetails(req) {
    const userData = await this.findUser({ _id: mongoose.Types.ObjectId(req.user._id) });
    let winPip = [];
    winPip.push({
      $match: {
        userid: mongoose.Types.ObjectId(req.user._id)
      },
    })
    winPip.push({
      $group: {
        _id: "$challengeid",
        count: {
          $sum: 1
        }
      },
    })
    winPip.push({
      $count: 'total'
    })
    const winContestData = await finalResultModel.aggregate(winPip);

    if (winContestData.length > 0) {
      const updateWonContest = await userModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(req.user._id) }, {
        totalwoncontest: winContestData[0].total
      })
    }
    // ------------------------------------
    if (userData.length == 0) {
      return {
        message: "User Not Found.",
        status: false,
        data: {},
      };
    }
    let verified = constant.PROFILE_VERIFY.FALSE;
    if (
      userData[0].user_verify.mobile_verify ==
      constant.PROFILE_VERIFY_EMAIL_MOBILE.VERIFY &&
      userData[0].user_verify.email_verify ==
      constant.PROFILE_VERIFY_EMAIL_MOBILE.VERIFY &&
      userData[0].user_verify.pan_verify ==
      constant.PROFILE_VERIFY_PAN_BANK.APPROVE &&
      userData[0].user_verify.bank_verify ==
      constant.PROFILE_VERIFY_PAN_BANK.APPROVE
    ) {
      verified = 1;
    } else {
      verified = 0;
    }
    console.log("---userData[0].dob---", userData[0].dob);
    console.log("--moment(userData[0].dob,'dd-mm-yyyy')--", moment(userData[0].dob, 'dd-mm-yyyy'));
    let DofB = " ";
    if (userData[0].dob) {
      DofB = userData[0].dob
    }
    if (moment(userData[0].dob, 'dd-mm-yyyy')) {

    }
    return {
      message: "User Full Details..!",
      status: true,
      data: {
        id: userData[0]._id,
        username: userData[0].username,
        mobile: userData[0].mobile,
        email: userData[0].email,
        pincode: userData[0].pincode || "",
        address: userData[0].address || "",
        dob: userData[0].dob,
        DayOfBirth: userData[0].dob
          ? moment(userData[0].dob, 'dd-mm-yyyy').format("DD")
          : "12",
        MonthOfBirth: userData[0].dob
          ? moment(userData[0].dob, 'dd-mm-yyyy').format("MM")
          : "10",
        YearOfBirth: userData[0].dob
          ? moment(userData[0].dob, 'dd-mm-yyyy').format("YYYY")
          : "1970",
        gender: userData[0].gender || "",
        image:
          userData[0].image && userData[0].image != ""
            ? userData[0].image
            : `${constant.BASE_URL}avtar1.png`,
        activation_status: userData[0].status || "",
        state: userData[0].state || "",
        city: userData[0].city || "",
        team: userData[0].team || "",
        teamfreeze:
          userData[0].team != "" ? constant.FREEZE.TRUE : constant.FREEZE.FALSE,
        refer_code: userData[0].refer_code || "",
        totalbalance: Number(userData[0].userbalance.balance).toFixed(2),
        totalwon: Number(userData[0].userbalance.winning).toFixed(2),
        totalbonus: Number(userData[0].userbalance.bonus).toFixed(2),
        totalticket: Number(userData[0].userbalance.ticket).toFixed(2),
        // totalcrown: Number(userData[0].userbalance.crown),
        totalpasses: Number(userData[0].userbalance.passes).toFixed(2),
        // addcashamount: Number(userData[0].userbalance.balance).toFixed(2),
        // winningamount: Number(userData[0].userbalance.winning).toFixed(2),
        // bonusamount: Number(userData[0].userbalance.bonus).toFixed(2),
        walletamaount:
          parseFloat(userData[0].userbalance.balance.toFixed(2)) +
          parseFloat(userData[0].userbalance.winning.toFixed(2)) +
          parseFloat(userData[0].userbalance.bonus.toFixed(2)),
        verified: verified,
        downloadapk: userData[0].download_apk || constant.DOWNLOAD_APK.FALSE,
        emailfreeze:
          userData[0].email != "" &&
            userData[0].user_verify.email_verify ==
            constant.PROFILE_VERIFY_EMAIL_MOBILE.VERIFY
            ? constant.FREEZE.TRUE
            : constant.FREEZE.FALSE,
        mobilefreeze:
          userData[0].mobile != "" &&
            userData[0].user_verify.mobile_verify ==
            constant.PROFILE_VERIFY_EMAIL_MOBILE.VERIFY
            ? constant.FREEZE.TRUE
            : constant.FREEZE.FALSE,
        mobileVerified: userData[0].user_verify.mobile_verify,
        emailVerified: userData[0].user_verify.email_verify,
        PanVerified: userData[0].user_verify.pan_verify,
        BankVerified: userData[0].user_verify.bank_verify,
        statefreeze:
          userData[0].user_verify.bank_verify ==
            constant.PROFILE_VERIFY_PAN_BANK.APPROVE
            ? constant.FREEZE.TRUE
            : constant.FREEZE.FALSE,
        dobfreeze:
          userData[0].user_verify.pan_verify ==
            constant.PROFILE_VERIFY_PAN_BANK.APPROVE
            ? constant.FREEZE.TRUE
            : constant.FREEZE.FALSE,
        totalrefers: userData[0].totalrefercount, //#ReferUserCount of the join application throw referId
        totalwinning: userData[0].totalwoncontest, //# FinalResult Table user Total Amount
        totalchallenges: userData[0].totalchallenges, //# All over how many contest it was palyed not was total joining
        totalmatches: userData[0].totalmatches, // # Total Matches it's played(match.matchchallenges.joinleauge or user.totalChallengs)
        totalseries: userData[0].totalseries, //# Total Series it was played(match.matchchallenges.joinleauge in distinct or user.totalChallengs)
      },
    };
  }
  async userReferList(req) {
    try {
      let pip = [];
      pip.push({
        $match: {
          refer_id: mongoose.Types.ObjectId(req.user._id)
        }
      })
      pip.push({
        $project: {
          fullname: 1,
          username: 1,
          image: {
            $cond: {
              if: { $and: [{ $ne: ['$image', ''] }, { $ne: ['$image', 'null'] }] },
              then: '$image',
              else: '/avtar1.png',
            },
          },
          referCount: { $sum: 1 }
        }
      })
      const data = await userModel.aggregate(pip);
      return {
        status: true,
        message: "refer User",
        data
      }

    } catch (error) {

    }
  }

  async forgotPassword(req) {
    let query = {};
    if (req.body.mobile) {
      query.mobile = req.body.mobile;
    }
    if (req.body.email) {
      query.email = req.body.email;
    }
    const hasuser = await userModel.findOne(query);
    if (!hasuser) {
      return {
        message: "You have entered invalid details to reset your password.",
        status: false,
        data: {},
      };
    }
    if (hasuser.status === constant.USER_STATUS.BLOCKED) {
      return {
        message:
          "Sorry you cannot reset your password now. Please contact to administrator.",
        status: false,
        data: {},
      };
    }
    if (query.mobile) {
      const sms = new SMS(req.body.mobile);
      // await userModel.updateOne({ _id: hasuser._id }, { code: sms.otp });
      await userModel.updateOne({ _id: hasuser._id }, { code:"1234" });
      await sms.sendSMS(
        sms.mobile,
        `Dear Customer ${sms.otp} Riskle OTP.`
        // `${sms.otp} is the OTP for your ${constant.APP_NAME} account. NEVER SHARE YOUR OTP WITH ANYONE. ${constant.APP_NAME} will never call or message to ask for the OTP.`
      );
      return {
        message: "OTP sent on your mobile number.",
        status: true,
        data: {},
      };
    }
    if (query.email) {
      const mail = new Mail(req.body.email);
      // console.log(`mail.otp`, mail.otp);
      // await userModel.updateOne({ _id: hasuser._id }, { code: mail.otp });
      await userModel.updateOne({ _id: hasuser._id }, { code:"1234" });
      await mail.sendMail(
        mail.email,
        `Dear Customer ${mail.otp} Riskle OTP.`,
        `Reset Password Otp`
      );
      return {
        message:
          "We have sent you an OTP on your registered email address. Please check your email and reset your password.",
        status: true,
        data: {},
      };
    }
  }
  async socialAuthentication(req) {
    try {
      const userData = await this.findUser({ email: req.body.email });
      if (userData.length != 0) {
        if (userData[0].status != constant.USER_STATUS.ACTIVATED) {
          return {
            message:
              "You cannot login now in this account. Please contact to administartor.",
            status: false,
            data: { userid: "" },
          };
        }
        const token = jwt.sign(
          {
            _id: userData[0]._id.toString(),
            refer_code: userData[0].refer_code,
          },
          constant.SECRET_TOKEN
        );
        await userModel.updateOne(
          { _id: userData[0]._id },
          { app_key: req.body.appid || "", auth_key: token }
        );
        return {
          message: "Login Successfully.",
          status: true,
          data: {
            token,
            mobile_status:
              userData[0].user_verify.mobile_verify == 1
                ? constant.PROFILE_VERIFY_EMAIL_MOBILE.VERIFY
                : constant.PROFILE_VERIFY_EMAIL_MOBILE.PENDING,
            type: userData[0].type ? `${userData[0].type} user` : "normal user",
            userid: userData[0]._id,
          },
        };
      } else {
        const refer_code = await this.genrateReferCode(req.body.email);
        const save = {};
        save["email"] = req.body.email;
        save["refer_code"] = refer_code;
        save["username"] = req.body.name;
        save["status"] = "activated";
        save["image"] = req.body.image;
        save["user_verify"] = { email_verify: 0, emailbonus: 0 };
        save["userbalance"] = { bonus: 0 };

        const user = await userModel.create(save);
        const token = jwt.sign(
          { _id: user._id.toString(), refer_code: user.refer_code },
          constant.SECRET_TOKEN
        );
        const hasUser = await userModel.findOneAndUpdate(
          { _id: user._id },
          { app_key: req.body.appid },
          { new: true }
        );
        const emailBonus = await new GetBouns().getBonus(
          constant.BONUS_TYPES.EMAIL_BONUS,
          constant.PROFILE_VERIFY_BONUS_TYPES_VALUES.FALSE
          // hasUser.user_verify.emailbonus
        );
        await this.givebonusToUser(
          emailBonus,
          user._id,
          constant.PROFILE_VERIFY_BONUS_TYPES.EMAIL_BONUS,
          constant.USER_VERIFY_TYPES.EMAIL_VERIFY
        );
        return {
          message: "Login Successfully.",
          status: true,
          data: {
            token,
            mobile_status:
              hasUser.user_verify.mobile_verify == 1
                ? constant.PROFILE_VERIFY_EMAIL_MOBILE.VERIFY
                : constant.PROFILE_VERIFY_EMAIL_MOBILE.PENDING,
            type: user.type ? `${hasUser.type} user` : "normal user",
            userid: user._id,
          },
        };
      }
    } catch (error) {
      throw error;
    }
  }
  async getVersion(req) {
    const superAdmin = await AdminModel.findOne({
      role: constant.ADMIN.SUPER_ADMIN,
    });
    if (!superAdmin.androidversion)
      return {
        status: false,
        message: "Something went wrong",
        data: { status: "", point: "" },
      };
    return {
      message: "Android Version Details...!",
      status: true,
      data: {
        version: superAdmin.androidversion.version,
        point: superAdmin.androidversion.updation_points,
      },
    };
  }
  async matchCodeForReset(req) {
    let query = {};
    query.code = req.body.code;
    if (req.body.mobile) {
      query.mobile = req.body.mobile;
    }
    if (req.body.email) {
      query.email = req.body.email;
    }
    const hasuser = await userModel.findOne(query);
    if (!hasuser) {
      return {
        message: "Invalid Otp.",
        status: false,
        data: {},
      };
    }
    return {
      message: "OTP Matched",
      status: true,
      data: { suerid: hasuser._id },
    };
  }
  async editProfile(req) {
    const restrictarray = [
      "madar",
      "bhosadi",
      "bhosd",
      "aand",
      "jhaant",
      "jhant",
      "fuck",
      "chut",
      "chod",
      "gand",
      "gaand",
      "choot",
      "faad",
      "loda",
      "Lauda",
      "maar",
      "sex",
      "porn",
      "xxx",
    ];
    if (restrictarray.includes(req.body.team)) {
      return {
        message: "You cannot use abusive words in your team name..!",
        status: false,
        data: {},
      };
    }
    const user = await userModel.findOne({
      team: req.body.team,
      _id: { $ne: req.user._id },
    });
    // console.log(`user`, user);
    if (user) {
      return {
        message:
          "This Team Name Is Already Exist. Please Use some Different Name For Your Team",
        status: false,
        data: {},
      };
    }
    await userModel.findOneAndUpdate({ _id: req.user._id }, req.body);
    return {
      message: "Profile updated successfully",
      status: true,
      data: { userid: req.user._id },
    };
  }
  async getmainbanner(req) {
    let {fantasy_type} = req.query
    const superAdmin = await AdminModel.findOne({
      role: constant.ADMIN.SUPER_ADMIN,
    });
    let images;
    if (superAdmin) {
      images = superAdmin.sidebanner
        ? superAdmin.sidebanner.filter(
          (item) => item.type == constant.SIDE_BANNER_TYPES.APP_TYPE && item.fantasy_type === fantasy_type
        )
        : [];
    } else {
      image = [];
    }
    console.log(images)
    const image = await images.map((item) => {
      let url = "";
      let image = "";
      let fantasy_type = ""
      if (item.url) {
        url = item.url
      }
      if (item.fantasy_type) {
        fantasy_type = item.fantasy_type
      }
      if (item.image) {
        //const BASE_URL = "https://admin.Riskle.com"
        image = `${process.env.BASE_URL}${item.image}`
      }
      return {
        // image_local: `${constant.BASE_URL_LOCAL}${item.image}`,
        url: url,
        image: image,
        fantasy_type:fantasy_type,
        bannerType: item.bannerType
      };
    });
    return {
      message: "Main Banner...!",
      status: true,
      data: image,
    };
  }
  async getwebslider(req) {
    const superAdmin = await AdminModel.findOne({
      role: constant.ADMIN.SUPER_ADMIN,
    });
    console.log(`superAdmin`, superAdmin);
    if (superAdmin) {
      if (
        superAdmin.popup_notify_image !== "" ||
        superAdmin.popup_notify_image
      ) {
        return {
          message: "Main Banner...!",
          status: true,
          data: {
            image: `${constant.BASE_URL}${superAdmin.popup_notify_image}`,
          },
        };
      } else {
        return {
          message: "Main Banner Not Found...!",
          status: false,
          data: { image: `` },
        };
      }
    }
  }
  async resendOTP(req) {
    // let otp = `${Math.floor(1000 + Math.random() * 9000)}`
    if (req.body.tempuser) {
      const tempUser = await this.findTempUser({ _id: req.body.tempuser });
      if (tempUser.length == 0) {
        return {
          message: "Invaild Id",
          status: false,
          data: {},
        };
      }
      const sms = new SMS(tempUser[0].mobile);
      await sms.sendSMS(sms.mobile, `Dear Customer ${sms.otp} Riskle OTP.`);
      /*await sms.sendSMS(
        sms.mobile,
        sms.otp
        // `${tempUser.code} is the OTP for your ${constant.APP_NAME} account. NEVER SHARE YOUR OTP WITH ANYONE. ${constant.APP_NAME} will never call or message to ask for the OTP.`
      );*/
      return {
        message: "OTP sent on your mobile number...!",
        status: true,
        data: {},
      };
    }
    if (req.body.mobile || Number(req.body.username)) {
      const user = await this.findUser({
        mobile: req.body.mobile || req.body.username,
      });
      if (user.length == 0) {
        return {
          message: "Invaild Id",
          status: false,
          data: {},
        };
      }
      const sms = new SMS(user[0].mobile);
      // await userModel.updateOne({ _id: user[0]._id }, { code: sms.otp });
      await userModel.updateOne({ _id: user[0]._id }, { code:"1234" });
      await sms.sendSMS(sms.mobile, `Dear Customer ${sms.otp} Riskle OTP.`);
      /*await sms.sendSMS(
        sms.mobile,
        sms.otp
        // `${sms.otp} is the OTP for your ${constant.APP_NAME} account. NEVER SHARE YOUR OTP WITH ANYONE. ${constant.APP_NAME} will never call or message to ask for the OTP.`
      );*/
      return {
        message: "OTP sent on your mobile number...!",
        status: true,
        data: {},
      };
    }
    if (req.body.email || !Number(req.body.username)) {
      const user = await this.findUser({
        email: req.body.email || req.body.username,
      });
      if (user.length == 0) {
        return {
          message: "Invaild Email Id",
          status: false,
          data: {},
        };
      }
      const mail = new Mail(user[0].email);
      console.log(`mail.otp`, mail.otp);
      // await userModel.updateOne({ _id: user[0]._id }, { code: mail.otp });
      await userModel.updateOne({ _id: user[0]._id }, { code:"1234" });
      await mail.sendMail(
        mail.email,
        `Dear Customer ${mail.otp} Riskle OTP.`,
        `Resend Otp`
      );
      return {
        message: "OTP sent on your Email...!",
        status: true,
        data: {},
      };
    }
  }

  /**
   * @function verifyMobileNumber
   * @description Verification of mobile number  send mobile otp to user
   * @param { mobile }
   * @author 
   */
  async verifyMobileNumber(req) {
    const hasuser = await this.findUser({
      mobile: Number(req.body.mobile),
      _id: { $ne: req.user._id },
    });
    if (hasuser.length > 0) {
      return {
        message: "The mobile number you have entered is already in use.",
        status: false,
        data: {},
      };
    }
    const user = await this.findUser({ _id: req.user._id });
    console.log(`user`, user[0].user_verify.mobile_verify);
    if (
      user[0].user_verify.mobile_verify ==
      constant.PROFILE_VERIFY_EMAIL_MOBILE.VERIFY
    ) {
      return {
        message:
          "You have already verified mobile number. You can't change number now.",
        status: false,
        data: {},
      };
    }
    const sms = new SMS(req.body.mobile);
    // await userModel.updateOne({ _id: req.user._id }, { code: sms.otp });
    await userModel.updateOne({ _id: req.user._id }, { code:"1234" });
    await sms.sendSMS(sms.mobile, `Dear Customer ${sms.otp} Riskle OTP.`);
    /*  await sms.sendSMS(
        sms.mobile,
        sms.otp
         //`${sms.otp} is the OTP for your ${constant.APP_NAME} account. NEVER SHARE YOUR OTP WITH ANYONE. ${constant.APP_NAME} will never call or message to ask for the OTP. `
      );*/
    return {
      message: "OTP sent on your mobile number.",
      status: true,
      data: {},
    };
  }

  /**
   * @function verifyEmail
   * @description Verification of email idsend email otp to user
   * @param { email }
   * @author 
   */
  async verifyEmail(req) {
    const hasuser = await this.findUser({
      email: req.body.email,
      _id: { $ne: req.user._id },
    });
    if (hasuser.length > 0) {
      return {
        message: "The email address you have entered is already in use.",
        status: false,
        data: {},
      };
    }
    console.log('req.user._id', req.user._id)
    const user = await this.findUser({ _id: req.user._id });
    //console.log(`user`, user[0].user_verify.mobile_verify);
    if (
      user[0].user_verify.email_verify ==
      constant.PROFILE_VERIFY_EMAIL_MOBILE.VERIFY
    ) {
      return {
        message:
          "You have already verified Email Address. You cannot change email address now.",
        status: false,
        data: {},
      };
    }
    const mail = new Mail(req.body.email);
    console.log(`mail.otp--`, mail);
    // await userModel.updateOne({ _id: req.user._id }, { code: mail.otp });
    await userModel.updateOne({ _id: req.user._id }, { code:"1234" });
    await mail.sendMail(
      mail.email,
      `Dear Customer ${mail.otp} Riskle OTP.`,
      `Email Verification Process`
    );

    return {
      message: "OTP sent on your Email.",
      status: true,
      data: {},
    };
  }

  /**
   * @function verifyCode
   * @description Verification of email and mobile otp to verification and verify the details
   * @param { email,mobile,code }
   * @author 
   */
  async verifyCode(req) {
    const user = await this.findUser({
      _id: req.user._id,
      code: req.body.code,
    });
    if (user.length == 0) {
      return {
        message: "Invalid Code",
        status: false,
        data: {},
      };
    }
    if (req.body.email) {
      if (
        user[0].user_verify.email_verify ==
        constant.PROFILE_VERIFY_EMAIL_MOBILE.VERIFY
      ) {
        return {
          message: "Your email Address is already Verified",
          status: false,
          data: {},
        };
      }
      await userModel.findOneAndUpdate(
        { _id: req.user._id },
        { email: req.body.email }
      );
      const emailBonus = await new GetBouns().getBonus(
        constant.BONUS_TYPES.EMAIL_BONUS,
        user[0].user_verify.emailbonus
      );
      await this.givebonusToUser(
        emailBonus,
        req.user._id,
        constant.PROFILE_VERIFY_BONUS_TYPES.EMAIL_BONUS,
        constant.USER_VERIFY_TYPES.EMAIL_VERIFY
      );
    }
    if (req.body.mobile) {
      if (
        user[0].user_verify.mobile_verify ==
        constant.PROFILE_VERIFY_EMAIL_MOBILE.VERIFY
      ) {
        return {
          message: "Your Mobile Number is already verified.",
          status: false,
          data: {},
        };
      }
      await userModel.findOneAndUpdate(
        { _id: req.user._id },
        { mobile: req.body.mobile },
        { new: true }
      );
      const mobileBonus = await new GetBouns().getBonus(
        constant.BONUS_TYPES.MOBILE_BONUS,
        user[0].user_verify.mobilebonus
      );
      await this.givebonusToUser(
        mobileBonus,
        req.user._id,
        constant.PROFILE_VERIFY_BONUS_TYPES.MOBILE_BONUS,
        constant.USER_VERIFY_TYPES.MOBILE_VERIFY
      );
    }
    return {
      message: "Verified succcessfully",
      status: true,
      data: {
        userid: req.user._id,
        type:
          user[0].type && user[0].type != ""
            ? `${user[0].type} user`
            : "normal user",
      },
    };
  }

  /**
   * @function allverify
   * @description Reset the password of user
   * @param { }
   * user verifyed details
   * @author 
   */
  async allverify(req) {
    const payload = await this.findUser({ _id: req.user._id });
    return {
      message: "user verify details",
      status: true,
      data: {
        mobile_verify: payload[0].user_verify.mobile_verify || 0,
        email_verify: payload[0].user_verify.email_verify || 0,
        bank_verify: payload[0].user_verify.bank_verify || 0,
        pan_verify: payload[0].user_verify.pan_verify || 0,
        profile_image_verify: payload[0].user_verify.profile_image_verify || 0,
        image:
          payload[0].image && payload[0].image != ""
            ? payload[0].image
            : `${constant.BASE_URL}avtar_1.png`,
        email:
          payload[0].user_verify.email_verify ===
            constant.PROFILE_VERIFY_EMAIL_MOBILE.VERIFY
            ? payload[0].email
            : "",
        mobile:
          payload[0].user_verify.mobile_verify ===
            constant.PROFILE_VERIFY_EMAIL_MOBILE.VERIFY
            ? payload[0].mobile
            : "",
        pan_comment:
          payload[0].user_verify.pan_verify &&
            payload[0].user_verify.pan_verify ===
            constant.PROFILE_VERIFY_PAN_BANK.REJECTED
            ? payload[0].pancard.comment
              ? payload[0].pancard.comment
              : ""
            : "",
        bank_comment:
          payload[0].user_verify.bank_verify &&
            payload[0].user_verify.bank_verify ===
            constant.PROFILE_VERIFY_PAN_BANK.REJECTED
            ? payload[0].bank.comment
              ? payload[0].bank.comment
              : ""
            : "",
      },
    };
  }
  async myTransactions(req) {
    const myTranction = await TransactionModel.find({ userid: req.user._id }).limit(50)
      .populate({ path: "userid" })
      .sort({ createdAt: -1 });
    // console.log("------myTranction------",myTranction[0])
    if (myTranction.length == 0) {
      return {
        message: "User Transaction Not Found",
        status: false,
        data: [],
      };
    }
    let arr_cr = [
      "Bank verification bank bonus",
      "Email Bonus",
      "Mobile Bonus",
      'Pan Bonus',
      "Cash added",
      "Offer bonus",
      "Bonus refer",
      "Refund amount",
      "Challenge Winning Amount",
      "Challenge Winning Gift",
      "Refund",
      "Pan verification pan bonus",
      "special  ",
      "Youtuber Bonus",
      "Referred Signup bonus",
      "Winning Adjustment",
      "Add Fund Adjustments",
      "Bonus Adjustments",
      "Refer Bonus",
      "withdraw cancel",
      "Amount Withdraw Failed",
      'Mobile Bonus',
      'Email Bonus',
      'Signup Bonus',
      'Special Bonus',
      'extra cash',
      'Cash Added',
      'Bank Bonus',
      'Pan Bonus',
      'Refer Bonus',
      'Application download bonus',
      'Affiliate Commission'
    ];
    let arr_db = ["Amount Withdraw", "Contest Joining Fee"];

    return {
      message: "User Transaction Details..",
      status: true,
      data: myTranction.map((doc) => {
        // console.log("-- doc.type--", doc.type)
        let amount;
        let amount_type;
        if (doc.prize && doc.prize != "") {
          amount_type = "gift"
          amount = doc.prize
        } else {
          amount_type = "amount"
          amount = Number(doc.amount).toFixed(2);
        }
        // console.log("-----doc.type---",doc.type)
        // console.log("---arr_cr.includes(doc.type)---",arr_cr.includes(doc.type))
        return {
          id: doc._id,
          status: 1,
          transaction_type: arr_cr.includes(doc.type) ? "Credit" : "Debit",
          type: doc.type,
          amount_type: amount_type,
          amount: amount,
          team: doc.userid ? doc.userid.team : "",
          date_time: moment(doc.createdAt).format("DD MMM YYYY HH:mm"),
          txnid: doc.transaction_id,
        };
      }),
    };
  }
  async resetPassword(req) {
    let salt = bcrypt.genSaltSync(10);
    req.body.password = bcrypt.hashSync(req.body.password, salt);
    const hasUser = await userModel.findOneAndUpdate(
      { _id: req.body.suerid },
      { password: req.body.password, code: "" },
      { new: true }
    );
    if (!hasUser) {
      return {
        message: "Invalid Details",
        status: false,
        data: {},
      };
    }
    return {
      message: "Password Reset Successfully ..!",
      status: true,
      data: { userid: hasUser._id },
    };
  }

  /**
   * @function changePassword
   * @description User Change the password
   * @param { newpassword,confirmpassword,oldpassword } req.body
   * @author 
   */
  async changePassword(req) {
    if (!req.body.newpassword && !req.body.confirmpassword && !req.body.oldpassword) {
      return {
        status: false,
        message: "Please Fill Required Credentials",
        data: {},
      }
    }
    const salt = await bcrypt.genSaltSync(10);
    if (req.body.newpassword != req.body.confirmpassword) {
      return {
        message: "Confirm password and new password are not matched.",
        status: false,
        data: {},
      };
    }
    const user = await userModel.findOne({ _id: req.user._id });
    if (!user) {
      return {
        message: "Invalid Details.",
        status: false,
        data: {},
      };
    }
    if (!(await bcrypt.compare(req.body.oldpassword, user.password))) {
      return {
        message: "Old password does not matched to previous password.",
        status: false,
        data: {},
      };
    }

    let password = bcrypt.hashSync(req.body.newpassword, salt);
    const updateUser = await userModel.findOneAndUpdate(
      { _id: req.user._id },
      { password: password },
      { new: true }
    );
    return {
      message: "Password Changed Successfully...!",
      status: true,
      data: { userid: updateUser._id },
    };
  }

  /**
   * @function panRequest
   * @description Pancard detail upload by user
   * @param { pannumber,image,dob,panname }
   * @author 
   */
  async panRequest(req) {
    try {
      // console.log("req.body.----------------",req.body,"-------file---------",req.file,"---req.user._id---",req.user._id);

      const user = await userModel.findOne({
        "pancard.pan_number": req.body.pannumber,
        _id: { $ne: req.user._id },
      });
      console.log(`user`, user);
      if (user) {
        return {
          message: "This pan card number is already exist.",
          status: false,
          data: {},
        };
      }
      console.log(`req.file`, req.file);
      let image;
      // const image = `${constant.BASE_URL_LOCAL}${req.body.typename}/${req.file.filename}`;
      if (req.body.typename)
        image = `${req.body?.typename}/${req.file?.filename}` || ''; // typename = pancard
      const update = {};
      update["$set"] = {
        "user_verify.pan_verify": constant.PROFILE_VERIFY_PAN_BANK.SUBMITED,
      };
      update["pancard"] = {
        image: image,
        pan_number: req.body.pannumber.toUpperCase(),
        pan_dob: moment(req.body.dob).format("YYYY-MM-DD"),
        pan_name: req.body.panname.toUpperCase(),
        status: constant.PANCARD.PENDING,
        comment: req.body.comment ? req.body.comment : "",
        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
      };
      await userModel.updateOne({ _id: req.user._id }, update, { new: true });
      return {
        message: "Your pan card request has been successfully submitted.",
        status: true,
        data: { userid: req.user._id },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * @function panDetails
   * @description Pancard details get
   * @param {  } Auth Key
   * @author 
   */
  async panDetails(req) {
    try {
      let user = await userModel.findOne({ _id: req.user._id }, { pancard: 1 });
      console.log(`user`, user);
      if (
        !user ||
        !user["pancard"] ||
        !user["pancard"].pan_number ||
        user["pancard"].pan_number == ""
      ) {
        return {
          message: "Pancard Informtion not submited yet",
          status: false,
          data: {},
        };
      }
      return {
        message: "",
        status: true,
        data: {
          status: true,
          panname: user["pancard"].pan_name.toUpperCase(),
          pannumber: user["pancard"].pan_number.toUpperCase(),
          pandob: moment(user["pancard"].pan_dob).format("DD MMM ,YYYY"),
          comment: user["pancard"].comment || "",
          image: user["pancard"].image
            ? `${constant.BASE_URL}${user["pancard"].image}`
            : "" || "",
          imagetype: user["pancard"].image
            ? path.extname(user["pancard"].image) == "pdf"
              ? "pdf"
              : "image"
            : "",
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * @function bankRequest
   * @description bank detail upload by user
   * @param { accountholder,image,accno,ifsc,bankname,bankbranch,state } req.body
   * @author 
   */
  async bankRequest(req) {
    try {
      if (!req.body.typename)
        return {
          message: "Please update the image properly.",
          status: false,
          data: {},
        };
      if (!req.body.accno)
        return {
          message: "Please insert your account number.",
          status: false,
          data: {},
        };
      if (!req.body.ifsc) {
        return {
          message: "Please insert your ifsc code",
          status: false,
          data: {},
        };
      }
      if (!req.body.accountholder)
        return {
          message: "Please insert account holder name",
          status: false,
          data: {},
        };
      if (!req.body.bankname)
        return {
          message: "Please insert bank name",
          status: false,
          data: {},
        };
      if (!req.body.bankbranch)
        return {
          message: "Please insert bankbranch",
          status: false,
          data: {},
        };
      if (!req.body.state)
        return {
          message: "Please insert state",
          status: false,
          data: {},
        };
      const user = await userModel.findOne({ "bank.accno": req.body.accno });
      if (user) {
        return {
          message: "accountholder already exist.",
          status: false,
          data: {},
        };
      }
      let image;
      image = `${req.body?.typename}/${req.file?.filename}`; // typename = bank
      const update = {};
      update["$set"] = {
        "user_verify.bank_verify": constant.PROFILE_VERIFY_PAN_BANK.SUBMITED,
      };
      update["bank"] = {
        accountholder: req.body.accountholder.toUpperCase(),
        accno: req.body.accno,
        ifsc: req.body.ifsc.toUpperCase(),
        bankname: req.body.bankname,
        bankbranch: req.body.bankbranch,
        state: req.body.state,
        image: image,
        comment: req.body.comment || "",
        status: constant.BANK.PENDING,
        created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
        updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
      };

      await userModel.updateOne({ _id: req.user._id }, update, { new: true });
      return {
        message: "Your bank account request has been submitted successfully.",
        status: true,
        data: { userid: req.user._id },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * @function bankDetails
   * @description bank details get
   * @param {  } Auth Key
   * @author 
   */
  async bankDetails(req) {
    try {
      let user = await userModel.findOne({ _id: req.user._id }, { bank: 1, user_verify: 1 });
      if (
        !user ||
        !user["bank"] ||
        !user["bank"].accno ||
        user["bank"].accno == ""
      ) {
        return {
          message: "Bank Informtion not submited yet",
          status: false,
          data: {},
        };
      }
      return {
        message: "Bank Details",
        status: true,
        data: {
          status: true,
          accountholdername: user["bank"].accountholder,
          accno: user["bank"].accno,
          ifsc: user["bank"].ifsc.toUpperCase(),
          bankname: user["bank"].bankname.toUpperCase(),
          bankbranch: user["bank"].bankbranch.toUpperCase(),
          state: user["bank"].state.toUpperCase(),
          comment: user["bank"].comment || "",
          image: user["bank"].image
            ? `${constant.BASE_URL}${user["bank"].image}`
            : "",
          imagetype: user["bank"].image
            ? path.extname(user["bank"].image) == "pdf"
              ? "pdf"
              : "image"
            : "",
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * @function getBalance
   * @description Balance Detail
   * @param {  } auth key
   * @author 
   */
  async getBalance(req) {
    try {
      let hasUser = await userModel.findOne(
        { _id: req.user._id },
        { userbalance: 1 }
      );
      // console.log(`user`, hasUser);
      if (!hasUser)
        return { message: "User Not Found", status: false, data: {} };
      const totalAmount =
        parseFloat(hasUser.userbalance.balance.toFixed(2)) +
        parseFloat(hasUser.userbalance.winning.toFixed(2)) +
        parseFloat(hasUser.userbalance.bonus.toFixed(2));
      const usableBalance =
        parseFloat(hasUser.userbalance.balance.toFixed(2)) +
        parseFloat(hasUser.userbalance.winning.toFixed(2));
      return {
        message: "Balance Detail",
        status: true,
        data: {
          balance: Number(hasUser.userbalance.balance).toFixed(2),
          winning: Number(hasUser.userbalance.winning).toFixed(2),
          bonus: Number(hasUser.userbalance.bonus).toFixed(2),
          totalamount: Number(totalAmount).toFixed(2),
          totalusableBalance: Number(usableBalance).toFixed(2),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * @function myWalletDetails
   * @description Wallet Deatils and verify Details
   * @param {  } auth key
   * @author 
   */
  async myWalletDetails(req) {
    try {
      let hasUser = await userModel.findOne(
        { _id: req.user._id },
        {
          userbalance: 1,
          user_verify: 1,
          totalwinning: 1,
          totalchallenges: 1,
          totalmatches: 1,
          totalseries: 1,
          totalwoncontest: 1,
        }
      );
      if (!hasUser)
        return { message: "User Not Found", status: false, data: {} };
      const totalAmount =
        parseFloat(hasUser.userbalance.balance.toFixed(2)) +
        parseFloat(hasUser.userbalance.winning.toFixed(2)) +
        parseFloat(hasUser.userbalance.bonus.toFixed(2));
      return {
        message: "User Wallet And Verify Details",
        status: true,
        data: {
          balance: Number(hasUser.userbalance.balance).toFixed(2),
          winning: Number(hasUser.userbalance.winning).toFixed(2),
          bonus: Number(hasUser.userbalance.bonus).toFixed(2),
          totalamount: Number(totalAmount).toFixed(2),
          allverify:
            hasUser.user_verify.mobile_verify == 1 &&
              hasUser.user_verify.email_verify == 1 &&
              hasUser.user_verify.pan_verify == 1 &&
              hasUser.user_verify.bank_verify == 1
              ? 1
              : 0,
          totalamountwon: hasUser.totalwinning, //# FinalResult Table user Total Amount,
          totaljoinedcontest: hasUser.totalchallenges, //# All over how many contest it was palyed not was total joining,
          totaljoinedmatches: hasUser.totalmatches, //# Total Matches it's played(match.matchchallenges.joinleauge or user.totalChallengs),
          totaljoinedseries: hasUser.totalseries, //# Total Series it was played(match.matchchallenges.joinleauge in distinct or user.totalChallengs),
          totalwoncontest: hasUser.totalwoncontest, ///# Total Contset Count it was win,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * @function requestWithdraw
   * @description Request for Withdraw
   * @param {amount} auth key
   * @author 
   */
  async requestWithdraw(req) {
    try {
      console.log("--Number(req.body.amount) < Number(constant.WITHDRAW.MINIMUM_WITHDRAW_AMOUNT)--", Number(req.body.amount) < Number(constant.WITHDRAW.MINIMUM_WITHDRAW_AMOUNT))
      if (Number(req.body.amount) < Number(constant.WITHDRAW.MINIMUM_WITHDRAW_AMOUNT)) {
        return {
          message: `Withdrawl amount should be greater than or equal to ${constant.WITHDRAW.MINIMUM_WITHDRAW_AMOUNT}`,
          status: false,
          data: {},
        };
      }
      let hasUser = await userModel.findOne(
        { _id: req.user._id },
        { withdrawamount: 1, user_verify: 1, userbalance: 1 }
      );
      if (!hasUser)
        return { message: "User Not Found", status: false, data: {} };
      if (hasUser.userbalance.winning < Number(req.body.amount)) {
        if (Number(hasUser.userbalance.winning) == 0) {
          return {
            message: `You have 0 withdraw balance rupees.`,
            status: false,
            data: {},
          };
        } else {
          return {
            message: `You can withdraw only ${Number(hasUser.userbalance.winning)} rupees.`,
            status: false,
            data: {},
          };
        }
      }
      if (
        hasUser.user_verify.pan_verify !=
        constant.PROFILE_VERIFY_PAN_BANK.APPROVE
      ) {
        return {
          message:
            "Please first complete your PAN verification process. to withdarw this amount.",
          status: false,
          data: {},
        };
      }
      if (
        hasUser.user_verify.bank_verify !=
        constant.PROFILE_VERIFY_PAN_BANK.APPROVE
      ) {
        return {
          message:
            "Please first complete your Bank verification process to withdraw this amount.",
          status: false,
          data: {},
        };
      }
      const date = new Date();
      let aggPipe = [];
      aggPipe.push({
        $match: { userid: mongoose.Types.ObjectId(req.user._id) },
      });
      aggPipe.push({
        $addFields: {
          created: { $subtract: ["$createdAt", new Date("1970-01-01")] },
        },
      });
      aggPipe.push({
        $match: { created: { $gte: Number(date.setHours(0, 0, 0, 0)) } },
      });
      aggPipe.push({
        $group: { _id: null, amount: { $sum: "$amount" } },
      });
      aggPipe.push({
        $project: { _id: 0, amount: { $ifNull: ["$amount", 0] }, created: 1 },
      });
      const todayWithdrawAmount = await WithdrawModel.aggregate(aggPipe);
      // let amount = 0;
      // if (todayWithdrawAmount.length == 0) {
      //     todayWithdrawAmount.push({ amount: 0 });
      //     amount = parseFloat(todayWithdrawAmount[0].amount) + Number(req.body.amount);
      // } else {
      let amount = Number(req.body.amount);
      // }
      if (10000 < amount) {
        return {
          message: `You can not withdraw more than ${10000} in a day.`,
          status: false,
          data: {},
        };
      }
      const update = {};
      update["$inc"] = { "userbalance.winning": -Number(req.body.amount) };
      const userData = await userModel.findOneAndUpdate(
        { _id: req.user._id },
        update,
        { new: true }
      );
      let randomStr = randomstring.generate({
        length: 4,
        charset: 'alphabetic',
        capitalization: 'uppercase'
      });
      let save = {},
        transactionSave = {};
      save["userid"] = transactionSave["userid"] = req.user._id;
      save["amount"] =
        transactionSave["amount"] =
        transactionSave["withdraw_amt"] =
        transactionSave["cons_win"] =
        req.body.amount;
      save["withdraw_req_id"] = transactionSave["transaction_id"] = `WD-${Date.now()}-${randomStr}`;
      save["withdrawfrom"] = req.body.withdrawFrom;
      transactionSave["type"] = constant.BONUS_NAME.withdraw;
      transactionSave["transaction_by"] = constant.TRANSACTION_BY.WALLET;
      transactionSave["paymentstatus"] = constant.PAYMENT_STATUS_TYPES.PENDING;
      transactionSave["bal_fund_amt"] = userData.userbalance.balance.toFixed(2);
      transactionSave["bal_win_amt"] = userData.userbalance.winning.toFixed(2);
      transactionSave["bal_bonus_amt"] = userData.userbalance.bonus.toFixed(2);
      transactionSave["total_available_amt"] = (
        userData.userbalance.balance +
        userData.userbalance.bonus +
        userData.userbalance.winning
      ).toFixed(2);
      transactionSave["challengeid"] = null;
      transactionSave["seriesid"] = null;
      transactionSave["joinid"] = null;
      transactionSave["bonus_amt"] = 0;
      transactionSave["win_amt"] = 0;
      transactionSave["addfund_amt"] = 0;
      transactionSave["cons_amount"] = 0;
      transactionSave["cons_bonus"] = 0;
      transactionSave["challenge_join_amt"] = 0;
      await Promise.all([
        await WithdrawModel.create(save),
        await TransactionModel.create(transactionSave),
      ]);
      return {
        message: `Your request for withdrawl amount of Rs ${req.body.amount} is sent successfully. You will get info about it in between 24 to 48 Hours.`,
        status: true,
        data: {},
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * @function myWithdrawList
   * @description Get User Withdraw List
   * @param { } auth key
   * @author 
   */
  async myWithdrawList(req) {
    try {
      const aggPipe = [];
      aggPipe.push({
        $match: {
          userid: { $eq: mongoose.Types.ObjectId(req.user._id) },
        },
      });
      aggPipe.push({
        $project: {
          _id: 1,
          user_id: 1,
          // amount: { $round: ['$amount', 2] },
          amount: 1,
          withdrawfrom: { $ifNull: ["$withdrawfrom", ""] },
          withdrawto: "$type",
          withdrawtxnid: "$withdraw_req_id",
          withdrawl_date: {
            $dateToString: { date: "$createdAt", format: "%d-%m-%Y %H:%M:%S" },
          },
          approved_date: {
            $cond: {
              if: {
                $eq: ["$approved_date", null],
              },
              then: "Not Available",
              else: "$approved_date",
            },
          },
          status: {
            $cond: {
              if: { $eq: ["$status", 0] },
              then: constant.WITHDRAW_STATUS.PENDING,
              else: constant.WITHDRAW_STATUS.APPROVED,
            },
          },
          comment: { $ifNull: ["$comment", "Not Available"] },
        },
      });
      const withdrawList = await WithdrawModel.aggregate(aggPipe);
      console.log(`withdrawList`, withdrawList);
      if (withdrawList.length == 0) {
        return {
          message: "User Withdraw List Is Empty",
          status: true,
          data: { withdrawList: [] },
        };
      }
      return {
        message: "User Withdraw List",
        status: true,
        data: { withdrawList },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * @function requestAddCash
   * @description Request Add cash
   * @param {amount,offerid,paymentby }
   * @author 
   */
  // async requestAddCash(req) {
  //   try {
  //     const hasUser = await userModel.findOne({ _id: req.user._id });
  //     if (!hasUser)
  //       return { message: "Failed", status: false, data: { txnid: 0 } };
  //     let offerId = "";
  //     const amount = Number(req.body.amount);
  //     if (req.body.offerid || req.body.offerid != "") {
  //       const offerData = await OfferModel.findOne({
  //         offercode: req.body.offerid,
  //       });
  //       if (
  //         offerData &&
  //         offerData.maxamount >= amount &&
  //         offerData.minamount <= amount
  //       )
  //         // if (offerData && offerData.maxamount == amount)
  //         offerId = req.body.offerid;
  //     }
  //     let randomStr=randomstring.generate({
  //       length: 4,
  //       charset: 'alphabetic',
  //       capitalization:'uppercase'
  //     });
  //     console.log("------randomStr-------",randomStr)
  //     const orderid = `${constant.APP_SHORT_NAME}-add-${Date.now()}${randomStr}`;
  //     await PaymentProcessModel.create({
  //       amount: amount,
  //       userid: hasUser._id,
  //       paymentmethod: req.body.paymentby,
  //       orderid: orderid,
  //       offerid: offerId,
  //       payment_type: constant.PAYMENT_TYPE.ADD_CASH,
  //     });
  //     return {
  //       message: "Order Id Generated",
  //       status: true,
  //       data: { txnid: orderid, amount },
  //     };
  //   } catch (error) {
  //     throw error;
  //   }
  // }
  async requestAddCash(req) {
    try {
      const hasUser = await userModel.findOne({ _id: req.user._id });
      if (!hasUser)
        return { message: "Failed", status: false, data: { txnid: 0 } };
      let offerId = "";
      const amount = Number(req.body.amount);
      if (req.body.offerid || req.body.offerid != "") {
        const offerData = await offerModel.findOne({
          _id: req.body.offerid,
        });
        if (offerData && Number(offerData.max_amount) <= Number(req.body.amount)) {
          offerId = req.body.offerid;
        } else {
          return {
            message: `offer code apply on minimum amount ${offerData.max_amount}`,
            status: false,
            data: {},
          };
        }
      }
      let randomStr = randomstring.generate({
        length: 4,
        charset: 'alphabetic',
        capitalization: 'uppercase'
      });
      const txnid = `${constant.APP_SHORT_NAME}-add-${Date.now()}${randomStr}`;
      let mypayment = await instance.orders.create({
        "amount": Number(req.body.amount) * 100,
        "currency": "INR",
        "receipt": txnid
      });
      let addpayment = await PaymentProcessModel.create({
        amount: req.body.amount,
        userid: hasUser._id,
        paymentmethod: req.body.paymentby,
        orderid: mypayment.id,
        txnid: txnid,
        offerid: offerId,
        payment_type: constant.PAYMENT_TYPE.ADD_CASH,
      });
      console.log("--addpaymentprocess---", addpayment)
      return {
        message: "Order Id Generated",
        status: true,
        data: { Order_id: mypayment.id, txnid: txnid, amount: req.body.amount },
      };
    } catch (error) {
      throw error;
    }
  }

  async requestprocess(paymentgatewayinfo) {
    try {
      let pipeline = [];
      pipeline.push({
        $match: {
          $and: [
            { status: constant.PAYMENT_STATUS_TYPES.PENDING },
            {
              $or: [
                { orderid: paymentgatewayinfo.orderId },
                { returnid: paymentgatewayinfo.returnid },
                { orderid: paymentgatewayinfo.returnid },
                { returnid: paymentgatewayinfo.txnid },
                { txnid: paymentgatewayinfo.txnid }
              ],
            },
          ],
        },
      });
      pipeline.push({
        $lookup: {
          from: "users",
          localField: "userid",
          foreignField: "_id",
          as: "userdata",
        },
      });
      pipeline.push({
        $unwind: {
          path: "$userdata",
        },
      });
      pipeline.push({
        $project: {
          _id: 1,
          userid: 1,
          txnid: 1,
          amount: 1,
          offerid: 1,
          paymentmethod: 1,
          status: 1,
          orderid: 1,
          returnid: 1,
          pay_id: 1,
          username: "$userdata.username",
          userbalance: "$userdata.userbalance",
          balance: "$userdata.userbalance.balance",
          winning: "$userdata.userbalance.winning",
          bonus: "$userdata.userbalance.bonus",
          email: "$userdata.email",
          mobile: "$userdata.mobile",
          mobileVerify: "$userdata.user_verify.mobile_verify",
          emailVerify: "$userdata.user_verify.email_verify",
          referbonus: "$userdata.user_verify.referbonus",
          refer_id: "$userdata.refer_id"
        },
      });

      let findUserInfo1 = await PaymentProcessModel.aggregate(pipeline);
      let findUserInfo = findUserInfo1[0];
      if (!findUserInfo) {
        return {
          message: "no user data found",
          status: false,


        };
      }
      let fetchInfo = {};
      let obj = {};
      fetchInfo.amount = findUserInfo.amount;
      fetchInfo.userid = findUserInfo.userid;
      fetchInfo.paymentby = findUserInfo.paymentmethod;
      fetchInfo.returnid = findUserInfo.returnid;
      fetchInfo.pay_id = findUserInfo.pay_id;

      // obj.returnid = paymentgatewayinfo.txnid;
      obj.pay_id = paymentgatewayinfo.pay_id;
      obj.returnid = paymentgatewayinfo.returnid;
      obj.status = 'SUCCESS';
      const updatePaymentProcess = await PaymentProcessModel.findOneAndUpdate(
        { orderid: findUserInfo.orderid },
        { $set: obj },
        { new: true }
      );

      if (findUserInfo.userbalance) {
        let newAmount = findUserInfo.balance + paymentgatewayinfo.amount;
        const updateUserBalance = await userModel.findOneAndUpdate(
          { _id: fetchInfo.userid },
          {
            $set: { "userbalance.balance": newAmount },
          }
        );

        if (findUserInfo.offerid) {
          let findOffer = await offerModel.findOne({
            userid: findUserInfo.userid,
          });
          let amountt;
          if (findOffer.bonus_type == "per") {
            amountt = finduserinfo.amount * (findOffer.bonus / 100);
          } else {
            amountt = findOffer.bonus;
          }
          let updateUser;
          let bonusType = "special bonus";
          if (findOffer.type == "rs") {
            let insertbalance = newAmount + amountt;
            updateUser = await userModel.findOneAndUpdate(
              { _id: fetchInfo.userid },
              { $set: { "userbalance.balance": insertbalance } },
              { new: true }
            );
            bonusType = 'extra cash';
          } else {
            let insertbonus = findUserInfo.bonus + amountt;
            updateUser = await userModel.findOneAndUpdate(
              { _id: fetchInfo.userid },
              { $set: { "userbalance.bonus": insertbonus } },
              { new: true }
            );
          }

          let userOfferObj = {},
            transactionObj = {},
            notificationObj = {};
          let bal_bonus_amt = updateUser.userbalance.bonus;
          let bal_win_amt = updateUser.userbalance.winning;
          let bal_fund_amt = updateUser.userbalance.balance;
          let total_available_amt = updateUser.userbalance.balance + updateUser.userbalance.bonus + updateUser.userbalance.winning;
          transactionObj.transaction_id = `${constant.APP_SHORT_NAME
            }-EBONUS-${Date.now()}`;
          transactionObj.transaction_by = constant.TRANSACTION_BY.APP_NAME;
          transactionObj.userid = findUserInfo.userid;
          transactionObj.type = bonusType;
          transactionObj.amount = amountt;
          if (findOffer.type == "rs") {
            transactionObj.addfund_amt = amountt;
          } else {
            transactionObj.bonus_amt = amountt;
          }
          transactionObj.paymentstatus = "confirmed";
          transactionObj.bal_fund_amt = bal_fund_amt;
          transactionObj.bal_win_amt = bal_win_amt;
          transactionObj.bal_bonus_amt = bal_bonus_amt;
          transactionObj.total_available_amt = total_available_amt;
          userOfferObj.user_id = findUserInfo.userid;
          userOfferObj.offer_id = findOffer._id;
          const insertTransaction = await TransactionModel.create(
            transactionObj
          );
          const insertUsedOffer = await usedOfferModel.create(userOfferObj);
          notificationObj.title = `'You have got ₹'${amountt}' special bonus on ' ${constant.APP_SHORT_NAME}' app.'`;
          notificationObj.userid = findUserInfo.userid;
          const insertNotification = await NotificationModel.create(
            notificationObj
          );
        }
      }

      /* entry in transactions*/
      let trdata = {};
      trdata.type = "Cash added";
      trdata.transaction_id = findUserInfo.txnid;
      trdata.userid = findUserInfo.userid;
      trdata.amount = findUserInfo.amount;
      trdata.addfund_amt = findUserInfo.amount;
      trdata.transaction_by = paymentgatewayinfo.paymentby;
      const insertTransaction = await TransactionModel.create(trdata);
      return {
        status: true,
        data: findUserInfo
      };
    } catch (error) {
      throw error;
    }
  }
  async userDataWebhook(orderId) {
    let pipeline = [];
    pipeline.push({
      $match: {
        $and: [
          { status: constant.PAYMENT_STATUS_TYPES.PENDING },
          {
            $or: [
              { orderid: orderId },
            ],
          },
        ],
      },
    });
    pipeline.push({
      $lookup: {
        from: "users",
        localField: "userid",
        foreignField: "_id",
        as: "userdata",
      },
    });
    pipeline.push({
      $unwind: {
        path: "$userdata",
      },
    });
    pipeline.push({
      $project: {
        _id: 1,
        userid: 1,
        amount: 1,
        offerid: 1,
        paymentmethod: 1,
        status: 1,
        orderid: 1,
        returnid: 1,
        pay_id: 1,
        txnid: 1,
        username: "$userdata.username",
        userbalance: "$userdata.userbalance",
        balance: "$userdata.userbalance.balance",
        winning: "$userdata.userbalance.winning",
        bonus: "$userdata.userbalance.bonus",
        email: "$userdata.email",
        mobile: "$userdata.mobile",
        mobileVerify: "$userdata.user_verify.mobile_verify",
        emailVerify: "$userdata.user_verify.email_verify",
        referbonus: "$userdata.user_verify.referbonus",
        refer_id: "$userdata.refer_id"
      },
    });

    let findUserInfo1 = await PaymentProcessModel.aggregate(pipeline);
    return findUserInfo1;

  }
  async addAmountTransection(userData, addAmount, type, amountType, transaction_id) {
    let transactionObj = {}
    transactionObj.transaction_id = transaction_id;
    transactionObj.transaction_by = constant.TRANSACTION_BY.APP_NAME;
    transactionObj.userid = userData._id;
    transactionObj.type = type
    transactionObj.amount = addAmount;
    transactionObj.paymentstatus = "confirmed";
    if (amountType == 'fund') {
      transactionObj.addfund_amt = addAmount;
    } else if (amountType == 'bonus') {
      transactionObj.bonus_amt = addAmount;
    } else {
      transactionObj.win_amt = addAmount
    }
    transactionObj.bal_fund_amt = userData.userbalance.balance;
    transactionObj.bal_win_amt = userData.userbalance.winning;
    transactionObj.bal_bonus_amt = userData.userbalance.bonus;
    transactionObj.total_available_amt = userData.userbalance.balance + userData.userbalance.winning + userData.userbalance.bonus
    const insertTransaction = await TransactionModel.create(
      transactionObj
    );
    console.log(`--insertTransaction-- ${type}--`, insertTransaction._id);
    return true;
  }
  async AddAmountNotification(userData, addAmount, type) {
    let notificationObj = {}
    notificationObj.title = `'You have successfully add ${type} ₹ ${addAmount}  on ' ${constant.APP_SHORT_NAME}' app.'`;
    notificationObj.userid = userData._id;
    const insertNotification = await NotificationModel.create(
      notificationObj
    );
    console.log(`--insertNotification- ${type}-`, insertNotification._id)
    return true;
  }
  async referDetails(req) {

    let result = await userModel.find({ refer_id: req.user._id }, { email: 1, mobile: 1, team: 1 });
    console.log("result..............." + req.user._id)
    return {
      status: true,
      message: "get user refer details",
      data: result,
    };
  }
  //sahil phonepay start



  async phonePayWebhook(req, res) {
    const input = req.body;
    if (Object.keys(input).length !== 0) {
      try {
        const data = new PaymentData({ data: JSON.stringify(input) });
        const savedData = await data.save();
        const datas = await PaymentData.findById(savedData._id);
        const inputJson = JSON.parse(datas.data);
        let response1;
        if (inputJson.response) {
          response1 = JSON.parse(Buffer.from(inputJson.response, 'base64').toString('utf-8'));
        } else {
          const response = await axios.get(
            `https://api.phonepe.com/apis/hermes/pg/v1/status/MGELEVENONLINE/${inputJson.order_id}`,
            {
              headers: {
                'Content-Type': 'application/json',
                'X-MERCHANT-ID': 'MGELEVENONLINE',
                'X-VERIFY': inputJson.xverify,
                'accept': 'application/json'
              }
            }
          );
          response1 = response.data;
        }
        if (response1.code === 'PAYMENT_SUCCESS') {
          const input = response1.data;
          const orderId = input.merchantTransactionId;
          if (orderId) {
            const checkData = await PaymentProcessModel.findOne({ txnid: orderId });
            if (checkData) {
              const uid = checkData.userid;
              const pstatus = checkData.status;
              if (pstatus === 'pending') {
                const userId = uid;
                const amount = Math.floor(checkData.amount);
                const returnId = orderId;
                const loginSession = await userModel.findById(userId);
                if (loginSession) {
                  const paymentData = {
                    amount: amount,
                    userid: loginSession._id,
                    username: loginSession.username,
                    mobile: loginSession.mobile,
                    email: loginSession.email,
                    paymentby: checkData.paymentmethod
                  };
                }

                const paymentGatewayInfo = {
                  orderId: checkData.orderid,
                  amount: amount,
                  txnid: orderId,
                  paymentby: checkData.paymentmethod,
                  returnid: orderId,
                  pay_id: checkData.pay_id,
                  status: checkData.status
                };
                const returnAmount = await this.requestprocess(paymentGatewayInfo);
                if (returnAmount === 'success' || returnAmount.status == true) {
                  const data21 = {
                    userid: userId,
                    seen: 0,
                    title: 'payment done',
                    msg: `You have added rupees ${paymentGatewayInfo.amount} by ${paymentGatewayInfo.paymentby}`
                  };
                  await NotificationModel.create(data21);
                  const totalAmt = loginSession.userbalance;
                  let total = 0;

                  if (totalAmt) {
                    total = totalAmt.bonus + totalAmt.winning + totalAmt.balance;
                  }

                  const json = {
                    total_amount: total
                  };

                  return { message: 'Payment Done', data: json, status: true };
                } else {
                  return { message: 'Payment Failed', status: false };
                }
              } else {
                return { message: 'Payment Allready Added', status: true };
              }
            }

          }
          else {
            return { message: 'Data Not Avalible', status: false };
          }
        }
        else {
          return { message: 'Payment Failed', status: false };
        }
      }
      catch (error) {
        console.log("error", error)
      }
    }

  }
  //sahil phonepay end
  /**
   * @function webhookDetail
   * @description cashfree Webhook response
   * @param {orderId,orderAmount,referenceId,txStatus,paymentMode,txMsg,txTime,signature}
   * @author 
   */
  //cashfreewebhook
  async cashfreewebhook(req, res) {
    try {
      let m = 0;

      if (!req.body.orderId)
        return {
          message: "Please insert orderId",
          status: false,
          data: {},
        };

      if (!req.body.orderAmount)
        return {
          message: "Please insert Amount",
          status: false,
          data: {},
        };

      if (!req.body.paymentMode)
        return {
          message: "Please Choose Payment Mode",
          status: false,
          data: {},
        };

      if (!req.body.referenceId)
        return {
          message: "Please insert Reference ID",
          status: false,
          data: {},
        };

      if (!req.body.signature)
        return {
          message: "Signature not uploaded",
          status: false,
          data: {},
        };

      if (!req.body.txTime)
        return {
          message: "Please insert Time",
          status: false,
          data: {},
        };

      if (!req.body.txMsg)
        return {
          message: "Please insert message",
          status: false,
          data: {},
        };

      if (req.body.txStatus == "SUCCESS") {
        let orderId = req.body.orderId;
        let amount = req.body.orderAmount; // we need these
        let returnid = req.body.referenceId; // we need these
        let status = "pending"; // we need these
        let paymentby = req.body.paymentMode; // we need these
        let txMsg = req.body.txMsg;
        let txTime = req.body.txTime;
        let signature = req.body.signature;
        let data = `${orderId}${amount}${returnid}${status}${paymentby}${txMsg}${txTime}`;
        // CryptoJS.HmacSHA256
        const computedSignature = CryptoJS.enc.Base64.stringify(
          CryptoJS.HmacSHA256(data, constant.CASHFREE_SECRETKEY)
        );
        console.log(`computedSignature`, computedSignature);
        let getdata = {};
        let paymentdata = {};
        let paymentgatewayinfo = {};

        const findOrderId = await PaymentProcessModel.findOne({
          orderid: orderId,
        });
        if (!findOrderId) {
          return {
            message: "order ID not found",
            status: false,
            data: {},
          };
        }
        let uid = findOrderId.userid;
        let paymentstatus = findOrderId.status;
        if (paymentstatus == "pending") {
          getdata.amount = Number(amount);
          getdata.userid = uid;
          getdata.returnid = returnid;
          let userData = await userModel.findOne({ _id: uid });
          if (!userData) {
            return {
              message: "user not found",
              status: false,
              data: {},
            };
          }
          paymentdata.amount = amount;
          paymentdata.userid = userData._id;
          paymentdata.username = userData.username;
          paymentdata.mobile = userData.mobile;
          paymentdata.email = userData.email;
          paymentdata.paymentby = paymentby;

          paymentgatewayinfo.amount = getdata.amount;
          paymentgatewayinfo.txnid = orderId;
          paymentgatewayinfo.orderId = orderId;
          paymentgatewayinfo.paymentby = paymentby;
          paymentgatewayinfo.returnid = returnid;
          paymentgatewayinfo.status = status;
          let returnamount = this.requestprocess(paymentgatewayinfo);
          if (returnamount.status == true) {
            let newTransactionObj = {};
            if (findOrderId.refer_id) {
              let totaladded = await PaymentProcessModel.findOne(
                { status: "success", userid: uid },
                { amount: 1 }
              );
              let newAmount = 0;
              if (totaladded) {
                newAmount = getdata.amount + totaladded.amount;
              } else {
                newAmount = getdata.amount;
              }
            }
            if (newAmount >= 100) {
              if (findOrderId.user_verify.referbonus == 0) {
                let reffering = findOrderId.refer_id;
                amount = 50;
                let findUserRefferal = await userModel.findOne({
                  _id: reffering,
                });
                let updateBonus = findUserRefferal.userbalance.bonus + 50;
                let updateUserBalance =
                  await userModel.userModeq.findOneAndUpdate(
                    { _id: reffering },
                    {
                      $Set: {
                        "userbalance.bonus": updateBonus,
                        "user_verify.referbonus": 1,
                      },
                    },
                    { new: true }
                  );
                let total_available_amt =
                  findUserRefferal.userbalance.balance +
                  findUserRefferal.userbalance.bonus +
                  findUserRefferal.userbalance.winning;

                newTransactionObj.userid = reffering;
                newTransactionObj.type = "Refer Bonus";
                newTransactionObj.transaction_id = `${constant.APP_SHORT_NAME
                  }-NWP-${Date.now()}`;
                newTransactionObj.transaction_by = "NWP";
                newTransactionObj.amount = amount;
                newTransactionObj.paymentstatus = "confirm";
                newTransactionObj.bal_fund_amt =
                  findUserRefferal.userbalance.balance;
                newTransactionObj.bal_win_amt =
                  findUserRefferal.userbalance.bonus;
                newTransactionObj.bal_bonus_amt =
                  findUserRefferal.userbalance.winning;
                newTransactionObj.total_available_amt = total_available_amt;
                const insertTransactionData = await TransactionModel.create(
                  newTransactionObj
                );
              }
            }
          }
          let notificationObj2 = {};
          notificationObj2.userid = uid;
          notificationObj2.seen = 0;
          let titleget = "payment done";
          let msg =
            (notificationObj2.title = `You have added rupees ${getdata.amount}' by ${paymentby}`);
          const insertNotificationdata = await NotificationModel.create(
            notificationObj2
          );

          return {
            status: true,
            message: "payment done",
          };
        } else {
          return {
            status: false,
            message: "payment failed",
          };
        }
      } else {
        return {
          status: false,
          message: "payment failed",
        };
      }

    }
    catch (error) {
      console.log("error", error)
    }
  }
  //cashfreewebhook end
  async webhookDetail(req, res) {
    try {

      const webhookSignature = req.headers['x-razorpay-signature']
      if (req.body.event == constant.RAZORPAY_ADDCASH_PAYMENT.PAYMENT_CAPTURED) {
        const webhookSignature = req.headers['x-razorpay-signature']
        let message = JSON.stringify(req.body)
        let expected_signature1 = crypto.createHmac('sha256', KEY_SECRET).update(message).digest('hex');
        console.log("--expected_signature1-----", expected_signature1)
        if (expected_signature1 === webhookSignature) {
          if (req.body.payload.payment.entity && req.body.payload.payment.entity.status == 'captured') {
            const userData = await this.userDataWebhook(req.body.payload.payment.entity.order_id);
            if (userData.length > 0) {

              let addAmount = req.body.payload.payment.entity.amount / 100;
              const updateUserBalance = await userModel.findOneAndUpdate(
                { _id: userData[0].userid },
                {
                  $inc: { "userbalance.balance": addAmount },
                }, { new: true }
              );
              if (updateUserBalance) {
                let transaction_id = userData[0].txnid;
                const createTransection = await this.addAmountTransection(updateUserBalance, addAmount, 'Cash added', 'fund', transaction_id);
                const createNotification = await this.AddAmountNotification(updateUserBalance, addAmount, 'Cash');
                const updatePaymentStatus = await PaymentProcessModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(userData[0]._id) }, {
                  $set: { status: constant.RAZORPAY_ADDCASH_PAYMENT.PAYMENT_CAPTURED }
                }, { new: true });
                console.log("--updatePaymentStatus--", updatePaymentStatus)
              }

              // --offer bonus
              console.log("--userData[0].offerid---", userData[0].offerid)
              if (userData[0].offerid) {
                let findOffer = await offerModel.findOne({
                  _id: userData[0].offerid,
                });
                // console.log("--findOffer.bonus_type --",findOffer.bonus_type )
                let amountt;
                if (findOffer.bonus_type == "per") {
                  amountt = userData[0].amount * (findOffer.bonus / 100);
                } else {
                  amountt = findOffer.bonus;
                }
                // console.log("--amountt--offer-",amountt)
                let updateUser;
                if (findOffer.type == "rs") {
                  let insertbalance = userData[0].balance + amountt;
                  updateUser = await userModel.findOneAndUpdate(
                    { _id: userData[0].userid },
                    { $inc: { "userbalance.balance": amountt } }, { new: true }
                  );
                } else {
                  let insertbonus = userData[0].bonus + amountt;
                  updateUser = await userModel.findOneAndUpdate(
                    { _id: userData[0].userid },
                    { $inc: { "userbalance.bonus": amountt } }, { new: true }
                  );
                }
                // console.log("===updateUser=offer=",updateUser)
                if (updateUser) {
                  let transaction_id = `${constant.APP_SHORT_NAME
                    }-Offer-${Date.now()}`;
                  const createTransection = await this.addAmountTransection(updateUser, amountt, 'Offer bonus', 'bonus', transaction_id);
                  const createNotification = await this.AddAmountNotification(updateUser, amountt, 'Offer bonus');
                  let userOfferObj = {}
                  userOfferObj.user_id = updateUser._id;
                  userOfferObj.offer_id = userData[0].offerid;
                  userOfferObj.transaction_id = transaction_id;
                  const insertUsedOffer = await usedOfferModel.create(userOfferObj);
                }
              }

              // give refer person bonus for first transection
              // console.log("--updateUserBalance.userbalance.balance--",updateUserBalance.userbalance.balance);
              // console.log("--userData[0].referbonus--",userData[0].referbonus);
              let pipline = [];
              pipline.push({
                $match: {
                  userid: mongoose.Types.ObjectId(userData[0].userid),
                  status: "success"
                }
              })
              pipline.push({
                $group: {
                  _id: '$userid',
                  amount: { $sum: '$amount' }
                }
              })
              const pipline_TotalSum = await PaymentProcessModel(pipline);
              let sumAmountAddCash = 0;
              if (pipline_TotalSum.length > 0) {
                sumAmountAddCash = pipline_TotalSum[0].amount
              }
              // console.log("--sumAmountAddCash- to refer to check balance history-",sumAmountAddCash)

              if (Number(addAmount) >= 100 && Number(sumAmountAddCash) <= 100) {
                if (userData[0].referbonus == 0) {
                  if (userData[0].refer_id && userData[0].refer_id != "") {
                    // console.log("--userData[0].refer_id --",userData[0].refer_id );
                    let updatereferbAL = await userModel.findOneAndUpdate(
                      { _id: userData[0].refer_id },
                      {
                        $inc: { "userbalance.bonus": 50 },
                      },
                      { new: true }
                    );
                    let updateUserverification = await userModel.updateOne(
                      { _id: userData[0].userid },
                      {
                        $set: { "user_verify.referbonus": 1 },
                      },
                      { new: true }
                    );
                    // console.log("--updatereferbAL--",updatereferbAL._id)
                    if (updatereferbAL) {
                      let transaction_id = `${constant.APP_SHORT_NAME
                        }-BonusRefer-${Date.now()}`
                      const createTransection = await this.addAmountTransection(updatereferbAL, 50, 'Bonus refer', 'bonus', transaction_id);
                      const createNotification = await this.AddAmountNotification(updatereferbAL, 50, 'Bonus refer');
                    }
                  }
                }
              }
              return {
                status: true,
                message: "payment done",
              };

              // ------
            } else {

              return {
                status: false,
                message: "user not found"
              }
            }

          }
        } else {
          return {
            status: false,
            message: "Not Authorized"
          }
        }

      }
      else {

        return {
          status: false,
          message: "Invalid Hook"
        }
      }
      //  let respon=req.body.payload.payment.entity;
      //  console.log("==respon=====",respon)
      //  if(respon && respon.status == 'captured'){
      //     if(!respon.order_id && respon.order_id != ""){
      //       return{
      //         status:false,
      //         message:"Please insert orderId",
      //         data:{}
      //       }
      //     }
      //     if(!respon.id && respon.id != ""){
      //       return{
      //         status:false,
      //         message:"insert payment id",
      //         data:{}
      //       }
      //     }
      //     if(!respon.amount){
      //       return{
      //         status:false,
      //         message:"please insert amount",
      //         data:{}
      //       }
      //     }
      //     let getdata = {};
      //     let paymentdata = {};
      //     let paymentgatewayinfo = {};
      //     // let paymentMode='';
      //     // if(respon.card_id) paymentMode = respon.card_id;
      //     // if(respon.bank) paymentMode = respon.bank;
      //     // if(respon.wallet) paymentMode= respon.wallet;
      //     // if(respon.vpa) paymentMode = respon.vpa ;

      //       let orderId = respon.order_id;
      //       let amount =  Number(respon.amount)/100; // we need these
      //       let pay_id = respon.id; // we need these
      //       let status= respon.status; // we need these
      //       let paymentby ="razorpay"; // we need these

      //       const findOrderId = await PaymentProcessModel.findOne({
      //         orderid: orderId,
      //       });
      //       // console.log("--findOrderId--",findOrderId);
      //         if (!findOrderId) {
      //             return {
      //               message: "order ID not found",
      //               status: false,
      //               data: {},
      //             };
      //           }
      //       let uid = findOrderId.userid;
      //       let paymentstatus = findOrderId.status;

      //     if (paymentstatus == "pending") {
      //             getdata.amount = Number(amount);
      //             getdata.userid = uid;
      //             let userData = await userModel.findOne({ _id: uid });
      //             if (!userData) {
      //               return {
      //                 message: "user not found",
      //                 status: false,
      //                 data: {},
      //               };
      //             }
      //             paymentdata.amount = amount;
      //             paymentdata.userid = userData._id;
      //             paymentdata.username = userData.username;
      //             paymentdata.mobile = userData.mobile;
      //             paymentdata.email = userData.email;
      //             paymentdata.paymentby = paymentby;
      //             paymentdata.pay_id = pay_id;

      //             paymentgatewayinfo.amount = amount;
      //             paymentgatewayinfo.orderId = orderId;
      //             paymentgatewayinfo.paymentby = paymentby;
      //             paymentgatewayinfo.status = status;
      //             paymentgatewayinfo.pay_id = pay_id;

      //             let returnamount =await this.requestprocess(paymentgatewayinfo);
      //            console.log("returnamount------",returnamount)
      //             if (returnamount.status == true) {
      //                     let newTransactionObj = {};
      //                     if (returnamount.data.refer_id) {
      //                       let totaladded = await PaymentProcessModel.findOne(
      //                         { status: "success", userid: uid },
      //                         { amount: 1 }
      //                       );
      //                     let newAmount = 0;
      //                       if (totaladded) {
      //                         newAmount = getdata.amount + totaladded.amount;
      //                       } else {
      //                         newAmount = getdata.amount;
      //                       }
      //                       if (newAmount >= 100) {
      //                         if (returnamount.data.referbonus == 0) {
      //                           let reffering =returnamount.data.refer_id;
      //                           amount = 50;
      //                           let findUserRefferal = await userModel.findOne({
      //                             _id: reffering,
      //                           });
      //                           let updateBonus = findUserRefferal.userbalance.bonus + 50;
      //                           let updateUserBalance =
      //                             await userModel.findOneAndUpdate(
      //                               { _id: reffering },
      //                               {
      //                                   "userbalance.bonus": updateBonus,
      //                                   "user_verify.referbonus": 1,
      //                               },
      //                               { new: true }
      //                             );
      //                           let total_available_amt =
      //                             findUserRefferal.userbalance.balance +
      //                             findUserRefferal.userbalance.bonus +
      //                             findUserRefferal.userbalance.winning;

      //                           newTransactionObj.userid = reffering;
      //                           newTransactionObj.type = "Refer Bonus";
      //                           newTransactionObj.transaction_id = `${constant.APP_SHORT_NAME}-NWP-${Date.now()}`;
      //                           newTransactionObj.transaction_by = "NWP";
      //                           newTransactionObj.amount = amount;
      //                           newTransactionObj.paymentstatus = "confirm";
      //                           newTransactionObj.bal_fund_amt =
      //                             findUserRefferal.userbalance.balance;
      //                           newTransactionObj.bal_win_amt =
      //                             findUserRefferal.userbalance.bonus;
      //                           newTransactionObj.bal_bonus_amt =
      //                             findUserRefferal.userbalance.winning;
      //                           newTransactionObj.total_available_amt = total_available_amt;
      //                           const insertTransactionData = await TransactionModel.create(
      //                             newTransactionObj
      //                           );
      //                         }
      //                       }
      //                     }
      //               }

      //               let notificationObj2 = {};
      //               notificationObj2.userid = uid;
      //               notificationObj2.seen = 0;
      //               let titleget = "payment done";
      //               let msg =
      //                 (notificationObj2.title = `You have added rupees ${amount} by ${paymentby}`);
      //               const insertNotificationdata = await NotificationModel.create(
      //                 notificationObj2
      //               );
      //               return {
      //                 status: true,
      //                 message: "payment done",
      //               };
      //  }else{
      //   return{
      //     status:false,
      //     message:"payment Failed",
      //     data:{}
      //   }
      //  }
      // }
      return {
        status: false,
        message: "Failed payment",
        data: {}
      }
      //  -----------------------------------------------
      // if (!req.body.order_id)
      //   return {
      //     message: "Please insert orderId",
      //     status: false,
      //     data: {},
      //   };

      // if (!req.body.orderAmount)
      //   return {
      //     message: "Please insert Amount",
      //     status: false,
      //     data: {},
      //   };

      // if (!req.body.paymentMode)
      //   return {
      //     message: "Please Choose Payment Mode",
      //     status: false,
      //     data: {},
      //   };

      // if (!req.body.referenceId)
      //   return {
      //     message: "Please insert Reference ID",
      //     status: false,
      //     data: {},
      //   };

      // if (!req.body.signature)
      //   return {
      //     message: "Signature not uploaded",
      //     status: false,
      //     data: {},
      //   };

      // if (!req.body.txTime)
      //   return {
      //     message: "Please insert Time",
      //     status: false,
      //     data: {},
      //   };

      // if (!req.body.txMsg)
      //   return {
      //     message: "Please insert message",
      //     status: false,
      //     data: {},
      //   };

      // if (req.body.txStatus == "SUCCESS") {
      //   let orderId = req.body.orderId;
      //   let amount = req.body.orderAmount; // we need these
      //   let returnid = req.body.referenceId; // we need these
      //   let status = "pending"; // we need these
      //   let paymentby = req.body.paymentMode; // we need these
      //   let txMsg = req.body.txMsg;
      //   let txTime = req.body.txTime;
      //   let signature = req.body.signature;
      //   let data = `${orderId}${amount}${returnid}${status}${paymentby}${txMsg}${txTime}`;
      //   // CryptoJS.HmacSHA256
      //   const computedSignature = CryptoJS.enc.Base64.stringify(
      //     CryptoJS.HmacSHA256(data, constant.RAZORPAY_KEY_SECRET)
      //   ); //constant.CASHFREE_SECRETKEY
      //   console.log(`computedSignature`, computedSignature);
      //   let getdata = {};
      //   let paymentdata = {};
      //   let paymentgatewayinfo = {};
      //   // if (signature != computedSignature) {
      //   //     return {
      //   //         status: false,
      //   //         message: 'Signature not matched',
      //   //         data: {}
      //   //     }
      //   // }
      //   const findOrderId = await PaymentProcessModel.findOne({
      //     orderid: orderId,
      //   });
      //   if (!findOrderId) {
      //     return {
      //       message: "order ID not found",
      //       status: false,
      //       data: {},
      //     };
      //   }
      //   let uid = findOrderId.userid;
      //   let paymentstatus = findOrderId.status;
      //   if (paymentstatus == "pending") {
      //     getdata.amount = Number(amount);
      //     getdata.userid = uid;
      //     getdata.returnid = returnid;
      //     let userData = await userModel.findOne({ _id: uid });
      //     if (!userData) {
      //       return {
      //         message: "user not found",
      //         status: false,
      //         data: {},
      //       };
      //     }
      //     paymentdata.amount = amount;
      //     paymentdata.userid = userData._id;
      //     paymentdata.username = userData.username;
      //     paymentdata.mobile = userData.mobile;
      //     paymentdata.email = userData.email;
      //     paymentdata.paymentby = paymentby;

      //     paymentgatewayinfo.amount = getdata.amount;
      //     paymentgatewayinfo.txnid = orderId;
      //     paymentgatewayinfo.paymentby = paymentby;
      //     paymentgatewayinfo.returnid = returnid;
      //     paymentgatewayinfo.status = status;
      //     let returnamount;
      //     if (findOrderId.payment_type == constant.PAYMENT_TYPE.ADD_PASS) {
      //       paymentgatewayinfo.ticketid = findOrderId.ticketid;
      //       console.log(
      //         `paymentgatewayinfo>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>`,
      //         paymentgatewayinfo
      //       );
      //       returnamount =
      //         this.addTransactionAndNotificationForPass(paymentgatewayinfo);
      //     } else {
      //       returnamount = this.requestprocess(paymentgatewayinfo);
      //     }
      //     if (returnamount.status1 == true) {
      //       return {
      //         status: true,
      //         message: "payment done",
      //       };
      //     }
      //     if (returnamount.status == true) {
      //       let newTransactionObj = {};
      //       if (findOrderId.refer_id) {
      //         let totaladded = await PaymentProcessModel.findOne(
      //           { status: "success", userid: uid },
      //           { amount: 1 }
      //         );
      //         let newAmount = 0;
      //         if (totaladded) {
      //           newAmount = getdata.amount + totaladded.amount;
      //         } else {
      //           newAmount = getdata.amount;
      //         }
      //       }
      //       if (newAmount >= 100) {
      //         if (findOrderId.user_verify.referbonus == 0) {
      //           let reffering = findOrderId.refer_id;
      //           amount = 50;
      //           let findUserRefferal = await userModel.findOne({
      //             _id: reffering,
      //           });
      //           let updateBonus = findUserRefferal.userbalance.bonus + 50;
      //           let updateUserBalance =
      //             await userModel.userModeq.findOneAndUpdate(
      //               { _id: reffering },
      //               {
      //                 $Set: {
      //                   "userbalance.bonus": updateBonus,
      //                   "user_verify.referbonus": 1,
      //                 },
      //               },
      //               { new: true }
      //             );
      //           let total_available_amt =
      //             findUserRefferal.userbalance.balance +
      //             findUserRefferal.userbalance.bonus +
      //             findUserRefferal.userbalance.winning;

      //           newTransactionObj.userid = reffering;
      //           newTransactionObj.type = "Refer Bonus";
      //           newTransactionObj.transaction_id = `${constant.APP_SHORT_NAME}-NWP-${Date.now()}`;
      //           newTransactionObj.transaction_by = "NWP";
      //           newTransactionObj.amount = amount;
      //           newTransactionObj.paymentstatus = "confirm";
      //           newTransactionObj.bal_fund_amt =
      //             findUserRefferal.userbalance.balance;
      //           newTransactionObj.bal_win_amt =
      //             findUserRefferal.userbalance.bonus;
      //           newTransactionObj.bal_bonus_amt =
      //             findUserRefferal.userbalance.winning;
      //           newTransactionObj.total_available_amt = total_available_amt;
      //           const insertTransactionData = await TransactionModel.create(
      //             newTransactionObj
      //           );
      //         }
      //       }
      //     }
      //     let notificationObj2 = {};
      //     notificationObj2.userid = uid;
      //     notificationObj2.seen = 0;
      //     let titleget = "payment done";
      //     let msg =
      //       (notificationObj2.title = `You have added rupees ${getdata.amount}' by ${paymentby}`);
      //     const insertNotificationdata = await NotificationModel.create(
      //       notificationObj2
      //     );
      //     //    $result=Helpers::sendnotification($titleget,$msg,'',$uid );
      //     return {
      //       status: true,
      //       message: "payment done",
      //     };
      //   } else {
      //     return {
      //       status: false,
      //       message: "payment failed",
      //     };
      //   }
      // } else {
      //   return {
      //     status: false,
      //     message: "payment failed",
      //   };
      // }
    } catch (error) {
      throw error;
    }
  }
  async getNotification(req) {
    try {
      let notificationdata = await NotificationModel.find({
        userid: req.user._id,
      }).sort({ createdAt: -1 });
      await NotificationModel.updateMany(
        { userid: req.user._id, seen: 0 },
        { seen: 1 }
      );
      if (notificationdata.length == 0) {
        return {
          message: "Notification of user for previous and today Not Found...",
          status: false,
          data: [],
        };
      }
      let newNotification = []
      for await (let key of notificationdata) {
        let Obj = {};
        Obj._id = key._id;
        Obj.userid = key.userid;
        Obj.title = key.title;
        Obj.seen = key.seen;
        Obj.module = "";
        Obj.createdAt = key.createdAt;
        Obj.updatedAt = key.updatedAt;
        newNotification.push(Obj)
      }
      return {
        message: "Get Notification of user for previous and today",
        status: true,
        data: newNotification,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * @Route offerdepositsnew
   * @function getOffers
   * @description All Offers Details
   * @param {  } auth key
   * @author 
   */
  async getOffers(req) {
    try {
      const aggPipe = [];
      // aggPipe.push({
      //   $match: {
      //     start_date: { $lte: moment().format("YYYY-MM-DD HH:mm:ss") },
      //     expire_date: { $gte: moment().format("YYYY-MM-DD") },
      //   },
      // });
      // aggPipe.push({
      //   $lookup: {
      //     from: "usedoffers",
      //     let: { offer_id: "$_id" },
      //     pipeline: [
      //       {
      //         $match: {
      //           $expr: {
      //             $and: [
      //               { $eq: ["$$offer_id", "$offer_id"] },
      //               {
      //                 $eq: ["$user_id", mongoose.Types.ObjectId(req.user._id)],
      //               },
      //             ],
      //           },
      //         },
      //       },
      //       {
      //         $group: {
      //           _id: null,
      //           used: { $sum: 1 },
      //         },
      //       },
      //     ],
      //     as: "usedoffer",
      //   },
      // });
      // aggPipe.push({
      //   $project: {
      //     _id: 0,
      //     offerid: "$_id",
      //     title: 1,
      //     minamount: { $ifNull: ["$min_amount", 0] },
      //     amount: "$max_amount",
      //     offercode: 1,
      //     bonus: 1,
      //     bonus_type: 1,
      //     start_date: 1,
      //     expire_date: 1,
      //     used_time: 1,
      //     description: 1,
      //     image: {
      //       $concat: [
      //         `${constant.BASE_URL}`, "", "$image"
      //       ]
      //     }
      //   },
      // });
      const offers = await offerModel.find();
      if (!offers)
        return {
          message: "Offer Not Found",
          status: false,
          data: [],
        };

      let newArray = [];
      for await (let key of offers) {
        console.log("--req.user._id--", req.user._id);
        let finduseringCount = await usedOfferModel.countDocuments({ offer_id: key._id, user_id: req.user._id });
        console.log("--finduseringCount---", finduseringCount);
        if (Number(finduseringCount) < Number(key.user_time)) {
          newArray.push({
            _id: key._id,
            max_amount: key.max_amount,
            bonus: key.bonus,
            offer_code: key.offer_code,
            bonus_type: key.bonus_type,
            title: key.title,
            user_time: Number(key.user_time) - Number(finduseringCount),
            type: key.type,
            createdAt: key.createdAt
          })
        }
      }
      return {
        message: "Offer Data...",
        status: true,
        data: newArray,
      };
    } catch (error) {
      throw error;
    }
  }
  /**
   * @Route cashfree payout webhook
   * @function cashfreePayoutWebhook
   * @description All Offers Details
   * @param {  } auth key
   * @author 
   */
  async cashfreePayoutWebhook(req) {
    const signature = req.body.signature;
    let data = req.body;
    delete req.body.signature;
    // let dataKey = '';
    // Object.keys(req.body).sort().forEach(function (v, i) {
    //     console.log(v, req.body[v]);
    //     dataKey += req.body[v];
    // });
    await withdrawWebhookModel.create({ data: data });
    // const computedSignature = Base64.stringify(
    //     hmacSHA256(dataKey, constant.CASHFREE_PAYOUT_SECRETKEY)
    // );
    // let checkSignature= Cashfree.Payouts.VerifySignature(req.body, signature, constant.CASHFREE_PAYOUT_SECRETKEY);
    // console.log(`checkSignature`,checkSignature);
    // if (checkSignature != signature) return true;
    const withdraw_data = await WithdrawModel.findOne({
      tranfer_id: req.body.transferId,
    });
    const hasUser = await userModel
      .findOne({ _id: withdraw_data.user_id })
      .select("email team _id app_key");
    if (!withdraw_data) return true;
    if (
      req.body.event == "TRANSFER_SUCCESS" ||
      req.body.event == "TRANSFER_ACKNOWLEDGED"
    ) {
      await WithdrawModel.updateOne(
        { tranfer_id: withdraw_data.transfer_id },
        {
          status: 1,
          comment: req.body.event,
          referenceid: req.body.referenceid,
          approved_date: moment().format("YYYY-MM-DD HH:mm:ss"),
          // $currentDate: { approved_date: true },
        },
        { new: true }
      );
      await TransactionModel.updateOne(
        { transaction_id: withdraw_data.withdraw_request_id },
        { paymentstatus: constant.PAYMENT_STATUS_TYPES.CONFIRMED },
        { new: true }
      );
      const mail = new Mail(hasUser.email);
      await mail.sendMail(
        mail.email,
        `Withdraw Request Approved on - ${constant.APP_NAME}`,
        `Hello ${hasUser.team} Your withdrawal request of ₹${withdraw_data.amount} has been approved successfully.`
      );
      const notificationObject = {
        receiverId: hasUser._id,
        deviceTokens: hasUser.app_key,
        type: NOTIFICATION_TEXT.WITHDRAW_APPROVE,
        title: NOTIFICATION_TEXT.WITHDRAW_APPROVE.TITLE,
        message: NOTIFICATION_TEXT.WITHDRAW_APPROVE.BODY(withdraw_data.amount),
        entityId: hasUser._id,
      };
      await NotificationModel.create({
        title: notificationObject.message,
        userid: hasUser._id,
      });
      if (!hasUser.app_key) {
        return true;
      }
      await notification.PushNotifications(notificationObject);
      return true;
    } else if (req.body.event == "TRANSFER_FAILED") {
      await WithdrawModel.updateOne(
        { transfer_id: withdraw_data.transfer_id },
        {
          status: 2,
          comment: req.body.reason,
          approved_date: moment().format("YYYY-MM-DD HH:mm:ss"),
        },
        { new: true }
      );
      await UserModel.updateOne(
        { _id: hasUser._id },
        { $inc: { "userbalance.winning": withdraw_data.amount } }
      );
      await TransactionModel.updateOne(
        { transaction_id: withdraw_data.withdraw_request_id },
        { paymentstatus: constant.PAYMENT_STATUS_TYPES.FAILED },
        { new: true }
      );
      return true;
    } else {
      await WithdrawModel.updateOne(
        { transfer_id: withdraw_data.transfer_id },
        {
          status: 2,
          comment: req.body.reason || req.body.event,
          approved_date: moment().format("YYYY-MM-DD HH:mm:ss"),
        },
        { new: true }
      );
      await UserModel.updateOne(
        { _id: hasUser._id },
        { $inc: { "userbalance.winning": withdraw_data.amount } }
      );
      await TransactionModel.updateOne(
        { transaction_id: withdraw_data.withdraw_request_id },
        { paymentstatus: constant.PAYMENT_STATUS_TYPES.FAILED },
        { new: true }
      );
      return true;
    }
  }

  async getYoutuberProfit(req) {
    try {
      // const referUserData=await userModel.find({refer_id:req.user._id});
      let condition = [];

      condition.push({
        $lookup: {
          from: "users",
          localField: "userid",
          foreignField: "_id",
          as: "userData"
        }
      });
      condition.push({
        $lookup: {
          from: "matchchallenges",
          localField: "challengeid",
          foreignField: "_id",
          as: "matchchallengeData"
        }
      });
      condition.push({
        $lookup: {
          from: "listmatches",
          localField: "matchkey",
          foreignField: "_id",
          as: "listmatcheData"
        }
      });
      if (req.query.date) {
        condition.push({
          $match: {
            "listmatcheData.start_date": moment(req.query.date).format("YYYY-MM-DD HH:mm:ss")
          }
        });
      }

      condition.push({
        $unwind: {
          path: "$userData"
        }
      });
      condition.push({
        $unwind: {
          path: "$matchchallengeData"
        }
      });
      condition.push({
        $unwind: {
          path: "$listmatcheData",
        }
      });
      condition.push({
        $project: {
          userid: 1,
          leaugestransaction: 1,
          matchkey: 1,
          "matchchallengeData.joinedusers": 1,
          "challengeid": 1,
          "listmatcheData.name": 1,
          "matchchallengeData.entryfee": 1,
          "matchchallengeData.win_amount": 1,
          "matchchallengeData.status": 1,
          "matchchallengeData.maximum_user": 1,
          "matchchallengeData.bonus_percentage": 1,
          "listmatcheData.start_date": 1,
          "userData.team": 1
        }
      });
      let data1 = await JoinLeaugeModel.aggregate(condition);
      let myArray = [];
      if (data1.length > 0) {

        for await (let key of data1) {
          console.log("key.matchchallengeData.entryfee * key.matchchallengeData.maximum_user <= key.matchchallengeData.win_amount----", key.matchchallengeData.entryfee * key.matchchallengeData.maximum_user, key.matchchallengeData.win_amount)
          if (key.matchchallengeData.entryfee * key.matchchallengeData.maximum_user <= key.matchchallengeData.win_amount) {
            continue;
          }
          const net_profit = await userModel.findOne({ _id: key.userid }, { percentage: 1 });

          let cusers = await matchChallengersModel.countDocuments({ _id: key.challengeid });
          let total_amt = Number(key.leaugestransaction.balance) + Number(key.leaugestransaction.winning) + Number(key.leaugestransaction.bonus);
          let rema_amt = Number(total_amt) - Number(key.matchchallengeData.win_amount);
          let per_user = (rema_amt / key.matchchallengeData.maximum_user) - (key.leaugestransaction.bonus)
          let per_u_tuber = per_user * cusers;
          console.log("per_user-----------------", per_user)
          // console.log("---------------net_profit----------",net_profit.percentage)
          let total_Profit;
          if (net_profit.percentage) {
            total_Profit = (Number(per_user) * Number(net_profit.percentage)) / 100;
          } else {
            total_Profit = 0;
          }
          // console.log("-----------key.userData---------------",key.userData)
          let data = {};
          if (Number(total_Profit) > 0) {

            data.date = key.listmatcheData.start_date || "";
            data.team = key.userData.team || "";
            data.name = key.listmatcheData.name || "";
            data.challengeid = key.challengeid || "";
            data.entryfee = key.matchchallengeData.entryfee || 0;
            data.win_amount = key.matchchallengeData.win_amount || 0;
            data.maximum_user = key.matchchallengeData.maximum_user || 0;
            data.joinedusers = key.matchchallengeData.joinedusers || 0;
            data.net_profit = (total_Profit > 0 ? total_Profit.toFixed(2) : 0) || 0;
            myArray.push(data);
          }
        }
      }

      return {
        status: true,
        data: myArray
      }

    } catch (error) {
      throw error;
    }
  }
  async uploadUserImage(req) {
    try {
      console.log(`req.file`, req.file);
      // const image = `${constant.BASE_URL_LOCAL}${req.body.typename}/${req.file.filename}`;
      const image = `${constant.BASE_URL}${req.body?.typename}/${req.file?.filename}`;
      const payload = await userModel.findOneAndUpdate(
        { _id: req.user._id },
        { image: image },
        { new: true }
      );
      console.log(`req.user`, req.user);
      return {
        message: "Your profile has been updated successfully....!",
        status: true,
        data: {
          image_url: payload.image,
        },
      };
    } catch (error) { }
  }
  async referBonus(req) {
    try {
      const referBonus_is = await AdminModel.findOne({ role: 0 }, { general_tabs: 1 });
      let refer_bonusMe = "refer_bonus";
      // let bonus= await referBonus_is.general_tabs.find((item)=>{
      //   console.log("---item.type------",item.type == "refer_bonus")
      //   if(item.type == "refer_bonus"){
      //     console.log("---item.type------",item.type)
      //     return item.amount
      //   }
      // });
      // else{
      //   return {
      //     "type": "refer_bonus",
      //     "amount": 0,
      //   }
      // }
      let bonus = 0;
      for await (let key of referBonus_is.general_tabs) {
        if (key.type == "refer_bonus") {
          bonus = key.amount;
        }
      }
      console.log("-----bonus refer-to--person----,....", bonus);
      let referBonusto_me = bonus;
      let referBonusto_refer = constant.REFER_BONUS_TO_REFER.REFER_AMOUNT;
      return {
        message: "refer bonus....",
        status: true,
        data: {
          refer_bonusto_me: referBonusto_me,
          refer_bonusto_refer: referBonusto_refer
        },
      };


    } catch (error) { }
  }
  async popupNotify(req) {
    try {
      const get_popup = await AdminModel.findOne({ role: 0 }, { popup_notify_title: 1, popup_notify_image: 1 });
      let url = constant.BASE_URL
      let popup_notify_image = `${url}${get_popup.popup_notify_image}`
      return {
        message: "popup nofify....",
        status: true,
        data: {
          popup_notify_title: get_popup.popup_notify_title,
          popup_notify_image: popup_notify_image
        },
      };

    } catch (error) { }
  }
  async getAllSeries(req) {
    try {
      const curDate = moment().format("YYYY-MM-DD HH:mm:ss");
      let mypipline = [];
      mypipline.push({
        $match: {
          status: 'notstarted',
          end_date: { $gte: curDate },
          has_leaderboard: 'yes'
        }
      })
      mypipline.push({
        $lookup: {
          from: 'listmatches',
          let: { seriesId: "$_id", launch_status: "launched" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$series", "$$seriesId"] }, { $eq: ["$launch_status", "$$launch_status"] }],
                },
              },
            }

          ],
          as: "listmatcheData"
        }
      })
      const seriesData = await seriesModel.aggregate(mypipline);
      let mySeries = []
      if (seriesData.length > 0) {
        for await (let series of seriesData) {
          let obj = {};
          obj.id = series._id;
          obj.name = series.name;
          obj.status = 1;
          obj.startdate = moment(series.start_date).format('DD MMM YYYY');
          obj.starttime = moment(series.start_date).format('h:mm a');
          obj.enddate = moment(series.end_date).format('DD MMM YYYY');
          obj.endtime = moment(series.end_date).format('h:mm a');
          obj.startdatetime = moment(series.start_date).format('YYYY-MM-DD h:mm:ss');
          obj.enddatetime = moment(series.end_date).format('YYYY-MM-DD h:mm:ss');
          obj.has_leaderboard = series.has_leaderboard;
          const seriesPriceCardData = await seriesPriceCardModel.find({ seriesId: mongoose.Types.ObjectId(series._id) });
          let seriesPiceCard = [];
          if (seriesPriceCardData.length > 0) {
            let winners = 0;
            for await (let prc of seriesPriceCardData) {
              let prcObj = {}
              if (prc.price == 0) {
                let totalPirce = prc.total / prc.winners;
                prcObj.price = totalPirce;
                prcObj.price_percent = `${prc.price_percent}%`
              } else {
                prcObj.price = prc.price;
              }
              prcObj.winners = prc.winners;
              winners += Number(prc.winners);
              console.log("--Number(prc.min_position+1) != (prc.max_position)--", Number(prc.min_position + 1) != (prc.max_position))
              if (Number(prc.min_position + 1) != (prc.max_position)) {
                prcObj.start_position = `${prc.min_position + 1}-${prc.max_position}`;
              } else {
                prcObj.start_position = `${prc.max_position}`;
              }
              prcObj.totalwinners = winners;
              seriesPiceCard.push(prcObj);
            }
          }
          obj.price_card = seriesPiceCard;
          mySeries.push(obj);
        }
        return {
          status: true,
          message: 'Series Data...!',
          data: mySeries
        }

      } else {
        return {
          sttaus: true,
          message: 'No Series Found...!',
          data: []
        }
      }

    } catch (error) {
    }
  }
  async getleaderboard(req) {
    try {

      let mypip = [];
      if (req.params.series_id) {
        mypip.push({
          $match: {
            series: mongoose.Types.ObjectId(req.params.series_id),
          },
        })
      }
      mypip.push({
        $match: {
          launch_status: "launched",
          final_status: { $ne: 'IsAbandoned' },
          final_status: { $ne: 'IsCanceled' },
          //status: { $ne: "notstarted" },
        },
      })
      mypip.push({
        $lookup: {
          from: "jointeams",
          localField: "_id",
          foreignField: "matchkey",
          as: "joinTeamData"
        },
      })
      mypip.push({
        $unwind: {
          path: "$joinTeamData"
        },
      })
      mypip.push({
        $lookup: {
          from: "joinedleauges",
          localField: "joinTeamData._id",
          foreignField: "teamid",
          as: "joinedleaugesData"
        },
      })
      mypip.push({
        $unwind: {
          path: "$joinedleaugesData",
        },
      })
      mypip.push({
        $lookup: {
          from: "users",
          localField: "joinTeamData.userid",
          foreignField: "_id",
          as: "userData"
        },
      })
      mypip.push({
        $unwind: {
          path: "$userData",
        },
      })
      mypip.push({
        $lookup: {
          from: "matchchallenges",
          localField: "joinedleaugesData.challengeid",
          foreignField: "_id",
          as: "result"
        },
      })
      mypip.push({
        $lookup: {
          from: "contestcategories",
          localField: "result.contest_cat",
          foreignField: "_id",
          as: "catData"
        },
      })
      mypip.push({
        $unwind: {
          path: "$catData",
        },
      })
      mypip.push({
        $addFields: {
          "has_leader_cat": "$catData.has_leaderBoard"
        },
      })
      mypip.push({
        $match: {
          "has_leader_cat": 'yes'
        },
      })
      mypip.push({
        $group: {
          _id: {
            'userid': "$joinedleaugesData.userid",
            'matchkey': "$_id",
          },
          allTeams: {
            $push: "$$ROOT"
          }
        },
      })
      mypip.push({
        $addFields: {
          maxScore: {
            $max: {
              $map: {
                input: "$allTeams.joinTeamData.points",
                in: { $max: "$$this" }
              }
            }
          }
        },
      })
      mypip.push({
        $project: {
          "allTeams": {
            $filter: {
              input: "$allTeams",
              as: "mtdata",
              cond: { $eq: ["$$mtdata.joinTeamData.points", "$maxScore"] }
            }
          },
          maxScore: "$maxScore"
        }
      })
      mypip.push({
        $group: {
          _id: "$_id.userid",
          sumTotal: {
            $sum: "$maxScore"
          },
          userTeam: { $first: "$allTeams.userData.team" },
          matchkey: { $first: "$allTeams._id" },
          matchName: { $first: "$allTeams.name" },
          image: { $first: "$allTeams.userData.image" },
          series: { $first: "$allTeams.series" }
        },
      })
      mypip.push({
        $sort: {
          sumTotal: -1
        },
      })


      const data = await listmatchModel.aggregate(mypip);
      //console.log("data",data)
      let myArray = [];
      let Rank = 1;
      for await (let key of data) {
        let Obj = {};
        Obj.rank = Rank;
        Obj.totalpoints = key.sumTotal;
        Obj.teamName = key.userTeam[0];
        if (key._id == req.user._id) {
          Obj.user_id = key._id;
          Obj.status = true;

        }
        else {
          Obj.user_id = key._id;
          Obj.status = false;


        }
        Obj.series_id = key.series[0];
        if (key.image == '' || !key.image) {
          Obj.image = `${constant.BASE_URL}team_image.png`
        } else {
          Obj.image = key.image[0]
        }
        myArray.push(Obj);
        Rank++;
      }

      let newone = myArray.findIndex(x => (x.user_id).toString() === req.user._id);
      console.log("---newone---", newone)
      if (newone > -1) {
        let element = myArray[newone];
        myArray.splice(newone, 1);
        myArray.splice(0, 0, element);
      }
      return {
        status: true,
        message: "leader board data ",
        data: myArray,
        //mypip

      }

    } catch (error) {
    }
  }
  // async viewTransactions(req){
  //   try{

  //       //-----note--->>--mytransection api used--

  //     // let arr_cr = [
  //     //   "Bank verification bank bonus",
  //     //   "Email bonus",
  //     //   "Mobile bonus",
  //     //   "Cash added",
  //     //   "Refund amount",
  //     //   "Challenge Winning Amount",
  //     //   "Refund",
  //     //   "Pan verification pan bonus",
  //     //   "special  ",
  //     //   "Youtuber Bonus",
  //     //   "Referred Signup bonus",
  //     //   "Winning Adjustment",
  //     //   "Add Fund Adjustments",
  //     //   "Bonus Adjustments",
  //     //   "Refer Bonus",
  //     //   "withdraw cancel",
  //     //   "Amount Withdraw Failed",
  //     // ];
  //     // let arr_db = ["Amount Withdraw", "Contest Joining Fee"];
  //     // let arrayofTr=[];
  //     // let findlastow=await TransactionModel.find({userid:req.user._id},sort({updatedAt:-1}));
  //     // if(findlastow){
  //     //   let count=1;
  //     //   for await(let index of findlastow){
  //     //     arrayofTr.push({
  //     //       status : 1,
  //     //       success : true,

  //     //       type: arr_cr.includes(index.type) ? "Credit" : "Debit",
  //     //     })

  //     //   }
  //     // }

  //   }catch(error){}
  // }
  // async getLeaderBoardbyCat(req) {
  //   try {
  //     let mypip = [];
  //     mypip.push({
  //       $match: {
  //         series: mongoose.Types.ObjectId(req.params.series_id),
  //         launch_status: "launched",
  //         final_status: { $ne: 'IsAbandoned' },
  //         final_status: { $ne: 'IsCanceled' },
  //         //status: { $ne: "notstarted" },
  //       },
  //     })
  //     mypip.push({
  //       $lookup: {
  //         from: "jointeams",
  //         localField: "_id",
  //         foreignField: "matchkey",
  //         as: "joinTeamData"
  //       },
  //     })
  //     mypip.push({
  //       $unwind: {
  //         path: "$joinTeamData"
  //       },
  //     })
  //     mypip.push({
  //       $lookup: {
  //         from: "joinedleauges",
  //         localField: "joinTeamData._id",
  //         foreignField: "teamid",
  //         as: "joinedleaugesData"
  //       },
  //     })
  //     mypip.push({
  //       $unwind: {
  //         path: "$joinedleaugesData",
  //       },
  //     })
  //     mypip.push({
  //       $lookup: {
  //         from: "users",
  //         localField: "joinTeamData.userid",
  //         foreignField: "_id",
  //         as: "userData"
  //       },
  //     })
  //     mypip.push({
  //       $unwind: {
  //         path: "$userData",
  //       },
  //     })
  //     mypip.push({
  //       $addFields: {
  //         userid: "$userData._id"
  //       },
  //     })
  //     mypip.push({
  //       $match: {
  //         userid: mongoose.Types.ObjectId(req.query.userid)
  //       },
  //     })
  //     mypip.push({
  //       $lookup: {
  //         from: "matchchallenges",
  //         localField: "joinedleaugesData.challengeid",
  //         foreignField: "_id",
  //         as: "result"
  //       },
  //     })
  //     mypip.push({
  //       $lookup: {
  //         from: "contestcategories",
  //         localField: "result.contest_cat",
  //         foreignField: "_id",
  //         as: "catData"
  //       },
  //     })
  //     mypip.push({
  //       $unwind: {
  //         path: "$catData",
  //       },
  //     })
  //     mypip.push({
  //       $addFields: {
  //         "has_leader_cat": "$catData.has_leaderBoard"
  //       },
  //     })
  //     mypip.push({
  //       $match: {
  //         "has_leader_cat": 'yes'
  //       },
  //     })
  //     mypip.push({
  //       $group: {
  //         _id: {
  //           'userid': "$joinedleaugesData.userid",
  //           'matchkey': "$_id",
  //         },
  //         allTeams: {
  //           $push: "$$ROOT"
  //         }
  //       },
  //     })
  //     mypip.push({
  //       $addFields: {
  //         maxScore: {
  //           $max: {
  //             $map: {
  //               input: "$allTeams.joinTeamData.points",
  //               in: { $max: "$$this" }
  //             }
  //           }
  //         }
  //       },
  //     })
  //     mypip.push({
  //       $project: {
  //         "allTeams": {
  //           $filter: {
  //             input: "$allTeams",
  //             as: "mtdata",
  //             cond: { $eq: ["$$mtdata.joinTeamData.points", "$maxScore"] }
  //           }
  //         },
  //         maxScore: "$maxScore"
  //       }
  //     })
  //     mypip.push({
  //       $group: {
  //         _id: { userid: "$_id.userid", matchkey: "$allTeams._id" },
  //         maxScore: { $first: "$maxScore" },
  //         userTeam: { $first: "$allTeams.userData.team" },
  //         matchkey: { $first: "$allTeams._id" },
  //         matchName: { $first: "$allTeams.name" },
  //         image: { $first: "$allTeams.userData.image" },
  //         series: { $first: "$allTeams.series" }
  //       },
  //     })
  //     mypip.push({
  //       $sort: {
  //         maxScore: -1
  //       },
  //     })


  //     const data = await listmatchModel.aggregate(mypip);
  //     let myArray = [];
  //     let Rank = 1;
  //     console.log("---data.length---", data.length)
  //     for await (let key of data) {
  //       let Obj = {};
  //       Obj.rank = Rank;
  //       Obj.points = key.maxScore;
  //       Obj.teamName = key.userTeam[0];
  //       if(key._id.userid==req.user._id)
  //       {
  //       Obj.user_id = key._id.userid;
  //       Obj.status=true;
  //     }else
  //     {
  //       Obj.user_id = key._id.userid;
  //       Obj.status=false;
  //     }
  //       Obj.series_id = req.params.series_id || 0;
  //       Obj.matchkey = key.matchkey[0];
  //       Obj.matchName = key.matchName[0];
  //       Obj.series_id = key.series[0];
  //       myArray.push(Obj);
  //       Rank++;
  //     }
  //     return {
  //       status: true,
  //       message: "leader board data ",
  //       data: myArray,

  //     }



  //   } catch (error) {
  //   }

  // }
  async addcash1(req) {
    try {
      if (req.query.txnid) {
        const updatePaymentStatus = await PaymentProcessModel.findOne({ txnid: req.query.txnid });
        if (updatePaymentStatus) {
          const userData = await userModel.findOne({ _id: req.user._id });
          if (userData) {
            let totalCash = 0;
            if (userData.userbalance) {
              totalCash = Number(userData.userbalance.balance) + Number(userData.userbalance.winning) + Number(userData.userbalance.bonus);
            }
            return {
              status: true,
              message: "payment Done",
              total_amount: totalCash
            }
          }
          return {
            status: false,
            message: "User Not Found",
            total_amount: ''
          }
        } else {
          return {
            status: false,
            message: "payment failed",
            total_amount: ''
          }
        }
      } else {
        return {
          status: false,
          message: "payment failed",
          total_amount: ''
        }
      }




    } catch (error) {
      throw error;
    }
  }


}
module.exports = new UserServices();