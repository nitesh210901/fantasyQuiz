const privacyPolicyServices=require("../services/privacyPolicyServices");
class privacyPolicyController {
    constructor() {
      return {
        privacyPolicyPage:this.privacyPolicyPage.bind(this),
        editPrivacyPolicy:this.editPrivacyPolicy.bind(this),
      };
    }
    async privacyPolicyPage(req,res,next){
        try{
            res.locals.message = req.flash();
            const checkPolicy=await privacyPolicyServices.privacyPolicyPage(req);
            if(checkPolicy.status){
              res.render("privacyPolicy/privacyPolicy",{ sessiondata: req.session.data,data:checkPolicy.data});
            }else{
              res.render("privacyPolicy/privacyPolicy",{ sessiondata: req.session.data,data:undefined});
            }

        }catch(error){
          
            req.flash('error','something wrong please try again later');
            res.redirect('/');
        }
    }
    async editPrivacyPolicy(req,res,next){
      try{
        const data=await privacyPolicyServices.editPrivacyPolicy(req);
        if(data.status){
          req.flash('success',data.message);
          res.redirect('/privacy_policy_page');
        }else{
          req.flash('error',data.message);
          res.redirect('/privacy_policy_page');
        }


      }catch(error){
       
        req.flash('error','something wrong please try again later');
        res.redirect('/');
      }
    }
  }
  module.exports = new privacyPolicyController();
  