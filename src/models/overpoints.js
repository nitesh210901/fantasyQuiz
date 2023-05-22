const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let overmatchPointSchema = new Schema({
    matchkey: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'match',
        index:true
    },
    teamid: {
        type: mongoose.Schema.Types.ObjectId,
        index:true
    },
    over:{type:Number},
    total_points: {
        type: Number,
        default: 0
    },
    overs: [{
        over: {
          type: Number,
          default:0
        },
        MegaOver: {
            type: Number,
            default:0
        },
        inning: {
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
    
    resultmatch_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'resultmatch'
    },
    startingpoints: {
        type: Number
    },
    runs: {
        type: Number
    },
    six: {
        type: Number
    },
    fours: {
        type: Number
    },
    strike_rate: {
        type: Number
    },
    century: {
        type: Number
    },
    halfcentury: {
        type: Number
    },
    thirtypoints: {
        type: Number,
        default: '0'
    },
    wicketbonuspoint: {
        type: Number,
        default: '0'
    },
    catch: {
        type: Number
    },
    wickets: {
        type: Number
    },
    maiden_over: {
        type: Number
    },
    
    economy_rate: {
        type: Number
    },
    runouts: {
        type: Number
    },
    stumping: {
        type: Number
    },
    thrower: {
        type: Number
    },
    
    hitter: {
        type: String
    },
    
    bonus: {
        type: Number
    },
    
    negative: {
        type: Number
    },
    total: {
        type: Number
    },
    
}, {
    timestamps: true,
    versionKey: false
})
module.exports = mongoose.model('overpoint', overmatchPointSchema);