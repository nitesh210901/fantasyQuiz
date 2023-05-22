const aboutUsService=require("../services/aboutUsService");
class aboutUsController {
    constructor() {
      return {
        aboutusPage:this.aboutusPage.bind(this),
        editAboutUs:this.editAboutUs.bind(this),
      };
    }
    async aboutusPage(req,res,next){
        try{
            res.locals.message = req.flash();
            const checkPolicy=await aboutUsService.aboutusPage(req);
            if(checkPolicy.status){
              res.render("aboutUs/aboutUs",{ sessiondata: req.session.data,data:checkPolicy.data});
            }else{
              res.render("aboutUs/aboutUs",{ sessiondata: req.session.data,data:undefined});
            }

        }catch(error){
          req.flash('error','something is wrong please try again letter');
          res.redirect('/');
        }
    }
    async editAboutUs(req,res,next){
      try{

        const data=await aboutUsService.editAboutUs(req);
        if(data.status){
          req.flash('success',data.message);
          res.redirect('/about_us_page');
        }else{
          req.flash('error',data.message);
          res.redirect('/about_us_page');
        }

      }catch(error){
        req.flash('error','something is wrong please try again letter');
        res.redirect('/');
      }
    }
  }
  module.exports = new aboutUsController();
  