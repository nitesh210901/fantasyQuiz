const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let stockContestModel = new Schema({
    joinTeamId: { type:mongoose.Types.ObjectId},
    joinId:{ type:mongoose.Types.ObjectId},
    contestId:{ type:mongoose.Types.ObjectId},
    stockId:{ type:mongoose.Types.ObjectId},
    userId:{ type:mongoose.Types.ObjectId}
   
}, {
    timestamps: true,
    versionKey: false
})
module.exports = mongoose.model('stockleaderboard', stockContestModel);