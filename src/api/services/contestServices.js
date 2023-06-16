const mongoose = require('mongoose');
const randomstring = require("randomstring");

const matchchallengesModel = require('../../models/matchChallengersModel');
const JoinLeaugeModel = require('../../models/JoinLeaugeModel');
const JoinTeamModel = require('../../models/JoinTeamModel');
const userModel = require('../../models/userModel');
const TransactionModel = require('../../models/transactionModel');
const JoinedReferModel = require('../../models/JoinedReferModel');
const leaderBoardModel = require('../../models/leaderboardModel');

const constant = require('../../config/const_credential');
const matchServices = require('./matchServices');
const listMatchesModel = require('../../models/listMatchesModel');
const contestCategory = require('../../models/contestcategoryModel');
const Redis = require('../../utils/redis');
class contestServices {
    constructor() {
        return {
            getAllContests: this.getAllContests.bind(this),
            getContest: this.getContest.bind(this),
            joinContest: this.joinContest.bind(this),
            myJoinedContests: this.myJoinedContests.bind(this),
            myLeaderboard: this.myLeaderboard.bind(this),
            updateJoinedusers: this.updateJoinedusers.bind(this),
            switchTeams: this.switchTeams.bind(this),
            getUsableBalance: this.getUsableBalance.bind(this),
            getAllContestsWithoutCategory: this.getAllContestsWithoutCategory.bind(this),
            createPrivateContest: this.createPrivateContest.bind(this),
            joinContestByCode: this.joinContestByCode.bind(this),
            getJoinleague: this.getJoinleague.bind(this),
            getAllNewContests: this.getAllNewContests.bind(this),
        }
    }
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
                JoinTeamModel.countDocuments({ userid: req.user._id, matchkey: req.query.matchkey }),
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

    /**
     * @function getAllContests
     * @description Gat All Contest Of A Match By there Category
     * @param { matchkey }
     * @author 
     */
    async getAllContests(req) {
        try {
            // await this.updateJoinedusers(req);
            let finalData = [],
                contest_arr = [],
                aggpipe = [];


            aggpipe.push({
                $match: { matchkey: mongoose.Types.ObjectId(req.query.matchkey), status: "opened", is_private: 0 },
            });
            aggpipe.push({
                $lookup: {
                    from: 'contestcategories',
                    localField: 'contest_cat',
                    foreignField: '_id',
                    as: 'contestcategories'
                }
            });

            aggpipe.push({
                $sort: { "contestcategories.Order": 1, 'win_amount': -1 }
            });
            // const start=Date.now();
            const matchchallengesData = await matchchallengesModel.aggregate(aggpipe);
            // const end=Date.now();
            // console.log(`time ${end-start}`)
            let i = 0;
            // console.log("matchchallengesData",matchchallengesData)
            if (matchchallengesData.length == 0) {
                return {
                    message: "No Challenge Available For This Match",
                    status: true,
                    data: []
                }
            }
            let [total_teams, total_joinedcontestData] = await Promise.all([
                JoinTeamModel.countDocuments({ userid: req.user._id, matchkey: req.query.matchkey }),
                this.getJoinleague(req.user._id, req.query.matchkey)
            ]);
            for await (const matchchallenge of matchchallengesData) {
                i++;
                let isselected = false,
                    refercode = '',
                    winners = 0;
                const price_card = [];
                const joinedleauge = await JoinLeaugeModel.find({
                    matchkey: req.query.matchkey,
                    challengeid: matchchallenge._id,
                    userid: req.user._id,
                }).select('_id refercode');

                if (joinedleauge.length > 0) {
                    refercode = joinedleauge[0].refercode;
                    if (matchchallenge.multi_entry == 1 && joinedleauge.length < 11) {
                        if (matchchallenge.contest_type == 'Amount') {
                            if (joinedleauge.length == 11 || matchchallenge.joinedusers == matchchallenge.maximum_user)
                                isselected = true;
                        } else if (matchchallenge.contest_type == 'Percentage') {
                            if (joinedleauge.length == 11) isselected = true;
                        } else isselected = false;
                    } else isselected = true;
                }
                if (matchchallenge.matchpricecards) {
                    if (matchchallenge.matchpricecards.length > 0) {
                        for await (const priceCard of matchchallenge.matchpricecards) {
                            winners += Number(priceCard.winners);
                            const tmpObj = {
                                id: priceCard._id,
                                winners: priceCard.winners,
                                total: priceCard.total,
                            };
                            if ((priceCard.price && Number(priceCard.price) == 0) || priceCard.type == 'Percentage') {
                                tmpObj['price'] = (Number(priceCard.total) / Number(priceCard.winners)).toFixed(2);
                                tmpObj['price_percent'] = `${priceCard.price_percent}%`;
                            } else {
                                tmpObj['gift_type'] = priceCard.gift_type;
                                if (matchchallenge.amount_type == "prize") {
                                    tmpObj['price'] = priceCard.prize_name;
                                    tmpObj['image'] = `${constant.BASE_URL}${priceCard.image}`;
                                } else {
                                    tmpObj['price'] = Number(priceCard.price).toFixed(2);
                                    tmpObj['image'] = '';
                                }
                            }

                            if (priceCard.min_position + 1 != priceCard.max_position) tmpObj['start_position'] = `${Number(priceCard.min_position) + 1}-${priceCard.max_position}`;
                            else tmpObj['start_position'] = `${priceCard.max_position}`;
                            price_card.push(tmpObj);
                        }
                    } else {
                        price_card.push({
                            id: 0,
                            winners: 1,
                            price: matchchallenge.win_amount,
                            total: matchchallenge.win_amount,
                            start_position: 1,
                            image: '',
                            gift_type: "amount"
                        });
                        winners = 1;
                    }
                    // console.log("------matchchallengesData[0].matchpricecards--",matchchallenge.matchpricecards)


                } else {
                    price_card.push({
                        id: 0,
                        winners: 1,
                        price: matchchallenge.win_amount,
                        total: matchchallenge.win_amount,
                        start_position: 1,
                    });
                    winners = 1;
                }
                let gift_image = "";
                let gift_type = "amount";
                let find_gift = matchchallenge.matchpricecards.find(function (x) { return x.gift_type == "gift" });
                if (find_gift) {
                    gift_image = `${constant.BASE_URL}${find_gift.image}`;
                    gift_type = find_gift.gift_type;
                }
                let team_limits;
                if (matchchallenge.multi_entry == 0) {
                    team_limits = 1
                } else {
                    team_limits = matchchallenge.team_limit
                }
                finalData.push({
                    matchchallengeid: matchchallenge._id,
                    catid: matchchallenge.contest_cat ? matchchallenge.contestcategories[0]._id : '',
                    cat_order: matchchallenge.contest_cat ? matchchallenge.contestcategories[0].Order : '',
                    catname: matchchallenge.contest_cat ? matchchallenge.contestcategories[0].name : '',
                    contest_type: matchchallenge.contest_type,
                    sub_title: matchchallenge.contest_cat ? matchchallenge.contestcategories[0].sub_title : '',
                    image: matchchallenge.contest_cat ? `${constant.BASE_URL}${matchchallenge.contestcategories[0].image}` : `${constant.BASE_URL}logo.png`,
                    winning_percentage: matchchallenge.winning_percentage,
                    entryfee: matchchallenge.entryfee,
                    win_amount: matchchallenge.win_amount,
                    maximum_user: matchchallenge.contest_type == 'Amount' ? matchchallenge.maximum_user : 0,
                    matchkey: req.query.matchkey,
                    joinedusers: matchchallenge.joinedusers,
                    multi_entry: matchchallenge.multi_entry,
                    // is_expert:matchchallenge.is_expert,
                    // expert_name:matchchallenge.expert_name,
                    confirmed_challenge: matchchallenge.confirmed_challenge,
                    is_running: matchchallenge.is_running,
                    is_bonus: matchchallenge.is_bonus,
                    team_limit: team_limits,
                    bonus_percentage: matchchallenge.bonus_percentage || 0,
                    pricecard_type: matchchallenge.pricecard_type,
                    isselected: isselected,
                    bonus_date: '',
                    isselectedid: '',
                    refercode: refercode,
                    totalwinners: winners,
                    price_card: price_card,
                    status: 1,
                    joinedleauges: joinedleauge.length,
                    total_joinedcontest: total_joinedcontestData || 0,
                    total_teams: total_teams || 0,
                    gift_image: gift_image,
                    gift_type: gift_type,
                });
                //     }
                // }
                if (i == matchchallengesData.length) {
                    // finalData.sort(function(a, b) {
                    //     return b['win_amount'] - a['win_amount'];
                    // });
                    // finalData.sort(function(a, b) {
                    //     return a['cat_order'] - b['cat_order'];
                    // });
                    // let newarr = Object.values(finalData.reduce((acc, obj) => {
                    //     const key = obj['catid'];
                    //     let contest = [],
                    //         temObj = {}
                    //     if (!acc[key]) {
                    //         acc[key] = [];
                    //         temObj.catid = obj.catid;
                    //         temObj.catname = obj.catname;
                    //         temObj.sub_title = obj.sub_title;
                    //         temObj.image = obj.image;
                    //         contest.push(obj);
                    //         temObj.contest = contest

                    //         acc[key].push(temObj)
                    //     } else {
                    //         acc[key][0].contest.push(obj);
                    //     }

                    //     return acc;
                    // }, {})).flat()
                    return {
                        message: 'Contest of A Perticular Match',
                        status: true,
                        data: finalData
                    }
                }
            }//asd
        }
        catch (error) {
            throw error;
        }
    }

    /**
     * @function getAllContests
     * @description Gat All Contest Of A Match
     * @param { matchkey }
     * @author 
     */
    async getAllContestsWithoutCategory(req) {
        try {
            let finalData = [],
                contest_arr = [],
                aggpipe = [];
            aggpipe.push({
                $match: { matchkey: mongoose.Types.ObjectId(req.query.matchkey) }
            });
            aggpipe.push({
                $match: {
                    $expr: {
                        $eq: ['$status', 'opened']
                    }
                }
            });
            if (req.query.catid) {
                aggpipe.push({
                    $match: { contest_cat: mongoose.Types.ObjectId(req.query.catid) }
                });
            }
            aggpipe.push({
                $sort: { 'win_amount': -1 }
            });
            const matchchallengesData = await matchchallengesModel.aggregate(aggpipe);
            // console.log(`matchchallengesData-------------------`, matchchallengesData);
            let i = 0;
            if (matchchallengesData.length == 0) {
                return {
                    message: "No Challenge Available For This Match",
                    status: true,
                    data: []
                }
            }
            for await (const matchchallenge of matchchallengesData) {
                i++;
                // const challenge = matchchallenge[0];
                // if ((matchchallenge.contest_type == 'Amount' && matchchallenge.joinedusers < matchchallenge.maximum_user) || matchchallenge.contest_type == 'Percentage') {
                //     if (matchchallenge.maximum_user >= 0 && matchchallenge.is_private != 1 && matchchallenge.status == 'opened') {
                let isselected = false,
                    refercode = '',
                    winners = 0;
                const price_card = [];
                const joinedleauge = await JoinLeaugeModel.find({
                    matchkey: req.query.matchkey,
                    challengeid: matchchallenge._id,
                    userid: req.user._id,
                }).select('_id refercode');
                if (joinedleauge.length > 0) {
                    refercode = joinedleauge[0].refercode;
                    if (matchchallenge.multi_entry == 1 && joinedleauge.length < 11) {
                        if (matchchallenge.contest_type == 'Amount') {
                            if (joinedleauge.length == 11 || matchchallenge.joinedusers == matchchallenge.maximum_user)
                                isselected = true;
                        } else if (matchchallenge.contest_type == 'Percentage') {
                            if (joinedleauge.length == 11) isselected = true;
                        } else isselected = false;
                    } else isselected = true;
                }
                if (matchchallenge.matchpricecards) {
                    if (matchchallenge.matchpricecards.length > 0) {
                        for await (const priceCard of matchchallenge.matchpricecards) {
                            winners += Number(priceCard.winners);
                            const tmpObj = {
                                id: priceCard._id,
                                winners: priceCard.winners,
                                total: priceCard.total,
                            };
                            tmpObj.gift_type = priceCard.gift_type;
                            if (matchchallenge.amount_type == 'prize') {
                                if (priceCard.gift_type == "gift") {
                                    tmpObj.image = `${constant.BASE_URL}/${priceCard.image}`;
                                    tmpObj.price = priceCard.prize_name;
                                } else {
                                    tmpObj.price = priceCard.price;
                                    tmpObj.image = '';
                                }
                            } else {
                                tmpObj.price = priceCard.price;
                                tmpObj.image = '';
                            }
                            if ((priceCard.price && Number(priceCard.price) == 0) || priceCard.type == 'Percentage') {
                                tmpObj['price'] = (Number(priceCard.total) / Number(priceCard.winners)).toFixed(2);
                                tmpObj['price_percent'] = `${priceCard.price_percent}%`;
                            } else {
                                tmpObj['price'] = Number(priceCard.price).toFixed(2);
                            }
                            if (priceCard.min_position + 1 != priceCard.max_position) tmpObj['start_position'] = `${Number(priceCard.min_position) + 1}-${priceCard.max_position}`;
                            else tmpObj['start_position'] = `${priceCard.max_position}`;
                            price_card.push(tmpObj);
                        }
                    } else {
                        price_card.push({
                            id: 0,
                            winners: 1,
                            price: matchchallenge.win_amount,
                            total: matchchallenge.win_amount,
                            start_position: 1,
                            image: "",
                            gift_type: "amount"
                        });
                        winners = 1;
                    }
                } else {
                    price_card.push({
                        id: 0,
                        winners: 1,
                        price: matchchallenge.win_amount,
                        total: matchchallenge.win_amount,
                        start_position: 1,
                        image: "",
                        gift_type: "amount"

                    });
                    winners = 1;
                }
                let gift_image = "";
                let gift_type = "amount";
                let find_gift = matchchallenge.matchpricecards.find(function (x) { return x.gift_type == "gift" });
                // console.log("---find_gift-------//---",find_gift)
                if (find_gift) {
                    gift_image = `${constant.BASE_URL}${find_gift.image}`;
                    gift_type = find_gift.gift_type;
                }
                let team_limits;
                if (matchchallenge.multi_entry == 0) {
                    team_limits = 1
                } else {
                    team_limits = matchchallenge.team_limit
                }
                finalData.push({
                    matchchallengeid: matchchallenge._id,
                    catid: matchchallenge.contest_cat,
                    contest_type: matchchallenge.contest_type,
                    winning_percentage: matchchallenge.winning_percentage,
                    entryfee: matchchallenge.entryfee,
                    win_amount: matchchallenge.win_amount,
                    maximum_user: matchchallenge.contest_type == 'Amount' ? matchchallenge.maximum_user : 0,
                    matchkey: req.query.matchkey,
                    joinedusers: matchchallenge.joinedusers,
                    multi_entry: matchchallenge.multi_entry,
                    confirmed_challenge: matchchallenge.confirmed_challenge,
                    is_running: matchchallenge.is_running,
                    is_bonus: matchchallenge.is_bonus,
                    team_limit: team_limits,
                    bonus_percentage: matchchallenge.bonus_percentage || 0,
                    pricecard_type: matchchallenge.pricecard_type,
                    isselected: isselected,
                    bonus_date: '',
                    isselectedid: '',
                    refercode: refercode,
                    totalwinners: winners,
                    price_card: price_card,
                    status: 1,
                    joinedleauges: team_limits,
                    total_joinedcontest: 0,
                    total_teams: 0,
                    gift_image: gift_image,
                    gift_type: gift_type
                });
                //     }
                // }
                if (i == matchchallengesData.length) {
                    finalData.sort(function (a, b) {
                        return b['win_amount'] - a['win_amount'];
                    });
                    return {
                        message: 'Contest of A Perticular Match Without Category',
                        status: true,
                        // data: matchchallengesData
                        data: finalData
                    }
                }
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * @function getContests
     * @description Gat A Perticular Contest 
     * @param { matchchallengeid }
     * @author 
     */
    async getContest(req) {
        try {
            let finalData = {},
                aggpipe = [];
            aggpipe.push({
                $match: { _id: mongoose.Types.ObjectId(req.query.matchchallengeid) }
            });
            aggpipe.push({
                $lookup: {
                    from: 'contestcategories',
                    localField: 'contest_cat',
                    foreignField: '_id',
                    as: 'contestcategories'
                }
            });
            // aggpipe.push({
            //     $match: {
            //         $expr: {
            //             $eq: ['$status', 'opened']
            //         }
            //     }
            // });
            aggpipe.push({
                $sort: { 'win_amount': -1 }
            });
            const matchchallengesData = await matchchallengesModel.aggregate(aggpipe);
            console.log("matchchallengedata" + JSON.stringify(matchchallengesData[0].joinedusers))
            let i = 0;
            if (matchchallengesData.length == 0) {
                return {
                    message: "No Challenge Available ..!",
                    status: true,
                    data: {}
                }
            }
            // if ((matchchallengesData[0].contest_type == 'Amount' && matchchallengesData[0].joinedusers <= matchchallengesData[0].maximum_user) || matchchallengesData[0].contest_type == 'Percentage') {
            //     // console.log('here')
            //     if (matchchallengesData[0].maximum_user >= 0 && matchchallengesData[0].is_private != 1 && matchchallengesData[0].status == 'opened') {
            let isselected = false,
                refercode = '',
                winners = 0;
            const price_card = [];
            const joinedleauge = await JoinLeaugeModel.find({
                // matchkey: req.query.matchkey,
                challengeid: req.query.matchchallengeid,
                userid: req.user._id,
            }).select('_id refercode');

            if (joinedleauge.length > 0) {
                refercode = joinedleauge[0].refercode;
                if (matchchallengesData[0].multi_entry == 1 && joinedleauge.length < 11) {
                    if (matchchallengesData[0].contest_type == 'Amount') {
                        if (joinedleauge.length == 11 || matchchallengesData[0].joinedusers == matchchallengesData[0].maximum_user)
                            isselected = true;
                    } else if (matchchallengesData[0].contest_type == 'Percentage') {
                        if (joinedleauge.length == 11) isselected = true;
                    } else isselected = false;
                } else isselected = true;
            }
            if (matchchallengesData[0].matchpricecards && matchchallengesData[0].matchpricecards.length > 0) {
                for await (const priceCard of matchchallengesData[0].matchpricecards) {
                    winners += Number(priceCard.winners);
                    const tmpObj = {
                        id: priceCard._id,
                        winners: priceCard.winners,
                        total: priceCard.total,
                    };
                    if ((priceCard.price && Number(priceCard.price) == 0) || priceCard.type == 'Percentage') {
                        tmpObj['price'] = (Number(priceCard.total) / Number(priceCard.winners)).toFixed(2);
                        tmpObj['price_percent'] = `${priceCard.price_percent}%`;
                    } else {
                        if (matchchallengesData[0].amount_type == "prize") {
                            tmpObj['price'] = priceCard.prize_name;
                            if (priceCard.image != "") {
                                tmpObj['image'] = `${constant.BASE_URL}${priceCard.image}`,
                                    tmpObj['gift_type'] = "gift"
                            } else {
                                tmpObj['price'] = Number(priceCard.price);
                                tmpObj['gift_type'] = "amount"
                                tmpObj['image'] = ""
                            }
                        } else {
                            tmpObj['price'] = Number(priceCard.price);
                            tmpObj['gift_type'] = "amount"
                            tmpObj['image'] = ""
                        }
                    }
                    if (priceCard.min_position + 1 != priceCard.max_position) tmpObj['start_position'] = `${Number(priceCard.min_position) + 1}-${priceCard.max_position}`;
                    else tmpObj['start_position'] = `${priceCard.max_position}`;

                    tmpObj.amount_type = matchchallengesData[0].amount_type
                    price_card.push(tmpObj);
                }
            } else {
                price_card.push({
                    id: 0,
                    winners: 1,
                    price: matchchallengesData[0].win_amount,
                    total: matchchallengesData[0].win_amount,
                    start_position: 1,
                    amount_type: matchchallengesData[0].amount_type,

                });
                winners = 1;
            }
            let gift_image = "";
            let gift_type = "amount";
            let find_gift = matchchallengesData[0].matchpricecards.find(function (x) { return x.gift_type == "gift" });
            if (find_gift) {
                gift_image = `${constant.BASE_URL}${find_gift.image}`;
                gift_type = find_gift.gift_type;
            }

            console.log("----reqdata---getcontest..",)
            const total_teams = await JoinTeamModel.countDocuments({ matchkey: req.query.matchkey, userid: req.user._id, });
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
            let count_JoinTeam = total_joinedcontestData[0]?.total_count
            finalData = {
                matchchallengeid: matchchallengesData[0]._id,
                winning_percentage: matchchallengesData[0].winning_percentage,
                entryfee: matchchallengesData[0].entryfee,
                win_amount: matchchallengesData[0].win_amount,
                contest_type: matchchallengesData[0].contest_type,
                maximum_user: matchchallengesData[0].contest_type == 'Amount' ? matchchallengesData[0].maximum_user : 0,
                joinedusers: matchchallengesData[0].joinedusers,
                // is_expert:matchchallengesData[0].is_expert,
                // expert_name:matchchallengesData[0].expert_name,
                multi_entry: matchchallengesData[0].multi_entry,
                confirmed_challenge: matchchallengesData[0].confirmed_challenge,
                is_running: matchchallengesData[0].is_running,
                amount_type: matchchallengesData[0].amount_type,
                is_bonus: matchchallengesData[0].is_bonus,
                team_limit: matchchallengesData[0].team_limit,
                joinedleauge: joinedleauge,  //matchchallengesData[0].joinedusers,     //matchchallengesData[0].team_limit,
                joinedleauges: joinedleauge.length,
                total_joinedcontest: 0,
                total_teams: total_teams, //0,
                bonus_percentage: matchchallengesData[0].bonus_percentage || 0,
                pricecard_type: matchchallengesData[0].pricecard_type,
                isselected: isselected,
                bonus_date: '',
                isselectedid: '',
                refercode: refercode,
                totalwinners: winners,
                price_card: price_card,
                status: 1,
                gift_type: gift_type,
                gift_image: gift_image
            }
            //     }
            // }
            return {
                message: "Match Challenge Data ..!",
                status: true,
                data: finalData
            }
        } catch (error) {
            throw error;
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
    /**
     * @function joinContest
     * @description Contest Joining
     * @param { matchkey,challengeid,teamid }
     * @author 
     */
    async joinContest(req) {
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

            const jointeamsCount = await JoinTeamModel.find({ _id: { $in: jointeamids } }).countDocuments();
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
                const jointeamsData = await JoinTeamModel.findOne({ _id: jointeamId })
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

    /**
     * @function findJoinLeaugeExist
     * @description Find Join League Exist
     * @param { matchkey, userId, teamId, challengeDetails }
     * @author 
     */
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

    /**
     * @function findUsableBonusMoney
     * @description Join League bouns amount use
     * @param { challengeDetails, bonus, winning, balance }
     * @author 
     */
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

    /**
     * @function findUsableBalanceMoney
     * @description Join League balance amount use
     * @param { resultForBonus,balance }
     * @author 
     */
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

    /**
     * @function findUsableWinningMoney
     * @description Join League winning amount use
     * @param { resultforbalance,winning }
     * @author 
     */
    async findUsableWinningMoney(resultForBalance, winning) {
        if (winning >= resultForBalance.reminingfee) {
            return {
                winning: winning - resultForBalance.reminingfee,
                cons_win: resultForBalance.reminingfee,
                reminingfee: 0,
            };
        } else { return { winning: 0, cons_win: winning, reminingfee: resultForBalance.reminingfee - winning }; }
    }

    /**
     * @function myJoinedContests
     * @description Contest Joining
     * @param { matchkey }
     * @author 
     */
    async myJoinedContests(req) {
        try {
            console.log("hellojoin my team")
            const { matchkey } = req.query;
            const aggPipe = [];
            aggPipe.push({
                $match: {
                    userid: mongoose.Types.ObjectId(req.user._id),
                    matchkey: mongoose.Types.ObjectId(matchkey),
                }
            });
            //sahil pagination
            // const skip = Number(req.query.skip); // The page number
            // const limit = Number(req.query.limit); // The number of documents per page

          

            // sahil end pagination

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
                            from: 'jointeams',
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
            //sahilpageination
            //   aggPipe.push({
            //     $skip: skip,
            // });

            // aggPipe.push({
            //     $limit: limit,
            // });
            //sahilpaginationend
            const JoinContestData = await JoinLeaugeModel.aggregate(aggPipe);
            // //sahil cap and vice cap

            // const cap_and_vicecap = await JoinLeaugeModel.aggregate([
            //     {
            //       '$match': {
            //         'matchkey': mongoose.Types.ObjectId(matchkey),
            //         'userid': mongoose.Types.ObjectId(req.user._id) 
            //       }
            //     }, {
            //       '$lookup': {
            //         'from': 'jointeams', 
            //         'let': {
            //           'team': '$teamid'
            //         }, 
            //         'pipeline': [
            //           {
            //             '$match': {
            //               '$expr': {
            //                 '$eq': [
            //                   '$$team', '$_id'
            //                 ]
            //               }
            //             }
            //           }, {
            //             '$lookup': {
            //               'from': 'matchplayers', 
            //               'let': {
            //                 'cap': '$captain', 
            //                 'vice': '$vicecaptain'
            //               }, 
            //               'pipeline': [
            //                 {
            //                   '$match': {
            //                     '$expr': {
            //                       '$or': [
            //                         {
            //                           '$eq': [
            //                             '$$cap', '$playerid'
            //                           ]
            //                         }, {
            //                           '$eq': [
            //                             '$$vice', '$playerid'
            //                           ]
            //                         }
            //                       ]
            //                     }
            //                   }
            //                 }, {
            //                   '$group': {
            //                     '_id': '$playerid', 
            //                     'name': {
            //                       '$first': '$name'
            //                     }
            //                   }
            //                 }
            //               ], 
            //               'as': 'result2'
            //             }
            //           }
            //         ], 
            //         'as': 'result'
            //       }
            //     }, {
            //       '$sort': {
            //         'createdAt': 1
            //       }
            //     }
            //   ]);


            // //sahil cap and vice cap give

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
                //console.log("getUserCurrentRank",getUserCurrentRank)
                const getRank = getUserCurrentRank.find(item => {
                    return item.userid.toString() == req.user._id.toString();
                });
                //console.log("getrank",getRank)
                


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
                //     //sahil show team
                //     //console.log("cap_and_vicecap",cap_and_vicecap,"userid",req.user._id,"challanges?.challangeid?.toString()",challanges?.challangeid?.toString())
                //     tmpObj["jointeamarray"]=[]
                //     if(cap_and_vicecap.length>0){
                //     for(let findcapandvicecap of cap_and_vicecap){

                //         //console.log("findcapandvicecap?.challnegeid?.toString()",findcapandvicecap)
                //         if(findcapandvicecap?.challengeid?.toString()==challanges?.matchchallengeid?.toString())
                //         {if(findcapandvicecap?.result[0]?.result2[0]?._id.toString()==findcapandvicecap?.captain?.toString())
                //             {//console.log("findcapandvicecap?.result[0]?.result2[0]",findcapandvicecap?.result[0]?.result2[0]._id)
                //                 tmpObj["jointeamarray"].push({"_id":findcapandvicecap?.result[0]?._id,"captain":findcapandvicecap?.result[0]?.result2[0].name,"vicecaptain":findcapandvicecap?.result[0]?.result2[1].name,"teamnumber":findcapandvicecap?.result[0]?.teamnumber})
                //             //tmpObj["vicecaptain"]=findcapandvicecap?.result[0]?.result2[1]?.name


                //             }
                //             else
                //             {//console.log("findcapandvicecap?.result[0]?.result2[0]",findcapandvicecap?.result[0]?.result2[0]._id)
                //                 tmpObj["jointeamarray"].push({"_id":findcapandvicecap?.result[0]?._id,"captain":findcapandvicecap?.result[0]?.result2[1].name,"vicecaptain":findcapandvicecap?.result[0]?.result2[0].name,"teamnumber":findcapandvicecap?.result[0]?.teamnumber})
                //                 //tmpObj["vicecaptain"]=findcapandvicecap?.result[0]?.result2[0]?.name

                //             }       
                //         }
                //     }
                // }
                //     //sahil show team end

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
                const total_teams = await JoinTeamModel.countDocuments({ matchkey: req.query.matchkey, userid: req.user._id, });
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

    /**
     * @function getUserRank
     * @description Find rank for user
     * @param { rankArray }
     * @author 
     */
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

    /**
     * @function myLeaderboard
     * @description Get Contest LeaderBard
     * @param { matchkey }
     * @author 
     */
    async myLeaderboard(req) {
        try {
            const { matchchallengeid, matchkey } = req.query;
            const aggPipe = [];
            // aggPipe.push({
            //     $match: {
            //         matchkey: mongoose.Types.ObjectId(matchkey),
            //         challengeid: mongoose.Types.ObjectId(matchchallengeid),
            //     },
            // });
            // aggPipe.push({
            //     $lookup: {
            //         from: 'users',
            //         localField: 'userid',
            //         foreignField: '_id',
            //         as: 'userdata',
            //     },
            // });
            // aggPipe.push({
            //     $lookup: {
            //         from: 'jointeams',
            //         localField: 'teamid',
            //         foreignField: '_id',
            //         as: 'jointeamdata',
            //     },
            // });
            // aggPipe.push({
            //     $unwind: {
            //         path: '$userdata',
            //     },
            // });
            // aggPipe.push({
            //     $unwind: {
            //         path: '$jointeamdata',
            //         preserveNullAndEmptyArrays: true
            //     },
            // });
            // aggPipe.push({
            //     $addFields: {
            //         usernumber: {
            //             $cond: {
            //                 if: { $eq: ['$userid', mongoose.Types.ObjectId(req.user._id)] },
            //                 then: 1,
            //                 else: 0,
            //             },
            //         },
            //         image: {
            //             $cond: {
            //                 if: { $and: [{ $ne: ['$userdata.image', null] }, { $ne: ['$userdata.image', ''] }] },
            //                 then: '$userdata.image',
            //                 else: `${constant.BASE_URL}default_profile.png`,
            //             },
            //         },
            //     },
            // });
            // aggPipe.push({
            //     $sort: {
            //         usernumber: -1,
            //         userid: -1,
            //         'jointeamdata.teamnumber': 1,
            //     },
            // });
            // aggPipe.push({
            //     $project: {
            //         joinleaugeid: '$_id',
            //         _id: 0,
            //         joinTeamNumber: { $ifNull: ['$teamnumber', 0] },
            //         jointeamid: { $ifNull: ['$teamid', ''] },
            //         userid: { $ifNull: ['$userid', ''] },
            //         team: { $ifNull: ['$userdata.team', ''] },
            //         image: { $ifNull: ['$image', `${constant.BASE_URL}user.png`] },
            //         teamnumber: { $ifNull: ['$jointeamdata.teamnumber', 0] },
            //         //teamnumber1:{ $ifNull: [{ $arrayElemAt: [{ $ifNull: ['$jointeamdata.teamnumber', 0] }, 0] },0]},
            //         usernumber: 1,
            //     },
            // });
            let sortarray = [];
            const joinedleaugeA = await JoinLeaugeModel.aggregate([
                {
                    '$match': {
                        'matchkey': mongoose.Types.ObjectId(matchkey),
                        'challengeid': mongoose.Types.ObjectId(matchchallengeid)
                    }
                }, {
                    '$lookup': {
                        'from': 'users',
                        'localField': 'userid',
                        'foreignField': '_id',
                        'as': 'userdata'
                    }
                }, {
                    '$lookup': {
                        'from': 'jointeams',
                        'localField': 'teamid',
                        'foreignField': '_id',
                        'as': 'jointeamdata'
                    }
                }, {
                    '$unwind': {
                        'path': '$userdata'
                    }
                }, {
                    '$unwind': {
                        'path': '$jointeamdata',
                        'preserveNullAndEmptyArrays': true
                    }
                }, {
                    '$addFields': {
                        'usernumber': {
                            '$cond': {
                                'if': {
                                    '$eq': [
                                        '$userid', mongoose.Types.ObjectId(req.user._id)
                                    ]
                                },
                                'then': 1,
                                'else': 0
                            }
                        },
                        'image': {
                            '$cond': {
                                'if': {
                                    '$and': [
                                        {
                                            '$ne': [
                                                '$userdata.image', null
                                            ]
                                        }, {
                                            '$ne': [
                                                '$userdata.image', ''
                                            ]
                                        }
                                    ]
                                },
                                'then': '$userdata.image',
                                'else': 'https://admin.mygames11.com/default_profile.png'
                            }
                        }
                    }
                }, {
                    '$match': {
                        'userid': mongoose.Types.ObjectId(req.user._id)
                    }
                }, {
                    '$sort': {
                        'usernumber': -1,
                        'userid': -1,
                        'jointeamdata.teamnumber': 1
                    }
                }, {
                    '$project': {
                        'joinleaugeid': '$_id',
                        '_id': 0,
                        'joinTeamNumber': {
                            '$ifNull': [
                                '$teamnumber', 0
                            ]
                        },
                        'jointeamid': {
                            '$ifNull': [
                                '$teamid', ''
                            ]
                        },
                        'userid': {
                            '$ifNull': [
                                '$userid', ''
                            ]
                        },
                        'team': {
                            '$ifNull': [
                                '$userdata.team', ''
                            ]
                        },
                        'image': {
                            '$ifNull': [
                                '$image', 'https://admin.mygames11.com/user.png'
                            ]
                        },
                        'teamnumber': {
                            '$ifNull': [
                                '$jointeamdata.teamnumber', 0
                            ]
                        },
                        'usernumber': 1
                    }
                }
            ]);
            const joinedleaugeB = await JoinLeaugeModel.aggregate([
                {
                    '$match': {
                        'matchkey': mongoose.Types.ObjectId(matchkey),
                        'challengeid': mongoose.Types.ObjectId(matchchallengeid)
                    }
                }, {
                    '$lookup': {
                        'from': 'users',
                        'localField': 'userid',
                        'foreignField': '_id',
                        'as': 'userdata'
                    }
                }, {
                    '$lookup': {
                        'from': 'jointeams',
                        'localField': 'teamid',
                        'foreignField': '_id',
                        'as': 'jointeamdata'
                    }
                }, {
                    '$unwind': {
                        'path': '$userdata'
                    }
                }, {
                    '$unwind': {
                        'path': '$jointeamdata',
                        'preserveNullAndEmptyArrays': true
                    }
                }, {
                    '$addFields': {
                        'usernumber': {
                            '$cond': {
                                'if': {
                                    '$eq': [
                                        '$userid', mongoose.Types.ObjectId(req.user._id)
                                    ]
                                },
                                'then': 1,
                                'else': 0
                            }
                        },
                        'image': {
                            '$cond': {
                                'if': {
                                    '$and': [
                                        {
                                            '$ne': [
                                                '$userdata.image', null
                                            ]
                                        }, {
                                            '$ne': [
                                                '$userdata.image', ''
                                            ]
                                        }
                                    ]
                                },
                                'then': '$userdata.image',
                                'else': 'https://admin.mygames11.com/default_profile.png'
                            }
                        }
                    }
                }, {
                    '$match': {
                        'userid': {
                            '$ne': mongoose.Types.ObjectId(req.user._id)
                        }
                    }
                }, {
                    '$sort': {
                        'usernumber': -1,
                        'userid': -1,
                        'jointeamdata.teamnumber': 1
                    }
                }, {
                    '$project': {
                        'joinleaugeid': '$_id',
                        '_id': 0,
                        'joinTeamNumber': {
                            '$ifNull': [
                                '$teamnumber', 0
                            ]
                        },
                        'jointeamid': {
                            '$ifNull': [
                                '$teamid', ''
                            ]
                        },
                        'userid': {
                            '$ifNull': [
                                '$userid', ''
                            ]
                        },
                        'team': {
                            '$ifNull': [
                                '$userdata.team', ''
                            ]
                        },
                        'image': {
                            '$ifNull': [
                                '$image', 'https://admin.mygames11.com/user.png'
                            ]
                        },
                        'teamnumber': {
                            '$ifNull': [
                                '$jointeamdata.teamnumber', 0
                            ]
                        },
                        'usernumber': 1
                    }
                }, {
                    '$limit': 200
                }
            ]);
            const joinedleauge = joinedleaugeA.concat(joinedleaugeB);
            if (joinedleauge.length > 0) {
                let teamNum = [];
                let teamnumber11 = 1;
                for (let joinUser of joinedleauge) {
                    if (joinUser.teamnumber == 0) {
                        joinUser.teamnumber = joinUser.joinTeamNumber;
                        // if(teamNum.includes((joinUser.userid).toString())){
                        //     teamnumber11+=1;
                        // }else{
                        //     teamNum.push((joinUser.userid).toString());
                        //    teamnumber11=1;
                        // }
                        // joinUser.teamnumber= teamnumber11;
                    }
                }
            } else {
                return { message: 'Contest LeaderBard Not Found', status: false, data: [] };
            }
            if (joinedleauge.length == 0) return { message: 'Contest LeaderBard Not Found', status: false, data: [] };
            //sahilanaylisisstart
            // console.log("req.user._id",req.user._id)
            // joinedleauge.forEach(item=>{
            //     if(item.userid==req.user._id)
            //     {sortarray.push(item)

            //     }
            // })
            // joinedleauge.forEach(item=>{
            //     if(item.userid!=req.user._id)
            //     {sortarray.push(item)

            //     }
            // })


            // sahilanaylysisend
            return {
                message: "Contest LeaderBard",
                status: true,
                data: joinedleauge,

            }
        } catch (error) {
            throw error;
        }
    };

    /**
     * @function updateJoinedusers
     * @description Is Running contest for join Querys
     * @param { matchkey }
     * @author 
     */
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

    /**
     * @function switchTeams
     * @description Contest Join replace with annother team
     * @param { matchkey,switchteam(joinleaugeid,newjointeamid) }
     * @author 
     */
    async switchTeams(req) {
        try {

            const { matchkey, switchteam } = req.body;
            //sahil redis
            // let keyname=`switchTeams-${matchkey}`
            // let redisdata=await Redis.getkeydata(keyname);
            // let match;
            // if(redisdata)
            // {
            //     match=redisdata;
            // }
            // else
            // {
            //     match = await listMatchesModel.findOne({ _id: mongoose.Types.ObjectId(matchkey) });
            //     let redisdata=Redis.setkeydata(keyname,match,60*60*4);
            // }

            //sahil redis end
             const match = listMatchesModel.findOne({ _id: mongoose.Types.ObjectId(matchkey) });
            if (!match) return { message: 'Match Not Found', status: false, data: {} };
            const matchTime = await matchServices.getMatchTime(match.start_date);
            if (matchTime === false) return { message: 'Match has been closed.', status: false, data: {} };
            let newData = JSON.parse(switchteam)

            for (let key of newData) {

                let updateData = await JoinLeaugeModel.findOneAndUpdate({ _id: key.joinleaugeid }, { teamid: key.newjointeamid }, { new: true });

            }
            return { message: 'Team Updated ', status: true, data: {} }

            // let i = 0;
            // for (let changeTeam of switchteam) {
            //     await JoinLeaugeModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(changeTeam.joinleaugeid) }, { teamid: mongoose.Types.ObjectId(changeTeam.newjointeamid) }, { new: true });
            //     i++;
            //     if (switchteam.length == i) return { message: 'Team Updated ', status: true, data: {} };
            // }
        } catch (error) {
            throw error;
        }
    }

    /**
     * @function getUsableBalance
     * @description Get amount to be used
     * @param { matchchallengeid }
     * @author 
     */
    async getUsableBalance(req) {
        try {
            const { matchchallengeid } = req.query;
            const matchchallengesData = await matchchallengesModel.findOne({ _id: mongoose.Types.ObjectId(matchchallengeid) });
            req.query.matchkey = matchchallengesData.matchkey;
            await this.updateJoinedusers(req);
            if (!matchchallengesData) {
                return {
                    message: 'Invalid details',
                    status: false,
                    data: {}
                }
            }
            const user = await userModel.findOne({ _id: req.user._id }, { userbalance: 1 });
            const bonus = parseFloat(user.userbalance.bonus.toFixed(2)) || 0;
            const balance = parseFloat(user.userbalance.balance.toFixed(2)) || 0;
            const winning = parseFloat(user.userbalance.winning.toFixed(2)) || 0;
            const totalBalance = bonus + balance + winning;
            const findUsableBalance = balance + winning;
            let findBonusAmount = 0,
                usedBonus = 0;
            if (matchchallengesData.is_bonus == 1 && matchchallengesData.bonus_percentage) findBonusAmount = (matchchallengesData.bonus_percentage / 100) * matchchallengesData.entryfee;
            if (bonus >= findBonusAmount) usedBonus = findBonusAmount;
            else usedBonus = bonus;
            return {
                message: 'Get amount to be used',
                status: true,
                data: {
                    usablebalance: findUsableBalance.toFixed(2).toString(),
                    usertotalbalance: totalBalance.toFixed(2).toString(),
                    entryfee: matchchallengesData.entryfee.toFixed(2).toString(),
                    bonus: usedBonus.toFixed(2).toString(),
                }
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * @function createPrivateContest
     * @description create private Contest
     * @param { matchkey, maximum_user, win_amount, entryfee, multi_entry, contestName }
     * @author 
     */
    async createPrivateContest(req) {
        try {
            const { matchkey, maximum_user, win_amount, entryfee, multi_entry, contestName } = req.body;
            if (maximum_user < 2) {
                return {
                    message: 'Invalid league details. You cannot create a league with less then two members.',
                    status: false,
                    data: {},
                };
            }
            // const challengeid = new mongoose.Types.ObjectId();
            let obj = {
                fantasy_type: 'Cricket',
                matchkey: mongoose.Types.ObjectId(matchkey),
                entryfee: Number(entryfee),
                win_amount: Number(win_amount),
                maximum_user: Number(maximum_user),
                minimum_user: 2,
                status: 'pending',
                contest_name: contestName || '',
                created_by: mongoose.Types.ObjectId(req.user._id),
                joinedusers: 0,
                bonus_type: '',
                pdf_created: 0,
                contest_type: 'Amount',
                megatype: 'normal',
                winning_percentage: 0,
                is_bonus: 0,
                bonus_percentage: 0,
                pricecard_type: 'Amount',
                confirmed_challenge: 0,
                is_running: 0,
                multi_entry: Number(multi_entry),
                is_private: 1,
                team_limit: 11,
                c_type: '',
                contest_cat: null,
                challenge_id: null,
                matchpricecards: [],
            }
            let challengeid = await matchchallengesModel.create(obj);
            if (challengeid) {
                return {
                    message: 'Challenge successfully Created.',
                    status: true,
                    data: {
                        matchchallengeid: challengeid._id,
                        entryfee: entryfee,
                        multi_entry: multi_entry
                    }
                };
            } else {
                return {
                    message: 'Error Occurred While Creating Challenge.',
                    status: false,
                    data: {}
                };
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * @function joinContestByCode
     * @description Contest Join By ContestCode
     * @param { getcode, matchkey }
     * @author 
     */
    async joinContestByCode(req) {
        try {
            console.log("--------------------------------------JOIN-CONTEST-BY-CODE-------------------------------------------------")
            const { getcode, matchkey } = req.body;
            // const tmpObj = {};
            let matchchallengeid, findReferCode;
            const code = getcode.split('-');
            if (code[0] == 'CC$') {
                findReferCode = await JoinedReferModel.findOne({ matchkey: matchkey, refercode: getcode });
                if (!findReferCode) return { message: 'Invalid code', status: false, data: {} };
                matchchallengeid = findReferCode.challengeid;
            } else {
                findReferCode = await JoinLeaugeModel.findOne({ matchkey: matchkey, refercode: getcode });
                if (!findReferCode) return { message: 'Invalid code', status: false, data: {} };
                matchchallengeid = findReferCode.challengeid;
            }

            const matchchallenge = await matchchallengesModel.findOne({ _id: mongoose.Types.ObjectId(matchchallengeid) });
            if (!matchchallenge) {
                return { message: 'Invalid code', status: false, data: {} };
            }
            const joinLeagues = await JoinLeaugeModel.find({
                userid: req.user._id,
                challengeid: matchchallenge._id,
            }).countDocuments();
            let teamLimit;
            if (matchchallenge.multi_entry == 0) {
                teamLimit = 1;
            } else {
                teamLimit = matchchallenge.team_limit;
            }
            if (matchchallenge.multi_entry == 1) {
                if (joinLeagues == matchchallenge.team_limit) {
                    return { message: 'Already used', status: false, data: { multi_entry: 1 } };
                } else if (matchchallenge.status == 'closed') {
                    return { message: 'Challenge closed', status: false, data: { matchchallengeid: '', entryfee: '', multi_entry: 1, team_limit: teamLimit } };
                } else {
                    return { message: 'Challenge opened', status: true, data: { matchchallengeid: matchchallenge._id, entryfee: matchchallenge.entryfee, multi_entry: 1, team_limit: teamLimit } };
                }
            } else {
                if (joinLeagues != 0) {
                    return { message: 'Already used', status: false, data: { multi_entry: 0 } };
                } else if (matchchallenge.status == 'closed') {
                    return { message: 'Challenge closed', status: false, data: { matchchallengeid: '', entryfee: '', multi_entry: 0, team_limit: teamLimit } };
                } else {
                    return { message: 'Challenge opened', status: true, data: { matchchallengeid: matchchallenge._id, entryfee: matchchallenge.entryfee, multi_entry: 0, team_limit: teamLimit } };
                }
            }
        } catch (error) {
            throw error;
        }
    }
}
module.exports = new contestServices();