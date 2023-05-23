const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let JoinTeamSchema = new Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    matchkey: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'listMatches'
    },
    teamnumber: {
        type: Number,
        default: 0
    },
    quiz: [{
        questions: {
          type: Number,
          default:0
        },
        points: {
            type: Number,
            default:0
        },
        teamid: {
            type:mongoose.Schema.Types.ObjectId,
            
        },
        teamname: {
            type:String,
            
        },
        type: {
            type:String,
            default:0
        },
      }],
    points: {
        type: Number,
        default: 0.0
    },
    lastpoints: {
        type: Number,
        default: 0.0
    },
    player_type: {
        type: String,
        default: 'classic'
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    user_type: {
        type:Number,
        default:0
    }
}, {
    timestamps: true,
    versionKey: false
})
module.exports = mongoose.model('overjointeam', JoinTeamSchema);