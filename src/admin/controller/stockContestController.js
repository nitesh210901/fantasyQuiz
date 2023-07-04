const mongoose=require("mongoose");
const stockContestService = require('../services/stockContestService');
const stockContestModel = require('../../models/stockContestModel');
const stockCategoryModel = require("../../models/stockcategoryModel")
const stockContestCategoryModel = require('../../models/stockContestCategory');
const joinStockLeagueModel    = require("../../models/joinStockLeagueModel")
const TransactionModel    = require("../../models/transactionModel")
class stockContestController {
    constructor() {
        return {
            viewStockContestPage: this.viewStockContestPage.bind(this),
            viewAddStockContestPage: this.viewAddStockContestPage.bind(this),
            addStockContest: this.addStockContest.bind(this),
            stockContestDatatable: this.stockContestDatatable.bind(this),
            deleteMultiStockContest: this.deleteMultiStockContest.bind(this),
            addpricecard_page: this.addpricecard_page.bind(this),
            addpriceCard_Post: this.addpriceCard_Post.bind(this),
            addpricecardPostbyPercentage: this.addpricecardPostbyPercentage.bind(this),
            deletepricecard_data: this.deletepricecard_data.bind(this),
            enableDisableContest: this.enableDisableContest.bind(this),
            cancelStockContest: this.cancelStockContest.bind(this),
            editStockContestPage: this.editStockContestPage.bind(this),
            editStockContestData: this.editStockContestData.bind(this),
            launchStockContest: this.launchStockContest.bind(this),
            cancelContestStock: this.cancelContestStock.bind(this),
            updateStockFinalStatus: this.updateStockFinalStatus.bind(this),
            totalJoinedUsers: this.totalJoinedUsers.bind(this),
            totalUserDetailsData: this.totalUserDetailsData.bind(this),
            stockviewtransactions: this.stockviewtransactions.bind(this),
            stockviewTransactionsDataTable: this.stockviewTransactionsDataTable.bind(this),
        }
    }
   
    async viewStockContestPage(req,res,next){
        try{
            res.locals.message = req.flash();
            let fantasy_type = req.query.fantasy_type
            let stock_contest_cat = req.query.stock_contest_cat
            res.render('stockManager/viewStockContest', { sessiondata: req.session.data,fantasy_type,stock_contest_cat});
        }catch(error){
            req.flash('error','something is wrong please try again letter');
            res.redirect('');
        }
    }

    async viewAddStockContestPage(req,res,next){
        try {
            res.locals.message = req.flash();
            let getstockcontestcategory = await stockContestCategoryModel.find({name:{$ne:'CRICKET'}});
            let stockcategory = await stockCategoryModel.find();
            res.render("stockManager/addStockContest", { sessiondata: req.session.data, msg:undefined, data: "",getstockcontestcategory,stockcategory });
        } catch (error) {
              //  next(error);
            req.flash('error','Something went wrong please try again');
            res.redirect("/view-all-global-contests-challengers");
        }
    }

    async addStockContest(req,res,next){
        try {
            res.locals.message = req.flash();
            const postStockContest = await stockContestService.addStockContestData(req);
            if (postStockContest.status == true) {
                if(postStockContest.renderStatus){
                    if(postStockContest.renderStatus=='Amount'){
                            req.flash('success',postStockContest.message);
                            res.redirect(`/addStockpricecard/${postStockContest.data._id}`);
                    }
                    else{
                        req.flash('success',postStockContest.message);
                        res.redirect('/add-stock-contest-page');
                    }
                }
            }else if(postStockContest.status == false){
              console.log("mmm",postStockContest.message)
                req.flash('error',postStockContest.message);
                res.redirect('/add-stock-contest-page');
            }

        } catch (error) {
            //  next(error);
            console.log("error",error)
            req.flash('error','Something went wrong please try again');
            res.redirect("/viewStockContest");
        }
    }

    async stockContestDatatable(req, res, next) {
        try {
            let limit1 = req.query.length;
            let start = req.query.start;
            let sortObject = {},
                dir, join
            let conditions = {};
            if (req.query.searchName) {
                let searchName = req.query.searchName;
                conditions.stock_contest_cat = { $regex: new RegExp("^" + searchName.toLowerCase(), "i") }
            }
            stockContestModel.countDocuments(conditions).exec((err, rows) => {
                let totalFiltered = rows;
                let data = [];
                let count = 1;
                stockContestModel.find(conditions).skip(Number(start) ? Number(start) : '').limit(Number(limit1) ? Number(limit1) : '').exec((err, rows1) => {
                
                    if (err) console.log(err);
                    //  for (let index of rows1){
                        rows1.forEach(async(index)=>{
                        // let catIs=await contestCategoryModel.findOne({_id:index.contest_cat},{name:1,_id:0});
                  
                        let parseCard;
                       if(index.contest_type == 'Amount'){
                        parseCard=`<a href="/addStockpricecard/${index._id}" class="btn btn-sm btn-info w-35px h-35px text-uppercase" data-toggle="tooltip" title="Add / Edit"><i class="fas fa-plus"></i></a>`
                       }else{
                        parseCard=''
                            }
                        let cancelstock;
                        if (index.isCancelled) {
                            cancelstock = `<a href="" class="btn btn-sm btn-danger  text-uppercase" data-toggle="tooltip" title="Check Rank" style="pointer-events: none">Cancelled</a>`
                        } else {
                            cancelstock = `<a href="/cancelStockContest?contestId=${index._id}" class="btn btn-sm btn-danger  text-uppercase" data-toggle="tooltip" title="Check Rank">Cancel Stock</a>`
                            }
                        let launch_contest;
                        if (index.launch_status ==="launched") {
                            launch_contest = `<a href="" class="btn-sm btn my-1 btn-primary w-35px h-35px" data-toggle="tooltip" title="Alreday Launch Contest" style="pointer-events: none"><i class="fas fa-rocket"></i></a>`
                        } else {
                            launch_contest = `<a href="/launch-contest/${index._id}" class="btn-sm btn my-1 btn-primary w-35px h-35px" data-toggle="tooltip" title="Launch Contest"><i class="fas fa-rocket"></i></a>`
                        }
                        data.push({
                            's_no': `<div class="custom-control custom-checkbox">
                            <input type="checkbox" class="custom-control-input checkbox" name="checkCat" id="check${index._id}" value="${index._id}">
                            <label class="custom-control-label" for="check${index._id}"></label></div>`,
                            "count" :count,
                            "contest_name" :`${index.contest_name}`,
                            "stock_contest_cat":`${index.stock_contest_cat}`,
                            "entryfee":`₹ ${index.entryfee}`,
                             "win_amount":`₹ ${index.win_amount}`,
                             "maximum_user" :index.maximum_user,
                            //  "multi_entry" :`${index.multi_entry == 1 ? '<i class="fas fa-check text-success"></i>' : '<i class="fas fa-times text-danger"></i>'}`,
                             "is_running" :`${index.is_running == 1 ? '<i class="fas fa-check text-success"></i>' : '<i class="fas fa-times text-danger"></i>'}`,
                             "confirmed_challenge" :`${index.confirmed_challenge == 1 ? '<i class="fas fa-check text-success"></i>' : '<i class="fas fa-times text-danger"></i>'}`,
                             "is_bonus" :`${index.is_bonus == 1 ? '<i class="fas fa-check text-success"></i>' : '<i class="fas fa-times text-danger"></i>'}`,
                             "amount_type":index.amount_type,
                             "contest_type" :index.contest_type,
                             "edit":parseCard,
                             "isEnable":`<div class="custom-control custom-switch">
                               <input type="checkbox" class="custom-control-input" onchange="enableDisable('${index._id}')" id="customSwitch1'${count}'" checked>
                               <label class="custom-control-label" for="customSwitch1'${count}'"></label>
                             </div>`,
                            "isCancelled": `${cancelstock}`,
                            "launch_status":`${launch_contest}`,
                             "action":`<div class="btn-group dropdown">
                             <button class="btn btn-primary text-uppercase rounded-pill btn-sm btn-active-pink dropdown-toggle dropdown-toggle-icon" data-toggle="dropdown" type="button" aria-expanded="true" style="padding:5px 11px">
                                 Action <i class="dropdown-caret"></i>
                             </button>
                             <ul class="dropdown-menu" style="opacity: 1;">
                                 <li><a class="dropdown-item waves-light waves-effect" href="/edit-stock-contest/${index._id}">Edit</a></li>
                                 <li> <a class="dropdown-item waves-light waves-effect" onclick="delete_sweet_alert('/delete-global-challengers?globelContestsId=${index._id}', 'Are you sure you want to delete this data?')">Delete</a></li>
                             </ul>
                           </div>`,
                        });
                        count++;
                        if (count > rows1.length) {
                            let json_data = JSON.stringify({
                                "recordsTotal": rows,
                                "recordsFiltered": totalFiltered,
                                "data": data
                            });
                            res.send(json_data);
                        }
                    });
                });
            });

        } catch (error) {
            throw error;
        }
    }

    async deleteMultiStockContest(req,res,next){
        try {
            const deleteChallengers=await stockContestService.deleteMultiStockContest(req);
            if(deleteChallengers){
                res.redirect("/viewStockContest")
            }

        } catch (error) {
            //  next(error);
            req.flash('error','Something went wrong please try again');
            res.redirect("/viewStockContest");
    }
    }

    async addpricecard_page(req, res, next) {
        try {
            res.locals.message = req.flash();
            const getdata = await stockContestService.priceCardChallengers(req);
            
            if (getdata.status == true) {
                res.render('stockManager/addPriceCard',{ sessiondata: req.session.data, data:getdata.challenger_Details,contentName:getdata.contest_Name,positionss:getdata.position,priceCardData:getdata.check_PriceCard,tAmount:getdata.totalAmountForPercentage,amount_type:getdata.amount_type})
            }else if(getdata.status == false){
                req.flash('error',getdata.message)
                res.redirect('/viewStockContest')
            }

        } catch (error) {
            //  next(error);
            console.log(error);

            req.flash('error','Something went wrong please try again');
            res.redirect("/viewStockContest");
        }
    }

    async addpriceCard_Post(req,res,next){
        try {
            const postPriceData=await stockContestService.addpriceCard_Post(req);
            if(postPriceData.status==true){
                req.flash('success',postPriceData.message)
                res.redirect(`/addStockpricecard/${req.body.stockcontestId}`);
            }else if(postPriceData.status==false){
                req.flash('error',postPriceData.message)
                res.redirect(`/addStockpricecard/${req.body.stockcontestId}`)
            }else{
                req.flash('error',' Page not Found ')
                res.redirect('/')
            }

        } catch (error) {
            //  next(error);
            req.flash('error','Something went wrong please try again');
            res.redirect("/viewStockContest");
    }
    }
    async addpricecardPostbyPercentage(req,res,next){
        try{
            console.log('ns')
            const postPriceData=await stockContestService.addpricecardPostbyPercentage(req);
         
            if(postPriceData.status==true){
                req.flash('success',postPriceData.message)
                res.redirect(`/addStockpricecard/${req.body.stockcontestId}`);
            }else if(postPriceData.status==false){
                req.flash('error',postPriceData.message)
                res.redirect(`/addStockpricecard/${req.body.stockcontestId}`)
            }else{
                req.flash('error',' Page not Found ')
                res.redirect('/')
            }

        }catch(error){
            //  next(error);
            req.flash('error','Something went wrong please try again');
            res.redirect("/viewStockContest");
        }
    }


    async deletepricecard_data(req,res,next){
        try{
            res.locals.message = req.flash();
            const deletePriceCard=await stockContestService.deletepricecard_data(req);
            if(deletePriceCard.status == true){
                req.flash('success',deletePriceCard.message);
                res.redirect(`/addStockpricecard/${req.query.challengerId}`);
            }else if(deletePriceCard.status == false){
                req.flash('error',deletePriceCard.message);
                res.redirect(`/addStockpricecard/${req.query.challengerId}`);
            }else{
                req.flash('error','server error');
                res.redirect("/");
            }

        }catch(error){
            //  next(error);
            req.flash('error','Something went wrong please try again');
            res.redirect("/viewStockContest");
        }
    }

    async enableDisableContest (req, res, next){
        try {
            const result =  await stockContestService.enableDisableContest(req);
            res.send(result);
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
    async cancelStockContest (req, res, next){
        try {
            res.locals.message = req.flash();
            const stockData =  await stockContestService.cancelStockContest(req);
             res.redirect("/viewStockContest")
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
    async editStockContestPage(req, res, next) {
        try {
            res.locals.message = req.flash();
            const getstockdata = await stockContestService.editStockContestPage(req);
            let getstockcontestcategory = await stockContestCategoryModel.find()
            let stockcategory = await stockCategoryModel.find()
            if (getstockdata.status== true) {
                res.render('stockManager/editStockContest',{ sessiondata: req.session.data,getstockdata:getstockdata.StockData,getstockcontestcategory,stockcategory});
            }else if(getstockdata.status == false){
                req.flash('warning',getstockdata.message);
                res.redirect('/viewStockContest');
            }
        } catch (error) {
            console.log(error);
            req.flash('error','Something went wrong please try again');
            res.redirect("/viewStockContest");
        }
    }
    async editStockContestData(req, res, next) {
        try {
            res.locals.message = req.flash();
            let editContestData = await stockContestService.editStockContestData(req);
            if(editContestData.status == true){
                req.flash('success',editContestData.message);
                res.redirect(`/edit-stock-contest/${req.body.stockContestsId}`);
            }else if(editContestData.status == false){
                req.flash('error',editContestData.message);
                res.redirect(`/edit-stock-contest/${req.body.stockContestsId}`);
            }
        } catch (error) {
            //  next(error);
            req.flash('error','Something went wrong please try again');
            res.redirect("/viewStockContest");
        }
    }

    async launchStockContest (req, res, next){
        try {
            res.locals.message = req.flash();
            const stockData =  await stockContestService.launchStockContest(req);
             res.redirect("/viewStockContest")
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async cancelContestStock(req, res, next) {
        try {
          let dataResponse = await stockContestService.cancelContestStock(req);
          // res.send(dataResponse)
          if (dataResponse.status == true) {
            req.flash("success", dataResponse.message);
            res.redirect(`/viewStockContest`);
          } else if (dataResponse.status == false) {
            req.flash("error", dataResponse.message);
            res.redirect(`/viewStockContest`);
          }
        } catch (error) {
          console.log(error);
          req.flash('error', 'something is wrong please try again letter');
          res.redirect('/');
        }
    }

    async updateStockFinalStatus(req, res, next) {
        try {
          res.locals.message = req.flash();
          if (req.params.status == "winnerdeclared") {
            if (
              req.body.masterpassword &&
              req.body.masterpassword == req.session.data.masterpassword
            ) {
              const getResult = await stockContestService.distributeWinningAmount(req);//need to check becouse crown is remove
    
              let updatestatus = await stockContestModel.updateOne(
                { _id: mongoose.Types.ObjectId(req.params.id) },
                {
                  $set: {
                    final_status: req.params.status,
                    status:"completed"
                  },
                }
              );
              req.flash("success", `contest ${req.params.status} successfully`);
              return res.redirect(`/show-stock-final-result`);
            } else {
              req.flash("error", "Incorrect masterpassword");
              res.redirect(`/show-stock-final-result`);
            }
          } else if (
            req.params.status == "IsAbandoned" ||
            req.params.status == "IsCanceled"
          ) {
            let reason = "";
            if (req.params.status == "IsAbandoned") {
              reason = "Stock Contest abandoned";
            } else {
              reason = "Stock Contest canceled";
            }
            const getResult = await stockContestService.allRefundAmount(req, reason);
            await stockContestService.updateOne(
              { _id: mongoose.Types.ObjectId(req.params.id) },
              {
                $set: {
                  final_status: req.params.status,
                },
              }
            );
            req.flash("success", `Stock Contest ${req.params.status} successfully`);
          }
    
          res.redirect(`/show-stock-final-result`);
          // res.send({status:true});
        } catch (error) {
            console.log(error)
          req.flash('error', 'Something went wrong please try again');
          res.redirect("/");
        }
    }

    async totalJoinedUsers(req, res, next) {
        try {
          res.locals.message = req.flash();
          res.render("stockManager/totalJoinedUsers", {
            sessiondata: req.session.data,
            contestId: req.params.contestId,
            teamName: req.query.teamName,//newnk
            Email: req.query.Email,
            Mobile: req.query.Mobile
          });
        } catch (error) {
          req.flash('error', 'Something went wrong please try again');
          res.redirect("/");
        }
    }
    async totalUserDetailsData(req, res, next) {
        try {
          console.log("-----totaltUserDetailsData table-----contestId--------", req.query.contestId)
          let limit = req.query.length;
          let start = req.query.start;
          let sortObj = {},
            dir,
            join;
          let condition = [];
          condition.push({
            $match: {
                contestId: mongoose.Types.ObjectId(req.query.contestId),
            },
          });
    
          // condition.push({
          //   $lookup: {
          //     from: "users",
          //     localField: "userid",
          //     foreignField: "_id",
          //     as: "userdata",
          //   },
          // });
          //nandlalcode
          let obj = {};
          let match = {};
          if (req.query.teamName != "") {
            match.team = { $regex: req.query.teamName, $options: "i" }
          }
          if (req.query.Email != "") {
            match.email = { $regex: req.query.Email, $options: "i" }
          }
          if (req.query.Mobile != "") {
            match.mobile = Number(req.query.Mobile)
          }
          obj.$match = match;
          if (obj) {
            condition.push({
              $lookup: {
                from: "users",
                localField: "userid",
                foreignField: "_id",
                pipeline: [obj, {
                  $project: {
                    email: 1,
                    mobile: 1,
                    team: 1,
                  }
                }],
                as: "userdata",
              },
            });
          } else {
            condition.push({
              $lookup: {
                from: "users",
                localField: "userid",
                foreignField: "_id",
                pipeline: [{
                  $project: {
                    email: 1,
                    mobile: 1,
                    team: 1,
                  }
                }],
                as: "userdata",
              },
            });
          }//newnk
          //nandlalcode
    
          condition.push({
            $unwind: {
              path: "$userdata",
            },
          });
    
          condition.push({
            $lookup: {
              from: "stock_contests",
              localField: "contestId",
              foreignField: "_id",
              as: "contestdata",
            },
          });
    
          condition.push({
            $unwind: {
              path: "$contestdata",
            },
          });
    
          condition.push({
            $lookup: {
              from: "finalresults",
              localField: "_id",
              foreignField: "joinedid",
              as: "finalResultData"
            }
          },)
          condition.push({
            $unwind: { path: "$finalResultData",preserveNullAndEmptyArrays:true },
            
          })
          joinStockLeagueModel.countDocuments(condition).exec((err, rows) => {
            let totalFiltered = rows;
            let data = [];
            let count = 1;
            joinStockLeagueModel.aggregate(condition).exec((err, rows1) => {
              rows1.forEach(async (doc) => {
                let winnerAmt= 0;
                let rank = 0;
                let points =0;
                if(doc?.finalResultData){
                  if (doc.finalResultData?.prize != "") {
                    winnerAmt = doc.finalResultData?.prize
                  } else {
                    winnerAmt = doc.finalResultData?.amount
                  }
                  rank= doc.finalResultData.rank;
                  points= doc.finalResultData.points;
                }
                
                data.push({
                  count: count,
                  teamName: doc.userdata.team,//nandlal
                  //userName: doc.userdata.username,
                  email: doc.userdata.email,
                  mobile: doc.userdata.mobile,
                  rank: rank,
                  transactionId: doc.transaction_id,
                  points: points,
                  amount: winnerAmt,
                  action: `<a class="btn btn-sm btn-success w-35px h-35px" data-toggle="tooltip" title="View Team" href="/user-teams?teamid=${doc.teamid}" style=""><i class="fas fa-users"></i></a>
                                    <a target="blank" class="btn btn-sm btn-info w-35px h-35px" data-toggle="tooltip" title="View Transaction" href="/stockviewtransactions?userid=${doc.userdata._id}&contestId=${doc.contestId}"><i class="fas fa-eye"></i></a>`,
                });
                count++;
                if (count > rows1.length) {
                  let json_data = JSON.stringify({ data });
                  res.send(json_data);
                }
              });
            });
          });
        } catch (error) {
          next(error);
        }
    }
    
    async stockviewtransactions(req, res, next) {
        try {
          const findTransactions = await stockContestService.stockviewtransactions(req);
          if (findTransactions.status == true) {
            const { start_date, end_date, stockquizId } = req.query;
            res.render("stockManager/viewTransactions", {
              sessiondata: req.session.data,
              findTransactionsId: findTransactions.data.userid,
              start_date: start_date,
              end_date: end_date,
              stockquizId: stockquizId,
            }); 
          }
        } catch (error) {
          console.log(error);

            console
          req.flash("warning", "No transaction to show");
          res.redirect("/");
        }
    }
    
    async stockviewTransactionsDataTable(req, res, next) {
        try {
          let limit1 = req.query.length;
          let start = req.query.start;
          let sortObject = {},
            dir,
            join,
            conditions = { userid: req.params.id };
            console.log(conditions)
          let name;
          if (req.query.start_date) {
            conditions.createdAt = { $gte: new Date(req.query.start_date) };
          }
          if (req.query.end_date) {
            conditions.createdAt = { $lt: new Date(req.query.end_date) };
          }
    
          if (req.query.start_date && req.query.end_date) {
            conditions.createdAt = {
              $gte: new Date(req.query.start_date),
              $lt: new Date(req.query.end_date),
            };
          }
    
          if (req.query.contestId) {
            conditions.contestId = mongoose.Types.ObjectId(req.query.contestId);
          }
    
          let arr_cr = [
            "Bank verification bank bonus",
            "Email Bonus",
            "Mobile Bonus",
            'Pan Bonus',
            "Cash added",
            "Offer bonus",
            "Bonus refer",
            "Series Winning Amount",
            "Refund amount",
            "Challenge Winning Amount",
            "Challenge Winning Gift",
            "Refund",
            "Pan verification pan bonus",
            "special  ",
            "Youtuber Bonus",
            "Referred Signup bonus",
            "Winning Adjustment",
            "Add Fund Adjustments",
            "Bonus Adjustments",
            "Refer Bonus",
            "withdraw cancel",
            "Amount Withdraw Failed",
            'Mobile Bonus',
            'Email Bonus',
            'Signup Bonus',
            'extra cash',
            'Special Bonus',
            'Cash Added',
            'Bank Bonus',
            'Pan Bonus',
            'Refer Bonus',
            'Application download bonus'
          ];
          let arr_db = ["Amount Withdraw", "Contest Joining Fee"];
    
          TransactionModel.countDocuments(conditions).exec((err, rows) => {
            let totalFiltered = rows;
            let data = [];
            let count = 1;
            TransactionModel
              .find(conditions)
              .skip(Number(start) ? Number(start) : "")
              .limit(Number(limit1) ? Number(limit1) : "")
              .sort(sortObject)
              .exec((err, rows1) => {
                if (err) console.log(err);
                rows1.forEach((index) => {
                  const dateby = index.createdAt;
                  let setDate = moment(dateby).format("DD-MM-YYYY");
                  let setTime = moment(dateby).format("h:mm:ss");
                  data.push({
                    id: `<a href="/getUserDetails/${index.userid}">${count}</a>`,
                    date: `<span class="text-warning">${setDate}</span> <span class="text-success">${setTime}</span>`,
                    amt: index.amount,
                    ttype: arr_cr.includes(index.type) ? "Credit" : "Debit",
                    treason: index.type,
                    bonusA: (index.bal_bonus_amt).toFixed(2),
                    bonusC: index.bonus_amt.toFixed(2),
                    bonusD: index.cons_bonus.toFixed(2),
                    winningA: index.bal_win_amt.toFixed(2),
                    winningC: index.win_amt.toFixed(2),
                    winningD: index.cons_win.toFixed(2),
                    balanceA: index.bal_fund_amt.toFixed(2),
                    balanceC: index.addfund_amt.toFixed(2),
                    balanceD: index.cons_amount.toFixed(2),
                    total: index.total_available_amt.toFixed(2),
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
          
        }
      }
    
    
}
module.exports = new stockContestController();