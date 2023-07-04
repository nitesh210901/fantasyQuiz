const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let quizSchema = new Schema({
    question: {
        type: String,
        default:""
    },
    option_1: {
        type: String,
        default:""
    },
    option_2: {
        type: String,
        default:""
    },
    option_3: {
        type: String,
        default:""
    },
    entryfee: {
        type: Number,
        default: 0
    },
    winning_amount: {
        type: Number,
        default: 0
    },
    start_date: {
        type: String,
        default: " "
    },
    end_date: {
        type: String,
        default: " "
    },
    is_enabled: {
        type: Boolean,
        default: false
    },
    status:{
        type: String,
        default:'notstarted'
    },
    joinedusers: {
        type: Number,
        default: 0
    },
    final_status: {
        type: String,
        default: "pending"
    },
    answer: {
        type: String,
        default:"Please Give Answer"
    },
}, {
    timestamps: true,
    versionKey: false
})
module.exports = mongoose.model('stockquiz', quizSchema);