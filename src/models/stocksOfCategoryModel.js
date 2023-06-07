const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let stockContestCategorySchema = new Schema({
    contest_id: {
        type: mongoose.Types.ObjectId,
        default:null
    },
    category_id: {
        type: String
    },
    stocks_id: [{
        type: String
    }]
}, {
    timestamps: true,
    versionKey: false
})
module.exports = mongoose.model('categoryofstock', stockContestCategorySchema);