const mongoose=require("mongoose");
const stockContestService = require('../services/stockContestService');
const stockContestModel = require('../../models/stockContestModel');
const stockCategoryModel = require("../../models/stockcategoryModel")
const stockContestCategoryModel = require('../../models/stockContestCategory');

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
                            cancelstock = `<a href="/cancel-stock-contest/${index._id}" class="btn btn-sm btn-danger  text-uppercase" data-toggle="tooltip" title="Check Rank">Cancel Stock</a>`
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
                            "stock_contest_cat":`${index.stock_contest_cat}`,
                            "entryfee":`₹ ${index.entryfee}`,
                             "win_amount":`₹ ${index.win_amount}`,
                             "maximum_user" :index.maximum_user,
                             "multi_entry" :`${index.multi_entry == 1 ? '<i class="fas fa-check text-success"></i>' : '<i class="fas fa-times text-danger"></i>'}`,
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
            res.redirect(`/match-details/${req.params.id}`);
          } else if (dataResponse.status == false) {
            req.flash("error", dataResponse.message);
            res.redirect(`/match-details/${req.params.id}`);
          }
        } catch (error) {
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
    
}
module.exports = new stockContestController();