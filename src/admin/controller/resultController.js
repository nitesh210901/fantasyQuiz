const mongoose = require("mongoose");
const moment = require("moment");
const resultServices = require("../services/resultServices");
const quizServices = require("../services/quizService");
const seriesModel = require("../../models/addSeriesModel");
const listMatchesModel = require("../../models/listMatchesModel");
const matchChallengersModel = require("../../models/matchChallengersModel");
const resultMatchModel = require("../../models/resultMatchModel");
const quizmatches = require("../../models/quizmatches");
const resultPointModel = require("../../models/resultPointModel");

const joinedLeaugeModel = require("../../models/JoinLeaugeModel");
const joinTeamModel = require("../../models/JoinTeamModel");
const userModel = require("../../models/userModel");
const config = require("../../config/const_credential");
class resultController {
  constructor() {
    return {
      update_results_of_matches: this.update_results_of_matches.bind(this),
      update_results_of_matches_refresh: this.update_results_of_matches_refresh.bind(this),
      refund_amount: this.refund_amount.bind(this),
      matchResult: this.matchResult.bind(this),
      matchResultData: this.matchResultData.bind(this),
      matchDetails: this.matchDetails.bind(this),
      matchDetailsData: this.matchDetailsData.bind(this),
      matchAllcontests: this.matchAllcontests.bind(this),
      matchAllcontestsData: this.matchAllcontestsData.bind(this),
      matchScore: this.matchScore.bind(this),
      matchPoints: this.matchPoints.bind(this),
      battingPoints: this.battingPoints.bind(this),
      bowlingPoints: this.bowlingPoints.bind(this),
      fieldingPoints: this.fieldingPoints.bind(this),
      teamPoints: this.teamPoints.bind(this),
      matchScoreData: this.matchScoreData.bind(this),
      matchPointsData: this.matchPointsData.bind(this),
      battingPointsData: this.battingPointsData.bind(this),
      bowlingPointsData: this.bowlingPointsData.bind(this),
      fieldingPointsData: this.fieldingPointsData.bind(this),
      teamPointsData: this.teamPointsData.bind(this),
      contestUserDetails: this.contestUserDetails.bind(this),
      contestUserDetailsData: this.contestUserDetailsData.bind(this),
      updateMatchFinalStatus: this.updateMatchFinalStatus.bind(this),
      autoUpdateMatchFinalStatus: this.autoUpdateMatchFinalStatus.bind(this),
      viewTeams: this.viewTeams.bind(this),
      viewTeamsData: this.viewTeamsData.bind(this),
      insertProfitLossData: this.insertProfitLossData.bind(this),
      cancelMatch: this.cancelMatch.bind(this),
      //sahil overfantasy
      overupdate_results_of_matches: this.overupdate_results_of_matches.bind(this),
      editUserTeams: this.editUserTeams.bind(this),
      editUserTeamsTable: this.editUserTeamsTable.bind(this),
      userTeamModified: this.userTeamModified.bind(this)
    };
  }
  //sahil overfantsy
  async overupdate_results_of_matches(req, res, next) {
    try {
      const getResult = await resultServices.overupdateResultMatches(req);
      res.json(getResult);
    } catch (error) {
      throw error;
    }
  }


  async update_results_of_matches(req, res, next) {
    try {
      const getResult = await resultServices.updateResultMatches(req);
      res.json(getResult);
    } catch (error) {
       console.log('error',error);
    }
  }

  async update_results_of_matches_refresh(req, res, next) {
    try {console.log("req.query.real_matchkey",req.query.real_matchkey,"req.query.matchkey",req.query.matchkey)
      const getResult = await resultServices.getScoresUpdates(req.query.real_matchkey,req.query.matchkey);
      //res.json(getResult);
      res.redirect(`match-score/${req.query.matchkey}`)
    } catch (error) {
       console.log('error',error);
    }
  }

  async refund_amount(req, res) {
    try {
      const getResult = await resultServices.refundAmount(req);
      res.send({status:true});
    } catch (error) {
      console.log('error',error);
    }
  }

  async matchResult(req, res, next) {
    try {
      res.locals.message = req.flash();
      let fantasy_type=req.query.fantasy_type;
      res.render("matchResult/matchResult", {
        sessiondata: req.session.data,
        name: req.query.series_name,
        fantasy_type
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @description Get Match Result Datatable
   * @route POST /match-result-table
   */
  async matchResultData(req, res, next) {
    try {
      let limit = req.query.length;
      let start = req.query.start;
      let fantasy_type=req.query.fantasy_type;
      console.log("fantasy_type",fantasy_type)
      let sortObj = {},
        dir,
        join;

      let condition = [];
      condition.push({
        $match: {
          status: "opened",
          fantasy_type:fantasy_type
          
        },
      })
      condition.push({
        $lookup: {
          from: "listmatches",
          localField: "_id",
          foreignField: "series",
          as: "matchdata",
        }
      });
      let today = new Date()
      today.setHours(today.getHours() + 5);
      today.setMinutes(today.getMinutes() + 30);
      today.toISOString().replace('Z', '+00:00');
      console.log("--today--", today)
      condition.push({
        $addFields: {
          startdate: { $toString: "$start_date" }
        }
      });

      condition.push({
        $addFields: {
          date: {

            $dateFromString: {
              dateString: '$startdate',
              //    timezone: "-00:00"
            }
          },
          curDate: today
        }
      });

      condition.push({
        $sort: {
          'date': 1,
        },
      });

      if (req.query.series_name) {
        condition.push({
          $match: {
            name: {
              $regex: new RegExp(req.query.series_name.toLowerCase(), "i"),
            },
          },
        });
      }

      seriesModel.countDocuments(condition).exec((err, rows) => {
        let totalFiltered = rows;
        let data = [];
        let count = 1;
        seriesModel.aggregate(condition).exec((err, rows1) => {
          rows1.forEach(async (doc) => {
            let finalStatus = [];
            doc.matchdata.forEach((index) => {
              finalStatus.push(index.final_status);
            });
            const counts = {};
            finalStatus.forEach((x) => {
              counts[x] = (counts[x] || 0) + 1;
            });
            let startDateFormat = moment(
              `${doc.start_date}`,
              "YYYY-MM-DD HH:mm:ss"
            );
            let endDateFormat = moment(
              `${doc.end_date}`,
              "YYYY-MM-DD HH:mm:ss"
            );
            let startDate = startDateFormat.format("YYYY-MM-DD");
            let startTime = startDateFormat.format("hh:mm:ss a");
            let endDate = endDateFormat.format("YYYY-MM-DD");
            let endTime = endDateFormat.format("hh:mm:ss a");
            data.push({
              count: count,
              series: `<a class="text-danger font-weight-600" href="/match-details/${doc._id}">
                                <u>${doc.name}</u>
                            </a>`,

              matchCount: `<div class="text-center">
                                ${doc.matchdata.length}
                            </div>`,

              winnerDeclaredCount: `<div class="text-center">
                                ${finalStatus.includes("winnerdeclared")
                  ? counts.winnerdeclared
                  : 0
                }
                            </div>`,

              date: `<div class="text-center">
                                <span class="font-weight-600 px-2">From</span>&nbsp; 
                                <span class="text-warning">${startDate}</span>&nbsp; 
                                <span class="text-success">${startTime}</span>&nbsp; 
                                <span class="font-weight-600 px-2"">to</span>&nbsp; 
                                <span class="text-warning">${endDate}</span>&nbsp;
                                <span class="text-success">${endTime}</span>
                            </div>`,
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

  /**
   * @description Get Match Details Page
   * @route GET /match-details/:id
   */
  async matchDetails(req, res, next) {
    try {
      res.locals.message = req.flash();
     let fantasy_type=req.query?.fantasy_type;
      res.render("matchResult/matchDetails", {
        sessiondata: req.session.data,
        seriesID: req.params.id,
        fantasy_type
      });
    } catch (error) {
      req.flash('error', 'something is wrong please try again letter');
      res.redirect('/');
    }
  }

  /**
   * @description Get Match Details Datatable
   * @route POST /match-details-table/:id
   */
  async matchDetailsData(req, res, next) {
    try {
      let limit = req.query.length;
      let start = req.query.start;
      let fantasy_type=req.query?.fantasy_type
      let sortObj = {},
        dir,
        join;

      let condition = [];

      condition.push({
        $match: {
          series: mongoose.Types.ObjectId(req.params.id.trim()),
          //fantasy_type:fantasy_type
        },
      });

      condition.push({
        $lookup: {
          from: "matchchallenges",
          localField: "_id",
          foreignField: "matchkey",
          as: "contestdata",
        },
      });
      condition.push({
        $lookup: {
          from: "quizzes",
          localField: "_id",
          foreignField: "matchkey",
          as: "quizData",
        },
      });
      condition.push({
        $sort: {
          start_date: -1,
        },
      });
      listMatchesModel.countDocuments(condition).exec((err, rows) => {
        let totalFiltered = rows;
        let data = [];
        let count = 1;

        listMatchesModel.aggregate(condition).exec((err, rows1) => {
          rows1.forEach(async (doc) => {
            // console.log(doc,"oooooooo")

            let dateFormat = moment(`${doc.start_date}`, "YYYY-MM-DD HH:mm:ss");
            let day = dateFormat.format("dddd");
            let date = dateFormat.format("YYYY-MM-DD");
            let time = dateFormat.format("hh:mm:ss a");
            let matchStatus = "";
            // console.log("-------------doc.status -------------------",doc.status ,"-----------doc.name----------",doc.name)
            if (doc.status != "notstarted") {
              if (doc.final_status == "pending") {
                matchStatus = `<div class="row">
                                                <div class="col-12 my-1">
                                                    <a class="text-info text-decoration-none font-weight-600" onclick="delete_sweet_alert('/cancelMatch/${doc.series}?matchkey=${doc._id}&status=IsAbandoned', 'Are you sure you want to Abandoned this match?')">
                                                        Is Abandoned
                                                        &nbsp;
                                                        <i class="fad fa-caret-right"></i>
                                                    </a>
                                                </div>
                                                <div class="col-12 my-1">
                                                    <a class="text-danger text-decoration-none font-weight-600" onclick="delete_sweet_alert('/cancelMatch/${doc.series}?matchkey=${doc._id}&status=IsCanceled', 'Are you sure you want to cancel this match?')">
                                                        Is Canceled
                                                        &nbsp;
                                                        <i class="fad fa-caret-right"></i>
                                                    </a>
                                                </div>
                                            </div>`;
              } else if (doc.final_status == "IsReviewed") {
                matchStatus = `<div class="row">
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
                                            <a class="text-info text-decoration-none font-weight-600" onclick="delete_sweet_alert('/cancelMatch/${doc.series}?matchkey=${doc._id}&status=IsAbandoned', 'Are you sure you want to Abandoned this match?')">
                                                Is Abandoned
                                                &nbsp;
                                                <i class="fad fa-caret-right"></i>
                                            </a>
                                        </div>
                                        <div class="col-12 my-1">
                                            <a class="text-danger text-decoration-none font-weight-600" onclick="delete_sweet_alert('/cancelMatch/${doc.series}?matchkey=${doc._id}&status=IsCanceled', 'Are you sure you want to cancel this match?')">
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
                                        <h4 class="modal-title">IsWinnerDeclared</h4>
                                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                                    </div>
                                    <div class="modal-body abcd">
                                        <form action="/updateMatchFinalStatus/${doc._id}/winnerdeclared" method="post">
                                        <div class="col-md-12 col-sm-12 form-group">
                                        <label> Enter Your Master Password </label>
                                        
                                        <input type="hidden"  name="series" value="${doc.series}">
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
                matchStatus = `<div class="row">
                                    <div class="col-12 my-1">
                                        <span class="text-success text-decoration-none font-weight-600 pointer" data-toggle="modal" data-target="#keys4">
                                            Winner Declared
                                            &nbsp;
                                        </span>
                                    </div>
                                </div>`;
              } else {
                matchStatus = ``;
              }
            } else {
              matchStatus = "";
              matchStatus = `<div class="row">
                                <div class="col-12 my-1">
                                    <span class="text-danger text-decoration-none font-weight-600">
                                        Not Started
                                        &nbsp;
                                    </span>
                                </div>
                            </div>
                            <div class="col-12 my-1">
                                            <a class="text-danger text-decoration-none font-weight-600" onclick="delete_sweet_alert('/cancelMatch/${doc.series}?matchkey=${doc._id}&status=IsCanceled', 'Are you sure you want to cancel this match?')">
                                                Is Canceled
                                                &nbsp;
                                                <i class="fad fa-caret-right"></i>
                                            </a>
                                        </div>`
            }
            if(doc.final_status == 'IsCanceled'){
              matchStatus = ``;
            }


            // ---------------quiz----------

            let quizStatus = "";
            // console.log("-------------doc.status -------------------",doc.status ,"-----------doc.name----------",doc.name)
            if (doc.status != "notstarted") {
              if (doc.quiz_status == "pending") {
                quizStatus = `<div class="row">
                                                <div class="col-12 my-1">
                                                    <a class="text-info text-decoration-none font-weight-600" onclick="delete_sweet_alert('/cancelQuiz/${doc.series}?matchkey=${doc._id}&status=IsAbandoned', 'Are you sure you want to Abandoned this Quiz?')">
                                                        Is Abandoned
                                                        &nbsp;
                                                        <i class="fad fa-caret-right"></i>
                                                    </a>
                                                </div>
                                                <div class="col-12 my-1">
                                                    <a class="text-danger text-decoration-none font-weight-600" onclick="delete_sweet_alert('/cancelQuiz/${doc.series}?matchkey=${doc._id}&status=IsCanceled', 'Are you sure you want to cancel this Quiz?')">
                                                        Is Canceled
                                                        &nbsp;
                                                        <i class="fad fa-caret-right"></i>
                                                    </a>
                                                </div>
                                            </div>`;
              } else if (doc.quiz_status == "IsReviewed") {
                quizStatus = `<div class="row">
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
                                            <a class="text-info text-decoration-none font-weight-600" onclick="delete_sweet_alert('/cancelQuiz/${doc.series}?matchkey=${doc._id}&status=IsAbandoned', 'Are you sure you want to Abandoned this Quiz?')">
                                                Is Abandoned
                                                &nbsp;
                                                <i class="fad fa-caret-right"></i>
                                            </a>
                                        </div>
                                        <div class="col-12 my-1">
                                            <a class="text-danger text-decoration-none font-weight-600" onclick="delete_sweet_alert('/cancelQuiz/${doc.series}?matchkey=${doc._id}&status=IsCanceled', 'Are you sure you want to cancel this Quiz ?')">
                                                Is Canceled
                                                &nbsp;
                                                <i class="fad fa-caret-right"></i>
                                            </a>
                                        </div>
                                    </div>
                                    
                                <div id="keys${count}" class="modal fade" role="dialog">
                                <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable  w-100 h-100">
                                    <div class="modal-content">
                                    <div class="modal-header">
                                        <h4 class="modal-title">Quiz WinnerDeclared</h4>
                                        <button type="button" class="close" data-dismiss="modal">&times;</button>
                                    </div>
                                    <div class="modal-body abcd">
                                        <form action="/updateMatchQuizStatus/${doc._id}/winnerdeclared" method="post">
                                        <div class="col-md-12 col-sm-12 form-group">
                                        <label> Enter Your Master Password </label>
                                        
                                        <input type="hidden"  name="series" value="${doc.series}">
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
              } else if (doc.quiz_status == "winnerdeclared") {
                quizStatus = `<div class="row">
                                    <div class="col-12 my-1">
                                        <span class="text-success text-decoration-none font-weight-600 pointer" data-toggle="modal" data-target="#keys4">
                                            Winner Declared
                                            &nbsp;
                                        </span>
                                    </div>
                                </div>`;
              } else {
                quizStatus = ``;
              }
            } else {
            quizStatus = "";
            quizStatus = `<div class="row">
                                <div class="col-12 my-1">
                                    <span class="text-danger text-decoration-none font-weight-600">
                                        Not Started
                                        &nbsp;
                                    </span>
                                </div>
                            </div>
                            <div class="col-12 my-1">
                                            <a class="text-danger text-decoration-none font-weight-600" onclick="delete_sweet_alert('/cancelQuiz/${doc.series}?matchkey=${doc._id}&status=IsCanceled', 'Are you sure you want to cancel this Quiz?')">
                                                Is Canceled
                                                &nbsp;
                                                <i class="fad fa-caret-right"></i>
                                            </a>
                                        </div>`
            }
            if(doc.quiz_status == 'IsCanceled'){
              quizStatus = ``;
            }
            data.push({
              count: count,
              matches: `<div class="row">
                                <div class="col-12 my-1">
                                    <a class="text-decoration-none text-secondary font-weight-600 fs-16" href="/match-score/${doc._id}">
                                        ${doc.name} 
                                        &nbsp; 
                                        <i class="fad fa-caret-right"></i>
                                    </a>
                                </div>
                                <div class="col-12 my-1">
                                    <span class="text-dark">${day},</span>
                                    <span class="text-warning">${date}</span>
                                    <span class="text-success ml-2">${time}</span>
                                </div>
                                <div class="col-12 my-1">
                                    <a class="text-decoration-none text-secondary font-weight-600" href="/allcontests/${doc._id}">
                                        Total Contest ${doc.contestdata.length} 
                                        &nbsp; 
                                        <i class="fad fa-caret-right"></i>
                                    </a>
                                </div>
                                <div class="col-12 my-1">
                                    <a class="text-decoration-none text-secondary font-weight-600" href="/allquiz/${doc._id}?seriesId=${doc.series}">
                                        Total Quiz ${doc.quizData.length} 
                                        &nbsp; 
                                        <i class="fad fa-caret-right"></i>
                                    </a>
                                </div>
                                <div class="col-12 my-1">
                                    <span class="text-decoration-none text-dark font-weight-600">
                                        Match Status : ${doc.final_status}
                                    </span>
                                </div>
                            </div>`,

              matchStatus: matchStatus,
              quizStatus:quizStatus,
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

  /**
   * @description Get Match All Contests Page
   * @route GET /allcontests/:id
   */
  async matchAllcontests(req, res, next) {
    try {
      res.locals.message = req.flash();
      res.render("matchResult/matchAllContests", {
        sessiondata: req.session.data,
        matchID: req.params.id,
      });
    } catch (error) {
      next(error);
    }
  }
/**
   * @description Get Match All Contests Datatable
   * @route POST /allcontests-table/:id
   */
 async matchAllcontestsData(req, res, next) {
  try {
    let limit = req.query.length;
    let start = req.query.start;
    let sortObj = {},
      dir,
      join;

    let condition = [];

    condition.push({
      $match: {
        matchkey: mongoose.Types.ObjectId(req.params.id),
      },
    });

    condition.push({
      $lookup: {
        from: "listmatches",
        localField: "matchkey",
        foreignField: "_id",
        as: "matchdata",
      },
    });

    matchChallengersModel.countDocuments(condition).exec((err, rows) => {
      let totalFiltered = rows;
      let data = [];
      let count = 1;

      matchChallengersModel.aggregate(condition).exec((err, rows1) => {
        rows1.forEach(async (doc) => {
          let matchStatus = "";
          let actions="";
          if(doc.joinedusers != 0){
            actions += `<a href="/contest-user-details/${doc.matchkey}?challengeid=${doc._id}" class="btn btn-sm btn-primary w-35px h-35px" data-toggle="tooltip" title="View Users" data-original-title="View User" aria-describedby="tooltip768867"><i class="fas fa-eye"></i></a>`
          }else{
            actions +=  'No Users | '
          }
          
            if(doc.status != 'canceled'){
              actions += `<a href="/contestcancel/${doc._id}?page=${doc.matchkey}" class="btn btn-sm btn-secondary w-35px h-35px" data-toggle="tooltip" title="Cancel Contest" data-original-title="Cancel Contest" aria-describedby="tooltip768867"><i class="fas fa-window-close"></i></a></div>`
            }else{
              actions += " | <tagname style='color:red;'>Canceled"
            }
          data.push({
            count: count,
            winAmount: `₹${doc.win_amount}`,
            maximumUser: doc.maximum_user,
            entryFee: `₹${doc.entryfee}`,
            contestType: doc.contest_type,
            leaugeType: `${doc.confirmed_challenge == 1
              ? '<span class="text-success">Confirmed</span>'
              : '<span class="text-warning">Not Confirmed</span>'
              }`,
            multiEntry: `${doc.multi_entry == 1
              ? '<span class="text-success">Yes</span>'
              : '<span class="text-danger">No</span>'
              }`,
            isRunning: `${doc.is_running == 1
              ? '<span class="text-success">Yes</span>'
              : '<span class="text-danger">No</span>'
              }`,
            joinedUsers: doc.joinedusers,
            action:`<div class="text-center">${actions}</div>`,
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
    
  }
}

  /**
   * @description Get Match Score
   * @route GET /match-score/:id
   */
  async matchScore(req, res, next) {
    try {
      const findfinalresult = await listMatchesModel.find({ _id: req.params.id })
      res.locals.message = req.flash();
      if(findfinalresult[0].fantasy_type=='Cricket'){
        res.render("matchResult/matchScore", {
          sessiondata: req.session.data,
          matchID: req.params.id,
          name: req.query.player_name,
          finalresult: findfinalresult
        });
      }else{
        res.render("overfantasy/matchScore", {
          sessiondata: req.session.data,
          matchID: req.params.id,
          name: req.query.player_name,
          finalresult: findfinalresult
        });
      }

    } catch (error) {
      next(error);
    }
  }

  /**
   * @description Get Match Score Datatable
   * @route POST /match-score-table/:id
   */
  async matchScoreData(req, res, next) {
    try {
      let limit = req.query.length;
      let start = req.query.start;
      //console.log("fantasy",req.query.fantasy_type)
      if(req.query.fantasy_type=="overfantasy")
      {console.log("iniffantasy",req.query.fantasy_type)
      let condition=[
        {
          '$match': {
            'matchkey': mongoose.Types.ObjectId(req.params.id)
          }
        }, {
          '$lookup': {
            'from': 'teams', 
            'localField': 'teamid', 
            'foreignField': '_id', 
            'as': 'team'
          }
        }, {
          '$unwind': {
            'path': '$team'
          }
        }
      ];
      quizmatches.countDocuments(condition).exec((err, rows) => {
        let totalFiltered = rows;
        let data = [];
        let count = 1;
        quizmatches.aggregate(condition).exec((err, rows1) => {
          rows1.forEach(async (doc) => {
            data.push({
              teamName: doc.team.short_name,

              
              
              
              fours: `<input type="text" value="${doc.fours}" onchange="update_points('2','2333','fours',this.value);" class="text-center w-80px rounded-pill shadow border-primary" onkeypress="return isNumberKey(event)">`,

              sixes: `<input type="text" value="${doc.six}" onchange="update_points('2','2333','six',this.value);" class="text-center w-80px rounded-pill shadow border-primary" onkeypress="return isNumberKey(event)">`,

              overs: `<input type="text" value="${doc.over}" onchange="update_points('2','2333','overs',this.value);" class="text-center w-80px rounded-pill shadow border-primary" onkeypress="return isNumberKey(event)">`,

              maidens: `<input type="text" value="${doc.maiden_over}" onchange="update_points('2','2333','maiden_over',this.value);" class="text-center w-80px rounded-pill shadow border-primary" onkeypress="return isNumberKey(event)">`,

              
              wickets: `<input type="text" value="${doc.wickets}" onchange="update_points('2','2333','wicket',this.value);" class="text-center w-80px rounded-pill shadow border-primary" onkeypress="return isNumberKey(event)">`,

              
            });
            count++;
            //console.log("json_data",data)
            if (count > rows1.length) {
              let json_data = JSON.stringify({
                data,
              });
              //console.log("json_data",json_data)
              res.send(json_data);
            }
          });
        });
      })
    
      }
      else
      {
      let sortObj = {},
        dir,
        join;

      let condition = [];

      condition.push({
        $match: {
          matchkey: mongoose.Types.ObjectId(req.params.id),
        },
      });

      condition.push({
        $lookup: {
          from: "matchruns",
          localField: "matchkey",
          foreignField: "matchkey",
          as: "matchrundata",
        },
      });

      condition.push({
        $unwind: {
          path: "$matchrundata",
        },
      });

      condition.push({
        $lookup: {
          from: "players",
          localField: "player_id",
          foreignField: "_id",
          as: "playerdata",
        },
      });

      condition.push({
        $unwind: {
          path: "$playerdata",
        },
      });

      condition.push({
        $lookup: {
          from: "teams",
          localField: "playerdata.team",
          foreignField: "_id",
          as: "team",
        },
      });

      condition.push({
        $unwind: {
          path: "$team",
        },
      });

      if (req.query.player_name) {
        condition.push({
          $match: {
            "playerdata.player_name": {
              $regex: new RegExp(req.query.player_name.toLowerCase(), "i"),
            },
          },
        });
      }

      resultMatchModel.countDocuments(condition).exec((err, rows) => {
        let totalFiltered = rows;
        let data = [];
        let count = 1;
        resultMatchModel.aggregate(condition).exec((err, rows1) => {
          rows1.forEach(async (doc) => {
            data.push({
              teamName: doc.team.short_name,

              playerKey: doc.player_key,

              playerName: doc.playerdata.player_name,

              playerRole: doc.playerdata.role,

              startPoint: `<input type="text" value="${doc.starting11}" onchange="update_points('2','2333','starting11',this.value);" class="text-center w-80px rounded-pill shadow border-primary" onkeypress="return isNumberKey(event)">`,

              dismissInfo: `<div class="table_text_marqueses"><div class="col-12 px-0">${doc.out_str != "" ? doc.out_str : "Not Out"
                }</div></div>`,

              battingRun: `<input type="text" value="${doc.runs}" onchange="update_points('2','2333','runs',this.value);" class="text-center w-80px rounded-pill shadow border-primary" onkeypress="return isNumberKey(event)">`,

              battingBall: `<input type="text" value="${doc.bball}" onchange="update_points('2','2333','bball',this.value);" class="text-center w-80px rounded-pill shadow border-primary" onkeypress="return isNumberKey(event)">`,

              fours: `<input type="text" value="${doc.fours}" onchange="update_points('2','2333','fours',this.value);" class="text-center w-80px rounded-pill shadow border-primary" onkeypress="return isNumberKey(event)">`,

              sixes: `<input type="text" value="${doc.six}" onchange="update_points('2','2333','six',this.value);" class="text-center w-80px rounded-pill shadow border-primary" onkeypress="return isNumberKey(event)">`,

              overs: `<input type="text" value="${doc.overs}" onchange="update_points('2','2333','overs',this.value);" class="text-center w-80px rounded-pill shadow border-primary" onkeypress="return isNumberKey(event)">`,

              maidens: `<input type="text" value="${doc.maiden_over}" onchange="update_points('2','2333','maiden_over',this.value);" class="text-center w-80px rounded-pill shadow border-primary" onkeypress="return isNumberKey(event)">`,

              ballingBall: `<input type="text" value="${doc.balls}" onchange="update_points('2','2333','balls',this.value);" class="text-center w-80px rounded-pill shadow border-primary" onkeypress="return isNumberKey(event)">`,

              ballingRun: `<input type="text" value="${doc.grun}" onchange="update_points('2','2333','grun',this.value);" class="text-center w-80px rounded-pill shadow border-primary" onkeypress="return isNumberKey(event)">`,

              wickets: `<input type="text" value="${doc.wicket}" onchange="update_points('2','2333','wicket',this.value);" class="text-center w-80px rounded-pill shadow border-primary" onkeypress="return isNumberKey(event)">`,

              zeros: `<input type="text" value="${doc.balldots}" onchange="update_points('2','2333','balldots',this.value);" class="text-center w-80px rounded-pill shadow border-primary" onkeypress="return isNumberKey(event)">`,

              extra: `<input type="text" value="${doc.extra}" onchange="update_points('2','2333','extra',this.value);" class="text-center w-80px rounded-pill shadow border-primary" onkeypress="return isNumberKey(event)">`,

              catches: `<input type="text" value="${doc.catch}" onchange="update_points('2','2333','catch',this.value);" class="text-center w-80px rounded-pill shadow border-primary" onkeypress="return isNumberKey(event)">`,

              stumbed: `<input type="text" value="${doc.stumbed}" onchange="update_points('2','2333','stumbed',this.value);" class="text-center w-80px rounded-pill shadow border-primary" onkeypress="return isNumberKey(event)">`,

              thrower: `<input type="text" value="${doc.thrower}" onchange="update_points('2','2333','thrower',this.value);" class="text-center w-80px rounded-pill shadow border-primary" onkeypress="return isNumberKey(event)">`,

              duck: `<input type="text" value="${doc.duck}" onchange="update_points('2','2333','duck',this.value);" class="text-center w-80px rounded-pill shadow border-primary" onkeypress="return isNumberKey(event)">`,

              manOftheMatch: `<input type="text" value="${doc.man_of_match}" onchange="update_points('2','2333','man_of_match',this.value);" class="text-center w-80px rounded-pill shadow border-primary" onkeypress="return isNumberKey(event)">`,

              battingPoints: `<input type="text" value="${doc.batting_points}" onchange="update_points('2','2333','batting_points',this.value);" class="text-center w-80px rounded-pill shadow border-primary" onkeypress="return isNumberKey(event)">`,

              bowlingPoints: `<input type="text" value="${doc.bowling_points}" onchange="update_points('2','2333','bowling_points',this.value);" class="text-center w-80px rounded-pill shadow border-primary" onkeypress="return isNumberKey(event)">`,

              fieldingPoints: `<input type="text" value="${doc.fielding_points}" onchange="update_points('2','2333','fielding_points',this.value);" class="text-center w-80px rounded-pill shadow border-primary" onkeypress="return isNumberKey(event)">`,

              extraPoints: `<input type="text" value="${doc.extra_points}" onchange="update_points('2','2333','extra_points',this.value);" class="text-center w-80px rounded-pill shadow border-primary" onkeypress="return isNumberKey(event)">`,

              negativePoints: `<input type="text" value="${doc.negative_points}" onchange="update_points('2','2333','negative_points',this.value);" class="text-center w-80px rounded-pill shadow border-primary" onkeypress="return isNumberKey(event)">`,

              strikeRate: `<input type="text" value="${doc.strike_rate}" onchange="update_points('2','2333','strike_rate',this.value);" class="text-center w-80px rounded-pill shadow border-primary" onkeypress="return isNumberKey(event)">`,

              economyRate: `<input type="text" value="${doc.economy_rate}" onchange="update_points('2','2333','economy_rate',this.value);" class="text-center w-80px rounded-pill shadow border-primary" onkeypress="return isNumberKey(event)">`,
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
    }} catch (error) {
      next(error);
    }
  }

  /**
   * @description Get Match Points
   * @route GET /match-points/:id
   */
  async matchPoints(req, res, next) {
    try {
      res.locals.message = req.flash();
      res.render("matchResult/matchPoint", {
        sessiondata: req.session.data,
        matchID: req.params.id,
        name: req.query.player_name,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @description Get Match Points Datatable
   * @route POST /match-points-table/:id
   */
  async matchPointsData(req, res, next) {
    try {
      let limit = req.query.length;
      let start = req.query.start;
      let sortObj = {},
        dir,
        join;

      let condition = [];

      condition.push({
        $match: {
          matchkey: mongoose.Types.ObjectId(req.params.id),
        },
      });

      condition.push({
        $lookup: {
          from: "players",
          localField: "player_id",
          foreignField: "_id",
          as: "playerdata",
        },
      });

      condition.push({
        $unwind: {
          path: "$playerdata",
        },
      });

      condition.push({
        $lookup: {
          from: "teams",
          localField: "playerdata.team",
          foreignField: "_id",
          as: "team",
        },
      });

      condition.push({
        $unwind: {
          path: "$team",
        },
      });

      condition.push({
        $lookup: {
          from: "resultmatches",
          localField: "resultmatch_id",
          foreignField: "_id",
          as: "resultmatch",
        },
      });

      condition.push({
        $unwind: {
          path: "$resultmatch",
        },
      });

      if (req.query.player_name) {
        condition.push({
          $match: {
            "playerdata.player_name": {
              $regex: new RegExp(req.query.player_name.toLowerCase(), "i"),
            },
          },
        });
      }

      resultPointModel.countDocuments(condition).exec((err, rows) => {
        let totalFiltered = rows;
        let data = [];
        let count = 1;
        resultPointModel.aggregate(condition).exec((err, rows1) => {
          rows1.forEach(async (doc) => {
            data.push({
              teamName: `<td class="text-uppercase font-weight-bold sorting_1" tabindex="0" style="">${doc.team.short_name}</td>`,

              playerKey: doc.playerdata.players_key,

              playerName: doc.playerdata.player_name,

              playerRole: doc.playerdata.role,

              startPoint: doc.startingpoints,

              runs: doc.runs,

              fours: doc.fours,

              sixs: doc.sixs,

              strikeRate: doc.strike_rate,

              century: doc.century,

              wickets: doc.wickets,

              maidens: doc.maidens,

              economyRate: doc.economy_rate,

              catches: doc.catch,

              stumped: doc.stumping,

              // totalBonus: doc.total,

              negativePoints: doc.negative,

              totalPoints: doc.total,
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

    }
  }

  /**
   * @description Get Batting Points
   * @route GET /batting-points/:id
   */
  async battingPoints(req, res, next) {
    try {
      res.locals.message = req.flash();
      res.render("matchResult/battingPoints", {
        sessiondata: req.session.data,
        matchID: req.params.id,
        name: req.query.player_name,
      });
    } catch (error) {
      req.flash('error', 'Something went wrong please try again');
      res.redirect("/");
    }
  }

  /**
   * @description Get Batting Points Datatable
   * @route POST /batting-points-table/:id
   */
  async battingPointsData(req, res, next) {
    try {
      let limit = req.query.length;
      let start = req.query.start;
      let sortObj = {},
        dir,
        join;

      let condition = [];

      condition.push({
        $match: {
          matchkey: mongoose.Types.ObjectId(req.params.id),
        },
      });

      condition.push({
        $lookup: {
          from: "matchruns",
          localField: "matchkey",
          foreignField: "matchkey",
          as: "matchrundata",
        },
      });

      condition.push({
        $unwind: {
          path: "$matchrundata",
        },
      });

      condition.push({
        $lookup: {
          from: "players",
          localField: "player_id",
          foreignField: "_id",
          as: "playerdata",
        },
      });

      condition.push({
        $unwind: {
          path: "$playerdata",
        },
      });

      condition.push({
        $lookup: {
          from: "teams",
          localField: "playerdata.team",
          foreignField: "_id",
          as: "team",
        },
      });

      condition.push({
        $unwind: {
          path: "$team",
        },
      });

      if (req.query.player_name) {
        condition.push({
          $match: {
            "playerdata.player_name": {
              $regex: new RegExp(req.query.player_name.toLowerCase(), "i"),
            },
          },
        });
      }

      resultMatchModel.countDocuments(condition).exec((err, rows) => {
        let totalFiltered = rows;
        let data = [];
        let count = 1;
        resultMatchModel.aggregate(condition).exec((err, rows1) => {
          rows1.forEach(async (doc) => {
            data.push({
              matchKey: doc.matchkey,
              teamKey: doc.team._id,
              title: "",
              playerKey: doc.player_key,
              batsman: doc.playerdata.player_name,
              dismisalInfo: doc.out_str,
              runs: doc.runs,
              balls: doc.bball,
              fours: doc.fours,
              sixs: doc.six,
              sr: doc.strike_rate,
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
      next(error);
    }
  }

  /**
   * @description Get Bowling Points
   * @route GET /bowling-points/:id
   */
  async bowlingPoints(req, res, next) {
    try {
      res.locals.message = req.flash();
      res.render("matchResult/bowlingPoints", {
        sessiondata: req.session.data,
        matchID: req.params.id,
        name: req.query.player_name,
      });
    } catch (error) {
      req.flash('error', 'Something went wrong please try again');
      res.redirect("/");
    }
  }

  /**
   * @description Get Bowling Points Datatable
   * @route POST /bowling-points-table/:id
   */
  async bowlingPointsData(req, res, next) {
    try {
      let limit = req.query.length;
      let start = req.query.start;
      let sortObj = {},
        dir,
        join;

      let condition = [];

      condition.push({
        $match: {
          matchkey: mongoose.Types.ObjectId(req.params.id),
        },
      });

      condition.push({
        $lookup: {
          from: "matchruns",
          localField: "matchkey",
          foreignField: "matchkey",
          as: "matchrundata",
        },
      });

      condition.push({
        $unwind: {
          path: "$matchrundata",
        },
      });

      condition.push({
        $lookup: {
          from: "players",
          localField: "player_id",
          foreignField: "_id",
          as: "playerdata",
        },
      });

      condition.push({
        $unwind: {
          path: "$playerdata",
        },
      });

      condition.push({
        $lookup: {
          from: "teams",
          localField: "playerdata.team",
          foreignField: "_id",
          as: "team",
        },
      });

      condition.push({
        $unwind: {
          path: "$team",
        },
      });

      if (req.query.player_name) {
        condition.push({
          $match: {
            "playerdata.player_name": {
              $regex: new RegExp(req.query.player_name.toLowerCase(), "i"),
            },
          },
        });
      }

      resultMatchModel.countDocuments(condition).exec((err, rows) => {
        let totalFiltered = rows;
        let data = [];
        let count = 1;
        resultMatchModel.aggregate(condition).exec((err, rows1) => {
          rows1.forEach(async (doc) => {
            data.push({
              matchKey: doc.matchkey,
              teamKey: doc.team._id,
              teamName: doc.team.teamName,
              playerKey: doc.player_key,
              bowler: doc.playerdata.player_name,
              overs: doc.overs,
              maidens: doc.maiden_over,
              balls: doc.balls,
              runs: doc.grun,
              wickets: doc.wicket,
              zeros: doc.balldots,
              extras: doc.extra,
              economy: doc.economy_rate,
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
      next(error);
    }
  }

  /**
   * @description Get Fielding Points
   * @route GET /fielding-points/:id
   */
  async fieldingPoints(req, res, next) {
    try {
      res.locals.message = req.flash();
      res.render("matchResult/fieldingPoints", {
        sessiondata: req.session.data,
        matchID: req.params.id,
        name: req.query.player_name,
      });
    } catch (error) {
      req.flash('error', 'Something went wrong please try again');
      res.redirect("/");
    }
  }

  /**
   * @description Get Fielding Points Datatable
   * @route POST /fielding-points-table/:id
   */
  async fieldingPointsData(req, res, next) {
    try {
      let limit = req.query.length;
      let start = req.query.start;
      let sortObj = {},
        dir,
        join;

      let condition = [];

      condition.push({
        $match: {
          matchkey: mongoose.Types.ObjectId(req.params.id),
        },
      });

      condition.push({
        $lookup: {
          from: "matchruns",
          localField: "matchkey",
          foreignField: "matchkey",
          as: "matchrundata",
        },
      });

      condition.push({
        $unwind: {
          path: "$matchrundata",
        },
      });

      condition.push({
        $lookup: {
          from: "players",
          localField: "player_id",
          foreignField: "_id",
          as: "playerdata",
        },
      });

      condition.push({
        $unwind: {
          path: "$playerdata",
        },
      });

      condition.push({
        $lookup: {
          from: "teams",
          localField: "playerdata.team",
          foreignField: "_id",
          as: "team",
        },
      });

      condition.push({
        $unwind: {
          path: "$team",
        },
      });

      if (req.query.player_name) {
        condition.push({
          $match: {
            "playerdata.player_name": {
              $regex: new RegExp(req.query.player_name.toLowerCase(), "i"),
            },
          },
        });
      }

      resultMatchModel.countDocuments(condition).exec((err, rows) => {
        let totalFiltered = rows;
        let data = [];
        let count = 1;
        resultMatchModel.aggregate(condition).exec((err, rows1) => {
          rows1.forEach(async (doc) => {
            data.push({
              matchKey: doc.matchkey,
              teamKey: doc.team._id,
              teamName: doc.team.teamName,
              playerKey: doc.player_key,
              playerName: doc.playerdata.player_name,
              catches: doc.catch,
              stumbed: doc.stumbed,
              runOuts: doc.runouts,
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
      next(error);
    }
  }

  /**
   * @description Get Team Points
   * @route GET /team-points/:id
   */
  async teamPoints(req, res, next) {
    try {
      res.locals.message = req.flash();
      res.render("matchResult/teamPoints", {
        sessiondata: req.session.data,
        matchID: req.params.id,
        name: req.query.player_name,
      });
    } catch (error) {
      req.flash('error', 'Something went wrong please try again');
      res.redirect("/");
    }
  }

  /**
   * @description Get Team Points Datatable
   * @route POST /team-points-table/:id
   */
  async teamPointsData(req, res, next) {
    try {
      let limit = req.query.length;
      let start = req.query.start;
      let sortObj = {},
        dir,
        join;

      let condition = [];

      condition.push({
        $match: {
          matchkey: mongoose.Types.ObjectId(req.params.id),
        },
      });

      condition.push({
        $lookup: {
          from: "matchruns",
          localField: "matchkey",
          foreignField: "matchkey",
          as: "matchrundata",
        },
      });

      condition.push({
        $unwind: {
          path: "$matchrundata",
        },
      });

      condition.push({
        $lookup: {
          from: "players",
          localField: "player_id",
          foreignField: "_id",
          as: "playerdata",
        },
      });

      condition.push({
        $unwind: {
          path: "$playerdata",
        },
      });

      condition.push({
        $lookup: {
          from: "teams",
          localField: "playerdata.team",
          foreignField: "_id",
          as: "team",
        },
      });

      condition.push({
        $unwind: {
          path: "$team",
        },
      });

      if (req.query.player_name) {
        condition.push({
          $match: {
            "playerdata.player_name": {
              $regex: new RegExp(req.query.player_name.toLowerCase(), "i"),
            },
          },
        });
      }

      resultMatchModel.countDocuments(condition).exec((err, rows) => {
        let totalFiltered = rows;
        let data = [];
        let count = 1;
        resultMatchModel.aggregate(condition).exec((err, rows1) => {
          rows1.forEach(async (doc) => {
            data.push({
              matchKey: doc.matchkey,
              playerKey: doc.player_key,
              playerName: doc.playerdata.player_name,
              teamKey: doc.team._id,
              teamName: doc.team.teamName,
              playing11: `${doc.starting11 == 1 ? "Yes" : "No"}`,
              role: doc.playerdata.role,
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
      next(error);
    }
  }

  /**
   * @description Get Contest User Details
   * @route GET /contest-user-details/:id/:matchkey
   */
  async contestUserDetails(req, res, next) {
    try {
      res.locals.message = req.flash();
      res.render("matchResult/contestUserDetails", {
        sessiondata: req.session.data,
        matchkey: req.params.matchkey,
        cid: req.query.challengeid,
        teamName: req.query.teamName,//newnk
        Email: req.query.Email,
        Mobile: req.query.Mobile
      });
    } catch (error) {
      req.flash('error', 'Something went wrong please try again');
      res.redirect("/");
    }
  }

  /**
   * @description Get Contest User Details Datatable
   * @route POST /contest-user-details/:id/:matchkey
   */
  async contestUserDetailsData(req, res, next) {
    try {
      console.log("-----contestUserDetailsData table-----challengeid--------", req.query.challengeid)
      let limit = req.query.length;
      let start = req.query.start;
      let sortObj = {},
        dir,
        join;

      let condition = [];

      condition.push({
        $match: {
          challengeid: mongoose.Types.ObjectId(req.query.challengeid),
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
          from: "matchchallenges",
          localField: "challengeid",
          foreignField: "_id",
          as: "challengedata",
        },
      });

      condition.push({
        $unwind: {
          path: "$challengedata",
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

      joinedLeaugeModel.countDocuments(condition).exec((err, rows) => {
        let totalFiltered = rows;
        let data = [];
        let count = 1;
        joinedLeaugeModel.aggregate(condition).exec((err, rows1) => {
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
                                <a target="blank" class="btn btn-sm btn-info w-35px h-35px" data-toggle="tooltip" title="View Transaction" href="/viewtransactions/${doc.userdata._id}?challengeid=${doc.challengeid}"><i class="fas fa-eye"></i></a>`,
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

  /**
   * @description Update final status in listmatches
   * @route GET /updateMatchFinalStatus/:id/:status
   */
  async updateMatchFinalStatus(req, res, next) {
    try {
      res.locals.message = req.flash();
      if (req.params.status == "winnerdeclared") {
        if (
          req.body.masterpassword &&
          req.body.masterpassword == req.session.data.masterpassword
        ) {
          const getResult = await resultServices.distributeWinningAmount(req);//need to check becouse crown is remove

          let updatestatus = await listMatchesModel.updateOne(
            { _id: mongoose.Types.ObjectId(req.params.id) },
            {
              $set: {
                final_status: req.params.status,
              },
            }
          );
          req.flash("success", `Match ${req.params.status} successfully`);
          return res.redirect(`/match-details/${req.body.series}`);
        } else {
          req.flash("error", "Incorrect masterpassword");
          res.redirect(`/match-details/${req.body.series}`);
        }
      } else if (
        req.params.status == "IsAbandoned" ||
        req.params.status == "IsCanceled"
      ) {
        let reason = "";
        if (req.params.status == "IsAbandoned") {
          reason = "Match abandoned";
        } else {
          reason = "Match canceled";
        }
        const getResult = await resultServices.allRefundAmount(req, reason);
        await listMatchesModel.updateOne(
          { _id: mongoose.Types.ObjectId(req.params.id) },
          {
            $set: {
              final_status: req.params.status,
            },
          }
        );
        req.flash("success", `Match ${req.params.status} successfully`);
      }

      res.redirect(`/match-details/${req.body.series}`);
      // res.send({status:true});
    } catch (error) {
      req.flash('error', 'Something went wrong please try again');
      res.redirect("/");
    }
  }

  /**
   * @description Auto Update final status in listmatches
   * @route GET /updateMatchFinalStatus/:id/:status
   */
  async autoUpdateMatchFinalStatus(req, res, next) {
    try {
      const matches = await listMatchesModel.find({ status: 'completed', launch_status: 'launched', final_status: 'IsReviewed' });
      if (matches && Array.isArray(matches) && matches.length > 0) {
        let count = 0;
        for (let match of matches) {
          count++;
          await resultServices.distributeWinningAmount(req = { params: { id: match._id } });//need to check becouse crown is remove
          await listMatchesModel.updateOne(
            { _id: mongoose.Types.ObjectId(match._id) },
            {
              $set: {
                final_status: 'winnerdeclared',
              },
            }
          );
          if (count === matches.length) {
            console.log({ message: 'winner declared successfully!!!' });
          }
        }
      } else {
        console.log({ message: "No Match Found" });
      }


    } catch (error) {
      next(error);
    }
  }

  /**
   * @description GET View Teams
   * @route GET /view-teams?teamid=***
   */
  async viewTeams(req, res, next) {
    try {
      res.locals.message = req.flash();
      res.render("matchResult/viewTeams", {
        sessiondata: req.session.data,
        teamid: req.query.teamid,
      });
    } catch (error) {
      req.flash('error', 'Something went wrong please try again');
      res.redirect("/");
    }
  }

  /**
   * @description GET View Teams datatable
   * @route POST /view-teams?teamid=***
   */
  async viewTeamsData(req, res, next) {
    try {
      
      let limit = req.query.length;
      let start = req.query.start;
      let sortObj = {},
      dir,
      join;
      
      let condition = [];
      
      condition.push({
        $match: {
          _id: mongoose.Types.ObjectId(req.query.teamid),
        },
      });

      condition.push({
        $lookup: {
          from: "players",
          localField: "captain",
          foreignField: "_id",
          as: "captaindata",
        },
      });

      condition.push({
        $unwind: {
          path: "$captaindata",
        },
      });

      condition.push({
        $lookup: {
          from: "players",
          localField: "vicecaptain",
          foreignField: "_id",
          as: "vicecaptaindata",
        },
      });

      condition.push({
        $unwind: {
          path: "$vicecaptaindata",
        },
      });

      condition.push({
        $lookup: {
          from: "players",
          localField: "players",
          foreignField: "_id",
          as: "players",
        },
      });

      condition.push({
        $addFields: {
          player: "$players.player_name",
        },
      });
      
      
      joinTeamModel.countDocuments(condition).exec((err, rows) => {
        let totalFiltered = rows;
        let data = [];
        let count = 1;
        let counter = 1;
        let player = "";
        joinTeamModel.aggregate(condition).exec((err, rows1) => {
          console.log("view team data",rows1)
          rows1.forEach(async (doc) => {
            console.log('doc==>',doc);
            doc.player.forEach((i) => {
              player += `<span><div class="row"><div class="text-white bg-primary rounded-pill ml-1 px-2 py-1 my-1"><span class="bg-white mr-1 px-1 text-primary font-weight-bold rounded-pill">${counter++}</span> ${i} </div></div></span>`;
            });
            data.push({
              count: `<div class="row"><div class="text-white bg-primary rounded-pill ml-1 px-2 py-1 my-1"> ${count} </div></div>`,
              matchKey: doc.matchkey,
              teamNumber: doc.teamnumber,
              players: player,
              captain: `<div class="row"><div class="text-white bg-primary rounded-pill ml-1 px-2 py-1 my-1"> ${doc.captaindata.player_name} </div></div>`,
              viceCaptain: `<div class="row"><div class="text-white bg-primary rounded-pill ml-1 px-2 py-1 my-1"> ${doc.vicecaptaindata.player_name} </div></div>`,
              action: `<div class="dropdown show">
              <button class="btn btn-sm btn-primary btn-active-pink dropdown-toggle dropdown-toggle-icon" type="button" data-toggle="dropdown" aria-expanded="true">
                Action
              </button>
              <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton1">
                <li> <a class="dropdown-item" href="/edit-user-teams?teamid=${req.query.teamid}">Edit</a></li>
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
    }
  }
  async insertProfitLossData(req, res, next) {
    try {
      let insertData = await resultServices.insertProfitLossData();
      //res.send(insertData)
      if (insertData.status == true) {
        req.flash("success", insertData.message);
        res.redirect("/view-all-profit-loss");
      } else if (insertData.status == false) {
        req.flash("error", insertData.message);
        res.redirect("/view-all-profit-loss");
      }
    } catch (error) {
      req.flash('error', 'something is wrong please try again letter');
      res.redirect('/');
    }
  };
//edit User Teams edit user team

async editUserTeams(req, res) {
  try {
    res.locals.message = req.flash();
    res.render("matchResult/editUserTeams", {
      sessiondata: req.session.data,
      teamid: req.query.teamid,
      matchkey: req.query.matchkey,
    });
  } catch (error) {
    req.flash('error', 'Something went wrong please try again');
    res.redirect("/");
  }
};

async editUserTeamsTable(req, res) {
  try {
    let limit = req.query.length;
    let start = req.query.start;
    let sortObj = {},
      dir,
      join;
    let condition = [];
    let userTeam = [];

    condition.push({
      $match: {
        _id: mongoose.Types.ObjectId(req.query.teamid),
      },
    });

    // condition.push({
    //   $lookup: {
    //     from: "matchplayers",
    //     localField: "matchkey",
    //     foreignField: "matchkey",
    //     as: "matchplayers",
    //   },
    // });
    //nandlalcode
    condition.push({
      '$lookup': {
        'from': 'matchplayers',
        'localField': 'matchkey',
        'foreignField': 'matchkey',
        'pipeline': [
          {
            '$lookup': {
              'from': 'players',
              'localField': 'playerid',
              'foreignField': '_id',
              'pipeline': [
                {
                  '$lookup': {
                    'from': 'teams',
                    'localField': 'team',
                    'foreignField': '_id',
                    'pipeline': [
                      {
                        '$project': {
                          'short_name': 1
                        }
                      }
                    ],
                    'as': 'team'
                  }
                }, {
                  '$unwind': {
                    'path': '$team'
                  }
                }, {
                  '$replaceRoot': {
                    'newRoot': '$team'
                  }
                }
              ],
              'as': 'playerTeam'
            }
          }, {
            '$set': {
              'TeamName': '$playerTeam.short_name'
            }
          }, {
            '$unwind': {
              'path': '$TeamName'
            }
          }
        ],
        'as': 'matchplayers'
      }
    });

//nand;lalcode
    joinTeamModel.countDocuments(condition).exec((err, rows) => {
      let totalFiltered = rows;
      let data = [];
      let count = 1;
      let counter = 1;
      let player = "";
      joinTeamModel.aggregate(condition).exec((err, rows1) => {
        for (const id of rows1[0].players) {
          userTeam.push(id.toString())
        }
        console.log("--vicecaptain------>", rows1[0].vicecaptain.toString(), "---captain-->", rows1[0].captain.toString())
        for (const doc of rows1[0].matchplayers) {
          let action;
          if (userTeam.includes(doc.playerid.toString()) == true) {
            action = `<input type="checkbox" name="playerid" value="${doc.playerid.toString()}" checked  onclick="return MaxChecked()">`
          } else {
            action = `<input type="checkbox" name="playerid" value="${doc.playerid.toString()}"  onclick="return MaxChecked()">`
          };
          let captain;
          if (rows1[0].captain.toString() == doc.playerid.toString()) {
            captain = `<input type="checkbox" name="captain" value="${doc.playerid.toString()}" checked  onclick="return MaxCheckedCap()">`
          } else {
            captain = `<input type="checkbox" name="captain" value="${doc.playerid.toString()}"  onclick="return MaxCheckedCap()">`
          };

          let vicecaptain;
          if (rows1[0].vicecaptain.toString() == doc.playerid.toString()) {
            vicecaptain = `<input type="checkbox" name="vicecaptain" value="${doc.playerid.toString()}" checked  onclick="return MaxCheckedViceCap()">`
          } else {
            vicecaptain = `<input type="checkbox" name="vicecaptain" value="${doc.playerid.toString()}"  onclick="return MaxCheckedViceCap()">`
          };

          data.push({
            count: `<div class="row"><div class="text-white bg-primary rounded-pill ml-1 px-2 py-1 my-1"> ${count} </div></div>`,
            playerName: doc.name,
            playerRole: doc.role,
            playerCredit: doc.credit,
            team: doc.TeamName,
            action: action,
            captain: captain,
            vicecaptain: vicecaptain,
          });
          count++;

          if (count > rows1[0].matchplayers.length) {
            let json_data = JSON.stringify({
              "recordsTotal": rows,
              "recordsFiltered": totalFiltered,
              "data": data
            });
            res.send(json_data);
          }
        };
      });
    });
  } catch (error) {
    console.log(error);
  };
};
// user-team-modified ajex
async userTeamModified(req, res) {
  try {
    const data = await resultServices.userTeamModified(req);
    res.send(data);
  } catch (error) {
    console.log(error);
  };
};
  async cancelMatch(req, res, next) {
    try {
      let dataResponse = await resultServices.cancelMatch(req);
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

  
}

module.exports = new resultController();
