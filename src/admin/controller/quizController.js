const moment = require("moment");

const quizModel = require("../../models/quizModel");
const quizServices = require('../services/quizService');
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
    //   view_youtuber_dataTable: this.view_youtuber_dataTable.bind(this)
    };
  }


  async AddQuizPage(req, res, next) {
      try {
          const listmatch = await listMatchModel.find({ isQuiz: 1 })    
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
            const data = await quizServices.editQuiz(req);
            if (data) {
                res.render("quiz/editQuiz", { sessiondata: req.session.data, msg: undefined, data });
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
}
module.exports = new quizController();
