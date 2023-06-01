const leaderboardServices=require("../services/leaderboardServices");
const moment = require("moment");
const seriesModel=require("../../models/addSeriesModel");
const mongoose = require("mongoose");
const seriesLeaderBoardModel=require("../../models/seriesLeaderBoardModel");
const listmatchModel=require("../../models/listMatchesModel");
class leaderboardController {
    constructor() {
        return {
            viewLeaderBoarderPage: this.viewLeaderBoarderPage.bind(this),
            viewLeaderBoardDatatable:this.viewLeaderBoardDatatable.bind(this),
            addSeriesPriceCardPage:this.addSeriesPriceCardPage.bind(this),
            addSeriesPriceCardData:this.addSeriesPriceCardData.bind(this),
            deleteSeriesPriceCard:this.deleteSeriesPriceCard.bind(this),
            distributeWinningAmountSeriesLeaderboard:this.distributeWinningAmountSeriesLeaderboard.bind(this),
            leaderboardRank:this.leaderboardRank.bind(this),
            leaderBoardRankDatatable:this.leaderBoardRankDatatable.bind(this),
            updateHasLeaderBoard:this.updateHasLeaderBoard.bind(this),
        }
    }
  async viewLeaderBoarderPage(req,res,next){
    try{
        res.locals.message = req.flash();
      const data = await leaderboardServices.viewLeaderBoarderPage(req);
      console.log("0000000000000",data)
        let obj={};
        if(req.query.seriesStatus){
          if (req.query.seriesStatus) {
            obj.seriesStatus=req.query.seriesStatus;
        }else{
            obj.seriesStatus='live_end';
        }
       }
        let sObj={};
        if(req.query.series_name){
            sObj.series_name=req.query.series_name;
        }else{
          sObj.series_name=undefined;
        }
        res.render("leaderboard/viewLeaderboardSeries",{sessiondata: req.session.data,data,obj,sObj});

    }catch(error){
        req.flash("error",'something wrong please try again later');
        res.redirect('/');
    }
  }
  async viewLeaderBoardDatatable(req,res,next){
    try{
        const seriesData=await seriesModel.findOne({name:req.query.series_name});
        let limit1 = req.query.length;
        let start = req.query.start;
        let conditions = {};
       
        if(req.query.series_name){
            conditions._id=mongoose.Types.ObjectId(req.query.series_name)
            if (req.query.seriesStatus) {
                if(req.query.seriesStatus == 'live_end'){
                    conditions.start_date= { $lt: moment().format('YYYY-MM-DD HH:mm:ss') }
                }
                if(req.query.seriesStatus == 'live'){
                    conditions.start_date= { $gt: moment().format('YYYY-MM-DD HH:mm:ss') }
                    conditions.end_date= { $lt: moment().format('YYYY-MM-DD HH:mm:ss') }
                }
                if(req.query.seriesStatus == 'end'){
                    conditions.end_date= { $gt: moment().format('YYYY-MM-DD HH:mm:ss') }
                }
            }
        }
        console.log("conditions............",conditions)
        seriesModel.countDocuments(conditions).exec((err, rows) => {
            let totalFiltered = rows;
            let data = [];
            let count = 1;
            seriesModel.find(conditions).skip(Number(start) ? Number(start) : '').limit(Number(limit1) ? Number(limit1) : '').exec((err, rows1) => {
                if (err) console.log(err);
           
                rows1.forEach((index) => {
                   
                    data.push({
                        "count": count,
                        "series_name": index.name,
                        "action": `<a href="/add_series_pricecard_page/${index._id}" class="btn btn-sm btn-info text-uppercase" data-toggle="tooltip" title="Add / Edit Price panel"><i class="fas fa-plus"></i>&nbsp; Add / Edit Price panel</a>
                        <a href="/leaderboard_rank/${index._id}"  class="btn btn-sm btn-danger  text-uppercase" data-toggle="tooltip" title="Check Rank"><i class="fas fa-eye"></i>&nbsp; Check Rank</a>
                        <a href="#" class="btn btn-sm text-uppercase btn-success text-white" data-toggle="modal" data-target="#key304"><span data-toggle="tooltip" title="Declare Winner Now"><i class="fad fa-trophy"></i>&nbsp; Declare Winner</span></a>
                        <div class="modal fade" id="key304" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                                <div class="modal-dialog">
                                <div class="modal-content">
                                    <div class="modal-header">
                                    <h5 class="modal-title" id="exampleModalLabel">Winner Declare</h5>
                                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">×</span>
                                    </button>
                                    </div>
                                    <div class="modal-body">
                                        <form action="/distribute_winning_amount_series_leaderboard/${index._id}" method="post">
                                            <div class="col-md-12 col-sm-12 form-group">
                                                <label> Enter Your Master Password </label>
                                                <input type="password" name="masterpassword" class="form-control" placeholder="Enter password here" required="">
                                            </div>
                                            <div class="col-md-12 col-sm-12 form-group">
                                                <input type="submit" class="btn btn-info btn-sm text-uppercase" value="Submit">
                                            </div>
                                            </form>
                                    </div>
                                    <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary btn-sm text-uppercase" data-dismiss="modal">Close</button>
                                    </div>
                                </div>
                                </div>
                            </div>`
                    });
                    count++;

                    if (count > rows1.length) {
                        // console.log(`data------SERVICES---------`, data);
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

    }catch(error){
        console.log(error);
    }
  }
  async addSeriesPriceCardPage(req,res,next){
    try{
        res.locals.message = req.flash();
        const getdata = await leaderboardServices.addSeriesPriceCardPage(req);
        if (getdata.status == true) {
          res.render("leaderboard/seriesPricecard", {
            sessiondata: req.session.data,
            data: getdata.series_Data,
            positionss: getdata.position,
            priceCardData: getdata.check_PriceCard,
            tAmount: getdata.totalAmountForPercentage,
          });
        } else if (getdata.status == false) {
          req.flash("error", getdata.message);
          res.redirect("/view_leaderBoard_page");
        }


    }catch(error){
      req.flash('error','something is wrong please try again letter');
      res.redirect('/');
    }
  }
  async addSeriesPriceCardData(req,res,next){
    try{
      const postPriceData = await leaderboardServices.addSeriesPriceCardData(req);
      
      if (postPriceData.status == true) {
        req.flash("success", postPriceData.message);
        res.redirect(`/add_series_pricecard_page/${req.body.seriesId}`);
      } else if (postPriceData.status == false) {
        req.flash("error", postPriceData.message);
        res.redirect(`/add_series_pricecard_page/${req.body.seriesId}`);
      } else {
        req.flash("error", " Page not Found ");
        res.redirect("/");
      }
    }catch(error){
        console.log(error)
    }
  }
  async deleteSeriesPriceCard(req,res,next){
    try {
        res.locals.message = req.flash();
        const deletePriceCard = await leaderboardServices.deleteSeriesPriceCard(
          req
        );
        if (deletePriceCard.status == true) {
          req.flash("success", deletePriceCard.message);
          res.redirect(`/add_series_pricecard_page/${req.query.seriesId}`);
        } else {
          req.flash("error", deletePriceCard.message);
          res.redirect(`/add_series_pricecard_page/${req.query.seriesId}`);
        }
      } catch (error) {
        req.flash("error", "Something went wrong please try again");
        res.redirect("/view_leaderBoard_page");
      }
  }
  async distributeWinningAmountSeriesLeaderboard(req,res,next){
    try{
    
      req.body.final_status = 'winnerdeclared'
      if (
        req.body.masterpassword &&
        req.body.masterpassword == req.session.data.masterpassword
      ) {
        const getResult = await leaderboardServices.distributeWinningAmountSeriesLeaderboard(req);//need to check becouse crown is remove
      
        req.flash("success", `Match ${req.body.final_status} successfully`);
        await seriesLeaderBoardModel.updateOne(
          { series_id: mongoose.Types.ObjectId(req.params.id) },
          {
            $set: {
              final_status: req.body.final_status,
            },
          }
        );
        res.redirect(`/view_leaderBoard_page?series_name=${req.params.id}`);
      } else {
        req.flash("error", "Incorrect masterpassword");
        // req.flash("error",data.message);
        res.redirect(`/view_leaderBoard_page?series_name=${req.params.id}`);
      }
      // ---------------------------------------


    }catch(error){
        console.log(error)
    }
  }
  async leaderboardRank(req,res,next){
    try{
      res.locals.message = req.flash();
        res.render("leaderboard/leaderboardRank", {
          sessiondata: req.session.data,
          seriesId:req.params.id
        });

    }catch(error){
      req.flash('error','something is wrong please try again letter');
      res.redirect('/');
    }
  }
  async leaderBoardRankDatatable(req,res,next){
    try{console.log("1")
     
      let limit1 = req.query.length;
      let start = req.query.start;
      let conditions = [];
      conditions.push({
        $match:{
          _id:mongoose.Types.ObjectId(req.query.seriesId),
          launch_status:"launched",
          final_status:{$ne:'IsAbandoned'},
          final_status:{$ne:'IsCanceled'},
          status:{$ne:"notstarted"},
        },
      });
      conditions.push({
        $lookup:{
          from: "jointeams",
          localField: "_id",
          foreignField: "matchkey",
          as: "joinTeamData"
        },
      });
      conditions.push({
        $unwind:{
          path: "$joinTeamData",
        },
      });
      conditions.push({
        $lookup:{
          from: "joinedleauges",
          localField: "joinTeamData._id",
          foreignField:"teamid" ,
          as: "joinedleaugesData"
        },
      });
      conditions.push({
        $unwind:{
          path: "$joinedleaugesData",
        },
      });
      conditions.push({
        $lookup:{
          from: "users",
          localField: "joinTeamData.userid",
          foreignField: "_id",
          as: "userData"
        },
      });
      conditions.push({
        $unwind:{
          path: "$userData",
        },
      });
      conditions.push({
        $group:{
          _id: {
            'userid':"$joinedleaugesData.userid",
            'matchkey':"$_id",
          },
         allTeams: {
           $push :"$$ROOT"
          },
          username:{$first:"$userData.username"},
          team:{$first:"$userData.team"},
          matchName:{$first:"$name"},
        },
      });
      conditions.push({
        $addFields: {maxScore: {
          $max: {
            $map: {
              input: "$allTeams.joinTeamData.points",
              in: { $max: "$$this" }
            }
          }
        },
        user_status:'$allTeams.userData.user_status' 
  },
      });
      conditions.push({
        $unwind:{
          path: "$user_status",
        },
      })
      conditions.push({
        $match:{
          user_status:0
        },
      })
      conditions.push({
        $group:{
          _id: "$_id.userid",
          sumTotal: {
            $sum: "$maxScore"
          }, username:{$first:"$username"},
          team:{$first:"$team"},
          matchName:{$first:"$matchName"},
        },
      })
      conditions.push({
      $sort:{
        sumTotal: -1
      },
      })
      
// console.log("---conditions----",conditions)
const getData=await listmatchModel.aggregate(conditions);
// console.log("---getData----",getData)
//console.log("3")
      listmatchModel.countDocuments(conditions).limit(Number(limit1) ? Number(limit1) : '').exec((err, rows) => {
          let totalFiltered = rows;
          let data = [];
          let count = 1;
          let rank=1
          listmatchModel.aggregate(conditions).exec((err, rows1) => {//console.log("4","rows1",rows1)
              if (err) console.log(err);
              rows1.forEach((index) => {
                  data.push({
                     count:count,
                     user_team:index.username,
                     team:index.team,
                     points:index.sumTotal,
                  });
                  console.log("data",data)
                  count++;
                  //console.log("2","data",data,"count",count,"row1.length",rows1.length)
                  if (count > rows1.length) {
                    //console.log("asdf")

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


    }catch(error){
      console.log(error)
    }
  }
  async updateHasLeaderBoard(req,res,next){
    try{
      const updateData=await leaderboardServices.updateHasLeaderBoard(req);
      if(updateData?.status == true){
        req.flash("success", updateData.message);
        res.redirect(`/view-series`);
      }else{
        req.flash("error", updateData.message);
        res.redirect(`/view-series`);
      }

    }catch(error){
      
      req.flash("error", 'Something Wrong ! Please Try letter..');
      res.redirect(`/view-series`);
    }
  }
}
module.exports = new leaderboardController();