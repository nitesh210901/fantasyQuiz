const mongoose = require('mongoose');
const moment = require("moment");
const fs = require('fs');
const config = require("../../config/const_credential");

const matchRunModel = require('../../models/matchRunModel');
const listMatchModel = require('../../models/listMatchesModel');
const matchPlayersModel = require('../../models/matchPlayersModel');
const teamModel = require('../../models/teamModel');
const seriesModel = require("../../models/addSeriesModel");
const seriesServices = require('./seriesServices');
const playerModel = require("../../models/playerModel");
const { generateKey } = require('crypto');
const matchRuns = require('../../models/matchRunModel');
const playingNotification = require("../../models/playingNotification");
const notification = require("../../utils/notifications");
const userModel = require('../../models/userModel');
const resultMatch = require('../../models/resultMatchModel')
const resultPoint = require('../../models/resultPointModel')
class matchServices {
    constructor() {
        return {
            updateStatusforSeries: this.updateStatusforSeries.bind(this),
            addMatchPage: this.addMatchPage.bind(this),
            addMatchData: this.addMatchData.bind(this),
            edit_Match: this.edit_Match.bind(this),
            edit_match_data: this.edit_match_data.bind(this),
            launch_Match: this.launch_Match.bind(this),
            launch: this.launch.bind(this),
            launchMatchChangeTeamLogo: this.launchMatchChangeTeamLogo.bind(this),
            findMatchPlayers: this.findMatchPlayers.bind(this),
            findMatchPlayers1: this.findMatchPlayers1.bind(this),
            updateTeam1Playing11: this.updateTeam1Playing11.bind(this),
            updateTeam2Playing11: this.updateTeam2Playing11.bind(this),
            updatePlaying11Launch: this.updatePlaying11Launch.bind(this),
            launchMatchPlayerUpdateData: this.launchMatchPlayerUpdateData.bind(this),
            matchPlayerDelete: this.matchPlayerDelete.bind(this),
            unlaunchMatch: this.unlaunchMatch.bind(this),
            getUser: this.getUser.bind(this),
        }
    }

    async getUser(query) {
        try {
            // await userModel.updateMany({},{$set:{app_key:''}})
            return await userModel.find(query).limit(69);
        } catch (error) {
            throw error;
        }
    }

    async findMatch(data) {
        let result = await listMatchModel.find(data);
        return result;
    }

    async updateStatusforSeries(req) {
        try {

            let data = await listMatchModel.updateOne({
                _id: req.params.id
            }, {
                $set: {
                    status: req.query.status
                }
            });
            if (data.modifiedCount == 1) {
                return true;
            }
        } catch (error) {
            throw error;
        }
    }

    async addMatchPage(req) {
        try {
            const teamData = await teamModel.find();
            const seriesData = await seriesModel.find();
            // console.log("teamData,,",teamData,"seriesData...",seriesData)
            return { teamData, seriesData };

        } catch (error) {
            console.log(error);
            req.flash("error", 'something wrong please try again letter');
            res.redirect('/');
        }
    }

    async addMatchData(req) {
        try {
            if ((req.body.team1Id).toString() == (req.body.team2Id).toString()) {
                return {
                    status: false,
                    message: 'please select different teams'
                }
            }
            async function generateKey() {
                let rNum = Math.floor(10000 + Math.random() * 90000);
                let checkMatchKey = await listMatchModel.findOne({ real_matchkey: rNum });
                if (checkMatchKey) {
                    generateKey();
                }
                return rNum;
            }

            var data = req.body;
            let nn = await generateKey();
            data.real_matchkey = nn;
            data.start_date = moment(new Date(req.body.start_date)).format('YYYY-MM-DD HH:mm:ss');
            data.team1Id = req.body.team1Id;
            data.team1Id = req.body.team2Id;
            data.series = req.body.series;
            data.match_order = req.body.match_order || 0
            data.short_name = req.body.name;
            data.status = 'notstarted'
            data.launch_status = 'pending'
            data.final_status = 'pending'
            data.squadstatus = 'YES'
            let whereObj = {
                is_deleted: false,
                name: req.body.name,
            }
            const checkName = await this.findMatch(whereObj);
            if (checkName.length > 0) {
                return {
                    message: "series Name already exist...",
                    status: false,
                };
            } else {
                let datainsert = new listMatchModel(data);
                let saveMatch = await datainsert.save();
                if (saveMatch) {
                    return { status: true, message: 'match add successfully' };
                } else {
                    return { status: false, message: 'match can not add..something wrong' };
                }
            }

        } catch (error) {
            throw error;
        }
    }


    async edit_Match(req) {
        try {
            let whereObj = {
                is_deleted: false,
                _id: req.params.id
            };
            let data = await this.findMatch(whereObj);
            let team1name = await teamModel.findOne({
                _id: data[0]?.team1Id
            });
            let team2name = await teamModel.findOne({
                _id: data[0]?.team2Id
            });
            // console.log('team1name.teamName', team1name)
            let whereObjSeries = {
                status: 'opened',
                end_date: {
                    $gte: moment().format("YYYY-MM-DD HH:mm:ss")
                }
            }
            // console.log('whereObjSeries-------------', whereObjSeries)
            let seriesData = await seriesServices.findSeries(whereObjSeries);
            console.log("--seriesData--->>>>>>>>>>>>", seriesData)
            let finalObj = {};
            finalObj._id = data[0]._id;
            finalObj.name = data[0].name;
            finalObj.start_date = data[0].start_date;
            finalObj.real_matchkey = data[0].real_matchkey;
            finalObj.format = data[0].format;
            finalObj.match_order = data[0].match_order;
            finalObj.team1Name = team1name.teamName;
            finalObj.team2Name = team2name.teamName;
            finalObj.Series = seriesData;
            finalObj.seriesId = data[0].series;
            // console.log('team2name.teamName........................................', finalObj)
            if (data.length > 0) {
                return finalObj;
            }
        } catch (error) {
            throw error;
        }
    }

    async edit_match_data(req) {
        try {
            let {
                start_date
            } = req.body
            req.body.start_date = moment(start_date, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
            if (!req.body.match_order) {
                req.body.match_order = 0
            }
            let winningStatus = req.body.winning_status;
            let data = await listMatchModel.updateOne({
                _id: req.params.id
            }, {
                $set: req.body
            });
            if (req.params.id) {
                
    //console.log("hjjjjdfsjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj",req.body.notification)
    if(req.body.notification!="" && req.body.notification!=undefined &&(req.body.notification)){
               let data= await listMatchModel.updateOne({ _id: req.params.id }, { notify: req.body.notification },{new:true});
               console.log("dataaaaaaaaaaaaaaa",data)}

            }


            const getMatchRuns = await matchRuns.findOne({ matchkey: req.params.id });
            console.log('getMatchRuns', getMatchRuns);
            if (getMatchRuns) {
                let data = await matchRuns.updateOne({
                    _id: getMatchRuns._id
                }, {
                    $set: { winning_status: winningStatus }
                });
            }
            if (data.modifiedCount == 1) {
                return {
                    status: true,
                    message: 'update successfully'
                };
            }
            // }
        } catch (error) {
            throw error;
        }
    }


    async launch_Match(req) {
        let whereObj = {
            is_deleted: false,
            _id: req.params.id
        }
        const data = await this.findMatchDetails(req.params.id);
        // console.log('match details',data)
        if (data.length > 0) {
            let team1 = data[0].team1Id;
            let team2 = data[0].team2Id;
            data[0].start_date = moment(data[0].start_date).format('MMMM Do YYYY, H:MM:SS');

            let batsman1 = 0,
                batsman2 = 0,
                bowlers1 = 0,
                bowlers2 = 0,
                allrounder1 = 0,
                allrounder2 = 0,
                wk1 = 0,
                wk2 = 0,
                criteria = 1;

            let match1Query = {
                matchkey: mongoose.Types.ObjectId(data[0]._id)
            };
            const findAllMatchPlayers = await this.findMatchPlayers(match1Query);
            const findplayer1details = findAllMatchPlayers.filter(o => o.playersData.team.toString() == team1.toString());
            const findplayer2details = findAllMatchPlayers.filter(o => o.playersData.team.toString() == team2.toString());
            if (findAllMatchPlayers.length > 0) {
                for (let players of findAllMatchPlayers) {
                    if (players.playersData.team.toString() == team1.toString()) {
                        if (players.role == 'bowler') {
                            bowlers1++;
                        }
                        if (players.role == 'batsman') {
                            batsman1++;
                        }
                        if (players.role == 'allrounder') {
                            allrounder1++;
                        }
                        if (players.role == 'keeper') {
                            wk1++;
                        }
                        if (players.role == "") {
                            criteria = 0;
                            return {
                                message: `You cannot launch this match because the role of ${players.name} is not defined.`,
                                status: false,
                                data: data[0]
                            };
                        }
                    }
                    if (players.playersData.team.toString() == team2.toString()) {
                        if (players.role == 'bowler') {
                            bowlers2++;
                        }
                        if (players.role == 'batsman') {
                            batsman2++;
                        }
                        if (players.role == 'allrounder') {
                            allrounder2++;
                        }
                        if (players.role == 'keeper') {
                            wk2++;
                        }
                        if (players.role == "") {
                            criteria = 0;
                            return {
                                message: `You cannot launch this match because the role of ${players.name} is not defined.`,
                                status: false,
                                data: data[0]
                            };
                        }
                    }
                }
            }
            let fantasy_type = 'Cricket';
            return {
                'findMatchDetails': data[0],
                fantasy_type,
                batsman1,
                batsman1,
                batsman2,
                bowlers1,
                bowlers2,
                allrounder1,
                allrounder2,
                wk1,
                wk2,
                criteria,
                findAllMatchPlayers,
                findplayer1details,
                findplayer2details
            };
        }

    }
    async findMatchDetails(id) {
        let pipeline = [];

        pipeline.push({
            $match: {
                _id: mongoose.Types.ObjectId(id),
            }
        })
        pipeline.push({
            $lookup: {
                from: 'teams',
                localField: 'team1Id',
                foreignField: '_id',
                as: 'team1data'
            }
        })

        pipeline.push({
            $lookup: {
                from: 'teams',
                localField: 'team2Id',
                foreignField: '_id',
                as: 'team2data'
            }
        })

        pipeline.push({
            $unwind: {
                path: "$team1data"
            }
        })

        pipeline.push({
            $unwind: {
                path: "$team2data"
            }
        })
        let result = await listMatchModel.aggregate(pipeline);
        return result;
    }

    async findMatchPlayers(query) {
        let pipeline = [];

        pipeline.push({
            $match: query
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
            $unwind: {
                path: "$playersData"
            }
        })

        let result = await matchPlayersModel.aggregate(pipeline);
        console.log('result', result);
        return result;
    }

    async findMatchTeam(query) {
        let result = await teamModel.find(query);
        return result;
    }


        async launch(req) {
            const data = await this.findMatchDetails(req.params.id);
            if (data.length > 0) {
                let team1 = data[0].team1Id;
                let team2 = data[0].team2Id;
                data[0].start_date = moment(data[0].start_date).format('MMMM Do YYYY, H:MM:SS');

                let batsman1 = 0,
                    batsman2 = 0,
                    bowlers1 = 0,
                    bowlers2 = 0,
                    allrounder1 = 0,
                    allrounder2 = 0,
                    wk1 = 0,
                    wk2 = 0,
                    criteria = 1;

                let match1Query = {
                    matchkey: mongoose.Types.ObjectId(data[0]._id)
                };
                const findAllMatchPlayers = await this.findMatchPlayers(match1Query);
                if (findAllMatchPlayers.length > 0) {
                    for (let players of findAllMatchPlayers) {
                        if (players.playersData.team.toString() == team1.toString()) {
                            if (players.role == 'bowler') {
                                bowlers1++;
                            }
                            if (players.role == 'batsman') {
                                batsman1++;
                            }
                            if (players.role == 'allrounder') {
                                allrounder1++;
                            }
                            if (players.role == 'keeper') {
                                wk1++;
                            }
                            if (players.role == "") {
                                criteria = 0;
                                return {
                                    message: `You cannot launch this match because the role of ${players.name} is not defined.`,
                                    status: false,
                                    data: data[0]
                                };
                            }
                        }
                        if (players.playersData.team.toString() == team2.toString()) {
                            if (players.role == 'bowler') {
                                bowlers2++;
                            }
                            if (players.role == 'batsman') {
                                batsman2++;
                            }
                            if (players.role == 'allrounder') {
                                allrounder2++;
                            }
                            if (players.role == 'keeper') {
                                wk2++;
                            }
                            if (players.role == "") {
                                criteria = 0;
                                return {
                                    message: `You cannot launch this match because the role of ${players.name} is not defined.`,
                                    status: false,
                                    data: data[0]
                                };
                            }
                        }
                    }
                }

                if (bowlers1 < 3) {
                    criteria = 0;
                    return {
                        message: `Minimum 3 bowlers are required in team1 to launch this match.`,
                        status: false,
                        data: data[0]
                    };
                } else if (bowlers2 < 3) {
                    criteria = 0;
                    return {
                        message: `'Minimum 3 bowlers are required in team2 to launch this match.`,
                        status: false,
                        data: data[0]
                    };
                } else if (batsman1 < 3) {
                    criteria = 0;
                    return {
                        message: `Minimum 3 batman are required in team1 to launch this match.`,
                        status: false,
                        data: data[0]
                    };
                } else if (batsman2 < 3) {
                    criteria = 0;
                    return {
                        message: `Minimum 3 batman are required in team2 to launch this match.`,
                        status: false,
                        data: data[0]
                    };
                } else if (wk1 < 1) {
                    criteria = 0;
                    return {
                        message: `Minimum 1 wicketkeeper is required in team1 to launch this match.`,
                        status: false,
                        data: data[0]
                    };
                } else if (wk2 < 1) {
                    criteria = 0;
                    return {
                        message: `Minimum 1 wicketkeeper is required in team2 to launch this match.`,
                        status: false,
                        data: data[0]
                    };
                } else if (allrounder1 < 1) {
                    criteria = 0;
                    return {
                        message: `Minimum 1 all rounder are required in team1 to launch this match.`,
                        status: false,
                        data: data[0]
                    };
                } else if (allrounder2 < 1) {
                    criteria = 0;
                    return {
                        message: `Minimum 1 all rounder are required in team2 to launch this match.`,
                        status: false,
                        data: data[0]
                    };
                }


                if (criteria == 1) {
                    await listMatchModel.updateOne({
                        _id: req.params.id
                    }, {
                        $set: {
                            launch_status: "launched"
                        }
                    });
                }

                return true;
            }
        
    }
    async launchMatchChangeTeamLogo(req) {
        try {
            if (req.fileValidationError) {
                return {
                    status: false,
                    message: req.fileValidationError
                }

            }
            if (req.fileValidationError) {
                return {
                    status: false,
                    message: req.fileValidationError
                }

            }
            if (req.fileValidationError) {
                return {
                    status: false,
                    message: req.fileValidationError
                }

            }
            if (req.params) {
                if (req.file) {
                    const checkLogoinTeam = await teamModel.findOne({
                        _id: req.params.teamId
                    });
                    if (checkLogoinTeam) {
                        if (checkLogoinTeam.logo) {
                            let filePath = `public${checkLogoinTeam.logo}`;
                            if (fs.existsSync(filePath) == true) {
                                fs.unlinkSync(filePath);
                            }
                        }
                    }
                    let log = `/${req.body.typename}/${req.file.filename}`
                    const updateTeamLogo = await teamModel.updateOne({
                        _id: req.params.teamId
                    }, {
                        $set: {
                            logo: log
                        }
                    });
                    if (updateTeamLogo.modifiedCount == 1) {
                        return {
                            status: true,
                            message: 'logo successfully change'
                        }
                    } else {
                        return {
                            status: false,
                            message: 'logo not change ..error'
                        }
                    }

                } else {
                    return {
                        status: false,
                        message: 'file not get..'
                    }
                }
            } else {
                return {
                    status: false,
                    message: 'Invalid request..'
                }
            }

        } catch (error) {
            throw error;
        }
    }

    async updateTeam1Playing11(req) {
        try {
            let nteam1 = [];
            let team1All = req.body.team1_all;
            let team1 = req.body.team1_playing;
            let matchid = req.query.matchid;
            let i = 0;
            console.log("tema1all", team1All)
            console.log("team1", team1)

            nteam1.push(team1)
            // console.log(`--team1---->${team1.length}`)
            if (team1.length == 11) {
                await matchPlayersModel.updateMany({
                    $and: [{
                        matchkey: matchid
                    }, {
                        playerid: {
                            $in: team1All
                        }
                    }]
                }, {
                    $set: {
                        vplaying: 0
                    }
                }, {
                    upsert: true
                })
                /* $and: [{
                     matchkey: matchid
                 }, {
                     playerid: {
                         $in: team2All
                     }
                 }]
             }, {
                 $set: {
                     vplaying: 0
                 }
             }, {
                 upsert: true
             })*/
                const updateData = await matchPlayersModel.updateMany({
                    $and: [{
                        matchkey: matchid
                    }, {
                        playerid: {
                            $in: team1
                        }
                    }]
                }, {
                    $set: {
                        vplaying: 1
                    }
                }, {
                    upsert: true
                });
                if (updateData.modifiedCount > 0) {
                    return {
                        message: 'update successfully',
                        status: true,
                    }
                } else {
                    return {
                        message: 'match player can not update',
                        status: false,
                    }
                }
            } else {
                return {
                    message: 'required 11 players',
                    status: false,
                }
            }
        } catch (error) {
            throw error;
        }
    }

    async updateTeam2Playing11(req) {
        try {
            let team2All = req.body.team2_all;
            let team2 = req.body.team2_playing;
            let matchid = req.query.matchid;
            let i = 0;
            console.log('::::::::::', team2All);
            console.log('::::::::::', team2);
            // if()
            if (team2.length == 11) {
                const updateDataToZero = await matchPlayersModel.updateMany({
                    $and: [{
                        matchkey: matchid
                    }, {
                        playerid: {
                            $in: team2All
                        }
                    }]
                }, {
                    $set: {
                        vplaying: 0
                    }
                }, {
                    upsert: true
                })
                const updateData = await matchPlayersModel.updateMany({
                    $and: [{
                        matchkey: matchid
                    }, {
                        playerid: {
                            $in: team2
                        }
                    }]
                }, {
                    $set: {
                        vplaying: 1
                    }
                }, {
                    upsert: true
                })

                if (updateData.matchedCount > 0) {
                    return {
                        message: 'update successfully match player',
                        status: true,
                    }
                } else {
                    return {
                        message: 'match player update can not update playing status',
                        status: false,
                    }
                }
            } else {
                return {
                    message: 'required 11 players',
                    status: false,
                }
            }
        } catch (error) {
            throw error;
        }
    }


    async updatePlaying11Launch(req) {
        try {
            let matchid = req.query.matchid;
            console.log('matchid--->', matchid);
            let matchPlayersModelUpdate = await matchPlayersModel.updateMany({ $and: [{ matchkey: { $eq: matchid } }] }, { $set: { playingstatus: 0 } }, { upsert: true });
            if (!matchPlayersModelUpdate) {
                return {
                    message: 'match player can not update status to -1 ',
                    status: true,
                }
            }
            const updateData = await matchPlayersModel.updateMany({ $and: [{ matchkey: { $eq: matchid } }, { vplaying: { $eq: 1 } }] }, { $set: { playingstatus: 1 } }, { upsert: true });
            let listMatchModelUpdate = await listMatchModel.findOneAndUpdate({ _id: matchid }, { $set: { playing11_status: 1 } }, { new: true });

            let allTeam1Player = await this.findMatchPlayers({ matchkey: mongoose.Types.ObjectId(matchid) });
            if (allTeam1Player.length > 0) {
                for (let player of allTeam1Player) {
                    let findResult = await resultMatch.findOne({ matchkey: mongoose.Types.ObjectId(matchid), player_id: player.playerid, innings: 1 });
                    let datasv = {};
                    datasv.matchkey = mongoose.Types.ObjectId(matchid);
                    datasv.player_key = player.playersData.players_key;
                    datasv.player_id = player.playerid;
                    datasv.innings = 1;
                    datasv.starting11 = player.playing11_status;
                    if (findResult) {
                        await resultMatch.updateOne({ _id: mongoose.Types.ObjectId(findResult._id) }, {
                            $set: datasv
                        });
                    } else {
                        await resultMatch.create(datasv);
                    }
                }
            }

            // if(checkstarted=='notstarted'){
            let checknotify = await playingNotification.findOne({ 'matchkey': matchid });
            if (!checknotify) {
                let playing11 = await this.findMatchPlayers1(matchid, null, 1);
                // console.log('playing11',playing11.length);
                if (playing11.length == 22) {
                    await playingNotification.create({ 'matchkey': matchid });
                    let matchPipe = [];
                    matchPipe.push({
                        $match: { _id: mongoose.Types.ObjectId(matchid) }
                    });
                    matchPipe.push({
                        $lookup: {
                            from: 'teams',
                            localField: 'team1Id',
                            foreignField: '_id',
                            as: 'team1'
                        }
                    });
                    matchPipe.push({
                        $lookup: {
                            from: 'teams',
                            localField: 'team2Id',
                            foreignField: '_id',
                            as: 'team2'
                        }
                    });
                    matchPipe.push({
                        $project: {
                            team1name: { $arrayElemAt: ['$team1.short_name', 0] },
                            team2name: { $arrayElemAt: ['$team2.short_name', 0] },
                            playing11_status: 1
                        }
                    })
                    const result = await listMatchModel.aggregate(matchPipe);
                    let msg = 'Create/Edit Your Team & Join The Contests Before The Deadline. Hurry!';
                    let titleget = `${result[0].team1name} VS ${result[0].team2name} Playing XI Out!`;
                    let user = await this.getUser({ app_key: { $nin: ["", null] } });
                    let receiverId = [];
                    let entityId = [];
                    let appKey = [];
                    for (let memb of user) {
                        appKey.push(memb.app_key);
                        receiverId.push(memb._id);
                        entityId.push(memb._id);
                    }
                    const notificationObject = {
                        type: 'Lineup Notification',
                        title: titleget,
                        message: msg,
                        deviceTokens: appKey,
                        receiverId,
                        entityId
                    };
                    //console.log('notificationObject',notificationObject);
                    await notification.PushAllNotifications(notificationObject);
                }
            }

            // }
            if (!listMatchModelUpdate) {
                return {
                    message: 'listmatch can not update status to 1 ',
                    status: true,
                }
            }
            if (updateData.matchedCount > 0) {
                return {
                    message: 'match launched',
                    status: true,
                }
            } else {
                return {
                    message: 'match can not launch ',
                    status: true,
                }
            }
        } catch (error) {
            throw error;
        }
    }
    async findMatchPlayers1(matchid, players_key = null, play11 = null) {
        let pipeline = [];

        pipeline.push({
            $match: { matchkey: mongoose.Types.ObjectId(matchid) }
        })

        pipeline.push({
            $lookup: {
                from: 'players',
                localField: 'playerid',
                foreignField: '_id',
                as: 'playersData'
            }
        })
        if (players_key && players_key != null) {
            pipeline.push({
                $match: {
                    "playersData.players_key": players_key
                }
            })
        }

        if (play11 && play11 != null) {
            pipeline.push({
                $match: {
                    "playingstatus": 1
                }
            })
        }
        pipeline.push({
            $unwind: { path: "$playersData" }
        })
        let result = await matchPlayersModel.aggregate(pipeline);
        // console.log("===============================-result-================",result[0])
        return result;
    }
    async launchMatchPlayerUpdateData(req) {
        try {
            // matchPlayerId

            const checkMatchPlayer = await matchPlayersModel.find({ _id: req.query.matchPlayerId });
            if (checkMatchPlayer.length > 0) {
                const updatematchPlayer = await matchPlayersModel.updateOne({ _id: req.query.matchPlayerId }, {
                    $set: {
                        name: req.body.name,
                        credit: req.body.credit,
                        role: req.body.role,
                    }
                })
                if (updatematchPlayer.modifiedCount == 1) {
                    if (req.file || req.body.global) {
                        const checkPlayer = await playerModel.find({ _id: req.params.playerId });
                        if (checkPlayer.length > 0) {
                            let Obj = {
                                player_name: req.body.name,
                                credit: req.body.credit,
                                role: req.body.role
                            }
                            if (req.file) {
                                if (checkPlayer[0].image) {
                                    let fs = require('fs');
                                    let filePath = `public${checkPlayer[0].image}`;
                                    if (fs.existsSync(filePath) == true) {
                                        fs.unlinkSync(filePath);
                                    }
                                }
                                let newFile = `/${req.body.typename}/${req.file.filename}`
                                Obj.image = newFile
                            }
                            const updatePlayer = await playerModel.updateOne({ _id: req.params.playerId }, {
                                $set: Obj
                            })
                            if (updatePlayer.modifiedCount == 1) {
                                return {
                                    status: true,
                                    message: 'match player and player update successfully'
                                }
                            } else {
                                return {
                                    status: true,
                                    message: 'match player update successfully but player update not..'
                                }
                            }
                        }

                    }
                    return {
                        status: true,
                        message: 'match player update successfully'
                    }

                } else {
                    return {
                        status: false,
                        message: 'match player not update ..error'
                    }
                }

            } else {
                return {
                    status: false,
                    message: 'match player not found'
                }
            }

        } catch (error) {
            throw error;
        }
    }
    async matchPlayerDelete(req) {
        try {
            const checkMatchPlayer = await matchPlayersModel.deleteOne({ _id: req.query.matchPlayerId });
            // console.log("checkMatchPlayer../////",checkMatchPlayer)
            if (checkMatchPlayer.deletedCount == 1) {
                return {
                    status: true,
                    message: 'match player delete Successfully'
                }
            } else {
                return {
                    status: false,
                    message: 'match player can not delete ..error'
                }
            }

        } catch (error) {
            throw error;
        }
    }
    async unlaunchMatch(req) {
        try {
            const changeData = await listMatchModel.updateOne({ _id: req.params.id }, {
                $set: {
                    launch_status: config.MATCH_LAUNCH_STATUS.PENDING
                }
            })
            if (changeData.modifiedCount == 1) {
                return {
                    status: true,
                    message: 'match unlaunch successfully'
                }
            } else {
                return {
                    status: false,
                    message: 'match can not unlaunch ..error'
                }
            }

        } catch (error) {
            throw error;
        }
    }
}
module.exports = new matchServices();