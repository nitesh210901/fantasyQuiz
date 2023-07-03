const moment = require("moment");

const quizModel = require("../../models/quizModel");
const transactionModel = require("../../models/transactionModel");
const stockQuizService = require('../services/stockQuizService');
const resultServices = require('../services/resultServices');
const stockContestModel = require("../../models/stockContestModel");
const globalQuizModel = require("../../models/globalQuizModel");
const { default: mongoose } = require("mongoose");
const { pipeline } = require("form-data");
const QuizJoinLeaugeModel = require("../../models/QuizJoinLeaugeModel");
const stockQuizModel = require("../../models/stockQuizModel");
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
      quizautoupdateMatchFinalStatus: this.quizautoupdateMatchFinalStatus.bind(this),
      quizupdateMatchFinalStatus: this.quizupdateMatchFinalStatus.bind(this),
      ViewallGlobalQuestions_page: this.ViewallGlobalQuestions_page.bind(this),
      globalQuestionsDatatable: this.globalQuestionsDatatable.bind(this),
      addGlobalQuestionPage: this.addGlobalQuestionPage.bind(this),
      addGlobalQuestion: this.addGlobalQuestion.bind(this),
      editglobalquestion_page: this.editglobalquestion_page.bind(this),
      editGlobalQuestionData: this.editGlobalQuestionData.bind(this),
      deleteGlobalQuestion: this.deleteGlobalQuestion.bind(this),
      globalQuestionMuldelete: this.globalQuestionMuldelete.bind(this),
      importGlobalQuestionPage: this.importGlobalQuestionPage.bind(this),
      importQuestionData:this.importQuestionData.bind(this),
      importGlobalContestPage:this.importGlobalContestPage.bind(this),
      quizimportchallengersData:this.quizimportchallengersData.bind(this),
      quizRefundAmount:this.quizRefundAmount.bind(this),
      updateMatchQuizStatus:this.updateMatchQuizStatus.bind(this),
      cancelQuiz:this.cancelQuiz.bind(this),
      matchAllquiz:this.matchAllquiz.bind(this),
      matchAllquizData:this.matchAllquizData.bind(this),
      quizCancel:this.quizCancel.bind(this),
      quizUserDetails:this.quizUserDetails.bind(this),
      quizUserDetailsData:this.quizUserDetailsData.bind(this),
      quizviewtransactions:this.quizviewtransactions.bind(this),
      quizviewTransactionsDataTable:this.quizviewTransactionsDataTable.bind(this),
      EnableStockQuiz:this.EnableStockQuiz.bind(this),
    //   view_youtuber_dataTable: this.view_youtuber_dataTable.bind(this)
    };
  }


  async AddQuizPage(req, res, next) {
      try {
      let curTime = moment().format("YYYY-MM-DD HH:mm:ss");
      const listmatch = await stockContestModel.find({ status: "notstarted", launch_status: "launched", start_date: { $gt: curTime }}, { contest_name: 1 });  
      res.locals.message = req.flash();
      res.render("stockQuiz/add_quiz", {
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
            const data = await stockQuizService.AddQuiz(req);
            if (data.status) {
                req.flash('success',data.message)
                res.redirect("/stock/add_quiz");
            }else if (data.status == false) {
                req.flash('error',data.message)
                res.redirect("/stock/add_quiz");
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
          _id: "$contestId",
        },
      })
      pipeline.push({
        $lookup: {
          from: "stock_contests",
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
                contest_name: 1,
              },
            },
          ],
          as: "stock_contests",
        },
      })

      pipeline.push({
        $addFields: {
          contestname: {
            $getField: {
              field: "contest_name",
              input: {
                $arrayElemAt: ["$stock_contests", 0],
              },
            },
          },
        },
      })

      pipeline.push({
        $project: {
          _id: 1,
          contestname: 1,
        },
      })
      let listmatch = await stockQuizModel.aggregate(pipeline);
      console.log(listmatch)
      res.locals.message = req.flash();
      const { match_name,question } = req.query;
        res.render("stockQuiz/view_quiz", { sessiondata: req.session.data,question:question, listmatch,Question:req.query.question,contest:req.query.contest});
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
      stockQuizModel.countDocuments(conditions).exec((err, rows) => {
            // console.log("rows....................",rows)
            let totalFiltered = rows;
            let data = [];
            let count = 1;
            stockQuizModel.find(conditions).skip(Number(start) ? Number(start) : '').limit(Number(limit1) ? Number(limit1) : '').exec((err, rows1) => {
                // console.log('--------rows1-------------', rows1);
                if (err) console.log(err);
                  rows1.forEach(async (index) => {
                       let check_stock_enable;
                        if (index.is_enabled) {
                          check_stock_enable = `<a href="" class="btn btn-sm btn-danger  text-uppercase" data-toggle="tooltip" title="Check Rank" style="pointer-events: none">Enabled</a>`
                        } else {
                          check_stock_enable = `<a href="/stock/enable_quiz?stockQuiztId=${index._id}" class="btn btn-sm btn-danger  text-uppercase" data-toggle="tooltip" title="Check Rank">Enable Quiz</a>`
                        }
                    data.push({
                        "count": count,
                        "question": index.question,
                        "option_1": index.option_1,
                        "option_2": index.option_2,
                        "option_3": index.option_3,
                        "is_enabled": `${check_stock_enable}`,
                        "entryfee": index.entryfee,
                        "Action": `<a href="/stock/edit-quiz/${index._id}" class="btn btn-sm btn-orange w-35px h-35px text-uppercase text-nowrap" data-toggle="tooltip" title="Edit"><i class="fad fa-pencil"></i></a>
                        <a  onclick="delete_sweet_alert('/stock/deletequiz?quizId=${index._id}', 'Are you sure you want to delete this data?')" class="btn btn-sm btn-danger w-35px h-35px text-uppercase"><i class='fas fa-trash-alt'></i></a>`
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
  
  async EnableStockQuiz(req, res, next) {
    try {
        const data = await stockQuizService.EnableStockQuiz(req);
        if (data.status) {
            req.flash('success',data.message)
            res.redirect("/stock/view_quiz");
        }else if (data.status == false) {
            req.flash('error',data.message)
            res.redirect("/stock/view_quiz");
        }
    } catch (error) {
        console.log(error);
        req.flash('error','something is wrong please try again later');
        res.redirect('/stock/add_quiz');
    }
}
    
    async editQuiz(req, res, next) {
        try {
          res.locals.message = req.flash();
          let data = await stockQuizService.editQuiz(req);
          if (data) {
             res.render("stockQuiz/editQuiz", { sessiondata: req.session.data, msg: undefined, data})
          }
        } catch(error) {
            req.flash('error','something is wrong please try again later');
            res.redirect("/view-teams");
        }
  }
  
    async editQuizData(req, res, next) {
        try {
            const data = await stockQuizService.editQuizData(req);
            if (data.status == true) {
                req.flash("success",data.message )
                res.redirect("/stock/view_quiz");
            } 
            if (data.status == false) {
                req.flash("error",data.message );
                return res.redirect(`/stock/edit-quiz/${req.params.id}`);
            }
        } catch (error) {
          console.log(error);
            // next(error);
            req.flash('error','something is wrong please try again later');
            res.redirect("/stock/add_quiz");
        }
    }

    async deletequiz(req, res, next) {
        try {
          const deletequiz = await stockQuizService.deletequiz(req);
          if (deletequiz.status == true) {
            req.flash("success",deletequiz.message)
            res.redirect("/stock/view_quiz");
        }else{
            req.flash("error",deletequiz.message)
            res.redirect("/stock/view_quiz");
        }
        } catch (error) {
          //  next(error);
          req.flash("error", "Something went wrong please try again");
          res.redirect("/stock/view_quiz");
        }
    }
    
    async quizautoupdateMatchFinalStatus(req, res, next) {
        try {
          const matches = await listMatchModel.find({ status: 'completed', launch_status: 'launched', final_status: 'IsReviewed' });
          if (matches && Array.isArray(matches) && matches.length > 0) {
            let count = 0;
            for (let match of matches) {
              count++;
              await stockQuizService.quizdistributeWinningAmount(req = { params: { id: match._id } });//need to check becouse crown is remove
              await listMatchModel.updateOne(
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
    
    async quizupdateMatchFinalStatus(req, res, next) {
        try {
          res.locals.message = req.flash();
          if (req.params.status == "winnerdeclared") {
            if (
              req.body.masterpassword &&
              req.body.masterpassword == req.session.data.masterpassword
            ) {
              const getResult = await stockQuizService.quizdistributeWinningAmount(req);//need to check becouse crown is remove
    
              let updatestatus = await listMatchModel.updateOne(
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
            await listMatchModel.updateOne(
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
      
  async ViewallGlobalQuestions_page(req, res, next) {
    try {
        res.locals.message = req.flash();
        res.render("quiz/viewallglobalquestions", { sessiondata: req.session.data });
      } catch (error) {
        req.flash('error','something is wrong please try again later');
        res.redirect("/");
    }
  }
  async globalQuestionsDatatable(req, res, next) {
    try {
        let limit1 = req.query.length;
        let start = req.query.start;
        let sortObject = {},
            dir, join
        let conditions = {};
        if(req.query.fantasy_type){
            conditions.fantasy_type = req.query.fantasy_type 
        }
        globalQuizModel.countDocuments(conditions).exec((err, rows) => {
            let totalFiltered = rows;
            let data = [];
            let count = 1;
            globalQuizModel.find(conditions).skip(Number(start) ? Number(start) : '').limit(Number(limit1) ? Number(limit1) : '').exec((err, rows1) => {
             
                if (err) console.log(err);
                    rows1.forEach(async(index)=>{
                    data.push({
                        's_no': `<div class="custom-control custom-checkbox">
                        <input type="checkbox" class="custom-control-input checkbox" name="checkCat" id="check${index._id}" value="${index._id}">
                        <label class="custom-control-label" for="check${index._id}"></label></div>`,
                        "count" :count,
                        "question" :`${index.question}`,
                        "answer":`${index.answer}`,
                         "action":`<div class="btn-group dropdown">
                         <button class="btn btn-primary text-uppercase rounded-pill btn-sm btn-active-pink dropdown-toggle dropdown-toggle-icon" data-toggle="dropdown" type="button" aria-expanded="true" style="padding:5px 11px">
                             Action <i class="dropdown-caret"></i>
                         </button>
                         <ul class="dropdown-menu" style="opacity: 1;">
                             <li><a class="dropdown-item waves-light waves-effect" href="/edit-global-question/${index._id}">Edit</a></li>
                             <li> <a class="dropdown-item waves-light waves-effect" onclick="delete_sweet_alert('/delete-global-question?globelQuestionId=${index._id}', 'Are you sure you want to delete this data?')">Delete</a></li>
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
  
      async addGlobalQuestionPage(req, res, next) {
        try { 
        res.locals.message = req.flash();
        res.render("quiz/addglobalquestion", {
          sessiondata: req.session.data,
          data: undefined,
          msg: undefined
        });
      } catch (error) {
        req.flash("error", "Something went wrong please try again");
        res.redirect("/");
      }
  }
  
  async addGlobalQuestion(req, res, next) {
    try {
        const data = await stockQuizService.addGlobalQuestion(req);
        if (data.status) {
            req.flash('success',data.message)
            res.redirect("/add-global-question");
        }else if (data.status == false) {
            req.flash('error',data.message)
            res.redirect("/add-global-question");
        }
    } catch (error) {
        req.flash('error','something is wrong please try again later');
        res.redirect('/add-global-question');
    }
  }
  async editglobalquestion_page(req, res, next) {
    try {
        res.locals.message = req.flash();
        const getdata = await stockQuizService.editglobalquestion(req);
        if (getdata.status== true) {
            res.render('quiz/editGlobelQuestion',{ sessiondata: req.session.data, data:getdata.data});
        }else if(getdata.status == false){
            req.flash('warning',getdata.message);
            res.redirect('/view-all-global-questions');
        }

    } catch (error) {
        //  next(error);
        req.flash('error','Something went wrong please try again');
        res.redirect("/view-all-global-questions");
    }
  }
  async editGlobalQuestionData(req, res, next) {
    try {
        res.locals.message = req.flash();
        const editQuestionData=await stockQuizService.editGlobalQuestionData(req);
        if(editQuestionData.status == true){
            req.flash('success',editQuestionData.message);
            res.redirect(`/edit-global-question/${req.body.globelQuestionId}`);
        }else if(editQuestionData.status == false){
            req.flash('error',editQuestionData.message);
            res.redirect(`/edit-global-question/${req.body.globelQuestionId}`);
        }
    } catch (error) {
        //  next(error);
        req.flash('error','Something went wrong please try again');
        res.redirect("/view-all-global-questions");
    }
  }
  
  async deleteGlobalQuestion(req,res,next){
    try {
        const deleteQuestions=await stockQuizService.deleteGlobalQuestion(req);
        if(deleteQuestions){
            res.redirect("/view-all-global-questions")
        }
    } catch (error) {
        //  next(error);
        req.flash('error','Something went wrong please try again');
        res.redirect("/view-all-global-questions");
}
  }
  
  async globalQuestionMuldelete(req,res,next){
    try {
        const deleteManyQuestions=await stockQuizService.globalQuestionMuldelete(req);
        res.send({data:deleteManyQuestions});
    } catch (error) {
        //  next(error);
        req.flash('error','Something went wrong please try again');
        res.redirect("/view-all-global-questions");
}
  }
  
  async importGlobalQuestionPage(req, res, next) {
    try {
      res.locals.message = req.flash();
      const getlunchedMatches=await stockQuizService.createCustomQuestions(req);
      if (getlunchedMatches.status == true) {
          let mkey=req.query.matchkey
          res.render("quiz/importGlobalQuestion",{ sessiondata: req.session.data, listmatches:getlunchedMatches.data,matchkey:mkey,quizData:getlunchedMatches.quizData});

      }else if(getlunchedMatches.status == false){

          req.flash('error',getlunchedMatches.message);
          res.redirect('/');
      }

    } catch (error) {
      console.log(error);
        //  next(error);
        req.flash('error','Something went wrong please try again');
        res.redirect("/");
    }
  }


  async importQuestionData(req,res,next){
    try{
        res.locals.message = req.flash();
        const data=await stockQuizService.importQuestionData(req);
        if(data.status == true){
            req.flash('success',data.message)
            res.redirect(`/Import-global-questions?matchkey=${req.params.matchKey}`);
        }else{
            req.flash('error',data.message)
            res.redirect(`/Import-global-questions?matchkey=${req.params.matchKey}`);
        }
    }catch(error){
        //  next(error);
        req.flash('error','Something went wrong please try again');
        res.redirect("/Import-global-questions");
    }
  }
  
  async importGlobalContestPage(req,res,next){
    try {
        res.locals.message = req.flash();
        const getlunchedMatches=await stockQuizService.quizcreateCustomContest(req);

        if (getlunchedMatches.status == true) {
            let mkey=req.query.matchkey
            let fantasy_type=req.query.fantasy_type;
            let objfind={};
               if(req.query.entryfee && req.query.entryfee != ""){
                objfind.entryfee= req.query.entryfee
                }
                if(req.query.win_amount && req.query.win_amount != ""){
                objfind.win_amount= req.query.win_amount
                }
                if(req.query.team_limit && req.query.team_limit != ""){
                objfind.team_limit= req.query.team_limit
                }
            res.render("quiz/quizcreateCustomContest",{ sessiondata: req.session.data, listmatches:getlunchedMatches.data,matchkey:mkey,matchData:getlunchedMatches.matchData,dates:getlunchedMatches.dates,fantasy_type,objfind});

        }else if(getlunchedMatches.status == false){

            req.flash('error',getlunchedMatches.message);
            res.redirect('/');
        }

    }catch(error){
        //  next(error);
        req.flash('error','Something went wrong please try again');
        res.redirect("/");
    }
  }
  
  async quizimportchallengersData(req,res,next){
    try{
        res.locals.message = req.flash();
        const data=await stockQuizService.quizimportchallengersData(req);
        if(data.status == true){
            req.flash('success',data.message)
            res.redirect(`/Import-global-contest?matchkey=${req.params.matchKey}`);
        }else{
            req.flash('error',data.message)
            res.redirect(`/Import-global-contest?matchkey=${req.params.matchKey}`);
        }
    }catch(error){
        //  next(error);
        req.flash('error','Something went wrong please try again');
        res.redirect("/Import-global-contest");
    }
  }
  
  async QuizGIveAnswer(req,res,next){
    try{
        res.locals.message = req.flash();
       const data = await stockQuizService.QuizGIveAnswer(req);
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
      const getResult = await stockQuizService.quizRefundAmount(req);
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
          const getResult = await stockQuizService.quizdistributeWinningAmountWithAnswerMatch(req);//need to check becouse crown is remove

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
        const getResult = await stockQuizService.quizallRefundAmount(req, reason);
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
      let dataResponse = await stockQuizService.cancelQuiz(req);
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
      });
    } catch (error) {
      next(error);
    }
  }
  async matchAllquizData(req, res, next) {
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
            
              if(doc.quiz_status != 'canceled'){
                actions += `<a href="/quizcancel/${doc._id}?matchkey=${doc.matchkey}" class="btn btn-sm btn-secondary w-35px h-35px" data-toggle="tooltip" title="Cancel Quiz" data-original-title="Cancel Contest" aria-describedby="tooltip768867"><i class="fas fa-window-close"></i></a></div>`
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
      
    }
  }

  async quizCancel(req, res, next) {
    try {
      const isCancelQuiz = await stockQuizService.quizCancel(req);
      if (isCancelQuiz.status == true) {
        req.flash("success", isCancelQuiz.message);
        res.redirect(`/allquiz/${req.query.matchkey}`);
      } else if (isCancelQuiz.status == false) {
        req.flash("error", isCancelQuiz.message);
        res.redirect(`/allquiz/${req.query.matchkey}`);
      }
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
      const findTransactions = await stockQuizService.viewtransactions(req);
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
