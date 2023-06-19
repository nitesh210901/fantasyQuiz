const mongoose = require('mongoose');

let listmatchSchema = new mongoose.Schema({
    fantasy_type: {
        type: String
    },
    type: {
        type: String
    },
    name: {
        type: String
    },
    notify: {
        type: String,
        default: ''
    },
    short_name: {
        type: String,
        default: ''
    },
    team1Id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'team'
    },
    team2Id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'team'
    },
    cricketid: {
        type: mongoose.Schema.Types.ObjectId,
        default:undefined
       
    },
    matchkey: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'listmatch',
        index :true
    },
    real_matchkey: {
        type: String
    },
    series: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'series'
    },
    start_date: {
        type: String
    },
    status: {
        type: String
    },
    launch_status: {
        type: String
    },
    info_center:{
        type: String,
        default:''
    },
    final_status: {
        type: String
    },
    quiz_status: {
        type: String,
        default:"pending"
    },
    playing11_status: {
        type: Number,
        default: 0
    },
    order_status: {
        type: Number,
        default: 0
    },
    status_overview: {
        type: String
    },
    squadstatus: {
        type: String,
        default: 'YES'
    },
    pdfstatus: {
        type: Number
    },
    pointsstatus: {
        type: Number
    },
    withdraw_amount: {
        type: Number
    },
    format: {
        type: String
    },
    report_status: {
        type: String
    },
    second_inning_status: {
        type: Number
    },
    isQuiz: {
        type: Number,
        default:0
    },
    tosswinner_team: {
        type: Number
    },
    toss_decision: {
        type: String
    },
    match_order:{
        type: Number,
    },
    youtuberStatus: {
        type: Boolean,
        default: false
    },
    is_deleted: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model('listMatches', listmatchSchema);