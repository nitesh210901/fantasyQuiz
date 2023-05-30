const mongoose=require("mongoose");
const stockContestService = require('../services/stockContestService');
const stockContestModel = require('../../models/stockContestModel');

class challengersController {
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
        }
    }
   
    async viewStockContestPage(req,res,next){
        try{
            res.locals.message = req.flash();
            let fantasy_type=req.query.fantasy_type
            res.render('stockManager/viewStockContest', { sessiondata: req.session.data,fantasy_type });
        }catch(error){
            req.flash('error','something is wrong please try again letter');
            res.redirect('');
        }
    }

    async viewAddStockContestPage(req,res,next){
        try {
            res.locals.message = req.flash();
            // const getContest = await challengersService.getContest(req);
            
            // if (getContest.status==true) {
                res.render("stockManager/addStockContest", { sessiondata: req.session.data, msg:undefined, data: "" });
            // }else{
            //     req.flash('error','page not found ..error..');
            //     res.redirect("/");
            // }

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
                            console.log(postStockContest);
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
                        data.push({
                            's_no': `<div class="custom-control custom-checkbox">
                            <input type="checkbox" class="custom-control-input checkbox" name="checkCat" id="check${index._id}" value="${index._id}">
                            <label class="custom-control-label" for="check${index._id}"></label></div>`,
                            "count" :count,
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
                             "isCancelled":`${cancelstock}`,
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
            console.log('--------------',req.query)
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
            if (getstockdata.status== true) {
                res.render('stockManager/editStockContest',{ sessiondata: req.session.data,getstockdata:getstockdata.StockData});
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
    
}
module.exports = new challengersController();