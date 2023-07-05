const mongoose = require('mongoose');
const randomstring = require("randomstring");
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const https = require('https');
const url = require('url');
const axios = require('axios');
const crypto = require('crypto');
const { createHash } = require('crypto');
require('../../models/challengersModel');
require('../../models/playerModel');
require('../../models/teamModel');
const matchchallengesModel = require('../../models/matchChallengersModel');
const listMatchesModel = require('../../models/listMatchesModel');
const SeriesModel = require('../../models/addSeriesModel');
const matchPlayersModel = require('../../models/matchPlayersModel');
const JoinLeaugeModel = require('../../models/JoinLeaugeModel');
const playerModel = require("../../models/playerModel");
const JoinTeamModel = require('../../models/JoinTeamModel');
const matchrunModel = require('../../models/matchRunModel');
const EntityApiController = require('../../admin/controller/cricketApiController');
const userModel = require("../../models/userModel");

const constant = require('../../config/const_credential');
const NOTIFICATION_TEXT = require('../../config/notification_text');
const { deleteOne } = require('../../models/matchChallengersModel');
const { updatePlayersCount } = require("../services/cronJobServices")
const Redis = require('../../utils/redis');
class matchServices {
    constructor() {
        return {
            getAllSeries: this.getAllSeries.bind(this),
            getMatchList: this.getMatchList.bind(this),
            Newjoinedmatches: this.Newjoinedmatches.bind(this),
            latestJoinedMatches: this.latestJoinedMatches.bind(this),
            getMatchDetails: this.getMatchDetails.bind(this),
            getallplayers: this.getallplayers.bind(this),
            getallplayersopt:this.getallplayersopt.bind(this),
            getPlayerInfo: this.getPlayerInfo.bind(this),
            createMyTeam: this.createMyTeam.bind(this),
            getMyTeams: this.getMyTeams.bind(this),
            viewTeam: this.viewTeam.bind(this),
            getMatchTime: this.getMatchTime.bind(this),
            AllCompletedMatches: this.AllCompletedMatches.bind(this),
            getLiveScores: this.getLiveScores.bind(this),
            liveRanksLeaderboard: this.liveRanksLeaderboard.bind(this),
            fantasyScoreCards: this.fantasyScoreCards.bind(this),
            matchPlayerFantasyScoreCards: this.matchPlayerFantasyScoreCards.bind(this),
            matchlivedata: this.matchlivedata.bind(this),
            NewjoinedmatchesLive: this.NewjoinedmatchesLive.bind(this),
            getAllPlayersWithPlayingStatus: this.getAllPlayersWithPlayingStatus.bind(this),
            joinTeamPlayerInfo: this.joinTeamPlayerInfo.bind(this),
            updateTotalPoints: this.updateTotalPoints.bind(this),
            //sahil apk 
            downloadApp:this.downloadApp.bind(this),
            //sahil apk 
            //phonepayapi
            phonepayapi:this.phonepayapi.bind(this),
            getJoinleague:this.getJoinleague.bind(this),
            phonepayapiwithbase64:this.phonepayapiwithbase64.bind(this),
            phonepayapiwithcalling:this.phonepayapiwithcalling.bind(this)

        }
    }
    async updateIsViewedForBoatTeam(jointeamid) {
        try {
            await JoinTeamModel.findOneAndUpdate({
                _id: mongoose.Types.ObjectId(jointeamid),
                user_type: 1,
                is_viewed: false
            }, { is_viewed: true });
            return true;
        } catch (error) {
            throw error;
        }
    }
    /**
     * @function getAllSeries
     * @description Get All Matches
     * @param { }
     * @author 
     */
    async getAllSeries(req) {
        try {
            const series = await SeriesModel.find({
                status: constant.SERIES_STATUS.OPENED,
                end_date: { $gte: moment().format('YYYY-MM-DD HH:mm:ss') },
            }, { _id: 1, name: 1, start_date: 1, end_date: 1, status: 1 }).sort({ end_date: -1 });
            if (series.length == 0) {
                return {
                    message: 'Sorry,no data available!',
                    status: true,
                    data: []
                }
            }
            let arr = [];
            for (let item of series) {
                let obj = {
                    id: item._id,
                    name: item.name,
                    status: 1,
                    startdate: moment(item.start_date).format('DD MMM YYYY'),
                    starttime: moment(item.start_date).format('h:mm a'),
                    enddate: moment(item.end_date).format('DD MMM YYYY'),
                    endtime: moment(item.end_date).format('h:mm a'),
                    startdatetime: moment(item.start_date).format('YYYY-MM-DD h:mm:ss'),
                    enddatetime: moment(item.end_date).format('YYYY-MM-DD h:mm:ss')
                }
                arr.push(obj);
            }
            if (series.length == arr.length) {
                return {
                    message: 'Series Data...!',
                    status: true,
                    data: arr
                }
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * @function getMatchList
     * @description Get All Match List
     * @param { }
     * @author 
     */
    async getMatchList() {
        try {
            let matchpipe = [];
            let date = moment().format('YYYY-MM-DD HH:mm:ss');
            let EndDate = moment().add(25, 'days').format('YYYY-MM-DD HH:mm:ss');

            matchpipe.push({
                $match: {
                    'fantasy_type': "Cricket"
                },
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
            // matchpipe.push({
            //     $sort: {
            //         start_date: 1,
            //     },
            // });
            let today = new Date();
            today.setHours(today.getHours() + 5);
            today.setMinutes(today.getMinutes() + 30);
            // console.log("---today------", today)
            matchpipe.push({
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
            matchpipe.push({
                $match: {
                    $expr: {
                        $and: [{
                            $gte: ['$date', today],
                        },
                        ],
                    },
                }
            });

            matchpipe.push({
                $sort: {
                    'match_order': -1,
                    'date': 1,
                },
            });
            // matchpipe.push({
            //     $sort:{

            //     }
            // });
            matchpipe.push({
                $project: {
                    _id: 0,
                    id: '$_id',
                    name: 1,
                    format: 1,
                    notify:1,
                    order_status: 1,
                    series: { $arrayElemAt: ['$series._id', 0] },
                    seriesname: { $arrayElemAt: ['$series.name', 0] },
                    team1name: { $arrayElemAt: ['$team1.short_name', 0] },
                    team2name: { $arrayElemAt: ['$team2.short_name', 0] },
                    teamfullname1: { $arrayElemAt: ['$team1.teamName', 0] },
                    teamfullname2: { $arrayElemAt: ['$team2.teamName', 0] },
                    matchkey: 1,
                    fantasy_type: '$fantasy_type',
                    winnerstatus: '$final_status',
                    playing11_status: 1,
                    team1color: { $ifNull: [{ $arrayElemAt: ['$team1.color', 0] }, constant.TEAM_DEFAULT_COLOR.DEF1] },
                    team2color: { $ifNull: [{ $arrayElemAt: ['$team2.color', 0] }, constant.TEAM_DEFAULT_COLOR.DEF1] },
                    team1logo: {
                        $ifNull: [{
                            $cond: {
                                if: { $or: [{ $eq: [{ $substr: [{ $arrayElemAt: ['$team1.logo', 0] }, 0, 1] }, '/'] }, { $eq: [{ $substr: [{ $arrayElemAt: ['$team1.logo', 0] }, 0, 1] }, 't'] }] },
                                then: { $concat: [`${constant.BASE_URL}/`, '', { $arrayElemAt: ['$team1.logo', 0] }] },
                                else: { $arrayElemAt: ['$team1.logo', 0] },
                            }
                        }, `${constant.BASE_URL}/team_image.png`]
                    },
                    team2logo: {
                        $ifNull: [{
                            $cond: {
                                if: { $or: [{ $eq: [{ $substr: [{ $arrayElemAt: ['$team2.logo', 0] }, 0, 1] }, '/'] }, { $eq: [{ $substr: [{ $arrayElemAt: ['$team2.logo', 0] }, 0, 1] }, 't'] }] },
                                then: { $concat: [`${constant.BASE_URL}/`, '', { $arrayElemAt: ['$team2.logo', 0] }] },
                                else: { $arrayElemAt: ['$team2.logo', 0] },
                            }
                        }, `${constant.BASE_URL}/team_image.png`]
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
                    match_order: 1
                },
            });



            const result = await listMatchesModel.aggregate(matchpipe);
            // result.sort(function(a, b){
            //     return b.match_order
            //   });
            // if (result.length > 0)
            return result
            // else return [];
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    /**
     * @function latestJoinedMatches
     * @description show all type of joined matches(upcoming, live, completed)
     * @param { }
     * @author 
     */
    async latestJoinedMatches(req) {

        const aggPipe = [];
        aggPipe.push({
            $match: {
                userid: mongoose.Types.ObjectId(req.user._id),
            }
        },);
        //implemented by sahil
        aggPipe.push({
            $lookup: {
                from: 'matchchallenges',
                localField: 'challengeid',
                foreignField: '_id',
                as: 'matchchalleng'
            }
        },);
        aggPipe.push({
            $unwind: {
                path: "$matchchalleng"
            }
        },);


        aggPipe.push({
            $match: {
                "matchchalleng.status": { "$nin": ["canceled"] }
            }
        },);
        aggPipe.push({
            $group: {
                _id: '$matchkey',
                matchkey: { $first: '$matchkey' },
                joinedleaugeId: { $first: '$_id' },
                userid: { $first: '$userid' },
                matchchallengeid: { $first: '$challengeid' },
                jointeamid: { $first: '$teamid' },
            }
        },);
        aggPipe.push({
            $lookup: {
                from: 'listmatches',
                localField: 'matchkey',
                foreignField: '_id',
                as: 'match'
            }
        },);
        aggPipe.push({
            $unwind: {
                path: '$match'
            }
        },);
        
        aggPipe.push({
            $match: {
                'match.fantasy_type': "Cricket"
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
        },);

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
        },);
        aggPipe.push({
            $unwind: {
                path: '$joinedleauges',
            },
        },);
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
        },);
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
        },);
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
        },);
        aggPipe.push({
            $lookup: {
                from: 'teams',
                localField: 'match.team1Id',
                foreignField: '_id',
                as: 'team1',
            },
        },);
        aggPipe.push({
            $lookup: {
                from: 'teams',
                localField: 'match.team2Id',
                foreignField: '_id',
                as: 'team2',
            },
        },);
        aggPipe.push({
            $unwind: {
                path: '$series',
            },
        },);
        aggPipe.push({
            $unwind: {
                path: '$team1',
            },
        },);
        aggPipe.push({
            $unwind: {
                path: '$team2',
            },
        },);
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
            $sort: {
                'date': -1,
            },
        });
        aggPipe.push({
            $limit: 5
        },);
        aggPipe.push({
            $project: {
                _id: 0,
                matchkey: 1,
                playing11_status: { $ifNull: ['$match.playing11_status', 1] },
                matchname: { $ifNull: ['$match.name', ''] },
                team1ShortName: { $ifNull: ['$team1.short_name', ''] },
                team2ShortName: { $ifNull: ['$team2.short_name', ''] },
                teamfullname1: { $ifNull: ['$team1.teamName', ''] },
                teamfullname2: { $ifNull: ['$team2.teamName', ''] },
                team1color: { $ifNull: ['$team1.color', constant.TEAM_DEFAULT_COLOR.DEF1] },
                team2color: { $ifNull: ['$team2.color', constant.TEAM_DEFAULT_COLOR.DEF1] },
                team1logo: {
                    $ifNull: [{
                        $cond: {
                            if: { $or: [{ $eq: [{ $substr: ['$team1.logo', 0, 1] }, '/'] }, { $eq: [{ $substr: ['$team1.logo', 0, 1] }, 't'] }] },
                            then: { $concat: [`${constant.BASE_URL}/`, '', '$team1.logo'] },
                            else: '$team1.logo',
                        }
                    }, `${constant.BASE_URL}/team_image.png`]
                },
                team2logo: {
                    $ifNull: [{
                        $cond: {
                            if: { $or: [{ $eq: [{ $substr: ['$team2.logo', 0, 1] }, '/'] }, { $eq: [{ $substr: ['$team2.logo', 0, 1] }, 't'] }] },
                            then: { $concat: [`${constant.BASE_URL}/`, '', '$team2.logo'] },
                            else: '$team2.logo',
                        }
                    }, `${constant.BASE_URL}/team_image.png`]
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
            }
        });

        const JoiendMatches = await JoinLeaugeModel.aggregate(aggPipe);
        return JoiendMatches;
    }

    /**
     * @function Newjoinedmatches
     * @description User Joiend latest 5 Upcoming and live match
     * @param { }
     * @author 
     */
    async Newjoinedmatches(req) {
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
                'match.fantasy_type': "Cricket"
            },
        });
        aggPipe.push({
            $match: {
                $and: [
                    { 'match.final_status': 'pending' },

                ],
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
                        $gte: ['$date', today],
                    },
                    ],
                },
            }
        });

        aggPipe.push({
            $sort: {
                'date': 1,
            },
        });
        aggPipe.push({
            $project: {
                _id: 0,
                date: 1,
                curDate: 1,
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
                playing11_status: { $ifNull: ['$match.playing11_status', 1] }
            }
        });
        aggPipe.push({
            $limit: 10,
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

    /**
     * @function AllCompletedMatches
     * @description User Joiend all completed matches shows
     * @param { }
     * @author 
     */
    async AllCompletedMatches(req) {
        try {
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
                    'match.fantasy_type': "Cricket"
                },
            });
            aggPipe.push({
                $match: { 'match.final_status': 'winnerdeclared' },
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
            // aggPipe.push({
            //     $unwind: { path: '$finalresultsTotalAmount' }
            // });
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
                $match: {
                    'matchchallenge.status':{$ne:"canceled"}
                }
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
                $limit:10
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
                    // totalWinningAmount: { $ifNull: ["$finalresultsTotalAmount.amount", 0] },
                    totalWinningAmount: {
                        $ifNull: [{ $arrayElemAt: ["$finalresultsTotalAmount.amount", 0] }, 0]
                    },
                    launch_status: { $ifNull: ['$match.launch_status', ''] },
                    final_status: { $ifNull: ['$match.final_status', ''] },
                    series_name: { $ifNull: ['$series.name', ''] },
                    type: { $ifNull: ['$match.fantasy_type', 'Cricket'] },
                    series_id: { $ifNull: ['$series._id', ''] },
                    available_status: { $ifNull: [1, 1] },
                    joinedcontest: { $ifNull: ['$count', 0] },
                }
            });
            const JoiendMatches = await JoinLeaugeModel.aggregate(aggPipe);
            if (JoiendMatches.length > 0) {
                return {
                    message: 'User Joiend All Completed Matches Data..',
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

    /**
     * @function getMatchDetails
     * @description Give matches detailed listing
     * @param { matchkey }
     * @author 
     */
    async getMatchDetails(req) {
        try {
            const matchPipe = [];
            matchPipe.push({
                $match: { _id: mongoose.Types.ObjectId(req.params.matchId) }
            });
            matchPipe.push({
                $lookup: {
                    from: 'series',
                    localField: 'series',
                    foreignField: '_id',
                    as: 'series'
                }
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
                    time_start: '$start_date',
                    matchstatus: {
                        $cond: {
                            if: { $ne: ['$status', 'notstarted'] },
                            then: {
                                $cond: {
                                    if: { $eq: ['$status', 'started'] },
                                    then: '$status',
                                    else: '$final_status'
                                }
                            },
                            else: {
                                $cond: {
                                    if: { $lte: ['$start_date', moment().format('YYYY-MM-DD HH:mm:ss')] },
                                    then: 'started',
                                    else: 'notstarted',
                                }
                            }
                        }
                    },
                    // totalcontest: {
                    //     $size: {
                    //         $filter: {
                    //             input: '$matchchallenges',
                    //             as: 'challange',
                    //             cond: { $eq: ['$$challange.status', 'opened'] },
                    //         },
                    //     },
                    // },
                    launch_status: 1,
                },
            });
            const result = await listMatchesModel.aggregate(matchPipe);
            if (result.length > 0) {
                return {
                    message: 'Details of a perticular match',
                    status: true,
                    data: result
                }
            } else {
                return {
                    message: 'Not Able To Find Details of a perticular match.....!',
                    status: false,
                    data: []
                }
            }
        } catch (error) {
            throw error;
        }
    }
    
    async updateTotalPoints(req) {
        try {
            //sahil redis
            // let keyname=`updateTotalPoints-${req.params.matchId}`
            // let redisdata=await Redis.getkeydata(keyname);
            // let getseries;
            // if(redisdata)
            // {
            //     getseries=redisdata;
            // }
            // else
            // {
            //     getseries = await listMatchesModel.findOne({ _id: req.params.matchId }, { series: 1 });
            //     let redisdata=Redis.setkeydata(keyname,getseries,60*60*4);
            // }

            //sahil redis end
            const getseries = await listMatchesModel.findOne({ _id: req.params.matchId }, { series: 1 });
            // console.log("seriessahil" + getseries)
            const listMatchSeries = await listMatchesModel.aggregate([{
                $match: { series: getseries.series,status:{$ne:"notstarted"} }
            }, {
                $group: {
                    _id: null,
                    matchIds: { $push: "$$ROOT._id" }
                }
            }], { _id: 1 });
            // console.log("listMatchSeries",listMatchSeries)
            return listMatchSeries?.[0]?.matchIds || [];

        } catch (error) {
            throw error;
        }
    }

    /**
     * @function getallplayers
     * @description  Get Match All Players 
     * @param { matchkey }
     * @author 
     */
   
     async getallplayers(req) {
        try {
            // await updatePlayersCount(req);
            let playerPipe = [];
            playerPipe.push({
                $match: { matchkey: mongoose.Types.ObjectId(req.params.matchId) }
            });
            playerPipe.push({
                $lookup: {
                    from: 'players',
                    localField: 'playerid',
                    foreignField: '_id',
                    as: 'playersData'
                }
            });
            playerPipe.push({
                $lookup: {
                    from: 'listmatches',
                    localField: 'matchkey',
                    foreignField: '_id',
                    as: 'listmatches'
                }
            });
            playerPipe.push({
                $unwind: { path: "$playersData" }
            });
            playerPipe.push({
                $unwind: { path: "$listmatches" }
            });
            playerPipe.push({
                $lookup: {
                    from: "teams",
                    localField: 'playersData.team',
                    foreignField: '_id',
                    as: 'team'
                }
            });
            playerPipe.push({
                $project: {
                    _id: 0,
                    // id: '$_id',
                    playerid: '$playerid',//'$_id'
                    p_id: '$_id',//'$playerid'
                    points: 1,
                    role: 1,
                    credit: 1,
                    name: 1,
                    playingstatus: 1,
                    vplaying: 1,
                    players_key: '$playersData.players_key',
                    image: {
                        $ifNull: [{
                            $cond: {
                                if: {
                                    $or: [{ $eq: [{ $substr: ['$playersData.image', 0, 1] }, '/'] },
                                    { $eq: [{ $substr: ['$playersData.image', 0, 1] }, 'p'] }]
                                },
                                then: { $concat: [`${constant.BASE_URL}/`, '', '$playersData.image'] },
                                else: {
                                    $cond: {
                                        if: { $eq: ['$playersData.image', ''] },
                                        then: {
                                            $cond: {
                                                if: { $eq: ['$playersData.team', '$listmatches.team1Id'] },
                                                then: `${constant.BASE_URL}/white_team1.png`,
                                                else: {
                                                    $cond: {
                                                        if: { $eq: ['$playersData.team', '$listmatches.team2Id'] },
                                                        then: `${constant.BASE_URL}/black_team1.png`,
                                                        else: `${constant.BASE_URL}/black_team1.png`
                                                    }
                                                }
                                            }
                                        },
                                        else: '$playersData.image'
                                    }
                                }
                            }
                        }, `${constant.BASE_URL}/black_team1.png`]
                    },
                    teamName: { $arrayElemAt: ['$team.teamName', 0] },
                    teamcolor: { $ifNull: [{ $arrayElemAt: ['$team.color', 0] }, constant.TEAM_DEFAULT_COLOR.DEF1] },
                    team_logo: {
                        $ifNull: [{
                            $cond: {
                                if: { $or: [{ $eq: [{ $substr: [{ $arrayElemAt: ['$team.logo', 0] }, 0, 1] }, '/'] }, { $eq: [{ $substr: [{ $arrayElemAt: ['$team.logo', 0] }, 0, 1] }, 't'] }] },
                                then: { $concat: [`${constant.BASE_URL}/`, '', { $arrayElemAt: ['$team.logo', 0] }] },
                                else: { $arrayElemAt: ['$team.logo', 0] },
                            }
                        }, `${constant.BASE_URL}/team_image.png`]
                    },
                    team_short_name: { $arrayElemAt: ['$team.short_name', 0] },
                    totalpoints: '0',
                    team: {
                        $cond: {
                            if: { $eq: ['$playersData.team', '$listmatches.team1Id'] },
                            then: 'team1',
                            else: {
                                $cond: {
                                    if: { $eq: ['$playersData.team', '$listmatches.team2Id'] },
                                    then: 'team2',
                                    else: ''
                                }
                            }
                        }
                    },
                    totalSelected: 1,
                    vicecaptainSelected: 1,
                    captainSelected: 1
                }
            })
            playerPipe.push({
                $addFields: {
                    player_selection_percentage: "$totalSelected",
                    captain_selection_percentage: "$captainSelected",
                    vice_captain_selection_percentage: "$vicecaptainSelected"
                }
            });

            let [data, listMatchSeries] = await Promise.all([
                matchPlayersModel.aggregate(playerPipe),
                this.updateTotalPoints(req)
            ]);
            let getTeam;
            if(req.query?.teamId){
                getTeam = await JoinTeamModel.findOne({ _id: req.query.teamId })
            }
            let myArray = [];
            let i = 0;
            let ttlCridit= 0;
            if (data.length > 0) {
                for await (let pkey of data) {
                    pkey.isSelectedPlayer= false;
                    
                    if(getTeam){
                        if(getTeam.players.includes((pkey.playerid).toString())){
                            pkey.isSelectedPlayer=true;
                            ttlCridit= ttlCridit+pkey.credit
                        }
                    }
                    if (listMatchSeries.length > 0) {
                        const getPoints = await matchPlayersModel.find({ matchkey: { $in: listMatchSeries }, playerid: pkey.playerid }, { points: 1 });
                        if ((getPoints || []).length > 0) {
                            getPoints.forEach((ele) => {
                                pkey.totalpoints = Number(pkey?.totalpoints || 0) + Number(ele?.points || 0)
                            });
                        }
                    }
                    myArray.push(pkey);
                    i++;
                    if (i == data.length) {
                        return {
                            message: 'Players List By Match',
                            status: true,
                            data: myArray,
                            ttlCridit:ttlCridit

                        }
                    }
                }
            } else {
                return {
                    message: 'Players List Not available By Match',
                    status: false,
                    data: []
                }
            }
        } catch (error) {
            console.log(error)
            throw error;
        }
    }
    async getallplayersopt(req) {
        try {
            // await updatePlayersCount(req);
            let playerPipe = [];
            playerPipe.push({
                $match: { matchkey: mongoose.Types.ObjectId(req.params.matchId) }
            });
            playerPipe.push({
                $lookup: {
                    from: 'players',
                    localField: 'playerid',
                    foreignField: '_id',
                    as: 'playersData'
                }
            });
            playerPipe.push({
                $lookup: {
                    from: 'listmatches',
                    localField: 'matchkey',
                    foreignField: '_id',
                    as: 'listmatches'
                }
            });
            playerPipe.push({
                $unwind: { path: "$playersData" }
            });
            playerPipe.push({
                $unwind: { path: "$listmatches" }
            });
            playerPipe.push({
                $lookup: {
                    from: "teams",
                    localField: 'playersData.team',
                    foreignField: '_id',
                    as: 'team'
                }
            });
            playerPipe.push({
                $project: {
                    _id: 0,
                    // id: '$_id',
                    playerid: '$playerid',//'$_id'
                    p_id: '$_id',//'$playerid'
                    points: 1,
                    role: 1,
                    credit: 1,
                    name: 1,
                    playingstatus: 1,
                    vplaying: 1,
                    players_key: '$playersData.players_key',
                    image: {
                        $ifNull: [{
                            $cond: {
                                if: {
                                    $or: [{ $eq: [{ $substr: ['$playersData.image', 0, 1] }, '/'] },
                                    { $eq: [{ $substr: ['$playersData.image', 0, 1] }, 'p'] }]
                                },
                                then: { $concat: [`${constant.BASE_URL}/`, '', '$playersData.image'] },
                                else: {
                                    $cond: {
                                        if: { $eq: ['$playersData.image', ''] },
                                        then: {
                                            $cond: {
                                                if: { $eq: ['$playersData.team', '$listmatches.team1Id'] },
                                                then: `${constant.BASE_URL}/white_team1.png`,
                                                else: {
                                                    $cond: {
                                                        if: { $eq: ['$playersData.team', '$listmatches.team2Id'] },
                                                        then: `${constant.BASE_URL}/black_team1.png`,
                                                        else: `${constant.BASE_URL}/black_team1.png`
                                                    }
                                                }
                                            }
                                        },
                                        else: '$playersData.image'
                                    }
                                }
                            }
                        }, `${constant.BASE_URL}/black_team1.png`]
                    },
                    teamName: { $arrayElemAt: ['$team.teamName', 0] },
                    teamcolor: { $ifNull: [{ $arrayElemAt: ['$team.color', 0] }, constant.TEAM_DEFAULT_COLOR.DEF1] },
                    team_logo: {
                        $ifNull: [{
                            $cond: {
                                if: { $or: [{ $eq: [{ $substr: [{ $arrayElemAt: ['$team.logo', 0] }, 0, 1] }, '/'] }, { $eq: [{ $substr: [{ $arrayElemAt: ['$team.logo', 0] }, 0, 1] }, 't'] }] },
                                then: { $concat: [`${constant.BASE_URL}/`, '', { $arrayElemAt: ['$team.logo', 0] }] },
                                else: { $arrayElemAt: ['$team.logo', 0] },
                            }
                        }, `${constant.BASE_URL}/team_image.png`]
                    },
                    team_short_name: { $arrayElemAt: ['$team.short_name', 0] },
                    totalpoints: '0',
                    team: {
                        $cond: {
                            if: { $eq: ['$playersData.team', '$listmatches.team1Id'] },
                            then: 'team1',
                            else: {
                                $cond: {
                                    if: { $eq: ['$playersData.team', '$listmatches.team2Id'] },
                                    then: 'team2',
                                    else: ''
                                }
                            }
                        }
                    },
                    totalSelected: 1,
                    vicecaptainSelected: 1,
                    captainSelected: 1
                }
            })
            playerPipe.push({
                $addFields: {
                    player_selection_percentage: "$totalSelected",
                    captain_selection_percentage: "$captainSelected",
                    vice_captain_selection_percentage: "$vicecaptainSelected"
                }
            });

            let [data, totalteam, listMatchSeries] = await Promise.all([
                matchPlayersModel.aggregate(playerPipe),
                JoinTeamModel.countDocuments({ matchkey: req.params.matchId }),
                this.updateTotalPoints(req)
            ]);
            //console.log("data",data,"listMatchSeries",listMatchSeries);
            let myArray = {"batsman":[],
            "bowler":[],
            "allrounder":[],
            "keeper":[]};
            let i = 0;
            //sahil last player
            
            // let last_matches_of_teams=await listMatchesModel.aggregate([
            //     {
            //       '$match': {
            //         '_id': mongoose.Types.ObjectId(req.params.matchId)
            //       }
            //     }, {
            //       '$lookup': {
            //         'from': 'listmatches', 
            //         'let': {
            //           't1': '$team1Id', 
            //           't2': '$team2Id'
            //         }, 
            //         'pipeline': [
            //           {
            //             '$match': {
            //               '$expr': {
            //                 '$or': [
            //                   {
            //                     '$eq': [
            //                       '$team1Id', '$$t1'
            //                     ]
            //                   }, {
            //                     '$eq': [
            //                       '$team2Id', '$$t1'
            //                     ]
            //                   }
            //                 ]
            //               }, 
            //               'status': 'completed'
            //             }
            //           }, {
            //             '$sort': {
            //               'start_date': -1
            //             }
            //           }
            //         ], 
            //         'as': 'result'
            //       }
            //     }, {
            //       '$lookup': {
            //         'from': 'listmatches', 
            //         'let': {
            //           't1': '$team1Id', 
            //           't2': '$team2Id'
            //         }, 
            //         'pipeline': [
            //           {
            //             '$match': {
            //               '$expr': {
            //                 '$or': [
            //                   {
            //                     '$eq': [
            //                       '$team1Id', '$$t2'
            //                     ]
            //                   }, {
            //                     '$eq': [
            //                       '$team2Id', '$$t2'
            //                     ]
            //                   }
            //                 ]
            //               }, 
            //               'status': 'completed'
            //             }
            //           }, {
            //             '$sort': {
            //               'start_date': -1
            //             }
            //           }
            //         ], 
            //         'as': 'result2'
            //       }
            //     }
            //   ])
//             const matchId = mongoose.Types.ObjectId(req.params.matchId);

// const pipeline = [
//   {
//     $match: { _id: matchId }
//   },
//   {
//     $lookup: {
//       from: "listmatches",
//       let: { t1: "$team1Id", t2: "$team2Id" },
//       pipeline: [
//         {
//           $match: {
//             $expr: {
//               $or: [
//                 { $eq: ["$team1Id", "$$t1"] },
//                 { $eq: ["$team2Id", "$$t1"] }
//               ]
//             },
//             status: "completed",
//             _id: { $ne: matchId }
//           }
//         },
//         { $sort: { start_date: -1 } },
//         { $limit: 1 }
//       ],
//       as: "result"
//     }
//   },
//   {
//     $lookup: {
//       from: "listmatches",
//       let: { t1: "$team1Id", t2: "$team2Id" },
//       pipeline: [
//         {
//           $match: {
//             $expr: {
//               $or: [
//                 { $eq: ["$team1Id", "$$t2"] },
//                 { $eq: ["$team2Id", "$$t2"] }
//               ]
//             },
//             status: "completed",
//             _id: { $ne: matchId }
//           }
//         },
//         { $sort: { start_date: -1 } },
//         { $limit: 1 }
//       ],
//       as: "result2"
//     }
//   }
// ];

// const last_matches_of_teams = await listMatchesModel.aggregate(pipeline);

              
// const play = [];
// const team1lastmatch = last_matches_of_teams[0].result[0]._id;
// const team2lastmatch = last_matches_of_teams[0].result2[0]._id;

// const lastteam1players = await matchPlayersModel.find({ matchkey: team1lastmatch, playingstatus: 1 });
// const lastteam2players = await matchPlayersModel.find({ matchkey: team2lastmatch, playingstatus: 1 });
// const teamplayers = await matchPlayersModel.find({ matchkey: req.params.matchId });

// teamplayers.forEach((newteamplayer) => {
//   let sign = 0;
//   const lastteamplayers = [...lastteam1players, ...lastteam2players];
//   lastteamplayers.forEach((lastteamplayer) => {
//     if (newteamplayer.playerid.toString() === lastteamplayer.playerid.toString()) {
//       sign = lastteam1players.includes(lastteamplayer) ? 1 : 2;
//       play.push({ playerid: newteamplayer.playerid, lastplaystatus: 1 });
//     }
//   });
//   if (sign !== 1 && sign !== 2) {
//     play.push({ playerid: newteamplayer.playerid, lastplaystatus: 0 });
//   }
// });



              
        //       let play=[]
        //       let team1lastmatch=last_matches_of_teams[0].result[0]._id;
        //       let team2lastmatch=last_matches_of_teams[0].result2[0]._id;
        //      // console.log("team1lastmatch",team1lastmatch)

        //   let lastteam1players= await matchPlayersModel.find({matchkey:team1lastmatch,playingstatus:1})
        //  let lastteam2players=  await matchPlayersModel.find({matchkey:team2lastmatch,playingstatus:1})
        //  let teamplayers=await  matchPlayersModel.find({matchkey:req.params.matchId})
        //  let sign=0;
         //console.log("lastteam1players",lastteam1players)
         //console.log("lastteam1players",lastteam2players)
         //console.log("64135c274ad09b0822a3e533     match=642a340abb5a72b5bc827536lastteam1players",lastteam1players,"lastteam2players",lastteam1players,"teamplayers",teamplayers)
        //  for(let newteamplayer of teamplayers)
        //  {
        //     for(let lastteam1player of lastteam1players)
        //     {if(newteamplayer.playerid.toString()=="64135c274ad09b0822a3e547"){
        //         console.log("newteamplayer.playerid",newteamplayer.playerid,"lastteam1player.playerid",lastteam1player.playerid,newteamplayer.playerid.toString()==lastteam1player.playerid.toString())
        //     }
        //         if(newteamplayer.playerid.toString()==lastteam1player.playerid.toString())
        //         {//console.log("newteamplayer.playerid",newteamplayer.playerid)
        //             sign=1;
        //             play.push({playerid:newteamplayer.playerid,lastplaystatus:1})
        //             //console.log("play",play)
               
        //        }
               
               
        //     }
        //     for(let lastteam2player of lastteam2players)
        //     {if(newteamplayer.playerid.toString()==lastteam2player.playerid.toString())
        //         {sign=2;
        //             play.push({playerid:newteamplayer.playerid,lastplaystatus:1})
               
        //        }
               
               
        //     }
        //     if(sign!=1&&sign!=2)
        //        {
        //         play.push({playerid:newteamplayer.playerid,lastplaystatus:0})
        //        }
        //        sign=0;


        //  }
        //let signts=0
        //  for(let newteamplayer of teamplayers)
        //  {
        //     for(let lastteam2player of lastteam2players)
        //     {if(newteamplayer.playerid.toString()==lastteam2player.playerid.toString())
        //         {signts=1;
        //             play.push({playerid:newteamplayer.playerid,lastplaystatus:1})
               
        //        }
               
               
        //     }
        //     if(signts!=1)
        //        {
        //         play.push({playerid:newteamplayer.playerid,lastplaystatus:0})
        //        }
        //        signts=0;


        //  }
let sk=0;         
         
            // sahil last player end
            if (data.length > 0) {
                for await (const pkey of data) {
                    // const player = play.find(p => p.playerid.toString() === pkey.playerid.toString());
                    // if (player) {
                    //   pkey.lastmatchplayer = player.lastplaystatus;
                    // }
                    // for await(let dataa of play)
                    // {
                    //     if(dataa.playerid.toString()==pkey.playerid.toString())
                    //     {
                    //         pkey.lastmatchplayer = dataa.lastplaystatus;
                    //     }
                    // }
                  
                                      
                    // if (pkey.totalSelected != 0) { pkey.player_selection_percentage = Number(pkey.totalSelected); }
                    // { pkey.captain_selection_percentage = Number(pkey.captainSelected); }
                    // { pkey.vice_captain_selection_percentage = Number(pkey.vicecaptainSelected); }
                    // { pkey.totalSelected = Number(pkey.totalSelected); }
                    // { pkey.captainSelected = Number(pkey.captainSelected); }
                    // { pkey.vicecaptainSelected = Number(pkey.vicecaptainSelected); }


                    if (listMatchSeries.length > 0) {
                        const getPoints = await matchPlayersModel.find({ matchkey: { $in: listMatchSeries }, playerid: pkey.playerid }, { points: 1 });
                        if ((getPoints || []).length > 0) {
                            getPoints.forEach((ele) => {
                                pkey.totalpoints = Number(pkey?.totalpoints || 0) + Number(ele?.points || 0)
                            });
                        }
                        const dataaa=await matchPlayersModel.find({  matchkey: { $in: listMatchSeries },playerid: pkey.playerid }).sort({createdAt:-1}).limit(1);
                        //console.log("dataaa",dataaa)
                        if(dataaa.length>0){
                            
                        if(dataaa[0]?.playingstatus==1)
                        {//console.log("datapre",data)
                           // sk=1
                            pkey.lasthplayer=1
                        }
                    else if(dataaa[0]?.playingstatus==0)
                {//console.log("elseifdataaa------->",dataaa[0].matchkey,"dataaa[0]?.playingstatus",dataaa[0]?.playingstatus)
                    pkey.lasthplayer=0

                }
            else
        {//console.log("dataaa------->",dataaa[0].matchkey,"dataaa[0]?.playingstatus",dataaa[0]?.playingstatus)
            pkey.lasthplayer=0

        }}
                    }
                    //console.log("datapost",data)

                    
                
                   
                    // if(pkey.role=="batsman"){myArray["batsman"].push(pkey);}
                    // else if(pkey.role=="allrounder"){myArray["allrounder"].push(pkey);}
                    // else if(pkey.role=="bowler"){myArray["bowler"].push(pkey);}
                    // else{myArray["keeper"].push(pkey);}
                    switch(pkey.role) {
                        case "batsman":
                          myArray.batsman.push(pkey);
                          break;
                        case "allrounder":
                          myArray.allrounder.push(pkey);
                          break;
                        case "bowler":
                          myArray.bowler.push(pkey);
                          break;
                        default:
                          myArray.keeper.push(pkey);
                          break;
                      }
                      
                    i++;
                    if (i == data.length) {
                        return {
                            message: 'Players List By Match',
                            status: true,
                            data: myArray
                          //  play:play

                        }
                    }
                }
            } else {
                return {
                    message: 'Players List Not available By Match',
                    status: false,
                    data: []
                }
            }
        } catch (error) {
            console.log(error)
            throw error;
        }
    }
    //sahil apk download
    async downloadApp(req,res){
        try {let file='./public/apk/MyGames11.apk'
            if(req.query.refercode){
                let data = req.query.refercode;
                res.download(file, `MyGames11_${data}.apk`);
            }else{
                res.download(file, `MyGames11-app.apk`);
            }
            
          } catch (error) {
            console.log("Error:", error);
           
          }
    }
    //sahil apk end

    /**
     * @function getPlayerInfo
     * @description  Get a player Information
     * @param { matchkey,playerid }
     * @author 
     */
     async getPlayerInfo(req) {
        try {
            let playerPipe = [];
            // if(req.query.playerid){
            //     playerPipe.push({
            //         $match: { _id: mongoose.Types.ObjectId(req.query.playerid) }
            //     },);
            // }
            if (req.query.playerid) {
                playerPipe.push({
                    $match: { playerid: mongoose.Types.ObjectId(req.query.playerid) }
                },);
            }
            if (req.query.matchkey) {
                playerPipe.push({
                    $match: { matchkey: mongoose.Types.ObjectId(req.query.matchkey) }
                },);
            }

            playerPipe.push({
                $lookup: {
                    from: 'listmatches',
                    localField: 'matchkey',
                    foreignField: '_id',
                    as: 'listmatches'
                }
            },);
            playerPipe.push({
                $unwind: {
                    path: "$listmatches",
                }
            },)
            playerPipe.push({
                $lookup: {
                    from: 'listmatches',
                    localField: 'listmatches.series',
                    foreignField: 'series',
                    as: 'allMatches'
                }
            },);
            playerPipe.push({
                $lookup: {
                    from: 'players',
                    localField: 'playerid',
                    foreignField: '_id',
                    as: 'playersData'
                }
            },);
            playerPipe.push({
                $unwind: { path: "$playersData" }
            },);
            playerPipe.push({
                $lookup: {
                    from: 'teams',
                    localField: 'playersData.team',
                    foreignField: '_id',
                    as: 'team'
                }
            },);
            playerPipe.push({
                $unwind: { path: "$team" }
            },);
            playerPipe.push({
                $project: {
                    _id: 0,
                    playerid: '$playerid',
                    matchPlayerId: '$_id',
                    playerpoints: '$playersData.points',
                    playername: '$name',
                    playercredit: '$credit',
                    battingstyle: '$playersData.battingstyle',
                    bowlingstyle: '$playersData.bowlingstyle',
                    playercountry: '$playersData.country',
                    playerdob: '$playersData.dob',
                    team: '$team.teamName',
                    teamShort_name: '$team.short_name',
                    playerimage: {
                        $ifNull: [{
                            $cond: {
                                if: { $or: [{ $eq: [{ $substr: ['$playersData.image', 0, 1] }, '/'] }, { $eq: [{ $substr: ['$playersData.image', 0, 1] }, 'p'] }] },
                                then: { $concat: [`${constant.BASE_URL}`, '', '$playersData.image'] },
                                else: {
                                    $cond: {
                                        if: { $eq: ['$playersData.image', ''] },
                                        then: {
                                            $cond: {
                                                if: { $eq: ['$playersData.team', '$listmatches.team1Id'] },
                                                then: `${constant.BASE_URL}black_team1.png`,
                                                else: {
                                                    $cond: {
                                                        if: { $eq: ['$playersData.team', '$listmatches.team2Id'] },
                                                        then: `${constant.BASE_URL}white_team1.png`,
                                                        else: `${constant.BASE_URL}white_team1.png`
                                                    }
                                                }
                                            }
                                        },
                                        else: '$playersData.image'
                                    }
                                }
                            }
                        }, `${constant.BASE_URL}player.png`]
                    },
                    playerrole: '$role',
                    matches: '$allMatches'

                }
            })
            let point = 0;

            let data = await matchPlayersModel.aggregate(playerPipe);
            // console.log('data',data);
            if (data.length > 0) {
                if (data[0].matches.length > 0) {
                    let temparr = [];
                    for (let memb of data[0].matches) {
                        let resData = await matchPlayersModel.findOne({ matchkey: mongoose.Types.ObjectId(memb._id), playerid: mongoose.Types.ObjectId(data[0].playerid) });
                        if (moment(moment().format("YYYY-MM-DD HH:mm:ss")).isAfter(memb.start_date)) {
                            if (resData) {
                                let tempObj = {}
                                tempObj.total_points = `${0}`;
                                point += resData.points;
                                tempObj.total_points = `${resData.points}`;
                                tempObj.matchdate = moment(memb.start_date).format("DD MMMM, YYYY");
                                tempObj.selectper = `${resData.totalSelected}%`;
                                tempObj.playerid = data[0].playerid;
                                tempObj.name = memb.name;
                                tempObj.short_name = memb.short_name;
                                temparr.push(tempObj);
                                data[0].playerpoints = `${point}`;
                            }
                        }
                    }
                    data[0].matches = temparr;
                    return {
                        message: 'Player Info',
                        status: true,
                        data: data[0]
                    }
                } else {
                    return {
                        message: 'Player Info without matches',
                        status: true,
                        data: data[0]
                    }
                }
            } else {
                return {
                    message: 'Player Info Not Found',
                    status: false,
                    data: {}
                }
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * @function createMyTeam
     * @description  Create Team to join the legues of matches
     * @param { matchkey, teamnumber, players, captain, vicecaptain, type }
     * @author 
     */

    async createMyTeam(req) {
        try {
            const { matchkey, teamnumber, players, captain, vicecaptain } = req.body;
            const playerArray = players.split(','),
                playerObjectIdArray = [];
            if (playerArray.length < 11) {
                return {
                    message: 'Select atleast 11 players.',
                    status: false,
                    data: {}
                };
            }
            for (const playerObjectId of playerArray) playerObjectIdArray.push(mongoose.Types.ObjectId(playerObjectId));

            const matchPlayersData = await matchPlayersModel.find({ matchkey: matchkey });
            let credit = 0;
            if (matchPlayersData.length > 0) {
                for (let playerData of matchPlayersData) {
                    if (playerArray.includes(playerData._id.toString())) {
                        credit += playerData.credit;
                    }
                }
            }
            if (credit > 100) {
                return {
                    message: 'Credit exceeded.',
                    status: false,
                    data: {}
                };
            }
            const joinlist = await JoinTeamModel.find({ matchkey: matchkey, userid: req.user._id }).sort({ teamnumber: -1 });

            const duplicateData = await this.checkForDuplicateTeam(joinlist, captain, vicecaptain, playerArray, teamnumber);
            if (duplicateData === false) {
                return {
                    message: 'You cannot create the same team.',
                    status: false,
                    data: {}
                };
            }
            //sahil redis
            // let keyname=`createMyTeam-${matchkey}`
            // let redisdata=await Redis.getkeydata(keyname);
            // let listmatchData;
            // if(redisdata)
            // {
            //     listmatchData=redisdata;
            // }
            // else
            // {
            //     listmatchData = await listMatchesModel.findOne({ _id: mongoose.Types.ObjectId(matchkey) });
            //     let redisdata=Redis.setkeydata(keyname,listmatchData,60*60*4);
            // }

            //sahil redis end
            let listmatchData = await listMatchesModel.findOne({ _id: mongoose.Types.ObjectId(matchkey) });
            const matchTime = await this.getMatchTime(listmatchData.start_date);
            if (matchTime === false) {
                return {
                    message: 'Match has been closed, You cannot create or edit team now',
                    status: false,
                    data: {}
                }
            }
            const data = {},
                lastplayerArray = [];
            let joinTeamId;
            data['userid'] = req.user._id;
            data['matchkey'] = matchkey;
            data['teamnumber'] = teamnumber;
            data['players'] = playerObjectIdArray;
            // data['playersArray'] = players;
            data['player_type'] = "classic";
            data['captain'] = captain;
            data['vicecaptain'] = vicecaptain;
            const joinTeam = await JoinTeamModel.findOne({
                matchkey: matchkey,
                teamnumber: parseInt(teamnumber),
                userid: req.user._id,
            }).sort({ teamnumber: -1 });
            if (joinTeam) {
                data["user_type"] = 0;
                data['created_at'] = joinTeam.created_at;
                const updateTeam = await JoinTeamModel.findOneAndUpdate({ _id: joinTeam._id }, data, {
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
                const joinTeam = await JoinTeamModel.find({
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
                   
                    let jointeamData = await JoinTeamModel.create(data);
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
    
    async phonepayapi(req){
        try{
            //console.log("body",req.body.xverify,"payload",req.body.payload)
            // axios()
            if(req.body.payload && req.body.xverify)
            {
          const response = await axios.post(
            "https://api.phonepe.com/apis/hermes/pg/v1/pay",
            {request:req.body.payload},{headers: {
              // 'Content-Type': 'application/json',
               //'X-MERCHANT-ID': 'PGTESTPAYUAT103',
              'X-VERIFY': req.body.xverify,
              // 'accept': 'application/json'
            }}
          );
          //console.log("response",response.data)
          return {data:response.data,status:true};
        }
        else
        {
            return { message:"send allparams properly",status:true};
        }
        }
          
          catch(error)
          {
            console.log("error123",error)
          }

    }

    async phonepayapiwithbase64(req){
        try{let payload=req.body.payload+'/pg/v1/payd7f88d11-9d80-4588-acf4-b02d5a4206b3'
        let payload1=req.body.payload
        // const saltKey = 'd7f88d11-9d80-4588-acf4-b02d5a4206b3';
        // const saltIndex = 1;
        // const jsonString = JSON.stringify(req.body);
        // const payload = Buffer.from(jsonString).toString('base64');
        // const salt = `${payload}"/pg/v1/pay"${saltKey}`;
        // let xverify = crypto.createHash('sha256').update(salt).digest('hex');
        // xverify=`${xverify}###${saltIndex}`;
        const hashBuffer = await createHash('sha256').update(payload).digest();
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(''); // convert bytes to hex string
  const xverify = hashHex + '###' + 1; 
        console.log("xverify",xverify,"payload",payload)
            if(payload&&xverify)
            {
                const response = await axios.post(
                "https://api.phonepe.com/apis/hermes/pg/v1/pay",
                { request:payload1 },{ headers: {
                 'Content-Type': 'application/json',
                //'X-MERCHANT-ID': 'PGTESTPAYUAT103',
                'X-VERIFY': xverify,
                 'accept': 'application/json'
                }}
            );
            console.log("response",response.data)
            return {  data:response.data,status:true };
        }
        else
        {
            return {
                message:"send allparams properly",status:true
            };
        }
        }
          
          catch(error)
          {
            console.log("error123",error)
          }

    }
    //phonepayapiwithcalling
    async phonepayapiwithcalling(req){
        try{
            let merchanttrasid=req.query.merchanttransid;
           
        let payload=`/pg/v1/status/MGELEVENONLINE/${merchanttrasid}d7f88d11-9d80-4588-acf4-b02d5a4206b3`
        
  const hashBuffer = await createHash('sha256').update(payload).digest();
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(''); // convert bytes to hex string
  const xverify = hashHex + '###' + 1; 
        console.log("xverify",xverify,"payload",payload)
            if(payload&&xverify)
            {
            //     const response = await axios.get(
            //     "https://api.phonepe.com/apis/hermes/pg/v1/status/MGELEVENONLINE/MG11-add-1684124689414QPHP",
            //     { headers: {
            //      'Content-Type': 'application/json',
            //      'X-MERCHANT-ID': 'MGELEVENONLINE',
            //     'X-VERIFY': xverify,
            //      'accept': 'application/json'
            //     }}
            // );
            const options = {
                method: 'GET',
                headers: {
                  accept: 'application/json',
                  'Content-Type': 'application/json',
                  'X-VERIFY': xverify,
                  'X-MERCHANT-ID': 'MGELEVENONLINE'
                }
              };
              let responsee;
          let data= await   fetch(`https://api.phonepe.com/apis/hermes/pg/v1/status/MGELEVENONLINE/${merchanttrasid}`, options)
            data=await data.json();
          
             return {  data:data.data,status:true };
        }
        else
        {
            return {
                message:"send allparams properly",status:true
            };
        }
        }
          
          catch(error)
          {
            console.log("error123",error)
          }

    }
    //phonepayapiwithcallingend

    /**
     * @function checkForDuplicateTeam
     * @description Check that the incoming team is already esist or not.
     * @param { joinlist, captain, vicecaptain, playerArray, teamnumber}
     * @author 
     */
    async checkForDuplicateTeam(joinlist, captain, vicecaptain, playerArray, teamnumber) {
        if (joinlist.length == 0) return true;
        for await (const list of joinlist) {
            if (
                captain == list.captain &&
                vicecaptain == list.vicecaptain &&
                teamnumber != list.teamnumber
            ) {
                const playerscount = await this.findArrayIntersection(playerArray, list.players);
                if (playerscount.length == playerArray.length) return false;
            }
        }
        return true;
    }

    /**
     * @function findArrayIntersection
     * @description find Array Inter section
     * @param { nowplayers,previousPlayers}
     * @author 
     */
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

    /**
     * @function getMatchTime
     * @description Check the match time
     * @param { matchkey}
     * @author 
     */
    async getMatchTime(start_date) {
        const currentdate = new Date();
        const currentOffset = currentdate.getTimezoneOffset();
        const ISTOffset = 330; // IST offset UTC +5:30
        const ISTTime = moment().format('YYYY-MM-DD HH:mm:ss');
        console.log('ISTTime',ISTTime)
        console.log('start_date',start_date)
        if (ISTTime >= start_date) {
            return false;
        } else {
            return true;
        }
    }
    async createTeamsJoinTeamModel(req) {
        let piplines = [];
        piplines.push({
            $match: {
                matchkey: req.query.matchkey,
                userid: req.user._id,
            }
        })
        piplines.push({
            $lookup: {
                from: 'players',
                localField: 'teamid',
                foreignField: '_id',
                as: 'jointeam',
            }
        })
    }

    /**
     * @function getMyTeams
     * @description Get My All Teams
     * @param { matchkey, challengeid,matchchallengeid }
     * @author 
     */
    
     async getMyTeams(req) {
        try {
            let finalData = [];
            // const listmatchData = await listMatchesModel.findOne({ _id: req.query.matchkey })
            // .populate({
            //     path: 'team1Id',
            //     select: 'short_name'
            // }).populate({
            //     path: 'team2Id',
            //     select: 'short_name'
            // });
            
            const { team1Id, team2Id } = await listMatchesModel.findOne({ _id: req.query.matchkey })
            .populate([
                { path: 'team1Id', select: 'short_name', options: { lean: true } },
                { path: 'team2Id', select: 'short_name', options: { lean: true } }
            ])
            .lean();
            
            if (!team1Id) {
                return {
                    status: false,
                    message: "listmatch not Found"
                }
            }
            let aggPipe = [];
            aggPipe.push({
                $match: {
                    userid: mongoose.Types.ObjectId(req.user._id),
                    matchkey: mongoose.Types.ObjectId(req.query.matchkey)
                }
            });
            //nand
            // aggPipe.push({
            //     $lookup: {
            //         from: "players",
            //         localField: "players",
            //         foreignField: "_id",
            //         as: "getplayerdata"
            //     }
            // });

            aggPipe.push({
                $lookup: {
                    from: "players",
                    localField: "captain",
                    foreignField: "_id",
                    as: "captain"
                }
            });
            aggPipe.push({
                $lookup: {
                    from: "players",
                    localField: "vicecaptain",
                    foreignField: "_id",
                    as: "vicecaptain"
                }
            });
            aggPipe.push({
                $unwind: {
                    path: "$vicecaptain"
                }
            });
            aggPipe.push({
                $unwind: {
                    path: "$captain"
                }
            });
            aggPipe.push({
                $lookup:{
                    from: "matchplayers",
                    let: { pid: "$players", matchkey: "$matchkey",captain_id:"$captain._id",vicecaptain_id:'$vicecaptain._id' },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $and: [
                              {
                                $eq: ["$$matchkey", "$matchkey"],
                              },
                              {
                                $in: ["$playerid", "$$pid"],
                              },
                            ],
                          },
                        },
                      },
                      {
                        $lookup: {
                          from: "players",
                          localField: "playerid",
                          foreignField: "_id",
                          as: "getplayerdata",
                        },
                      },{
                        $unwind:{
                          path:"$getplayerdata"
                        }
                      },{
                        $project:{
                          _id:0,
                          id:"$getplayerdata._id",
                          playerimg: '',
                          team:"$getplayerdata.team",
                          name:"$getplayerdata.player_name",
                          role:"$role",
                          credit:"$credit",
                          playingstatus:'$playingstatus',
                          image1:'',
                          points:'$point',
                          captain:'0',
                          vicecaptain:'0'
                        //   captain:{
                        //     $cond: { if: { $eq: [ {$toString: "$getplayerdata._id"}, {$toString : "$captain_id"} ] }, then: 1, else: 0 }
                        //   },
                        //   vicecaptain:{
                        //     $cond: { if: { $eq: [ {$toString: "$getplayerdata._id"}, {$toString: "$vicecaptain_id"} ] }, then: 1, else: 0 }
                        //   }
                        }
                      }
                    ],
                    as: "players",
                  }
            });
            const createTeams = await JoinTeamModel.aggregate(aggPipe);
            // console.log('createTeams-->',createTeams)
            if (createTeams.length == 0) {
                return {
                    message: 'Teams Not Available',
                    status: false,
                    data: [],
                }
            }
            let [matchchallenges,total_teams,count_JoinContest] = await Promise.all([
                matchchallengesModel.find({ matchkey: mongoose.Types.ObjectId(req.query.matchkey),status:'opened' }),
                JoinTeamModel.countDocuments({ userid: req.user._id, matchkey: req.query.matchkey }),
                this.getJoinleague(req.user._id,req.query.matchkey)
            ]);
            // ---------------------//
            let i = 0;
            for (let element of createTeams) {
                i++
                let Capimage, viceCapimage;
                // ----Inserting Captian image ---------
                if (element.captain._id && element.captain.image != '' && element.captain.image != null && element.captain.image != undefined) {
                    if (element.captain.image.startsWith('/p') || element.captain.image.startsWith('p')) {
                        Capimage = `${constant.BASE_URL}${element.captain.image}`;
                    } else {
                        Capimage = element.captain.image;
                    }
                } else {
                    // Capimage = `${constant.BASE_URL}avtar1.png`;
                    if ((team1Id._id.toString() == element.captain.team.toString())) {
                        Capimage = `${constant.BASE_URL}white_team1.png`;
                    } else {
                        Capimage = `${constant.BASE_URL}black_team1.png`;
                    }
                }
                // ----Inserting Vice-Captian image ---------
                if (element.vicecaptain._id && element.vicecaptain.image != '' && element.vicecaptain.image != null && element.vicecaptain.image != undefined) {
                    if (element.vicecaptain.image.startsWith('/p') || element.vicecaptain.image.startsWith('p')) {
                        viceCapimage = `${constant.BASE_URL}${element.vicecaptain.image}`;
                    } else {
                        viceCapimage = element.vicecaptain.image;
                    }
                } else {
                    // viceCapimage = `${constant.BASE_URL}avtar1.png`;

                    if ((team1Id._id.toString() == element.vicecaptain.team.toString())) {
                        viceCapimage = `${constant.BASE_URL}white_team1.png`;
                    } else {
                        viceCapimage = `${constant.BASE_URL}black_team1.png`;
                    }
                }
                const tempObj = {
                    status: 1,
                    userid: req.user._id,
                    teamnumber: element.teamnumber,
                    jointeamid: element._id,
                    team1_name: team1Id.short_name,
                    team2_name: team2Id.short_name,
                    player_type: constant.PLAYER_TYPE.CLASSIC,
                    captain: element.captain.playerid ? element.captain.playerid.player_name : '',
                    vicecaptain: element.vicecaptain.playerid ? element.vicecaptain.playerid.player_name : '',
                    captainimage: Capimage,
                    vicecaptainimage: viceCapimage,
                    captainimage1: '',
                    vicecaptainimage1: '',
                    isSelected: false,
                };

                if (matchchallenges.length != 0 && req.query.matchchallengeid) {
                    for await (const challenges of matchchallenges) {
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
                let team1count = 0,
                    team2count = 0,
                    batsCount = 0,
                    blowCount = 0,
                    wicketKeeperCount = 0,
                    allCount = 0;
                // const players = [];
                let totalPoints = 0;
                // console.log('++++++++++++++++++++++',team1Id)
                tempObj['captin_name'] = element.captain._id ? element.captain.player_name : '',
                tempObj["viceCaptain_name"] = element.vicecaptain._id ? element.vicecaptain.player_name : '',
                    tempObj['team1count'] = team1count;
                tempObj['captain_id'] = element.captain._id;
                tempObj['vicecaptain_id'] = element.vicecaptain._id;
                tempObj['team2count'] = team2count;
                tempObj['batsmancount'] = batsCount;
                tempObj['bowlercount'] = blowCount;
                tempObj['wicketKeeperCount'] = wicketKeeperCount;
                tempObj['allroundercount'] = allCount;
                tempObj['total_teams'] = total_teams;
                tempObj['total_joinedcontest'] = count_JoinContest;
                tempObj["totalpoints"] = totalPoints;
                
                tempObj['team1Id'] = team1Id._id;
                tempObj['team2Id'] = team2Id._id;
                tempObj['player'] = element.players;
                finalData.push(tempObj);
                if (i == createTeams.length) {
                    return {
                        message: 'Team Data',
                        status: true,
                        data: finalData
                    }
                }
            }
            // return {
            //     message: 'Team Data',
            //     status: true,
            //     data: createTeams
            // }
        } catch (error) {
            throw error;
        }
     }
    async getJoinleague(userId,matchkey){
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
    /**
     * @function viewTeam
     * @description view a perticular Team Detail of a user
     * @param { matchkey, jointeamid, teamnumber }
     * @author 
     */
     async viewTeam(req) {
        try {

            let finalData = [];
            this.updateIsViewedForBoatTeam(req.query.jointeamid);
            //sahil redis
            // let keyname=`viewTeam-${req.query.matchkey}`
            // let redisdata=await Redis.getkeydata(keyname);
            // let listmatchData;
            // if(redisdata)
            // {
            //     listmatchData=redisdata;
            // }
            // else
            // {
            //     listmatchData = await listMatchesModel.findOne({ _id: req.query.matchkey });
            //     let redisdata=Redis.setkeydata(keyname,listmatchData,60*60*4);
            // }

            //sahil redis end
            const listmatchData = await listMatchesModel.findOne({ _id: req.query.matchkey });
            let aggPipe = [];
            console.log("req.query.teamnumber" + req.query.teamnumber + "" + 'req.user.jointeamid' + req.query.jointeamid + "req.query.matchkey" + req.query.matchkey)
            let teamnumber = parseInt(req.query.teamnumber);
            console.log(teamnumber)
            const createTeam = await JoinTeamModel.aggregate([
                {
                    '$match': {
                        'matchkey': mongoose.Types.ObjectId(req.query.matchkey),
                        '_id': mongoose.Types.ObjectId(req.query.jointeamid),
                        'teamnumber': teamnumber
                    }
                }, {
                    '$lookup': {
                        'from': 'players',
                        'localField': 'players',
                        'foreignField': '_id',
                        'as': 'getplayersdata'
                    }
                }, {
                    '$lookup': {
                        'from': 'players',
                        'localField': 'captain',
                        'foreignField': '_id',
                        'as': 'captain'
                    }
                }, {
                    '$lookup': {
                        'from': 'players',
                        'localField': 'vicecaptain',
                        'foreignField': '_id',
                        'as': 'vicecaptain'
                    }
                }, {
                    '$unwind': {
                        'path': '$vicecaptain'
                    }
                }, {
                    '$unwind': {
                        'path': '$captain'
                    }
                }
            ]);

            if (!createTeam) {
                return {
                    message: 'Team Not Available',
                    status: false,
                    data: []
                }
            }
            let totalpoints = 0;
            console.log("team",createTeam)
            for await (const playerData of createTeam[0].getplayersdata) {
                const filterData = await matchPlayersModel.findOne({ playerid: playerData._id, matchkey: req.query.matchkey });
                if (!filterData) {
                    return {
                        status: false,
                        message: "match player not found",
                        data: []
                    }
                }
                // ----Inserting Captian image ---------
                let Pimage;
                if (playerData._id && playerData.image != '' && playerData.image != null && playerData.image != undefined) {
                    if (playerData.image.startsWith('/p') || playerData.image.startsWith('p')) {
                        Pimage = `${constant.BASE_URL}${playerData.image}`;
                    } else {
                        Pimage = playerData.image;
                    }
                } else {
                    // Pimage = `${constant.BASE_URL}avtar1.png`
                    if ((listmatchData.team1Id._id.toString() == playerData.team.toString())) {
                        Pimage = `${constant.BASE_URL}/white_team1.png`;
                    } else {
                        Pimage = `${constant.BASE_URL}/black_team1.png`;
                    }
                }
                console.log("toyal points" + parseFloat(filterData.points.toFixed(2)))
                if (!playerData) break;
                finalData.push({
                    id: playerData._id,
                    name: playerData.player_name,
                    role: filterData.role,
                    credit: filterData.credit,
                    playingstatus: filterData.playingstatus,
                    team: listmatchData.team1Id.toString() == playerData.team.toString() ? 'team1' : 'team2',
                    image: Pimage,
                    image1: '',
                    captain: createTeam[0].captain._id.toString() == playerData._id.toString() ? 1 : 0,
                    vicecaptain: createTeam[0].vicecaptain._id.toString() == playerData._id.toString() ? 1 : 0,
                    // points: filterData.points,
                    points: `${createTeam[0].captain._id.toString() == playerData._id.toString() ?
                        parseFloat(filterData.points.toFixed(2)) * 2 : createTeam[0].vicecaptain._id.toString() == playerData._id.toString() ?
                            parseFloat(filterData.points.toFixed(2)) * 1.5 : filterData.points}`,
                    isSelected: false,

                });
            }
            // finalData.push({totalpoints:totalpoints})
            // console.log("totalpoints"+totalpoints)

            if (finalData.length == createTeam[0].players.length) {
                return {
                    message: 'User Perticular Team Data',
                    status: true,
                    data: finalData
                }
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * @function getLiveScores
     * @description Match Live score
     * @param { matchkey }
     * @author 
     */
    async getLiveScores(req) {
        try {
            console.log("---------------------------getlivescores--------------------------")
            let matchrunData = await matchrunModel.findOne({ matchkey: mongoose.Types.ObjectId(req.query.matchkey) });
            if (!matchrunData || !matchrunData.overs1 == undefined) {
                return {
                    message: 'Match Live score Not Found',
                    status: false,
                    data: {
                        Team1: '',
                        Team2: '',
                        Team1_Totalovers1: 0,
                        Team1_Totalovers2: 0,
                        Team1_Totalruns1: 0,
                        Team1_Totalruns2: 0,
                        Team1_Totalwickets1: 0,
                        Team1_Totalwickets2: 0,
                        Team2_Totalwickets1: 0,
                        Team2_Totalwickets2: 0,
                        Team2_Totalovers1: 0,
                        Team2_Totalovers2: 0,
                        Team2_Totalruns1: 0,
                        Team2_Totalruns2: 0,
                        Winning_Status: '',
                    }
                }
            }

            const over1 = matchrunData.overs1.split(',');
            const over2 = matchrunData.overs2.split(',');
            const wicket1 = matchrunData.wickets1.split(',');
            const wicket2 = matchrunData.wickets2.split(',');
            const runs1 = matchrunData.runs1.split(',');
            const runs2 = matchrunData.runs2.split(',');
            return {
                message: 'Match Live score',
                status: true,
                data: {
                    Team1: matchrunData.teams1.toUpperCase() || '',
                    Team2: matchrunData.teams2.toUpperCase() || '',
                    Team1_Totalovers1: over1[0] && over1[0] != null && over1[0] != undefined && over1[0] != '' ?
                        over1[0] : matchrunData.overs1,
                    Team1_Totalovers2: over1[1] && over1[1] != null && over1[1] != undefined && over1[1] != '' ? over1[1] : '0',
                    Team1_Totalruns1: runs1[0] && runs1[0] != null && runs1[0] != undefined && runs1[0] != '' ?
                        runs1[0] : matchrunData.runs1,
                    Team1_Totalruns2: runs1[1] && runs1[1] != null && runs1[1] != undefined && runs1[1] != '' ? runs1[1] : '0',
                    Team1_Totalwickets1: wicket1[0] && wicket1[0] != null && wicket1[0] != undefined && wicket1[0] != '' ?
                        wicket1[0] : matchrunData.wickets1,
                    Team1_Totalwickets2: wicket1[1] && wicket1[1] != null && wicket1[1] != undefined && wicket1[1] != '' ?
                        wicket1[1] : '0',
                    Team2_Totalwickets1: wicket2[0] && wicket2[0] != null && wicket2[0] != undefined && wicket2[0] != '' ?
                        wicket2[0] : matchrunData.wickets2,
                    Team2_Totalwickets2: wicket2[1] && wicket2[1] != null && wicket2[1] != undefined && wicket2[1] != '' ?
                        wicket2[1] : '0',
                    Team2_Totalovers1: over2[0] && over2[0] != null && over2[0] != undefined && over2[0] != '' ?
                        over2[0] : matchrunData.overs2,
                    Team2_Totalovers2: over2[1] && over2[1] != null && over2[1] != undefined && over2[1] != '' ? over2[1] : '0',
                    Team2_Totalruns1: runs2[0] && runs2[0] != null && runs2[0] != undefined && runs2[0] != '' ?
                        runs2[0] : matchrunData.runs2,
                    Team2_Totalruns2: runs2[1] && runs2[1] != null && runs2[1] != undefined && runs2[1] != '' ? runs2[1] : '0',
                    Winning_Status: matchrunData.winning_status != '0' ?
                        matchrunData.winning_status != 'No result' ?
                            matchrunData.winning_status :
                            '' : '',
                }
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * @function liveRanksLeaderboard
     * @description Live score lederbord of match
     * @param { matchkey,challengeid }
     * @author 
     */
    // optimized liverank below

    async liveRanksLeaderboard(req) {
        try {
            //sahil redis
            // let keyname=`liveRanksLeaderboard-${req.query.matchkey}`
            // let redisdata=await Redis.getkeydata(keyname);
            // let listmatchData;
            // if(redisdata)
            // {
            //     listmatchData=redisdata;
            // }
            // else
            // {
            //     listmatchData = await listMatchesModel.findOne({ _id: mongoose.Types.ObjectId(req.query.matchkey) }).select('final_status');
            //     let redisdata=Redis.setkeydata(keyname,listmatchData,60*60*4);
            // }

            //sahil redis end
          let listmatchData = await listMatchesModel.findOne({ _id: mongoose.Types.ObjectId(req.query.matchkey) }).select('final_status');
            const aggPipe = [];
            // aggPipe.push({
            //     $match: {
            //         matchkey: mongoose.Types.ObjectId(req.query.matchkey),
            //         challengeid: mongoose.Types.ObjectId(req.query.matchchallengeid),
            //     }
            // });
            // aggPipe.push({
            //     $lookup: {
            //         from: 'jointeams',
            //         localField: 'teamid',
            //         foreignField: '_id',
            //         as: 'jointeam',
            //     },
            // });
            // aggPipe.push({
            //     $lookup: {
            //         from: 'users',
            //         localField: 'userid',
            //         foreignField: '_id',
            //         as: 'user',
            //     },
            // });
            // aggPipe.push({
            //     $addFields: {
            //         jointeam: "",
            //         joinTeamNumber: { $ifNull: ["$teamnumber", 0], },
            //         teamnumber: { $ifNull: [{ $arrayElemAt: ["$jointeam.teamnumber", 0], }, 0,], },
            //         points: { $ifNull: [{ $arrayElemAt: ["$jointeam.points", 0], }, 0,], },
            //         lastpoints: { $ifNull: [{ $arrayElemAt: ["$jointeam.lastpoints", 0], }, 0,], },
            //         team: { $ifNull: [{ $arrayElemAt: ["$user.team", 0], }, "",], },
            //     },
            // });

            // aggPipe.push({
            //     $setWindowFields: {
            //         partitionBy: "",
            //         sortBy: { lastpoints: -1 },
            //         output: { rank: { $rank: {}, }, },
            //     },
            // });

            // aggPipe.push({
            //     $project: {
            //         userid: "$userid",
            //         jointeamid: "$teamid",
            //         joinTeamNumber: "$joinTeamNumber",
            //         teamnumber: { $ifNull: ["$teamnumber", 0], },
            //         points: { $ifNull: ["$points", 0], },
            //         lastpoints: { $ifNull: ["$lastpoints", 0], },
            //         team: { $ifNull: ["$team", "0"], },
            //         image: {
            //             $cond: {
            //               if: {
            //                 $eq: [
                             
            //                  {
            //           $getField: {
            //             "field": "image",
            //             "input": {$arrayElemAt: ["$user", 0]}
            //           }
            //         } ,""
            //                 ],
            //               },
            //               // Check if the value of the first element of the "user.image" array is an empty string
            //               then: "https://admin.mygames11.com/avtar1.png",
            //               // If the value of the first element of "user.image" is an empty string, return this URL
            //               else:  {
            //           $getField: {
            //             "field": "image",
            //             "input": {$arrayElemAt: ["$user", 0]}
            //           }
            //         }    },
            //           },
            //         lastrank: "$rank",
            //         challengeid: "$challengeid",
            //     },
            // });

            // aggPipe.push({
            //     $setWindowFields: {
            //         partitionBy: "",
            //         sortBy: { points: -1 },
            //         output: { rank: { $rank: {}, }, },
            //     },
            // });
            // // if (listmatchData.final_status == constant.MATCH_FINAL_STATUS.WINNER_DECLARED) {
            // aggPipe.push({
            //     $lookup: {
            //         from: 'finalresults',
            //         localField: '_id',
            //         foreignField: 'joinedid',
            //         as: 'finalResult',
            //     },
            // });
            // // }
            // aggPipe.push({
            //     $project: {
            //         _id: 0,
            //         userjoinid: "$_id",
            //         userid: "$userid",
            //         jointeamid: "$jointeamid",
            //         teamnumber: { $cond: { if: { $and: [{ $eq: ["$teamnumber", 0], }], }, then: "$joinTeamNumber", else: "$teamnumber", }, },
            //         points: { $ifNull: ["$points", 0], },
            //         lastpoints: { $ifNull: ["$lastpoints", 0], },
            //         teamname: { $ifNull: ["$team", 0], },
            //         getlastrank: "$lastrank",
            //         getcurrentrank: "$rank",
            //         challengeid: "$challengeid",
            //         image: { $cond: { if: { $and: [{ $ne: ["$image", "null"], }, { $ne: ["$regdata.image", ""], },], }, then: "$image", else: "undefinedavtar1.png", }, },
            //         userno: { $cond: { if: { $eq: ["$userid", mongoose.Types.ObjectId(req.user._id),], }, then: -1, else: 0, }, },
            //         is_show: { $cond: { if: { $eq: ["$userid", mongoose.Types.ObjectId(req.user._id),], }, then: true, else: false, }, },
            //         player_type: "classic",
            //         arrowname: {
            //             $cond: {
            //                 if: { $gt: ["$rank", "$lastrank"], }, then: "down-arrow", else: {
            //                     $cond: {
            //                         if: { $eq: ["$rank", "$lastrank"], }, then: "equal-arrow",
            //                         else: { $cond: { if: { $lt: ["$rank", "$lastrank"], }, then: "up-arrow", else: "", }, },
            //                     },
            //                 },
            //             },
            //         },
            //         winingamount: { $cond: { if: { $ne: [{ $arrayElemAt: ["$finalResult.amount", 0,], }, 0,], }, then: { $toString: { $ifNull: [{ $arrayElemAt: ["$finalResult.amount", 0,], }, "",], }, }, else: { $toString: { $ifNull: [{ $arrayElemAt: ["$finalResult.prize", 0,], }, "",], }, }, }, },
            //     }
            // })



            // aggPipe.push({
            //     $sort: {
            //         userno: 1,
            //         getcurrentrank: 1,
            //         userid: -1,
            //         teamnumber: 1,
            //     },
            // });
            // aggPipe.push({
            //     $lookup: {
            //         from: "matchchallenges",
            //         localField: "challengeid",
            //         foreignField: "_id",
            //         as: "challengeData"
            //     }
            // });
            // aggPipe.push({
            //     $addFields: {
            //         contest_winning_type: { $ifNull: [{ $arrayElemAt: ['$challengeData.amount_type', 0] }, '0'] },
            //         challengeData: ""
            //     }
            // });
            let sortarray=[];
            //sahilanaylysis
            const finalDataA = await JoinLeaugeModel.aggregate([
                {
                  '$match': {
                    'matchkey':mongoose.Types.ObjectId(req.query.matchkey), 
                    'challengeid':mongoose.Types.ObjectId(req.query.matchchallengeid)
                  }
                }, {
                  '$lookup': {
                    'from': 'jointeams', 
                    'localField': 'teamid', 
                    'foreignField': '_id', 
                    'as': 'jointeam'
                  }
                }, {
                  '$lookup': {
                    'from': 'users', 
                    'localField': 'userid', 
                    'foreignField': '_id', 
                    'as': 'user'
                  }
                }, {
                  '$addFields': {
                    'jointeam': '', 
                    'joinTeamNumber': {
                      '$ifNull': [
                        '$teamnumber', 0
                      ]
                    }, 
                    'teamnumber': {
                      '$ifNull': [
                        {
                          '$arrayElemAt': [
                            '$jointeam.teamnumber', 0
                          ]
                        }, 0
                      ]
                    }, 
                    'points': {
                      '$ifNull': [
                        {
                          '$arrayElemAt': [
                            '$jointeam.points', 0
                          ]
                        }, 0
                      ]
                    }, 
                    'lastpoints': {
                      '$ifNull': [
                        {
                          '$arrayElemAt': [
                            '$jointeam.lastpoints', 0
                          ]
                        }, 0
                      ]
                    }, 
                    'team': {
                      '$ifNull': [
                        {
                          '$arrayElemAt': [
                            '$user.team', 0
                          ]
                        }, ''
                      ]
                    }
                  }
                },{
                    $setWindowFields:{
                        partitionBy: "",
                        sortBy: {
                          points: -1,
                        },
                        output: {
                          rank: {
                            $rank: {},
                          },
                        },
                    }
                },
                {
                    $match:{
                        userid:mongoose.Types.ObjectId(req.user._id)
                    }
                },
                {
                    $lookup:{
                        from: "finalresults",
                        localField: "_id",
                        foreignField: "joinedid",
                        as: "finalResult",
                      }
                },{
                    $project:{
                        _id: 0,
                        userjoinid: "$_id",
                        userid: "$userid",
                        'jointeamid': '$teamid',  
                        teamnumber: {
                          $cond: {
                            if: {
                              $and: [
                                {
                                  $eq: ["$teamnumber", 0],
                                },
                              ],
                            },
                            then: "$joinTeamNumber",
                            else: "$teamnumber",
                          },
                        },
                        points: {
                          $ifNull: ["$points", 0],
                        },
                        lastpoints: {
                          $ifNull: ["$lastpoints", 0],
                        },
                        teamname: {
                          $ifNull: ["$team", 0],
                        },
                        getlastrank: "$lastrank",
                        getcurrentrank: "$rank",
                        challengeid: "$challengeid",
                        image: {
                          $cond: {
                            if: {
                              $eq: [
                                {
                                  $getField: {
                                    field: "image",
                                    input: {
                                      $arrayElemAt: ["$user", 0],
                                    },
                                  },
                                },
                                "",
                              ],
                            },
                            then: "https://admin.mygames11.com/avtar1.png",
                            else: {
                              $getField: {
                                field: "image",
                                input: {
                                  $arrayElemAt: ["$user", 0],
                                },
                              },
                            },
                          },
                        },
                        userno: '-1',
                        player_type: "classic",
                        winingamount: {
                          $cond: {
                            if: {
                              $ne: [
                                {
                                  $arrayElemAt: [
                                    "$finalResult.amount",
                                    0,
                                  ],
                                },
                                0,
                              ],
                            },
                            then: {
                              $toString: {
                                $ifNull: [
                                  {
                                    $arrayElemAt: [
                                      "$finalResult.amount",
                                      0,
                                    ],
                                  },
                                  "",
                                ],
                              },
                            },
                            else: {
                              $toString: {
                                $ifNull: [
                                  {
                                    $arrayElemAt: [
                                      "$finalResult.prize",
                                      0,
                                    ],
                                  },
                                  "",
                                ],
                              },
                            },
                          },
                        },
                        }
                    },{
                        $lookup:{
                            from: "matchchallenges",
                            localField: "challengeid",
                            foreignField: "_id",
                            as: "challengeData",
                        }
                    },{
                    $addFields:{
                        contest_winning_type: {
                            $ifNull: [
                            {
                                $arrayElemAt: [
                                "$challengeData.amount_type",
                                0,
                                ],
                            },
                            "0",
                            ],
                        },
                        challengeData: "",
                    }
                }
              ], { "allowDiskUse" : true });         
            const finalDataB = await JoinLeaugeModel.aggregate([
                {
                  '$match': {
                    'matchkey':mongoose.Types.ObjectId(req.query.matchkey), 
                    'challengeid':mongoose.Types.ObjectId(req.query.matchchallengeid)
                  }
                }, {
                  '$lookup': {
                    'from': 'jointeams', 
                    'localField': 'teamid', 
                    'foreignField': '_id', 
                    'as': 'jointeam'
                  }
                }, {
                  '$lookup': {
                    'from': 'users', 
                    'localField': 'userid', 
                    'foreignField': '_id', 
                    'as': 'user'
                  }
                }, {
                  '$addFields': {
                    'jointeam': '', 
                    'joinTeamNumber': {
                      '$ifNull': [
                        '$teamnumber', 0
                      ]
                    }, 
                    'teamnumber': {
                      '$ifNull': [
                        {
                          '$arrayElemAt': [
                            '$jointeam.teamnumber', 0
                          ]
                        }, 0
                      ]
                    }, 
                    'points': {
                      '$ifNull': [
                        {
                          '$arrayElemAt': [
                            '$jointeam.points', 0
                          ]
                        }, 0
                      ]
                    }, 
                    'lastpoints': {
                      '$ifNull': [
                        {
                          '$arrayElemAt': [
                            '$jointeam.lastpoints', 0
                          ]
                        }, 0
                      ]
                    }, 
                    'team': {
                      '$ifNull': [
                        {
                          '$arrayElemAt': [
                            '$user.team', 0
                          ]
                        }, ''
                      ]
                    }
                  }
                },{
                    $setWindowFields:{
                        partitionBy: "",
                        sortBy: {
                          points: -1,
                        },
                        output: {
                          rank: {
                            $rank: {},
                          },
                        },
                    }
                },
                {
                    $match:{
                        'userid': {
                            '$ne': mongoose.Types.ObjectId(req.user._id)
                          }
                    }
                },
                {
                    $lookup:{
                        from: "finalresults",
                        localField: "_id",
                        foreignField: "joinedid",
                        as: "finalResult",
                      }
                },{
                    $project:{
                        _id: 0,
                        userjoinid: "$_id",
                        userid: "$userid",
                        'jointeamid': '$teamid',  
                        teamnumber: {
                          $cond: {
                            if: {
                              $and: [
                                {
                                  $eq: ["$teamnumber", 0],
                                },
                              ],
                            },
                            then: "$joinTeamNumber",
                            else: "$teamnumber",
                          },
                        },
                        points: {
                          $ifNull: ["$points", 0],
                        },
                        lastpoints: {
                          $ifNull: ["$lastpoints", 0],
                        },
                        teamname: {
                          $ifNull: ["$team", 0],
                        },
                        getlastrank: "$lastrank",
                        getcurrentrank: "$rank",
                        challengeid: "$challengeid",
                        image: {
                          $cond: {
                            if: {
                              $eq: [
                                {
                                  $getField: {
                                    field: "image",
                                    input: {
                                      $arrayElemAt: ["$user", 0],
                                    },
                                  },
                                },
                                "",
                              ],
                            },
                            then: "https://admin.mygames11.com/avtar1.png",
                            else: {
                              $getField: {
                                field: "image",
                                input: {
                                  $arrayElemAt: ["$user", 0],
                                },
                              },
                            },
                          },
                        },
                        userno: '0',
                        player_type: "classic",
                        winingamount: {
                          $cond: {
                            if: {
                              $ne: [
                                {
                                  $arrayElemAt: [
                                    "$finalResult.amount",
                                    0,
                                  ],
                                },
                                0,
                              ],
                            },
                            then: {
                              $toString: {
                                $ifNull: [
                                  {
                                    $arrayElemAt: [
                                      "$finalResult.amount",
                                      0,
                                    ],
                                  },
                                  "",
                                ],
                              },
                            },
                            else: {
                              $toString: {
                                $ifNull: [
                                  {
                                    $arrayElemAt: [
                                      "$finalResult.prize",
                                      0,
                                    ],
                                  },
                                  "",
                                ],
                              },
                            },
                          },
                        },
                        }
                    },{
                        $lookup:{
                            from: "matchchallenges",
                            localField: "challengeid",
                            foreignField: "_id",
                            as: "challengeData",
                        }
                    },{
                    $addFields:{
                        contest_winning_type: {
                            $ifNull: [
                            {
                                $arrayElemAt: [
                                "$challengeData.amount_type",
                                0,
                                ],
                            },
                            "0",
                            ],
                        },
                        challengeData: "",
                    }
                },{
                    $limit:100
                }
              ], { "allowDiskUse" : true }); 

            
           const finalData = finalDataA.concat(finalDataB);

            //sahilendanylysis

            //const finalData = await JoinLeaugeModel.aggregate(aggPipe);
            

            if (finalData.length > 0) {
                return {
                    message: "Live score lederbord of match",
                    status: true,
                    data: {
                        team_number_get: finalData[0].teamnumber,
                        userrank: finalData[0].getcurrentrank,
                        pdfname: '',
                        jointeams: finalData ? finalData : [],
                        
                    }
                }
            } else {
                return {
                    message: 'Live score lederbord of match Not Found',
                    status: false,
                    data: {},
                    
                }
            }
        } catch (error) {
            throw error;
        }
    }
    /**
     * @function fantasyScoreCards
     * @description Match Player stats shows up
     * @param { matchkey }
     * @author 
     */
    async fantasyScoreCards(req) {
        try {
            let finalData = [],
                aggpipe = [],
                ends = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'];
            // const joinData = await JoinTeamModel.find({ matchkey: req.query.matchkey });
            // const matchplayer = await matchPlayersModel.find({ matchkey: req.query.matchkey }).populate({
            //     path: 'matchkey',
            //     select: 'name, '
            // });
            aggpipe.push({
                $match: { matchkey: mongoose.Types.ObjectId(req.query.matchkey), playingstatus: 1 }
            });
            aggpipe.push({
                $lookup: {
                    from: 'listmatches',
                    localField: 'matchkey',
                    foreignField: '_id',
                    as: 'match'
                }
            });
            aggpipe.push({
                $addFields: { matchname: { $arrayElemAt: ['$match.name', 0] }, }
            });
            aggpipe.push({
                $project: {
                    _id: 0,
                    matchplayerid: '$_id',
                    matchkey: 1,
                    playerid: 1,
                    role: 1,
                    credit: 1,
                    name: 1,
                    legal_name: 1,
                    battingstyle: 1,
                    bowlingstyle: 1,
                    playingstatus: 1,
                    vplaying: 1,
                    players_count: 1,
                    matchname: 1,
                    totalSelected: 1
                }
            });
            aggpipe.push({
                $lookup: {
                    from: 'players',
                    let: { playerid: '$playerid' },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $eq: ['$_id', '$$playerid']
                            }
                        }
                    }, {
                        $lookup: {
                            from: 'teams',
                            localField: 'team',
                            foreignField: '_id',
                            as: 'team'
                        }
                    }, {
                        $project: {
                            _id: 0,
                            image: 1,
                            role: 1,
                            team: { $arrayElemAt: ["$team.short_name", 0] },

                        }
                    }],
                    as: 'playerimage'
                }
            });
            aggpipe.push({
                $addFields: {
                    teamShortName: { $arrayElemAt: ["$playerimage.team", 0] },
                    playerimage: { $arrayElemAt: ["$playerimage.image", 0] },
                    playerrole: { $arrayElemAt: ["$playerimage.role", 0] },
                    playerCredit: { $arrayElemAt: ["$playerimage.credit", 0] },
                }
            });
            aggpipe.push({
                $lookup: {
                    from: 'resultmatches',
                    let: { matchkey: '$matchkey', playerid: '$playerid' },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [{ $eq: ['$matchkey', '$$matchkey'] }, { $eq: ['$player_id', '$$playerid'] }]
                            }
                        }
                    }],
                    as: 'result'
                }
            });
            aggpipe.push({
                $lookup: {
                    from: 'resultpoints',
                    let: { matchkey: '$matchkey', playerid: '$playerid' },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [{ $eq: ['$matchkey', '$$matchkey'] }, { $eq: ['$player_id', '$$playerid'] }]
                            }
                        }
                    }],
                    as: 'resultpoint'
                }
            });
            aggpipe.push({
                $project: {
                    playername: '$name',
                    // playerimage: {
                    //     $ifNull: [{
                    //         $cond: {
                    //             if: { $or: [{ $eq: [{ $substr: ['$playerimage', 0, 1] }, '/'] }, { $eq: [{ $substr: ['$playerimage', 0, 1] }, 'p'] }] },
                    //             then: { $concat: [`${constant.BASE_URL}`, '', '$playerimage'] },
                    //             else: {
                    //                 $cond: {
                    //                     if: { $eq: ['$playerimage', ''] },
                    //                     then: `${constant.BASE_URL}player.png`,
                    //                     else: '$playerimage'
                    //                 }
                    //             },
                    //         }
                    //     }, `${constant.BASE_URL}player.png`]
                    // },
                    playerimage: {
                        $cond: {
                            if: { $and: [{ $ne: ['$playerimage', 'null'] }, { $ne: ['$playerimage', ''] }] },
                            then: { $concat: [`${constant.BASE_URL}`, ' ', '$playerimage'] },
                            else: {
                                $cond: {
                                    if: { $eq: ['$playerimage', ''] },
                                    then: {
                                        $cond: {
                                            if: { $eq: ['$playerimage', '$match.team1Id'] },
                                            then: `${constant.BASE_URL}white_team1.png`,
                                            else: {
                                                $cond: {
                                                    if: { $eq: ['$playersData.team', '$match.team2Id'] },
                                                    then: `${constant.BASE_URL}black_team1.png`,
                                                    else: `${constant.BASE_URL}black_team1.png`
                                                }
                                            }
                                        }
                                    },
                                    else: `${constant.BASE_URL}black_team1.png`
                                }
                            },
                        },
                    },
                    matchname: 1,
                    playerid: 1,
                    playerrole: 1,
                    credit: 1,
                    duck: { $arrayElemAt: ['$result.duck', 0] },
                    innings: { $arrayElemAt: ['$result.innings', 0] },
                    teamShortName: 1,
                    startingpoints: { $arrayElemAt: ['$resultpoint.startingpoints', 0] },
                    runs: { $arrayElemAt: ['$resultpoint.runs', 0] },
                    fours: { $arrayElemAt: ['$resultpoint.fours', 0] },
                    sixs: { $arrayElemAt: ['$resultpoint.sixs', 0] },
                    strike_rate: { $arrayElemAt: ['$resultpoint.strike_rate', 0] },
                    century: { $sum: [{ $arrayElemAt: ['$resultpoint.century', 0] }, { $arrayElemAt: ['$resultpoint.halfcentury', 0] }] },
                    // wickets: { $arrayElemAt: ['$resultpoint.wickets', 0] },
                    maidens: { $arrayElemAt: ['$resultpoint.maidens', 0] },
                    economy_rate: { $arrayElemAt: ['$resultpoint.economy_rate', 0] },
                    thrower: { $arrayElemAt: ['$resultpoint.thrower', 0] },
                    hitter: { $arrayElemAt: ['$resultpoint.hitter', 0] },
                    catch: { $arrayElemAt: ['$resultpoint.catch', 0] },
                    catchpoints: { $arrayElemAt: ['$resultpoint.catch', 0] },
                    stumping: { $sum: [{ $arrayElemAt: ['$resultpoint.stumping', 0] }, { $arrayElemAt: ['$resultpoint.thrower', 0] }, { $arrayElemAt: ['$resultpoint.hitter', 0] }] },
                    bonus: { $arrayElemAt: ['$resultpoint.bonus', 0] },
                    halfcentury: { $arrayElemAt: ['$resultpoint.halfcentury', 0] },
                    negative: { $arrayElemAt: ['$resultpoint.negative', 0] },
                    total: { $arrayElemAt: ['$resultpoint.total', 0] },
                    wicketbonuspoint: { $arrayElemAt: ['$resultpoint.wicketbonuspoint', 0] },
                    selectper: { $ifNull: ['$totalSelected', '0'] }

                }
            })
            const matchplayer = await matchPlayersModel.aggregate(aggpipe);
            if (matchplayer.length > 0) {
                return {
                    message: 'Match Player stats data...',
                    status: true,
                    data: matchplayer
                }
            } else {
                return {
                    message: 'Match Player stats data not found...',
                    status: false,
                    data: []
                }
            }
        } catch (error) {
            throw error;
        }
    }
    //sahil fabtasy card
    async matchPlayerFantasyScoreCards(req) {
        try {
            console.log("hello")
            let finalData = [],
                aggpipe = [],
                ends = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'];
            // const joinData = await JoinTeamModel.find({ matchkey: req.query.matchkey });
            // const matchplayer = await matchPlayersModel.find({ matchkey: req.query.matchkey }).populate({
            //     path: 'matchkey',
            //     select: 'name, '
            // });
            aggpipe.push({
                $match: {
                    matchkey: mongoose.Types.ObjectId(req.query.matchkey),
                    playingstatus: 1,
                    playerid: mongoose.Types.ObjectId(req.query.playerid)
                }
            });
            aggpipe.push({
                $lookup: {
                    from: 'listmatches',
                    localField: 'matchkey',
                    foreignField: '_id',
                    as: 'match'
                }
            });
            aggpipe.push({
                $addFields: { matchname: { $arrayElemAt: ['$match.name', 0] }, }
            });
            aggpipe.push({
                $project: {
                    _id: 0,
                    matchplayerid: '$_id',
                    matchkey: 1,
                    playerid: 1,
                    role: 1,
                    credit: 1,
                    name: 1,
                    legal_name: 1,
                    battingstyle: 1,
                    bowlingstyle: 1,
                    playingstatus: 1,
                    vplaying: 1,
                    players_count: 1,
                    matchname: 1,
                    totalSelected: 1
                }
            });
            aggpipe.push({
                $lookup: {
                    from: 'players',
                    let: { playerid: '$playerid' },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $eq: ['$_id', '$$playerid']
                            }
                        }
                    }, {
                        $lookup: {
                            from: 'teams',
                            localField: 'team',
                            foreignField: '_id',
                            as: 'team'
                        }
                    }, {
                        $project: {
                            _id: 0,
                            image: 1,
                            role: 1,
                            team: { $arrayElemAt: ["$team.short_name", 0] },

                        }
                    }],
                    as: 'playerimage'
                }
            });
            aggpipe.push({
                $addFields: {
                    teamShortName: { $arrayElemAt: ["$playerimage.team", 0] },
                    playerimage: { $arrayElemAt: ["$playerimage.image", 0] },
                    playerrole: { $arrayElemAt: ["$playerimage.role", 0] },
                    playerCredit: { $arrayElemAt: ["$playerimage.credit", 0] },
                }
            });
            aggpipe.push({
                $lookup: {
                    from: 'resultmatches',
                    let: { matchkey: '$matchkey', playerid: '$playerid' },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [{ $eq: ['$matchkey', '$$matchkey'] }, { $eq: ['$player_id', '$$playerid'] }]
                            }
                        }
                    }],
                    as: 'result'
                }
            });
            aggpipe.push({
                $lookup: {
                    from: 'resultpoints',
                    let: { matchkey: '$matchkey', playerid: '$playerid' },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [{ $eq: ['$matchkey', '$$matchkey'] }, { $eq: ['$player_id', '$$playerid'] }]
                            }
                        }
                    }],
                    as: 'resultpoint'
                }
            });
            aggpipe.push({
                $project: {
                    playername: '$name',
                    // playerimage: {
                    //     $ifNull: [{
                    //         $cond: {
                    //             if: { $or: [{ $eq: [{ $substr: ['$playerimage', 0, 1] }, '/'] }, { $eq: [{ $substr: ['$playerimage', 0, 1] }, 'p'] }] },
                    //             then: { $concat: [`${constant.BASE_URL}`, '', '$playerimage'] },
                    //             else: {
                    //                 $cond: {
                    //                     if: { $eq: ['$playerimage', ''] },
                    //                     then: `${constant.BASE_URL}player.png`,
                    //                     else: '$playerimage'
                    //                 }
                    //             },
                    //         }
                    //     }, `${constant.BASE_URL}player.png`]
                    // },
                    playerimage: {
                        $cond: {
                            if: { $and: [{ $ne: ['$playerimage', 'null'] }, { $ne: ['$playerimage', ''] }] },
                            then: { $concat: [`${constant.BASE_URL}`, ' ', '$playerimage'] },
                            else: {
                                $cond: {
                                    if: { $eq: ['$playerimage', ''] },
                                    then: {
                                        $cond: {
                                            if: { $eq: ['$playerimage', '$match.team1Id'] },
                                            then: `${constant.BASE_URL}/players/white_team1.png`,
                                            else: {
                                                $cond: {
                                                    if: { $eq: ['$playersData.team', '$match.team2Id'] },
                                                    then: `${constant.BASE_URL}black_team1.png`,
                                                    else: `${constant.BASE_URL}black_team1.png`
                                                }
                                            }
                                        }
                                    },
                                    else: `${constant.BASE_URL}black_team1.png`
                                }
                            },
                        },
                    },
                    matchname: 1,
                    playerid: 1,
                    playerrole: 1,
                    credit: 1,
                    //duck: { $arrayElemAt: ['$result.duck', 0] },
                    duck: { $arrayElemAt: ['$resultpoint.negative', 0] },//by sahil
                    innings: { $arrayElemAt: ['$result.innings', 0] },
                    teamShortName: 1,
                    startingpoints: { $arrayElemAt: ['$resultpoint.startingpoints', 0] },
                    runs: { $arrayElemAt: ['$resultpoint.runs', 0] },
                    fours: { $arrayElemAt: ['$resultpoint.fours', 0] },
                    sixs: { $arrayElemAt: ['$resultpoint.sixs', 0] },
                    strike_rate: { $arrayElemAt: ['$resultpoint.strike_rate', 0] },
                    century: { $sum: [{ $arrayElemAt: ['$resultpoint.century', 0] }, { $arrayElemAt: ['$resultpoint.halfcentury', 0] }] },
                    wickets: { $arrayElemAt: ['$resultpoint.wickets', 0] },
                    maidens: { $arrayElemAt: ['$resultpoint.maidens', 0] },
                    economy_rate: { $arrayElemAt: ['$resultpoint.economy_rate', 0] },
                    thrower: { $sum: [{ $convert: { input: { $arrayElemAt: ['$resultpoint.thrower', 0] }, to: "int", onError: 0, onNull: 0 } }, { $convert: { input: { $arrayElemAt: ['$resultpoint.hitter', 0] }, to: "int", onError: 0, onNull: 0 } }] },
                    hitter: { $arrayElemAt: ['$resultpoint.hitter', 0] },
                    catch: { $arrayElemAt: ['$resultpoint.catch', 0] },
                    catchpoints: { $arrayElemAt: ['$resultpoint.catch', 0] },
                    stumping: { $arrayElemAt: ['$resultpoint.stumping', 0] },
                    bonus: { $arrayElemAt: ['$resultpoint.bonus', 0] },
                    halfcentury: { $arrayElemAt: ['$resultpoint.halfcentury', 0] },
                    negative: { $arrayElemAt: ['$resultpoint.negative', 0] },
                    total: { $arrayElemAt: ['$resultpoint.total', 0] },
                    wicketbonuspoint: { $arrayElemAt: ['$resultpoint.wicketbonuspoint', 0] },
                    selectper: { $ifNull: ['$totalSelected', '0'] },
                    thirty: { $arrayElemAt: ['$resultpoint.thirtypoints', 0] }
                }
            })
            aggpipe.push({
                $addFields: {
                    stumping: { $sum: ["$stumping", "$thrower"] }
                }
            })
            const matchplayer = await matchPlayersModel.aggregate(aggpipe);
            console.log("matchplayer" + JSON.stringify(matchplayer))
            // matchplayer[0].thirty=0;
            if (matchplayer.length > 0) {
                return {
                    message: 'Match Player stats data...',
                    status: true,
                    data: matchplayer
                }
            } else {
                return {
                    message: 'Match Player stats data not found...',
                    status: false,
                    data: []
                }
            }
        } catch (error) {
            throw error;
        }
    }



    //sahil fantasy card

    /**
     * @function matchlivedata
     * @description match live score
     * @param { matchkey(query) }
     * @author 
     */
    async matchlivedata(req) {
        try {
            let inningarr = [];
            //sahil redis
            // let keyname=`matchlivedata-${req.query.matchkey}`
            // let redisdata=await Redis.getkeydata(keyname);
            // let match;
            // if(redisdata)
            // {
            //     match=redisdata;
            // }
            // else
            // {
            //     match = await listMatchesModel.findOne({ _id: mongoose.Types.ObjectId(req.query.matchkey) });
            //     let redisdata=Redis.setkeydata(keyname,match,60*60*4);
            // }

            //sahil redis end
            let match = await listMatchesModel.findOne({ _id: mongoose.Types.ObjectId(req.query.matchkey) });
            if (match) {
                let matchScoreData = await EntityApiController.getmatchscore(match.real_matchkey);
                if (matchScoreData) {
                    if (matchScoreData.innings.length > 0) {
                        for (let innings of matchScoreData.innings) {
                            let inningObj = {};
                            inningObj.name = innings.name;
                            inningObj.scores = innings.scores_full;

                            //  Inserting Batsmen Of That Inning------------------------ 
                            if (innings.batsmen.length > 0) {
                                let batsmenarr = [];
                                let i = 0;
                                for (let batsmen of innings.batsmen) {
                                    i++;
                                    let batsmenObj = {};
                                    batsmenObj.name = batsmen.name;
                                    batsmenObj.role = batsmen.role;
                                    batsmenObj.how_out = batsmen.how_out;
                                    batsmenObj.runs = batsmen.runs;
                                    batsmenObj.balls = batsmen.balls_faced;
                                    batsmenObj.fours = batsmen.fours;
                                    batsmenObj.sixes = batsmen.sixes;
                                    batsmenObj.strike_rate = batsmen.strike_rate;
                                    batsmenObj.batting = batsmen.batting;
                                    batsmenObj.dismissal = batsmen.dismissal;
                                    batsmenarr.push(batsmenObj);
                                    if (i == innings.batsmen.length) {
                                        inningObj.batsmen = batsmenarr;
                                    }
                                }
                            } else {
                                inningObj.batsmen = [];
                            }
                            inningObj.extra_runs = innings.extra_runs; // extras
                            inningObj.equations = innings.equations; // total

                            //  concatenate name of batsmen that not bat Of That Inning------------------------ 
                            inningObj.did_not_bat = '';
                            let i = 0;
                            if (innings.did_not_bat.length > 0) {
                                for (let did_not_bat of innings.did_not_bat) {
                                    i++;
                                    if (innings.did_not_bat.length == i) {
                                        inningObj.did_not_bat += `${did_not_bat.name}`
                                    } else {
                                        inningObj.did_not_bat += `${did_not_bat.name},`
                                    }
                                }
                            }

                            //  Inserting Bowlers Of That Inning------------------------ 
                            if (innings.bowlers.length > 0) {
                                let bowlersarr = [];
                                let i = 0;
                                for (let bowlers of innings.bowlers) {
                                    i++;
                                    let bowlersObj = {};
                                    bowlersObj.name = bowlers.name;
                                    bowlersObj.overs = bowlers.overs;
                                    bowlersObj.maidens = bowlers.maidens;
                                    bowlersObj.runs = bowlers.runs_conceded;
                                    bowlersObj.balls = bowlers.balls_faced;
                                    bowlersObj.wickets = bowlers.wickets;
                                    bowlersObj.economy_rate = bowlers.econ;
                                    bowlersObj.bowling = bowlers.bowling;
                                    bowlersarr.push(bowlersObj);
                                    if (i == innings.bowlers.length) {
                                        inningObj.bowlers = bowlersarr;
                                    }
                                }
                            } else {
                                inningObj.bowlers = [];
                            }
                            console.log("hii")

                            //  Inserting Fall Of Wickets Of That Inning------------------------ 
                            if (innings.fows.length > 0) {
                                let fowsarr = [];
                                let i = 0;
                                for (let fows of innings.fows) {
                                    i++;
                                    let fowsObj = {};
                                    fowsObj.name = fows.name;
                                    fowsObj.runs = fows.runs;
                                    fowsObj.balls = fows.balls;
                                    fowsObj.score_at_dismissal = String(fows.score_at_dismissal);
                                    fowsObj.overs_at_dismissal = fows.overs_at_dismissal;
                                    fowsObj.number = fows.number;
                                    fowsObj.dismissal = fows.dismissal;
                                    fowsarr.push(fowsObj);
                                    if (i == innings.fows.length) {
                                        inningObj.fall_of_wickets = fowsarr;
                                    }
                                }
                            } else {
                                inningObj.fall_of_wickets = [];
                            }

                            //  Inserting Inning------------------------ 
                            inningarr.push(inningObj)
                        }
                    }
                    if (matchScoreData.innings.length == inningarr.length) {
                        return {
                            message: 'match live score in brief',
                            status: true,
                            data: inningarr
                        }
                    }
                }
            }
        } catch (error) {
            throw error;
        }
    }
    async NewjoinedmatchesLive(req) {
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
                'match.fantasy_type': "Cricket"
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
    async getAllPlayersWithPlayingStatus(req) {
        try {

            let playerPipe = [];
            playerPipe.push({
                $match: { matchkey: mongoose.Types.ObjectId(req.params.matchId) }
            });
            playerPipe.push({
                $lookup: {
                    from: 'players',
                    localField: 'playerid',
                    foreignField: '_id',
                    as: 'playersData'
                }
            });
            playerPipe.push({
                $lookup: {
                    from: 'listmatches',
                    localField: 'matchkey',
                    foreignField: '_id',
                    as: 'listmatches'
                }
            });
            playerPipe.push({
                $unwind: { path: "$playersData" }
            });
            playerPipe.push({
                $unwind: { path: "$listmatches" }
            });
            playerPipe.push({
                $lookup: {
                    from: "teams",
                    localField: 'playersData.team',
                    foreignField: '_id',
                    as: 'team'
                }
            });
            playerPipe.push({
                $project: {
                    _id: 0,
                    id: '$_id',
                    playerid: 1,
                    points: 1,
                    role: 1,
                    credit: 1,
                    name: 1,
                    playingstatus: 1,
                    vplaying: 1,
                    players_key: '$playersData.players_key',
                    image: {
                        $ifNull: [{
                            $cond: {
                                if: { $or: [{ $eq: [{ $substr: ['$playersData.image', 0, 1] }, '/'] }, { $eq: [{ $substr: ['$playersData.image', 0, 1] }, 'p'] }] },
                                then: { $concat: [`${constant.BASE_URL}`, '', '$playersData.image'] },
                                else: {
                                    $cond: {
                                        if: { $eq: ['$playersData.image', ''] },
                                        then: {
                                            $cond: {
                                                if: { $eq: ['$playersData.team', '$listmatches.team1Id'] },
                                                then: `${constant.BASE_URL}white_team1.png`,
                                                else: {
                                                    $cond: {
                                                        if: { $eq: ['$playersData.team', '$listmatches.team2Id'] },
                                                        then: `${constant.BASE_URL}black_team1.png`,
                                                        else: `${constant.BASE_URL}black_team1.png`
                                                    }
                                                }
                                            }
                                        },
                                        else: '$playersData.image'
                                    }
                                }
                            }
                        }, `${constant.BASE_URL}black_team1.png`]
                    },
                    teamName: { $arrayElemAt: ['$team.teamName', 0] },
                    teamcolor: { $ifNull: [{ $arrayElemAt: ['$team.color', 0] }, constant.TEAM_DEFAULT_COLOR.DEF1] },
                    team_logo: {
                        $ifNull: [{
                            $cond: {
                                if: { $or: [{ $eq: [{ $substr: [{ $arrayElemAt: ['$team.logo', 0] }, 0, 1] }, '/'] }, { $eq: [{ $substr: [{ $arrayElemAt: ['$team.logo', 0] }, 0, 1] }, 't'] }] },
                                then: { $concat: [`${constant.BASE_URL}`, '', { $arrayElemAt: ['$team.logo', 0] }] },
                                else: { $arrayElemAt: ['$team.logo', 0] },
                            }
                        }, `${constant.BASE_URL}team_image.png`]
                    },
                    team_short_name: { $arrayElemAt: ['$team.short_name', 0] },
                    totalpoints: '0',
                    team: {
                        $cond: {
                            if: { $eq: ['$playersData.team', '$listmatches.team1Id'] },
                            then: 'team1',
                            else: {
                                $cond: {
                                    if: { $eq: ['$playersData.team', '$listmatches.team2Id'] },
                                    then: 'team2',
                                    else: ''
                                }
                            }
                        }
                    },
                    captain_selection_percentage: '0',
                    vice_captain_selection_percentage: '0',
                    player_selection_percentage: '0'
                }
            })
            playerPipe.push({
                $match: { playingstatus: 1 }
            })
            let data = await matchPlayersModel.aggregate(playerPipe);
            return {
                message: 'Players List By Match',
                status: true,
                data
            }
        } catch (error) {
            throw error;
        }
    }
    async joinTeamPlayerInfo(req) {
        try {
            let aggpipe = [];
            aggpipe.push({
                $match: { _id: mongoose.Types.ObjectId(req.query.jointeamid) }
            });
            aggpipe.push({
                $lookup: {
                    from: 'listmatches',
                    localField: 'matchkey',
                    foreignField: '_id',
                    as: 'match'
                }
            });
            aggpipe.push({
                $addFields: { matchname: { $arrayElemAt: ['$match.name', 0] }, }
            });
            aggpipe.push({
                $lookup: {
                    from: "players",
                    localField: "players",
                    foreignField: "_id",
                    as: "PlayerData"
                }
            })
            aggpipe.push({
                $unwind: {
                    path: "$PlayerData",
                    preserveNullAndEmptyArrays: true
                }
            })
            aggpipe.push({
                $lookup: {
                    from: 'teams',
                    localField: 'PlayerData.team',
                    foreignField: '_id',
                    as: 'teamData'
                }
            });
            aggpipe.push({
                $lookup: {
                    from: "matchplayers",
                    localField: "players",
                    foreignField: "playerid",
                    as: "matchPlayerData"
                }
            })
            // aggpipe.push({
            //   $unwind:{path:"$matchPlayerData",
            //   preserveNullAndEmptyArrays: true}  
            // })
            aggpipe.push({
                $lookup: {
                    from: 'resultmatches',
                    let: { matchkey: '$matchkey', playerid: '$PlayerData._id' },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [{ $eq: ['$matchkey', '$$matchkey'] }, { $eq: ['$player_id', '$$playerid'] }]
                            }
                        }
                    }],
                    as: 'resulMatchtData'
                }
            });
            aggpipe.push({
                $lookup: {
                    from: 'resultpoints',
                    let: { matchkey: '$matchkey', playerid: '$PlayerData._id' },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [{ $eq: ['$matchkey', '$$matchkey'] }, { $eq: ['$player_id', '$$playerid'] }]
                            }
                        }
                    }],
                    as: 'resultpointData'
                }
            })
            aggpipe.push({
                $project: {
                    _id: 0,
                    joinTeamId: '$_id',
                    matchname: '$matchname',
                    playerid: '$PlayerData._id',
                    playerrole: '$PlayerData.role',
                    credit: "$PlayerData.credit",
                    duck: { $ifNull: [{ $arrayElemAt: ['$resulMatchtData.duck', 0] }, 0] },
                    innings: { $ifNull: [{ $arrayElemAt: ['$resulMatchtData.innings', 0] }, 0] },
                    teamShortName: 1,
                    startingpoints: { $ifNull: [{ $arrayElemAt: ['$resultpointData.startingpoints', 0] }, 0] },
                    runs: { $ifNull: [{ $arrayElemAt: ['$resultpointData.runs', 0] }, 0] },
                    fours: { $ifNull: [{ $arrayElemAt: ['$resultpointData.fours', 0] }, 0] },
                    wicket: { $ifNull: [{ $arrayElemAt: ['$resultpointData.wickets', 0] }, 0] },
                    sixs: { $ifNull: [{ $arrayElemAt: ['$resultpointData.sixs', 0] }, 0] },
                    strike_rate: { $ifNull: [{ $arrayElemAt: ['$resultpointData.strike_rate', 0] }, 0] },
                    century: { $sum: [{ $ifNull: [{ $arrayElemAt: ['$resultpointData.century', 0] }, 0] }, { $ifNull: [{ $arrayElemAt: ['$resultpointData.halfcentury', 0] }, 0] }] },
                    // wickets: { $ifNull: [{ $arrayElemAt: ['$resultpointData.wickets', 0] },0]},
                    maidens: { $ifNull: [{ $arrayElemAt: ['$resultpointData.maidens', 0] }, 0] },
                    economy_rate: { $ifNull: [{ $arrayElemAt: ['$resultpointData.economy_rate', 0] }, 0] },
                    thrower: { $ifNull: [{ $arrayElemAt: ['$resultpointData.thrower', 0] }, 0] },
                    hitter: { $ifNull: [{ $arrayElemAt: ['$resultpointData.hitter', 0] }, 0] },
                    catch: { $ifNull: [{ $arrayElemAt: ['$resultpointData.catch', 0] }, 0] },
                    catchpoints: { $ifNull: [{ $arrayElemAt: ['$resultpointData.catch', 0] }, 0] },
                    stumping: { $sum: [{ $ifNull: [{ $arrayElemAt: ['$resultpointData.stumping', 0] }, 0] }, { $ifNull: [{ $arrayElemAt: ['$resultpointData.thrower', 0] }, 0] }, { $ifNull: [{ $arrayElemAt: ['$resultpointData.hitter', 0] }, 0] }] },
                    bonus: { $ifNull: [{ $arrayElemAt: ['$resultpointData.bonus', 0] }, 0] },
                    halfcentury: { $ifNull: [{ $arrayElemAt: ['$resultpointData.halfcentury', 0] }, 0] },
                    negative: { $ifNull: [{ $arrayElemAt: ['$resultpointData.negative', 0] }, 0] },
                    total: { $ifNull: [{ $arrayElemAt: ['$resultpointData.total', 0] }, 0] },
                    wicketbonuspoint: { $ifNull: [{ $arrayElemAt: ['$resultpointData.wicketbonuspoint', 0] }, 0] },
                    selectper: { $ifNull: ['$matchPlayerData.totalSelected', '0'] }
                }
            })
            console.log("hello1")
            const joinTeamPlayerData = await JoinTeamModel.aggregate(aggpipe);
            let i = 0;
            let Selectper = [];
            for (i = 0; i < joinTeamPlayerData.length; i++) {
                joinTeamPlayerData[i].selectper = joinTeamPlayerData[i].selectper[i]

            }
            //             joinTeamPlayerData[i].forEach(Selectperobj=>
            // {Selectperobj.selectper.forEach(item=>
            //     {Selectperobj.selectper=i

            //     })

            //     i++;                //Selectper.push(item)
            //                     // joinTeamPlayerData[i].selectper=item;
            //                     // console.log("item"+item)
            //                     // i++;

            //                 //joinTeamPlayerData[0].selectper=
            // })
            // const captain_TeamPlayerData = await JoinTeamModel.aggregate(conditionsCaptain);
            // const voice_captain_TeamPlayerData = await JoinTeamModel.aggregate(conditionsVoiceCaptain);
            if (joinTeamPlayerData.length > 0) {
                return {
                    message: 'Join Team Player Info Of A Match...',
                    status: true,
                    data: joinTeamPlayerData
                }
            } else {
                return {
                    message: 'Join Team Player Info not found...',
                    status: false,
                    data: []
                }
            }
        } catch (error) {
            throw error;
        }
    }
}
module.exports = new matchServices();