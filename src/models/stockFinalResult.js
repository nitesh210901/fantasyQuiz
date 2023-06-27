const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let stockFinalResult = new Schema({
    teamid: { type:mongoose.Types.ObjectId},
    joinId:{ type:mongoose.Types.ObjectId},
    contestId:{ type:mongoose.Types.ObjectId},
    stockId: { type: mongoose.Types.ObjectId },
    amount: {
        type: Number
    },
    rank: { type:String, default:0},
    userId:{ type:mongoose.Types.ObjectId},
    finalvalue:{
     type:Number,
     default:""
    }
    
}, {
    timestamps: true,
    versionKey: false
})
module.exports = mongoose.model('stockfinalresult', stockFinalResult);