const mongoose = require('mongoose');
const moment = require('moment');
const joinStockTeamModel = require('../../models/JoinStockTeamModel');
const stockContestModel = require('../../models/stockContestModel');
const stockContestCategoryModel = require('../../models/stockContestCategory')
const joinStockLeagueModel = require('../../models/joinStockLeagueModel');
const TransactionModel = require('../../models/transactionModel');
const userModel = require('../../models/userModel');
const constant = require('../../config/const_credential');
const randomstring = require("randomstring");
const stockLeaderBoardModel = require('../../models/stockLeaderboardModel');

class overfantasyServices {
    constructor() {
        return {
            stockCreateTeam: this.stockCreateTeam.bind(this),
            checkForDuplicateTeam: this.checkForDuplicateTeam.bind(this),
            findArrayIntersection: this.findArrayIntersection.bind(this),
            getMatchTime: this.getMatchTime.bind(this),
            listStockContest: this.listStockContest.bind(this),
            stockJoinContest: this.stockJoinContest.bind(this),
            findUsableBonusMoney: this.findUsableBonusMoney.bind(this),
            getStockContestCategory: this.getStockContestCategory.bind(this),
            getJoinedContestDetails: this.getJoinedContestDetails.bind(this),
        }
    }
    

    async listStockContest(req) {
        try {
            const { stock_contest_cat } = req.body;
            let matchpipe = [];
            let date = moment().format('YYYY-MM-DD HH:mm:ss');
            console.log(`date`, date);
            let EndDate = moment().add(25, 'days').format('YYYY-MM-DD HH:mm:ss');
            matchpipe.push({
                $match: { fantasy_type: 'stock' }
            });
            matchpipe.push({
                $match: {
                    $and: [{ status: 'notstarted' }, { "stock_contest_cat": stock_contest_cat }, { launch_status: 'launched' }, { start_date: { $gt: date } }, { start_date: { $lt: EndDate } }],
                    final_status: { $nin: ['IsCanceled', 'IsAbandoned'] }
                }
            });

            matchpipe.push({
                $sort: {
                    start_date: 1,
                },
            });
            
            matchpipe.push({
                $sort: {
                    match_order: 1
                }
            });


            const result = await stockContestModel.aggregate(matchpipe);
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
    async stockCreateTeam(req) {
        try {
            const { matchkey, stock, teamnumber, contestId } = req.body;
            let stockArray = stock.map(item => item.stockId);

            const chkStockLimit = await stockContestModel.findById({_id:contestId},{select_team:1});

            if (stockArray.length > chkStockLimit.select_team) {
                return {
                    message: `Select Under ${chkStockLimit.select_team} Stocks Limit.`,
                    status: false,
                    data: {}
                };
            }

            let stockObjectIdArray = []; 
            for(let stockId of stockArray){
                stockObjectIdArray.push(mongoose.Types.ObjectId(stockId.stockId));
            }
            
            const joinlist = await joinStockTeamModel.find({ contestId: contestId, userid: req.user._id }).sort({ teamnumber: -1 });
            
            const duplicateData = await this.checkForDuplicateTeam(joinlist, stockArray, teamnumber);
            if (duplicateData === false) {
                return {
                    message: 'You cannot create the same team.',
                    status: false,
                    data: {}
                };
            }

            let listmatchData = await stockContestModel.findOne({ _id: mongoose.Types.ObjectId(contestId) });
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
            data['stock'] = stock;
            data['type'] = "stock";
            const joinTeam = await joinStockTeamModel.findOne({
                contestId: contestId,
                teamnumber: parseInt(teamnumber),
                userid: req.user._id,
            }).sort({ teamnumber: -1 });
            if (joinTeam) {
                data["user_type"] = 0;
                data['created_at'] = joinTeam.createdAt;
                const updateTeam = await joinStockTeamModel.findOneAndUpdate({ _id: joinTeam._id }, data, {
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
                const joinTeam = await joinStockTeamModel.find({
                    contestId: contestId,
                    userid: req.user._id,
                });
                if (joinTeam.length > 0) {
                    data['teamnumber'] = joinTeam.length + 1;
                } else {
                    data['teamnumber'] = 1;
                }
                if (data['teamnumber'] < 5) {
                    data["user_type"] = 0;
                    let jointeamData = await joinStockTeamModel.create(data);
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

    async checkForDuplicateTeam(joinlist, quizArray, teamnumber) {
        console.log('--------------',joinlist)
        if (joinlist.length == 0) return true;
        for await (const list of joinlist) {
            const quizCount = await this.findArrayIntersection(quizArray, list.stock);
            if (quizCount.length == quizArray.length) return false;
        }
        return true;
    }
    

    async findArrayIntersection(quizArray, previousQuiz) {
        const c = [];
        let j = 0,
            i = 0;
        let data = previousQuiz.map((value) => value.stockId.toString())
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

    async stockJoinContest(req, res) {
        try {
            const { stockContestId, stockTeamId } = req.body;
            let totalchallenges = 0,
            totalmatches = 0,
            totalseries = 0,
            joinedMatch = 0;
            
            const chkContest = await stockContestModel.findOne({_id:stockContestId, isCancelled:false, isEnable:true, launch_status:true, final_status: 'pending' });
            if(!chkContest){
                return {
                    message: 'Contest Not Found Or May Be Cancelled',
                    status: false,
                    data: {}
                }
            }else{
                let contestStartDate = chkContest.start_date;
                const matchTime = await this.getMatchTime(contestStartDate);
                if (matchTime === false) {
                    return {
                        message: 'Contest has been closed, You cannot join leauge now.', 
                        status: false,
                        data: {}
                    }
                }

                const stockTeamIds = stockTeamId.split(',');

                const jointeamsCount = await joinStockTeamModel.find({ _id: { $in: stockTeamIds } }).countDocuments();
                if (stockTeamIds.length != jointeamsCount) return { message: 'Invalid Team', status: false, data: {} }

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
                for (const jointeamId of stockTeamIds) {
                    const jointeamsData = await joinStockTeamModel.findOne({ _id: jointeamId })
                    // console.log(`-------------IN ${i} LOOP--------------------`);
                    i++;
                    const result = await this.findJoinLeaugeExist(stockContestId, req.user._id, jointeamId, chkContest);
    
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
                            contestdetail: `${chkContest.entryfee}-${count}`,
                            amount: chkContest.entryfee * count,
                            total_available_amt: totalBalance - chkContest.entryfee * count,
                            transaction_by: constant.TRANSACTION_BY.WALLET,
                            challengeid: chkContest._id,
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
                        chkContest,
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
                                contestdetail: `${chkContest.entryfee}-${count}`,
                                amount: chkContest.entryfee * count,
                                total_available_amt: totalBalance - chkContest.entryfee * count,
                                transaction_by: constant.TRANSACTION_BY.WALLET,
                                challengeid: chkContest._id,
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
                                contestdetail: `${chkContest.entryfee}-${count}`,
                                amount: chkContest.entryfee * count,
                                total_available_amt: totalBalance - chkContest.entryfee * count,
                                transaction_by: constant.TRANSACTION_BY.WALLET,
                                challengeid: chkContest._id,
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
                        joinedMatch = await joinStockLeagueModel.find({ contestId: stockContestId, userid: req.user._id }).limit(1).count();
                    }
                    const joinedLeauges = await joinStockLeagueModel.find({ contestId:  stockContestId}).count();
                    const joinUserCount = joinedLeauges + 1;
                   
                    if (chkContest.contest_type == 'Amount' && joinUserCount > chkContest.maximum_user) {
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
                                contestdetail: `${chkContest.entryfee}-${count}`,
                                amount: chkContest.entryfee * count,
                                total_available_amt: totalBalance - chkContest.entryfee * count,
                                transaction_by: constant.TRANSACTION_BY.WALLET,
                                challengeid: chkContest._id,
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
                    const joinLeaugeResult = await joinStockLeagueModel.create({
                        userid: req.user._id,
                        teamid: jointeamId,
                        contestId: stockContestId,
                        transaction_id: tranid,
                        refercode: referCode,
                        leaugestransaction: {
                            user_id: req.user._id,
                            bonus: resultForBonus.cons_bonus,
                            balance: resultForBalance.cons_amount,
                            winning: resultForWinning.cons_win,
                        },
                    });
                    await stockLeaderBoardModel.create({
                        userId: req.user._id,
                        teamId: jointeamId,
                        contestId: stockContestId,
                        user_team: user.team,
                        teamnumber: jointeamsData.teamnumber,
                        joinId: joinLeaugeResult._id
                    });
                    const joinedLeaugesCount = await joinStockLeagueModel.find({ contestId: stockContestId }).count();
                    if (result == 1) {
                        totalchallenges = 1;
                        if (joinedMatch == 0) {
                            totalmatches = 1;
                        }
                    }
                    count++;
    
                    if (joinLeaugeResult._id) {
                        mainbal = mainbal + resultForBalance.cons_amount;
                        mainbonus = mainbonus + resultForBonus.cons_bonus;
                        mainwin = mainwin + resultForWinning.cons_win;
                        if (chkContest.contest_type == 'Amount' && joinedLeaugesCount == chkContest.maximum_user && chkContest.is_running != 1) {
                            // console.log(`---------------------8TH IF--------${chkContest.is_running}---------`);
                            await stockContestModel.findOneAndUpdate({ contestId: stockContestId, _id: mongoose.Types.ObjectId(chkContest._id) }, {
                                status: 'closed',
                                joinedusers: joinedLeaugesCount,
                            }, { new: true });
                        } else {
                            // console.log(`---------------------8TH IF/ELSE--------${chkContest.is_running}---------`);
                            const gg = await stockContestModel.findOneAndUpdate({ contestId: stockContestId, _id: mongoose.Types.ObjectId(chkContest._id) }, {
                                status: 'opened',
                                joinedusers: joinedLeaugesCount,
                            }, { new: true });
                        }
                    } else
                        await stockContestModel.findOneAndUpdate({ contestId: stockContestId, _id: mongoose.Types.ObjectId(chkContest._id) }, {
                            status: 'opened',
                            joinedusers: joinedLeaugesCount,
                        }, { new: true });
                        console.log('======================',i,jointeamId.length);
                    if (i == stockTeamIds.length) {
                        console.log(`---------------------9TH IF--------${i}---------`);
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
                            contestdetail: `${chkContest.entryfee}-${count}`,
                            amount: chkContest.entryfee * count,
                            total_available_amt: totalBalance - chkContest.entryfee * count,
                            transaction_by: constant.TRANSACTION_BY.WALLET,
                            challengeid: chkContest._id,
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
            }

        } catch (error) {
            console.log(error);
            throw error;
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

    async getStockContestCategory(req) {
        try {
            const data = await stockContestCategoryModel.find()
            if (data.length > 0) {
                return {
                    message: 'All Stock Contests Categories',
                    status: true,
                    data: data
                }
            } else {
                return {
                    message: 'Stock Contests Categories not found',
                    status: false,
                    data: {}
                }
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async findJoinLeaugeExist(matchkey, userId, teamId, challengeDetails) {
        if (!challengeDetails || challengeDetails == null || challengeDetails == undefined) return 4;

        const joinedLeauges = await joinStockLeagueModel.find({
            contestId: contestId,
            contestId: challengeDetails._id,
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

}
module.exports = new overfantasyServices();