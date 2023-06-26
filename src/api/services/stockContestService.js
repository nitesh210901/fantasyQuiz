const mongoose = require('mongoose');
const moment = require('moment');
const axios = require('axios');
const joinStockTeamModel = require('../../models/JoinStockTeamModel');
const stockFinalResult = require('../../models/stockFinalResult');
const stockContestModel = require('../../models/stockContestModel');
const stockCategoryModel = require('../../models/stockcategoryModel');
const stockContestCategoryModel = require('../../models/stockContestCategory')
const joinStockLeagueModel = require('../../models/joinStockLeagueModel');
const TransactionModel = require('../../models/transactionModel');
const userModel = require('../../models/userModel');
const constant = require('../../config/const_credential');
const randomstring = require("randomstring");
const stockLeaderBoardModel = require('../../models/stockLeaderboardModel');
const stockModel = require('../../models/stockModel');
const { test } = require('../../utils/websocketKiteConnect');
const { pipeline } = require('stream');
class overfantasyServices {
  constructor() {
    return {
      stockCreateTeam: this.stockCreateTeam.bind(this),
      findArrayIntersection: this.findArrayIntersection.bind(this),
      getMatchTime: this.getMatchTime.bind(this),
      listStockContest: this.listStockContest.bind(this),
      stockJoinContest: this.stockJoinContest.bind(this),
      findUsableBonusMoney: this.findUsableBonusMoney.bind(this),
      getStockContestCategory: this.getStockContestCategory.bind(this),
      getSingleContestDetails: this.getSingleContestDetails.bind(this),
      viewStockTeam: this.viewStockTeam.bind(this),
      completeContest: this.completeContest.bind(this),
      myContestleaderboard: this.myContestleaderboard.bind(this),
      getStockMyTeams: this.getStockMyTeams.bind(this),
      updateResultStocks: this.updateResultStocks.bind(this),
      getStockCategory: this.getStockCategory.bind(this),
      getStockAccordingCategory: this.getStockAccordingCategory.bind(this),
      getAllStockWithAllSelector: this.getAllStockWithAllSelector.bind(this),
      saveCurrentPriceOfStock: this.saveCurrentPriceOfStock.bind(this),
      updateResultStocks: this.updateResultStocks.bind(this),
      updateJoinedusers: this.updateJoinedusers.bind(this),
      getStockUsableBalance: this.getStockUsableBalance.bind(this),
      liveStockRanksLeaderboard: this.liveStockRanksLeaderboard.bind(this),
      Newjoinedcontest: this.Newjoinedcontest.bind(this),
      NewjoinedcontestLive: this.NewjoinedcontestLive.bind(this),
      AllCompletedContest: this.AllCompletedContest.bind(this),

    }
  }

  async updateJoinedusers(req) {
    try {
      console.log("--updateJoinedusers----")
      const query = {};
      query.matchkey = req.query.stock_contest_cat
      query.fantasy_type = req.query.stock_contest_cat
      query.stock_contest_cat = req.query.stock_contest_cat
      query.contest_type = 'Amount'
      query.status = 'opened'
      const contestData = await stockContestModel.find(query);
      if (contestData.length > 0) {
        for (let matchchallenge of contestData) {
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
  async listStockContest(req) {
    try {
      const { stock_contest_cat } = req.query;
      await this.updateJoinedusers(req)
      let matchpipe = [];
      let date = moment().format('YYYY-MM-DD HH:mm:ss');
      let EndDate = moment().add(25, 'days').format('YYYY-MM-DD HH:mm:ss');
      matchpipe.push({
        $match: {
          fantasy_type: stock_contest_cat,
          isEnable: true,
          isCancelled: false
        }
      });
      matchpipe.push({
        $match: {
          $and: [{ status: 'notstarted' }, { launch_status: 'launched' }, { start_date: { $gt: date } }, { start_date: { $lt: EndDate } }],
          final_status: { $nin: ['IsCanceled', 'IsAbandoned'] }
        }
      });

      // if (stock_contest === "live") {
      //   matchpipe.push({
      //     $match: {
      //       $and: [{ status: 'started' }, { "stock_contest_cat": stock_contest_cat }, { launch_status: 'launched' }, { start_date: { $lt: date } } ],
      //       final_status: { $nin: ['IsCanceled', 'IsAbandoned'] }
      //     }
      //   });
      // } else if (stock_contest === "upcoming") {
      //   matchpipe.push({
      //     $match: {
      //       $and: [{ status: 'notstarted' }, { "stock_contest_cat": stock_contest_cat }, { launch_status: 'launched' }, { start_date: { $gt: date } }, { start_date: { $lt: EndDate } }],
      //       final_status: { $nin: ['IsCanceled', 'IsAbandoned'] }
      //     }
      //   });
      // } else if (stock_contest === "completed") {
      //   matchpipe.push({
      //     $match: {
      //       $and: [{ status: 'completed' }, { "stock_contest_cat": stock_contest_cat }, { launch_status: 'launched' }, { start_date: { $lt: date } }],
      //       final_status: "winnerdeclared"
      //     }
      //   });
      // }

      // if(stock_contest !== "completed"){
      //   matchpipe.push({
      //     $match: {
      //         $and: [{ status: 'notstarted' }, { launch_status: 'launched' }, { start_date: { $gt: date } }, { start_date: { $lt: EndDate } }],
      //         final_status: { $nin: ['IsCanceled', 'IsAbandoned'] }
      //     }
      // });
      // }


      matchpipe.push({
        $lookup: {

          from: "join_stock_leagues",
          localField: "_id",
          foreignField: "contestId",
          as: "joinData"

        },
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
      if (result.length > 0) {
        return result
      } else {
        return {
          status: false,
          message: "Stock Contest Not Found",
        }
      }
    } catch (error) {
      throw error;
    }
  }





  async stockCreateTeam(req) {
    try {
      const { stock, teamnumber, contestId, stock_type } = req.body;
      let stockArray = stock.map(item => item.stockId);
      const chkStockExist = await stockModel.find({ '_id': { $in: stockArray } });

      if (!chkStockExist) {
        return {
          message: 'Stocks Not Found',
          status: false,
          data: {}
        }
      }

      const chkStockLimit = await stockContestModel.findById({ _id: contestId }, { select_team: 1 });

      if (!chkStockLimit) {
        return {
          message: 'Contest Not Found',
          status: false,
          data: {}
        }
      }

      if (stockArray.length > chkStockLimit.select_team) {
        return {
          message: `Select Under ${chkStockLimit.select_team} Stocks Limit.`,
          status: false,
          data: {}
        };
      }

      let stockObjectIdArray = [];
      for (let stockId of stockArray) {
        stockObjectIdArray.push(mongoose.Types.ObjectId(stockId.stockId));
      }

      const joinlist = await joinStockTeamModel.find({ contestId: contestId, userid: req.user._id }).sort({ teamnumber: -1 });



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
      data['userId'] = req.user._id;
      data['contestId'] = contestId;
      data['teamnumber'] = teamnumber;
      data['stock'] = stock;
      data['type'] = stock_type;

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

      const chkContest = await stockContestModel.findOne({ _id: stockContestId, isCancelled: false, isEnable: true, launch_status: 'launched', final_status: 'pending' });
      if (!chkContest) {
        return {
          message: 'Contest Not Found Or May Be Cancelled',
          status: false,
          data: {}
        }
      } else {
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
          if (resultForBonus == false) {

            if (i > 1) {
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
          const joinedLeauges = await joinStockLeagueModel.find({ contestId: stockContestId }).count();
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
                status: 'notstarted',
                joinedusers: joinedLeaugesCount,
              }, { new: true });
            }
          } else
            await stockContestModel.findOneAndUpdate({ contestId: stockContestId, _id: mongoose.Types.ObjectId(chkContest._id) }, {
              status: 'notstarted',
              joinedusers: joinedLeaugesCount,
            }, { new: true });
          console.log('======================', i, jointeamId.length);
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

  async getStockCategory(req) {
    try {
      const data = await stockCategoryModel.find()
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

  async getAllStockWithAllSelector(req) {
    try {
      const data = await stockModel.find({ isEnable: true }).limit(50)
      if (data.length > 0) {
        return {
          message: 'All Stock With All Selectors Cateories',
          status: true,
          data: data
        }
      } else {
        return {
          message: 'Stock not found',
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
      let pipeline = [];
      if (stockcategory) {
        pipeline.push({
          '$match': {
            '_id': mongoose.Types.ObjectId(stockcategory)
          }
        }, {
          '$addFields': {
            'stocks_id': {
              '$map': {
                'input': '$stocks_id',
                'as': 'stock',
                'in': {
                  '$toObjectId': '$$stock'
                }
              }
            }
          }
        }, {
          '$lookup': {
            'from': 'stocks',
            'let': {
              'id': '$stocks_id'
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
          '$project': {
            '_id': 0,
            'stocks': 1
          }
        })
      } else {
        return {
          status: false,
          message: "Stock Not Found",
          data: []
        }
      }
      let data = await stockCategoryModel.aggregate(pipeline)
      if (data.length > 0) {
        return {
          status: true,
          message: "Stock Fatch Successfully",
          data: data[0].stocks
        }
      } else {
        return {
          status: false,
          message: "Stock Not Found",
          data: []
        }
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findJoinLeaugeExist(contestId, userId, teamId, challengeDetails) {
    if (!challengeDetails || challengeDetails == null || challengeDetails == undefined) return 4;

    const joinedLeauges = await joinStockLeagueModel.find({
      contestId: contestId,
      contestId: challengeDetails._id,
      userid: userId,
    });
    if (joinedLeauges.length == 0) return 1;
    if (joinedLeauges.length > 0) {
      if (challengeDetails.multi_entry == 0) {
        return { message: 'Contest Already joined', status: false, data: {} };
      } else {
        if (joinedLeauges.length >= challengeDetails.team_limit) {
          return { message: 'You cannot join with more teams now.', status: false, data: {} };
        }
        else {
          // const joinedLeaugesCount = joinedLeauges.filter(item => {
          //     return item.teamid.toString() === teamId;
          // });
          // if (joinedLeaugesCount.length) return { message: 'Team already joined', status: false, data: {} };
          // else 
          return 2;
        }
      }
    }
  }

  async getSingleContestDetails(req) {
    try {
      const result = await stockContestModel.aggregate([
        {
          '$match': {
            '_id': new mongoose.Types.ObjectId(req.query.contestId)
          }
        }, {
          '$lookup': {
            'from': 'join_stock_leagues',
            'let': {
              'id': '$_id'
            },
            'pipeline': [
              {
                '$match': {
                  '$expr': {
                    '$eq': [
                      '$contestId', '$$id'
                    ]
                  }
                }
              }
            ],
            'as': 'result'
          }
        }, {
          '$unwind': {
            'path': '$result'
          }
        }, {
          '$addFields': {
            'teamId': '$result.teamid',
            'matchstatus': {
              '$cond': {
                'if': {
                  '$ne': [
                    '$status', 'notstarted'
                  ]
                },
                'then': {
                  '$cond': {
                    'if': {
                      '$eq': [
                        '$status', 'started'
                      ]
                    },
                    'then': '$status',
                    'else': '$final_status'
                  }
                },
                'else': {
                  'if': {
                    '$lte': [
                      '$start_date', moment().format('YYYY-MM-DD HH:mm:ss'),
                    ]
                  },
                  'then': 'started',
                  'else': 'notstarted'
                }
              }
            }
          }
        }, {
          '$lookup': {
            'from': 'joinstockteams',
            'localField': 'teamId',
            'foreignField': '_id',
            'as': 'teamData'
          }
        }
      ]);
      if (result.length > 0) {
        return {
          message: 'Details of a perticular Contest',
          status: true,
          data: result
        }
      } else {
        return {
          message: 'Not Able To Find Details of a perticular Contest.....!',
          status: false,
          data: []
        }
      }
    } catch (error) {
      throw error;
    }
  }
  async viewStockTeam(req) {
    try {

      let finalData = [];
      const listStockData = await stockContestModel.findOne({ _id: req.query.contestId });
      let teamnumber = parseInt(req.query.teamnumber);
      const createTeam = await joinStockTeamModel.aggregate([
        {
          '$match': {
            'contestId': new mongoose.Types.ObjectId(req.query.contestId),
            '_id': new mongoose.Types.ObjectId(req.query.jointeamid),
            'teamnumber': teamnumber
          }
        }, {
          '$unwind': {
            'path': '$stock'
          }
        }, {
          '$addFields': {
            'stockId': '$stock.stockId'
          }
        }, {
          '$lookup': {
            'from': 'stocks',
            'localField': 'stockId',
            'foreignField': '_id',
            'as': 'stockData'
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
      for await (const teamData of createTeam[0].stockData) {
        const filterData = await stockModel.findOne({ _id: teamData._id, contestId: req.query.contestId });
        if (!filterData) {
          return {
            status: false,
            message: "match player not found",
            data: []
          }
        }

        if (!teamData) break;
        finalData.push({
          id: filterData._id,
          name: filterData.name,
          exchange: filterData.exchange,
          credit: filterData.credit,
          playingstatus: filterData?.playingstatus,
          instrument_token: filterData?.instrument_token,
          exchange_token: filterData?.exchange_token,
          tradingsymbol: filterData?.tradingsymbol,
          expiry: filterData?.expiry,
        });
      }

      if (finalData.length == createTeam[0].stockData.length) {
        return {
          message: 'Stock Perticular Team Data',
          status: true,
          data: finalData
        }
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
      console.log(contestId)
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
      const joinedleaugeB = await joinStockLeagueModel.aggregate([
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
              '$ne': new mongoose.Types.ObjectId(req.user._id)
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

  async updateResultStocks(req) {
    try {

      const currentDate = moment().subtract(2, 'days').format('YYYY-MM-DD 00:00:00');
      let newData;
      const listContest = await stockContestModel.find({
        fantasy_type: { $ne: 'CRICKET' },
        start_date: { $gte: currentDate },
        launch_status: 'launched',
        final_status: { $nin: ['winnerdeclared', 'IsCanceled'] },
        status: { $ne: 'completed' }
      });
      if (listContest.length > 0) {
        for (let index of listContest) {
          let matchTimings = index.start_date;
          const currentDate1 = moment().format('YYYY-MM-DD+HH:mm:ss');

          if (currentDate1 >= matchTimings) {
            const result = await this.getSockScoresUpdates(listContest);

            const headers = {
              "Authorization": `token ${process.env.KITE_Api_kEY}:${process.env.KITE_ACCESS_TOKEN}`
            };

            await Promise.all(result.map(async (ele) => {
              const insertData = {
                userId: ele.userid,
                teamid: ele.teamid,
                contestId: ele.contestId,
                joinId: ele._id,
              };

              const investment = +ele.invested;
              const startDate = ele.start_date;
              const formattedDate = moment(startDate, 'YYYY/MM/DD HH:mm').format('YYYY-MM-DD+HH:mm:ss');
              const dateFormat = moment().format('YYYY/MM/DD HH:mm');
              let matchStatus = {};
              if (dateFormat >= ele.start_date) {
                matchStatus['status'] = 'started';
                matchStatus['final_status'] = 'IsReviewed';
              }
<<<<<<< HEAD
              await stockContestModel.findByIdAndUpdate({_id:ele.contestId}, matchStatus);
              
=======

              const chkSave = await stockContestModel.findOneAndUpdate({ _id: ele.contestId }, matchStatus, { upsert: true });
>>>>>>> c940e09ce2f18c4c1420d57393f45b8656d22a7b
              let total = 0;

              await Promise.all(ele.stockTeam.map(async (stock) => {
                try {
                  const resp = await axios.get(`https://api.kite.trade/instruments/historical/${stock.instrument_token}/minute?from=${formattedDate}&to=${formattedDate}`, {
                    headers: headers
                  });

                  total += resp.data.data.candles.reduce((acc, candle) => {
                    const openPrice = candle[1];
                    const closePrice = candle[4];
                    return acc + (investment * closePrice / openPrice);
                  }, 0);
                } catch (err) {
                  console.log(err);
                  console.error(err);
                }
              }));

              insertData.finalvalue = total;

              newData = await stockFinalResult.findOneAndUpdate(
                { userId: ele.userid, teamid: ele.teamid, contestId: ele.contestId },
                insertData,
                { upsert: true }
              );
            }));


          }

        }

      }

      return {
        "message": "League Data",
        data: newData || {}
      };

    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getSockScoresUpdates(listContest) {
    try {
      const currentDate = moment().subtract(2, 'days').format('YYYY-MM-DD 00:00:00');
      const constedleaugeData = await joinStockLeagueModel.aggregate([
        {
          '$lookup': {
            'from': 'stock_contests',
            'localField': 'contestId',
            'foreignField': '_id',
            'as': 'contestData'
          }
        }, {
          '$match': {
            'contestData': {
              '$elemMatch': {
                'launch_status': 'launched',
                'final_status': {
                  '$nin': [
                    'winnerdeclared', 'IsCanceled'
                  ]
                },
                'fantasy_type': {
                  '$ne': 'CRICKET'
                },
                'status': {
                  '$ne': 'completed'
                }, 'start_date': { $gte: currentDate },
              }
            }
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
          '$unwind': {
            'path': '$stock'
          }
        }, {
          '$lookup': {
            'from': 'stocks',
            'let': {
              'id': '$stock.stockId'
            },
            'pipeline': [
              {
                '$match': {
                  '$expr': {
                    '$eq': [
                      '$_id', '$$id'
                    ]
                  }
                }
              }
            ],
            'as': 'stockTeam'
          }
        }, {
          '$addFields': {
            'stockTeam': {
              '$arrayElemAt': [
                '$stockTeam', 0
              ]
            }
          }
        }, {
          '$addFields': {
            'stockTeam.percentage': '$stock.percentage'
          }
        }, {
          '$project': {
            'stock': 0,
            'teamData': 0,
            'leaugestransaction': 0
          }
        }, {
          '$group': {
            '_id': '$_id',
            'transaction_id': {
              '$first': '$transaction_id'
            },
            'userid': {
              '$first': '$userid'
            },
            'teamid': {
              '$first': '$teamid'
            },
            'contestId': {
              '$first': '$contestId'
            },
            'contestData': {
              '$first': '$contestData'
            },
            'stockTeam': {
              '$push': '$stockTeam'
            }
          }
        }, {
          '$addFields': {
            'invested': {
              '$getField': {
                'field': 'investment',
                'input': {
                  '$arrayElemAt': [
                    '$contestData', 0
                  ]
                }
              }
            },
            'start_date': {
              '$getField': {
                'field': 'start_date',
                'input': {
                  '$arrayElemAt': [
                    '$contestData', 0
                  ]
                }
              }
            },
            'end_date': {
              '$getField': {
                'field': 'end_date',
                'input': {
                  '$arrayElemAt': [
                    '$contestData', 0
                  ]
                }
              }
            }
          }
        }
      ]);

      return constedleaugeData;
    } catch (error) {
      console.log("error" + error);
      throw error;
    }


  }

  async saveCurrentPriceOfStock(req, res) {
    try {
      const stockData = await stockModel.find({ isEnable: true });

      const headers = {
        "Authorization": `token ${process.env.KITE_Api_kEY}:${process.env.KITE_ACCESS_TOKEN}`
      };

      const formattedDate = moment().format('YYYY-MM-DD+HH:mm');
      const requests = stockData.map(async (stock) => {
        try {
          const resp = await axios.get(`https://api.kite.trade/instruments/historical/${stock.instrument_token}/minute?from=${formattedDate}:00&to=${formattedDate}:00`, {
            "headers": headers
          });
          const historicalData = resp.data.data.candles;
          const updates = historicalData.map(async (candle) => {
            const openPrice = candle[1];
            const closePrice = candle[4];
            await stockModel.findOneAndUpdate({ instrument_token: stock.instrument_token }, { "openPrice": openPrice, 'closePrice': closePrice }, { upsert: true });
          });
          await Promise.all(updates);
        } catch (err) {
          throw err;
        }
      });
      await Promise.all(requests);
      return {
        "message": "League Data",
        data: requests || {}
      };
    } catch (error) {
      throw error;
    }
  }

  async liveStockRanksLeaderboard(req) {
    try {
      let skip = Number(req.query?.skip ?? 0);
      let limit = Number(req.query?.limit ?? 10);

      const finalData = await joinStockLeagueModel.aggregate([
        {
          '$match': {
            'contestId': mongoose.Types.ObjectId(req.query.contestId)
          }
        },
        {
          '$lookup': {
            'from': 'users',
            'localField': 'userid',
            'foreignField': '_id',
            'as': 'user'
          }
        },
        {
          '$addFields': {
            'team': {
              '$ifNull': [
                { '$arrayElemAt': ['$user.team', 0] },
                ''
              ]
            },
            'userno': {
              '$cond': {
                'if': {
                  '$and': [
                    { '$eq': ['$userid', mongoose.Types.ObjectId(req.user._id)] }
                  ]
                },
                'then': '-1',
                'else': '0'
              }
            }
          }
        },
        {
          '$lookup': {
            'from': 'stockleaderboards',
            'let': { 'joinId': '$_id' },
            'pipeline': [
              { '$match': { '$expr': { '$eq': ['$joinId', '$$joinId'] } } }
            ],
            'as': 'leaderboards'
          }
        },
        {
          '$lookup': {
            'from': 'stockfinalresults',
            'let': { 'joinId': '$_id' },
            'pipeline': [
              { '$match': { '$expr': { '$eq': ['$joinId', '$$joinId'] } } }
            ],
            'as': 'finalResult'
          }
        },
        {
          '$project': {
            '_id': 0,
            'userjoinid': '$_id',
            'userid': '$userid',
            'jointeamid': '$teamid',
            'teamnumber': 1,
            'contestId': 1,
            'userno': 1,
            'points': {
              '$ifNull': [
                { '$arrayElemAt': ['$leaderboards.points', 0] },
                0
              ]
            },
            'getcurrentrank': {
              '$ifNull': [
                { '$arrayElemAt': ['$leaderboards.rank', 0] },
                0
              ]
            },
            'teamname': {
              '$ifNull': ['$team', 0]
            },
            'image': {
              '$cond': {
                'if': {
                  '$eq': [
                    { '$getField': { 'field': 'image', 'input': { '$arrayElemAt': ['$user', 0] } } },
                    ''
                  ]
                },
                'then': 'https://admin.mygames11.com/avtar1.png',
                'else': { '$getField': { 'field': 'image', 'input': { '$arrayElemAt': ['$user', 0] } } }
              }
            },
            'winingamount': {
              '$cond': {
                'if': { '$ne': [{ '$arrayElemAt': ['$finalResult.amount', 0] }, 0] },
                'then': { '$arrayElemAt': ['$finalResult.amount', 0] },
                'else': { '$arrayElemAt': ['$finalResult.prize', 0] }
              }
            }
          }
        },
        {
          '$lookup': {
            'from': 'stock_contests',
            'localField': 'contestId',
            'foreignField': '_id',
            'as': 'challengeData'
          }
        },
        {
          '$addFields': {
            'contest_winning_type': {
              '$ifNull': [
                { '$arrayElemAt': ['$challengeData.amount_type', 0] },
                0
              ]
            }
          }
        },
        {
          '$sort': {
            'userno': 1,
            'getcurrentrank': 1
          }
        },
        {
          '$setWindowFields': {
            'partitionBy': "",
            'sortBy': {
              'points': -1,
            },
            'output': {
              'rank': {
                '$rank': {},
              },
            },
          }
        },
        {
          '$facet': {
            'data': [
              { '$skip': skip },
              { '$limit': limit }
            ]
          }
        }
      ]);

      if (finalData[0].data.length > 0) {
        return {
          message: "Live score leaderboard of contest",
          status: true,
          data: {
            team_number_get: finalData[0].data[0].teamnumber,
            userrank: finalData[0].data[0].getcurrentrank,
            pdfname: '',
            jointeams: finalData[0].data || []
          }
        };
      } else {
        return {
          message: 'Live score leaderboard of contest Not Found',
          status: false,
          data: {}
        };
      }

    }
    catch (error) {
      throw error;
    }
  }

  async getStockUsableBalance(req) {
    try {
      const { contestId } = req.query;
      const contestData = await stockContestModel.findOne({ _id: mongoose.Types.ObjectId(contestId) });
      await this.updateJoinedusers(req);
      if (!contestData) {
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
      if (contestData.is_bonus == 1 && contestData.bonus_percentage) findBonusAmount = (contestData.bonus_percentage / 100) * contestData.entryfee;
      if (bonus >= findBonusAmount) usedBonus = findBonusAmount;
      else usedBonus = bonus;
      return {
        message: 'Get amount to be used',
        status: true,
        data: {
          usablebalance: findUsableBalance.toFixed(2).toString(),
          usertotalbalance: totalBalance.toFixed(2).toString(),
          entryfee: contestData.entryfee.toFixed(2).toString(),
          bonus: usedBonus.toFixed(2).toString(),
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async Newjoinedcontest(req) {
    let today = moment().format('YYYY-MM-DD HH:mm:ss')
    const JoiendMatches = await joinStockLeagueModel.aggregate([
      {
        '$match': {
          'userid': mongoose.Types.ObjectId(req.user._id),
        }
      }, {
        '$group': {
          '_id': '$contestId',
          'contestId': {
            '$first': '$contestId'
          },
          'joinedleaugeId': {
            '$first': '$_id'
          },
          'userid': {
            '$first': '$userid'
          },
          'contestId': {
            '$first': '$contestId'
          },
          'jointeamid': {
            '$first': '$teamid'
          }
        }
      }, {
        '$lookup': {
          'from': 'stock_contests',
          'localField': 'contestId',
          'foreignField': '_id',
          'as': 'contestData'
        }
      }, {
        '$unwind': {
          'path': '$contestData'
        }
      }, {
        '$match': {
          'contestData.fantasy_type': req.query.stock_contest_cat,
          'contestData.isEnable': true,
          'contestData.isCancelled': false
        }
      }, {
        '$match': {
          '$and': [
            {
              'contestData.final_status': 'pending',
             
            }
          ]
        }
      }, {
        '$lookup': {
          'from': 'join_stock_leagues',
          'let': {
            'contestId': '$contestId',
            'userid': '$userid'
          },
          'pipeline': [
            {
              '$match': {
                '$expr': {
                  '$and': [
                    {
                      '$eq': [
                        '$contestId', '$$contestId'
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
          '_id': '$joinedleauges.contestId',
          'joinedleaugeId': {
            '$first': '$joinedleauges._id'
          },
          'contestId': {
            '$first': '$contestId'
          },
          'jointeamid': {
            '$first': '$jointeamid'
          },
          'userid': {
            '$first': '$userid'
          },
          'contestData': {
            '$first': '$contestData'
          }
        }
      }, {
        '$addFields': {
          'date': {
            '$dateFromString': {
              'dateString': '$contestData.start_date',
              'timezone': '-00:00'
            }
          },
          'curDate': today
        }
      },
      {
        '$match': {
          '$expr': {
            '$and': [
              {
                '$gte': [
                  '$date', today
                ]
              }
            ]
          }
        }
      },
      {
        '$project': {
          '_id': 0,
          'date': 1,
          'curDate': 1,
          'matchkey': 1,
          'contestName': {
            '$ifNull': [
              '$contestData.contest_name', ''
            ]
          },
          'win_amount' : '$contestData.win_amount',
          '_id' : '$contestData._id',
          'winning_percentage' : '$contestData.winning_percentage',
          'maximum_user' : '$contestData.maximum_user',
          'joinedusers' : '$contestData.joinedusers',
          'start_date': '$contestData.start_date',
          'end_date': '$contestData.end_date',
          'entryfee': '$contestData.entryfee',
          'start_date': {
            '$ifNull': [
              '$contestData.start_date', '0000-00-00 00:00:00'
            ]
          },
          'status': {
            '$ifNull': [
              {
                '$cond': {
                  'if': {
                    '$lt': [
                      '$contestData.start_date', today
                    ]
                  },
                  'then': 'opened',
                  'else': 'closed'
                }
              }, 'opened'
            ]
          },
          'launch_status': {
            '$ifNull': [
              '$contestData.launch_status', ''
            ]
          },
          'final_status': {
            '$ifNull': [
              '$contestData.final_status', ''
            ]
          },
          'type': {
            '$ifNull': [
              '$contestData.fantasy_type', req.query.stock_contest_cat
            ]
          },
          'available_status': {
            '$ifNull': [
              1, 1
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
        message: 'User Joiend latest 5 Upcoming and live contest data..',
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



  async NewjoinedcontestLive(req) {
    let today = moment().format('YYYY-MM-DD HH:mm:ss');
    console.log(today)
    const JoiendMatches = await joinStockLeagueModel.aggregate(
      [
        {
          '$match': {
            'userid': mongoose.Types.ObjectId('649176380b2d6040b6c2a4ee')
          }
        }, {
          '$group': {
            '_id': '$contestId',
            'contestId': {
              '$first': '$contestId'
            },
            'joinedleaugeId': {
              '$first': '$_id'
            },
            'userid': {
              '$first': '$userid'
            },
            'contestId': {
              '$first': '$contestId'
            },
            'jointeamid': {
              '$first': '$teamid'
            }
          }
        }, {
          '$lookup': {
            'from': 'stock_contests',
            'localField': 'contestId',
            'foreignField': '_id',
            'as': 'contestData'
          }
        }, {
          '$unwind': {
            'path': '$contestData'
          }
        }, {
          '$match': {
            'contestData.fantasy_type': req.query.stock_contest_cat,
            'contestData.isEnable': true,
            'contestData.isCancelled': false
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
            'from': 'join_stock_leagues',
            'let': {
              'contestId': '$contestId',
              'userid': '$userid'
            },
            'pipeline': [
              {
                '$match': {
                  '$expr': {
                    '$and': [
                      {
                        '$eq': [
                          '$contestId', '$$contestId'
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
            '_id': '$joinedleauges.contestId',
            'joinedleaugeId': {
              '$first': '$joinedleauges._id'
            },
            'contestId': {
              '$first': '$contestId'
            },
            'jointeamid': {
              '$first': '$jointeamid'
            },
            'userid': {
              '$first': '$userid'
            },
            'contestData': {
              '$first': '$contestData'
            }
          }
        }, {
          '$addFields': {
            'date': {
              'dateString': '$contestData.start_date'
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
            '_id': 0,
            'date': 1,
            'curDate': 1,
            'matchkey': 1,
            'contestName': {
              '$ifNull': [
                '$contestData.contest_name', ''
              ]
            },
          'win_amount' : '$contestData.win_amount',
          '_id' : '$contestData._id',

          'winning_percentage' : '$contestData.winning_percentage',
          'maximum_user' : '$contestData.maximum_user',
          'joinedusers' : '$contestData.joinedusers',
          'end_date': '$contestData.end_date',
          'entryfee': '$contestData.entryfee',
          'start_date': '$contestData.start_date',
            'start_date': {
              '$ifNull': [
                '$contestData.start_date', '0000-00-00 00:00:00'
              ]
            },
            'status': {
              '$ifNull': [
                {
                  '$cond': {
                    'if': {
                      '$lt': [
                        '$contestData.start_date', today
                      ]
                    },
                    'then': 'closed',
                    'else': 'opened'
                  }
                }, 'opened'
              ]
            },
            'launch_status': {
              '$ifNull': [
                '$contestData.launch_status', ''
              ]
            },
            'final_status': {
              '$ifNull': [
                '$contestData.final_status', ''
              ]
            },
            'type': {
              '$ifNull': [
                '$contestData.fantasy_type', req.query.stock_contest_cat
              ]
            },
            'available_status': {
              '$ifNull': [
                1, 1
              ]
            },
            'joinedcontest': {
              '$ifNull': [
                '$count', 0
              ]
            }
          }
        }
      ]
    );
    if (JoiendMatches.length > 0) {
      return {
        message: 'User Joiend latest 5  live contest data..',
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

  async AllCompletedContest(req) {
    try {
      let today = moment().format('YYYY-MM-DD HH:mm:ss')
      console.log(req.user._id)
      const JoiendMatches = await joinStockLeagueModel.aggregate([
        {
          '$match': {
            'userid': mongoose.Types.ObjectId(req.user._id)
          }
        }, {
          '$group': {
            '_id': '$contestId',
            'contestId': {
              '$first': '$contestId'
            },
            'joinedleaugeId': {
              '$first': '$_id'
            },
            'userid': {
              '$first': '$userid'
            },
            'matchchallengeid': {
              '$first': '$challengeid'
            },
            'jointeamid': {
              '$first': '$teamid'
            }
          }
        }, {
          '$lookup': {
            'from': 'stock_contests',
            'localField': 'contestId',
            'foreignField': '_id',
            'as': 'contestData'
          }
        }, {
          '$unwind': {
            'path': '$contestData'
          }
        }, {
          '$match': {
            'contestData.fantasy_type': req.query.stock_contest_cat,
            'contestData.isEnable': true,
            'contestData.isCancelled': false
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
                          '$userId', mongoose.Types.ObjectId(req.user._id)
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
            'from': 'join_stock_leagues',
            'let': {
              'contestId': '$contestId',
              'userid': '$userid'
            },
            'pipeline': [
              {
                '$match': {
                  '$expr': {
                    '$and': [
                      {
                        '$eq': [
                          '$contestId', '$$contestId'
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
            '_id': '$joinedleauges.challengeid',
            'joinedleaugeId': {
              '$first': '$joinedleauges._id'
            },
            'contestData': {
              '$first': '$contestData'
            },
            'jointeamid': {
              '$first': '$jointeamid'
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
              'dateString': '$contestData.start_date'
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
            '_id': 0,
            'date': 1,
            'curDate': 1,
            'matchkey': 1,
            'contestName': {
              '$ifNull': [
                '$contestData.contest_name', ''
              ]
            },
            'win_amount' : '$contestData.win_amount',
            '_id' : '$contestData._id',
            'winning_percentage' : '$contestData.winning_percentage',
            'maximum_user' : '$contestData.maximum_user',
            'joinedusers' : '$contestData.joinedusers',
            'end_date': '$contestData.end_date',
            'entryfee': '$contestData.entryfee',

            'start_date': '$contestData.start_date',
            'start_date': {
              '$ifNull': [
                '$contestData.start_date', '0000-00-00 00:00:00'
              ]
            },
            'status': {
              '$ifNull': [
                {
                  '$cond': {
                    'if': {
                      '$lt': [
                        '$contestData.start_date', today
                      ]
                    },
                    'then': 'closed',
                    'else': 'opened'
                  }
                }, 'opened'
              ]
            },
            'launch_status': {
              '$ifNull': [
                '$contestData.launch_status', ''
              ]
            },
            'final_status': {
              '$ifNull': [
                '$contestData.final_status', ''
              ]
            },
            'type': {
              '$ifNull': [
                '$contestData.fantasy_type', req.query.stock_contest_cat
              ]
            },
            'available_status': {
              '$ifNull': [
                1, 1
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
          message: 'User Joiend All Completed Contest Data..',
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

module.exports = new overfantasyServices();