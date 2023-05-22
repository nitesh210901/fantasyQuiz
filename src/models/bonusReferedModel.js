const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let bonusReferedModel = new Schema({
    userid:{
        type:mongoose.Types.ObjectId
    },
    fromid:{
        type:mongoose.Types.ObjectId
    },
    amount:{
        type:Number,
        default:0
    },
    type:{
        type:String,
        default:''
    },
    txnid:{
        type:String,
        default:''
    }

}, {
    timestamps: true,
    versionKey: false
});
module.exports = mongoose.model('bonusrefered', bonusReferedModel);