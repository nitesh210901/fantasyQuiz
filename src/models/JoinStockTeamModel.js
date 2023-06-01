const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let JoinStockTeamSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        index: true
    },
    // type: {
    //     type: String,
    //     default: "cricket"
    // },
    type: {
        type: String,
        default: "stock"
      },
    matchkey: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'listMatches',
        index: true
    },
    teamnumber: {
        type: Number,
        default: 0
    },
    stock: [{
        catId: {
            type: mongoose.Types.ObjectId
        },
        stockId: {
            type: mongoose.Types.ObjectId
        },
        percentage: {
            type: Number,
            default:0
        }
    }],
    // players: {
    //     type: [
    //         {
    //             type: mongoose.Schema.Types.ObjectId,
    //             ref: 'matchplayer'
    //         }
    //     ],
    //     default: []
    // },
    // playersArray: {
    //     type: String
    // },
    // captain: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'matchplayer'
    // },
    // vicecaptain: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'matchplayer'
    // },
    points: {
        type: Number,
        default: 0.0
    },
    lastpoints: {
        type: Number,
        default: 0.0
    },
    // player_type: {
    //     type: String,
    //     default: 'classic'
    // },
    is_deleted: {
        type: Boolean,
        default: false
    },
    user_type: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    versionKey: false
})
module.exports = mongoose.model('joinstockteam', JoinStockTeamSchema);