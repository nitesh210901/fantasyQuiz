const moment = require("moment");

const transactionsModel = require("../../models/transactionModel");
const userModel = require("../../models/userModel");
const matchchallengers = require("../../models/matchChallengersModel");
const finalResultModel = require("../../models/finalResultModel");
const joinedleaugesModel = require("../../models/JoinLeaugeModel");
const youtuberServices = require("../services/youtuberServices");
const notificationModel = require("../../models/notificationModel");
const youtuberBonusModel = require("../../models/youtuberBonusModel");
const utility = require("../../utils/notifications");
const constant = require("../../config/const_credential");
const mongoose = require("mongoose");
const excel = require("exceljs");
const listMatchModel = require('../../models/listMatchesModel');
class youtuberController {
  constructor() {
    return {
      add_youtuber: this.add_youtuber.bind(this),
      add_youtuber_data: this.add_youtuber_data.bind(this),
      view_youtuber: this.view_youtuber.bind(this),
      view_youtuber_dataTable: this.view_youtuber_dataTable.bind(this),
      edit_youtuber: this.edit_youtuber.bind(this),
      edit_youtuber_data: this.edit_youtuber_data.bind(this),
      delete_youtuber: this.delete_youtuber.bind(this),
      viewYoutuberRefer: this.viewYoutuberRefer.bind(this),
      referYoutuberDatatable: this.referYoutuberDatatable.bind(this),
      allYoutuberUser: this.allYoutuberUser.bind(this),
      contestYoutuberUserDatatable: this.contestYoutuberUserDatatable.bind(this),
      youtuberProfitInitiation: this.youtuberProfitInitiation.bind(this),
      downloadAllUserProfitDetails: this.downloadAllUserProfitDetails.bind(this),
      giveYoutuberBonus: this.giveYoutuberBonus.bind(this),
      giveYoutuberProfit: this.giveYoutuberProfit.bind(this),
      isYoutuber: this.isYoutuber.bind(this)
    };
  }


  async add_youtuber(req, res, next) {
    try {
      res.locals.message = req.flash();
      res.render("youtuber/addYoutuber", {
        sessiondata: req.session.data,
        data: undefined,
        msg: undefined,
      });
    } catch (error) {
      // next(error);
      req.flash("error", "Something went wrong please try again");
      res.redirect("/");
    }
  }
  async add_youtuber_data(req, res, next) {
    try {
      res.locals.message = req.flash();
      const addData = await youtuberServices.add_youtuber_data(req);
      if (addData.status == true) {
        req.flash("success", addData.message);
        res.redirect("/add_youtuber");
      } else if (addData.status == false) {
        // req.flash('error', addData.message);
        res.render("youtuber/addYoutuber", {
          sessiondata: req.session.data,
          data: addData.data,
          msg: addData.message,
        });
      }
    } catch (error) {
      // next(error);
      req.flash("error", "Something went wrong please try again");
      res.redirect("/add_youtuber");
    }
  }
  async view_youtuber(req, res, next) {
    try {
      res.locals.message = req.flash();
      let queryData;
      if (req.query) {
        queryData = req.query;
      } else {
        queryData = undefined;
      }
      // console.log("queryData.........", queryData);
      res.render("youtuber/viewYoutuber", {
        sessiondata: req.session.data,
        queryData,
      });
    } catch (error) {
      // next(error);
      req.flash("error", "Something went wrong please try again");
      res.redirect("/");
    }
  }
  async view_youtuber_dataTable(req, res, next) {
    try {
      let limit1 = req.query.length;
      let start = req.query.start;
      let sortObject = {},
        dir,
        join;
      let conditions = { type: constant.USER_TYPE.YOUTUBER };
      if (req.query.name) {
        conditions.username = {
          $regex: new RegExp(req.query.name.toLowerCase(), "i"),
        };
      }
      if (req.query.email) {
        conditions.email = {
          $regex: new RegExp(req.query.email.toLowerCase(), "i"),
        };
      }
      if (req.query.mobile) {
        conditions.mobile = req.query.mobile;
      }

      userModel.countDocuments(conditions).exec((err, rows) => {
        // console.log("rows....................",rows)
        let totalFiltered = rows;
        let data = [];
        let count = 1;
        userModel
          .find(conditions)
          .skip(Number(start) ? Number(start) : "")
          .limit(Number(limit1) ? Number(limit1) : "")
          .exec(async (err, rows1) => {
            if (err) console.log(err);
            rows1.forEach((index) => {
              data.push({
                count: count,
                username: index.username,
                email: index.email,
                mobile: index.mobile,
                decrypted_password: index?.decrypted_password,
                percentage: index.percentage,
                refer_code: index.refer_code,
                // 'total_earned': 0,
                action: `<a class="btn w-35px h-35px mr-1 btn-orange text-uppercase btn-sm" data-toggle="tooltip" title="Edit" href="/edit_youtuber/${index._id}">
                            <i class="fas fa-pencil"></i>
                        </a>
                        <a class="btn w-35px h-35px mr-1 btn-danger text-uppercase btn-sm" data-toggle="tooltip" title="Delete" onclick="delete_sweet_alert('/delete_youtuber/${index._id}', 'Are you sure?')">
                            <i class="far fa-trash-alt"></i>
                        </a>
                       
                        `,
                  // <a class="btn w-35px h-35px mr-1 btn-orange text-uppercase btn-sm" data-toggle="tooltip" title="view" href="/view_youtuber_refer/${index._id}">
                  // <i class="far fa-eye"></i>
                  // </a>
              });
              count++;

              if (count > rows1.length) {
                let json_data = JSON.stringify({
                  recordsTotal: rows,
                  recordsFiltered: totalFiltered,
                  data: data,
                });
                res.send(json_data);
              }
            });
          });
      });
    } catch (error) {
      // next(error);
      req.flash("error", "Something went wrong please try again");
      res.redirect("/view_youtuber");
    }
  }
  async edit_youtuber(req, res, next) {
    try {
      res.locals.message = req.flash();
      const editData = await youtuberServices.edit_youtuber(req);
      if (editData.status == true) {
        res.render("youtuber/editYoutuber", {
          sessiondata: req.session.data,
          data: editData.youtuberData,
        });
      } else if (editData.status == false) {
        req.flash("error", editData.message);
        res.redirect("/view_youtuber");
      }
    } catch (error) {
      // next(error);
      req.flash("error", "Something went wrong please try again");
      res.redirect("/view_youtuber");
    }
  }
  async edit_youtuber_data(req, res, next) {
    try {
      const editPost = await youtuberServices.edit_youtuber_data(req);
      if (editPost.status == true) {
        req.flash("success", editPost.message);
        res.redirect(`/edit_youtuber/${req.params.youtuberId}`);
      } else if (editPost.status == false) {
        req.flash("error", editPost.message);
        res.redirect(`/edit_youtuber/${req.params.youtuberId}`);
      }
    } catch (error) {
      // next(error);
      req.flash("error", "Something went wrong please try again");
      res.redirect("/view_youtuber");
    }
  }
  async delete_youtuber(req, res, next) {
    try {
      const checkYoutuber = await youtuberServices.delete_youtuber(req);
      if (checkYoutuber.status == true) {
        req.flash("success", checkYoutuber.message);
        res.redirect("/view_youtuber");
      } else if (checkYoutuber.status == false) {
        req.flash("error", checkYoutuber.message);
        res.redirect("/view_youtuber");
      }
    } catch (error) {
      next(error);
      // req.flash('error','Something went wrong please try again');
      // res.redirect("/view_youtuber");
    }
  }
  async viewYoutuberRefer(req, res, next) {
    try {
      let fantasy_type = req.query.fantasy_type;

      const data = await youtuberServices.viewYoutuberRefer(req);
      console.log("--data-->>-", data);
      res.locals.message = req.flash();
      let queryData = {};
      if (req.query.end_date) {
        queryData.end_date = req.query.end_date
      }
      if (req.query.start_date) {
        queryData.start_date = req.query.start_date
      }
      if (req.query.match) {
        queryData.match = req.query.match
      }
      res.render("youtuber/viewYoutuberRefer", { sessiondata: req.session.data, youtuber_id: req.params.youtuberId, queryData, data, fantasy_type });

    } catch (error) {
      next(error);
    }
  }
  async referYoutuberDatatable(req, res, next) {
    try {
      let limit1 = req.query.length;
      let start = req.query.start;
      let fantasy_type = req.query.fantasy_type
      console.log("fantasy_type", fantasy_type)
      let sortObject = {},
        dir,
        join;

      let pipeline = [];
      pipeline.push({
        $match: {
          refer_id: mongoose.Types.ObjectId(req.query.youtuber_id),
          user_status: 0,

        }
      })
      pipeline.push({
        $lookup: {
          from: "joinedleauges",
          localField: "_id",
          foreignField: "userid",
          as: "leaugeData"
        }
      })
      pipeline.push({
        $unwind: {
          path: "$leaugeData",
        }
      })
      pipeline.push({
        $lookup: {
          from: "matchchallenges",
          localField: "leaugeData.challengeid",
          foreignField: "_id",
          as: "matchChallangeData"
        }
      })
      pipeline.push({
        $unwind: {
          path: "$matchChallangeData",
        }
      })
      pipeline.push({
        $match: {
          $and: [{
            "matchChallangeData.status": "closed"
          }]
        }
      })
      pipeline.push({
        $lookup: {
          from: "listmatches",
          localField: "leaugeData.matchkey",
          foreignField: "_id",
          as: "listMatchData"
        }
      })
      pipeline.push({
        $unwind: {
          path: "$listMatchData",
        }
      })
      pipeline.push({
        $match: {

          "listMatchData.fantasy_type": fantasy_type

        }
      })
      // pipeline.push({
      //   $match:{
      //     //refer_id:mongoose.Types.ObjectId(req.query.youtuber_id),
      //     //user_status:0,
      //     fantasy_type:fantasy_type
      //   }
      // },)
      pipeline.push({
        $addFields: {
          "bonuse": "$leaugeData.leaugestransaction.bonus",
          "winning": "$leaugeData.leaugestransaction.winning",
          "balance": "$leaugeData.leaugestransaction.balance",
          "matchkey": "$leaugeData.matchkey",
          "leauge_id": "$leaugeData._id",
          "matchChallengeId": "$matchChallangeData._id",
          "listMatchName": "$listMatchData.name",
          "entry_fee": "$matchChallangeData.entryfee",
          "winning_amount": "$matchChallangeData.win_amount",
          "joinedUser": "$matchChallangeData.joinedusers",
          "match_status": "$matchChallangeData.status",
          "maximum_user": "$matchChallangeData.maximum_user",
          "bonus_percentage": "$matchChallangeData.bonus_percentage",
        }
      })
      pipeline.push({
        $group: {
          _id: "",
          bounusSum: { $sum: "$bonuse" },
          count: { $sum: 1 },
          "pings": { "$push": "$$ROOT" }
        }
      })
      pipeline.push({
        $unwind: {
          path: "$pings",
        }
      })
      // const ssdd=await userModel.aggregate(pipeline);
      // console.log("--ssdd-",ssdd)
      userModel.countDocuments(pipeline).exec((err, rows) => {
        // console.log("rows....................",rows)
        let totalFiltered = rows;
        let data = [];
        let count = 1;
        userModel.aggregate(pipeline).exec((err, rows1) => {
          if (err) console.log(err);
          rows1.forEach(async (index) => {
            let challange_bonus_amt = ((index.pings.entry_fee * index.pings.bonus_percentage) / 100).toFixed(2);
            let total_bonus_applied = index.bounusSum;
            let bonus_applied_users = (challange_bonus_amt != 0) ? (total_bonus_applied / challange_bonus_amt) : 0;
            let users_without_bonus = index.pings.maximum_user - Number(bonus_applied_users);
            let totalamount_with_bonus = (index.pings.entry_fee * bonus_applied_users) - total_bonus_applied;
            // console.log("--totalamount_with_bonus-",totalamount_with_bonus)
            let totalamount_without_bonus = (index.pings.entry_fee * users_without_bonus);
            // console.log("--totalamount_without_bonus-",totalamount_without_bonus)
            var t_amut = totalamount_with_bonus + totalamount_without_bonus;
            // console.log("--t_amut--",t_amut)
            let amt_diff = t_amut - index.pings.winning_amount;
            // console.log("--amt_diff--",amt_diff)
            let piple = [];
            piple.push({
              $match: {
                refer_id: mongoose.Types.ObjectId(req.query.youtuber_id)
              }
            })
            piple.push({
              $lookup: {
                from: "joinedleauges",
                localField: "_id",
                foreignField: "userid",
                as: "joinedleaugesData"
              }
            })
            piple.push({
              $unwind: {
                path: "$joinedleaugesData",
              }
            })
            piple.push({
              $match: {
                "$and": [
                  {
                    "joinedleaugesData.leaugestransaction.bonus": { $ne: 0 }
                  },
                  {
                    "joinedleaugesData.challengeid": mongoose.Types.ObjectId(index.pings.matchChallengeId)
                  }
                ],
              }
            });
            piple.push({ $count: "count" });

            const csum = await userModel.aggregate(piple)
            //console.log("--csum--",csum)
            // -------
            let amt_diff1 = (index.pings.entry_fee * index.pings.maximum_user) - index.pings.winning_amount;
            //console.log("--amt_diff1--",amt_diff1)
            let per_user_with_bonus = (((index.pings.entry_fee - index.pings.bonuse) * index.pings.maximum_user) - index.pings.winning_amount) / index.pings.maximum_user;
            let per_user_without_bonus = amt_diff1 / index.pings.maximum_user;
            //console.log("-per_user_without_bonus",per_user_without_bonus)
            let youtuber_users = index.pings.users;
            let youtuber_users_B = 0;
            let youtuber_users_wb = index.count - 0;
            console.log("--youtuber_users_wb",youtuber_users_wb)
            let total_users_without_bonus = ((youtuber_users_wb != 0) ? per_user_without_bonus : 0) * youtuber_users_wb;
            let total_user_with_bonus = per_user_with_bonus * youtuber_users_B;
            let total_utuber_profit = total_user_with_bonus + total_users_without_bonus;
            var t_amut = (index.pings.entry_fee - index.pings.bonuse) * index.pings.maximum_user;
            //      console.log("--t_amut",t_amut);
            let rema_amt = t_amut - index.pings.winning_amount;
            //    console.log("--rema_amt",rema_amt);
            let per_user = rema_amt / index.pings.maximum_user;
            // $per_u_tuber = $per_user*index.pings.users; 
            let per_u_tuber = total_utuber_profit;
            //console.log("--per_u_tuber--",per_u_tuber)
            let net_profit = await userModel.findOne({ _id: mongoose.Types.ObjectId(req.query.youtuber_id), user_status: 0 });

            //  console.log("--net_profit",net_profit)
            let total_profit
            // console.log("net_profit",net_profit)
            if (net_profit) {
              //console.log()
              total_profit = (per_u_tuber * net_profit.percentage) / 100;
              //  console.log("--(per_u_tuber * net_profit.percentage)/100;--",(per_u_tuber * net_profit.percentage)/100)
            } else {
              total_profit = 0;
            }
            //console.log("--total_profit",total_profit)
            const trans = await transactionsModel.findOne({ type: "Affiliate Commission", userid: net_profit._id, challengeid: mongoose.Types.ObjectId(index.pings.matchChallengeId) });
            // console.log("--net_profit._id--",net_profit._id)
            //console.log("---trans--",trans)
            let str = "";
            //console.log("7")
            if (trans) {
              str = 'Already Initiated';
            } else {
              str = `<a href="/utube_profit_initiation?challenge_id=${index.pings.matchChallengeId}&total_profit=${total_profit}&refer_id=${req.query.youtuber_id}">Initiate Profit</a>`;
            }
            //console.log("index.pings.entry_fee",index.pings.entry_fee,"index.pings.maximum_user",index.pings.maximum_user,"index.pings.winning_amount",index.pings.winning_amount)

            if ((index.pings.entry_fee * index.pings.maximum_user) >= index.pings.winning_amount == true) {
              //console.log("(index.pings.entry_fee*index.pings.maximum_user)<=index.pings.winning_amount",(index.pings.entry_fee*index.pings.maximum_user)<=index.pings.winning_amount) 
              //            console.log("8","total_profit",total_profit,"Number(total_profit) > 0",Number(total_profit) > 0)
              if (Number(total_profit) > 0) {
                //      console.log("9")
                let myObj = {
                  'count': count,
                  'name': index.pings.listMatchName,
                  'entryfee': index.pings.entry_fee,
                  'win_amount': index.pings.winning_amount,
                  'maximum_user': index.pings.maximum_user,
                  'users': index.count,
                  'joinedusers': index.pings.joinedUser,
                  'status': index.pings.match_status,
                  'per_person_profit_bonus': Number(((youtuber_users_B != 0) ? per_user_with_bonus : 0)).toFixed(2),
                  'per_person_profit': Number((youtuber_users_wb != 0) ? per_user_without_bonus : 0).toFixed(2),
                  'youtuber_user_profit': Number(per_u_tuber).toFixed(2),
                  'net_profit': Number(total_profit).toFixed(2),
                  'view': `<div class="dropdown profile_details_drop open"><button class="btn btn-primary dropdown-toggle" type="button" data-toggle="dropdown" style="background-color: #767622;border: #767622;" aria-expanded="true">Action<span class="caret"></span></button><ul class="dropdown-menu drp-mnu" style="min-width: 125px; opacity: 1;"><li style="padding-left:10px;"><a href="/all_utuber_user?challenge_id=${index.pings.matchChallengeId}&refer_id=${req.query.youtuber_id}">View</a></li><li style="padding-left:10px;">${str}</li></ul></div>`
                }
                data.push(myObj);
                //    console.log("data11123",data)
              }

              //console.log("--myObj",myObj)

            }
            //    console.log("data1",data)    
            count++;
            if (count > rows1.length) {
              let json_data = JSON.stringify({
                recordsTotal: rows,
                recordsFiltered: totalFiltered,
                data: data,
              });

              res.send(json_data);
            }
          });
        });
      });

    } catch (error) {
      next(error);
    }
  }
  async allYoutuberUser(req, res, next) {
    try {
      let data = {
        refer_id: req.query.refer_id,
        challenge_id: req.query.challenge_id
      }
      res.locals.message = req.flash();
      res.render("youtuber/allYoutuberUser", { sessiondata: req.session.data, data });

    } catch (error) {
      next(error);
    }
  }
  async contestYoutuberUserDatatable(req, res, next) {
    try {
      let challengeid = req.query.challengeid;
      let refer = req.query.refer;
      //  console.log("req------DATATABLE-------controller", req.query);
      let limit1 = req.query.length;
      let start = req.query.start;
      let sortObject = {},
        dir,
        join;
      let conditions = [];
      conditions.push({
        $match: {
          challengeid: mongoose.Types.ObjectId(challengeid)
        }
      })
      conditions.push({
        $lookup: {
          from: "users",
          localField: "userid",
          foreignField: "_id",
          as: "userData"
        }
      })
      conditions.push({
        $unwind: "$userData"
      })
      conditions.push({
        $match: {
          $and: [
            { "userData.refer_id": mongoose.Types.ObjectId(refer) },
            {
              "userData.user_status": 0
            }
          ]
        }
      })

      joinedleaugesModel.countDocuments(conditions).exec((err, rows) => {
        // console.log("rows....................",rows)
        let totalFiltered = rows;
        let data = [];
        let count = 1;
        joinedleaugesModel
          .aggregate(conditions).exec(async (err, rows1) => {
            // console.log("--rows1",rows1)
            if (err) console.log(err);
            rows1.forEach((index) => {
              let obj = {
                "count": count,
                'username': index.userData.username,
                'email': index.userData.email,
                'mobile': index.userData.mobile,
                'refer_code': index.userData.refer_code,
                'status': index.userData.status,
              }
              //  console.log("--obj",obj)
              data.push(obj);
              count++;

              if (count > rows1.length) {
                let json_data = JSON.stringify({
                  recordsTotal: rows,
                  recordsFiltered: totalFiltered,
                  data: data,
                });
                res.send(json_data);
              }
            });
          });
      });

    } catch (error) {
      next(error);
    }
  }
  async youtuberProfitInitiation(req, res, next) {
    try {

      let data = await youtuberServices.youtuberProfitInitiation(req);
      req.flash('success', data.message);
      res.redirect(`/view_youtuber_refer/${req.query.refer_id}`)

    } catch (error) {
      next(error);
    }
  }
  async isYoutuber(id) {
    const user = await userModel.findOne({ _id: ObjectId(id) });
    const referId = user.refer_id;
    const isYoutuber = await userModel.findOne({ _id: ObjectId(referId), type: 'youtuber' });
    return isYoutuber ? referId : false;
  }

  async giveYoutuberProfit(youtuber, profit, fromId, matchKey, challengeId, joinId) {
    //cut tds amount
    let user = await userModel.findOne({ _id: youtuber });
    const youtuberCurrentWallet = user.userbalance;
    const existTransaction = await transactionsModel.findOne({ type: 'Affiliate Commission', challengeid: challengeId, userid: youtuber });
    if (!existTransaction) {
      // Make a transaction
      const bonus = parseFloat(user.userbalance.bonus.toFixed(2));
      const balance = parseFloat(user.userbalance.balance.toFixed(2));
      const winning = parseFloat(user.userbalance.winning.toFixed(2));
      const totalBalance = bonus + balance + winning;
      let bal_win_amt =  winning + Number(profit);
      const userObj = {
        'userbalance.balance': balance,
        'userbalance.bonus': bonus,
        'userbalance.winning': bal_win_amt
    };
      let totalAvailableAmt = totalBalance + Number(profit)
      const transactionsData = {
        userid: youtuber,
        type: 'Affiliate Commission',
        transaction_id: `${constant.APP_SHORT_NAME}-YP-${new Date().getTime()}${youtuber}`,
        transaction_by: 'wallet',
        challengeid: challengeId,
        amount: profit,
        paymentstatus: 'confirmed',
        bal_fund_amt: balance,
        bal_win_amt: bal_win_amt,
        bal_bonus_amt: bonus,
        total_available_amt: totalAvailableAmt
      };
      await Promise.all([
          userModel.findOneAndUpdate({ _id: youtuberCurrentWallet._id }, userObj, { new: true }),
          transactionsModel.create(transactionsData),
      ]);
    }

    for (let i = 0; i < fromId.length; i++) {
      const youtuberBonus = {
        userid: youtuber,
        fromid: fromId[i],
        amount: (profit / fromId.length).toFixed(2),
        type: 'Affiliate Commission',
        matchkey: matchKey,
        joinid: joinId[i],
        challengeid: challengeId,
        txnid: `${constant.APP_SHORT_NAME}-YP-${new Date().getTime()}${youtuber}`
      };
      const existData = await youtuberBonusModel.findOne({ matchkey: matchKey, joinid: joinId[i] });
      if (!existData) {
       await youtuberBonusModel.create(youtuberBonus);
      }
    }
  }

  async giveYoutuberBonus(req, res) {
    try {
      const matchkey = req.query.matchkey;
      let checkYoutuberStatus = await listMatchModel.findOne({_id:matchkey, youtuberStatus:true});
      if(checkYoutuberStatus){
        res.send({success:false,message:'Already give you tuber bonus of this match'});
        return true;
      }
      const challenges = await matchchallengers.find({
        matchkey,
        status: { $ne: 'canceled' },
        entryfee: { $ne: 0 }
      }, {
          id: 1,
          entryfee: 1,
          is_bonus: 1,
          bonus_percentage: 1,
          joinedusers: -1
        }).sort({ joinedusers: -1 });
      if (challenges.length > 0) {
        for (const challenge of challenges) {
          const jlTotalUsers = await joinedleaugesModel.countDocuments({ challengeid: challenge.id });

          const challengeJoinedUsers = await joinedleaugesModel.aggregate([
            { $match: { challengeid: mongoose.Types.ObjectId(challenge._id) } },
            {
              $lookup: {
                from: 'users',
                localField: 'userid',
                foreignField: '_id',
                as: 'reg'
              }
            },
            {
              $lookup: {
                from: 'users',
                localField: 'reg.refer_id',
                foreignField: '_id',
                as: 'reg2'
              }
            },
            {
              $unwind: '$reg2'
            },
            {
              $match: { 'reg2.type': 'youtuber' }
            },
            
            {
              $unwind: '$reg'
            },
            {
              $project: {
                userid: 1,
                id: 1,
                'reg.refer_id': 1,
                'reg2.type': 1,
                'reg.type': 1
              }
            }
          ]);
          console.log('challengeJoinedUsers',challengeJoinedUsers);
          const grouped = challengeJoinedUsers.reduce((acc, cur) => {
            const { refer_id } = cur.reg;
            let referId= refer_id.toString();
            if (acc[referId]) {
              acc[referId].push(cur);
            } else {
              acc[referId] = [cur];
            }
            return acc;
          }, {});

          // Admin Amt Received
          let adminAmtReceived;
          if (challenge.is_bonus) {
            const bonusAllowed = (challenge.entryfee * challenge.bonus_percentage) / 100;
            const remainingEntryfee = challenge.entryfee - bonusAllowed;
            adminAmtReceived = remainingEntryfee * jlTotalUsers;
          } else {
            adminAmtReceived = challenge.entryfee * jlTotalUsers;
          }
          
          // Final Result Amount
          const finalResultAmt = await finalResultModel.aggregate([
            { $match: { challengeid: mongoose.Types.ObjectId(challenge._id) } },
            {
              $group: {
                _id: null,
                amount: { $sum: '$amount' }
              }
            }
          ]);
          const profit = finalResultAmt[0].amount > adminAmtReceived ? finalResultAmt[0].amount - adminAmtReceived : adminAmtReceived - finalResultAmt[0].amount;
          
          // Give youtuber profit according to percentage
          if (Object.keys(grouped).length > 0) {
            for (const [youtuber, totalRefer] of Object.entries(grouped)) {
              const youtuberPercentage = await userModel.findOne({ _id: youtuber }, { percentage: 1 });
              const youtuberProfit = ((profit * totalRefer.length / jlTotalUsers) * youtuberPercentage.percentage) / 100;
              const formattedProfit = youtuberProfit.toFixed(2);

              const fromIds = totalRefer.map(refer => refer.userid);
              const joinIds = totalRefer.map(refer => refer._id);
              await this.giveYoutuberProfit(youtuber, formattedProfit, fromIds, matchkey, challenge.id, joinIds);
            }
          }
        }
        console.log('req.query.matchkey',req.query.matchkey);
         await listMatchModel.updateOne(
          { _id: mongoose.Types.ObjectId(req.query.matchkey) },
          {
            $set: {
              youtuberStatus: true,
            },
          }
        );
      }
      res.redirect(`/match-score/${req.query.matchkey}`);
    }
    catch (error) {
      console.log('error===>',error);
    }
  }


  /* give_Youtuber_profit
  const db = require('path/to/db'); // import database module
const Helpers = require('path/to/helpers'); // import Helpers module
const moment = require('moment'); // import moment module

class YoutuberBonusController {
  constructor() {
    this.youtubers = [];
  }

  give_youtuber_bonus(request) {
    const matchkey = request.query.matchkey;
    db.query(`SELECT id, entryfee, is_bonus, bonus_percentage FROM matchchallenges WHERE matchkey = ? AND status != 'canceled' AND entryfee != 0 ORDER BY joinedusers DESC`, [matchkey], (error, challenges) => {
      if (error) throw error;

      if (challenges.length > 0) {
        challenges.forEach((challenge) => {
          db.query(`SELECT COUNT(*) AS jl_totalusers FROM joinedleauges WHERE challengeid = ?`, [challenge.id], (error, jl_totalusers) => {
            if (error) throw error;

            db.query(`SELECT jl.userid, jl.id, reg.refer_id, reg2.type AS ref, reg.type AS usertype FROM joinedleauges AS jl JOIN registerusers AS reg ON jl.userid = reg.id JOIN registerusers AS reg2 ON reg.refer_id = reg2.id WHERE jl.challengeid = ? AND reg2.type = 'youtuber'`, [challenge.id], (error, challenge_joined_users) => {
              if (error) throw error;

              const grouped = challenge_joined_users.reduce((accumulator, currentValue) => {
                (accumulator[currentValue.refer_id] = accumulator[currentValue.refer_id] || []).push(currentValue);
                return accumulator;
              }, {});

              let admin_amt_received;
              if (challenge.is_bonus) {
                const bonus_allowed = (challenge.entryfee * challenge.bonus_percentage) / 100;
                const remaining_entryfee = challenge.entryfee - bonus_allowed;
                admin_amt_received = remaining_entryfee * jl_totalusers[0].jl_totalusers;
              } else {
                admin_amt_received = challenge.entryfee * jl_totalusers[0].jl_totalusers;
              }

              db.query(`SELECT SUM(amount) AS final_result_amt FROM finalresults WHERE challengeid = ?`, [challenge.id], (error, final_result_amt) => {
                if (error) throw error;

                const profit = final_result_amt[0].final_result_amt > admin_amt_received ? final_result_amt[0].final_result_amt - admin_amt_received : admin_amt_received - final_result_amt[0].final_result_amt;

                if (Object.keys(grouped).length > 0) {
                  for (const youtuber in grouped) {
                    db.query(`SELECT percentage FROM registerusers WHERE id = ?`, [youtuber], (error, percentage) => {
                      if (error) throw error;

                      const youtuber_profit = ((profit * grouped[youtuber].length / jl_totalusers[0].jl_totalusers) * percentage[0].percentage) / 100;
                      const fromid = grouped[youtuber].map((item) => item.userid);
                      const joinid = grouped[youtuber].map((item) => item.id);
                      this.give_youtuber_profit(youtuber, youtuber_profit, fromid, matchkey, challenge.id, joinid);
                    });
                  }
                }
              });
            });
          });
        });
      }
    });
  }

  give_youtuber_profit(youtuber, youtuber_profit, fromid, matchkey, challengeid, joinid) {
    db.query(`UPDATE registerusers SET balance = balance + ? WHERE id = ?`, [yout

  */

  async downloadAllUserProfitDetails(req, res, next) {
    try {
      // let data=await youtuberServices.downloadAllUserProfitDetails(req);
      let matchYoutuber = [];
      let count = 1;
      console.log("req------DATATABLE-------controller", req.query);
      let limit1 = req.query.length;
      let start = req.query.start;
      let sortObject = {},
        dir,
        join;

      let pipeline = [];
      pipeline.push({
        $match: {
          refer_id: mongoose.Types.ObjectId(req.query.youtuber_id),
          user_status: 0
        }
      })
      pipeline.push({
        $lookup: {
          from: "joinedleauges",
          localField: "_id",
          foreignField: "userid",
          as: "leaugeData"
        }
      })
      pipeline.push({
        $unwind: {
          path: "$leaugeData",
        }
      })
      pipeline.push({
        $lookup: {
          from: "matchchallenges",
          localField: "leaugeData.challengeid",
          foreignField: "_id",
          as: "matchChallangeData"
        }
      })
      pipeline.push({
        $unwind: {
          path: "$matchChallangeData",
        }
      })
      pipeline.push({
        $match: {
          $and: [{
            "matchChallangeData.status": "closed"
          }]
        }
      })
      pipeline.push({
        $lookup: {
          from: "listmatches",
          localField: "leaugeData.matchkey",
          foreignField: "_id",
          as: "listMatchData"
        }
      })
      pipeline.push({
        $unwind: {
          path: "$listMatchData",
        }
      })
      pipeline.push({
        $addFields: {
          "bonuse": "$leaugeData.leaugestransaction.bonus",
          "winning": "$leaugeData.leaugestransaction.winning",
          "balance": "$leaugeData.leaugestransaction.balance",
          "matchkey": "$leaugeData.matchkey",
          "leauge_id": "$leaugeData._id",
          "matchChallengeId": "$matchChallangeData._id",
          "listMatchName": "$listMatchData.name",
          "entry_fee": "$matchChallangeData.entryfee",
          "winning_amount": "$matchChallangeData.win_amount",
          "joinedUser": "$matchChallangeData.joinedusers",
          "match_status": "$matchChallangeData.status",
          "maximum_user": "$matchChallangeData.maximum_user",
          "bonus_percentage": "$matchChallangeData.bonus_percentage",

        }
      })
      pipeline.push({
        $group: {
          _id: "",
          bounusSum: { $sum: "$bonuse" },
          count: { $sum: 1 },
          "pings": { "$push": "$$ROOT" }
        }
      })
      pipeline.push({
        $unwind: {
          path: "$pings",
        }
      })
      let mydata = await userModel.aggregate(pipeline);

      //  await mydata.forEach(async(index) => {
      for await (let index of mydata) {

        // }
        let challange_bonus_amt = ((index.pings.entry_fee * index.pings.bonus_percentage) / 100).toFixed(2);
        let total_bonus_applied = index.bounusSum;
        let bonus_applied_users = (challange_bonus_amt != 0) ? (total_bonus_applied / challange_bonus_amt) : 0;
        let users_without_bonus = index.pings.maximum_user - Number(bonus_applied_users);
        let totalamount_with_bonus = (index.pings.entry_fee * bonus_applied_users) - total_bonus_applied;
        // console.log("--totalamount_with_bonus-",totalamount_with_bonus)
        let totalamount_without_bonus = (index.pings.entry_fee * users_without_bonus);
        // console.log("--totalamount_without_bonus-",totalamount_without_bonus)
        var t_amut = totalamount_with_bonus + totalamount_without_bonus;
        // console.log("--t_amut--",t_amut)
        let amt_diff = t_amut - index.pings.winning_amount;
        // console.log("--amt_diff--",amt_diff)
        let piple = [];
        piple.push({
          $match: {
            refer_id: mongoose.Types.ObjectId(req.query.youtuber_id)
          }
        })
        piple.push({
          $lookup: {
            from: "joinedleauges",
            localField: "_id",
            foreignField: "userid",
            as: "joinedleaugesData"
          }
        })
        piple.push({
          $unwind: {
            path: "$joinedleaugesData",
          }
        })
        piple.push({
          $match: {
            "$and": [
              {
                "joinedleaugesData.leaugestransaction.bonus": { $ne: 0 }
              },
              {
                "joinedleaugesData.challengeid": mongoose.Types.ObjectId(index.pings.matchChallengeId)
              }
            ],
          }
        });
        piple.push({ $count: "count" });

        const csum = await userModel.aggregate(piple)
        console.log("--csum--", csum)
        // -------
        let amt_diff1 = (index.pings.entry_fee * index.pings.maximum_user) - index.pings.winning_amount;
        // console.log("--amt_diff1--",amt_diff1)
        let per_user_with_bonus = (((index.pings.entry_fee - index.pings.bonuse) * index.pings.maximum_user) - index.pings.winning_amount) / index.pings.maximum_user;
        let per_user_without_bonus = amt_diff1 / index.pings.maximum_user;
        // console.log("-per_user_without_bonus",per_user_without_bonus)
        let youtuber_users = index.pings.users;
        let youtuber_users_B = 0;
        let youtuber_users_wb = index.count - 0;
        // console.log("--youtuber_users_wb",youtuber_users_wb)
        let total_users_without_bonus = ((youtuber_users_wb != 0) ? per_user_without_bonus : 0) * youtuber_users_wb;
        let total_user_with_bonus = per_user_with_bonus * youtuber_users_B;
        let total_utuber_profit = total_user_with_bonus + total_users_without_bonus;
        var t_amut = (index.pings.entry_fee - index.pings.bonuse) * index.pings.maximum_user;
        // console.log("--t_amut",t_amut);
        let rema_amt = t_amut - index.pings.winning_amount;
        // console.log("--rema_amt",rema_amt);
        let per_user = rema_amt / index.pings.maximum_user;
        // $per_u_tuber = $per_user*index.pings.users; 
        let per_u_tuber = total_utuber_profit;
        // console.log("--per_u_tuber--",per_u_tuber)
        let net_profit = await userModel.findOne({ _id: mongoose.Types.ObjectId(req.query.youtuber_id), user_status: 0 });

        console.log("--net_profit", net_profit)
        let total_profit
        if (net_profit) {
          total_profit = (per_u_tuber * net_profit.percentage) / 100;
          // console.log("--(per_u_tuber * net_profit.percentage)/100;--",(per_u_tuber * net_profit.percentage)/100)
        } else {
          total_profit = 0;
        }
        if ((index.pings.entry_fee * index.pings.maximum_user) <= index.pings.winning_amount) {
          continue;
        } else {
          let obj = {
            'count': count,
            'name': index.pings.listMatchName,
            'entryfee': index.pings.entry_fee,
            'win_amount': index.pings.winning_amount,
            'maximum_user': index.pings.maximum_user,
            'users': index.count,
            'joinedusers': index.pings.joinedUser,
            'status': index.pings.match_status,
            'per_person_profit_bonus': Number(((youtuber_users_B != 0) ? per_user_with_bonus : 0)).toFixed(2),
            'per_person_profit': Number((youtuber_users_wb != 0) ? per_user_without_bonus : 0).toFixed(2),
            'youtuber_user_profit': Number(per_u_tuber).toFixed(2),
            'net_profit': Number(total_profit).toFixed(2),
          }
          matchYoutuber.push(obj);
          count++;
        }
      }
      let workbook = new excel.Workbook();
      let worksheet = await workbook.addWorksheet("matchYoutuber");
      worksheet.columns = [
        { header: "count", key: "count", width: 5 },
        { header: "name", key: "name", width: 20 },
        { header: "entryfee", key: "entryfee", width: 30 },
        { header: "win_amount", key: "win_amount", width: 12 },
        { header: "maximum_user", key: "maximum_user", width: 15 },
        { header: "users", key: "users", width: 15 },
        { header: "joinedusers", key: "joinedusers", width: 12 },
        { header: "status", key: "status", width: 18 },
        { header: "per_person_profit_bonus", key: "per_person_profit_bonus", width: 18 },
        { header: "per_person_profit", key: "per_person_profit", width: 18 },
        { header: "youtuber_user_profit", key: "youtuber_user_profit", width: 18 },
        { header: "net_profit", key: "net_profit", width: 18 },
      ];
      // Add Array Rows
      worksheet.addRows(matchYoutuber);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=" + "youtuberrefermatch.xlsx"
      );
      return workbook.xlsx.write(res).then(function () {
        res.status(200).end();
      });

    } catch (error) {
      next(error);
    }

  }
}
module.exports = new youtuberController();
