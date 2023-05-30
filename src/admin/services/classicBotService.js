const mongoose = require('mongoose');

const listMatchesModel = require('../../models/listMatchesModel');
const joinTeamsModel = require('../../models/JoinTeamModel');
const matchPlayersModel = require('../../models/matchPlayersModel');
const JoinLeaugeModel = require('../../models/JoinLeaugeModel');
const playerModel=require("../../models/playerModel");
const leaderBoardModel = require('../../models/leaderboardModel');
class classicBotService {
    constructor() {
        return {
            autoClassicTeam: this.autoClassicTeam.bind(this),
        }
    }

    async autoClassicTeam(req) {
        try {
            const matches = await listMatchesModel.find({ status: 'started', launch_status: 'launched' });
            // const matches = await listMatchesModel.find({ _id: mongoose.Types.ObjectId('63cb41ee3ccc058a0919f339') });
            let i = 0;
            if (matches.length > 0) {
                for (let match of matches) {
                    i++;

                    let classicBotTeam = await this.classicBotTeams(match._id);
                    if (i == matches.length) {
                        return {
                            message: 'get list matches',
                            status: true,
                            data: classicBotTeam
                        }
                    }
                }
            } else {
                return {
                    message: 'no matches',
                    status: false,
                    data: {}
                }
            }
        } catch (error) {
            throw error;
        }
    }

    async generateRandomTeam(matchkey) {
        let joinTeamsPipeline = [];
        joinTeamsPipeline.push({
            $match: {
                matchkey: mongoose.Types.ObjectId(matchkey),
                user_type: 0
            }
        });
        const getJoinedTeams = await joinTeamsModel.aggregate(joinTeamsPipeline);
        // console.log('----->>------generateRandomTeam------',getJoinedTeams, matchkey,{
        //     $match: {
        //         matchkey: mongoose.Types.ObjectId(matchkey),
        //         user_type: 0
        //     }
        // })
        let random = Math.floor(Math.random() * getJoinedTeams.length);
        let randomTeam;
        if (getJoinedTeams.length > 0) {
            randomTeam = getJoinedTeams[random];
        } else {
            randomTeam = {};
        }

        if (randomTeam) {
            return randomTeam;
        }
    }

    async genrateRandomPlayer(matchkey, removePlayer, randomPlayers) {
        try{
            const matchPlayerPipeline = [];
            const pipeline= [];
            // matchPlayerPipeline.push({
            //     $match: {
            //         matchkey: mongoose.Types.ObjectId(matchkey),
            //         role: role,
            //         playingstatus:1,
            //         playerid: { $nin: randomPlayers }
            //     }
            // });
            pipeline.push({
                $match: { 
                    matchkey: mongoose.Types.ObjectId(matchkey),
                    role: removePlayer.role,
                    playingstatus:1,
                    playerid: { $nin: randomPlayers }
                }
            })

            pipeline.push({
                $lookup: {
                    from: 'players',
                    localField: 'playerid',
                    foreignField: '_id',
                    as: 'playersData'
                }
            })
            pipeline.push({
                $match: {
                    "playersData.team": mongoose.Types.ObjectId(removePlayer.playersData.team)
                }
            })
            pipeline.push({
                $unwind: { path: "$playersData" }
            })
            let matchPlayers = await matchPlayersModel.aggregate(pipeline);
            // const matchPlayers = await matchPlayersModel.aggregate(matchPlayerPipeline);

            let random = Math.floor(Math.random() * matchPlayers.length);
            let randomPlayer = matchPlayers[random];

            if (randomPlayer && randomPlayer !== {}) {
                return randomPlayer;
            } else return;
        }catch(error){

        }
    }

    async classicBotTeams(matchkey) {
    //    let mat =  {matchkey:'63cb41ee3ccc058a0919f339',user_type:1};
    //    await JoinLeaugeModel.updateMany(mat,{$set:{ teamid: null }})
    //    await joinTeamsModel.deleteMany(mat);
    //    return true;
        let joinLeaugesPipeline = [];
        joinLeaugesPipeline.push({
            $match: {
                matchkey: mongoose.Types.ObjectId(matchkey),
                // team_type: 'classic',
                teamid: null,
            }
        });
        let joinedLeauges = await JoinLeaugeModel.aggregate(joinLeaugesPipeline);
        // console.log('joinedLeauges.length ->>>>>>>>>>>>>>>>', joinedLeauges)

        if (joinedLeauges && Array.isArray(joinedLeauges) && joinedLeauges.length == 0) {
            return { message: 'no leauges!!!' }
        }

        let count = 0;
        for (let joinedLeauge of joinedLeauges) {
            count++;
            let randomTeam = await this.generateRandomTeam(matchkey);
            if (randomTeam && randomTeam !== {}) {
                let playersOfRandomTeam = randomTeam.players;
                let random = Math.floor(Math.random() * playersOfRandomTeam.length);
                let removedRandomPlayer = playersOfRandomTeam[random];
                let agePipe= [];
                agePipe.push({
                    $match: { matchkey: mongoose.Types.ObjectId(matchkey), playerid: removedRandomPlayer }
                })
                agePipe.push({
                    $lookup: {
                        from: 'players',
                        localField: 'playerid',
                        foreignField: '_id',
                        as: 'playersData'
                    }
                })
                agePipe.push({
                    $unwind: { path: "$playersData" }
                })
                let removedMatchPlayers = await matchPlayersModel.aggregate(agePipe);
                // const removedMatchPlayers = await matchPlayersModel.findOne({ matchkey: mongoose.Types.ObjectId(matchkey), playerid: removedRandomPlayer });
                // console.log("removedMatchPlayers",removedMatchPlayers);
                playersOfRandomTeam.splice(random, 1);
                let randomPlayer = await this.genrateRandomPlayer(matchkey, removedMatchPlayers[0], randomTeam.players);

                if (!randomPlayer) {
                    while (!playersOfRandomTeam.includes('')) {
                        randomPlayer = await this.genrateRandomPlayer(matchkey, removedMatchPlayers[0], randomTeam.players);
                    }
                }
                if (randomPlayer && randomPlayer !== {}) {
                    playersOfRandomTeam.push(randomPlayer.playerid);
                    // let joinTeams = await joinTeamsModel.findOne({ userid: joinedLeauge.userid, matchkey: joinedLeauge.matchkey})
                    // .sort({ teamnumber: -1 });
                    // let teamNumber = 1;
                    let newTeam = {};
                    // if (joinTeams) {
                    //     teamNumber = joinTeams.teamnumber + teamNumber
                    //     if (teamNumber < 12) {
                    //         newTeam.teamnumber = teamNumber;
                    //     } else {
                    //         newTeam.teamnumber = teamNumber;
                    //     }
                    // } else {
                    //     newTeam.teamnumber = teamNumber;
                    // }
                    if (joinedLeauge.teamnumber < 12) {
                        console.log('joinedLeauge.teamnumber',joinedLeauge.teamnumber);
                        let captain = randomTeam.captain;
                        let vicecaptain = randomTeam.vicecaptain;

                        if (randomTeam.captain.toString() == removedRandomPlayer.toString()) {
                            captain = playersOfRandomTeam[playersOfRandomTeam.length - 1]
                        }
                        if (randomTeam.vicecaptain.toString() == removedRandomPlayer.toString()) {
                            vicecaptain = playersOfRandomTeam[playersOfRandomTeam.length - 1]
                        }
                        newTeam.teamnumber = joinedLeauge.teamnumber;
                        newTeam.userid = joinedLeauge.userid;
                        newTeam.matchkey = joinedLeauge.matchkey;
                        newTeam.players = playersOfRandomTeam;
                        newTeam.static_players = playersOfRandomTeam;
                        newTeam.captain = captain;
                        newTeam.vicecaptain = vicecaptain;
                        newTeam.user_type = 1;
                        // newTeam.player_type = "classic";
                        let checkJoinTeam = await joinTeamsModel.findOne({ userid: joinedLeauge.userid, matchkey: joinedLeauge.matchkey,  teamnumber: newTeam.teamnumber });
                        if (checkJoinTeam == null) {
                            if (joinedLeauge._id) {
                                let checkStatus= true;
                                let getJoinTeams = await joinTeamsModel.find({ userid: joinedLeauge.userid, matchkey: joinedLeauge.matchkey });
                                const duplicateData = await this.checkForDuplicateTeam(getJoinTeams, newTeam.captain, newTeam.vicecaptain, newTeam.players, newTeam.teamnumber);
                                if(duplicateData){
                                    let addNewTeam = await joinTeamsModel.create(newTeam);
                                    await JoinLeaugeModel.updateOne({ _id: mongoose.Types.ObjectId(joinedLeauge._id) }, { teamid: addNewTeam._id }, { new: true });
                                    await leaderBoardModel.updateOne({ joinId: mongoose.Types.ObjectId(joinedLeauge._id) }, { teamId: addNewTeam._id }, { new: true });
                                    continue;
                                }else{
                                    continue;
                                }
                            }else{
                                continue;
                            }
                        }else{
                            if (joinedLeauge._id) {
                                await JoinLeaugeModel.updateOne({ _id: mongoose.Types.ObjectId(joinedLeauge._id) }, { teamid: checkJoinTeam._id }, { new: true });
                                await leaderBoardModel.updateOne({ joinId: mongoose.Types.ObjectId(joinedLeauge._id) }, { teamId: checkJoinTeam._id }, { new: true });
                                continue;
                            }else{
                                continue;
                            }
                        }

                    } else {
                        let getJoinTeams = await joinTeamsModel.find({ userid: joinedLeauge.userid, matchkey: joinedLeauge.matchkey,teamnumber:joinedLeauge.teamnumber });
                        if (getJoinTeams.length > 0) {
                            for (let joinTeam of getJoinTeams) {
                                let aggpipe = [];
                                aggpipe.push({
                                    $match: {
                                        matchkey: mongoose.Types.ObjectId(joinedLeauge.matchkey),
                                        challengeid: mongoose.Types.ObjectId(joinedLeauge.challengeid),
                                        teamid: mongoose.Types.ObjectId(joinTeam._id)
                                    }
                                });
                                aggpipe.push({
                                    $lookup: {
                                        from: 'matchchallenges',
                                        localField: 'challengeid',
                                        foreignField: '_id',
                                        as: 'challenge_data'
                                    }
                                });
                                aggpipe.push({
                                    $unwind: {
                                        path: '$challenge_data'
                                    }
                                });
                                aggpipe.push({
                                    $addFields: {
                                        multi_entry: '$challenge_data.multi_entry'
                                    }
                                });
                                aggpipe.push({
                                    $project: {
                                        challenge_data: 0
                                    }
                                });
                                let joinedLeaugeTeams = await JoinLeaugeModel.aggregate(aggpipe);
                                if (joinedLeaugeTeams.length == 0) {
                                    await JoinLeaugeModel.updateOne({ _id: mongoose.Types.ObjectId(joinedLeauge._id) }, { teamid: joinTeam._id }, { new: true });
                                    await leaderBoardModel.updateOne({ joinId: mongoose.Types.ObjectId(joinedLeauge._id) }, { teamid: joinTeam._id }, { new: true });
                                    continue;
                                }
                            }
                        }
                    }
                } else {
                    continue;
                }
            } else {
                console.log({ message: 'no available team found!!!' });
                continue;
            }
        }
        console.log('----- total count -->', count);
        return { message: 'leauges joined successfully!!!' };
    }
    async checkForDuplicateTeam(joinlist, captain, vicecaptain, playerArray, teamnumber) {
        if (joinlist.length == 0) return true;
        for await (const list of joinlist) {
            if (
                captain == (list.captain).toString() &&
                vicecaptain == (list.vicecaptain).toString() &&
                teamnumber != list.teamnumber
            ) {
                const playerscount = await this.findArrayIntersection(playerArray, list.players);
                if (playerscount.length == playerArray.length) return false;
            }
        }
        return true;
    }
    async findArrayIntersection(nowplayers, previousPlayers) {
        const c = [];
        let j = 0,
            i = 0;
        for (i = 0; i < nowplayers.length; ++i) {
            if (previousPlayers.indexOf(nowplayers[i]) != -1) {
                c[j++] = nowplayers[i];
            }
        }
        if (i >= nowplayers.length) {
            return c;
        }
    }
}

module.exports = new classicBotService();