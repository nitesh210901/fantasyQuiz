const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let myPortFolioSchema = new Schema({
    stockId: {
        type:mongoose.Types.ObjectId
    },
    portfolioCat:{
        type:String
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId
    }
});

module.exports = mongoose.model('mystockportfolio', myPortFolioSchema);

