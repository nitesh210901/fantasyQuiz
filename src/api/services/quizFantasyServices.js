const mongoose = require('mongoose');
const randomstring = require("randomstring");
const moment = require('moment');
const axios = require("axios")
const fs = require('fs');

require('../../models/challengersModel');
require('../../models/playerModel');
require('../../models/teamModel');
const matchchallengesModel = require('../../models/matchChallengersModel');
const contestCategory = require('../../models/contestcategoryModel');
const TransactionModel = require('../../models/transactionModel');
const leaderBoardModel = require(`../../models/leaderboardModel`)
const refundModel = require('../../models/refundModel');
const overMatchModel = require('../../models/quizmatches');
const quizModel = require('../../models/quizModel');
const overpointsModel = require('../../models/quizpoints');
const listMatchesModel = require('../../models/listMatchesModel');
const matchPlayersModel = require('../../models/matchPlayersModel');
const JoinLeaugeModel = require('../../models/JoinLeaugeModel');
const playerModel = require("../../models/playerModel");
const JoinQuizTeamModel = require('../../models/JoinQuizTeamModel');
const userModel = require("../../models/userModel");
const constant = require('../../config/const_credential');
const Redis = require('../../utils/redis');
const matchServices = require("./matchServices")
// ------over fantasy---
//const JoinQuizTeamModel = require("../../models/overJoinedTeam");

class quizfantasyServices {
    constructor() {
        return {
            quizGetmatchlist: this.quizGetmatchlist.bind(this),
            latestJoinedMatches: this.latestJoinedMatches.bind(this),
            quizAllCompletedMatches: this.quizAllCompletedMatches.bind(this),
            quizCreateTeam: this.quizCreateTeam.bind(this),
            quizGetMyTeams: this.quizGetMyTeams.bind(this),
            quizInformations: this.quizInformations.bind(this),
            quizNewjoinedmatches: this.quizNewjoinedmatches.bind(this),
            quizViewTeam: this.quizViewTeam.bind(this),
            updateIsViewedForBoatTeam: this.updateIsViewedForBoatTeam.bind(this),
            quizLivematches: this.quizLivematches.bind(this),
            pointcount: this.pointcount.bind(this),
            getQuestionList: this.getQuestionList.bind(this),
            findArrayIntersection:this.findArrayIntersection.bind(this),
            quizPointCalculator: this.quizPointCalculator.bind(this),
            quiz_refund_amount: this.quiz_refund_amount.bind(this),
            quizrefundprocess: this.quizrefundprocess.bind(this),
            joinQuizContest: this.joinQuizContest.bind(this),
            findUsableBonusMoney: this.findUsableBonusMoney.bind(this),
            findUsableBalanceMoney: this.findUsableBalanceMoney.bind(this),
            findJoinLeaugeExist: this.findJoinLeaugeExist.bind(this),
            getMatchTime: this.getMatchTime.bind(this),
            getAllNewContests: this.getAllNewContests.bind(this),
            getMyQuizJoinedContest: this.getMyQuizJoinedContest.bind(this),
            getUserRank: this.getUserRank.bind(this),
            
        }
    }

    async getJoinleague(userId, matchkey) {
        const total_joinedcontestData = await JoinLeaugeModel.aggregate([
            {
                $match: {
                    userid: mongoose.Types.ObjectId(userId),
                    matchkey: mongoose.Types.ObjectId(matchkey)
                }
            },
            {
                $group: {
                    _id: "$challengeid",
                }
            }, {
                $count: "total_count"
            }
        ])
        return total_joinedcontestData[0]?.total_count;
    }

    async getQuestionList(req) {
        try {
        const matchkey_id = req.query.matchkey_id
        if(matchkey_id){
          let data = await quizModel.find({matchkey_id})
           if(data.length>0){
             return {
                status :true,
                message: "Quiz Question fatch Successfully",
                data:data
             }
           }else{
            return {
                status :false,
                message:"Quiz Question not Found"
            }
           }
        }else{
            return {
                status:false,
                message:"Match not defind"
            }
        }
        } catch (error) {
            console.log('error', error);
        }
    }

    async quizCreateTeam(req) {
        try {
            const { matchkey, teamnumber, quiz } = req.body;
            let quizArray = quiz.map(item => item.questionId),
            quizObjectIdArray = [];
            if (quizArray.length < 10) {
                return {
                    message: 'Select atleast 11 Questions.',
                    status: false,
                    data: {}
                };
            }
            for (let quizObjectId of quizArray) quizObjectIdArray.push(mongoose.Types.ObjectId(quizObjectId.questionId));
            const joinlist = await JoinQuizTeamModel.find({ matchkey: matchkey, userid: req.user._id }).sort({ teamnumber: -1 });
            const duplicateData = await this.checkForDuplicateTeam(joinlist, quizArray, teamnumber);
            if (duplicateData === false) {
                return {
                    message: 'You cannot create the same team.',
                    status: false,
                    data: {}
                };
            }

            let listmatchData = await listMatchesModel.findOne({ _id: mongoose.Types.ObjectId(matchkey) });
            if (!listmatchData) {
                return {
                    message: 'Match Not Found',
                    status: false,
                    data: {}
                }
            }
            const matchTime = await this.getMatchTime(listmatchData.start_date);
            if (matchTime === false) {
                return {
                    message: 'Match has been closed, You cannot create or edit team now',
                    status: false,
                    data: {}
                }
            }
            const data = {}

            data['userid'] = req.user._id;
            data['matchkey'] = matchkey;
            data['teamnumber'] = teamnumber;
            data['quiz'] = quiz;
            data['type'] = "quiz";
            // data['playersArray'] = players;
            data['player_type'] = "classic";
            const joinTeam = await JoinQuizTeamModel.findOne({
                matchkey: matchkey,
                teamnumber: parseInt(teamnumber),
                userid: req.user._id,
            }).sort({ teamnumber: -1 });
            if (joinTeam) {
                data["user_type"] = 0;
                data['created_at'] = joinTeam.createdAt;
                const updateTeam = await JoinQuizTeamModel.findOneAndUpdate({ _id: joinTeam._id }, data, {
                    new: true,
                });
                if (updateTeam) {
                    return {
                        message: 'Team Updated Successfully',
                        status: true,
                        data: {
                            teamid: updateTeam._id
                        }
                    }
                }
            } else {
                const joinTeam = await JoinQuizTeamModel.find({
                    matchkey: matchkey,
                    userid: req.user._id,
                });
                if (joinTeam.length > 0) {
                    data['teamnumber'] = joinTeam.length + 1;
                } else {
                    data['teamnumber'] = 1;
                }
                if (data['teamnumber'] <= 11) {
                    data["user_type"] = 0;
                    console.log('datatatatattaatatatatatatataaat', data);
                    let jointeamData = await JoinQuizTeamModel.create(data);
                    if (jointeamData) {
                        return {
                            message: 'Team Created Successfully',
                            status: true,
                            data: {
                                teamid: jointeamData._id
                            }
                        }
                    }
                } else {
                    return {
                        message: 'You Cannot Create More Team',
                        status: false,
                        data: {}
                    }
                }
            }
        } catch (error) {
            throw error;
        }
    }


    async quizGetMyTeams(req) {     
        try {
            let finalData = [];
            const listmatchData = await listMatchesModel.findOne({ _id: req.query.matchkey }).populate({
                path: 'team1Id',
                select: 'short_name'
            }).populate({
                path: 'team2Id',
                select: 'short_name'
            });
            const createTeams = await JoinQuizTeamModel.find({
                matchkey: req.query.matchkey,
                userid: req.user._id,
            });
            if (createTeams.length == 0) {
                return {
                    message: 'Teams Not Available',
                    status: false,
                    data: []
                }
            }
            const matchchallenges = await matchchallengesModel.find({ matchkey: mongoose.Types.ObjectId(req.query.matchkey) });
            console.log(`--------------matchchallenges.length----------------`, matchchallenges.length);

            // ----------total join contest and ----
            const total_teams = await JoinQuizTeamModel.countDocuments({ matchkey: req.query.matchkey, userid: req.user._id, });
            const total_joinedcontestData = await JoinLeaugeModel.aggregate([
                {
                    $match: {
                        userid: mongoose.Types.ObjectId(req.user._id),
                        matchkey: mongoose.Types.ObjectId(req.query.matchkey)
                    }
                },
                {
                    $group: {
                        _id: "$challengeid",
                    }
                }, {
                    $count: "total_count"
                }
            ])
            let count_JoinContest = total_joinedcontestData[0]?.total_count;
            // ---------------------//
            let i = 0;
            for (let element of createTeams) {
                i++
                
                const tempObj = {
                    status: 1,
                    userid: req.user._id,
                    teamnumber: element.teamnumber,
                    isSelected: false,
                };

                if (matchchallenges.length != 0 && req.query.matchchallengeid) {
                    for await (const challenges of matchchallenges) {
                        console.log(`----chalenges---viewmyteam api--`)
                        if (challenges._id.toString() == req.query.matchchallengeid.toString()) {
                            const joindata = await JoinLeaugeModel.findOne({
                                challengeid: req.query.matchchallengeid,
                                teamid: element._id,
                                userid: req.user._id,
                            });
                            if (joindata) tempObj['isSelected'] = true;
                        }
                    }
                }

                let team1count = 0;
                let team2count = 0;
                   
                let totalPoints = 0;
                
                tempObj["quiz"] = element.quiz ? element.quiz : '',
                tempObj['team1count'] = team1count;
                tempObj['jointeamid'] = element._id;
                tempObj['team2count'] = team2count;
                tempObj['total_teams'] = total_teams;
                tempObj['total_joinedcontest'] = count_JoinContest;
                tempObj["totalpoints"] = element.points;

                finalData.push(tempObj);
                if (i == createTeams.length) {
                    return {
                        message: 'Team Data',
                        status: true,
                        data: finalData
                    }
                }
            }
        } catch (error) {
            throw error;
        }
    }


    async latestJoinedMatches(req) {
        const aggPipe = [];
        console.log("------req.user._id----", req.user._id);
        aggPipe.push({
            $match: {
                userid: mongoose.Types.ObjectId(req.user._id),
            }
        });
        aggPipe.push({
            $group: {
                _id: '$matchkey',
                matchkey: { $first: '$matchkey' },
                joinedleaugeId: { $first: '$_id' },
                userid: { $first: '$userid' },
                matchchallengeid: { $first: '$challengeid' },
                jointeamid: { $first: '$teamid' },
            }
        });
        aggPipe.push({
            $lookup: {
                from: 'listmatches',
                localField: 'matchkey',
                foreignField: '_id',
                as: 'match'
            }
        });
        aggPipe.push({
            $unwind: {
                path: '$match'
            }
        });

        aggPipe.push({
            $match: {
                'match.fantasy_type': "overfantasy"
            },
        });
        aggPipe.push({
            $match: {
                $or: [
                    { $and: [{ 'match.final_status': 'pending' }, { 'match.status': 'started' }] },
                    { $and: [{ 'match.status': "completed" }, { 'match.final_status': 'IsReviewed' }] },
                    { $and: [{ 'match.status': "notstarted" }, { 'match.final_status': 'pending' }] },
                ]
            }
        });
        // aggPipe.push({
        //     $sort: {
        //         'match.start_date': -1,
        //     },
        // });
        aggPipe.push({
            $limit: 5
        });
        aggPipe.push({
            $lookup: {
                from: 'joinedleauges',
                let: { matchkey: '$matchkey', userid: '$userid' },
                pipeline: [{
                    $match: {
                        $expr: {
                            $and: [{
                                $eq: ['$matchkey', '$$matchkey'],
                            },
                            {
                                $eq: ['$userid', '$$userid'],
                            },
                            ],
                        },
                    },
                },],
                as: 'joinedleauges',
            }
        });
        aggPipe.push({
            $unwind: {
                path: '$joinedleauges',
            },
        });
        aggPipe.push({
            $group: {
                _id: '$joinedleauges.challengeid',
                // matchchallengeid: { $first: '$joinedleauges.challengeid' },
                joinedleaugeId: { $first: '$joinedleauges._id' },
                matchkey: { $first: '$matchkey' },
                jointeamid: { $first: '$jointeamid' },
                userid: { $first: '$userid' },
                match: { $first: '$match' },
            },
        });
        // aggPipe.push({
        //     $lookup: {
        //         from: 'matchchallenges',
        //         localField: '_id',
        //         foreignField: '_id',
        //         as: 'matchchallenge',
        //     },
        // });
        // aggPipe.push({
        //     $unwind: {
        //         path: '$matchchallenge',
        //         preserveNullAndEmptyArrays: true,
        //     },
        // });
        aggPipe.push({
            $group: {
                _id: '$matchkey',
                joinedleaugeId: { $first: '$joinedleaugeId' },
                matchkey: { $first: '$matchkey' },
                jointeamid: { $first: '$jointeamid' },
                match: { $first: '$match' },
                count: { $sum: 1 },
            },
        });
        // aggPipe.push({
        //     $match:{
        //         'match.final_status':'IsReviewed'
        //     }
        // },);
        aggPipe.push({
            $lookup: {
                from: 'series',
                localField: 'match.series',
                foreignField: '_id',
                as: 'series',
            },
        });
        aggPipe.push({
            $lookup: {
                from: 'teams',
                localField: 'match.team1Id',
                foreignField: '_id',
                as: 'team1',
            },
        });
        aggPipe.push({
            $lookup: {
                from: 'teams',
                localField: 'match.team2Id',
                foreignField: '_id',
                as: 'team2',
            },
        });
        aggPipe.push({
            $unwind: {
                path: '$series',
            },
        });
        aggPipe.push({
            $unwind: {
                path: '$team1',
            },
        });
        aggPipe.push({
            $unwind: {
                path: '$team2',
            },
        });
        aggPipe.push({
            $project: {
                _id: 0,
                matchkey: 1,
                playing11_status: { $ifNull: ['$match.playing11_status', 1] },
                matchname: { $ifNull: ['$match.name', ''] },
                team1ShortName: { $ifNull: ['$team1.short_name', ''] },
                team2ShortName: { $ifNull: ['$team2.short_name', ''] },
                teamfullname1: { $ifNull: ['$team1.teamName', 0] },
                teamfullname2: { $ifNull: ['$team2.teamName', 0] },
                team1color: { $ifNull: ['$team1.color', constant.TEAM_DEFAULT_COLOR.DEF1] },
                team2color: { $ifNull: ['$team2.color', constant.TEAM_DEFAULT_COLOR.DEF1] },
                team1logo: {
                    $ifNull: [{
                        $cond: {
                            if: { $or: [{ $eq: [{ $substr: ['$team1.logo', 0, 1] }, '/'] }, { $eq: [{ $substr: ['$team1.logo', 0, 1] }, 't'] }] },
                            then: { $concat: [`${constant.BASE_URL}`, '', '$team1.logo'] },
                            else: '$team1.logo',
                        }
                    }, `${constant.BASE_URL}team_image.png`]
                },
                team2logo: {
                    $ifNull: [{
                        $cond: {
                            if: { $or: [{ $eq: [{ $substr: ['$team2.logo', 0, 1] }, '/'] }, { $eq: [{ $substr: ['$team2.logo', 0, 1] }, 't'] }] },
                            then: { $concat: [`${constant.BASE_URL}`, '', '$team2.logo'] },
                            else: '$team2.logo',
                        }
                    }, `${constant.BASE_URL}team_image.png`]
                },
                start_date: { $ifNull: ['$match.start_date', '0000-00-00 00:00:00'] },
                status: {
                    $ifNull: [{
                        $cond: {
                            if: { $lt: ['$match.start_date', moment().format('YYYY-MM-DD HH:mm:ss')] },
                            then: 'closed',
                            else: 'opened',
                        },
                    },
                        'opened',
                    ],
                },
                launch_status: { $ifNull: ['$match.launch_status', ''] },
                final_status: { $ifNull: ['$match.final_status', ''] },
                series_name: { $ifNull: ['$series.name', ''] },
                type: { $ifNull: ['$match.fantasy_type', 'Cricket'] },
                series_id: { $ifNull: ['$series._id', ''] },
                winning_status: "pending",
                available_status: { $ifNull: [1, 1] },
                joinedcontest: { $ifNull: ['$count', 0] },
                team1Id: '$match.team1Id',
                team2Id: '$match.team2Id',

            }
        });
        const JoiendMatches = await JoinLeaugeModel.aggregate(aggPipe);
        // console.log('JoiendMatches -->', JoiendMatches)
        return JoiendMatches;
    }

    async quizGetmatchlist() {
        try {
            let matchpipe = [];
            let date = moment().format('YYYY-MM-DD HH:mm:ss');
            console.log(`date`, date);
            let EndDate = moment().add(25, 'days').format('YYYY-MM-DD HH:mm:ss');
            matchpipe.push({
                $match: { fantasy_type: 'overfantasy' }
            });
            matchpipe.push({
                $match: {
                    $and: [{ status: 'notstarted' }, { launch_status: 'launched' }, { start_date: { $gt: date } }, { start_date: { $lt: EndDate } }],
                    final_status: { $nin: ['IsCanceled', 'IsAbandoned'] }
                }
            });

            matchpipe.push({
                $lookup: { from: 'teams', localField: 'team1Id', foreignField: '_id', as: 'team1' }
            });
            matchpipe.push({
                $lookup: { from: 'teams', localField: 'team2Id', foreignField: '_id', as: 'team2' }
            });
            matchpipe.push({
                $lookup: { from: 'series', localField: 'series', foreignField: '_id', as: 'series' }
            });
            matchpipe.push({
                $match: { 'series.status': 'opened' }
            });
            matchpipe.push({
                $sort: {
                    start_date: 1,
                },
            });
            matchpipe.push({
                $project: {
                    _id: 0,
                    id: '$_id',
                    name: 1,
                    format: 1,
                    order_status: 1,
                    series: { $arrayElemAt: ['$series._id', 0] },
                    seriesname: { $arrayElemAt: ['$series.name', 0] },
                    team1name: { $arrayElemAt: ['$team1.short_name', 0] },
                    team2name: { $arrayElemAt: ['$team2.short_name', 0] },
                    teamfullname1: { $arrayElemAt: ['$team1.teamName', 0] },
                    teamfullname2: { $arrayElemAt: ['$team2.teamName', 0] },
                    matchkey: 1,
                    type: '$fantasy_type',
                    winnerstatus: '$final_status',
                    playing11_status: 1,
                    team1color: { $ifNull: [{ $arrayElemAt: ['$team1.color', 0] }, constant.TEAM_DEFAULT_COLOR.DEF1] },
                    team2color: { $ifNull: [{ $arrayElemAt: ['$team2.color', 0] }, constant.TEAM_DEFAULT_COLOR.DEF1] },
                    team1logo: {
                        $ifNull: [{
                            $cond: {
                                if: { $or: [{ $eq: [{ $substr: [{ $arrayElemAt: ['$team1.logo', 0] }, 0, 1] }, '/'] }, { $eq: [{ $substr: [{ $arrayElemAt: ['$team1.logo', 0] }, 0, 1] }, 't'] }] },
                                then: { $concat: [`${constant.BASE_URL}`, '', { $arrayElemAt: ['$team1.logo', 0] }] },
                                else: { $arrayElemAt: ['$team1.logo', 0] },
                            }
                        }, `${constant.BASE_URL}team_image.png`]
                    },
                    team2logo: {
                        $ifNull: [{
                            $cond: {
                                if: { $or: [{ $eq: [{ $substr: [{ $arrayElemAt: ['$team2.logo', 0] }, 0, 1] }, '/'] }, { $eq: [{ $substr: [{ $arrayElemAt: ['$team2.logo', 0] }, 0, 1] }, 't'] }] },
                                then: { $concat: [`${constant.BASE_URL}`, '', { $arrayElemAt: ['$team2.logo', 0] }] },
                                else: { $arrayElemAt: ['$team2.logo', 0] },
                            }
                        }, `${constant.BASE_URL}team_image.png`]
                    },
                    matchopenstatus: {
                        $cond: {
                            if: { $lte: ['$start_date', moment().format('YYYY-MM-DD HH:mm:ss')] },
                            then: 'closed',
                            else: 'opened',
                        },
                    },
                    time_start: '$start_date',
                    launch_status: 1,
                    locktime: EndDate,
                    createteamnumber: '1',
                    status: 'true',
                    info_center: 1,
                    team1Id: '$team1Id',
                    team2Id: '$team2Id',

                    match_order: 1
                },
            });
            matchpipe.push({
                $sort: {
                    match_order: 1
                }
            });


            const result = await listMatchesModel.aggregate(matchpipe);
            console.log('niteshhhh', result)
            result.sort(function (a, b) {
                return b.match_order
            });
            if (result.length > 0) return result

            else return [];
        } catch (error) {
            throw error;
        }
    }

    async quizNewjoinedmatches(req) {
        const aggPipe = [];
        aggPipe.push({
            $match: {
                userid: mongoose.Types.ObjectId(req.user._id),
            },
        });
        console.log('req.user._id', req.user._id);
        aggPipe.push({
            $group: {
                _id: '$matchkey',
                matchkey: { $first: '$matchkey' },
                joinedleaugeId: { $first: '$_id' },
                userid: { $first: '$userid' },
                matchchallengeid: { $first: '$challengeid' },
                jointeamid: { $first: '$teamid' },
            },
        });
        aggPipe.push({
            $lookup: {
                from: 'listmatches',
                localField: 'matchkey',
                foreignField: '_id',
                as: 'match',
            },
        });
        aggPipe.push({
            $unwind: {
                path: '$match',
            },
        });

        aggPipe.push({
            $match: {
                'match.fantasy_type': "overfantasy"
            },
        });
        aggPipe.push({
            $match: {
                $or: [{ 'match.final_status': 'pending' }, { 'match.final_status': 'IsReviewed' }],
            },
        });
        // --------------
        // aggPipe.push({
        //     $sort: {
        //         'match.start_date': -1,
        //     },
        // });
        // ------------
        aggPipe.push({
            $limit: 5,
        });
        aggPipe.push({
            $lookup: {
                from: 'joinedleauges',
                let: { matchkey: '$matchkey', userid: '$userid' },
                pipeline: [{
                    $match: {
                        $expr: {
                            $and: [{
                                $eq: ['$matchkey', '$$matchkey'],
                            },
                            {
                                $eq: ['$userid', '$$userid'],
                            },
                            ],
                        },
                    },
                },],
                as: 'joinedleauges',
            },
        });
        aggPipe.push({
            $unwind: {
                path: '$joinedleauges',
            },
        });
        aggPipe.push({
            $group: {
                _id: '$joinedleauges.challengeid',
                // matchchallengeid: { $first: '$joinedleauges.challengeid' },
                joinedleaugeId: { $first: '$joinedleauges._id' },
                matchkey: { $first: '$matchkey' },
                jointeamid: { $first: '$jointeamid' },
                userid: { $first: '$userid' },
                match: { $first: '$match' },
            },
        });
        // -----------------
        // aggPipe.push({
        //     $lookup: {
        //         from: 'matchchallenges',
        //         localField: '_id',
        //         foreignField: '_id',
        //         as: 'matchchallenge',
        //     },
        // });
        // aggPipe.push({
        //     $unwind: {
        //         path: '$matchchallenge',
        //         preserveNullAndEmptyArrays: true,
        //     },
        // });
        // --------------
        aggPipe.push({
            $group: {
                _id: '$matchkey',
                joinedleaugeId: { $first: '$joinedleaugeId' },
                matchkey: { $first: '$matchkey' },
                jointeamid: { $first: '$jointeamid' },
                match: { $first: '$match' },
                count: { $sum: 1 },
            },
        });
        aggPipe.push({
            $lookup: {
                from: 'series',
                localField: 'match.series',
                foreignField: '_id',
                as: 'series',
            },
        });
        aggPipe.push({
            $lookup: {
                from: 'teams',
                localField: 'match.team1Id',
                foreignField: '_id',
                as: 'team1',
            },
        });
        aggPipe.push({
            $lookup: {
                from: 'teams',
                localField: 'match.team2Id',
                foreignField: '_id',
                as: 'team2',
            },
        });
        aggPipe.push({
            $unwind: {
                path: '$series',
            },
        });
        aggPipe.push({
            $unwind: {
                path: '$team1',
            },
        });
        aggPipe.push({
            $unwind: {
                path: '$team2',
            },
        });
        aggPipe.push({
            $project: {
                _id: 0,
                matchkey: 1,
                matchname: { $ifNull: ['$match.name', ''] },
                team1ShortName: { $ifNull: ['$team1.short_name', ''] },
                team2ShortName: { $ifNull: ['$team2.short_name', ''] },
                team1fullname: { $ifNull: ['$team1.teamName', ''] },
                team2fullname: { $ifNull: ['$team2.teamName', ''] },
                team1color: { $ifNull: ['$team1.color', constant.TEAM_DEFAULT_COLOR.DEF1] },
                team2color: { $ifNull: ['$team2.color', constant.TEAM_DEFAULT_COLOR.DEF1] },
                start_date: "$match.start_date",
                fantasy_type: "$match.fantasy_type",
                team1logo: {
                    $ifNull: [{
                        $cond: {
                            if: { $or: [{ $eq: [{ $substr: ['$team1.logo', 0, 1] }, '/'] }, { $eq: [{ $substr: ['$team1.logo', 0, 1] }, 't'] }] },
                            then: { $concat: [`${constant.BASE_URL}`, '', '$team1.logo'] },
                            else: '$team1.logo',
                        }
                    }, `${constant.BASE_URL}team_image.png`]
                },
                team2logo: {
                    $ifNull: [{
                        $cond: {
                            if: { $or: [{ $eq: [{ $substr: ['$team2.logo', 0, 1] }, '/'] }, { $eq: [{ $substr: ['$team2.logo', 0, 1] }, 't'] }] },
                            then: { $concat: [`${constant.BASE_URL}`, '', '$team2.logo'] },
                            else: '$team2.logo',
                        }
                    }, `${constant.BASE_URL}team_image.png`]
                },
                start_date: { $ifNull: ['$match.start_date', '0000-00-00 00:00:00'] },
                status: {
                    $ifNull: [{
                        $cond: {
                            if: { $lt: ['$match.start_date', moment().format('YYYY-MM-DD HH:mm:ss')] },
                            then: 'closed',
                            else: 'opened',
                        },
                    },
                        'opened',
                    ],
                },
                launch_status: { $ifNull: ['$match.launch_status', ''] },
                final_status: { $ifNull: ['$match.final_status', ''] },
                series_name: { $ifNull: ['$series.name', ''] },
                type: { $ifNull: ['$match.fantasy_type', 'Cricket'] },
                series_id: { $ifNull: ['$series._id', ''] },
                available_status: { $ifNull: [1, 1] },
                joinedcontest: { $ifNull: ['$count', 0] },
                playing11_status: { $ifNull: ['$match.playing11_status', 1] },
                team1Id: '$match.team1Id',
                team2Id: '$match.team2Id',
            }
        });
        console.log("------------------moment().format('YYYY-MM-DD HH:mm:ss')----------------------------------", moment().format('YYYY-MM-DD HH:mm:ss'))
        aggPipe.push({
            $match: {
                start_date: { $gt: moment().format('YYYY-MM-DD HH:mm:ss') }
            }
        })
        const JoiendMatches = await JoinLeaugeModel.aggregate(aggPipe);

        if (JoiendMatches.length > 0) {
            return {
                message: 'User Joiend latest 5 Upcoming and live match data..',
                status: true,
                data: JoiendMatches
            };
        } else {
            return {
                message: 'No Data Found..',
                status: false,
                data: []
            };
        }
    }

    async quizAllCompletedMatches(req) {
        try {
            console.log("----------req.user._id--------------", req.user._id)
            const aggPipe = [];
            aggPipe.push({
                $match: {
                    userid: mongoose.Types.ObjectId(req.user._id),
                },
            });
            aggPipe.push({
                $group: {
                    _id: '$matchkey',
                    matchkey: { $first: '$matchkey' },
                    joinedleaugeId: { $first: '$_id' },
                    userid: { $first: '$userid' },
                    matchchallengeid: { $first: '$challengeid' },
                    jointeamid: { $first: '$teamid' },
                }
            });
            aggPipe.push({
                $lookup: {
                    from: 'listmatches',
                    localField: 'matchkey',
                    foreignField: '_id',
                    as: 'match',
                },
            });
            aggPipe.push({
                $unwind: {
                    path: '$match',
                },
            });

            aggPipe.push({
                $match: {
                    'match.fantasy_type': "overfantasy"
                },
            });
            aggPipe.push({
                $match: { 'match.final_status': 'winnerdeclared' },
            });
            aggPipe.push({
                $sort: {
                    'match.start_date': -1,
                },
            });
            aggPipe.push({
                $lookup: {
                    from: 'finalresults',
                    let: { matchkey: '$matchkey' },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$$matchkey', '$matchkey'] },
                                    { $eq: ['$userid', mongoose.Types.ObjectId(req.user._id)] },
                                ],
                            },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            amount: { $sum: '$amount' },
                        },
                    },
                    ],
                    as: 'finalresultsTotalAmount',
                },
            });
            aggPipe.push({
                $unwind: { path: '$finalresultsTotalAmount' }
            });
            aggPipe.push({
                $lookup: {
                    from: 'joinedleauges',
                    let: { matchkey: '$matchkey', userid: '$userid' },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [{
                                    $eq: ['$matchkey', '$$matchkey'],
                                },
                                {
                                    $eq: ['$userid', '$$userid'],
                                },
                                ],
                            },
                        },
                    },],
                    as: 'joinedleauges',
                },
            });
            aggPipe.push({
                $unwind: {
                    path: '$joinedleauges',
                },
            });
            aggPipe.push({
                $lookup: {
                    from: 'matchruns',
                    localField: 'matchkey',
                    foreignField: 'matchkey',
                    as: 'winingData'
                }
            });
            aggPipe.push({
                $unwind: { path: "$winingData" }
            })
            aggPipe.push({
                $group: {
                    _id: '$joinedleauges.challengeid',
                    joinedleaugeId: { $first: '$joinedleauges._id' },
                    matchkey: { $first: '$matchkey' },
                    jointeamid: { $first: '$jointeamid' },
                    match: { $first: '$match' },
                    finalresultsTotalAmount: { $first: '$finalresultsTotalAmount' },
                    winingData: { $first: "$winingData" }
                },
            });
            aggPipe.push({
                $lookup: {
                    from: 'matchchallenges',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'matchchallenge',
                },
            });
            aggPipe.push({
                $unwind: {
                    path: '$matchchallenge',
                    preserveNullAndEmptyArrays: true,
                },
            });
            aggPipe.push({
                $group: {
                    _id: '$matchkey',
                    joinedleaugeId: { $first: '$joinedleaugeId' },
                    matchkey: { $first: '$matchkey' },
                    jointeamid: { $first: '$jointeamid' },
                    match: { $first: '$match' },
                    finalresultsTotalAmount: { $first: '$finalresultsTotalAmount' },
                    winingData: { $first: "$winingData" },
                    count: { $sum: 1 },
                },
            });
            aggPipe.push({
                $lookup: {
                    from: 'series',
                    localField: 'match.series',
                    foreignField: '_id',
                    as: 'series',
                },
            });
            aggPipe.push({
                $lookup: {
                    from: 'teams',
                    localField: 'match.team1Id',
                    foreignField: '_id',
                    as: 'team1',
                },
            });
            aggPipe.push({
                $lookup: {
                    from: 'teams',
                    localField: 'match.team2Id',
                    foreignField: '_id',
                    as: 'team2',
                },
            });
            aggPipe.push({
                $unwind: {
                    path: '$series',
                },
            });
            aggPipe.push({
                $unwind: {
                    path: '$team1',
                },
            });
            aggPipe.push({
                $unwind: {
                    path: '$team2',
                },
            });
            aggPipe.push({
                $project: {
                    _id: 0,
                    matchkey: 1,
                    matchname: { $ifNull: ['$match.name', ''] },
                    winning_status: { $ifNull: ["$winingData.winning_status", ""] },
                    team1ShortName: { $ifNull: ['$team1.short_name', ''] },
                    team2ShortName: { $ifNull: ['$team2.short_name', ''] },
                    team1fullname: { $ifNull: ['$team1.teamName', ''] },
                    team2fullname: { $ifNull: ['$team2.teamName', ''] },
                    team1color: { $ifNull: ['$team1.color', constant.TEAM_DEFAULT_COLOR.DEF1] },
                    team2color: { $ifNull: ['$team2.color', constant.TEAM_DEFAULT_COLOR.DEF1] },
                    team1logo: {
                        $ifNull: [{
                            $cond: {
                                if: { $or: [{ $eq: [{ $substr: ['$team1.logo', 0, 1] }, '/'] }, { $eq: [{ $substr: ['$team1.logo', 0, 1] }, 't'] }] },
                                then: { $concat: [`${constant.BASE_URL}`, '', '$team1.logo'] },
                                else: '$team1.logo',
                            }
                        }, `${constant.BASE_URL}team_image.png`]
                    },
                    team2logo: {
                        $ifNull: [{
                            $cond: {
                                if: { $or: [{ $eq: [{ $substr: ['$team2.logo', 0, 1] }, '/'] }, { $eq: [{ $substr: ['$team2.logo', 0, 1] }, 't'] }] },
                                then: { $concat: [`${constant.BASE_URL}`, '', '$team2.logo'] },
                                else: '$team2.logo',
                            }
                        }, `${constant.BASE_URL}team_image.png`]
                    },
                    start_date: { $ifNull: ['$match.start_date', '0000-00-00 00:00:00'] },
                    fantasy_type: "$match.fantasy_type",
                    status: {
                        $ifNull: [{
                            $cond: {
                                if: { $lt: ['$match.start_date', moment().format('YYYY-MM-DD HH:mm:ss')] },
                                then: 'closed',
                                else: 'opened',
                            },
                        },
                            'opened',
                        ],
                    },
                    totalWinningAmount: { $ifNull: ['$finalresultsTotalAmount.amount', 0] },
                    launch_status: { $ifNull: ['$match.launch_status', ''] },
                    final_status: { $ifNull: ['$match.final_status', ''] },
                    series_name: { $ifNull: ['$series.name', ''] },
                    type: { $ifNull: ['$match.fantasy_type', 'Cricket'] },
                    series_id: { $ifNull: ['$series._id', ''] },
                    available_status: { $ifNull: [1, 1] },
                    joinedcontest: { $ifNull: ['$count', 0] },
                }
            });
            // aggPipe.push({
            //     $match: {
            //         fantasy_type: req.fantasy_type
            //     }
            // })
            const JoiendMatches = await JoinLeaugeModel.aggregate(aggPipe);
            if (JoiendMatches.length > 0) {
                return {
                    message: 'User Joiend All Completed Matches Data..',
                    status: true,
                    data: JoiendMatches
                };
            } else {
                return {
                    message: 'No Data Found..',
                    status: false,
                    data: []
                };
            }
        } catch (error) {
            throw error;
        }
    }


    async checkForDuplicateTeam(joinlist, quizArray, teamnumber) {
        if (joinlist.length == 0) return true;
        for await (const list of joinlist) {
            const quizCount = await this.findArrayIntersection(quizArray, list.quiz);
            if (quizCount.length == quizArray.length) return false;
        }
        return true;
    }
    

    async findArrayIntersection(quizArray, previousQuiz) {
        const c = [];
        let j = 0,
            i = 0;
        let data = previousQuiz.map((value) => value.questionId.toString())
            for (i = 0; i < quizArray.length; ++i) {
                if (data.indexOf(quizArray[i]) != -1) {
                    c[j++] = quizArray[i];
            }
        }
        if (i >= quizArray.length) {
            return c;
        }
    }

    async getMatchTime(start_date) {
        const currentdate = new Date();
        const currentOffset = currentdate.getTimezoneOffset();
        const ISTOffset = 330; // IST offset UTC +5:30
        const ISTTime = new Date(currentdate.getTime() + (ISTOffset + currentOffset) * 60000);
        if (ISTTime >= start_date) {
            return false;
        } else {
            return true;
        }
    }

    //pointcount

    async pointcount(matchkey, teamid) {
        //overpointsModel
        //overMatchModel
        let totalpoint = 0;
        let totalpointarray = [];
        const pointcounts = await overMatchModel.find({ matchkey: matchkey, teamid: teamid })
        //  console.log("pointcounts",pointcounts.length)
        //pointcounts=JSON.parse(pointcounts)
        const jointeam = await JoinQuizTeamModel.findOne({ matchkey: matchkey })
        for await (let item of pointcounts) {
            //pointcounts.forEach( async(item)=>{
            totalpoint = 0;
            totalpoint = totalpoint + (item.runs) + (item.fours) + ((item.six) * 2) + ((item.wicket) * (-6)) + ((item.maiden_over) * (-2));
            //console.log("asdatotalpoint"+totalpoint)
            if (item.wicket >= 3)
                totalpoint = totalpoint + 3
            if (item.runs >= 6 && item.runs <= 10)
                totalpoint = totalpoint + 1
            if (item.runs >= 11 && item.runs <= 15)
                totalpoint = totalpoint + 2
            if (item.runs >= 16)
                totalpoint = totalpoint + 4
            //console.log("totalpoint"+totalpoint)
            totalpointarray.push(totalpoint);
            //console.log("totalpoint"+totalpoint)   

            await overMatchModel.updateOne({ matchkey: matchkey, teamid: teamid, over: item.over }, { total_points: totalpoint });

            await overpointsModel.updateOne({ matchkey: matchkey, teamid: teamid, over: item.over }, { total_points: totalpoint });

            //await JoinQuizTeamModel.updateMany({matchkey:matchkey,teamid:teamid,over:item.over},{total_points:totalpoint})


            console.log("item.over" + item.over, "totalpoint", totalpoint)
            for (let ele of (jointeam.overs || [])) {
                if (ele.teamid == teamid && ele.over == item.over && ele.MegaOver == 1) {
                    ele.points = 2 * totalpoint;
                    console.log("item.over", ele.over, "totalpoint", totalpoint)
                }
                else if (ele.teamid == teamid && ele.over == item.over) {
                    ele.points = totalpoint;
                    console.log("item.over", ele.over, "totalpoint", totalpoint)
                }
            }
            //console.log("jointeam.overs"+arr)
        }
        await JoinQuizTeamModel.updateOne({ matchkey: matchkey }, { $set: { overs: jointeam.overs } });
        //console.log("updatejointeam",updatejointeam)
        console.log("asas")
        return true;
    }

    // end pointcount


    ///overinformation


    async quizInformations(req) {
        try {
            const response = await axios({
                url: "https://rest.entitysport.com/v2/matches/60071/innings/1/commentary?token=8dac1e4f7ee5ce23c747d7216c1e66c0",
                method: "get",
            });
            console.log("responsefid", response.data.response.inning.fielding_team_id);
            // const { matchkey, teamid } = req.query;
            // let overData = [];



            // let over =
            // {
            //     "over": 0,
            //     "fours": 0,
            //     "six": 0,
            //     "wickets": 0,
            //     "maiden_over": 0,
            //     "runs": 0,
            // }
            // over.matchkey = matchkey;
            // over.teamid = teamid;

            // let overwicket, oversix, overfour, overmaiden;
            // let overExactinformation = [];
            // let oversinformation = [];
            // let supportive = [];

            // let rawdata = fs.readFileSync('D:\\overfantsy.json');
            // let student = JSON.parse(rawdata);

            // //student.response.commentaries.forEach(item=>{
            // for (let i = 0; i < student.response.commentaries.length; i++) {
            //     if (student.response.commentaries[i].event == "overend") {
            //         student.response.commentaries[i].overwicket = overwicket;

            //         supportive.push(student.response.commentaries[i]);
            //         oversinformation.push(supportive)
            //         supportive = [];
            //         overwicket = 0;

            //     }
            //     else {
            //         if (student.response.commentaries[i].event == "wicket")
            //             overwicket++;
            //         supportive.push(student.response.commentaries[i])
            //     }

            // }
            // //console.log("hii"+oversinformation)
            // oversinformation.forEach(item => {
            //     console.log("hii")
            //     item.forEach(item2 => {
            //         if (item2.six == true) {
            //             console.log("six")
            //             over.six++;
            //         }
            //         if (item2.four == true) {
            //             console.log("four")
            //             over.fours++;
            //         }
            //         if (item2.event == "overend") {
            //             console.log("overend")
            //             over.over = item2.over
            //             over.runs = item2.runs;
            //             over.wickets = item2.overwicket;

            //             if (over.runs == 0)
            //                 over.maiden_over = 1;

            //         }



            //     })

            //     overData.push(over);

            //     //console.log("over"+over)
            //     over =
            //     {
            //         "over": 0,
            //         "fours": 0,
            //         "six": 0,
            //         "wickets": 0,
            //         "maiden_over": 0,
            //         "runs": 0,

            //     }
            //     over.matchkey = matchkey;
            //     over.teamid = teamid;


            // })

            // const saveOverData = await overMatchModel.create(overData)
            // await overpointsModel.create(overData)
            // this.pointcount(matchkey, teamid);





            // return saveOverData

            // const response = await axios({
            // 	url: "https://rest.entitysport.com/v2/matches/60071/innings/1/commentary?token=8dac1e4f7ee5ce23c747d7216c1e66c0",
            // 	method: "get",
            // });
            //console.log(response.data);
        } catch (error) {
            throw error;
        }
    }
    //overinformation

   
    //quizViewteam
    async updateIsViewedForBoatTeam(jointeamid) {
        try {
            await JoinQuizTeamModel.findOneAndUpdate({
                _id: mongoose.Types.ObjectId(jointeamid),
                user_type: 1,
                is_viewed: false
            }, { is_viewed: true });
            return true;
        } catch (error) {
            throw error;
        }
    }
    //quizLivematches
    async quizLivematches(req) {
        const aggPipe = [];
        aggPipe.push({
            $match: {
                userid: mongoose.Types.ObjectId(req.user._id),
            },
        });
        aggPipe.push({
            $group: {
                _id: '$matchkey',
                matchkey: { $first: '$matchkey' },
                joinedleaugeId: { $first: '$_id' },
                userid: { $first: '$userid' },
                matchchallengeid: { $first: '$challengeid' },
                jointeamid: { $first: '$teamid' },
            },
        });
        aggPipe.push({
            $lookup: {
                from: 'listmatches',
                localField: 'matchkey',
                foreignField: '_id',
                as: 'match',
            },
        });
        aggPipe.push({
            $unwind: {
                path: '$match',
            },
        });
        aggPipe.push({
            $match: {
                'match.fantasy_type': "quiz"
            },
        });
        aggPipe.push({
            $match: {
                $or: [{ 'match.final_status': 'pending' }, { 'match.final_status': 'IsReviewed' }],
            },
        });



        aggPipe.push({
            $lookup: {
                from: 'joinedleauges',
                let: { matchkey: '$matchkey', userid: '$userid' },
                pipeline: [{
                    $match: {
                        $expr: {
                            $and: [{
                                $eq: ['$matchkey', '$$matchkey'],
                            },
                            {
                                $eq: ['$userid', '$$userid'],
                            },
                            ],
                        },
                    },
                },],
                as: 'joinedleauges',
            },
        });
        aggPipe.push({
            $unwind: {
                path: '$joinedleauges',
            },
        });
        aggPipe.push({
            $group: {
                _id: '$joinedleauges.challengeid',
                // matchchallengeid: { $first: '$joinedleauges.challengeid' },
                joinedleaugeId: { $first: '$joinedleauges._id' },
                matchkey: { $first: '$matchkey' },
                jointeamid: { $first: '$jointeamid' },
                userid: { $first: '$userid' },
                match: { $first: '$match' },
            },
        });
        // aggPipe.push({
        //     $lookup: {
        //         from: 'matchchallenges',
        //         localField: '_id',
        //         foreignField: '_id',
        //         as: 'matchchallenge',
        //     },
        // });
        // aggPipe.push({
        //     $unwind: {
        //         path: '$matchchallenge',
        //         preserveNullAndEmptyArrays: true,
        //     },
        // });
        aggPipe.push({
            $group: {
                _id: '$matchkey',
                joinedleaugeId: { $first: '$joinedleaugeId' },
                matchkey: { $first: '$matchkey' },
                jointeamid: { $first: '$jointeamid' },
                match: { $first: '$match' },
                count: { $sum: 1 },
            },
        });
        aggPipe.push({
            $lookup: {
                from: 'series',
                localField: 'match.series',
                foreignField: '_id',
                as: 'series',
            },
        });
        aggPipe.push({
            $lookup: {
                from: 'teams',
                localField: 'match.team1Id',
                foreignField: '_id',
                as: 'team1',
            },
        });
        aggPipe.push({
            $lookup: {
                from: 'teams',
                localField: 'match.team2Id',
                foreignField: '_id',
                as: 'team2',
            },
        });
        aggPipe.push({
            $unwind: {
                path: '$series',
            },
        });
        aggPipe.push({
            $unwind: {
                path: '$team1',
            },
        });
        aggPipe.push({
            $unwind: {
                path: '$team2',
            },
        });
        let today = new Date();
        today.setHours(today.getHours() + 5);
        today.setMinutes(today.getMinutes() + 30);
        aggPipe.push({
            $addFields: {
                date: {
                    $dateFromString: {
                        dateString: '$match.start_date',
                        timezone: "-00:00"
                    }
                },
                curDate: today
            }
        });
        aggPipe.push({
            $match: {
                $expr: {
                    $and: [{
                        $lte: ['$date', today],
                    },
                    ],
                },
            }
        });

        aggPipe.push({
            $sort: {
                'date': -1,
            },
        });
        aggPipe.push({
            $project: {
                _id: 0,
                matchkey: 1,
                matchname: { $ifNull: ['$match.name', ''] },
                team1ShortName: { $ifNull: ['$team1.short_name', ''] },
                team2ShortName: { $ifNull: ['$team2.short_name', ''] },
                team1fullname: { $ifNull: ['$team1.teamName', ''] },
                team2fullname: { $ifNull: ['$team2.teamName', ''] },
                team1color: { $ifNull: ['$team1.color', constant.TEAM_DEFAULT_COLOR.DEF1] },
                team2color: { $ifNull: ['$team2.color', constant.TEAM_DEFAULT_COLOR.DEF1] },
                start_date: "$match.start_date",
                team1logo: {
                    $ifNull: [{
                        $cond: {
                            if: { $or: [{ $eq: [{ $substr: ['$team1.logo', 0, 1] }, '/'] }, { $eq: [{ $substr: ['$team1.logo', 0, 1] }, 't'] }] },
                            then: { $concat: [`${constant.BASE_URL}`, '', '$team1.logo'] },
                            else: '$team1.logo',
                        }
                    }, `${constant.BASE_URL}team_image.png`]
                },
                team2logo: {
                    $ifNull: [{
                        $cond: {
                            if: { $or: [{ $eq: [{ $substr: ['$team2.logo', 0, 1] }, '/'] }, { $eq: [{ $substr: ['$team2.logo', 0, 1] }, 't'] }] },
                            then: { $concat: [`${constant.BASE_URL}`, '', '$team2.logo'] },
                            else: '$team2.logo',
                        }
                    }, `${constant.BASE_URL}team_image.png`]
                },
                start_date: { $ifNull: ['$match.start_date', '0000-00-00 00:00:00'] },
                start_date1: { $toDate: { $ifNull: ['$match.start_date', '0000-00-00 00:00:00'] } },
                status: {
                    $ifNull: [{
                        $cond: {
                            if: { $lt: ['$match.start_date', moment().format('YYYY-MM-DD HH:mm:ss')] },
                            then: 'closed',
                            else: 'opened',
                        },
                    },
                        'opened',
                    ],
                },
                launch_status: { $ifNull: ['$match.launch_status', ''] },
                final_status: { $ifNull: ['$match.final_status', ''] },
                series_name: { $ifNull: ['$series.name', ''] },
                type: { $ifNull: ['$match.fantasy_type', 'Cricket'] },
                series_id: { $ifNull: ['$series._id', ''] },
                available_status: { $ifNull: [1, 1] },
                joinedcontest: { $ifNull: ['$count', 0] },
                playing11_status: { $ifNull: ['$playing11_status', 1] }
            }
        });
        aggPipe.push({
            $limit: 5,
        });
        const JoiendMatches = await JoinLeaugeModel.aggregate(aggPipe);
        if (JoiendMatches.length > 0) {
            return {
                message: 'User Joiend latest 5 Upcoming and live match data..',
                status: true,
                data: JoiendMatches
            };
        } else {
            return {
                message: 'No Data Found..',
                status: false,
                data: []
            };
        }
    }


    async quizViewTeam(req) {
        try {
            let finalData = [];
            
            finalData = await JoinQuizTeamModel.findOne({
                _id: req.query.jointeamid,
                matchkey: req.query.matchkey,
                teamnumber: req.query.teamnumber
            });
            finalData._doc.jointeamid = finalData._id;
            return {
                message: 'User Perticular Team Data',
                status: true,
                data: finalData
            }
        } catch (error) {
            throw error;
        }
    }


    async quizPointCalculator(matchkey) {
        try {
            let joinData = await JoinQuizTeamModel.find({ matchkey: matchkey })
            let quizData = await quizModel.find({ matchkey_id: matchkey })
            if (joinData.length == 0) {
                return {
                    message: "Team does not exist",
                    status: false,
                    data:{}
                }
            }
            if (quizData.length == 0) {
                return {
                    message: " Quiz not found",
                    status: false,
                    data:{}
                }
            }
            let data;
            for (let join_data of joinData) {
                for (let join_quiz_data of join_data.quiz) {
                    for (let quiz_data of quizData) {
                        if (quiz_data._id.toString() === join_quiz_data.questionId.toString()) {
                            if (quiz_data.answer === join_quiz_data.answer) {
                             data = await JoinQuizTeamModel.findOneAndUpdate({ matchkey: join_data.matchkey, "quiz.questionId": quiz_data._id}, { "quiz.$.point": quiz_data.point },{new:true})
                        }
                    }
                }
            }
            return {
                message: "Quiz Point added successfully",
                status: true,
                data: joinData
            }
            }
        } catch (error) {
            throw error;
        }
    }

    async quizrefundprocess(challengeid, entryfee, matchkey, reason) {
        console.log("-------------------------------------refundprocess-----------------------------")
        let joinLeagues = await JoinLeaugeModel.find({
            matchkey: mongoose.Types.ObjectId(matchkey),
            challengeid: mongoose.Types.ObjectId(challengeid),
        });
        if (joinLeagues.length > 0) {
            for (let league of joinLeagues) {
                let leaugestransaction = league.leaugestransaction;
                let refund_data = await refundModel.findOne({ joinid: mongoose.Types.ObjectId(league._id) });
                if (!refund_data) {
                    const user = await userModel.findOne({ _id: leaugestransaction.user_id }, { userbalance: 1 });
                    if (user) {
                        const bonus = parseFloat(user.userbalance.bonus.toFixed(2));
                        const balance = parseFloat(user.userbalance.balance.toFixed(2));
                        const winning = parseFloat(user.userbalance.winning.toFixed(2));
                        const totalBalance = bonus + balance + winning;
                        const userObj = {
                            'userbalance.balance': balance + leaugestransaction.balance,
                            'userbalance.bonus': bonus + leaugestransaction.bonus,
                            'userbalance.winning': winning + leaugestransaction.winning,
                        };
                        let randomStr = randomstring.generate({
                            length: 4,
                            charset: 'alphabetic',
                            capitalization: 'uppercase'
                        });
                        console.log("------randomStr-------2", randomStr)
                        let transaction_id = `${constant.APP_SHORT_NAME}-${Date.now()}-${randomStr}`;
                        let refundData = {
                            userid: leaugestransaction.user_id,
                            amount: entryfee,
                            joinid: league._id,
                            challengeid: league.challengeid,
                            matchkey: matchkey,
                            reason: reason,
                            transaction_id: transaction_id
                        };
                        const transactiondata = {
                            type: 'Refund',
                            amount: entryfee,
                            total_available_amt: totalBalance + entryfee,
                            transaction_by: constant.APP_SHORT_NAME,
                            challengeid: challengeid,
                            userid: leaugestransaction.user_id,
                            paymentstatus: constant.PAYMENT_STATUS_TYPES.CONFIRMED,
                            bal_bonus_amt: bonus + leaugestransaction.bonus,
                            bal_win_amt: winning + leaugestransaction.winning,
                            bal_fund_amt: balance + leaugestransaction.balance,
                            bonus_amt: leaugestransaction.bonus,
                            win_amt: leaugestransaction.winning,
                            addfund_amt: leaugestransaction.balance,
                            transaction_id: transaction_id
                        };
                        await Promise.all([
                            userModel.findOneAndUpdate({ _id: leaugestransaction.user_id }, userObj, { new: true }),
                            refundModel.create(refundData),
                            TransactionModel.create(transactiondata)
                        ]);
                    }
                }
            }
        }
        return true;
    }

    async quiz_refund_amount(req) {
        try {
        console.log("-------------------------------------quizrefundAmount-------------------------")
        const currentDate = moment().format('YYYY-MM-DD HH:mm:ss');
        let match_time = moment().add(10, 'm').format('YYYY-MM-DD HH:mm:ss');
      
        let pipeline = [];
        pipeline.push({
            $match: {
                // _id:mongoose.Types.ObjectId('63fd749179494aff832d5325'),
                // fantasy_type: "Cricket",
                // start_date: { $lte: match_time },
                launch_status: 'launched',
                final_status: { $nin: ["winnerdeclared", "IsCanceled"] }
            }
        });
        // --------------
        let today= new Date();
        today.setHours(today.getHours() + 5);
        today.setMinutes(today.getMinutes() + 30);
        console.log("--today----",today)
        // let lastDate = today.setMinutes(today.getMinutes() + 10);
        // console.log("--today-+10---",today)
        pipeline.push({
            $addFields: {
                date: {
                    $dateFromString: {
                        dateString: '$start_date',
                        timezone: "-00:00"
                    }
                },
                curDate: today
            }
        });
        pipeline.push({
            $match:{
                $expr: {
                    $and: [{
                        $lte: ['$date','$curDate'],
                        },
                        // {
                        //     $lte: ['$date',lastDate ],
                        // },
                    ],
                },
            }
        });
        // --------------
        pipeline.push({
            $lookup: {
                from: 'matchchallenges',
                let: { matckey: "$_id" },
                pipeline: [{
                    $match: {
                        status: { $ne: "canceled" },
                        $expr: {
                            $and: [
                                { $eq: ["$matchkey", "$$matckey"] },
                            ],
                        },
                    },
                },],
                as: 'matchChallengesData'
            }
        })
        let listmatches = await listMatchesModel.aggregate(pipeline);
        if (listmatches.length > 0) {
            for (let match of listmatches) {
                if (match.matchChallengesData.length > 0) {
                    for (let value1 of match.matchChallengesData) {
                        let data = {};
                        if (value1.maximum_user > value1.joinedusers) {
                            if (value1.confirmed_challenge == 0) {
                                let getresponse = await this.quizrefundprocess(value1._id, value1.entryfee, match._id, 'challenge cancel');
                                if (getresponse == true) {
                                    await matchchallengesModel.updateOne({ _id: mongoose.Types.ObjectId(value1._id) }, {
                                        $set: {
                                            status: 'canceled'
                                        }
                                    });
                                }
                            }
                        }
                        if (value1.pricecard_type == 'Percentage') {
                            let joinedUsers = await JoinLeaugeModel.find({
                                matchkey: mongoose.Types.ObjectId(match.matchkey),
                                challengeid: mongoose.Types.ObjectId(value1._id),
                            }).count();
                            if (value1.confirmed_challenge == 1 && joinedUsers == 1) {
                                let getresponse = await this.quizrefundprocess(value1._id, value1.entryfee, match.matchkey, 'challenge cancel');
                                if (getresponse == true) {
                                    data['status'] = 'canceled';
                                    await matchchallengesModel.updateOne({ _id: mongoose.Types.ObjectId(value1._id) }, {
                                        $set: {
                                            status: 'canceled'
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
            }
         }
         return {
            message: 'Refund amount successfully ',
            success: true,
        }
        } catch (error) {
            throw error;
        }
    }


    async findJoinLeaugeExist(matchkey, userId, teamId, challengeDetails) {
        if (!challengeDetails || challengeDetails == null || challengeDetails == undefined) return 4;

        const joinedLeauges = await JoinLeaugeModel.find({
            matchkey: matchkey,
            challengeid: challengeDetails._id,
            userid: userId,
        });
        console.log(joinedLeauges)
        if (joinedLeauges.length == 0) return 1;
        if (joinedLeauges.length > 0) {
            if (challengeDetails.multi_entry == 0) {
                return { message: 'Contest Already joined', status: false, data: {} };
            } else {
                if (joinedLeauges.length >= challengeDetails.team_limit) {
                    return { message: 'You cannot join with more teams now.', status: false, data: {} };
                } else {
                    const joinedLeaugesCount = joinedLeauges.filter(item => {
                        return item.teamid.toString() === teamId;
                    });
                    if (joinedLeaugesCount.length) return { message: 'Team already joined', status: false, data: {} };
                    else return 2;
                }
            }
        }
    }

    async findUsableBonusMoney(challengeDetails, bonus, winning, balance) {
        if (challengeDetails.is_private == 1 && challengeDetails.is_bonus != 1)
            return { bonus: bonus, cons_bonus: 0, reminingfee: challengeDetails.entryfee };
        let totalChallengeBonus = 0;
        totalChallengeBonus = (challengeDetails.bonus_percentage / 100) * challengeDetails.entryfee;

        const finduserbonus = bonus;
        let findUsableBalance = winning + balance;
        let bonusUseAmount = 0;
        if (finduserbonus >= totalChallengeBonus)
            (findUsableBalance += totalChallengeBonus), (bonusUseAmount = totalChallengeBonus);
        else findUsableBalance += bonusUseAmount = finduserbonus;
        if (findUsableBalance < challengeDetails.entryfee) return false;
        if (bonusUseAmount >= challengeDetails.entryfee) {
            return {
                bonus: finduserbonus - challengeDetails.entryfee,
                cons_bonus: challengeDetails.entryfee || 0,
                reminingfee: 0,
            };
        } else {
            return {
                bonus: finduserbonus - bonusUseAmount,
                cons_bonus: bonusUseAmount,
                reminingfee: challengeDetails.entryfee - bonusUseAmount,
            };
        }
    }

    async findUsableBalanceMoney(resultForBonus, balance) {
        if (balance >= resultForBonus.reminingfee)
            return {
                balance: balance - resultForBonus.reminingfee,
                cons_amount: resultForBonus.reminingfee,
                reminingfee: 0,
            };
        else
            return { balance: 0, cons_amount: balance, reminingfee: resultForBonus.reminingfee - balance };
    }

    async findUsableWinningMoney(resultForBalance, winning) {
        if (winning >= resultForBalance.reminingfee) {
            return {
                winning: winning - resultForBalance.reminingfee,
                cons_win: resultForBalance.reminingfee,
                reminingfee: 0,
            };
        } else { return { winning: 0, cons_win: winning, reminingfee: resultForBalance.reminingfee - winning }; }
    }

    async joinQuizContest(req) {
        try {
            const { matchchallengeid, jointeamid } = req.body;
            let totalchallenges = 0,
                totalmatches = 0,
                totalseries = 0,
                joinedMatch = 0,
                joinedSeries = 0,
                aggpipe = [];


            aggpipe.push({
                $match: { _id: mongoose.Types.ObjectId(matchchallengeid) }
            });

            aggpipe.push({
                $lookup: {
                    from: 'listmatches',
                    localField: 'matchkey',
                    foreignField: '_id',
                    as: 'listmatch'
                }
            });
            
            const matchchallengesData = await matchchallengesModel.aggregate(aggpipe);
            let listmatchId = matchchallengesData[0].listmatch[0]._id;
            let matchchallengesDataId = matchchallengesData[0]._id;
            let matchchallenge = matchchallengesData[0];
            let seriesId = matchchallengesData[0].listmatch[0].series;
            let matchStartDate = matchchallengesData[0].listmatch[0].start_date;

            if (matchchallengesData.length == 0) {
                return { message: 'Match Not Found', success: false, data: {} };
            }
            const matchTime = await matchServices.getMatchTime(matchStartDate);
            if (matchTime === false) {
                return {
                    message: 'Match has been closed, You cannot join leauge now.', 
                    status: false,
                    data: {}
                }
            }
            const jointeamids = jointeamid.split(',');

            const jointeamsCount = await JoinQuizTeamModel.find({ _id: { $in: jointeamids } }).countDocuments();
            if (jointeamids.length != jointeamsCount) return { message: 'Invalid Team', status: false, data: {} }

            const user = await userModel.findOne({ _id: req.user._id }, { userbalance: 1 });
            if (!user || !user.userbalance) return { message: 'Insufficient balance', status: false, data: {} };

            const bonus = parseFloat(user.userbalance.bonus.toFixed(2));
            const balance = parseFloat(user.userbalance.balance.toFixed(2));
            const winning = parseFloat(user.userbalance.winning.toFixed(2));
            const totalBalance = bonus + balance + winning;
            let i = 0,
                count = 0,
                mainbal = 0,
                mainbonus = 0,
                mainwin = 0,
                tranid = '';
            for (const jointeamId of jointeamids) {
                const jointeamsData = await JoinQuizTeamModel.findOne({ _id: jointeamId })
                // console.log(`-------------IN ${i} LOOP--------------------`);
                i++;
                const result = await this.findJoinLeaugeExist(listmatchId, req.user._id, jointeamId, matchchallenge);

                if (result != 1 && result != 2 && i > 1) {

                    const userObj = {
                        'userbalance.balance': balance - mainbal,
                        'userbalance.bonus': bonus - mainbonus,
                        'userbalance.winning': winning - mainwin,
                        $inc: {
                            totalchallenges: totalchallenges,
                            totalmatches: totalmatches,
                            totalseries: totalseries,
                        },
                    };
                    let randomStr = randomstring.generate({
                        length: 4,
                        charset: 'alphabetic',
                        capitalization: 'uppercase'
                    });

                    const transactiondata = {
                        type: 'Contest Joining Fee',
                        contestdetail: `${matchchallenge.entryfee}-${count}`,
                        amount: matchchallenge.entryfee * count,
                        total_available_amt: totalBalance - matchchallenge.entryfee * count,
                        transaction_by: constant.TRANSACTION_BY.WALLET,
                        challengeid: matchchallengeid,
                        userid: req.user._id,
                        paymentstatus: constant.PAYMENT_STATUS_TYPES.CONFIRMED,
                        bal_bonus_amt: bonus - mainbonus,
                        bal_win_amt: winning - mainwin,
                        bal_fund_amt: balance - mainbal,
                        cons_amount: mainbal,
                        cons_bonus: mainbonus,
                        cons_win: mainwin,
                        transaction_id: tranid != '' ? tranid : `${constant.APP_SHORT_NAME}-${Date.now()}-${randomStr}`,
                    };

                    await Promise.all([
                        userModel.findOneAndUpdate({ _id: req.user._id }, userObj, { new: true }),
                        TransactionModel.create(transactiondata)
                    ]);
                    return result;
                } else if (result != 1 && result != 2) {

                    return result;
                }
                const resultForBonus = await this.findUsableBonusMoney(
                    matchchallenge,
                    bonus - mainbonus,
                    winning - mainwin,
                    balance - mainbal
                );
                   console.log('resultForBonus',resultForBonus);
                if (resultForBonus == false) {

                    if (i > 1) {
                        const userObj = {
                            'userbalance.balance': balance - mainbal,
                            'userbalance.bonus': bonus - mainbonus,
                            'userbalance.winning': winning - mainwin,
                            $inc: {
                                totalchallenges: totalchallenges,
                                totalmatches: totalmatches,
                                totalseries: totalseries,
                            },
                        };
                        let randomStr = randomstring.generate({
                            length: 4,
                            charset: 'alphabetic',
                            capitalization: 'uppercase'
                        });
                        const transactiondata = {
                            type: 'Contest Joining Fee',
                            contestdetail: `${matchchallenge.entryfee}-${count}`,
                            amount: matchchallenge.entryfee * count,
                            total_available_amt: totalBalance - matchchallenge.entryfee * count,
                            transaction_by: constant.TRANSACTION_BY.WALLET,
                            challengeid: matchchallengeid,
                            userid: req.user._id,
                            paymentstatus: constant.PAYMENT_STATUS_TYPES.CONFIRMED,
                            bal_bonus_amt: bonus - mainbonus,
                            bal_win_amt: winning - mainwin,
                            bal_fund_amt: balance - mainbal,
                            cons_amount: mainbal,
                            cons_bonus: mainbonus,
                            cons_win: mainwin,
                            transaction_id: tranid != '' ? tranid : `${constant.APP_SHORT_NAME}-${Date.now()}-${randomStr}`,
                        };
                        await Promise.all([
                            userModel.findOneAndUpdate({ _id: req.user._id }, userObj, { new: true }),
                            TransactionModel.create(transactiondata)
                        ]);
                    }
                    return { message: 'Insufficient balance', status: false, data: {} };
                }
                const resultForBalance = await this.findUsableBalanceMoney(resultForBonus, balance - mainbal);
                const resultForWinning = await this.findUsableWinningMoney(resultForBalance, winning - mainwin);
                // console.log(`---------------------3RD IF--BEFORE------${resultForWinning}---------`);
                if (resultForWinning.reminingfee > 0) {
                    // console.log(`---------------------3RD IF--------${resultForWinning}---------`);
                    if (i > 1) {
                        const userObj = {
                            'userbalance.balance': balance - mainbal,
                            'userbalance.bonus': bonus - mainbonus,
                            'userbalance.winning': winning - mainwin,
                            $inc: {
                                totalchallenges: totalchallenges,
                                totalmatches: totalmatches,
                                totalseries: totalseries,
                            },
                        };
                        let randomStr = randomstring.generate({
                            length: 4,
                            charset: 'alphabetic',
                            capitalization: 'uppercase'
                        });

                        const transactiondata = {
                            type: 'Contest Joining Fee',
                            contestdetail: `${matchchallenge.entryfee}-${count}`,
                            amount: matchchallenge.entryfee * count,
                            total_available_amt: totalBalance - matchchallenge.entryfee * count,
                            transaction_by: constant.TRANSACTION_BY.WALLET,
                            challengeid: matchchallengeid,
                            userid: req.user._id,
                            paymentstatus: constant.PAYMENT_STATUS_TYPES.CONFIRMED,
                            bal_bonus_amt: bonus - mainbonus,
                            bal_win_amt: winning - mainwin,
                            bal_fund_amt: balance - mainbal,
                            cons_amount: mainbal,
                            cons_bonus: mainbonus,
                            cons_win: mainwin,
                            transaction_id: tranid != '' ? tranid : `${constant.APP_SHORT_NAME}-${Date.now()}-${randomStr}`,
                        };
                        await Promise.all([
                            userModel.findOneAndUpdate({ _id: req.user._id }, userObj, { new: true }),
                            TransactionModel.create(transactiondata)
                        ]);
                    }
                    return { message: 'Insufficient balance', status: false, data: {} };
                }
                let randomStr = randomstring.generate({
                    length: 4,
                    charset: 'alphabetic',
                    capitalization: 'uppercase'
                });

                const coupon = randomstring.generate({ charset: 'alphanumeric', length: 4, });
                tranid = `${constant.APP_SHORT_NAME}-${Date.now()}-${randomStr}`;
                let referCode = `${constant.APP_SHORT_NAME}-${Date.now()}${coupon}`;
                if (result == 1) {

                    joinedMatch = await JoinLeaugeModel.find({ matchkey: listmatchId, userid: req.user._id }).limit(1).count();
                    if (joinedMatch == 0) {
                        joinedSeries = await JoinLeaugeModel.find({ seriesid: seriesId, userid: req.user._id }).limit(1).count();
                    }
                }
                const joinedLeauges = await JoinLeaugeModel.find({ challengeid: matchchallengesDataId }).count();
                const joinUserCount = joinedLeauges + 1;
                if (matchchallenge.contest_type == 'Amount' && joinUserCount > matchchallenge.maximum_user) {
                    if (i > 1) {
                        const userObj = {
                            'userbalance.balance': balance - mainbal,
                            'userbalance.bonus': bonus - mainbonus,
                            'userbalance.winning': winning - mainwin,
                            $inc: {
                                totalchallenges: totalchallenges,
                                totalmatches: totalmatches,
                                totalseries: totalseries,
                            },
                        };
                        let randomStr = randomstring.generate({
                            length: 4,
                            charset: 'alphabetic',
                            capitalization: 'uppercase'
                        });
                        const transactiondata = {
                            type: 'Contest Joining Fee',
                            contestdetail: `${matchchallenge.entryfee}-${count}`,
                            amount: matchchallenge.entryfee * count,
                            total_available_amt: totalBalance - matchchallenge.entryfee * count,
                            transaction_by: constant.TRANSACTION_BY.WALLET,
                            challengeid: matchchallengeid,
                            userid: req.user._id,
                            paymentstatus: constant.PAYMENT_STATUS_TYPES.CONFIRMED,
                            bal_bonus_amt: bonus - mainbonus,
                            bal_win_amt: winning - mainwin,
                            bal_fund_amt: balance - mainbal,
                            cons_amount: mainbal,
                            cons_bonus: mainbonus,
                            cons_win: mainwin,
                            transaction_id: tranid != '' ? tranid : `${constant.APP_SHORT_NAME}-${Date.now()}-${randomStr}`,
                        };
                        await Promise.all([
                            userModel.findOneAndUpdate({ _id: req.user._id }, userObj, { new: true }),
                            TransactionModel.create(transactiondata)
                        ]);
                    }
                    return { message: 'League is Closed', status: false, data: {} };
                }
                const joinLeaugeResult = await JoinLeaugeModel.create({
                    userid: req.user._id,
                    challengeid: matchchallengesDataId,
                    teamid: jointeamId,
                    matchkey: listmatchId,
                    seriesid: seriesId,
                    transaction_id: tranid,
                    refercode: referCode,
                    leaugestransaction: {
                        user_id: req.user._id,
                        bonus: resultForBonus.cons_bonus,
                        balance: resultForBalance.cons_amount,
                        winning: resultForWinning.cons_win,
                    },
                });
                await leaderBoardModel.create({
                    userId: req.user._id,
                    challengeid: matchchallengesDataId,
                    teamId: jointeamId,
                    matchkey: listmatchId,
                    user_team: user.team,
                    teamnumber: jointeamsData.teamnumber,
                    joinId: joinLeaugeResult._id
                });
                const joinedLeaugesCount = await JoinLeaugeModel.find({ challengeid: matchchallengesDataId }).count();
                if (result == 1) {
                    totalchallenges = 1;
                    if (joinedMatch == 0) {
                        totalmatches = 1;
                        if (joinedMatch == 0 && joinedSeries == 0) {
                            totalseries = 1;
                        }
                    }
                }
                count++;

                if (joinLeaugeResult._id) {
                    mainbal = mainbal + resultForBalance.cons_amount;
                    mainbonus = mainbonus + resultForBonus.cons_bonus;
                    mainwin = mainwin + resultForWinning.cons_win;
                    if (matchchallenge.contest_type == 'Amount' && joinedLeaugesCount == matchchallenge.maximum_user && matchchallenge.is_running != 1) {
                        // console.log(`---------------------8TH IF--------${matchchallenge.is_running}---------`);
                        await matchchallengesModel.findOneAndUpdate({ matchkey: listmatchId, _id: mongoose.Types.ObjectId(matchchallengeid) }, {
                            status: 'closed',
                            joinedusers: joinedLeaugesCount,
                        }, { new: true });
                    } else {
                        // console.log(`---------------------8TH IF/ELSE--------${matchchallenge.is_running}---------`);
                        const gg = await matchchallengesModel.findOneAndUpdate({ matchkey: listmatchId, _id: mongoose.Types.ObjectId(matchchallengeid) }, {
                            status: 'opened',
                            joinedusers: joinedLeaugesCount,
                        }, { new: true });
                    }
                } else
                    await matchchallengesModel.findOneAndUpdate({ matchkey: listmatchId, _id: mongoose.Types.ObjectId(matchchallengeid) }, {
                        status: 'opened',
                        joinedusers: joinedLeaugesCount,
                    }, { new: true });
                if (i == jointeamids.length) {
                    // console.log(`---------------------9TH IF--------${i}---------`);
                    const userObj = {
                        'userbalance.balance': balance - mainbal,
                        'userbalance.bonus': bonus - mainbonus,
                        'userbalance.winning': winning - mainwin,
                        $inc: {
                            totalchallenges: totalchallenges,
                            totalmatches: totalmatches,
                            totalseries: totalseries,
                        },
                    };
                    let randomStr = randomstring.generate({
                        length: 4,
                        charset: 'alphabetic',
                        capitalization: 'uppercase'
                    });
                    const transactiondata = {
                        type: 'Contest Joining Fee',
                        contestdetail: `${matchchallenge.entryfee}-${count}`,
                        amount: matchchallenge.entryfee * count,
                        total_available_amt: totalBalance - matchchallenge.entryfee * count,
                        transaction_by: constant.TRANSACTION_BY.WALLET,
                        challengeid: matchchallengeid,
                        userid: req.user._id,
                        paymentstatus: constant.PAYMENT_STATUS_TYPES.CONFIRMED,
                        bal_bonus_amt: bonus - mainbonus,
                        bal_win_amt: winning - mainwin,
                        bal_fund_amt: balance - mainbal,
                        cons_amount: mainbal,
                        cons_bonus: mainbonus,
                        cons_win: mainwin,
                        transaction_id: tranid != '' ? tranid : `${constant.APP_SHORT_NAME}-${Date.now()}-${randomStr}`,
                    };
                    Promise.all([
                        userModel.findOneAndUpdate({ _id: req.user._id }, userObj, { new: true }),
                        TransactionModel.create(transactiondata)
                    ]);
                    // ----------------------------------------------------------------------------------------------------------------------

                    return {
                        message: 'Contest Joined',
                        status: true,
                        data: {
                            joinedusers: joinedLeaugesCount,
                            referCode: referCode
                        }
                    };
                }

            }

        } catch (error) {
            throw error;
        }
    }

    async updateJoinedusers(req) {
        try {
            console.log("--updateJoinedusers----")
            const query = {};
            query.matchkey = req.query.matchkey
            query.contest_type = 'Amount'
            query.status = 'opened'
            const matchchallengesData = await matchchallengesModel.find(query);
            if (matchchallengesData.length > 0) {
                for (let matchchallenge of matchchallengesData) {
                    const totalJoinedUserInLeauge = await JoinLeaugeModel.find({ challengeid: mongoose.Types.ObjectId(matchchallenge._id) });
                    if (matchchallenge.maximum_user == totalJoinedUserInLeauge.length) {
                        const update = {
                            $set: {
                                'status': 'closed',
                                'is_duplicated': 1,
                                'joinedusers': totalJoinedUserInLeauge.length,
                            },
                        };
                        // console.log("--matchchallenge.is_running == 1 && matchchallenge.is_duplicated != 1--",matchchallenge.is_running == 1 && matchchallenge.is_duplicated != 1)
                        if (matchchallenge.is_running == 1 && matchchallenge.is_duplicated != 1) {
                            let newmatchchallenge = {};
                            // delete newmatchchallenge._id;
                            // delete newmatchchallenge.createdAt;
                            // delete newmatchchallenge.updatedAt;
                            newmatchchallenge.joinedusers = 0;
                            newmatchchallenge.contestid = matchchallenge.contestid
                            newmatchchallenge.contest_cat = matchchallenge.contest_cat
                            newmatchchallenge.challenge_id = matchchallenge.challenge_id
                            newmatchchallenge.matchkey = matchchallenge.matchkey
                            newmatchchallenge.fantasy_type = matchchallenge.fantasy_type
                            newmatchchallenge.entryfee = matchchallenge.entryfee
                            newmatchchallenge.win_amount = matchchallenge.win_amount
                            newmatchchallenge.multiple_entryfee = matchchallenge.multiple_entryfee
                            newmatchchallenge.expert_teamid = matchchallenge.expert_teamid
                            newmatchchallenge.maximum_user = matchchallenge.maximum_user
                            newmatchchallenge.status = matchchallenge.status
                            newmatchchallenge.created_by = matchchallenge.created_by
                            newmatchchallenge.contest_type = matchchallenge.contest_type
                            newmatchchallenge.expert_name = matchchallenge.expert_name
                            newmatchchallenge.contest_name = matchchallenge.contest_name || ''
                            newmatchchallenge.amount_type = matchchallenge.amount_type
                            newmatchchallenge.mega_status = matchchallenge.mega_status
                            newmatchchallenge.winning_percentage = matchchallenge.winning_percentage
                            newmatchchallenge.is_bonus = matchchallenge.is_bonus
                            newmatchchallenge.bonus_percentage = matchchallenge.bonus_percentage
                            newmatchchallenge.pricecard_type = matchchallenge.pricecard_type
                            newmatchchallenge.minimum_user = matchchallenge.minimum_user
                            newmatchchallenge.confirmed_challenge = matchchallenge.confirmed_challenge
                            newmatchchallenge.multi_entry = matchchallenge.multi_entry
                            newmatchchallenge.team_limit = matchchallenge.team_limit
                            newmatchchallenge.image = matchchallenge.image
                            newmatchchallenge.c_type = matchchallenge.c_type
                            newmatchchallenge.is_private = matchchallenge.is_private
                            newmatchchallenge.is_running = matchchallenge.is_running
                            newmatchchallenge.is_expert = matchchallenge.is_expert
                            newmatchchallenge.bonus_percentage = matchchallenge.bonus_percentage
                            newmatchchallenge.matchpricecards = matchchallenge.matchpricecards
                            newmatchchallenge.is_expert = matchchallenge.is_expert
                            newmatchchallenge.team1players = matchchallenge.team1players
                            newmatchchallenge.team2players = matchchallenge.team2players
                            // console.log("---newmatchchallenge--",newmatchchallenge)
                            let data = await matchchallengesModel.findOne({
                                matchkey: matchchallenge.matchkey,
                                fantasy_type: matchchallenge.fantasy_type,
                                entryfee: matchchallenge.entryfee,
                                win_amount: matchchallenge.win_amount,
                                maximum_user: matchchallenge.maximum_user,
                                joinedusers: 0,
                                status: matchchallenge.status,
                                is_duplicated: { $ne: 1 }
                            });
                            if (!data) {
                                let createNewContest = new matchchallengesModel(newmatchchallenge);
                                let mynewContest = await createNewContest.save();
                            }
                            // console.log("---createNewContest----",mynewContest)
                        }
                        await matchchallengesModel.updateOne({ _id: mongoose.Types.ObjectId(matchchallenge._id) }, update);
                    }
                }

            }
        } catch (error) {
            throw error;
        }

    };
    async getAllNewContests(req) {
        try {
            await this.updateJoinedusers(req);
            let finalData = [], contest_arr = [], aggpipe = [];
            aggpipe.push({
                $lookup: {
                    from: "matchchallenges",
                    let: {
                        contestcat: "$_id",
                        matchkey: mongoose.Types.ObjectId(req.query.matchkey),
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        {
                                            $eq: ["$$matchkey", "$matchkey"],
                                        },
                                        {
                                            $eq: [
                                                "$$contestcat",
                                                "$contest_cat",
                                            ],
                                        }, {
                                            $eq: ["opened", "$status"],
                                        },
                                        {
                                            $eq: [0, '$is_private'],
                                        }
                                    ],
                                },
                            },
                        },
                        {
                            $lookup: {
                                from: "joinedleauges",
                                let: {
                                    challengeId: "$_id",
                                    matchkey: '$matchkey',
                                    userId: mongoose.Types.ObjectId(req.user._id),
                                },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: [
                                                    {
                                                        $eq: [
                                                            "$$matchkey",
                                                            "$matchkey",
                                                        ],
                                                    },
                                                    {
                                                        $eq: [
                                                            "$$challengeId",
                                                            "$challengeid",
                                                        ],
                                                    },

                                                    {
                                                        $eq: [
                                                            "$$userId",
                                                            "$userid",
                                                        ],
                                                    },
                                                ],
                                            },
                                        },
                                    }, {
                                        $project: {
                                            refercode: 1
                                        }
                                    },
                                ],
                                as: 'joinedleauge'
                            },
                        },
                        {
                            $sort: { win_amount: -1 },
                        },
                    ],
                    as: "contest",
                }
            });
            aggpipe.push({
                $addFields: {
                    challengeSize: {
                        $size: "$contest"
                    }
                }
            })
            aggpipe.push({
                $match: {
                    challengeSize: { $gt: 0 }
                }
            })

            aggpipe.push({
                $sort: {
                    Order: 1
                }
            })
            const categoryData = await contestCategory.aggregate(aggpipe);
            if (categoryData.length == 0) {
                return {
                    message: "No Challenge Available For This Match",
                    status: true,
                    data: []
                }
            }
            let [total_teams, total_joinedcontestData] = await Promise.all([
                JoinQuizTeamModel.countDocuments({ userid: req.user._id, matchkey: req.query.matchkey }),
                this.getJoinleague(req.user._id, req.query.matchkey)
            ]);
            for (let cat of categoryData) {
                let i = 0;
                cat.catid = cat._id;
                cat.cat_order = cat.Order;
                cat.catname = cat.name;
                cat.image = cat.image ? `${constant.BASE_URL}${cat.image}` : `${constant.BASE_URL}logo.png`;
                for (let matchchallenge of cat.contest) {
                    i++;
                    let isselected = false,
                        refercode = '',
                        winners = 0;
                    const price_card = [];
                    if (matchchallenge?.joinedleauge && matchchallenge.joinedleauge.length > 0) {
                        refercode = matchchallenge?.joinedleauge[0].refercode;
                        if (matchchallenge.multi_entry == 1 && matchchallenge.joinedleauge.length < 11) {
                            if (matchchallenge.contest_type == 'Amount') {
                                if (matchchallenge.joinedleauge.length == 11 || matchchallenge.joinedusers == matchchallenge.maximum_user)
                                    isselected = true;
                            } else if (matchchallenge.contest_type == 'Percentage') {
                                if (matchchallenge.joinedleauge.length == 11) isselected = true;
                            } else isselected = false;
                        } else isselected = true;
                    }
                    matchchallenge.gift_image = "";
                    matchchallenge.gift_type = "amount";
                    let find_gift = matchchallenge.matchpricecards.find(function (x) { return x.gift_type == "gift" });
                    if (find_gift) {
                        matchchallenge.gift_image = `${constant.BASE_URL}${find_gift.image}`;
                        matchchallenge.gift_type = find_gift.gift_type;
                    }
                    let team_limits;
                    if (matchchallenge.multi_entry == 0) {
                        team_limits = 1
                    } else {
                        team_limits = matchchallenge.team_limit
                    }
                    matchchallenge.isselected = isselected;
                    matchchallenge.team_limits = team_limits;
                    matchchallenge.refercode = refercode;
                    matchchallenge.matchchallengeid = matchchallenge._id;
                    matchchallenge.status = 1;
                    matchchallenge.joinedleauges = matchchallenge.joinedleauge.length;
                    matchchallenge.total_joinedcontest = total_joinedcontestData || 0;
                    matchchallenge.total_teams = total_teams || 0;

                }
            }
            return {
                message: 'Contest of A Perticular Match',
                status: true,
                data: categoryData
            }
        } catch (error) {
            console.log('error', error);
        }
    }

    async getUserRank(rankArray) {
        //console.log("rankArray",rankArray)
        // if (rankArray.length == 0) return [];
        // let lrsno = 0,
        //     uplus = 0,
        //     sno = 0;
        // const getUserRank = [];
        // for await (const rankData of rankArray) {
        //     const found = getUserRank.some((ele) => { 
        //         //console.log("ele",ele.points,"rankData.points",rankData.points,"==",ele.points == rankData.points)
        //         ele.points == rankData.points });
        //     //console.log("found",found)
        //     if (found) {
        //         console.log("a")
        //         uplus++;
        //     } else {
        //         console.log("b")
        //         lrsno++;
        //         //console.log("lrsno",lrsno,"uplus",uplus)
        //         lrsno = lrsno + uplus;
                
        //         uplus = 0;
        //     }
        //     //console.log("--->",lrsno)
        //     getUserRank.push({
        //         rank: lrsno,
        //         points: rankData.points,
        //         userid: rankData.userid,
        //         userjoinedleaugeId: rankData.userjoinedleaugeId,
        //         userTeamNumber: rankData.userTeamNumber,
        //     });
        //     sno++;
        //     if (sno == rankArray.length) {
        //         return getUserRank;
        //     }
        // }
        //sahil rank code
        if (rankArray.length == 0) return [];
let lrsno = 0,
    uplus = 0,
    sno = 0;
const getUserRank = [];
for await (const rankData of rankArray) {
    const found = getUserRank.some((ele) => {
        return ele.points == rankData.points && ele.rank <= lrsno;
    });
    if (found) {
        //console.log("a");
        uplus++;
    } else {
        //console.log("b");
        lrsno++;
        lrsno = lrsno + uplus;
        uplus = 0;
    }
    getUserRank.push({
        rank: lrsno,
        points: rankData.points,
        userid: rankData.userid,
        userjoinedleaugeId: rankData.userjoinedleaugeId,
        userTeamNumber: rankData.userTeamNumber,
    });
    sno++;
    if (sno == rankArray.length) {
        return getUserRank;
    }
}

        //sahil rank code end
        return true;
    };
    //overviewendteam    
    async getMyQuizJoinedContest(req) {
        try {
            const { matchkey } = req.query;
            const aggPipe = [];
            aggPipe.push({
                $match: {
                    userid: mongoose.Types.ObjectId(req.user._id),
                    matchkey: mongoose.Types.ObjectId(matchkey),
                }
            });
         

            aggPipe.push({
                $group: {
                    _id: '$challengeid',
                    joinedleaugeId: { $first: '$_id' },
                    matchkey: { $first: '$matchkey' },
                    jointeamid: { $first: '$teamid' },
                    userid: { $first: '$userid' },
                },
            });
            aggPipe.push({
                $lookup: {
                    from: 'matchchallenges',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'matchchallenge'
                }
            });
            aggPipe.push({
                $addFields: {
                    matchchallengestatus: { $arrayElemAt: ['$matchchallenge.status', 0] }
                }
            });
            aggPipe.push({
                $match: { matchchallengestatus: { $ne: "canceled" } }
            });
            aggPipe.push({
                $project: {
                    _id: 0,
                    matchchallengeid: "$_id",
                    amount_type: { $arrayElemAt: [{ $ifNull: ['$matchchallenge.amount_type', 0] }, 0] },
                    jointeamid: 1,
                    joinedleaugeId: 1,
                    userid: 1,
                    // is_expert:matchchallenge.is_expert,
                    // expert_name:matchchallenge.expert_name,
                    win_amount: { $arrayElemAt: [{ $ifNull: ['$matchchallenge.win_amount', 0] }, 0] },
                    contest_cat: { $arrayElemAt: ['$matchchallenge.contest_cat', 0] },
                    is_bonus: { $arrayElemAt: [{ $ifNull: ['$matchchallenge.is_bonus', 0] }, 0] },
                    bonus_percentage: { $arrayElemAt: [{ $ifNull: ['$matchchallenge.bonus_percentage', 0] }, 0] },
                    is_private: { $arrayElemAt: [{ $ifNull: ['$matchchallenge.is_private', 0] }, 0] },
                    winning_percentage: { $arrayElemAt: [{ $ifNull: ['$matchchallenge.winning_percentage', 0] }, 0] },
                    contest_type: { $arrayElemAt: [{ $ifNull: ['$matchchallenge.contest_type', 0] }, 0] },
                    contest_name: { $arrayElemAt: [{ $ifNull: ['$matchchallenge.contest_name', 0] }, 0] },
                    multi_entry: { $arrayElemAt: [{ $ifNull: ['$matchchallenge.multi_entry', 0] }, 0] },
                    confirmed_challenge: { $arrayElemAt: [{ $ifNull: ['$matchchallenge.confirmed_challenge', 0] }, 0] },
                    matchkey: { $arrayElemAt: [{ $ifNull: ['$matchchallenge.matchkey', 0] }, 0] },
                    entryfee: { $arrayElemAt: [{ $ifNull: ['$matchchallenge.entryfee', 0] }, 0] },
                    maximum_user: { $arrayElemAt: [{ $ifNull: ['$matchchallenge.maximum_user', 0] }, 0] },
                    joinedusers: { $arrayElemAt: [{ $ifNull: ['$matchchallenge.joinedusers', 0] }, 0] },
                    pricecard_type: { $arrayElemAt: [{ $ifNull: ['$matchchallenge.pricecard_type', 0] }, 0] },
                    status: { $arrayElemAt: ['$matchchallenge.status', 0] },
                    team_limit: { $arrayElemAt: [{ $ifNull: ['$matchchallenge.team_limit', 0] }, 0] },
                    matchpricecards: { $arrayElemAt: ['$matchchallenge.matchpricecards', 0] },
                }
            });
            aggPipe.push({
                $lookup: {
                    from: 'joinedleauges',
                    let: { matchchallengeid: '$matchchallengeid' },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [{
                                    $eq: ['$$matchchallengeid', '$challengeid'],
                                },],
                            },
                        },
                    },
                    {
                        $lookup: {
                            from: 'joinquizteams',
                            let: { teamid: '$teamid' },
                            pipeline: [{
                                $match: {
                                    $expr: {
                                        $and: [{
                                            $eq: ['$$teamid', '$_id'],
                                        },],
                                    },
                                },
                            },
                            {
                                $project: {
                                    _id: 0,
                                    points: 1,
                                    userid: 1,
                                    teamnumber: 1,
                                },
                            },
                            ],
                            as: 'jointeam',
                        },
                    },
                    {
                        $unwind: {
                            path: '$jointeam',
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            jointeam: 1,
                            refercode: { $ifNull: ['$refercode', 0] },
                        },
                    },
                    ],

                    as: 'jointeamids',
                },
            });
            aggPipe.push({
                $lookup: {
                    from: 'finalresults',
                    let: { matchchallengeid: '$matchchallengeid' },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$$matchchallengeid', '$challengeid'] },
                                    { $eq: ['$userid', mongoose.Types.ObjectId(req.user._id)] },
                                ],
                            },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            amount: { $sum: '$amount' },
                        },
                    },
                    ],
                    as: 'finalresults',
                },
            });
            aggPipe.push({
                $sort: {
                    'win_amount': -1,
                }
            });
            aggPipe.push({
                $lookup: {
                    from: 'listmatches',
                    localField: 'matchkey',
                    foreignField: '_id',
                    as: 'listmatch'
                }
            });

            aggPipe.push({
                $project: {
                    // amount_type:"$amount_type",
                    jointeamid: 1,
                    matchchallengeid: 1,

                    userid: 1,
                    joinedleaugeId: 1,
                    win_amount: '$win_amount',
                    contest_cat: '$contest_cat',
                    is_bonus: { $ifNull: ['$is_bonus', 0] },
                    bonus_percentage: { $ifNull: ['$bonus_percentage', 0] },
                    is_private: { $ifNull: ['$is_private', 0] },
                    winning_percentage: '$winning_percentage',
                    contest_type: { $ifNull: ['$contest_type', ''] },
                    multi_entry: { $ifNull: ['$multi_entry', ''] },
                    contest_name: { $ifNull: ['$contest_name', ''] },
                    confirmed: { $ifNull: ['$confirmed_challenge', 0] },
                    matchkey: { $ifNull: ['$matchkey', 0] },
                    joinedusers: { $ifNull: ['$joinedusers', 0] },
                    entryfee: { $ifNull: ['$entryfee', 0] },
                    pricecard_type: { $ifNull: ['$pricecard_type', 0] },
                    maximum_user: { $ifNull: ['$maximum_user', 0] },
                    team_limit: { $ifNull: ['$team_limit', 11] },
                    matchFinalstatus: { $ifNull: [{ $arrayElemAt: ['$listmatch.final_status', 0] }, ''] },
                    matchpricecards: '$matchpricecards',
                    //-------------Comment for bleow commented code----------//
                    matchChallengeStatus: '$status',
                    jointeams: {
                        $filter: {
                            input: '$jointeamids.jointeam',
                            as: 'team',
                            cond: { $eq: ['$$team.userid', mongoose.Types.ObjectId(req.user._id)] },
                        },
                    },
                    bonus_date: '',
                    totaljointeams: '$jointeamids.jointeam',
                    refercode: { $ifNull: [{ $arrayElemAt: ['$jointeamids.refercode', 0] }, 0] },
                    finalresultsAmount: { $ifNull: [{ $arrayElemAt: ['$finalresults.amount', 0] }, 0] },
                    amount_type: { $ifNull: ['$amount_type', ''] },
                },
            });
          
            const JoinContestData = await JoinLeaugeModel.aggregate(aggPipe);
            
            let i = 0;
            const finalData = [];
            if (JoinContestData.length == 0) return { message: 'Data Not Found', status: true, data: [] };
            for await (const challanges of JoinContestData) {
                //console.log("challanges",challanges)
                const getCurrentRankArray = [];
                for await (const element of challanges.totaljointeams) {
                    getCurrentRankArray.push({
                        points: element.points,
                        userid: element.userid,
                        userjoinedleaugeId: challanges.joinedleaugeId,
                        userTeamNumber: element.teamnumber,
                    });
                }
                getCurrentRankArray.sort((a, b) => {
                    return b.points - a.points;
                });
                const getUserCurrentRank = await this.getUserRank(getCurrentRankArray);
                const getRank = getUserCurrentRank.find(item => {
                    return item.userid.toString() == req.user._id.toString();
                });


                const tmpObj = {
                    userrank: getRank.rank,
                    userpoints: getRank.points,
                    userteamnumber: getRank.userTeamNumber,
                    win_amount_str: challanges.win_amount != 0 ? `Win ₹${challanges.win_amount}` : '',
                    jointeamid: challanges.jointeamid,
                    joinedleaugeId: challanges.joinedleaugeId,
                    matchchallengeid: challanges.matchchallengeid,
                    matchkey: challanges.matchkey,
                    challenge_id: challanges.challangeid,
                    refercode: challanges.refercode,
                    contest_name: challanges.contest_name,
                    winamount: challanges.win_amount != 0 ? challanges.win_amount : 0,
                    is_private: challanges.is_private != 0 ? challanges.is_private : 0,
                    is_bonus: challanges.is_bonus != 0 ? challanges.is_bonus : 0,
                    bonus_percentage: challanges.bonus_percentage != 0 ? challanges.bonus_percentage : 0,
                    winning_percentage: challanges.winning_percentage != 0 ? challanges.winning_percentage : 0,
                    contest_type: challanges.contest_type != '' ? challanges.contest_type : '',
                    confirmed_challenge: challanges.confirmed != 0 ? challanges.confirmed : 0,
                    multi_entry: challanges.multi_entry != 0 ? challanges.multi_entry : 0,
                    joinedusers: challanges.joinedusers != 0 ? challanges.joinedusers : 0,
                    entryfee: challanges.entryfee != 0 ? challanges.entryfee : 0,
                    pricecard_type: challanges.pricecard_type != 0 ? challanges.pricecard_type : 0,
                    maximum_user: challanges.maximum_user != 0 ? challanges.maximum_user : 0,
                    matchFinalstatus: challanges.matchFinalstatus,
                    matchChallengeStatus: challanges.matchChallengeStatus,
                    bonus_date: challanges.bonus_date,
                    totalwinning: Number(challanges.finalresultsAmount).toFixed(2),
                    isselected: true,
                    totalwinners: 1,
                    price_card: [],
                    pricecardstatus: 0,
                };
                

                if (challanges.multi_entry != 0) {
                    tmpObj['team_limit'] = challanges.team_limit;
                    tmpObj['plus'] = '+';
                }
                let k = 0,
                    winners = 0;
                const price_card = [];
                tmpObj['amount_type'] = `${challanges.amount_type}`;
                if (challanges.matchpricecards && challanges.matchpricecards != '') {
                    const matchpricecards = challanges.matchpricecards;
                    for await (const pricecard of matchpricecards) {
                        k++;
                        winners = Number(pricecard.winners) + Number(winners);
                        const totalPrice = (Number(pricecard.total) / Number(pricecard.winners)).toFixed(2);
                        const priceCard = {
                            pricecard_id: pricecard._id,
                            price: pricecard.type == 'Percentage' ? totalPrice : `${pricecard.price}`,
                            winners: pricecard.winners,
                            start_position: Number(pricecard.min_position) + 1 != Number(pricecard.max_position) ?
                                `${Number(pricecard.min_position) + 1}-${pricecard.max_position}` : `${pricecard.max_position}`,
                            amount_type: `${challanges.amount_type}`,
                        };
                        priceCard.gift_type = pricecard.gift_type;
                        if (challanges.amount_type == 'prize') {
                            if (pricecard.gift_type == "gift") {
                                priceCard.image = `${constant.BASE_URL}/${pricecard.image}`;
                                priceCard.price = pricecard.prize_name;
                            } else {
                                priceCard.price = pricecard.price;
                                priceCard.image = '';
                            }
                        } else {
                            priceCard.price = pricecard.price;
                            priceCard.image = '';
                        }
                        if (pricecard.type == 'Percentage')
                            priceCard['price_percent'] = `${pricecard.price_percent} %`;
                        price_card.push(priceCard);
                        if (k == matchpricecards.length) {
                            tmpObj['totalwinners'] = winners;
                            tmpObj['price_card'] = price_card;
                            tmpObj['pricecardstatus'] = 1;
                        }
                    }
                } else {
                    tmpObj['totalwinners'] = 1;
                    tmpObj['price_card'] = [{ start_position: 1, price: `${challanges.win_amount}`, amount_type: `${challanges.amount_type}`, gift_type: "amount" }];
                    tmpObj['pricecardstatus'] = 0;
                }
                let gift_image = "";
                let gift_type = "amount";
                let prize_name = "";
                let find_gift = challanges.matchpricecards.find(function (x) { return x.gift_type == "gift" });
                if (find_gift) {
                    gift_image = `${constant.BASE_URL}${find_gift.image}`;
                    gift_type = find_gift.gift_type;
                    prize_name = find_gift.prize_name;
                }
                tmpObj.gift_image = gift_image;
                tmpObj.gift_type = gift_type;
                tmpObj.prize_name = prize_name;
                //------------------------------------------Hide Is selected value alway send true-------------------//
                if (challanges.contest_type == 'Percentage') {
                    tmpObj['isselected'] = challanges.jointeams ?
                        challanges.multi_entry == 1 && challanges.jointeams.length < challanges.team_limit ?
                            false :
                            true :
                        false;
                } else {
                    tmpObj['isselected'] = challanges.jointeams ?
                        challanges.multi_entry == 1 &&
                            challanges.jointeams.length < challanges.team_limit &&
                            challanges.totaljointeams.length < challanges.maximum_user ?
                            false :
                            true :
                        false;
                }
                // ------------count of contest and team------------
                const total_teams = await JoinQuizTeamModel.countDocuments({ matchkey: req.query.matchkey, userid: req.user._id, });
                const total_joinedcontestData = await JoinLeaugeModel.aggregate([
                    {
                        $match: {
                            userid: mongoose.Types.ObjectId(req.user._id),
                            matchkey: mongoose.Types.ObjectId(req.query.matchkey)
                        }
                    },
                    {
                        $group: {
                            _id: "$challengeid",
                        }
                    }, {
                        $count: "total_count"
                    }
                ])
                tmpObj['total_teams'] = total_teams || 0;
                tmpObj['total_joinedcontest'] = total_joinedcontestData[0]?.total_count || 0;
                finalData.push(tmpObj);
                i++;
                if (i == JoinContestData.length) return {
                    message: 'Join Contest Data...!',
                    status: true,
                    data: finalData
                };
            }
        } catch (error) {
            throw error;
        }
    }
}
module.exports = new quizfantasyServices();