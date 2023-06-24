const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let JoinStockTeamSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        index: true
    },
    type: {
        type: String,
        default: "stock"
      },
      contestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'stock_contest',
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
        },
        instrument_token:{
            type:String
        }
    }],
   
    points: {
        type: Number,
        default: 0.0
    },
    lastpoints: {
        type: Number,
        default: 0.0
    },
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