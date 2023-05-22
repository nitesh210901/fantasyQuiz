const howtoplayServices=require("../services/howtoplayService");
class howtoplayController {
    constructor() {
      return {
        howtoplayPage:this.howtoplayPage.bind(this),
        editHowtoplay:this.editHowtoplay.bind(this),
        viewSelectedCategoryHowtoplay:this.viewSelectedCategoryHowtoplay.bind(this)
      };
    }
    async howtoplayPage(req,res,next){
        try{

            res.locals.message = req.flash();
            res.render("howToPlay/howtoplay",{ sessiondata: req.session.data});

        }catch(error){
        
            req.flash('error','something is wrong please try again later');
            res.redirect(`/edit_FAQ_Question_page/${req.params.id}`);
        }
    }
    async editHowtoplay(req,res,next){
      try{
        const data=await howtoplayServices.editHowtoplay(req);
        if(data.status){
          req.flash('success',data.message);
          res.redirect('/how_to_play_page');
        }else{
          req.flash('error',data.message);
          res.redirect('/how_to_play_page');
        }


      }catch(error){
        req.flash('error','something wrong please try again later');
        res.redirect('/');
      }
    }
    async viewSelectedCategoryHowtoplay(req,res,next){
        try{
            const data=await howtoplayServices.viewSelectedCategoryHowtoplay(req);
            
            res.send(data);

        }catch(error){
            console.log(error)
            req.flash('error','something wrong please try again later');
            res.redirect('/');
        }
    }
  }
  module.exports = new howtoplayController();
  