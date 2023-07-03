const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const constant = require('../config/const_credential');

let Transaction = new Schema({
    userid: {
        type: mongoose.Types.ObjectId,
        ref: 'user'
    },
    type: {
        type: String,
        default: ''
    },
    transaction_id: {
        type: String
    },
    transaction_by: {
        type: String,
        default: constant.APP_SHORT_NAME
    },
    amount: {
        type: Number,
        default: 0
    },
    prize:{
        type: String,
        default: ""
    },
    paymentstatus: {
        type: String,
        default: 'confirmed'
    },
    contestdetail: {
        type: String,
        default: '0'
    },
    challengeid: {
        type: mongoose.Types.ObjectId,
        ref: 'matchchallenge', //MatchChallenge,
        index:true
    },
    stockContestId: {
        type: mongoose.Types.ObjectId,
        ref: 'stock_contest', //MatchChallenge,
        index:true
    },
    quizId: {
        type: mongoose.Types.ObjectId,
        ref: 'quiz', //quiz,
        index:true
    },
    stockquizId: {
        type: mongoose.Types.ObjectId,
        ref: 'stockquiz', //quiz,
        index:true
    },
    seriesid: {
        type: mongoose.Types.ObjectId,
        ref: 'series' //Series
    },
    joinid: {
        type: mongoose.Types.ObjectId,
        ref: 'joinedleauge', //Joinedleauge,
        index:true
    },
    bonus_amt: {
        type: Number,
        default: 0
    },
    win_amt: {
        type: Number,
        default: 0
    },
    addfund_amt: {
        type: Number,
        default: 0
    },
    bal_bonus_amt: {
        type: Number,
        default: 0
    },
    bal_win_amt: {
        type: Number,
        default: 0
    },
    bal_fund_amt: {
        type: Number,
        default: 0
    },
    total_available_amt: {
        type: Number,
        default: 0
    },
    challenge_join_amt: {
        type: Number,
        default: 0
    },
    withdraw_amt: {
        type: Number,
        default: 0
    },
    cons_bonus: {
        type: Number,
        default: 0
    },
    cons_win: {
        type: Number,
        default: 0
    },
    cons_amount: {
        type: Number,
        default: 0
    },
    is_deleted: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true,
    versionKey: false
})
module.exports = mongoose.model('transaction', Transaction);