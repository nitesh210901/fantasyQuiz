const termsConditionServices=require("../services/termsConditionServices");
class termsConditionController {
    constructor() {
      return {
        termsConditionPage:this.termsConditionPage.bind(this),
        editTermsCondition:this.editTermsCondition.bind(this),
      };
    }
    async termsConditionPage(req,res,next){
        try{
            res.locals.message = req.flash();
            const checkPolicy=await termsConditionServices.termsConditionPage(req);
            if(checkPolicy.status){
              res.render("termsConditions/termsConditions",{ sessiondata: req.session.data,data:checkPolicy.data});
            }else{
              res.render("termsConditions/termsConditions",{ sessiondata: req.session.data,data:undefined});
            }

        }catch(error){
            console.log(error);
            req.flash('error','something wrong please try again later');
            res.redirect('/');
        }
    }
    async editTermsCondition(req,res,next){
      try{
        const data=await termsConditionServices.editTermsCondition(req);
        if(data.status){
          req.flash('success',data.message);
          res.redirect('/terms_condition-page');
        }else{
          req.flash('error',data.message);
          res.redirect('/terms_condition-page');
        }


      }catch(error){
        console.log(error);
        req.flash('error','something wrong please try again later');
        res.redirect('/');
      }
    }
  }
  module.exports = new termsConditionController();
  