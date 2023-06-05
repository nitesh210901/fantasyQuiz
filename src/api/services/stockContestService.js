const mongoose = require('mongoose');
const moment = require('moment');
const joinStockTeamModel = require('../../models/JoinStockTeamModel');
const stockContestModel = require('../../models/stockContestModel');
const stockContestCategoryModel = require('../../models/stockContestCategory')
const joinStockLeagueModel = require('../../models/joinStockLeagueModel');
const randomstring = require("randomstring");

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
            getStockContestCategory: this.getStockContestCategory.bind(this)
        }
    }
    async listStockContest(req){
        try {
            const data = await stockContestModel.aggregate([
                [
                    {
                        '$match': {
                        'launch_status':true,
                        'isEnable': true, 
                        'isCancelled': false,
                        'start_date':{$gte:moment().format('YYYY-MM-DD HH:mm:ss')}
                      }
                    }, {
                      '$sort': {
                          'bonus_percentage': -1,
                          'confirmed_challenge':-1
                      }
                    }
                  ]
            ]);
            if(data){
                return {
                    message: 'All Contests',
                    status: true,
                    data: data
                }
            }else{
                return {
                    message: 'All Contests',
                    status: true,
                    data:{}
                }
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async stockCreateTeam(req) {
        try {

            const { matchkey, stock, teamnumber, contestId } = req.body;
            let stockArray = stock.map(item => item.stockId);

            const chkStockLimit = await stockContestModel.findById({_id:contestId},{select_team:1});
            if (stockArray.length < chkStockLimit) {
                return {
                    message: `Select atleast ${chkStockLimit} Stocks.`,
                    status: false,
                    data: {}
                };
            }

            let stockObjectIdArray = []; 
            for(let stockId of stockArray){
                stockObjectIdArray.push(mongoose.Types.ObjectId(stockId.stockId));
            }
            
            const joinlist = await joinStockTeamModel.find({ matchkey: matchkey, userid: req.user._id }).sort({ teamnumber: -1 });
            
            const duplicateData = await this.checkForDuplicateTeam(joinlist, stockArray, teamnumber);
            if (duplicateData === false) {
                return {
                    message: 'You cannot create the same team.',
                    status: false,
                    data: {}
                };
            }

            let listmatchData = await stockContestModel.findOne({ _id: mongoose.Types.ObjectId(matchkey) });
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
                matchkey: matchkey,
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
                    matchkey: matchkey,
                    userid: req.user._id,
                });
                if (joinTeam.length > 0) {
                    data['teamnumber'] = joinTeam.length + 1;
                } else {
                    data['teamnumber'] = 1;
                }
                if (data['teamnumber'] < 2) {
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

    async stockJoinContest(req, res) {
        try {
            const { stockContestId, stockTeamId } = req.body;
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
                    const result = await this.findJoinLeaugeExist(listmatchId, req.user._id, jointeamId, chkContest);
    
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
                            challengeid: chkContestid,
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
                                challengeid: chkContestid,
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
                                challengeid: chkContestid,
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
    
                        joinedMatch = await joinStockLeagueModel.find({ matchkey: listmatchId, userid: req.user._id }).limit(1).count();
                        if (joinedMatch == 0) {
                            joinedSeries = await joinStockLeagueModel.find({ seriesid: seriesId, userid: req.user._id }).limit(1).count();
                        }
                    }
                    const joinedLeauges = await joinStockLeagueModel.find({ challengeid: chkContestsDataId }).count();
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
                                challengeid: chkContestid,
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
                        challengeid: chkContestsDataId,
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
                        challengeid: chkContestsDataId,
                        teamId: jointeamId,
                        matchkey: listmatchId,
                        user_team: user.team,
                        teamnumber: jointeamsData.teamnumber,
                        joinId: joinLeaugeResult._id
                    });
                    const joinedLeaugesCount = await joinStockLeagueModel.find({ challengeid: chkContestsDataId }).count();
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
                        if (chkContest.contest_type == 'Amount' && joinedLeaugesCount == chkContest.maximum_user && chkContest.is_running != 1) {
                            // console.log(`---------------------8TH IF--------${chkContest.is_running}---------`);
                            await chkContestsModel.findOneAndUpdate({ matchkey: listmatchId, _id: mongoose.Types.ObjectId(chkContestid) }, {
                                status: 'closed',
                                joinedusers: joinedLeaugesCount,
                            }, { new: true });
                        } else {
                            // console.log(`---------------------8TH IF/ELSE--------${chkContest.is_running}---------`);
                            const gg = await chkContestsModel.findOneAndUpdate({ matchkey: listmatchId, _id: mongoose.Types.ObjectId(chkContestid) }, {
                                status: 'opened',
                                joinedusers: joinedLeaugesCount,
                            }, { new: true });
                        }
                    } else
                        await chkContestsModel.findOneAndUpdate({ matchkey: listmatchId, _id: mongoose.Types.ObjectId(chkContestid) }, {
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
                            contestdetail: `${chkContest.entryfee}-${count}`,
                            amount: chkContest.entryfee * count,
                            total_available_amt: totalBalance - chkContest.entryfee * count,
                            transaction_by: constant.TRANSACTION_BY.WALLET,
                            challengeid: chkContestid,
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

    async getStockContestCategory(req){
        try {
            const data = await stockContestCategoryModel.find()
            if(data.length>0){
                return {
                    message: 'All Stock Contests Categories',
                    status: true,
                    data: data
                }
            }else{
                return {
                    message: 'Stock Contests Categories not found',
                    status: false,
                    data:{}
                }
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
}
module.exports = new overfantasyServices();