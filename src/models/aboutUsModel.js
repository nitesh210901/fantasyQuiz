const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let aboutUsSchema = new Schema({
    
    title: {
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
module.exports = mongoose.model('aboutus', aboutUsSchema);