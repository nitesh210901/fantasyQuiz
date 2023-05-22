const LegalityService=require("../services/LegalityService");
class LegalityController {
    constructor() {
      return {
        LegalityPage:this.LegalityPage.bind(this),
        editLegality:this.editLegality.bind(this),
      };
    }
    async LegalityPage(req,res,next){
        try{
            res.locals.message = req.flash();
            const checkPolicy=await LegalityService.LegalityPage(req);
            if(checkPolicy.status){
              res.render("Legality/Legality",{ sessiondata: req.session.data,data:checkPolicy.data});
            }else{
              res.render("Legality/Legality",{ sessiondata: req.session.data,data:undefined});
            }

        }catch(error){
            // console.log(error);
            req.flash('error','something wrong please try again later');
            res.redirect('/');
        }
    }
    async editLegality(req,res,next){
      try{

        const data=await LegalityService.editLegality(req);
        if(data.status){
          req.flash('success',data.message);
          res.redirect('/legality_policy_page');
        }else{
          req.flash('error',data.message);
          res.redirect('/legality_policy_page');
        }

      }catch(error){
        // console.log(error);
        req.flash('error','something wrong please try again later');
        res.redirect('/');
      }
    }
  }
  module.exports = new LegalityController();
  