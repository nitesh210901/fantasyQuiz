const contactServices=require("../services/contactServices");
class termsConditionController {
    constructor() {
      return {
        contactPage:this.contactPage.bind(this),
        editContact:this.editContact.bind(this),
      };
    }
    async contactPage(req,res,next){
        try{
            res.locals.message = req.flash();
            const checkPolicy=await contactServices.contactPage(req);
            if(checkPolicy.status){
              res.render("contact/contact",{ sessiondata: req.session.data,data:checkPolicy.data});
            }else{
              res.render("contact/contact",{ sessiondata: req.session.data,data:undefined});
            }

        }catch(error){
            // console.log(error);
            req.flash('success','something wrong please try again later');
            res.redirect('/');
        }
    }
    async editContact(req,res,next){
      try{
        const data=await contactServices.editContact(req);
        if(data.status){
          req.flash('success',data.message);
          res.redirect('/contact_page');
        }else{
          req.flash('error',data.message);
          res.redirect('/contact_page');
        }


      }catch(error){
        // console.log(error);
        req.flash('success','something wrong please try again later');
        res.redirect('/');
      }
    }
  }
  module.exports = new termsConditionController();
  