const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let youtuberBonus = new Schema({
    userid: {
        type:mongoose.Types.ObjectId
    },
    amount: {
        type:Number
    },
    fromid: {
        type:mongoose.Types.ObjectId
    },
    type: {
        type: String
    },
    matchkey: {
        type:mongoose.Types.ObjectId
    },
    joinid: {
        type:mongoose.Types.ObjectId
    },
    challengeid: {
        type:mongoose.Types.ObjectId
    },
    txnid:String,
    is_deleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    versionKey: false
})
module.exports = mongoose.model('youTuberBonus', youtuberBonus);