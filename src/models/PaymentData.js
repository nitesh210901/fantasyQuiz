const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let PaymentProcess = new Schema({
    data: {
        type: String,
        
    },
    
    
}, {
    timestamps: true,
    versionKey: false
})
module.exports = mongoose.model('PaymentData', PaymentProcess);