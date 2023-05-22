const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let playingNotificationSchema = new Schema({
    
    matchkey: {
        type: mongoose.Schema.Types.ObjectId,
        default: 'listmatches'
        
    }

}, {
    timestamps: true,
    versionKey: false
})
module.exports = mongoose.model('playingnotification', playingNotificationSchema);