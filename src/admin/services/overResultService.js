const moment = require('moment');
const axios = require("axios")
const listMatches = require('../../models/listMatchesModel');
const teamModel = require('../../models/teamModel');
const quizmatches = require('../../models/quizmatches');
const quizpoints = require('../../models/quizpoints');
const JoinTeamModel = require('../../models/JoinTeamModel');
const overfanatsycontroller = require('../controller/cricketApiController');
const mongoose = require('mongoose');
const randomstring = require("randomstring");
const profitLossModel = require("../../models/profitLoss");
const constant = require('../../config/const_credential');
const randomizePlayerSelectionClassic = require("../services/randomizePlayerSelectionClassic");
const seriesModel = require("../../models/addSeriesModel");
const matchPlayers = require('../../models/matchPlayersModel');
const resultMatch = require('../../models/resultMatchModel')
const resultPoint = require('../../models/resultPointModel')
const matchChallenge = require('../../models/matchChallengersModel')
const joinTeam = require('../../models/JoinTeamModel')
const joinLeague = require('../../models/JoinLeaugeModel')
const JoinLeaugeModel = require('../../models/JoinLeaugeModel')
const matchRuns = require('../../models/matchRunModel')
const refundMatch = require('../../models/refundModel')
const entityApiController = require('../controller/entityApiController');
const series_leaderboardModel = require("../../models/seriesLeaderBoardModel")
const matchServices = require('./matchServices');
const TransactionModel = require('../../models/transactionModel');
const userModel = require('../../models/userModel');
const finalResultModel = require('../../models/finalResultModel');
const tdsDetailModel = require('../../models/tdsDetailModel');
const fs = require('fs');
const listMatchesModel = require('../../models/listMatchesModel');
const refundMatchModel = require("../../models/refundModel")
// ------------
const LevelServices = require("../services/LevelServices");
const matchChallengersModel = require('../../models/matchChallengersModel');
const chalengeServices = require("../services/challengersService")

//const seriesModel = require("../../models/addSeriesModel");
const playersModel = require("../../models/playerModel");


class overResultServices {
    constructor() {
        return {
            overupdateResultMatches: this.overupdateResultMatches.bind(this),
            overInformations: this.overInformations.bind(this),
            getScoresUpdates: this.getScoresUpdates.bind(this),
            updatePointInOverPoint: this.updatePointInOverPoint.bind(this)
        }
    }
    // getscoreupdate
    async getScoresUpdates(real_matchkey, matchkey) {
        try {
            // console.log("------/////////////---------------getScoresUpdates----------------//////////-----")
            let m_status = {
                1: constant.MATCHES_STATUS.NOT_STARTED,
                2: constant.MATCHES_STATUS.COMPLETED,
                3: constant.MATCHES_STATUS.STARTED,
                4: constant.MATCHES_STATUS.COMPLETED
            };
            const checkmatch = await listMatches.findOne({ _id: matchkey });
            if (checkmatch) {
                let teamainnKey = [];
                let teambinnKey = [];
                const giveresresult1 = await entityApiController.getMatchScore(real_matchkey);
                // const giveresresult1 = fs.readFileSync('scorecard.json', 'utf8');
                //console.log("giveresresult1"+giveresresult1)
                if (giveresresult1) {
                    const giveresresultNew = JSON.parse(giveresresult1.matchdata);  //with entity url remove this line
                    // return giveresresultNew;
                    let giveresresult = giveresresultNew.response;
                    if (giveresresult) {
                        let matchdata = {};
                        const getMatchRuns = await matchRuns.findOne({ matchkey: mongoose.Types.ObjectId(matchkey) });
                        if (getMatchRuns) {
                            matchdata.matchkey = matchkey;
                            matchdata.teams1 = giveresresult.teama.short_name;
                            matchdata.teams2 = giveresresult.teamb.short_name;
                            matchdata.winning_status = (giveresresult.result) ? giveresresult.result : 0;

                            if (giveresresult.innings) {

                                if (giveresresult.innings.length > 2) {
                                    for (let value of giveresresult.innings) {
                                        if (value.batting_team_id == giveresresult.teama.team_id) { //console.log("b1 value")
                                            teamainnKey.push(value);
                                        } else if (value.batting_team_id == giveresresult.teamb.team_id) { //console.log("b1 else")
                                            teambinnKey.push(value);
                                        }
                                    }
                                } else {

                                    let key1 = giveresresult.innings.findIndex(element => element.batting_team_id == giveresresult.teama.team_id);
                                    let key2 = giveresresult.innings.findIndex(element => element.batting_team_id == giveresresult.teamb.team_id);

                                    if (key1 >= 0) {
                                        teamainnKey.push(giveresresult.innings[key1]);
                                    } else {
                                        teamainnKey.push([]);
                                    }
                                    if (key2 >= 0) {
                                        teambinnKey.push(giveresresult.innings[key2]);
                                    } else {
                                        teambinnKey.push([])
                                    }
                                }
                                let gettestscore1 = 0;
                                let gettestscore2 = 0;
                                let gettestwicket1 = 0;
                                let gettestwicket2 = 0;
                                let gettestover1 = 0;
                                let gettestover2 = 0;
                                if (teambinnKey[1] && teambinnKey[1]) {
                                    gettestscore2 = (teambinnKey[1]) ? teambinnKey[1].equations.runs : 0;
                                    gettestscore1 = (teamainnKey[1]) ? teamainnKey[1].equations.runs : 0;
                                    gettestwicket1 = (teamainnKey[1]) ? teamainnKey[1].equations.wickets : 0;
                                    gettestwicket2 = (teambinnKey[1]) ? teambinnKey[1].equations.wickets : 0;
                                    gettestover1 = (teamainnKey[1]) ? teamainnKey[1].equations.overs : 0;
                                    gettestover2 = (teambinnKey[1]) ? teambinnKey[1].equations.overs : 0;
                                }
                                if (!gettestwicket1) {
                                    matchdata.wickets1 = (teamainnKey[0].length != 0 && teamainnKey[0]) ? teamainnKey[0].equations.wickets : 0;
                                } else {
                                    matchdata.wickets1 = ((teamainnKey[0].length != 0 && teamainnKey[0]) ? teamainnKey[0].equations.wickets : 0) + ',' + gettestwicket1;
                                }
                                if (!gettestwicket2) {
                                    matchdata.wickets2 = (teambinnKey[0].length != 0 && teambinnKey[0]) ? teambinnKey[0].equations.wickets : 0;
                                } else {
                                    matchdata.wickets2 = ((teambinnKey[0].length != 0 && teambinnKey[0]) ? teambinnKey[0].equations.wickets : 0) + ',' + gettestwicket2;
                                }
                                if (!gettestover1) {
                                    matchdata.overs1 = (teamainnKey[0].length != 0 && teamainnKey[0]) ? teamainnKey[0].equations.overs : 0;
                                } else {
                                    matchdata.overs1 = ((teamainnKey[0].length != 0 && teamainnKey[0]) ? teamainnKey[0].equations.overs : 0) + ',' + gettestover1;
                                }
                                if (!gettestover2) {
                                    matchdata.overs2 = (teambinnKey[0].length != 0 && teambinnKey[0]) ? teambinnKey[0].equations.overs : 0;
                                } else {
                                    matchdata.overs2 = ((teambinnKey[0].length != 0 && teambinnKey[0]) ? teambinnKey[0].equations.overs : 0) + ',' + gettestover2;
                                }
                                if (!gettestscore1) {
                                    matchdata.runs1 = (teamainnKey[0].length != 0 && teamainnKey[0]) ? teamainnKey[0].equations.runs : 0;
                                } else {
                                    matchdata.runs1 = ((teamainnKey[0].length != 0 && teamainnKey[0]) ? teamainnKey[0].equations.runs : 0) + ',' + gettestscore1;
                                }
                                if (!gettestscore2) {
                                    matchdata.runs2 = (teambinnKey[0].length != 0 && teambinnKey[0]) ? teambinnKey[0].equations.runs : 0;
                                } else {
                                    matchdata.runs2 = ((teambinnKey[0].length != 0 && teambinnKey[0]) ? teambinnKey[0].equations.runs : 0) + ',' + gettestscore2;
                                }
                            } else {
                                matchdata.winning_status = 0;
                                matchdata.wickets1 = 0;
                                matchdata.wickets2 = 0;
                                matchdata.overs1 = 0;
                                matchdata.overs2 = 0;
                                matchdata.runs1 = 0;
                                matchdata.runs2 = 0;
                            }

                            await matchRuns.updateOne({ '_id': mongoose.Types.ObjectId(getMatchRuns._id) }, {
                                $set: matchdata
                            });
                        } else {
                            matchdata.matchkey = matchkey;
                            matchdata.teams1 = giveresresult.teama?.short_name;
                            matchdata.teams2 = giveresresult.teamb?.short_name;
                            matchdata.winning_status = (giveresresult.result) ? giveresresult.result : 0;
                            if (giveresresult.innings) {
                                if (giveresresult.innings.length > 2) {
                                    for (let [i, value] of giveresresult.innings) {
                                        if (value.batting_team_id == giveresresult.teama.team_id) {
                                            teamainnKey.push(giveresresult.innings[i]);
                                        } else if (value.batting_team_id == giveresresult.teamb.team_id) {
                                            teambinnKey.push(giveresresult.innings[i]);
                                        }
                                    }
                                } else {
                                    let key1 = giveresresult.innings.findIndex(element => element.batting_team_id == giveresresult.teama.team_id);
                                    let key2 = giveresresult.innings.findIndex(element => element.batting_team_id == giveresresult.teamb.team_id);
                                    if (key1 >= 0) {
                                        teamainnKey.push(giveresresult.innings[key1]);
                                    } else {
                                        teamainnKey.push([]);
                                    }
                                    if (key2 >= 0) {
                                        teambinnKey.push(giveresresult.innings[key2]);
                                    } else {
                                        teambinnKey.push([]);
                                    }
                                }
                                let gettestscore1 = 0;
                                let gettestscore2 = 0;
                                let gettestwicket1 = 0;
                                let gettestwicket2 = 0;
                                let gettestover1 = 0;
                                let gettestover2 = 0;
                                if (teambinnKey[1] && teambinnKey[1]) {
                                    gettestscore2 = (teambinnKey[1]) ? teambinnKey[1].equations.runs : 0;
                                    gettestscore1 = (teamainnKey[1]) ? teamainnKey[1].equations.runs : 0;
                                    gettestwicket1 = (teamainnKey[1]) ? teamainnKey[1].equations.wickets : 0;
                                    gettestwicket2 = (teambinnKey[1]) ? teambinnKey[1].equations.wickets : 0;
                                    gettestover1 = (teamainnKey[1]) ? teamainnKey[1].equations.overs : 0;
                                    gettestover2 = (teambinnKey[1]) ? teambinnKey[1].equations.overs : 0;
                                }
                                if (!gettestwicket1) {
                                    matchdata.wickets1 = (teamainnKey[0].length != 0 && teamainnKey[0]) ? teamainnKey[0].equations.wickets : 0;
                                } else {
                                    matchdata.wickets1 = ((teamainnKey[0].length != 0 && teamainnKey[0]) ? teamainnKey[0].equations.wickets : 0) + ',' + gettestwicket1;
                                }
                                if (!gettestwicket2) {
                                    matchdata.wickets2 = (teambinnKey[0].length != 0 && teambinnKey[0]) ? teambinnKey[0].equations.wickets : 0;
                                } else {
                                    matchdata.wickets2 = ((teambinnKey[0].length != 0 && teambinnKey[0]) ? teambinnKey[0].equations.wickets : 0) + ',' + gettestwicket2;
                                }
                                if (!gettestover1) {
                                    matchdata.overs1 = (teamainnKey[0].length != 0 && teamainnKey[0]) ? teamainnKey[0].equations.overs : 0;
                                } else {
                                    matchdata.overs1 = ((teamainnKey[0].length != 0 && teamainnKey[0]) ? teamainnKey[0].equations.overs : 0) + ',' + gettestover1;
                                }
                                if (!gettestover2) {
                                    matchdata.overs2 = (teambinnKey[0].length != 0 && teambinnKey[0]) ? teambinnKey[0].equations.overs : 0;
                                } else {
                                    matchdata.overs2 = ((teambinnKey[0].length != 0 && teambinnKey[0]) ? teambinnKey[0].equations.overs : 0) + ',' + gettestover2;
                                }
                                if (!gettestscore1) {
                                    matchdata.runs1 = (teamainnKey[0].length != 0 && teamainnKey[0]) ? teamainnKey[0].equations.runs : 0;
                                } else {
                                    matchdata.runs1 = ((teamainnKey[0].length != 0 && teamainnKey[0]) ? teamainnKey[0].equations.runs : 0) + ',' + gettestscore1;
                                }
                                if (!gettestscore2) {
                                    matchdata.runs2 = (teambinnKey[0].length != 0 && teambinnKey[0]) ? teambinnKey[0].equations.runs : 0;
                                } else {
                                    matchdata.runs2 = ((teambinnKey[0].length != 0 && teambinnKey[0]) ? teambinnKey[0].equations.runs : 0) + ',' + gettestscore2;
                                }
                            } else {
                                matchdata.winning_status = 0;
                                matchdata.wickets1 = 0;
                                matchdata.wickets2 = 0;
                                matchdata.overs1 = 0;
                                matchdata.overs2 = 0;
                                matchdata.runs1 = 0;
                                matchdata.runs2 = 0;
                            }
                            await matchRuns.create(matchdata);
                        }
                        let matchStatus = {};
                        let mainArrayGet = giveresresult;
                        //console.log("mainArrayGetasdf"+mainArrayGet.length+"mainArrayGet"+JSON.stringify(mainArrayGet))
                        matchStatus.status = m_status[mainArrayGet.status];
                        if (matchStatus.status == constant.MATCHES_STATUS.COMPLETED && checkmatch.final_status == constant.MATCH_FINAL_STATUS.PENDING) { //console.log("b1 matchStatus")
                            matchStatus.final_status = constant.MATCH_FINAL_STATUS.IS_REVIEWED
                        }
                        await listMatches.updateOne({ '_id': mongoose.Types.ObjectId(checkmatch._id) }, {
                            $set: matchStatus
                        });

                    }
                }
            }
        } catch (error) {
            console.log("error" + error)
        }
    }

    //getscoreupdate end
    //sahil over fantasy
    async overupdateResultMatches(req) {
        try {
            //console.log('----------------------result service')
            const currentDate = moment().subtract(2, 'days').format('YYYY-MM-DD 00:00:00');
            const listmatches = await listMatches.find({
                fantasy_type: "overfantasy",
                start_date: { $gte: currentDate },
                launch_status: 'launched',
                final_status: { $ne: 'winnerdeclared' },
                // _id:"640ff64f329d101a5a514df4"
                status: { $ne: 'completed' },
            })
            let myarray = [];
            // console.log("listmatches",listmatches)
           
            if (listmatches.length > 0) {//console.log("hii")
                for (let index of listmatches) {
                    let matchTimings = index.start_date;
                    const currentDate1 = moment().format('YYYY-MM-DD HH:mm:ss');
                    if (currentDate1 >= matchTimings) {
                        let getData= await this.overInformations(index)
                        if(getData){
                            await this.updatePointInOverPoint(index._id);
                            await this.updateJoinTeams(index._id);
                        }
                        await this.getScoresUpdates(index.real_matchkey, index._id)
                    }
                }
            }
            return listmatches;

        } catch (error) {
            console.log('error', error);
            throw error;
        }
    }


    async overInformations(index) {
        try {
            for (let inning of [1,2]) {
                const response = await overfanatsycontroller.overData(index.real_matchkey, inning);
                if(!response?.data){
                    return false;
                }
                if(response?.data?.response?.inning?.fielding_team_id!=undefined){
                    const team_key = response.data.response.inning.fielding_team_id
                    const teamid = (await teamModel.findOne({ team_key }))._id
                    let totalOverDetails = [];
                    let over =
                    {
                        "over": 1,
                        "fours": 0,
                        "six": 0,
                        "wickets": 0,
                        "maiden_over": 0,
                        "runs": 0,
                        "matchkey": index._id,
                        teamid
                    }
                    for (let ballData of response.data.response.commentaries) {
                        ballData.event === "wicket" && over.wickets++
                        ballData.six && over.six++
                        ballData.four && over.fours++
                        over.runs += Number(ballData.run || 0)
                        if (ballData.event === "overend") {
                            over.runs === 0 && over.maiden_over++
                            over.total_points = 0
                            totalOverDetails.push(over)
                            over = {
                                "over": Number(ballData.over) + 1,
                                "fours": 0,
                                "six": 0,
                                "wickets": 0,
                                "maiden_over": 0,
                                "runs": 0,
                                "matchkey": index._id,
                                teamid
                            }
                            }
                    }
                    // console.log('totalOverDetails',totalOverDetails);
                    // if (over.over < 21) {
                    //     over.runs === 0 && over.maiden_over++
                    //     over.total_points = 0;
                    //     totalOverDetails.push(over)
                    // }
                
                    if(totalOverDetails.length>0){
                        for(let tover of totalOverDetails){
                            // console.log('tover',tover);
                            let checkResult = await quizmatches.findOne({over:tover.over,matchkey:index._id,teamid:tover.teamid});
                            if(!checkResult){
                                await quizmatches.create(tover);
                            }else{
                                await quizmatches.updateOne(
                                    { _id: mongoose.Types.ObjectId(checkResult._id) },
                                    {
                                    $set: tover,
                                    }
                                );
                            }
                        }
                    }
                }
            }

            return true
            
        } catch (error) {
            throw error;
        }
    }

    async updatePointInOverPoint(matchkey) {
        try{
            let getResult = await quizmatches.find({matchkey:matchkey});
            if(getResult.length>0){
                for(let result of getResult){
                    let totalpoint = 0,
                    runs= 0,
                    wickets=0,
                    fours=0,
                    maiden_over=0,
                    economy_rate=0,
                    six=0;
                    if(result.runs){
                        runs= result.runs;
                    }
                    if(result.fours){
                        fours= result.fours;
                    }
                    if(result.six){
                        six= result.six*2;
                    }
                    if(result.maiden_over){
                        maiden_over= result.maiden_over * (-2);
                    }
                    if(result.wickets){
                        wickets= result.wickets * (-6);
                    }
                    if (result.wickets >= 3)
                        wickets = wickets + 3
                    if (result.runs >= 6 && result.runs <= 10)
                        economy_rate = economy_rate + 1
                    if (result.runs >= 11 && result.runs <= 15)
                        economy_rate = economy_rate + 2
                    if (result.runs >= 16)
                        economy_rate = economy_rate + 4
                        
                    totalpoint= runs+fours+six+wickets+economy_rate+maiden_over;
                    let over= {
                        "over": result.over,
                        "fours": fours,
                        "six": six,
                        "wickets": wickets,
                        "maiden_over": maiden_over,
                        "runs": runs,
                        "matchkey": result.matchkey,
                        "teamid": result.teamid,
                        "total_points":totalpoint
                    }
                    let checkResult = await quizpoints.findOne({matchkey:result.matchkey,resultmatch_id:result._id});
                    if(!checkResult){
                        over.resultmatch_id= result._id;
                        await quizpoints.create(over);
                    }else{
                        await quizpoints.updateOne(
                            { _id: mongoose.Types.ObjectId(checkResult._id) },
                            {
                                $set: over,
                            }
                        );
                    }
                    await quizmatches.updateOne(
                        { _id: mongoose.Types.ObjectId(result._id) },
                        {
                            $set: {
                                "total_points":totalpoint
                            },
                        }
                    );
                    await JoinTeamModel.updateMany(
                        { matchkey:result.matchkey },
                        { $set: { "overs.$[elem].points" : totalpoint } },
                        { arrayFilters: [ { "elem.over":  { $eq: result.over }, "elem.teamid":{ $eq:result.teamid }, "elem.MegaOver":  { $eq: false } } ] }
                    )

                    await JoinTeamModel.updateMany(
                        { matchkey:result.matchkey },
                        { $set: { "overs.$[elem].points" : totalpoint*2 } },
                        { arrayFilters: [ { "elem.over":  { $eq: result.over },"elem.MegaOver":  { $eq: true }, "elem.teamid":{ $eq:result.teamid } } ] }
                    )
                }
            }
            return true;
        }catch (error) {
            throw error;
        }
    }
    async updateJoinTeams(matchkey) {
        try{
            let agePipe= [];
            agePipe.push({
                $match:{
                    matchkey:mongoose.Types.ObjectId(matchkey)
                }
            });
            agePipe.push({
                $unwind:{
                    path: "$overs"
                }
            });

            agePipe.push({
                $group:{
                    _id: "$_id",
                    total_points:{$sum:"$overs.points"},
                    points:{$first:"$points"},
                }
            });
            let joinTeams = await JoinTeamModel.aggregate(agePipe);
            for (let joinTeam of joinTeams) {
                await JoinTeamModel.updateOne({_id:joinTeam._id},{$set:{ points: joinTeam.total_points, lastpoints:joinTeam.points}})
            }
            return true;
        }catch(error){
            throw error;
        }
    }

}

module.exports = new overResultServices();