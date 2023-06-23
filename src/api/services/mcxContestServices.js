const mongoose = require('mongoose');
const moment = require('moment');
const joinStockTeamModel = require('../../models/JoinStockTeamModel');
const stockContestModel = require('../../models/stockContestModel');
const stockCategoryModel = require('../../models/stockcategoryModel');
const stockContestCategoryModel = require('../../models/stockContestCategory')
const joinStockLeagueModel = require('../../models/joinStockLeagueModel');
const TransactionModel = require('../../models/transactionModel');
const userModel = require('../../models/userModel');
const constant = require('../../config/const_credential');
const randomstring = require("randomstring");
const stockLeaderBoardModel = require('../../models/stockLeaderboardModel');




class mcxfantasyServices {
    constructor() {
        return {
            stockCreateTeam: this.stockCreateTeam.bind(this),
            checkForDuplicateTeam: this.checkForDuplicateTeam.bind(this),
            findArrayIntersection: this.findArrayIntersection.bind(this),
            getMatchTime: this.getMatchTime.bind(this),
            listMCXContest: this.listMCXContest.bind(this),
            stockJoinContest: this.stockJoinContest.bind(this),
            findUsableBonusMoney: this.findUsableBonusMoney.bind(this),
            getStockContestCategory: this.getStockContestCategory.bind(this),
            // getSingleContestDetails: this.getSingleContestDetails.bind(this),
            // viewStockTeam: this.viewStockTeam.bind(this),
            completeContest: this.completeContest.bind(this),
            myContestleaderboard: this.myContestleaderboard.bind(this),
            getStockMyTeams: this.getStockMyTeams.bind(this),
            updateResultStocks: this.updateResultStocks.bind(this),
            // getJoinedContestDetails: this.getJoinedContestDetails.bind(this),
            // getMyStockTeam: this.getMyStockTeam.bind(this),
        }
    }
    

    async listMCXContest(req) {
      try {
        const { stock_contest_cat, stock_contest } = req.query;
        await this.updateJoinedusers(req)
        let matchpipe = [];
        let date = moment().format('YYYY-MM-DD HH:mm:ss');
        let EndDate = moment().add(25, 'days').format('YYYY-MM-DD HH:mm:ss');
        matchpipe.push({
          $match: { fantasy_type: stock_contest_cat }
        });
        if (stock_contest === "live") {
          matchpipe.push({
            $match: {
              $and: [{ status: 'started' }, { "stock_contest_cat": stock_contest_cat }, { launch_status: 'launched' }, { start_date: { $lt: date } } ],
              final_status: { $nin: ['IsCanceled', 'IsAbandoned'] }
            }
          });
        } else if (stock_contest === "upcoming") {
          matchpipe.push({
            $match: {
              $and: [{ status: 'notstarted' }, { "stock_contest_cat": stock_contest_cat }, { launch_status: 'launched' }, { start_date: { $gt: date } }, { start_date: { $lt: EndDate } }],
              final_status: { $nin: ['IsCanceled', 'IsAbandoned'] }
            }
          });
        } else if (stock_contest === "completed") {
          matchpipe.push({
            $match: {
              $and: [{ status: 'completed' }, { "stock_contest_cat": stock_contest_cat }, { launch_status: 'launched' }, { start_date: { $gt: date } }, { start_date: { $gt: EndDate } }],
              final_status: "winnerdeclared"
            }
          });
        }
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
        if (result.length > 0) {
          return {
            status: true,
            message: "Stock Contest Fatch Successfully",
            data: result
          }
        } else {
          return {
            status: false,
            message: "Stock Contest Not Found",
            data: []
          }
        }
        // result.sort(function (a, b) {
        //   return b.match_order
        // });
        // if (result.length > 0) return result
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

    async updateJoinedusers(req) {
      try {
          console.log("--updateJoinedusers----")
          const query = {};
          query.fantasy_type = req.query.stock_contest_cat
          query.stock_contest_cat = req.query.stock_contest_cat
          query.contest_type = 'Amount'
          query.status = 'opened'
          const matchchallengesData = await stockContestModel.find(query);
          if (matchchallengesData.length > 0) {
              for (let matchchallenge of matchchallengesData) {
                  const totalJoinedUserInLeauge = await joinStockLeagueModel.find({ contestId: mongoose.Types.ObjectId(matchchallenge._id) });
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
                          newmatchchallenge.contestId = matchchallenge.contestId
                          newmatchchallenge.contest_cat = matchchallenge.contest_cat
                          // newmatchchallenge.challenge_id = matchchallenge.challenge_id
                          // newmatchchallenge.matchkey = matchchallenge.matchkey
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
                          let data = await stockContestModel.findOne({
                              contestId: matchchallenge.contestId,
                              fantasy_type: matchchallenge.fantasy_type,
                              entryfee: matchchallenge.entryfee,
                              win_amount: matchchallenge.win_amount,
                              maximum_user: matchchallenge.maximum_user,
                              joinedusers: 0,
                              status: matchchallenge.status,
                              is_duplicated: { $ne: 1 }
                          });
                          if (!data) {
                              let createNewContest = new stockContestModel(newmatchchallenge);
                              let mynewContest = await createNewContest.save();
                          }
                          // console.log("---createNewContest----",mynewContest)
                      }
                      await stockContestModel.updateOne({ _id: mongoose.Types.ObjectId(matchchallenge._id) }, update);
                  }
              }
          }
      } catch (error) {
          throw error;
      }
  
  };

    async getAllNewStock(req) {
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

    async getStockCategory(req) {
        try {
            const data = await stockCategoryModel.find({},{name:1,sub_title:1,image:1})
            if (data.length > 0) {
                return {
                    message: 'All Stock Categories',
                    status: true,
                    data: data
                }
            } else {
                return {
                    message: 'Stock Categories not found',
                    status: false,
                    data: {}
                }
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async getStockAccordingCategory(req) {
        try {
            let { stockcategory } = req.query
            let pipeline = []
            pipeline.push({
                '$match': {
                  '_id': mongoose.Types.ObjectId(stockcategory)
                }
              },{
                '$addFields': {
                  'stockId': {
                    '$map': {
                      'input': '$stocks_id', 
                      'as': 'item', 
                      'in': {
                        '$toObjectId': '$$item'
                      }
                    }
                  }
                }
              }, {
                '$lookup': {
                  'from': 'stocks', 
                  'let': {
                    'id': '$stockId'
                  }, 
                  'pipeline': [
                    {
                      '$match': {
                        '$expr': {
                          '$in': [
                            '$_id', '$$id'
                          ]
                        }
                      }
                    }
                  ], 
                  'as': 'stocks'
                }
              }, {
                '$unwind': {
                  'path': '$stocks'
                }
              }, {
                '$replaceRoot': {
                  'newRoot': '$stocks'
                }
              })
            let data = await stockCategoryModel.aggregate(pipeline)
            if (data.length > 0) {
                return {
                    message: 'All Stocks According Category',
                    status: true,
                    data: data
                }
            } else {
                return {
                    message: 'Stocks not found',
                    status: false,
                    data: {}
                }
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async myJoinedStockContests(req) {
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
  async getStockMyTeams(req) {
    try {
      let { teamId } = req.query
      let userId = req.user._id
      let pipeline = []
      pipeline.push({
        '$match': {
          '_id': mongoose.Types.ObjectId(teamId),
          'userId': mongoose.Types.ObjectId(userId)
        }
      }, {
        '$addFields': {
          'stockId': {
            '$map': {
              'input': '$stock',
              'as': 'item',
              'in': {
                '$toObjectId': '$$item.stockId'
              }
            }
          }
        }
      }, {
        '$lookup': {
          'from': 'stocks',
          'let': {
            'id': '$stockId'
          },
          'pipeline': [
            {
              '$match': {
                '$expr': {
                  '$in': [
                    '$_id', '$$id'
                  ]
                }
              }
            }
          ],
          'as': 'stocks'
        }
      }, {
        '$unwind': {
          'path': '$stocks'
        }
      }, {
        '$replaceRoot': {
          'newRoot': '$stocks'
        }
      })
      let stocks = await joinStockTeamModel.aggregate(pipeline)
      if (stocks.length == 0) {
        return {
          message: 'Teams Not Available',
          status: false,
          data: [],
        }
      }
      return {
        message: 'Teams Data',
        status: true,
        data: stocks
      }
    } catch (error) {
      throw error;
    }
  }
      
    async completeContest(req) {
        try {
            const JoinContestData = await joinStockLeagueModel.aggregate([
                {
                  '$match': {
                    'userid': new mongoose.Types.ObjectId(req.user._id)
                  }
                }, {
                  '$group': {
                    '_id': '$userid', 
                    'joinedleaugeId': {
                      '$push': '$contestId'
                    }, 
                    'jointeamid': {
                      '$push': '$teamid'
                    }, 
                    'userid': {
                      '$first': '$userid'
                    }
                  }
                }, {
                  '$lookup': {
                    'from': 'stock_contests', 
                    'let': {
                      'contestId': '$joinedleaugeId'
                    }, 
                    'pipeline': [
                      {
                        '$match': {
                          '$expr': {
                            '$and': [
                              {
                                '$in': [
                                  '$_id', '$$contestId'
                                ]
                              }, {
                                '$eq': [
                                  '$final_status', 'winnerdeclared'
                                ]
                              }
                            ]
                          }
                        }
                      }
                    ], 
                    'as': 'contestData'
                  }
                }, {
                  '$lookup': {
                    'from': 'joinstockteams', 
                    'let': {
                      'teamId': '$jointeamid'
                    }, 
                    'pipeline': [
                      {
                        '$match': {
                          '$expr': {
                            '$in': [
                              '$_id', '$$teamId'
                            ]
                          }
                        }
                      }
                    ], 
                    'as': 'teamData'
                  }
                }, {
                  '$project': {
                    'joinedleaugeId': 0, 
                    'jointeamid': 0
                  }
                }
              ]);

              if (JoinContestData.length > 0) {
                return {
                    message: 'User Joiend All Completed Contest Data..',
                    status: true,
                    data: JoinContestData,
                    
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

    async myContestleaderboard(req) {
        try {
            const { contestId } = req.query;
            const joinedleaugeA = await joinStockLeagueModel.aggregate([
                {
                  '$match': {
                    'contestId': new mongoose.Types.ObjectId(contestId)
                  }
                }, {
                  '$lookup': {
                    'from': 'users', 
                    'let': {
                      'userId': '$userid'
                    }, 
                    'pipeline': [
                      {
                        '$match': {
                          '$expr': {
                            '$eq': [
                              '$_id', '$$userId'
                            ]
                          }
                        }
                      }
                    ], 
                    'as': 'userData'
                  }
                }, {
                  '$lookup': {
                    'from': 'joinstockteams', 
                    'localField': 'teamid', 
                    'foreignField': '_id', 
                    'as': 'teamData'
                  }
                }, {
                  '$unwind': {
                    'path': '$userData', 
                    'path': '$teamData', 
                    'preserveNullAndEmptyArrays': true
                  }
                }, {
                  '$addFields': {
                    'usernumber': {
                      '$cond': {
                        'if': {
                          '$eq': [
                            '$userid', new mongoose.Types.ObjectId(req.user._id)
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
                        'else': 'https://admin.Riskle.com/default_profile.png'
                      }
                    }
                  }
                }, {
                  '$match': {
                    'userid': new mongoose.Types.ObjectId(req.user._id)
                  }
                }, {
                  '$sort': {
                    'usernumber': -1, 
                    'userid': -1, 
                    'teamData.teamnumber': 1
                  }
                }, {
                  '$project': {
                    'joinstockleaugeid': '$_id', 
                    '_id': 0, 
                    'teamnumber': {
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
                    'teamData': {
                      '$ifNull': [
                        '$teamData', ''
                      ]
                    }, 
                    'image': {
                      '$ifNull': [
                        '$image', 'https://admin.Riskle.com/user.png'
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
                    'contestId': new mongoose.Types.ObjectId(contestId)
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
                    'from': 'joinstockteams', 
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
                            '$userid', new mongoose.Types.ObjectId(req.user._id)
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
                        'else': 'https://admin.Riskle.com/default_profile.png'
                      }
                    }
                  }
                }, {
                  '$match': {
                    'userid': {
                      '$ne':new mongoose.Types.ObjectId(req.user._id)
                    }
                  }
                }, {
                  '$sort': {
                    'usernumber': -1, 
                    'userid': -1, 
                    'teamData.teamnumber': 1
                  }
                }, {
                  '$project': {
                    'joinstockleaugeid': '$_id', 
                    '_id': 0, 
                    'teamnumber': {
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
                    'teamData': {
                      '$ifNull': [
                        '$teamData', ''
                      ]
                    }, 
                    'image': {
                      '$ifNull': [
                        '$image', 'https://admin.Riskle.com/user.png'
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
                        '$image', 'https://admin.Riskle.com/user.png'
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
                     
                    }
                }
            } else {
                return { message: 'Contest LeaderBard Not Found', status: false, data: [] };
            }
            if (joinedleauge.length == 0) return { message: 'Contest LeaderBard Not Found', status: false, data: [] };
           
            return {
                message: "Contest LeaderBard",
                status: true,
                data: joinedleauge,

            }
        } catch (error) {
            throw error;
        }
    }

    async getStockMyTeams(req) {
      try {
          let { teamId } = req.query
          let userId = req.user._id
          let pipeline = []
          pipeline.push({
              '$match': {
                  '_id': mongoose.Types.ObjectId(teamId),
                  'userId':mongoose.Types.ObjectId(userId)
              }
            }, {
              '$addFields': {
                'stockId': {
                  '$map': {
                    'input': '$stock', 
                    'as': 'item', 
                    'in': {
                      '$toObjectId': '$$item.stockId'
                    }
                  }
                }
              }
            }, {
              '$lookup': {
                'from': 'stocks', 
                'let': {
                  'id': '$stockId'
                }, 
                'pipeline': [
                  {
                    '$match': {
                      '$expr': {
                        '$in': [
                          '$_id', '$$id'
                        ]
                      }
                    }
                  }
                ], 
                'as': 'stocks'
              }
            }, {
              '$unwind': {
                'path': '$stocks'
              }
            }, {
              '$replaceRoot': {
                'newRoot': '$stocks'
              }
          })
          let stocks = await joinStockTeamModel.aggregate(pipeline)
          if (stocks.length == 0) {
              return {
                  message: 'Teams Not Available',
                  status: false,
                  data: [],
              }
          }
          return {
              message: 'Teams Data',
              status: true,
              data: stocks
           }
      } catch (error) {
          throw error;
      }
  }

  async updateResultStocks(req) {
    try {
        const currentDate = moment().subtract(2, 'days').format('YYYY-MM-DD 00:00:00');

        const listContest = await stockContestModel.find({
            fantasy_type: "Stocks",
            start_date: { $gte: currentDate },
            launch_status: 'launched',
            final_status: { $nin: ['winnerdeclared','IsCanceled'] },
            status: { $ne: 'completed' }
        });

        if (listContest.length > 0) {
            for (let index of listContest) {
                let matchTimings = index.start_date;
                let contestId = index._id;
                let investment = index?.investment;
                const currentDate1 = moment().format('YYYY-MM-DD HH:mm:ss');
                if (currentDate1 >= matchTimings) {
                    this.getSockScoresUpdates(contestId, investment);
                }
            }

        }
        return listContest;

    } catch (error) {
        console.log(error);
        throw error;
    }
}

async getSockScoresUpdates(contestId, investment) {
    try {
      
        const constedleaugeData = await joinStockLeagueModel.aggregate([
          {
            '$match': {
              'contestId': new mongoose.Types.ObjectId(contestId)
            }
          }, {
            '$lookup': {
              'from': 'stock_contests', 
              'localField': 'contestId', 
              'foreignField': '_id', 
              'as': 'contestData'
            }
          }, {
            '$lookup': {
              'from': 'joinstockteams', 
              'localField': 'teamid', 
              'foreignField': '_id', 
              'as': 'teamData'
            }
          }, {
            '$addFields': {
              'stock': {
                '$getField': {
                  'field': 'stock', 
                  'input': {
                    '$arrayElemAt': [
                      '$teamData', 0
                    ]
                  }
                }
              }
            }
          }, {
            '$addFields': {
              'stockId': {
                '$map': {
                  'input': '$stock', 
                  'as': 'item', 
                  'in': '$$item.stockId'
                }
              }
            }
          }, {
            '$lookup': {
              'from': 'stocks', 
              'let': {
                'id': '$stockId'
              }, 
              'pipeline': [
                {
                  '$match': {
                    '$expr': {
                      '$in': [
                        '$_id', '$$id'
                      ]
                    }
                  }
                }
              ], 
              'as': 'stockTeam'
            }
          }, {
            '$project': {
              'stock': 0, 
              'stockId': 0
            }
          }
        ]);
        return constedleaugeData;
          

    } catch (error) {
        console.log("error"+error);
        throw error;
    }

   
}
}
module.exports = new mcxfantasyServices();