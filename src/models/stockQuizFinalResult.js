const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let stockQuizFinalResult = new Schema({
    joinId:{ type:mongoose.Types.ObjectId},
    stockquizId:{ type:mongoose.Types.ObjectId},
    amount: {
        type: Number
    },
    userId:{ type:mongoose.Types.ObjectId},
}, {
    timestamps: true,
    versionKey: false
})
module.exports = mongoose.model('stockquizfinalresult', stockQuizFinalResult);