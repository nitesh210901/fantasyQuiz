const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let stockContestCategorySchema = new Schema({
    name: {
        type: String,
        default: ''
    },
    order: {
        type: String,
        default: ''
    }
}, {
    timestamps: true,
    versionKey: false
})
module.exports = mongoose.model('stockcontestcategory', stockContestCategorySchema,"stockcontestcategory");