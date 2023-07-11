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
const {
    quiz
} = require('../../admin/services/matchServices');


class quizfantasyServices {
    constructor() {
        return {
            getQuiz: this.getQuiz.bind(this),
            getSingleQuiz: this.getSingleQuiz.bind(this),
            quizGiveAnswer: this.quizGiveAnswer.bind(this),
            quizgetUsableBalance: this.quizgetUsableBalance.bind(this),
            joinQuiz: this.joinQuiz.bind(this),
            quizrefundprocess: this.quizrefundprocess.bind(this),
            getMatchTime: this.getMatchTime.bind(this),
            quizfindJoinLeaugeExist: this.quizfindJoinLeaugeExist.bind(this),
            quizfindUsableBonusMoney: this.quizfindUsableBonusMoney.bind(this),
            quizfindUsableBalanceMoney: this.quizfindUsableBalanceMoney.bind(this),
            quizfindUsableWinningMoney: this.quizfindUsableWinningMoney.bind(this)
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

    async getQuiz(req) {
        try {
            let {
                matchkey
            } = req.query;
            let userId = req.user._id
            let pipeline = []
            pipeline.push({
                '$addFields': {
                    'options': {
                        '$objectToArray': {
                            '$arrayElemAt': [
                                '$options', 0
                            ]
                        }
                    }
                }
            }, {
                '$addFields': {
                    'options': {
                        '$map': {
                            'input': '$options',
                            'as': 'option',
                            'in': {
                                'answer': '$$option.v'
                            }
                        }
                    }
                }
            }, {
                '$match': {
                    'matchkey': new mongoose.Types.ObjectId(matchkey)
                }
            }, {
                $lookup: {
                    from: "quizjoinedleauges",
                    let: {
                        matchkey: "$matchkey",
                        quizId: "$_id",
                        userid: new mongoose.Types.ObjectId(userId)
                    },
                    pipeline: [{
                        $match: {
                            $expr: {
                                $and: [{
                                        $eq: [
                                            "$matchkey",
                                            "$$matchkey",
                                        ],
                                    },
                                    {
                                        $eq: ["$quizId", "$$quizId"],
                                    },
                                    {
                                        $eq: ["$userid", "$$userid"],
                                    },
                                ],
                            },
                        },
                    }, ],
                    as: "quizjoin",
                },
            }, {
                '$addFields': {
                    'is_selected': {
                        '$cond': {
                            'if': {
                                '$eq': [{
                                    '$size': '$quizjoin'
                                }, 1]
                            },
                            'then': true,
                            'else': false
                        }
                    },
                    'image': {
                        '$concat': [
                            `${process.env.BASE_URL}`, '$image'
                        ]
                    }
                }
            }, {
                '$lookup': {
                    'from': 'quizjoinedleauges',
                    'let': {
                        'matchkey': '$matchkey',
                        'id': '$_id'
                    },
                    'pipeline': [{
                        '$match': {
                            '$expr': {
                                '$eq': [
                                    '$matchkey', '$$matchkey'
                                ],
                                '$eq': [
                                    '$quizId', '$$id'
                                ]
                            }
                        }
                    }],
                    'as': 'userArray'
                }
            }, {
                '$addFields': {
                    'userIdArray': {
                        '$map': {
                            'input': '$userArray',
                            'as': 'item',
                            'in': '$$item.userid'
                        }
                    }
                }
            }, {
                '$lookup': {
                    'from': 'users',
                    'let': {
                        'id': '$userIdArray'
                    },
                    'pipeline': [{
                        '$match': {
                            '$expr': {
                                '$in': [
                                    '$_id', '$$id'
                                ]
                            }
                        }
                    }, {
                        '$project': {
                            'image': 1
                        }
                    }],
                    'as': 'userAnswer'
                }
            }, {
                '$project': {
                    'userArray': 0,
                    'userIdArray': 0,
                    'answer': 0,
                    'bonus_percentage': 0,
                    'is_bonus': 0,
                    'quiz_status': 0,
                    'quizjoin': 0
                }
            })
            let data = await quizModel.aggregate(pipeline)
            if (data.length === 0) {
                return {
                    status: false,
                    message: "Quiz  not Found",
                    data: []
                }
            }
            return {
                status: true,
                message: "Quiz fatch Successfully",
                data: data
            }
        } catch (error) {
            console.log('error', error);
            throw error;
        }
    }

    async getSingleQuiz(req) {
        try {
            let {
                quizId,
                matchkey
            } = req.query
            let data = await quizModel.findOne({
                _id: quizId,
                matchkey
            }, {
                answer: 0
            })
            if (!data) {
                return {
                    status: false,
                    message: "Match Not Found",
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
                            type: ' Quiz Refund',
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


    async quizfindJoinLeaugeExist(matchkey, userId, quizAnswer, quiz) {
        if (!quiz || quiz == null || quiz == undefined) return 4;

        const quizjoinedLeauges = await QuizJoinLeaugeModel.find({
            matchkey: matchkey,
            quizId: quiz._id,
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

    async quizfindUsableBonusMoney(quiz, bonus, winning, balance) {
        if (quiz.is_bonus != 1)
            return {
                bonus: bonus,
                cons_bonus: 0,
                reminingfee: quiz.entryfee
            };
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

    async quizfindUsableBalanceMoney(resultForBonus, balance) {
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

    async quizfindUsableWinningMoney(resultForBalance, winning) {
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

    async quizgetUsableBalance(req) {
        try {
            const {
                quizId
            } = req.query;
            if (quizId === undefined) {
                return {
                    message: "Quiz Not Found",
                    status: false,
                    data: {}
                }
            }
            const quizData = await quizModel.findOne({
                _id: mongoose.Types.ObjectId(quizId)
            });
            if (!quizData) {
                return {
                    message: 'Quiz not found',
                    status: false,
                    data: {}
                }
            }
            req.query.matchkey = quizData.matchkey;
            // await this.updateJoinedusers(req);

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

    async joinQuiz(req) {
        try {
            let {
                quizId,
                quizAnswer
            } = req.body
            let totalchallenges = 0,
                totalmatches = 0,
                totalseries = 0,
                joinedMatch = 0,
                joinedSeries = 0,
                aggpipe = [];

            aggpipe.push({
                $match: {
                    _id: mongoose.Types.ObjectId(quizId)
                }
            });

            aggpipe.push({
                $lookup: {
                    from: 'listmatches',
                    localField: 'matchkey',
                    foreignField: '_id',
                    as: 'listmatch'
                }
            });

            const quizData = await quizModel.aggregate(aggpipe);
            if (quizData.length == 0) {
                return {
                    message: 'Match Not Found',
                    success: false,
                    data: {}
                };
            }
            let listmatchId = quizData[0].listmatch[0]._id;
            let quizDataId = quizData[0]._id;
            let quiz = quizData[0];
            let seriesId = quizData[0].listmatch[0].series;
            let matchStartDate = quizData[0].listmatch[0].start_date;

            const matchTime = await matchServices.getMatchTime(matchStartDate);
            if (matchTime === false) {
                return {
                    message: 'Match has been closed, You cannot join leauge now.',
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
            
            const result = await this.quizfindJoinLeaugeExist(listmatchId, req.user._id, quizAnswer, quiz);
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
                    type: 'Quiz Joining Fee',
                    contestdetail: `${quiz.entryfee}`,
                    amount: quiz.entryfee,
                    total_available_amt: totalBalance - quiz.entryfee,
                    transaction_by: constant.TRANSACTION_BY.WALLET,
                    quizId: quizId,
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
            const resultForBonus = await this.quizfindUsableBonusMoney(
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
                    type: 'Quiz Joining Fee',
                    contestdetail: `${quiz.entryfee}`,
                    amount: quiz.entryfee,
                    total_available_amt: totalBalance - quiz.entryfee,
                    transaction_by: constant.TRANSACTION_BY.WALLET,
                    quizId: quizId,
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

            const resultForBalance = await this.quizfindUsableBalanceMoney(resultForBonus, balance - mainbal);
            const resultForWinning = await this.quizfindUsableWinningMoney(resultForBalance, winning - mainwin);
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
                    quizId: quizId,
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
                let joinedQuiz = await QuizJoinLeaugeModel.find({
                    matchkey: listmatchId,
                    userid: req.user._id
                }).limit(1).count();
                if (joinedQuiz == 0) {
                    joinedSeries = await QuizJoinLeaugeModel.find({
                        seriesid: seriesId,
                        userid: req.user._id
                    }).limit(1).count();
                }
            }
            const quizjoinedLeauges = await QuizJoinLeaugeModel.find({
                quizId: quizDataId
            }).count();
            const joinUserCount = quizjoinedLeauges + 1;
            const quizjoinLeaugeResult = await QuizJoinLeaugeModel.create({
                userid: req.user._id,
                quizId: quizDataId,
                answer: quizAnswer,
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
            const joinedLeaugesCount = await QuizJoinLeaugeModel.find({
                quizId: quizDataId,
                matchkey: listmatchId
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
            await quizModel.findOneAndUpdate({
                matchkey: listmatchId,
                _id: mongoose.Types.ObjectId(quizId)
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
                type: 'Quiz Joining Fee',
                contestdetail: `${quiz.entryfee}`,
                amount: quiz.entryfee,
                total_available_amt: totalBalance - quiz.entryfee,
                transaction_by: constant.TRANSACTION_BY.WALLET,
                quizId: quizId,
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
                message: 'Quiz Joined',
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
}
module.exports = new quizfantasyServices();