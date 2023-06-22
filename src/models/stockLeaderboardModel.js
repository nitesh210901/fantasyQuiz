const mongoose = require('mongoose');
const Schema = mongoose.Schema;
    // --------------------------------------------------------------//
let leaderboardSchema = new Schema({
    joinId: {
        type: mongoose.Schema.Types.ObjectId,
        
    },
    challengeid: {
        type: mongoose.Schema.Types.ObjectId,
        
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        
    },
    user_team: {
        type: String,
        defalut: ''
    },
    matchkey: {
        type: mongoose.Schema.Types.ObjectId,
        
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        
    },
    points: {
        type: Number,
        default: 0
    },
    rank: {
        type: Number,
        default: 0
    },
    teamnumber:{
        type: Number,
        default: 0
    }
    
}, {
    timestamps: true,
 },
)
module.exports = mongoose.model('stockleaderboard', leaderboardSchema);