const mongoose=require("mongoose");
const FAQQuestionService=require("../services/FAQQuestionService");
const FAQQuestionModel=require("../../models/FAQQuestionModel");
class testimonialController {
    constructor() {
      return {
        FAQQuestionPage:this.FAQQuestionPage.bind(this),
        FAQQuestionData:this.FAQQuestionData.bind(this),
        viewFAQQuestion:this.viewFAQQuestion.bind(this),
        FAQQuestionTable:this.FAQQuestionTable.bind(this),
        editFAQQuestion:this.editFAQQuestion.bind(this),
        editFAQQuestionData:this.editFAQQuestionData.bind(this),
        deleteFAQQuestion:this.deleteFAQQuestion.bind(this),
      };
    }
    async FAQQuestionPage(req,res,next){
        try{
            res.locals.message = req.flash();
            res.render('FAQ/faqQuestions',{sessiondata:req.session.data});

        }catch(error){
            req.flash('error','something wrong please try again later');
            res.redirect('/');
        }
    }
    async FAQQuestionData(req,res,next){
        try{
            const postData=await FAQQuestionService.FAQQuestionData(req);
            if(postData.status){
                req.flash('success',postData.message);
                res.redirect('/view_all_FAQ_Question_page');
            }else{
                req.flash('error',postData.message);
                res.redirect('/view_all_FAQ_Question_page');
            }

        }catch(error){
            // console.log(error)
            req.flash('error','something wrong please try again later');
            res.redirect('/');
        }
    }
    async viewFAQQuestion(req,res,next){
        try{
            res.locals.message = req.flash();
            let object={};
            if(req.query.question){
                object.question=req.query.question
            }
            res.render('FAQ/viewAllFAQQuestion',{sessiondata:req.session.data,obj:object})

        }catch(error){
            // console.log(error);
            req.flash('error','something wrong please try again later');
            res.redirect('/');
        }
    }
    async FAQQuestionTable(req,res,next){
        try{
            let limit1 = req.query.length;
            let start = req.query.start;
            let sortObject = {},
              dir,
              join;
            let conditions = {};
            if (req.query.searchQuestion) {
              conditions.question = {
                $regex: new RegExp(req.query.searchQuestion.toLowerCase(), "i"),
              };
            }
            FAQQuestionModel.countDocuments(conditions).exec((err, rows) => {
              let totalFiltered = rows;
              let data = [];
              let count = 1;
              FAQQuestionModel .find(conditions).skip(Number(start) ? Number(start) : "").limit(Number(limit1) ? Number(limit1) : "").exec((err, rows1) => {
                  if (err) console.log(err);
                  rows1.forEach((index) => {
                    data.push({
                      count: count,
                      question:`<textarea disabled rows="4" cols="45"  style="resize:none;"> ${index.question}</textarea>`,
                      answere:`<textarea disabled rows="4" cols="45"  style="resize:none;"> ${index.answer}</textarea>`,
                      action: `<a class="btn w-35px h-35px mr-1 btn-orange text-uppercase btn-sm" data-toggle="tooltip" title="Edit" href="/edit_FAQ_Question_page/${index._id}">
                      <i class="fas fa-pencil"></i>
                  </a>
                  <a class="btn w-35px h-35px mr-1 btn-danger text-uppercase btn-sm" data-toggle="tooltip" title="Delete" onclick="delete_sweet_alert('/delete_FAQ_Question/${index._id}', 'Are you sure?')">
                      <i class="far fa-trash-alt"></i>
                  </a>`
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
        }catch(error){
            console.log(error);
        }
    }
    async editFAQQuestion(req,res,next){
        try{
            res.locals.message = req.flash();
            const data=await FAQQuestionService.editFAQQuestion(req);
            if(data.status){
                res.render("FAQ/editfqQuestions",{sessiondata:req.session.data,data:data.data})
            }else{
                req.flash('error',data.message);
                res.redirect(`/edit_FAQ_Question_page/${req.params.id}`);
            }

        }catch(error){
            // console.log(error);
            req.flash('error','something is wrong please try again later');
            res.redirect(`/edit_FAQ_Question_page/${req.params.id}`);
        }
    }
    async editFAQQuestionData(req,res,next){
        try{
            const data=await FAQQuestionService.editFAQQuestionData(req);
            if(data.status == true){
                req.flash("success",data.message);
                res.redirect("/view_all_FAQ_Question_page")
            }else{
                req.flash("error",data.message);
                res.redirect(`/edit_FAQ_Question_page/${req.params.id}`)
            }

        }catch(error){
            // console.log(error);
            req.flash("error", "something is wrong please try again later");
            res.redirect("/view_all_FAQ_Question_page");
        }
    }
    async deleteFAQQuestion(req,res,next){
        try{
            const data =await FAQQuestionService.deleteFAQQuestion(req);
            if(data.status){
                req.flash('success',data.message);
                res.redirect('/view_all_FAQ_Question_page');
            }else{
                req.flash('error',data.message);
                res.redirect('/view_all_FAQ_Question_page');
            }

        }catch(error){
            console.log(error);
            req.flash('error','something is wrong please try again later');
            res.redirect(`/edit_FAQ_Question_page/${req.params.id}`);
        }
    }
  }
  module.exports = new testimonialController();
  