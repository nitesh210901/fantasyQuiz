const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let refundSchema = new Schema({
    matchkey: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'match',
        index:true
    },
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    amount: {
        type: Number
    },
    joinid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'joinleague'
    },
    challengeid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'matchchallenge',
        index:true
    },
    stockContestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'stock_contest',
        index:true
    },
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'quiz',
        index:true
    },
    stockquizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'stockquiz',
        index:true
    },
    reason: {
        type: String
    },
    transaction_id: {
        type: String
    }
}, {
    timestamps: true,
    versionKey: false
})
module.exports = mongoose.model('refund', refundSchema);