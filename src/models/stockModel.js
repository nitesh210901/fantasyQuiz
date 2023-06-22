const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const constant = require('../config/const_credential');

let stockModelSchema = new Schema({
    type:{
        type:String
    },
    instrument_token:{
        type:String
    },
    exchange_token:{
        type:String
    },
    tradingsymbol:{
        type:String
    },
    name:{
        type:String
    },
    expiry:{
        type:String
    },
    strike:{
        type:String
    },
    tick_size:{
        type:String
    },
    lot_size:{
        type:String
    },
    instrument_type:{
        type:String
    },
    segment:{
        type:String
    },
    exchange:{
        type:String
    },
    isEnable:{
        type:Boolean,
        default:false
    },openPrice:{
        type:String
    },
    closePrice:{
        type:String
    },
}, {
    timestamps: true,
    versionKey: false
})
module.exports = mongoose.model('stocks', stockModelSchema);