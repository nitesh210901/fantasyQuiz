const mongoose = require("mongoose");
const moment = require("moment");
// const stocksOfCategoryModel = require("../../models/stocksOfCategoryModel");
const stockCategoryModel = require("../../models/stockcategoryModel");
const stockContestModel = require("../../models/stockContestModel");
const stockModel = require("../../models/stockModel");
const stockContestService = require("../services/stockContestService");

class stockCategory {
    constructor() {
        return {
            viewStockDatabale: this.viewStockDatabale.bind(this),
            viewStock: this.viewStock.bind(this),
            saveStockCategory: this.saveStockCategory.bind(this),
            addStockCategoryPage: this.addStockCategoryPage.bind(this),
            viewCategoryStockDatabale: this.viewCategoryStockDatabale.bind(this),
            enableDisableStock: this.enableDisableStock.bind(this),
            showStockFinalResult: this.showStockFinalResult.bind(this),
            showStockResulTable: this.showStockResulTable.bind(this),
            saveStocks: this.saveStocks.bind(this),
            saveCurrentPriceOfStock: this.saveCurrentPriceOfStock.bind(this),
            updateResultStocks: this.updateResultStocks.bind(this),

        }
    }

  async addStockCategoryPage(req, res) {
      try {
          res.locals.message = req.flash();
          let name = req.query.name;
          console.log("dedododkodkodkos")
          const categories = await stockCategoryModel.find({}, {name:1});
          res.render("stockManager/addCategoryStockCategory", { sessiondata: req.session.data, name, categories});

      } catch (error) {
          req.flash('error', 'Something went wrong please try again');
          res.redirect("/");
      }
  }

  async showStockFinalResult(req, res) {
    try {
        res.locals.message = req.flash();
        let name = req.query.name;
        const stockData = await stockContestModel.find({launch_status:'launched', status:'started', final_status:'pending'});
        res.render("stockManager/finalStockResult", { sessiondata: req.session.data, name, stockData});

    } catch (error) {
        req.flash('error', 'Something went wrong please try again');
        res.redirect("/");
    }
}

  async viewStock(req, res) {
      try {
          res.locals.message = req.flash();
          let name = req.query.name;
          let catName = req.query.category;
          let stockType = req.query.stockType;
          const categories = await stockCategoryModel.find({}, { name: 1 });
          res.render("stockManager/viewStock", { sessiondata: req.session.data, name , categories, catName, stockType});

      } catch (error) {
          req.flash('error', 'Something went wrong please try again');
          res.redirect("/");
      }
  }

  async viewStockDatabale(req, res) {
      try {

          let limit1 = req.query.length;
          let start = req.query.start;
          let rows;
          let stockCategory = req.query.stockcategory;
          let stockType = req.query.stockType;
            if (stockCategory != 'null') {

              rows = await stockCategoryModel.aggregate(
                [
                  {
                    '$match': {
                      '_id': new mongoose.Types.ObjectId(stockCategory),
                    }
                  },
                  {
                    '$addFields': {
                      'sidArray': {
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
                        'sid': '$sidArray'
                      }, 
                      'pipeline': [
                        {
                          '$match': {
                            '$expr': {
                              '$in': [
                                '$_id', '$$sid'
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
                    '$replaceRoot': {
                      'newRoot': '$result'
                    }
                  }
                ]
              )
          }else{
            let conditions
              if(stockType != 'null'){
                conditions = {"exchange" : stockType}
              } else {
                conditions = {}
            }
              rows = await stockModel.countDocuments(conditions);
              rows = await stockModel.find(conditions).skip(Number(start) ? Number(start) : '').limit(Number(limit1) ? Number(limit1) : '').sort({ Order: -1 });
        }
              let totalFiltered = rows;
              let data = [];
              let count = 1;
                  for (let index of rows) {

                      let image;
                      if (index.image) {
                          image = `<img src="${index.image}" class="w-40px view_team_table_images h-40px rounded-pill">`
                      } else {
                          image = `<img src="/uploadImage/defaultImage.jpg" class="w-40px view_team_table_images h-40px rounded-pill">`
                      }
                      let btnStatus;

                      if(index.isEnable == true)btnStatus = 'Disable';
                      else btnStatus = 'Enable'

                      data.push({
                          // 's_no': `<div class="custom-control custom-checkbox">
                          // <input type="checkbox" class="custom-control-input checkbox" name="checkCat" id="check${index._id}" value="${index._id}">
                          // <label class="custom-control-label" for="check${index._id}"></label></div>`,
                          'count': count,
                          'instrument_token': index.instrument_token,
                          'exchange_token': index.exchange_token,
                          'tradingsymbol': index.tradingsymbol,
                          'name': index.name,
                          "expiry": index.expiry,
                          "strike": index.strike,
                          "tick_size": index.tick_size,
                          "lot_size": index.lot_size,
                          "instrument_type": index.instrument_type,
                          "segment": index.segment,
                          "exchange": index.exchange,
                          "action": `<div>
                            <a class="btn btn-primary btn-md rounded-pill" href="/enable-disble-stock?id=${index._id}">${btnStatus}</a>
                          </div>`,
                      });
                      count++;

                      if (count > rows.length) {
                          let json_data = JSON.stringify({
                              "recordsTotal": rows,
                              "recordsFiltered": totalFiltered,
                              "data": data
                          });
                          res.send(json_data);

                      }
                  }
      } catch (error) {
          throw error;
      }
  }
  
  async viewCategoryStockDatabale(req, res, next) {
    try {
        let limit1 = req.query.length;
        let start = req.query.start;
        let sortObject = {},
            dir, join
        let conditions = {};
        if (req.query.searchName) {
            let searchName = req.query.searchName;
            conditions.name = { $regex: new RegExp("^" + searchName.toLowerCase(), "i") }
           
        }
        conditions.isEnable = "true"
        stockModel.countDocuments(conditions).exec((err, rows) => {
            let totalFiltered = rows;
            let data = [];
            let image;
            let count = 1;
            stockModel.find(conditions).skip(Number(start) ? Number(start) : '').limit(Number(limit1) ? Number(limit1) : '').sort({ Order: -1 }).exec(async (err, rows1) => {
                if (err) console.log(err);
                for (let index of rows1) {

                    if (index.image) {
                        image = `<img src="${index.image}" class="w-40px view_team_table_images h-40px rounded-pill">`
                    } else {
                        image = `<img src="/uploadImage/defaultImage.jpg" class="w-40px view_team_table_images h-40px rounded-pill">`
                    }
                   
                    data.push({
                        's_no': `<div class="custom-control custom-checkbox">
                        <input type="checkbox" class="custom-control-input checkbox" name="checkCat" id="check${index._id}" value="${index._id}">
                        <label class="custom-control-label" for="check${index._id}"></label></div>`,
                        'count': count,
                        'instrument_token': index.instrument_token,
                        'exchange_token': index.exchange_token,
                        'tradingsymbol': index.tradingsymbol,
                        'name': index.name,
                        "expiry": index.expiry,
                        "strike": index.strike,
                        "tick_size": index.tick_size,
                        "lot_size": index.lot_size,
                        "instrument_type": index.instrument_type,
                        "segment": index.segment,
                        "exchange": index.exchange,
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
                }
            });
        });
    } catch (error) {
        throw error;
    }
}

  async saveStockCategory(req, res) {
      try {
          const saveCategory = await stockCategoryModel.findOneAndUpdate({_id:req.body.category_id}, {stocks_id:req.body.stocks_id});
          res.send({data:saveCategory});
      } catch (error) {
          console.log(error);
          throw error;
      }
  }

  async enableDisableStock(req, res) {
    try {
        const data = await stockModel.findOne({_id:req.query.id});
        if(data.isEnable == true)data.isEnable = false;
        else data.isEnable = true;
        await data.save();
        res.redirect('back');
    } catch (error) {
        console.log(error);
        throw error;
    }
  }

  async showStockResulTable(req, res, next) {
    try {
      let condition = {};
      // condition = {"fantasy_type":req.query.fantasy_type, "launch_status":"launched", "status":"started" , final_status:"pending"};

      stockContestModel.countDocuments({condition}).exec((err, rows) => {
        let totalFiltered = rows;
        let data = [];
        let count = 1;

        stockContestModel.find(condition).exec((err, rows1) => {
          rows1.forEach(async (doc) => {
            let dateFormat = moment(`${doc.start_date}`, "YYYY-MM-DD HH:mm:ss");
            let day = dateFormat.format("dddd");
            let date = dateFormat.format("YYYY-MM-DD");
            let time = dateFormat.format("hh:mm:ss a");
            let constest_status = "";
            // console.log("-------------doc.status -------------------",doc.status ,"-----------doc.name----------",doc.name)
            if (doc.status != "notstarted") {
              if (doc.final_status == "pending") {
                constest_status = `<div class="row">
                                                <div class="col-12 my-1">
                                                    <a class="text-info text-decoration-none font-weight-600" onclick="delete_sweet_alert('/cancelStockContest?contestId=${doc._id}&status=IsAbandoned', 'Are you sure you want to Abandoned this stock contest?')">
                                                        Is Abandoned
                                                        &nbsp;
                                                        <i class="fad fa-caret-right"></i>
                                                    </a>
                                                </div>
                                                <div class="col-12 my-1">
                                                    <a class="text-danger text-decoration-none font-weight-600" onclick="delete_sweet_alert('/cancelStockContest?contestId=${doc._id}&status=IsCanceled', 'Are you sure you want to cancel this stock contest?')">
                                                        Is Canceled
                                                        &nbsp;
                                                        <i class="fad fa-caret-right"></i>
                                                    </a>
                                                </div>
                                            </div>`;
              } else if (doc.final_status == "IsReviewed") {
                constest_status = `<div class="row">
                                        <div class="col-12 my-1">
                                            <a class="text-warning text-decoration-none font-weight-600" href="">
                                                Is Reviewed
                                                &nbsp;
                                                <i class="fad fa-caret-right"></i>
                                            </a>
                                        </div>
                                        <div class="col-12 my-1">
                                            <a class="text-success text-decoration-none font-weight-600 pointer" data-toggle="modal" data-target="#keys${count}">
                                                Is Winner Declared
                                                &nbsp;
                                                <i class="fad fa-caret-right"></i>
                                            </a>
                                        </div>
                                        <div class="col-12 my-1">
                                            <a class="text-info text-decoration-none font-weight-600" onclick="delete_sweet_alert('/cancelStockContest?contestId=${doc._id}&status=IsAbandoned', 'Are you sure you want to Abandoned this stock contest?')">
                                                Is Abandoned
                                                &nbsp;
                                                <i class="fad fa-caret-right"></i>
                                            </a>
                                        </div>
                                        <div class="col-12 my-1">
                                            <a class="text-danger text-decoration-none font-weight-600" onclick="delete_sweet_alert('/cancelStockContest?contestId=${doc._id}&status=IsCanceled', 'Are you sure you want to cancel this stock contest?')">
                                                Is Canceled
                                                &nbsp;
                                                <i class="fad fa-caret-right"></i>
                                            </a>
                                        </div>
                                    </div>
                                    
                                <div id="keys${count}" class="modal fade" role="dialog" >
                                <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable  w-100 h-100">
                                    <div class="modal-content">
                                    <div class="modal-header">
                                        <h4 class="modal-title">Stock IsWinnerDeclared</h4>
                                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                                    </div>
                                    <div class="modal-body abcd">
                                        <form action="/updateStockFinalStatus/${doc._id}/winnerdeclared" method="post">
                                        <div class="col-md-12 col-sm-12 form-group">
                                        <label> Enter Your Master Password </label>
                                      
                                        <input type="password"  name="masterpassword" class="form-control form-control-solid" placeholder="Enter password here">
                                        </div>
                                        <div class="col-auto text-right ml-auto mt-4 mb-2">
                                        <button type="submit" class="btn btn-sm btn-success text-uppercase "><i class="far fa-check-circle"></i>&nbsp;Submit</button>
                                        </div>
                                        </form>
                                    </div>
                                    <div class="modal-footer">
                                        <button type="button" class="btn btn-sm btn-default" data-dismiss="modal" >Close</button>
                                    </div>
                                    </div>
                                </div>
                                </div>`;
              } else if (doc.final_status == "winnerdeclared") {
                constest_status = `<div class="row">
                                    <div class="col-12 my-1">
                                        <span class="text-success text-decoration-none font-weight-600 pointer" data-toggle="modal" data-target="#keys4">
                                            Winner Declared
                                            &nbsp;
                                        </span>
                                    </div>
                                </div>`;
              } else {
                constest_status = ``;
              }
            } else {
              constest_status = "";
              constest_status = `<div class="row">
                                <div class="col-12 my-1">
                                    <span class="text-danger text-decoration-none font-weight-600">
                                        Not Started
                                        &nbsp;
                                    </span>
                                </div>
                            </div>
                            <div class="col-12 my-1">
                                            <a class="text-danger text-decoration-none font-weight-600" onclick="delete_sweet_alert('/cancelStockContest?contestId=${doc._id}&status=IsCanceled', 'Are you sure you want to cancel this stock contest?')">
                                                Is Canceled
                                                &nbsp;
                                                <i class="fad fa-caret-right"></i>
                                            </a>
                                        </div>`
            }
            if(doc.final_status == 'IsCanceled'){
              constest_status = ``;
            }


            // ---------------quiz----------

          
            data.push({
              count: count,
              contest_name: `<div class="row">
                                <div class="col-12 my-1">
                                        <span class="text-decoration-none text-secondary font-weight-600 fs-16">${doc.contest_name}</span> 
                                        &nbsp; 
                                </div>
                                <div class="col-12 my-1">
                                    <span class="text-dark">${day},</span>
                                    <span class="text-warning">${date}</span>
                                    <span class="text-success ml-2">${time}</span>
                                </div>
                                <div class="col-12 my-1">
                                    <a class="text-decoration-none text-secondary font-weight-600" href="/total-joined-user/${doc._id}">
                                        Total Joined User ${doc.joinedusers} 
                                        &nbsp; 
                                        <i class="fad fa-caret-right"></i>
                                    </a>
                                </div>
                                <div class="col-12 my-1">
                                    <span class="text-decoration-none text-dark font-weight-600">
                                        Contest Status : ${doc.final_status}
                                    </span>
                                </div>
                            </div>`,

              constest_status: constest_status
            });
            count++;
            if (count > rows1.length) {
              let json_data = JSON.stringify({
                data,
              });
              res.send(json_data);
            }
          });
        });
      });
    } catch (error) {
      console.log("error",error)
      next(error);
    }
  }

  async saveStocks(req, res, next){
    try {
        let stockdata = await axios.get(`https://api.kite.trade/instruments`);
        const data = await convertCsv().fromString(stockdata.data);
        let arr = [];
        for(let i of data){
            if(i.exchange === 'NSE' || i.exchange === 'MCX'){
                i['type'] = i.exchange;
                arr.push(stockModel.updateOne(
                { instrument_token: i.instrument_token },
                { $set: i },
                { upsert: true }));
            }
        }
        Promise.allSettled(arr).then((values) => {
            return res.status(200).json(Object.assign({ success: true }));
        });
          return res.status(200).json(Object.assign({ success: true }, data));
    } catch (error) {
        console.log(error);
        throw error;
    }
}

  async updateResultStocks(req, res, next) {
    try {
        const data = await stockContestService.updateResultStocks(req);
        return res.status(200).json(Object.assign({ success: true }, data));
    } catch (error) {
        next(error);
    } 
  }

  async saveCurrentPriceOfStock(req, res, next) {
    try {
        const data = await stockContestService.saveCurrentPriceOfStock(req);
        return res.status(200).json(Object.assign({ success: true }, data));
    } catch (error) {
        next(error);
    }
  }

}
module.exports = new stockCategory();