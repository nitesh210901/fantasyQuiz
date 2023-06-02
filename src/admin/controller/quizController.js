const moment = require("moment");

const quizModel = require("../../models/quizModel");
const quizServices = require('../services/quizService');
const resultServices = require('../services/resultServices');
const listMatchModel = require("../../models/listMatchesModel");
class quizController {
  constructor() {
    return {
      AddQuizPage: this.AddQuizPage.bind(this),
      AddQuiz: this.AddQuiz.bind(this),
      ViewQuiz: this.ViewQuiz.bind(this),
      QuizDataTable: this.QuizDataTable.bind(this),
      editQuiz: this.editQuiz.bind(this),
      editQuizData: this.editQuizData.bind(this),
      deletequiz: this.deletequiz.bind(this),
      quizautoupdateMatchFinalStatus: this.quizautoupdateMatchFinalStatus.bind(this),
      quizupdateMatchFinalStatus: this.quizupdateMatchFinalStatus.bind(this),
      
    //   view_youtuber_dataTable: this.view_youtuber_dataTable.bind(this)
    };
  }


  async AddQuizPage(req, res, next) {
      try {
      const listmatch = await listMatchModel.find({ isQuiz: 1 ,launch_status:"launched"})    
      res.locals.message = req.flash();
      res.render("quiz/add_quiz", {
        sessiondata: req.session.data,
        data: undefined,
        msg: undefined,
        listmatch: listmatch
      });
    } catch (error) {
      // next(error);
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
            req.flash('error','something is wrong please try again later');
            res.redirect('/add_quiz');
        }
    }
    
  async ViewQuiz(req, res, next) {
    try {
        res.locals.message = req.flash();
        res.render("quiz/view_quiz", { sessiondata: req.session.data });
    } catch (error) {
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
        quizModel.countDocuments(conditions).exec((err, rows) => {
            // console.log("rows....................",rows)
            let totalFiltered = rows;
            let data = [];
            let count = 1;
            quizModel.find(conditions).skip(Number(start) ? Number(start) : '').limit(Number(limit1) ? Number(limit1) : '').exec((err, rows1) => {
                // console.log('--------rows1-------------', rows1);
                if (err) console.log(err);
                rows1.forEach((index) => {
                    data.push({
                        "count": count,
                        "question": index.question,
                        "answer": index.answer,
                        "Action": `<a href="/edit-quiz/${index._id}" class="btn btn-sm btn-orange w-35px h-35px text-uppercase text-nowrap" data-toggle="tooltip" title="Edit"><i class="fad fa-pencil"></i></a>
                        <a  onclick="delete_sweet_alert('/deletequiz?quizId=${index._id}', 'Are you sure you want to delete this data?')" class="btn btn-sm btn-danger w-35px h-35px text-uppercase"><i class='fas fa-trash-alt'></i></a>`
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
    } catch (error) {
      
    }
    }
    
    async editQuiz(req, res, next) {
        try {
            res.locals.message = req.flash();
            const listmatch = await listMatchModel.find({ isQuiz: 1 ,launch_status:"launched"})
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
}
module.exports = new quizController();
