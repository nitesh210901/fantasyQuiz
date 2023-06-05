const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let stockContestCategorySchema = new Schema({
    name: {
        type: String,
        default: ''
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true,
    versionKey: false
})
module.exports = mongoose.model('stockcontestcategory', stockContestCategorySchema);