const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let contactSchema = new Schema({
    
    email: {
        type: String,
        default: ''
    },
    phone:{
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    
    is_deleted: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true,
    versionKey: false
})
module.exports = mongoose.model('contact', contactSchema);