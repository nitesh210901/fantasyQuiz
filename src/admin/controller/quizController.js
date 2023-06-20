const moment = require("moment");

const quizModel = require("../../models/quizModel");
const quizServices = require('../services/quizService');
const resultServices = require('../services/resultServices');
const listMatchModel = require("../../models/listMatchesModel");
const globalQuizModel = require("../../models/globalQuizModel");
const { default: mongoose } = require("mongoose");
const { pipeline } = require("form-data");
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
      cancelQuiz:this.cancelQuiz.bind(this)
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
                      "answer": `${answer}` || `<a href="#" class="btn btn-sm text-uppercase btn-success text-white" data-toggle="modal" data-target="#key304"><span data-toggle="tooltip" title="Give Answer">&nbsp; ${index.answer}</span></a>
                      <div class="modal fade" id="key304" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
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
            const listmatch = await listMatchModel.find({ status: "notstarted", launch_status: "launched", start_date: { $gt: curTime }}, { name: 1 });  
            const data = await quizServices.editQuiz(req);
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
    
    async quizautoupdateMatchFinalStatus(req, res, next) {
        try {
          const matches = await listMatchModel.find({ status: 'completed', launch_status: 'launched', final_status: 'IsReviewed' });
          if (matches && Array.isArray(matches) && matches.length > 0) {
            let count = 0;
            for (let match of matches) {
              count++;
              await quizServices.quizdistributeWinningAmount(req = { params: { id: match._id } });//need to check becouse crown is remove
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
              const getResult = await quizServices.quizdistributeWinningAmount(req);//need to check becouse crown is remove
    
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
        const data = await quizServices.addGlobalQuestion(req);
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
        const getdata = await quizServices.editglobalquestion(req);
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
        const editQuestionData=await quizServices.editGlobalQuestionData(req);
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
        const deleteQuestions=await quizServices.deleteGlobalQuestion(req);
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
        const deleteManyQuestions=await quizServices.globalQuestionMuldelete(req);
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
      const getlunchedMatches=await quizServices.createCustomQuestions(req);
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
        const data=await quizServices.importQuestionData(req);
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
        const getlunchedMatches=await quizServices.quizcreateCustomContest(req);

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
        const data=await quizServices.quizimportchallengersData(req);
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
        const data=await quizServices.QuizGIveAnswer(req);
        if(data.status == true){
            req.flash('success',data.message)
            res.redirect(`/view_quiz`);
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
}
module.exports = new quizController();
