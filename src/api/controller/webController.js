const webServices = require('../services/webServices');

class webController {
    constructor() {
        return {
            webBanner: this.webBanner.bind(this),
            termsConditions:this.termsConditions.bind(this),
            privacyPolicy:this.privacyPolicy.bind(this),
            Legality:this.Legality.bind(this),
            aboutus:this.aboutus.bind(this),
            testimonial:this.testimonial.bind(this),
            contact:this.contact.bind(this),
            howtoplay:this.howtoplay.bind(this),
            faqQuestion:this.faqQuestion.bind(this),
            // winnerdeclr:this.winnerdeclr.bind(this),
        }
    }
    async webBanner(req,res,next){
        try{
            const webData=await webServices.webBanner(req);
            return res.status(200).json(Object.assign({ success: webData.status }, webData));

        }catch(error){
           
        }
    }
    async termsConditions(req,res,next){
        try{
            const data=await webServices.termsConditions(req);
            return res.status(200).json(Object.assign({ success: data.status }, data));

        }catch(error){
            console.log(error);
        }
    }
    async privacyPolicy(req,res,next){
        try{
            const data=await webServices.privacyPolicy(req);
            return res.status(200).json(Object.assign({ success: data.status }, data));

        }catch(error){
            console.log(error);
        }
    }
    async Legality(req,res,next){
        try{
            const data=await webServices.Legality(req);
            return res.status(200).json(Object.assign({ success: data.status }, data));

        }catch(error){
            console.log(error);
        }
    }
       async aboutus(req,res,next){
        try{
            const data=await webServices.aboutus(req);
            return res.status(200).json(Object.assign({ success: data.status }, data));

        }catch(error){
            console.log(error);
        }
    }
    async testimonial(req,res,next){
        try{
            const data=await webServices.testimonial(req);
            return res.status(200).json(Object.assign({ success: data.status }, data));

        }catch(error){
            console.log(error);
        }
    }
    async contact(req,res,next){
        try{
            const contactData=await webServices.contact(req);
            return res.status(200).json(Object.assign({ success: contactData.status }, contactData));

        }catch(error){
            console.log(error)
        }
    }
    async howtoplay(req,res,next){
        try{

            const data=await webServices.howtoplay(req);
            return res.status(200).json(Object.assign({ success: data.status }, data));

        }catch(error){
            console.log(error)
        }
    }
    async faqQuestion(req,res,next){
        try{
            const data=await webServices.faqQuestion(req);
            return res.status(200).json(Object.assign({ success: data.status }, data));

        }catch(error){
            console.log(error)
        }
    }
    // async winnerdeclr(req,res,next){
    //     try{

    //         const data=await webServices.winnerdeclr(req);
    //         return res.status(200).json(Object.assign({ success: data.status }, data));

    //     }catch(error){
    //         console.log(error)
    //     }
    // }
    

}
module.exports = new webController();