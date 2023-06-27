const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let finalQuizResultSchema = new Schema({
    matchkey: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'match',
        index:true
    },
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'quizzes',
        index:true
    },
    joinedid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'joinleague'
    },
    seriesid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'series'
    },
    transaction_id: {
        type: String
    },
    amount: {
        type: Number
    },
    status: {
        type: Number,
        default: 1
    },
}, {
    timestamps: true,
    versionKey: false
})
module.exports = mongoose.model('finalquizresult', finalQuizResultSchema);