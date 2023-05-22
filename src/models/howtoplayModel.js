const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let howtoplaySchema = new Schema({
    
    category: {
        type: String,
        default: ''
    },
    description: {
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
module.exports = mongoose.model('howtoplay', howtoplaySchema);