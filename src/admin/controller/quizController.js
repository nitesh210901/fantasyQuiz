const moment = require("moment");

const quizModel = require("../../models/quizModel");
const transactionModel = require("../../models/transactionModel");
const quizServices = require('../services/quizService');
const resultServices = require('../services/resultServices');
const listMatchModel = require("../../models/listMatchesModel");
const globalQuizModel = require("../../models/globalQuizModel");
const { default: mongoose } = require("mongoose");
const { pipeline } = require("form-data");
const QuizJoinLeaugeModel = require("../../models/QuizJoinLeaugeModel");
class quizController {
  constructor() {
    return {
      AddQuizPage: this.AddQuizPage.bind(this),
      AddQuiz: this.AddQuiz.bind(this),
      ViewQuiz: this.ViewQuiz.bind(this),
      QuizDataTable: this.QuizDataTable.bind(this),
      QuizGIveAnswer: this.QuizGIveAnswer.bind(this),
      editQuiz: this.editQuiz.bind(this),
      editQuizData: this.editQuizData.bind(this),
      deletequiz: this.deletequiz.bind(this),
      quizRefundAmount:this.quizRefundAmount.bind(this),
      updateMatchQuizStatus:this.updateMatchQuizStatus.bind(this),
      cancelQuiz:this.cancelQuiz.bind(this),
      matchAllquiz:this.matchAllquiz.bind(this),
      matchAllquizData:this.matchAllquizData.bind(this),
      quizUserDetails:this.quizUserDetails.bind(this),
      quizUserDetailsData:this.quizUserDetailsData.bind(this),
      quizviewtransactions:this.quizviewtransactions.bind(this),
      quizviewTransactionsDataTable:this.quizviewTransactionsDataTable.bind(this),
    //   view_youtuber_dataTable: this.view_youtuber_dataTable.bind(this)
    };
  }


  async AddQuizPage(req, res, next) {
      try {
      // const listmatch = await listMatchModel.find({ isQuiz: 1, is_deleted: false })   
      let curTime = moment().format("YYYY-MM-DD HH:mm:ss");
      // const listmatch = await listMatchModel.find({ status: "notstarted", launch_status: "launched", start_date: { $gt: curTime } ,isQuiz:1}, { name: 1 });  
      const listmatch = await listMatchModel.find({ status: "notstarted", launch_status: "launched", start_date: { $gt: curTime }}, { name: 1 });  
      res.locals.message = req.flash();
      res.render("quiz/add_quiz", {
        sessiondata: req.session.data,
        data: undefined,
        msg: undefined,
        listmatch: listmatch
      });
    } catch (error) {
      console.log(error);
      req.flash("error", "Something went wrong please try again");
      res.redirect("/");
    }
    }

    async AddQuiz(req, res, next) {
        try {
            const data = await quizServices.AddQuiz(req);
            if (data.status) {
                req.flash('success',data.message)
                res.redirect("/add_quiz");
            }else if (data.status == false) {
                req.flash('error',data.message)
                res.redirect("/add_quiz");
            }
        } catch (error) {
          console.log(error);
            req.flash('error','something is wrong please try again later');
            res.redirect('/add_quiz');
        }
    }
    
  async ViewQuiz(req, res, next) {
    try {
      let pipeline = [];

      pipeline.push({
        $group: {
          _id: "$matchkey",
        },
      })
      pipeline.push({
        $lookup: {
          from: "listmatches",
          let: {
            id: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", "$$id"],
                },
              },
            },
            {
              $project: {
                name: 1,
              },
            },
          ],
          as: "listmatch",
        },
      })

      pipeline.push({
        $addFields: {
          matchname: {
            $getField: {
              field: "name",
              input: {
                $arrayElemAt: ["$listmatch", 0],
              },
            },
          },
        },
      })

      pipeline.push({
        $project: {
          _id: 1,
          matchname: 1,
        },
      })
      let listmatch = await quizModel.aggregate(pipeline)
      res.locals.message = req.flash();
      const { match_name,question } = req.query;
        res.render("quiz/view_quiz", { sessiondata: req.session.data,question:question, listmatch,Question:req.query.question,matchkey:req.query.matchkey});
    } catch (error) {
      console.log(error)
        req.flash('error','something is wrong please try again later');
        res.redirect("/");
    }
  }
  async QuizDataTable(req, res, next) {
    try {
        let limit1 = req.query.length;
        let start = req.query.start;
        let sortObject = {},
            dir, join
      let conditions = {}; 
      if (req.query.Question) {
        conditions.question = { $regex: req.query.Question };
      }
      let matchkey = req.query.matchkey
      
      if (matchkey !== "undefined") {
        conditions.matchkey =  matchkey;
      }
        quizModel.countDocuments(conditions).exec((err, rows) => {
            // console.log("rows....................",rows)
            let totalFiltered = rows;
            let data = [];
            let count = 1;
            quizModel.find(conditions).skip(Number(start) ? Number(start) : '').limit(Number(limit1) ? Number(limit1) : '').exec((err, rows1) => {
                // console.log('--------rows1-------------', rows1);
                if (err) console.log(err);
              rows1.forEach(async(index) => {
                let pipeline = []
                pipeline.push({
                  '$match': {
                    '_id': mongoose.Types.ObjectId(index._id)
                  }
                }, {
                  '$lookup': {
                    'from': 'listmatches', 
                    'localField': 'matchkey', 
                    'foreignField': '_id', 
                    'as': 'match'
                  }
                }, {
                  '$addFields': {
                    'match_name': {
                      '$arrayElemAt': [
                        '$match', 0
                      ]
                    }
                  }
                }, {
                  '$addFields': {
                    'match_name': '$match_name.name'
                  }
                }, {
                  '$project': {
                    '_id': 0, 
                    'match_name': 1
                  }
                })
                let matchName = await quizModel.aggregate(pipeline)
                let option = '<ol>'
                let answer = ''
                let showopt = ''
                let k=1
                for (let item in index.options[0]) {
                  showopt += `<option value="${item}">Option ${k}</option>`;
                  if (item === index.answer) {
                    answer += index.options[0][`${item}`]
                  }
                  option += `<li>${index.options[0][`${item}`]}</li>`
                  k++
                }
                option += "</ol>"
                    data.push({
                      "count": count,
                      "Match Name":matchName[0].match_name,
                        "question": index.question,
                        "options": `${option}`,
                      "answer": `${answer}` || `<a href="#" class="btn btn-sm text-uppercase btn-success text-white" data-toggle="modal" data-target="#key${count}"><span data-toggle="tooltip" title="Give Answer">&nbsp; ${index.answer}</span></a>
                      <div class="modal fade" id="key${count}" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                      <div class="modal-dialog col-6">
                      <div class="modal-content">
                          <div class="modal-header">
                          <h5 class="modal-title" id="exampleModalLabel">Answer</h5>
                          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                              <span aria-hidden="true">×</span>
                          </button>
                          </div>
                          <div class="modal-body">
                              <form action="/quiz_give_answer/${index._id}" method="post">
                                  <div class="col-md-12 col-sm-12 form-group">
                                      <label>Give Your Answer</label>
                                      <select class="form-control" style="text-align:center;" name="answer">
                                      ${showopt}
                                      </select>
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
                </div>`,
                        "Action": `<a href="/edit-quiz/${index._id}" class="btn btn-sm btn-orange w-35px h-35px text-uppercase text-nowrap" data-toggle="tooltip" title="Edit"><i class="fad fa-pencil"></i></a>
                        <a  onclick="delete_sweet_alert('/deletequiz?quizId=${index._id}', 'Are you sure you want to delete this data?')" class="btn btn-sm btn-danger w-35px h-35px text-uppercase"><i class='fas fa-trash-alt'></i></a>`
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
    
    async editQuiz(req, res, next) {
        try {
          res.locals.message = req.flash();
          let curTime = moment().format("YYYY-MM-DD HH:mm:ss");
          //   const listmatch = await listMatchModel.find({ status: "notstarted", launch_status: "launched", start_date: { $gt: curTime } ,isQuiz:1}, { name: 1 });  
          const data = await quizServices.editQuiz(req);
          const listmatch = await listMatchModel.findOne({_id:data.matchkey},{ name: 1 });  
            if (data) {
                res.render("quiz/editQuiz", { sessiondata: req.session.data, msg: undefined, data ,listmatch});
            }
        } catch (error) {
            console.log(error)
            req.flash('error','something is wrong please try again later');
            res.redirect("/view-teams");
        }
    }

    async editQuizData(req, res, next) {
        try {
            const data = await quizServices.editQuizData(req);
          
            if (data.status == true) {
                req.flash("success",data.message )
                res.redirect("/view_quiz");
            }
            if (data.status == false) {
                req.flash("error",data.message );
                return res.redirect(`/edit-quiz/${req.params.id}`);
            }
        } catch (error) {
            // next(error);
            req.flash('error','something is wrong please try again later');
            res.redirect("/view_quiz");
        }
    }

    async deletequiz(req, res, next) {
        try {
          const deletequiz = await quizServices.deletequiz(req);
          if (deletequiz.status == true) {
            req.flash("success",deletequiz.message)
            res.redirect("/view_quiz");
        }else{
            req.flash("error",deletequiz.message)
            res.redirect("/view_quiz");
        }
        } catch (error) {
          //  next(error);
          req.flash("error", "Something went wrong please try again");
          res.redirect("/view_quiz");
        }
    }

  
  async QuizGIveAnswer(req,res,next){
    try{
        res.locals.message = req.flash();
       const data = await quizServices.QuizGIveAnswer(req);
        if(data.status == true){
          req.flash('success', data.message)
          if (req.query.quiz) {
            res.redirect(`/allquiz/${data.data?.matchkey}`);
          } else {
            res.redirect(`/view_quiz`);
          }
        }else{
            req.flash('error',data.message)
            res.redirect(`/view_quiz`);
        }
    }catch(error){
        //  next(error);
        req.flash('error','Something went wrong please try again');
        res.redirect("/view_quiz");
    }
  }
  async quizRefundAmount(req, res) {
    try {
      const getResult = await quizServices.quizRefundAmount(req);
      res.send({status:true});
    } catch (error) {
      console.log('error',error);
    }
  }

  async updateMatchQuizStatus(req, res, next) {
    try {
      res.locals.message = req.flash();
      if (req.params.status == "winnerdeclared") {
        if (
          req.body.masterpassword &&
          req.body.masterpassword == req.session.data.masterpassword
        ) {
          const getResult = await quizServices.quizdistributeWinningAmountWithAnswerMatch(req);//need to check becouse crown is remove

          let updatestatus = await listMatchModel.updateOne(
            { _id: mongoose.Types.ObjectId(req.params.id) },
            {
              $set: {
                quiz_status: req.params.status,
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
          reason = "Quiz abandoned";
        } else {
          reason = "Quiz canceled";
        }
        const getResult = await quizServices.quizallRefundAmount(req, reason);
        await listMatchModel.updateOne(
          { _id: mongoose.Types.ObjectId(req.params.id) },
          {
            $set: {
              quiz_status: req.params.status,
            },
          }
        );
        req.flash("success", `Quiz ${req.params.status} successfully`);
      }

      res.redirect(`/match-details/${req.body.series}`);
      // res.send({status:true});
    } catch (error) {
      console.log(error)
      req.flash('error', 'Something went wrong please try again');
      res.redirect("/");
    }
  }

  async cancelQuiz(req, res, next) {
    try {
      let dataResponse = await quizServices.cancelQuiz(req);
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

  async matchAllquiz(req, res, next) {
    try {
      res.locals.message = req.flash();
      res.render("quiz/matchAllQuiz", {
        sessiondata: req.session.data,
        matchID: req.params.id,
        seriesId: req.query.seriesId
      });
    } catch (error) {
      next(error);
    }
  }
  async matchAllquizData(req, res, next) {
    try {
      let series_id = req.query.seriesId
      let limit = req.query.length;
      let start = req.query.start;
      let sortObj = {},
      dir,
      join;
      let condition = [];
      condition.push({
        $match: {
          matchkey: new mongoose.Types.ObjectId(req.params.id)
        }
      })
      quizModel.countDocuments(condition).exec((err, rows) => {
        let totalFiltered = rows;
        let data = [];
        let count = 1;
  
        quizModel.aggregate(condition).exec((err, rows1) => {
          rows1.forEach(async (doc) => {
            let showopt = ""
            let answer = ""
            for (let item in doc.options[0]) {
              showopt += `<option value="${item}">${doc.options[0][item]}</option>`
              if (doc.answer === item) {
                answer+= doc.options[0][item]
              }
            }
            let matchStatus = "";
            let actions="";
            if(doc.joinedusers != 0){
              actions += `<a href="/quiz-user-details/${doc.matchkey}?quizId=${doc._id}" class="btn btn-sm btn-primary w-35px h-35px" data-toggle="tooltip" title="View Users" data-original-title="View User" aria-describedby="tooltip768867"><i class="fas fa-eye"></i></a>`
            }else{
              actions +=  'No Users | '
            }
            
              if(doc.quiz_status != 'IsCanceled'){
                actions += `<a href="/cancelQuiz/${series_id}?matchkey=${doc.matchkey}&status=IsCanceled" class="btn btn-sm btn-secondary w-35px h-35px" data-toggle="tooltip" title="Cancel Quiz" data-original-title="Cancel Contest" aria-describedby="tooltip768867"><i class="fas fa-window-close"></i></a></div>`
              }else{
                actions += " | <tagname style='color:red;'>Canceled"
              }
            data.push({
              count: count,
              question: doc.question,
              admin_answer: `${answer}`|| `<a href="#" class="btn btn-sm text-uppercase btn-success text-white" data-toggle="modal" data-target="#key${count}"><span data-toggle="tooltip" title="Give Answer">&nbsp; ${doc.answer}</span></a>
              <div class="modal fade" id="key${count}" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
              <div class="modal-dialog col-6">
              <div class="modal-content">
                  <div class="modal-header">
                  <h5 class="modal-title" id="exampleModalLabel">Answer</h5>
                  <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                      <span aria-hidden="true">×</span>
                  </button>
                  </div>
                  <div class="modal-body">
                      <form action="/quiz_give_answer/${doc._id}?quiz='result'" method="post">
                          <div class="col-md-12 col-sm-12 form-group">
                              <label>Give Your Answer</label>
                              <select class="form-control" style="text-align:center;" name="answer">
                              ${showopt}
                              </select>
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
             </div>`,
              entryfee: doc.entryfee,
              joined_user: doc.joinedusers,
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
      console.log(error);
    }
  }
  
  async quizUserDetails(req, res, next) {
    try {
      res.locals.message = req.flash();
      res.render("quiz/quizUserDetails", {
        sessiondata: req.session.data,
        matchkey: req.params.matchkey,
        qid: req.query.quizId,
        teamName: req.query.teamName,//newnk
        Email: req.query.Email,
        Mobile: req.query.Mobile
      });
    } catch (error) {
      req.flash('error', 'Something went wrong please try again');
      res.redirect("/");
    }
  }
  async quizUserDetailsData(req, res, next) {
    try {
      console.log("-----quiztUserDetailsData table-----quizId--------", req.query.quizId)
      let limit = req.query.length;
      let start = req.query.start;
      let sortObj = {},
        dir,
        join;

      let condition = [];

      condition.push({
        $match: {
          quizId: mongoose.Types.ObjectId(req.query.quizId),
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
      // if (req.query.teamName != "") {
      //   match.team = { $regex: req.query.teamName, $options: "i" }
      // }
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
                // team: 1,
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
          from: "quizzes",
          localField: "quizId",
          foreignField: "_id",
          as: "quizdata",
        },
      });

      condition.push({
        $unwind: {
          path: "$quizdata",
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
      QuizJoinLeaugeModel.countDocuments(condition).exec((err, rows) => {
        let totalFiltered = rows;
        let data = [];
        let count = 1;
        QuizJoinLeaugeModel.aggregate(condition).exec((err, rows1) => {
          rows1.forEach(async (doc) => {
            let option = '<ol>'
                for (let item in doc.quizdata.options[0]) {
                  option += `<li>${doc.quizdata.options[0][item]}</li>`
                }
            option += "</ol>"
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
              // teamName: doc.userdata.team,//nandlal
              //userName: doc.userdata.username,
              email: doc.userdata.email,
              mobile: doc.userdata.mobile,
              quiz_option: `${option}`,
              user_answer:doc.answer,
              transactionId: doc.transaction_id,
              points: points,
              // amount: winnerAmt,
              action: `<a target="blank" class="btn btn-sm btn-info w-35px h-35px" data-toggle="tooltip" title="View Transaction" href="/quizviewtransactions/${doc.userdata._id}?quizId=${doc.quizId}"><i class="fas fa-eye"></i></a>`,
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

  async quizviewtransactions(req, res, next) {
    try {
      const findTransactions = await quizServices.viewtransactions(req);
      if (findTransactions.status == true) {
        const { start_date, end_date, quizId } = req.query;
        res.render("quiz/viewTransactions", {
          sessiondata: req.session.data,
          findTransactionsId: findTransactions.data.userid,
          start_date: start_date,
          end_date: end_date,
          quizId: quizId,
        });
      }
    } catch (error) {
      req.flash("warning", "No transaction to show");
      res.redirect("/");
    }
  }

  async viewTransactionsDataTable(req, res, next) {
    try {
      let limit1 = req.query.length;
      let start = req.query.start;
      let sortObject = {},
        dir,
        join,
        conditions = { userid: req.params.id };
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

      if (req.query.challengeid) {
        conditions.challengeid = mongoose.Types.ObjectId(req.query.challengeid);
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

      transactionModel.countDocuments(conditions).exec((err, rows) => {
        let totalFiltered = rows;
        let data = [];
        let count = 1;
        transactionModel
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
  async quizviewTransactionsDataTable(req, res, next) {
    try {
      let limit1 = req.query.length;
      let start = req.query.start;
      let sortObject = {},
      dir,
      join,
      conditions = { userid: req.params.id };
      let name;
      console.log("helllo",conditions)
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

      if (req.query.quizId) {
        conditions.quizId = mongoose.Types.ObjectId(req.query.quizId);
      }
      console.log(conditions,"llllllllll")
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

      transactionModel.countDocuments(conditions).exec((err, rows) => {
        let totalFiltered = rows;
        let data = [];
        let count = 1;
        transactionModel
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
module.exports = new quizController();
