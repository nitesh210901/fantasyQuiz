const adminModel=require("../../models/adminModel");
const credentials=require("../../config/const_credential");
// ---------
const mongoose=require("mongoose");
const termConditionsModel=require("../../models/termsConditionsModel");
const privacyPolicyModel=require("../../models/privacyPolicyModal");
const LegalityModel=require("../../models/LegalityModel");
const aboutusModel=require("../../models/aboutUsModel");
const contactModel=require("../../models/contactModel");
const howtoplayModel=require("../../models/howtoplayModel");
const faqQuestionModel=require("../../models/FAQQuestionModel");
const Redis = require('../../utils/redis');
// ------------------
class webServices{
    constructor(){
        return{
            webBanner:this.webBanner.bind(this),
            termsConditions:this.termsConditions.bind(this),
            privacyPolicy:this.privacyPolicy.bind(this),
            Legality:this.Legality.bind(this),
            aboutus:this.aboutus.bind(this),
            testimonial:this.testimonial.bind(this),
            webBanner:this.webBanner.bind(this),
            contact:this.contact.bind(this),
            howtoplay:this.howtoplay.bind(this),
            faqQuestion:this.faqQuestion.bind(this),
            // winnerdeclr:this.winnerdeclr.bind(this),
        }
    }
    async webBanner(req){
        try{
        const getData=await adminModel.findOne({role:0},{sidebanner:1});
        let newArray=[];
        for await(let key of getData.sidebanner){
            let result = credentials.BASE_URL
            key.image=`${result}${ key.image}`;
            if(key.type == 'web'){
                newArray.push(key)
            }
        }
        return{
            status:true,
            data:newArray
        }

        }catch(error){
            console.log(error)
        }
    }
    async termsConditions(req){
        try{
            const data=await termConditionsModel.find();
            return {
                status:true,
                data:data[0]
            }
    
        }catch(error){
            console.log(error);
        }
       }
       async privacyPolicy(req){
        try{
            const data=await privacyPolicyModel.find();
            return {
                status:true,
                data:data[0]
            }
    
        }catch(error){
            console.log(error);
        }
       }
       async Legality(req){
        try{
            const data=await LegalityModel.find();
            return {
                status:true,
                data:data
            }
    
        }catch(error){
            console.log(error);
        }
       }
       async aboutus(req){
        try{
            const data=await aboutusModel.find();
            return {
                status:true,
                data:data
            }
    
        }catch(error){
            console.log(error);
        }
       }
       async testimonial(req){
        try{
            const data=await testimonialModel.find();
            let newData=data.map(x=>{
                let result = credentials.BASE_URL.replace('8080/', 4040);
                x.image=`${result}${x.image}`;
                return x;
            })
            return {
                status:true,
                data:newData
            }
    
        }catch(error){
            console.log(error);
        }
       }
      
       async contact(req){
        try{
            const data=await contactModel.find();
            return {
                status:true,
                data:data
            }
    
        }catch(error){
            console.log(error)
        }
       }
       async howtoplay(req){
        try{
            const data=await howtoplayModel.find();
            return {
                status:true,
                data:data
            }
    
        }catch(error){
            console.log(error)
        }
       }
       async faqQuestion(req){
        try{
            const data=await faqQuestionModel.find();
            return {
                status:true,
                data:data
            }
    
        }catch(error){
            console.log(error)
        }
       }
    
}

module.exports=new webServices();