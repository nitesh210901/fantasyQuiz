const mongoose = require('mongoose');
const randomstring = require("randomstring");
const moment = require('moment');
const axios = require("axios")
const fs = require('fs');

require('../../models/challengersModel');
require('../../models/playerModel');
require('../../models/teamModel');
const matchchallengesModel = require('../../models/matchChallengersModel');
const QuizJoinLeaugeModel = require('../../models/QuizJoinLeaugeModel');
const StockQuizJoinLeaugeModel = require('../../models/StockQuizJoinLeaugeModel');
const contestCategory = require('../../models/contestcategoryModel');
const TransactionModel = require('../../models/transactionModel');
const leaderBoardModel = require(`../../models/leaderboardModel`)
const refundModel = require('../../models/refundModel');
const overMatchModel = require('../../models/quizmatches');
const quizModel = require('../../models/quizModel');
const quizUserAnswer = require('../../models/quizUserAnswer');
const overpointsModel = require('../../models/quizpoints');
const listMatchesModel = require('../../models/listMatchesModel');
const matchPlayersModel = require('../../models/matchPlayersModel');
const JoinLeaugeModel = require('../../models/JoinLeaugeModel');
const playerModel = require("../../models/playerModel");
const JoinQuizTeamModel = require('../../models/JoinQuizTeamModel');
const JoinTeamModel = require('../../models/JoinTeamModel');
const userModel = require("../../models/userModel");
const constant = require('../../config/const_credential');
const Redis = require('../../utils/redis');
const matchServices = require("./matchServices");
const stockQuizModel = require('../../models/stockQuizModel');

const {
    quiz
} = require('../../admin/services/matchServices');


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
            getStockQuiz: this.getStockQuiz.bind(this),
            getStockSingleQuiz: this.getStockSingleQuiz.bind(this),
            quizGiveAnswer: this.quizGiveAnswer.bind(this),
            stockquizgetUsableBalance: this.stockquizgetUsableBalance.bind(this),
            joinStockQuiz: this.joinStockQuiz.bind(this),
            findArrayIntersection: this.findArrayIntersection.bind(this),
            quizAnswerMatch: this.quizAnswerMatch.bind(this),
            quizrefundprocess: this.quizrefundprocess.bind(this),
            findJoinLeaugeExist: this.findJoinLeaugeExist.bind(this),
            getMatchTime: this.getMatchTime.bind(this),
            getUserRank: this.getUserRank.bind(this),
            stockquizfindJoinLeaugeExist: this.stockquizfindJoinLeaugeExist.bind(this),
            stockquizfindUsableBonusMoney: this.stockquizfindUsableBonusMoney.bind(this),
            stockquizfindUsableBalanceMoney: this.stockquizfindUsableBalanceMoney.bind(this),
            stockquizfindUsableWinningMoney: this.stockquizfindUsableWinningMoney.bind(this),
            NewjoinedStockQuiz: this.NewjoinedStockQuiz.bind(this),
            NewjoinedStockQuizLive: this.NewjoinedStockQuizLive.bind(this),
            AllCompletedStockQuiz: this.AllCompletedStockQuiz.bind(this)
        }
    }

    async getJoinleague(userId, matchkey) {
        const total_joinedcontestData = await JoinLeaugeModel.aggregate([{
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

    async getStockQuiz(req) {
        try {
            let date = moment().format('YYYY-MM-DD HH:mm:ss');
            let EndDate = moment().add(25, 'days').format('YYYY-MM-DD HH:mm:ss');
            let pipeline = []
             pipeline.push({
                '$match': {
                  'is_enabled': true
                }
             })
            
            pipeline.push({
                $match: {
                    $and: [{ start_date: { $gt: date } }, { start_date: { $lt: EndDate } }]
                  }
            })
            pipeline.push({
                $project: {
                    answer:0
                }
            })
            let data = await stockQuizModel.aggregate(pipeline)

            if (data.length === 0) {
                return {
                    status: false,
                    message: "Stock Quiz  not Found",
                    data: []
                }
            }
            return {
                status: true,
                message: "Stock Quiz fatch Successfully",
                data: data
            }
        } catch (error) {
            console.log('error', error);
            throw error;
        }
    }

    async getStockSingleQuiz(req) {
        try {
            let {
                stockquizId,
            } = req.query
            let date = moment().format('YYYY-MM-DD HH:mm:ss');
            let EndDate = moment().add(25, 'days').format('YYYY-MM-DD HH:mm:ss');
            let pipeline = []
             pipeline.push({
                '$match': {
                     'is_enabled': true,
                     '_id':mongoose.Types.ObjectId(stockquizId)
                }
             })
            pipeline.push({
                $match: {
                    $and: [{ start_date: { $gt: date } }, { start_date: { $lt: EndDate } }]
                  }
            })
            pipeline.push({
                $project: {
                    answer:0
                }
            })
            let data = await stockQuizModel.aggregate(pipeline)
            if (data.length === 0) {
                return {
                    status: false,
                    message: "Stock Quiz  Not Found",
                    data: {}
                }
            }
            return {
                status: true,
                message: "Single Quiz Fatch Successfully",
                data: data
            }
        } catch (error) {
            console.log('error', error);
            throw error;
        }
    }

    async quizGiveAnswer(req) {
        try {
            let {
                matchkey,
                quizId,
                answer
            } = req.body
            let userId = req.user._id

            let quizData = await quizModel.findOne({
                _id: quizId
            })
            if (!quizData) {
                return {
                    status: false,
                    message: "Quiz not found",
                    data: {}
                }
            }
            if (quizData.matchkey.toString() === matchkey) {
                let obj = {}
                obj.matchkey = matchkey
                obj.quizId = quizId
                obj.userId = userId
                obj.answer = answer
                let data = await quizUserAnswer.findOneAndUpdate({
                    quizId: quizId
                }, {
                    $set: obj
                }, {
                    upsert: true
                })
                return {
                    status: true,
                    message: "Answer Successfully Added"
                }

            } else {
                return {
                    status: false,
                    message: "Quiz not found",
                    data: {}
                }
            }
        } catch (error) {
            console.log('error', error);
            throw error;
        }
    }


    async quizCreateTeam(req) {
        try {
            const {
                matchkey,
                teamnumber,
                quiz
            } = req.body;
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
            const joinlist = await JoinQuizTeamModel.find({
                matchkey: matchkey,
                userid: req.user._id
            }).sort({
                teamnumber: -1
            });
            const duplicateData = await this.checkForDuplicateTeam(joinlist, quizArray, teamnumber);
            if (duplicateData === false) {
                return {
                    message: 'You cannot create the same team.',
                    status: false,
                    data: {}
                };
            }

            let listmatchData = await listMatchesModel.findOne({
                _id: mongoose.Types.ObjectId(matchkey)
            });
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
            }).sort({
                teamnumber: -1
            });
            if (joinTeam) {
                data["user_type"] = 0;
                data['created_at'] = joinTeam.createdAt;
                const updateTeam = await JoinQuizTeamModel.findOneAndUpdate({
                    _id: joinTeam._id
                }, data, {
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
            const listmatchData = await listMatchesModel.findOne({
                _id: req.query.matchkey
            }).populate({
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
            const matchchallenges = await matchchallengesModel.find({
                matchkey: mongoose.Types.ObjectId(req.query.matchkey)
            });
            console.log(`--------------matchchallenges.length----------------`, matchchallenges.length);

            // ----------total join contest and ----
            const total_teams = await JoinQuizTeamModel.countDocuments({
                matchkey: req.query.matchkey,
                userid: req.user._id,
            });
            const total_joinedcontestData = await JoinLeaugeModel.aggregate([{
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
            let count_JoinContest = total_joinedcontestData[0] ?.total_count;
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
                matchkey: {
                    $first: '$matchkey'
                },
                joinedleaugeId: {
                    $first: '$_id'
                },
                userid: {
                    $first: '$userid'
                },
                matchchallengeid: {
                    $first: '$challengeid'
                },
                jointeamid: {
                    $first: '$teamid'
                },
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
                $or: [{
                        $and: [{
                            'match.final_status': 'pending'
                        }, {
                            'match.status': 'started'
                        }]
                    },
                    {
                        $and: [{
                            'match.status': "completed"
                        }, {
                            'match.final_status': 'IsReviewed'
                        }]
                    },
                    {
                        $and: [{
                            'match.status': "notstarted"
                        }, {
                            'match.final_status': 'pending'
                        }]
                    },
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
                let: {
                    matchkey: '$matchkey',
                    userid: '$userid'
                },
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
                }, ],
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
                joinedleaugeId: {
                    $first: '$joinedleauges._id'
                },
                matchkey: {
                    $first: '$matchkey'
                },
                jointeamid: {
                    $first: '$jointeamid'
                },
                userid: {
                    $first: '$userid'
                },
                match: {
                    $first: '$match'
                },
            },
        });

        aggPipe.push({
            $group: {
                _id: '$matchkey',
                joinedleaugeId: {
                    $first: '$joinedleaugeId'
                },
                matchkey: {
                    $first: '$matchkey'
                },
                jointeamid: {
                    $first: '$jointeamid'
                },
                match: {
                    $first: '$match'
                },
                count: {
                    $sum: 1
                },
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
                playing11_status: {
                    $ifNull: ['$match.playing11_status', 1]
                },
                matchname: {
                    $ifNull: ['$match.name', '']
                },
                team1ShortName: {
                    $ifNull: ['$team1.short_name', '']
                },
                team2ShortName: {
                    $ifNull: ['$team2.short_name', '']
                },
                teamfullname1: {
                    $ifNull: ['$team1.teamName', 0]
                },
                teamfullname2: {
                    $ifNull: ['$team2.teamName', 0]
                },
                team1color: {
                    $ifNull: ['$team1.color', constant.TEAM_DEFAULT_COLOR.DEF1]
                },
                team2color: {
                    $ifNull: ['$team2.color', constant.TEAM_DEFAULT_COLOR.DEF1]
                },
                team1logo: {
                    $ifNull: [{
                        $cond: {
                            if: {
                                $or: [{
                                    $eq: [{
                                        $substr: ['$team1.logo', 0, 1]
                                    }, '/']
                                }, {
                                    $eq: [{
                                        $substr: ['$team1.logo', 0, 1]
                                    }, 't']
                                }]
                            },
                            then: {
                                $concat: [`${constant.BASE_URL}`, '', '$team1.logo']
                            },
                            else: '$team1.logo',
                        }
                    }, `${constant.BASE_URL}team_image.png`]
                },
                team2logo: {
                    $ifNull: [{
                        $cond: {
                            if: {
                                $or: [{
                                    $eq: [{
                                        $substr: ['$team2.logo', 0, 1]
                                    }, '/']
                                }, {
                                    $eq: [{
                                        $substr: ['$team2.logo', 0, 1]
                                    }, 't']
                                }]
                            },
                            then: {
                                $concat: [`${constant.BASE_URL}`, '', '$team2.logo']
                            },
                            else: '$team2.logo',
                        }
                    }, `${constant.BASE_URL}team_image.png`]
                },
                start_date: {
                    $ifNull: ['$match.start_date', '0000-00-00 00:00:00']
                },
                status: {
                    $ifNull: [{
                            $cond: {
                                if: {
                                    $lt: ['$match.start_date', moment().format('YYYY-MM-DD HH:mm:ss')]
                                },
                                then: 'closed',
                                else: 'opened',
                            },
                        },
                        'opened',
                    ],
                },
                launch_status: {
                    $ifNull: ['$match.launch_status', '']
                },
                final_status: {
                    $ifNull: ['$match.final_status', '']
                },
                series_name: {
                    $ifNull: ['$series.name', '']
                },
                type: {
                    $ifNull: ['$match.fantasy_type', 'Cricket']
                },
                series_id: {
                    $ifNull: ['$series._id', '']
                },
                winning_status: "pending",
                available_status: {
                    $ifNull: [1, 1]
                },
                joinedcontest: {
                    $ifNull: ['$count', 0]
                },
                team1Id: '$match.team1Id',
                team2Id: '$match.team2Id',

            }
        });
        const JoiendMatches = await JoinLeaugeModel.aggregate(aggPipe);
        return JoiendMatches;
    }

    async quizGetmatchlist() {
        try {
            let matchpipe = [];
            let date = moment().format('YYYY-MM-DD HH:mm:ss');
            console.log(`date`, date);
            let EndDate = moment().add(25, 'days').format('YYYY-MM-DD HH:mm:ss');
            matchpipe.push({
                $match: {
                    fantasy_type: 'overfantasy'
                }
            });
            matchpipe.push({
                $match: {
                    $and: [{
                        status: 'notstarted'
                    }, {
                        launch_status: 'launched'
                    }, {
                        start_date: {
                            $gt: date
                        }
                    }, {
                        start_date: {
                            $lt: EndDate
                        }
                    }],
                    final_status: {
                        $nin: ['IsCanceled', 'IsAbandoned']
                    }
                }
            });

            matchpipe.push({
                $lookup: {
                    from: 'teams',
                    localField: 'team1Id',
                    foreignField: '_id',
                    as: 'team1'
                }
            });
            matchpipe.push({
                $lookup: {
                    from: 'teams',
                    localField: 'team2Id',
                    foreignField: '_id',
                    as: 'team2'
                }
            });
            matchpipe.push({
                $lookup: {
                    from: 'series',
                    localField: 'series',
                    foreignField: '_id',
                    as: 'series'
                }
            });
            matchpipe.push({
                $match: {
                    'series.status': 'opened'
                }
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
                    series: {
                        $arrayElemAt: ['$series._id', 0]
                    },
                    seriesname: {
                        $arrayElemAt: ['$series.name', 0]
                    },
                    team1name: {
                        $arrayElemAt: ['$team1.short_name', 0]
                    },
                    team2name: {
                        $arrayElemAt: ['$team2.short_name', 0]
                    },
                    teamfullname1: {
                        $arrayElemAt: ['$team1.teamName', 0]
                    },
                    teamfullname2: {
                        $arrayElemAt: ['$team2.teamName', 0]
                    },
                    matchkey: 1,
                    type: '$fantasy_type',
                    winnerstatus: '$final_status',
                    playing11_status: 1,
                    team1color: {
                        $ifNull: [{
                            $arrayElemAt: ['$team1.color', 0]
                        }, constant.TEAM_DEFAULT_COLOR.DEF1]
                    },
                    team2color: {
                        $ifNull: [{
                            $arrayElemAt: ['$team2.color', 0]
                        }, constant.TEAM_DEFAULT_COLOR.DEF1]
                    },
                    team1logo: {
                        $ifNull: [{
                            $cond: {
                                if: {
                                    $or: [{
                                        $eq: [{
                                            $substr: [{
                                                $arrayElemAt: ['$team1.logo', 0]
                                            }, 0, 1]
                                        }, '/']
                                    }, {
                                        $eq: [{
                                            $substr: [{
                                                $arrayElemAt: ['$team1.logo', 0]
                                            }, 0, 1]
                                        }, 't']
                                    }]
                                },
                                then: {
                                    $concat: [`${constant.BASE_URL}`, '', {
                                        $arrayElemAt: ['$team1.logo', 0]
                                    }]
                                },
                                else: {
                                    $arrayElemAt: ['$team1.logo', 0]
                                },
                            }
                        }, `${constant.BASE_URL}team_image.png`]
                    },
                    team2logo: {
                        $ifNull: [{
                            $cond: {
                                if: {
                                    $or: [{
                                        $eq: [{
                                            $substr: [{
                                                $arrayElemAt: ['$team2.logo', 0]
                                            }, 0, 1]
                                        }, '/']
                                    }, {
                                        $eq: [{
                                            $substr: [{
                                                $arrayElemAt: ['$team2.logo', 0]
                                            }, 0, 1]
                                        }, 't']
                                    }]
                                },
                                then: {
                                    $concat: [`${constant.BASE_URL}`, '', {
                                        $arrayElemAt: ['$team2.logo', 0]
                                    }]
                                },
                                else: {
                                    $arrayElemAt: ['$team2.logo', 0]
                                },
                            }
                        }, `${constant.BASE_URL}team_image.png`]
                    },
                    matchopenstatus: {
                        $cond: {
                            if: {
                                $lte: ['$start_date', moment().format('YYYY-MM-DD HH:mm:ss')]
                            },
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
                matchkey: {
                    $first: '$matchkey'
                },
                joinedleaugeId: {
                    $first: '$_id'
                },
                userid: {
                    $first: '$userid'
                },
                matchchallengeid: {
                    $first: '$challengeid'
                },
                jointeamid: {
                    $first: '$teamid'
                },
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
                $or: [{
                    'match.final_status': 'pending'
                }, {
                    'match.final_status': 'IsReviewed'
                }],
            },
        });
        aggPipe.push({
            $limit: 5,
        });
        aggPipe.push({
            $lookup: {
                from: 'joinedleauges',
                let: {
                    matchkey: '$matchkey',
                    userid: '$userid'
                },
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
                }, ],
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
                joinedleaugeId: {
                    $first: '$joinedleauges._id'
                },
                matchkey: {
                    $first: '$matchkey'
                },
                jointeamid: {
                    $first: '$jointeamid'
                },
                userid: {
                    $first: '$userid'
                },
                match: {
                    $first: '$match'
                },
            },
        });
        aggPipe.push({
            $group: {
                _id: '$matchkey',
                joinedleaugeId: {
                    $first: '$joinedleaugeId'
                },
                matchkey: {
                    $first: '$matchkey'
                },
                jointeamid: {
                    $first: '$jointeamid'
                },
                match: {
                    $first: '$match'
                },
                count: {
                    $sum: 1
                },
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
                matchname: {
                    $ifNull: ['$match.name', '']
                },
                team1ShortName: {
                    $ifNull: ['$team1.short_name', '']
                },
                team2ShortName: {
                    $ifNull: ['$team2.short_name', '']
                },
                team1fullname: {
                    $ifNull: ['$team1.teamName', '']
                },
                team2fullname: {
                    $ifNull: ['$team2.teamName', '']
                },
                team1color: {
                    $ifNull: ['$team1.color', constant.TEAM_DEFAULT_COLOR.DEF1]
                },
                team2color: {
                    $ifNull: ['$team2.color', constant.TEAM_DEFAULT_COLOR.DEF1]
                },
                start_date: "$match.start_date",
                fantasy_type: "$match.fantasy_type",
                team1logo: {
                    $ifNull: [{
                        $cond: {
                            if: {
                                $or: [{
                                    $eq: [{
                                        $substr: ['$team1.logo', 0, 1]
                                    }, '/']
                                }, {
                                    $eq: [{
                                        $substr: ['$team1.logo', 0, 1]
                                    }, 't']
                                }]
                            },
                            then: {
                                $concat: [`${constant.BASE_URL}`, '', '$team1.logo']
                            },
                            else: '$team1.logo',
                        }
                    }, `${constant.BASE_URL}team_image.png`]
                },
                team2logo: {
                    $ifNull: [{
                        $cond: {
                            if: {
                                $or: [{
                                    $eq: [{
                                        $substr: ['$team2.logo', 0, 1]
                                    }, '/']
                                }, {
                                    $eq: [{
                                        $substr: ['$team2.logo', 0, 1]
                                    }, 't']
                                }]
                            },
                            then: {
                                $concat: [`${constant.BASE_URL}`, '', '$team2.logo']
                            },
                            else: '$team2.logo',
                        }
                    }, `${constant.BASE_URL}team_image.png`]
                },
                start_date: {
                    $ifNull: ['$match.start_date', '0000-00-00 00:00:00']
                },
                status: {
                    $ifNull: [{
                            $cond: {
                                if: {
                                    $lt: ['$match.start_date', moment().format('YYYY-MM-DD HH:mm:ss')]
                                },
                                then: 'closed',
                                else: 'opened',
                            },
                        },
                        'opened',
                    ],
                },
                launch_status: {
                    $ifNull: ['$match.launch_status', '']
                },
                final_status: {
                    $ifNull: ['$match.final_status', '']
                },
                series_name: {
                    $ifNull: ['$series.name', '']
                },
                type: {
                    $ifNull: ['$match.fantasy_type', 'Cricket']
                },
                series_id: {
                    $ifNull: ['$series._id', '']
                },
                available_status: {
                    $ifNull: [1, 1]
                },
                joinedcontest: {
                    $ifNull: ['$count', 0]
                },
                playing11_status: {
                    $ifNull: ['$match.playing11_status', 1]
                },
                team1Id: '$match.team1Id',
                team2Id: '$match.team2Id',
            }
        });
        console.log("------------------moment().format('YYYY-MM-DD HH:mm:ss')----------------------------------", moment().format('YYYY-MM-DD HH:mm:ss'))
        aggPipe.push({
            $match: {
                start_date: {
                    $gt: moment().format('YYYY-MM-DD HH:mm:ss')
                }
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
                    matchkey: {
                        $first: '$matchkey'
                    },
                    joinedleaugeId: {
                        $first: '$_id'
                    },
                    userid: {
                        $first: '$userid'
                    },
                    matchchallengeid: {
                        $first: '$challengeid'
                    },
                    jointeamid: {
                        $first: '$teamid'
                    },
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
                $match: {
                    'match.final_status': 'winnerdeclared'
                },
            });
            aggPipe.push({
                $sort: {
                    'match.start_date': -1,
                },
            });
            aggPipe.push({
                $lookup: {
                    from: 'finalresults',
                    let: {
                        matchkey: '$matchkey'
                    },
                    pipeline: [{
                            $match: {
                                $expr: {
                                    $and: [{
                                            $eq: ['$$matchkey', '$matchkey']
                                        },
                                        {
                                            $eq: ['$userid', mongoose.Types.ObjectId(req.user._id)]
                                        },
                                    ],
                                },
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                amount: {
                                    $sum: '$amount'
                                },
                            },
                        },
                    ],
                    as: 'finalresultsTotalAmount',
                },
            });
            aggPipe.push({
                $unwind: {
                    path: '$finalresultsTotalAmount'
                }
            });
            aggPipe.push({
                $lookup: {
                    from: 'joinedleauges',
                    let: {
                        matchkey: '$matchkey',
                        userid: '$userid'
                    },
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
                    }, ],
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
                $unwind: {
                    path: "$winingData"
                }
            })
            aggPipe.push({
                $group: {
                    _id: '$joinedleauges.challengeid',
                    joinedleaugeId: {
                        $first: '$joinedleauges._id'
                    },
                    matchkey: {
                        $first: '$matchkey'
                    },
                    jointeamid: {
                        $first: '$jointeamid'
                    },
                    match: {
                        $first: '$match'
                    },
                    finalresultsTotalAmount: {
                        $first: '$finalresultsTotalAmount'
                    },
                    winingData: {
                        $first: "$winingData"
                    }
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
                    joinedleaugeId: {
                        $first: '$joinedleaugeId'
                    },
                    matchkey: {
                        $first: '$matchkey'
                    },
                    jointeamid: {
                        $first: '$jointeamid'
                    },
                    match: {
                        $first: '$match'
                    },
                    finalresultsTotalAmount: {
                        $first: '$finalresultsTotalAmount'
                    },
                    winingData: {
                        $first: "$winingData"
                    },
                    count: {
                        $sum: 1
                    },
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
                    matchname: {
                        $ifNull: ['$match.name', '']
                    },
                    winning_status: {
                        $ifNull: ["$winingData.winning_status", ""]
                    },
                    team1ShortName: {
                        $ifNull: ['$team1.short_name', '']
                    },
                    team2ShortName: {
                        $ifNull: ['$team2.short_name', '']
                    },
                    team1fullname: {
                        $ifNull: ['$team1.teamName', '']
                    },
                    team2fullname: {
                        $ifNull: ['$team2.teamName', '']
                    },
                    team1color: {
                        $ifNull: ['$team1.color', constant.TEAM_DEFAULT_COLOR.DEF1]
                    },
                    team2color: {
                        $ifNull: ['$team2.color', constant.TEAM_DEFAULT_COLOR.DEF1]
                    },
                    team1logo: {
                        $ifNull: [{
                            $cond: {
                                if: {
                                    $or: [{
                                        $eq: [{
                                            $substr: ['$team1.logo', 0, 1]
                                        }, '/']
                                    }, {
                                        $eq: [{
                                            $substr: ['$team1.logo', 0, 1]
                                        }, 't']
                                    }]
                                },
                                then: {
                                    $concat: [`${constant.BASE_URL}`, '', '$team1.logo']
                                },
                                else: '$team1.logo',
                            }
                        }, `${constant.BASE_URL}team_image.png`]
                    },
                    team2logo: {
                        $ifNull: [{
                            $cond: {
                                if: {
                                    $or: [{
                                        $eq: [{
                                            $substr: ['$team2.logo', 0, 1]
                                        }, '/']
                                    }, {
                                        $eq: [{
                                            $substr: ['$team2.logo', 0, 1]
                                        }, 't']
                                    }]
                                },
                                then: {
                                    $concat: [`${constant.BASE_URL}`, '', '$team2.logo']
                                },
                                else: '$team2.logo',
                            }
                        }, `${constant.BASE_URL}team_image.png`]
                    },
                    start_date: {
                        $ifNull: ['$match.start_date', '0000-00-00 00:00:00']
                    },
                    fantasy_type: "$match.fantasy_type",
                    status: {
                        $ifNull: [{
                                $cond: {
                                    if: {
                                        $lt: ['$match.start_date', moment().format('YYYY-MM-DD HH:mm:ss')]
                                    },
                                    then: 'closed',
                                    else: 'opened',
                                },
                            },
                            'opened',
                        ],
                    },
                    totalWinningAmount: {
                        $ifNull: ['$finalresultsTotalAmount.amount', 0]
                    },
                    launch_status: {
                        $ifNull: ['$match.launch_status', '']
                    },
                    final_status: {
                        $ifNull: ['$match.final_status', '']
                    },
                    series_name: {
                        $ifNull: ['$series.name', '']
                    },
                    type: {
                        $ifNull: ['$match.fantasy_type', 'Cricket']
                    },
                    series_id: {
                        $ifNull: ['$series._id', '']
                    },
                    available_status: {
                        $ifNull: [1, 1]
                    },
                    joinedcontest: {
                        $ifNull: ['$count', 0]
                    },
                }
            });
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




    async quizInformations(req) {
        try {
            const response = await axios({
                url: "https://rest.entitysport.com/v2/matches/60071/innings/1/commentary?token=8dac1e4f7ee5ce23c747d7216c1e66c0",
                method: "get",
            });
            console.log("responsefid", response.data.response.inning.fielding_team_id);

        } catch (error) {
            throw error;
        }
    }

    async updateIsViewedForBoatTeam(jointeamid) {
        try {
            await JoinQuizTeamModel.findOneAndUpdate({
                _id: mongoose.Types.ObjectId(jointeamid),
                user_type: 1,
                is_viewed: false
            }, {
                is_viewed: true
            });
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
                matchkey: {
                    $first: '$matchkey'
                },
                joinedleaugeId: {
                    $first: '$_id'
                },
                userid: {
                    $first: '$userid'
                },
                matchchallengeid: {
                    $first: '$challengeid'
                },
                jointeamid: {
                    $first: '$teamid'
                },
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
                $or: [{
                    'match.final_status': 'pending'
                }, {
                    'match.final_status': 'IsReviewed'
                }],
            },
        });



        aggPipe.push({
            $lookup: {
                from: 'joinedleauges',
                let: {
                    matchkey: '$matchkey',
                    userid: '$userid'
                },
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
                }, ],
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
                joinedleaugeId: {
                    $first: '$joinedleauges._id'
                },
                matchkey: {
                    $first: '$matchkey'
                },
                jointeamid: {
                    $first: '$jointeamid'
                },
                userid: {
                    $first: '$userid'
                },
                match: {
                    $first: '$match'
                },
            },
        });

        aggPipe.push({
            $group: {
                _id: '$matchkey',
                joinedleaugeId: {
                    $first: '$joinedleaugeId'
                },
                matchkey: {
                    $first: '$matchkey'
                },
                jointeamid: {
                    $first: '$jointeamid'
                },
                match: {
                    $first: '$match'
                },
                count: {
                    $sum: 1
                },
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
                    }, ],
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
                matchname: {
                    $ifNull: ['$match.name', '']
                },
                team1ShortName: {
                    $ifNull: ['$team1.short_name', '']
                },
                team2ShortName: {
                    $ifNull: ['$team2.short_name', '']
                },
                team1fullname: {
                    $ifNull: ['$team1.teamName', '']
                },
                team2fullname: {
                    $ifNull: ['$team2.teamName', '']
                },
                team1color: {
                    $ifNull: ['$team1.color', constant.TEAM_DEFAULT_COLOR.DEF1]
                },
                team2color: {
                    $ifNull: ['$team2.color', constant.TEAM_DEFAULT_COLOR.DEF1]
                },
                start_date: "$match.start_date",
                team1logo: {
                    $ifNull: [{
                        $cond: {
                            if: {
                                $or: [{
                                    $eq: [{
                                        $substr: ['$team1.logo', 0, 1]
                                    }, '/']
                                }, {
                                    $eq: [{
                                        $substr: ['$team1.logo', 0, 1]
                                    }, 't']
                                }]
                            },
                            then: {
                                $concat: [`${constant.BASE_URL}`, '', '$team1.logo']
                            },
                            else: '$team1.logo',
                        }
                    }, `${constant.BASE_URL}team_image.png`]
                },
                team2logo: {
                    $ifNull: [{
                        $cond: {
                            if: {
                                $or: [{
                                    $eq: [{
                                        $substr: ['$team2.logo', 0, 1]
                                    }, '/']
                                }, {
                                    $eq: [{
                                        $substr: ['$team2.logo', 0, 1]
                                    }, 't']
                                }]
                            },
                            then: {
                                $concat: [`${constant.BASE_URL}`, '', '$team2.logo']
                            },
                            else: '$team2.logo',
                        }
                    }, `${constant.BASE_URL}team_image.png`]
                },
                start_date: {
                    $ifNull: ['$match.start_date', '0000-00-00 00:00:00']
                },
                start_date1: {
                    $toDate: {
                        $ifNull: ['$match.start_date', '0000-00-00 00:00:00']
                    }
                },
                status: {
                    $ifNull: [{
                            $cond: {
                                if: {
                                    $lt: ['$match.start_date', moment().format('YYYY-MM-DD HH:mm:ss')]
                                },
                                then: 'closed',
                                else: 'opened',
                            },
                        },
                        'opened',
                    ],
                },
                launch_status: {
                    $ifNull: ['$match.launch_status', '']
                },
                final_status: {
                    $ifNull: ['$match.final_status', '']
                },
                series_name: {
                    $ifNull: ['$series.name', '']
                },
                type: {
                    $ifNull: ['$match.fantasy_type', 'Cricket']
                },
                series_id: {
                    $ifNull: ['$series._id', '']
                },
                available_status: {
                    $ifNull: [1, 1]
                },
                joinedcontest: {
                    $ifNull: ['$count', 0]
                },
                playing11_status: {
                    $ifNull: ['$playing11_status', 1]
                }
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


    async quizAnswerMatch(matchkey) {
        try {
            let joinData = await QuizJoinLeaugeModel.find({
                matchkey
            })
            let quizData = await quizModel.find({
                matchkey: matchkey
            })
            if (joinData.length == 0) {
                return {
                    message: "Quiz Answer Not Found",
                    status: false,
                    data: {}
                }
            }
            if (quizData.length == 0) {
                return {
                    message: " Quiz not found",
                    status: false,
                    data: {}
                }
            }
            let data;
            if (joinData.length > 0 && quizData.length > 0) {
                for (let join_data of joinData) {
                    for (let quiz_data of quizData) {
                        if (quiz_data._id.toString() === join_data.quizId.toString() && quiz_data.matchkey.toString() === join_data.matchkey.toString()) {
                            if (join_data.answer === quiz_data.answer) {
                                data = await QuizJoinLeaugeModel.findOneAndUpdate({
                                    matchkey: join_data.matchkey,
                                    quizId: join_data.quizId
                                }, {
                                    winamount: quiz_data.multiply
                                }, {
                                    new: true
                                })
                            }
                        }
                    }
                    return {
                        message: "Quiz Amount added successfully",
                        status: true,
                        data: joinData
                    }
                }
            }
        } catch (error) {
            throw error;
        }
    }

    async quizrefundprocess(quizId, entryfee, matchkey, reason) {
        console.log("-------------------------------------refundprocess-----------------------------")
        let joinLeagues = await QuizJoinLeaugeModel.find({
            matchkey: mongoose.Types.ObjectId(matchkey),
            quizId: mongoose.Types.ObjectId(quizId),
        });
        if (joinLeagues.length > 0) {
            for (let league of joinLeagues) {
                let leaugestransaction = league.leaugestransaction;
                let refund_data = await refundModel.findOne({
                    joinid: mongoose.Types.ObjectId(league._id)
                });
                if (!refund_data) {
                    const user = await userModel.findOne({
                        _id: leaugestransaction.user_id
                    }, {
                        userbalance: 1
                    });
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
                            quizId: league.quizId,
                            matchkey: matchkey,
                            reason: reason,
                            transaction_id: transaction_id
                        };
                        const transactiondata = {
                            type: 'Refund',
                            amount: entryfee,
                            total_available_amt: totalBalance + entryfee,
                            transaction_by: constant.APP_SHORT_NAME,
                            quizId: quizId,
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
                            userModel.findOneAndUpdate({
                                _id: leaugestransaction.user_id
                            }, userObj, {
                                new: true
                            }),
                            refundModel.create(refundData),
                            TransactionModel.create(transactiondata)
                        ]);
                    }
                }
            }
        }
        return true;
    }


    async findJoinLeaugeExist(matchkey, userId, teamId, challengeDetails) {
        if (!challengeDetails || challengeDetails == null || challengeDetails == undefined) return 4;

        const joinedLeauges = await JoinLeaugeModel.find({
            matchkey: matchkey,
            challengeid: challengeDetails._id,
            userid: userId,
        });
        if (joinedLeauges.length == 0) return 1;
        if (joinedLeauges.length > 0) {
            if (challengeDetails.multi_entry == 0) {
                return {
                    message: 'Contest Already joined',
                    status: false,
                    data: {}
                };
            } else {
                if (joinedLeauges.length >= challengeDetails.team_limit) {
                    return {
                        message: 'You cannot join with more teams now.',
                        status: false,
                        data: {}
                    };
                } else {
                    const joinedLeaugesCount = joinedLeauges.filter(item => {
                        return item.teamid.toString() === teamId;
                    });
                    if (joinedLeaugesCount.length) return {
                        message: 'Team already joined',
                        status: false,
                        data: {}
                    };
                    else return 2;
                }
            }
        }
    }

    async stockquizfindJoinLeaugeExist(userId, stockquizAnswer, quiz) {
        if (!quiz || quiz == null || quiz == undefined) return 4;

        const quizjoinedLeauges = await StockQuizJoinLeaugeModel.find({
            stockquizId: quiz._id,
            userid: userId,
        });
        if (quizjoinedLeauges.length == 0) return 1;
        if (quizjoinedLeauges.length > 0) {
            return {
                message: 'Contest Already joined',
                status: false,
                data: {}
            };
        }

    }

    async stockquizfindUsableBonusMoney(quiz, bonus, winning, balance) {
        // if (quiz.is_bonus != 1)
        //     return {
        //         bonus: bonus,
        //         cons_bonus: 0,
        //         reminingfee: quiz.entryfee
        //     };
        let totalQuizBonus = 0;
        totalQuizBonus = (quiz.bonus_percentage / 100) * quiz.entryfee;
        const finduserbonus = bonus;
        let findUsableBalance = winning + balance;
        let bonusUseAmount = 0;
        if (finduserbonus >= totalQuizBonus)
            (findUsableBalance += totalQuizBonus), (bonusUseAmount = totalQuizBonus);
        else findUsableBalance += bonusUseAmount = finduserbonus;
        if (findUsableBalance < quiz.entryfee) return false;
        if (bonusUseAmount >= quiz.entryfee) {
            return {
                bonus: finduserbonus - quiz.entryfee,
                cons_bonus: quiz.entryfee || 0,
                reminingfee: 0,
            };
        } else {
            return {
                bonus: finduserbonus - bonusUseAmount,
                cons_bonus: bonusUseAmount,
                reminingfee: quiz.entryfee - bonusUseAmount,
            };
        }
    }

    async stockquizfindUsableBalanceMoney(resultForBonus, balance) {
        if (balance >= resultForBonus.reminingfee)
            return {
                balance: balance - resultForBonus.reminingfee,
                cons_amount: resultForBonus.reminingfee,
                reminingfee: 0,
            };
        else
            return {
                balance: 0,
                cons_amount: balance,
                reminingfee: resultForBonus.reminingfee - balance
            };
    }

    async stockquizfindUsableWinningMoney(resultForBalance, winning) {
        if (winning >= resultForBalance.reminingfee) {
            return {
                winning: winning - resultForBalance.reminingfee,
                cons_win: resultForBalance.reminingfee,
                reminingfee: 0,
            };
        } else {
            return {
                winning: 0,
                cons_win: winning,
                reminingfee: resultForBalance.reminingfee - winning
            };
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
                    const totalJoinedUserInLeauge = await JoinLeaugeModel.find({
                        challengeid: mongoose.Types.ObjectId(matchchallenge._id)
                    });
                    if (matchchallenge.maximum_user == totalJoinedUserInLeauge.length) {
                        const update = {
                            $set: {
                                'status': 'closed',
                                'is_duplicated': 1,
                                'joinedusers': totalJoinedUserInLeauge.length,
                            },
                        };
                        if (matchchallenge.is_running == 1 && matchchallenge.is_duplicated != 1) {
                            let newmatchchallenge = {};
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
                                is_duplicated: {
                                    $ne: 1
                                }
                            });
                            if (!data) {
                                let createNewContest = new matchchallengesModel(newmatchchallenge);
                                let mynewContest = await createNewContest.save();
                            }
                            // console.log("---createNewContest----",mynewContest)
                        }
                        await matchchallengesModel.updateOne({
                            _id: mongoose.Types.ObjectId(matchchallenge._id)
                        }, update);
                    }
                }

            }
        } catch (error) {
            throw error;
        }

    };

    async getUserRank(rankArray) {

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

    async stockquizgetUsableBalance(req) {
        try {
            const {
                stockquizId
            } = req.query;
            if (stockquizId === undefined) {
                return {
                    message: "Stock Quiz Not Found",
                    status: false,
                    data: {}
                }
            }
            const quizData = await stockQuizModel.findOne({
                _id: mongoose.Types.ObjectId(stockquizId)
            });
            if (!quizData) {
                return {
                    message: 'Stock Quiz not found',
                    status: false,
                    data: {}
                }
            }

            const user = await userModel.findOne({
                _id: req.user._id
            }, {
                userbalance: 1
            });
            const bonus = parseFloat(user.userbalance.bonus.toFixed(2)) || 0;
            const balance = parseFloat(user.userbalance.balance.toFixed(2)) || 0;
            const winning = parseFloat(user.userbalance.winning.toFixed(2)) || 0;
            const totalBalance = bonus + balance + winning;
            const findUsableBalance = balance + winning;
            let findBonusAmount = 0,
                usedBonus = 0;
            if (quizData.is_bonus == 1 && quizData.bonus_percentage) findBonusAmount = (quizData.bonus_percentage / 100) * quizData.entryfee;
            if (bonus >= findBonusAmount) usedBonus = findBonusAmount;
            else usedBonus = bonus;
            return {
                message: 'Get amount to be used',
                status: true,
                data: {
                    usablebalance: findUsableBalance.toFixed(2).toString(),
                    usertotalbalance: totalBalance.toFixed(2).toString(),
                    entryfee: quizData.entryfee.toFixed(2).toString(),
                    bonus: usedBonus.toFixed(2).toString(),
                }
            }
        } catch (error) {
            throw error;
        }
    }

    async joinStockQuiz(req) {
        try {
            let {
                stockquizId,
                stockquizAnswer
            } = req.body
            let totalchallenges = 0,
                totalmatches = 0,
                totalseries = 0,
                joinedMatch = 0,
                joinedSeries = 0,
                aggpipe = [];

            aggpipe.push({
                $match: {
                    _id: mongoose.Types.ObjectId(stockquizId)
                }
            });
            const quizData = await stockQuizModel.aggregate(aggpipe);
            console.log(quizData,"lllllllll")
            if (quizData.length == 0) {
                return {
                    message: 'Stock Quiz Not Found',
                    success: false,
                    data: {}
                };
            }
            // let listmatchId = quizData[0].listmatch[0]._id;
            let quizDataId = quizData[0]._id;
            let quiz = quizData[0];
            // let seriesId = quizData[0].listmatch[0].series;
            // let matchStartDate = quizData[0].listmatch[0].start_date;
            let matchStartDate = quizData[0].start_date;

            const matchTime = await matchServices.getMatchTime(matchStartDate);
            if (matchTime === false) {
                return {
                    message: 'Stock Quiz has been closed, You cannot join leauge now.',
                    status: false,
                    data: {}
                }
            }

            const user = await userModel.findOne({
                _id: req.user._id
            }, {
                userbalance: 1
            });
            if (!user || !user.userbalance) return {
                message: 'Insufficient balance',
                status: false,
                data: {}
            };

            const bonus = parseFloat(user.userbalance.bonus.toFixed(2));
            const balance = parseFloat(user.userbalance.balance.toFixed(2));
            const winning = parseFloat(user.userbalance.winning.toFixed(2));
            const totalBalance = bonus + balance + winning;
            let i = 0,
                // count = 0,
                mainbal = 0,
                mainbonus = 0,
                mainwin = 0,
                tranid = '';
            
            const result = await this.stockquizfindJoinLeaugeExist(req.user._id, stockquizAnswer, quiz);
            let usebalance = await userModel.findOne({
                _id: req.user._id
            }, {
                userbalance: 1
            })
            if (usebalance.userbalance) {
                if (usebalance.userbalance?.balance < quiz.entryfee) {
                    return {
                        message: 'Insufficient balance',
                        status: false,
                        data: {}
                    }
                }
            }
            if (result != 1) {
                const userObj = {
                    'userbalance.balance': balance - mainbal,
                    'userbalance.bonus': bonus - mainbonus,
                    'userbalance.winning': winning - mainwin,
                    
                };
                let randomStr = randomstring.generate({
                    length: 4,
                    charset: 'alphabetic',
                    capitalization: 'uppercase'
                });

                const transactiondata = {
                    type: 'Stock Quiz Joining Fee',
                    contestdetail: `${quiz.entryfee}`,
                    amount: quiz.entryfee,
                    total_available_amt: totalBalance - quiz.entryfee,
                    transaction_by: constant.TRANSACTION_BY.WALLET,
                    stockquizId: stockquizId,
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
                    userModel.findOneAndUpdate({
                        _id: req.user._id
                    }, userObj, {
                        new: true
                    }),
                    TransactionModel.create(transactiondata)
                ]);
                return result;
            } else if (result != 1) {

                return result;
            }
            const resultForBonus = await this.stockquizfindUsableBonusMoney(
                quiz,
                bonus - mainbonus,
                winning - mainwin,
                balance - mainbal
            );

            if (resultForBonus == false) {
                // if (i > 1) {
                const userObj = {
                    'userbalance.balance': balance - mainbal,
                    'userbalance.bonus': bonus - mainbonus,
                    'userbalance.winning': winning - mainwin,
                    
                };
                let randomStr = randomstring.generate({
                    length: 4,
                    charset: 'alphabetic',
                    capitalization: 'uppercase'
                });
                const transactiondata = {
                    type: 'Stock Quiz Joining Fee',
                    contestdetail: `${quiz.entryfee}`,
                    amount: quiz.entryfee,
                    total_available_amt: totalBalance - quiz.entryfee,
                    transaction_by: constant.TRANSACTION_BY.WALLET,
                    stockquizId: stockquizId,
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
                    userModel.findOneAndUpdate({
                        _id: req.user._id
                    }, userObj, {
                        new: true
                    }),
                    TransactionModel.create(transactiondata)
                ]);
               
            }

            const resultForBalance = await this.stockquizfindUsableBalanceMoney(resultForBonus, balance - mainbal);
            const resultForWinning = await this.stockquizfindUsableWinningMoney(resultForBalance, winning - mainwin);
            // console.log(`---------------------3RD IF--BEFORE------${resultForWinning}---------`);
            if (resultForWinning.reminingfee > 0) {
                
                const userObj = {
                    'userbalance.balance': balance - mainbal,
                    'userbalance.bonus': bonus - mainbonus,
                    'userbalance.winning': winning - mainwin,
                };
                let randomStr = randomstring.generate({
                    length: 4,
                    charset: 'alphabetic',
                    capitalization: 'uppercase'
                });

                const transactiondata = {
                    type: 'Quiz Joining Fee',
                    contestdetail: `${quiz.entryfee}`,
                    amount: quiz.entryfee,
                    total_available_amt: totalBalance - quiz.entryfee,
                    transaction_by: constant.TRANSACTION_BY.WALLET,
                    stockquizId: stockquizId,
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
                    userModel.findOneAndUpdate({
                        _id: req.user._id
                    }, userObj, {
                        new: true
                    }),
                    TransactionModel.create(transactiondata)
                ]);
                
            }
            let randomStr = randomstring.generate({
                length: 4,
                charset: 'alphabetic',
                capitalization: 'uppercase'
            });

            const coupon = randomstring.generate({
                charset: 'alphanumeric',
                length: 4,
            });
            tranid = `${constant.APP_SHORT_NAME}-${Date.now()}-${randomStr}`;
            let referCode = `${constant.APP_SHORT_NAME}-${Date.now()}${coupon}`;
            if (result == 1) {
                let joinedQuiz = await StockQuizJoinLeaugeModel.find({
                    // matchkey: listmatchId,
                    userid: req.user._id
                }).limit(1).count();
                if (joinedQuiz == 0) {
                    joinedSeries = await StockQuizJoinLeaugeModel.find({
                        // seriesid: seriesId,
                        userid: req.user._id
                    }).limit(1).count();
                }
            }
            const quizjoinedLeauges = await StockQuizJoinLeaugeModel.find({
                stockquizId: quizDataId
            }).count();
            const joinUserCount = quizjoinedLeauges + 1;
            const quizjoinLeaugeResult = await StockQuizJoinLeaugeModel.create({
                userid: req.user._id,
                stockquizId: quizDataId,
                answer: stockquizAnswer,
                // matchkey: listmatchId,
                // seriesid: seriesId,
                transaction_id: tranid,
                refercode: referCode,
                leaugestransaction: {
                    user_id: req.user._id,
                    bonus: resultForBonus.cons_bonus,
                    balance: resultForBalance.cons_amount,
                    winning: resultForWinning.cons_win,
                },
            });
            const joinedLeaugesCount = await StockQuizJoinLeaugeModel.find({
                stockquizId: quizDataId,
                // matchkey: listmatchId
            }).count();
            if (result == 1) {
                totalchallenges = 1;
                if (joinedMatch == 0) {
                    totalmatches = 1;
                    if (joinedMatch == 0 && joinedSeries == 0) {
                        totalseries = 1;
                    }
                }
            }
            if (quizjoinLeaugeResult._id) {
                mainbal = mainbal + resultForBalance.cons_amount;
                mainbonus = mainbonus + resultForBonus.cons_bonus;
                mainwin = mainwin + resultForWinning.cons_win;
              
            }
            // else
            await stockQuizModel.findOneAndUpdate({
                _id: mongoose.Types.ObjectId(stockquizId)
            }, {
                joinedusers: joinedLeaugesCount,
            }, {
                new: true
            });
            
            const userObj = {
                'userbalance.balance': balance - mainbal,
                'userbalance.bonus': bonus - mainbonus,
                'userbalance.winning': winning - mainwin,
            };
            let randomStrr = randomstring.generate({
                length: 4,
                charset: 'alphabetic',
                capitalization: 'uppercase'
            });
            const transactiondata = {
                type: 'Stock Quiz Joining Fee',
                contestdetail: `${quiz.entryfee}`,
                amount: quiz.entryfee,
                total_available_amt: totalBalance - quiz.entryfee,
                transaction_by: constant.TRANSACTION_BY.WALLET,
                stockquizId: stockquizId,
                userid: req.user._id,
                paymentstatus: constant.PAYMENT_STATUS_TYPES.CONFIRMED,
                bal_bonus_amt: bonus - mainbonus,
                bal_win_amt: winning - mainwin,
                bal_fund_amt: balance - mainbal,
                cons_amount: mainbal,
                cons_bonus: mainbonus,
                cons_win: mainwin,
                transaction_id: tranid != '' ? tranid : `${constant.APP_SHORT_NAME}-${Date.now()}-${randomStrr}`,
            };
            Promise.all([
                userModel.findOneAndUpdate({
                    _id: req.user._id
                }, userObj, {
                    new: true
                }),
                TransactionModel.create(transactiondata)
            ]);
            // ----------------------------------------------------------------------------------------------------------------------

            return {
                message: 'Stock Quiz Joined',
                status: true,
                data: {
                    joinedusers: joinedLeaugesCount,
                    referCode: referCode
                }
            };
        } catch (error) {
            console.log(error)
            throw error;
        }
    }

    async NewjoinedStockQuiz(req) {
        let today = moment().format('YYYY-MM-DD HH:mm:ss');
        let userId = req.user._id
        const JoiendMatches = await StockQuizJoinLeaugeModel.aggregate([
            {
                '$match': {
                  'userid': new mongoose.Types.ObjectId(userId)
                }
              }, {
                '$group': {
                  '_id': '$stockquizId', 
                  'stockquizId': {
                    '$first': '$stockquizId'
                  }, 
                  'joinedleaugeId': {
                    '$first': '$_id'
                  }, 
                  'userid': {
                    '$first': '$userid'
                  }
                }
              }, {
                '$lookup': {
                  'from': 'stockquizzes', 
                  'localField': 'stockquizId', 
                  'foreignField': '_id', 
                  'as': 'contestData'
                }
              }, {
                '$unwind': {
                  'path': '$contestData'
                }
              }, {
                '$match': {
                  'contestData.is_enabled': true
                }
              }, {
                '$match': {
                  '$and': [
                    {
                      'contestData.final_status': 'pending'
                    }
                  ]
                }
              }, {
                '$lookup': {
                  'from': 'stockquizjoinedleauges', 
                  'let': {
                    'contestId': '$stockquizId', 
                    'userid': '$userid'
                  }, 
                  'pipeline': [
                    {
                      '$match': {
                        '$expr': {
                          '$and': [
                            {
                              '$eq': [
                                '$stockquizId', '$$contestId'
                              ]
                            }, {
                              '$eq': [
                                '$userid', '$$userid'
                              ]
                            }
                          ]
                        }
                      }
                    }
                  ], 
                  'as': 'joinedleauges'
                }
              }, {
                '$unwind': {
                  'path': '$joinedleauges'
                }
              }, {
                '$group': {
                  '_id': '$joinedleauges.stockquizId', 
                  'joinedleaugeId': {
                    '$first': '$joinedleauges._id'
                  }, 
                  'stockquizId': {
                    '$first': '$stockquizId'
                  }, 
                  'userid': {
                    '$first': '$userid'
                  }, 
                  'stockQuizData': {
                    '$first': '$contestData'
                  }
                }
            },
            {
                '$match':{"stockQuizData.start_date":{$gt:today}}
              },
            {
                '$project': {
                  'question': {
                    '$ifNull': [
                      '$stockQuizData.question', ''
                    ]
                  }, 
                  'win_amount': '$stockQuizData.winning_amount', 
                  '_id': '$stockQuizData._id', 
                  'joinedusers': '$stockQuizData.joinedusers', 
                  'start_date': '$stockQuizData.start_date', 
                  'end_date': '$stockQuizData.end_date', 
                  'entryfee': '$stockQuizData.entryfee', 
                  'start_date': {
                    '$ifNull': [
                      '$stockQuizData.start_date', '0000-00-00 00:00:00'
                    ]
                  }, 
                  'status': {
                    '$ifNull': [
                      {
                        '$cond': {
                          'if': {
                            '$lt': [
                              '$stockQuizData.start_date', today
                            ]
                          }, 
                          'then': 'opened', 
                          'else': 'closed'
                        }
                      }, 'opened'
                    ]
                  }, 
                  'final_status': {
                    '$ifNull': [
                      '$stockQuizData.final_status', ''
                    ]
                  }, 
                //   'joinedcontest': {
                //     '$ifNull': [
                //       '$count', 0
                //     ]
                //   }
                }
            }
        ]);
    
        if (JoiendMatches.length > 0) {
          return {
            message: 'User Joiend latest 5 Upcoming and live Stock Quiz data..',
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
    
    async NewjoinedStockQuizLive(req) {
        let today = moment().format('YYYY-MM-DD HH:mm:ss');
        let userId = req.user._id
        const JoiendMatches = await StockQuizJoinLeaugeModel.aggregate(
          [
            {
                '$match': {
                  'userid': new mongoose.Types.ObjectId(userId),
                }
              }, {
                '$group': {
                  '_id': '$stockquizId', 
                  'stockquizId': {
                    '$first': '$stockquizId'
                  }, 
                  'joinedleaugeId': {
                    '$first': '$_id'
                  }, 
                  'userid': {
                    '$first': '$userid'
                  }
                }
              }, {
                '$lookup': {
                  'from': 'stockquizzes', 
                  'localField': 'stockquizId', 
                  'foreignField': '_id', 
                  'as': 'contestData'
                }
              }, {
                '$unwind': {
                  'path': '$contestData'
                }
              }, {
                '$match': {
                  'contestData.is_enabled': true
                }
              }, {
                '$match': {
                  '$or': [
                    {
                      'contestData.final_status': 'pending'
                    }, {
                      'contestData.final_status': 'IsReviewed'
                    }
                  ]
                }
              }, {
                '$lookup': {
                  'from': 'stockquizjoinedleauges', 
                  'let': {
                    'contestId': '$stockquizId', 
                    'userid': '$userid'
                  }, 
                  'pipeline': [
                    {
                      '$match': {
                        '$expr': {
                          '$and': [
                            {
                              '$eq': [
                                '$stockquizId', '$$contestId'
                              ]
                            }, {
                              '$eq': [
                                '$userid', '$$userid'
                              ]
                            }
                          ]
                        }
                      }
                    }
                  ], 
                  'as': 'joinedleauges'
                }
              }, {
                '$unwind': {
                  'path': '$joinedleauges'
                }
              }, {
                '$group': {
                  '_id': '$joinedleauges.stockquizId', 
                  'joinedleaugeId': {
                    '$first': '$joinedleauges._id'
                  }, 
                  'stockquizId': {
                    '$first': '$stockquizId'
                  }, 
                  'userid': {
                    '$first': '$userid'
                  }, 
                  'stockQuizData': {
                    '$first': '$contestData'
                  }
                }
              }, {
                '$match': {
                  'contestData.start_date': {
                    '$lte': today
                  }
                }
              }, {
                '$project': {
                  'question': {
                    '$ifNull': [
                      '$stockQuizData.question', ''
                    ]
                  }, 
                  'win_amount': '$stockQuizData.winning_amount', 
                  '_id': '$stockQuizData._id', 
                  'joinedusers': '$stockQuizData.joinedusers', 
                  'end_date': '$stockQuizData.end_date', 
                  'entryfee': '$stockQuizData.entryfee', 
                  'start_date': '$stockQuizData.start_date', 
                  'start_date': {
                    '$ifNull': [
                      '$stockQuizData.start_date', '0000-00-00 00:00:00'
                    ]
                  }, 
                  'status': {
                    '$ifNull': [
                      {
                        '$cond': {
                          'if': {
                            '$lt': [
                              '$stockQuizData.start_date', today
                            ]
                          }, 
                          'then': 'closed', 
                          'else': 'opened'
                        }
                      }, 'opened'
                    ]
                  }, 
                  'final_status': {
                    '$ifNull': [
                      '$stockQuizData.final_status', ''
                    ]
                  }, 
                //   'joinedcontest': {
                //     '$ifNull': [
                //       '$count', 0
                //     ]
                //   }
                }
              }
          ]
        );
        if (JoiendMatches.length > 0) {
          return {
            message: 'User Joiend latest 5  live Stock Quiz  data..',
            status: true,
            data: JoiendMatches,
    
          };
        } else {
          return {
            message: 'No Data Found..',
            status: false,
            data: []
          };
        }
    }
    
    async AllCompletedStockQuiz(req) {
        try {
            let today = moment().format('YYYY-MM-DD HH:mm:ss')
            let userId = req.user._id
          const JoiendMatches = await StockQuizJoinLeaugeModel.aggregate([
            {
                '$match': {
                  'userid': new mongoose.Types.ObjectId(userId)
                }
              }, {
                '$group': {
                  '_id': '$stockquizId', 
                  'stockquizId': {
                    '$first': '$stockquizId'
                  }, 
                  'joinedleaugeId': {
                    '$first': '$_id'
                  }, 
                  'userid': {
                    '$first': '$userid'
                  }
                }
              }, {
                '$lookup': {
                  'from': 'stockquizzes', 
                  'localField': 'stockquizId', 
                  'foreignField': '_id', 
                  'as': 'contestData'
                }
              }, {
                '$unwind': {
                  'path': '$contestData'
                }
              }, {
                '$match': {
                  'contestData.is_enabled': true
                }
              }, {
                '$match': {
                  'contestData.final_status': 'winnerdeclared'
                }
              }, {
                '$lookup': {
                  'from': 'stockfinalresults', 
                  'let': {
                    'contestId': '$contestId'
                  }, 
                  'pipeline': [
                    {
                      '$match': {
                        '$expr': {
                          '$and': [
                            {
                              '$eq': [
                                '$$contestId', '$contestId'
                              ]
                            }, {
                              '$eq': [
                                '$userId', new mongoose.Types.ObjectId(userId)
                              ]
                            }
                          ]
                        }
                      }
                    }, {
                      '$group': {
                        '_id': null, 
                        'finalvalue': {
                          '$sum': '$finalvalue'
                        }
                      }
                    }
                  ], 
                  'as': 'finalresultsTotalAmount'
                }
              }, {
                '$lookup': {
                  'from': 'stockquizjoinedleauges', 
                  'let': {
                    'contestId': '$stockquizId', 
                    'userid': '$userid'
                  }, 
                  'pipeline': [
                    {
                      '$match': {
                        '$expr': {
                          '$and': [
                            {
                              '$eq': [
                                '$stockquizId', '$$contestId'
                              ]
                            }, {
                              '$eq': [
                                '$userid', '$$userid'
                              ]
                            }
                          ]
                        }
                      }
                    }
                  ], 
                  'as': 'joinedleauges'
                }
              }, {
                '$unwind': {
                  'path': '$joinedleauges'
                }
              }, {
                '$group': {
                  '_id': '$joinedleauges.stockquizId', 
                  'joinedleaugeId': {
                    '$first': '$joinedleauges._id'
                  }, 
                  'stockQuizData': {
                    '$first': '$contestData'
                  }, 
                  'match': {
                    '$first': '$match'
                  }, 
                  'finalresultsTotalAmount': {
                    '$first': '$finalresultsTotalAmount'
                  }
                }
              }, {
                '$addFields': {
                  'date': {
                    'dateString': '$stockQuizData.start_date'
                  }, 
                  'curDate': today
                }
              }, {
                '$match': {
                  '$expr': {
                    '$and': [
                      {
                        '$lte': [
                          '$date.dateString', today
                        ]
                      }
                    ]
                  }
                }
              }, {
                '$project': {
                  'question': {
                    '$ifNull': [
                      '$stockQuizData.question', ''
                    ]
                  }, 
                  'win_amount': '$stockQuizData.winning_amount', 
                  '_id': '$stockQuizData._id', 
                  'joinedusers': '$stockQuizData.joinedusers', 
                  'end_date': '$stockQuizData.end_date', 
                  'entryfee': '$stockQuizData.entryfee', 
                  'start_date': '$stockQuizData.start_date', 
                  'start_date': {
                    '$ifNull': [
                      '$stockQuizData.start_date', '0000-00-00 00:00:00'
                    ]
                  }, 
                  'status': {
                    '$ifNull': [
                      {
                        '$cond': {
                          'if': {
                            '$lt': [
                              '$stockQuizData.start_date', today
                            ]
                          }, 
                          'then': 'closed', 
                          'else': 'opened'
                        }
                      }, 'opened'
                    ]
                  }, 
                  'final_status': {
                    '$ifNull': [
                      '$stockQuizData.final_status', ''
                    ]
                  }, 
                  'joinedcontest': {
                    '$ifNull': [
                      '$count', 0
                    ]
                  }
                }
              }
          ]);
    
          if (JoiendMatches.length > 0) {
            return {
              message: 'User Joiend All Completed Stock Quiz Data..',
              status: true,
              data: JoiendMatches,
    
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
}
module.exports = new quizfantasyServices();