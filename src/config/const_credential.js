
const dotenv= require('dotenv');
const fs= require('fs');
const path= require('path');

const ENVIRONMENT = process.env.NODE_ENV || "prod";
let appName='';
switch (ENVIRONMENT) {
    case "staging": {
        console.log('environment : ', ENVIRONMENT);
        if (fs.existsSync(path.join(process.cwd(), "/.env.staging"))) {
            dotenv.config({ path: ".env.staging" });
        } else {
            process.exit(1);
        }
        break;
    }
    case "local": {
        console.log('environment : ', ENVIRONMENT);
        if (fs.existsSync(path.join(process.cwd(), "/.env.local"))) {
            dotenv.config({ path: ".env.local" });
        } else {
            process.exit(1);
        }
        break;
    }
    default: {
        console.log('environment : ', ENVIRONMENT);
        if (fs.existsSync(path.join(process.cwd(), "/.env"))) {
            dotenv.config({ path: ".env" });
            appName= ''
        } else {
            process.exit(1);
        }
    }
}

const credentials = {
    DB_URL: process.env.DB_URL || "mongodb://127.0.0.1:27017/",
    DB_NAME: process.env.DB_NAME || "Riskle",
    appName: appName,
    SECRET_TOKEN: process.env.SECRET_TOKEN,
    BASE_URL: process.env.BASE_URL,
    BASE_URL_LOCAL: process.env.BASE_URL_LOCAL,
    APP_SHORT_NAME: process.env.APP_SHORT_NAME,
    PORT: process.env.PORT || 7777,
    PORT_api: process.env.PORT_api || 3333,
    CRON_PORT: process.env.CRON_PORT || 3636,
    APP_NAME: process.env.APP_NAME || 'Riskle',
    APP_SHORT_NAME: process.env.APP_SHORT_NAME || 'Riskle',
    DEFAULT_IMAGE_FOR_PRODUCT: 'default_product.png',
    DEFAULT_IMAGE_FOR_TICKET: 'default_product.png',
    TEAM_LIMIT: process.env.TEAM_LIMIT,
    CASHFREE_PAYOUT_CLIENT_ID: process.env.CASHFREE_PAYOUT_CLIENT_ID,
    CASHFREE_PAYOUT_SECRETKEY: process.env.CASHFREE_PAYOUT_SECRETKEY,
    CASHFREE_SECRETKEY: process.env.CASHFREE_SECRETKEY,
    CASHFREE_CLIENT_ID: process.env.CASHFREE_CLIENT_ID,

    // test
    RAZORPAY_KEY_ID_TEST:process.env.RAZORPAY_KEY_ID_TEST,
    RAZORPAY_KEY_SECRET_TEST:process.env.RAZORPAY_KEY_SECRET_TEST,
    RAZORPAY_ACC_TEST:process.env.RAZORPAY_ACC_TEST,
    // RAZORPAY_KEY_ID:process.env.RAZORPAY_KEY_ID,
    // RAZORPAY_ACC:process.env.RAZORPAY_ACC,

    // live
    RAZORPAY_KEY_ID_LIVE:process.env.RAZORPAY_KEY_ID_LIVE,
    RAZORPAY_KEY_SECRET_LIVE:process.env.RAZORPAY_KEY_SECRET_LIVE,
    RAZORPAY_ACC_LIVE:process.env.RAZORPAY_ACC_LIVE,

    privateKey: process.env.privateKey,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    SENDGRID_EMAIL: process.env.SENDGRID_EMAIL,
    FCM_SERVER_KEY: process.env.FCM_SERVER_KEY,
    SMS_AUTH_KEY: process.env.SMS_AUTH_KEY,
    SMS_ROUTE: process.env.SMS_ROUTE,
    SMS_SENDER: process.env.SMS_SENDER,
    publicKey: process.env.publicKey,
    BONUS: {
        REFER_BONUS: 'Refer Bonus',
        PAN_BONUS: 'Pan Bonus',
        BANK_BONUS: 'Bank Bonus',
        MOBILE_BONUS: 'Mobile Bonus',
        EMAIL_BONUS: 'Email Bonus',
        SIGNUP_BONUS: 'Signup Bonus',
        SPECIAL_BONUS: 'Special Bonus',
        CASH_ADDED: 'Cash Added',
        OFFER_CASH: "Offer Cash",
    },
    BONUS_NAME: {
        referbonus: 'Refer Bonus',
        panbonus: 'Pan Bonus',
        bankbonus: 'Bank Bonus',
        mobilebonus: 'Mobile Bonus',
        emailbonus: 'Email Bonus',
        signupbonus: 'Signup Bonus',
        androidbonus: 'Application download bonus',
        withdraw: 'Amount Withdraw',
    },
    BONUS_TYPES: {
        REFER_BONUS: 'refer_bonus',
        PAN_BONUS: 'pan_bonus',
        BANK_BONUS: 'bank_bonus',
        MOBILE_BONUS: 'mobile_bonus',
        EMAIL_BONUS: 'email_bonus',
        SIGNUP_BONUS: 'signup_bonus',
    },
    PROFILE_VERIFY_BONUS_TYPES_VALUES: {
        TRUE: 1,
        FALSE: 0,
    },
    MAILGUN:{
        MAIL_DRIVER:process.env.MAIL_DRIVER,
        MAILGUN_DOMAIN : process.env.MAILGUN_DOMAIN,
        MAIL_APP_KEY : process.env.MAIL_APP_KEY,
        MAIL_FROM: process.env.MAIL_FROM2,
        MAIL_FROM_NAME:process.env.MAIL_FROM_NAME
    },
    PROFILE_VERIFY_BONUS_TYPES: {
        REFER_BONUS: 'referbonus',
        PAN_BONUS: 'panbonus',
        BANK_BONUS: 'bankbonus',
        MOBILE_BONUS: 'mobilebonus',
        EMAIL_BONUS: 'emailbonus',
        SIGNUP_BONUS: 'signupbonus',
        ANDROID_BONUS: 'androidbonus',
    },
    AMOUNT_TYPE:{
        PRIZE:"prize",
        PRICE:"price"
    },
    TRANSACTION_BY: {
        WALLET: 'wallet',
        APP_NAME: process.env.APP_NAME,
    },
    PAYMENT_STATUS_TYPES: {
        CONFIRMED: 'confirmed',
        PENDING: 'pending',
        SUCCESS: 'success',
        FAILED: 'failed',
    },
    PUSH_SENDING_TYPE: {
        SNS: 1,
        FCM: 2,
        APNS: 3,
    },
    USER_TYPE: {
        USER: 'user',
        NORMAL_USER: 'normal user',
        YOUTUBER: 'youtuber'
    },
    ADMIN: {
        SUPER_ADMIN: 0,
        SUB_ADMIN: 1,
        ADMIN: 2,
    },
    SIDE_BANNER_TYPES: {
        SIDE_TYPE: 'side',
        WEB_TYPE: 'web',
        APP_TYPE: 'app',
    },
    PROFILE_VERIFY_EMAIL_MOBILE: {
        PENDING: 0,
        VERIFY: 1,
    },
    USER_VERIFY_TYPES: {
        PAN_VERIFY: 'pan_verify',
        BANK_VERIFY: 'bank_verify',
        MOBILE_VERIFY: 'mobile_verify',
        EMAIL_VERIFY: 'email_verify',
    },
    PROFILE_VERIFY_PAN_BANK: {
        PENDING: -1,
        SUBMITED: 0,
        APPROVE: 1,
        REJECTED: 2,
    },
    PROFILE_VERIFY: {
        TRUE: 1,
        FALSE: 0,
    },
    HAS_LEADERBOARD:{
        YES:'yes',
        NO:'no'
    },
    FREEZE: {
        TRUE: 1,
        FALSE: 0,
    },
    DOWNLOAD_APK: {
        TRUE: 1,
        FALSE: 0,
    },
    SERIES_STATUS: {
        OPENED: 'opened',
        CLOSED: 'closed',
    },
    ADMIN_WALLET_TYPE: {
        ADD_FUND: "addfund",
        WINNING: "winning",
        BONUS: "bonus",
        
    },
    PLAYER_TYPE: {
        CLASSIC: 'classic',
    },
    REFER_BONUS_TO_REFER:{
        REFER_AMOUNT:100,
    },
    ROLE: {
        BOWL: 'bowler',
        BAT: 'batsman',
        ALL: 'allrounder',
        WK: 'keeper',
        WKBAT: 'keeper',
        CAP: 'allrounder',
        SQUAD: 'allrounder',
    },
    USER_STATUS: {
        ACTIVATED: 'activated',
        BLOCKED: 'blocked',
    },
    PANCARD: {
        NOTUPLOAD: -1,
        PENDING: 0,
        APPROVED: 1,
        REJECT: 2,
    },
    BANK: {
        NOTUPLOAD: -1,
        PENDING: 0,
        APPROVED: 1,
        REJECT: 2,
    },
    WITHDRAW: {
        MINIMUM_WITHDRAW_AMOUNT: 100,
        MAXIMUM_WITHDRAW_AMOUNT: 10000,
    },
    WITHDRAW_STATUS: {
        APPROVED: 'Approved',
        PENDING: 'Pending',
    },
    FANTASY_TYPE: {
        CRICKET: 'Cricket',
        FOOTBALL: 'Football',
    },
    MATCH_FINAL_STATUS: {
        WINNER_DECLARED: 'winnerdeclared',
        IS_REVIEWED: 'IsReviewed',
        IS_ABANDONED: 'IsAbandoned',
        IS_CANCELED: 'IsCanceled',
        PENDING: 'pending',
    },
    MATCH_QUIZ_STATUS: {
        WINNER_DECLARED: 'winnerdeclared',
        IS_REVIEWED: 'IsReviewed',
        IS_ABANDONED: 'IsAbandoned',
        IS_CANCELED: 'IsCanceled',
        PENDING: 'pending',
    },
    MATCH_LAUNCH_STATUS: {
        LAUNCHED: 'launched',
        PENDING: 'pending',
    },
    MATCHES_STATUS: {
        PENDING: 'pending',
        NOT_STARTED: 'notstarted',
        STARTED: 'started',
        COMPLETED: 'completed',
    },
    MATCH_CHALLENGE_BONUS_TYPE: {
        PERCENTAGE: 'Percentage',
        AMOUNT: 'Amount',
    },
    TEAM_DEFAULT_COLOR: {
        DEF1: '#F60606'
    },
    MATCH_CHALLENGE_STATUS: {
        CANCELED: 'canceled'
    },
    CONTEST_C_TYPE: {
        CLASSIC: 'classic',
        BATTING: 'batting',
        BOWLING: 'bowling',
        REVERSE: 'reverse'
    },
    ORDER_STATUS_TYPES: {
        CONFIRMED: '1',
        SUBMITED: '0',
        REJECTED: '2',
    },
    PAYMENT_TYPE: {
        ADD_CASH: 'add_cash',
        ADD_PASS: 'add_pass'
    },
   
    RAZORPAY_PAYOUT_STATUS_TOSAVE_IN_DB:{
        FAILED:9,
        TRANSECTION_CREATED:8,
        REVERSED:7,
        CANCELLED:6,
        QUEUED:5,
        PENDING:4,
        REJECTED:2,
        PROCESSING:3,
        PROCESSED:1,
    },
    RAZORPAY_PAYOUT_STATUS_TO_SHOW_IN_UI:{
        9:'failed',
        8:'transaction.created',
        7:"reversed",
        6:"cancelled",
        5:"queued",
        4:"pending",
        3:"processing",
        2:"rejected",
        1:"processed",
    },
    RAZORPAY_ADDCASH_PAYMENT:{
        PAYOUT_UPDATED:'payout.updated',
        PAYOUT_REVERSED:'payout.reversed',
        PAYMENT_AUTHORIZED:'payment.authorized',
        PAYMENT_CAPTURED:'payment.captured',
        PAYMENT_FAILED:'payment.failed',
        PAYMENT_DISPUTE_CREATED:'payment.dispute.created',
        PAYMENT_DISPUTE_WON:'payment.dispute.won',
        PAYMENT_DISPUTE_LOST:'payment.dispute.lost',
    },

    TICKET_STATUS: {
        PENDING: 'pending',
        CONFIRMED: 'confirmed',
    },
    JWT_ExpireTime: '29 days',
    // g-recaptcha
    SECRETKEY:process.env.SECRETKEY,
    SITEKEY:process.env.SITEKEY,
    RAZORPAY_TRANSACTION_WEBHOOK_EVENT:{
        TRANSACTION_CREATED:'transaction.created',
        PAYOUT_FAILED:'payout.failed',
        PAYOUT_REVERSED:'payout.reversed',
        PAYOUT_UPDATED:'payout.updated',
        PAYOUT_PROCESSED:'payout.processed',
        PAYOUT_INITIATED:'payout.initiated',
        PAYOUT_QUEUED:'payout.queued',
        PAYOUT_REJECTED:'payout.rejected',
        PAYOUT_PENDING:'payout.pending',

    }
};
// console.log(`credentials`, credentials);
module.exports = credentials;