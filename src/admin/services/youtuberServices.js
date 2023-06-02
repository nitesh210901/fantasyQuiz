const userModel=require("../../models/userModel");
const validator = require('validator');
const bcrypt = require('bcrypt');
const fs=require('fs');
const constant=require("../../config/const_credential");
const { default: mongoose } = require("mongoose");
const notificationModel=require("../../models/notificationModel");
const utility=require("../../utils/notifications");
const transactionsModel=require("../../models/transactionModel");
const joinedleaugesModel=require("../../models/JoinLeaugeModel");

class youtuberServices{

    constructor(){
        return {
            add_youtuber_data:this.add_youtuber_data.bind(this),
            edit_youtuber:this.edit_youtuber.bind(this),
            edit_youtuber_data:this.edit_youtuber_data.bind(this),
            delete_youtuber:this.delete_youtuber.bind(this),
            getreferuser:this.getreferuser.bind(this),
            viewYoutuberRefer:this.viewYoutuberRefer.bind(this),
            viewYoutuberRefer:this.viewYoutuberRefer.bind(this),
            youtuberProfitInitiation:this.youtuberProfitInitiation.bind(this)
        }
    }

    async add_youtuber_data(req){
        try{
            let doc=req.body
            // console.log("doc..........",doc)
            if(req.body.email && req.body.mobile && req.body.refer_code){
                    // console.log("validator...................",!validator.isEmail(req.body.email))
                if (!validator.isEmail(req.body.email)) {
                        return{
                            status:false,
                            message:'this is not the correct format ***',
                            data:doc
                        }
                }else{
                    const checkEmail=await userModel.findOne({email:req.body.email});
                    // console.log("checkEmail.........",checkEmail)
                    if(checkEmail){
                        return{
                            status:false,
                            message:'email id already register',
                            data:doc
                        }
    
                    }else {
                        const checkMobile=await userModel.findOne({mobile:req.body.mobile});
                        if(checkMobile){
                            return{
                                status:false,
                                message:'mobile number already register',
                                data:doc
                            }
                        }else{
                            const checkReferCode=await userModel.findOne({refer_code:req.body.refer_code});
                            if(checkReferCode){
                                return{
                                    status:false,
                                    message:'refer code already exist ',
                                    data:doc
                                }
                            }else{
                                let salt = bcrypt.genSaltSync(10);
                                req.body.decrypted_password = req.body.password; 
                                req.body.password = bcrypt.hashSync(req.body.password, salt);
                                req.body.user_verify= { mobile_verify: 1, mobilebonus: 1 };
                                req.body.userbalance= { bonus: 0 };
                                req.body.type=constant.USER_TYPE.YOUTUBER;
                                req.body.status=constant.USER_STATUS.ACTIVATED;
                                let saveUser=await userModel.create(req.body);
                                if(saveUser){
                                    return{
                                        status:true,
                                        message:'user register successfully'
                                    }
                                }else{
                                    return{
                                        status:false,
                                        message:'user not register ..error..',
                                        data:doc
                                    }
                                }
                            }
                        }
                    }
                }
            }else{
                return{
                    status:false,
                    message:'please enter email-Id  & refer_code  & mobile',
                    data:doc
                }
            }

        }catch(error){
            throw error;
        }
    }
    async edit_youtuber(req){
        try{
            const checkYoutuber=await userModel.findOne({_id:mongoose.Types.ObjectId(req.params.youtuberId)});
            if(checkYoutuber){
                return{
                    status:true,
                    youtuberData:checkYoutuber
                }

            }else{
                return{
                    status:false,
                    message:'youTuber Data not Found..error..'
                }
            }
        }catch(error){
            throw error;
        }
    }
    async edit_youtuber_data(req){
        try{
            const checkYoutuber=await userModel.findOne({_id:req.params.youtuberId});
            if(checkYoutuber){
                if(req.body.email && req.body.mobile && req.body.refer_code){
                    // console.log("validator...................",!validator.isEmail(req.body.email))
                if (!validator.isEmail(req.body.email)) {
                        return{
                            status:false,
                            message:'this is not the correct format ***',
                        }
                }else{
                    const checkEmail=await userModel.findOne({_id:{$ne:req.params.youtuberId},email:req.body.email});
                    // console.log("checkEmail.........",checkEmail)
                    if(checkEmail){
                        return{
                            status:false,
                            message:'email id already register',
                        }
    
                    } else {
                        const checkMobile=await userModel.findOne({_id:{$ne:req.params.youtuberId},mobile:req.body.mobile});
                        if(checkMobile){
                            return{
                                status:false,
                                message:'mobile number already register',
                            }
                        }else{
                            const checkReferCode=await userModel.findOne({_id:{$ne:req.params.youtuberId},refer_code:req.body.refer_code});
                            if(checkReferCode){
                                return{
                                    status:false,
                                    message:'refer code already exist ',              
                                }
                            }else{
                                let saveUser=await userModel.updateOne({_id:mongoose.Types.ObjectId(req.params.youtuberId)},{
                                    $set:req.body
                                });
                                if(saveUser.modifiedCount > 0){
                                    return{
                                        status:true,
                                        message:'user update successfully'
                                    }
                                }else{
                                    return{
                                        status:false,
                                        message:'user not update ..error..'
                                    }
                                }
                            }
                        }
                    }
                }
            }else{
                return{
                    status:false,
                    message:'please enter email-Id  & refer_code  & mobile',
                    
                }
            }

            }else{
                return{
                    status:false,
                    message:'youtuber not Found..error..'
                }
            }


        }catch(error){
            throw error;
        }
    }
    async delete_youtuber(req){
        try{
            let checkYoutuber=await userModel.findOne({_id:req.params.youtuberId});
           
            if(checkYoutuber){
                if(checkYoutuber.image){
                   let filePath = `public${checkYoutuber.image}`;
                    if(fs.existsSync(filePath) == true){
                    fs.unlinkSync(filePath);
                    }
                }
                const updateYoutuber=await userModel.deleteOne({_id:req.params.youtuberId}); 
                if(updateYoutuber.deletedCount == 1){
                    return{
                        status:true,
                        message:'youtuber delete successfully'
                    }
                }else{
                    return{
                        status:false,
                        message:'youtuber not delete ..error.. '
                    }
                }
            }else{
                return{
                    status:false,
                    message:'youtuber not found..error..'
                }
            }

        }catch(error){
            throw error;
        }
    }
    async getreferuser(req){
        try{
            // const findreferuser =await userModel.find
            let i=0;
            let count=0;
            let Json=[];
            if(findreferuser){
                for await(let referuser of findreferuser){
                    let referamount=await bonus_referedModel.aggreagte([
                        {
                            $match:{
                                fromid:mongoose.Types.ObjectId(referuser.refer_id)
                            }
                        },{
                            $group:{
                                _id:'$fromid',
                                count:{
                                    $sum:"$amount"
                                }
                            }
                        }
                    ]);
                    let obj={};
                   obj['id'] = referuser.refer_id;
                   if(referuser.username){
                       obj['username'] = referuser.username;
                   }else{
                       obj['username'] = referuser.team;
                   }
                    obj['email'] = referuser.email;
                    obj['amount'] = (referamount[0]?.amount!='')? referamount[0].amount:0;
                    if(referuser.image){
                        obj['image'] = referuser.image;
                    }else{
                        obj['image'] = '/avtar1.png';
                    }
                    obj['created_at'] = referuser.createdAt;
                    obj['success'] = true;
                   $i++;
                }
            }

        }catch(error){
            throw error
        }
    }
    //getrefercode
    async viewYoutuberRefer(req){
        try{
            let pipline=[];
            // pipline.push({
            //     $match:{
            //         refer_id:mongoose.Types.ObjectId(req.params.youtuberId)
            //     }
            // },)
            pipline.push({
                $lookup:{
                    from: "joinedleauges",
                    localField: "_id",
                    foreignField: "userid",
                    as: "joinedleaugesData"
                  }
            },)
            pipline.push({
                $unwind:{
                    path: "$joinedleaugesData",
                  }
            },)
            pipline.push({
                $lookup:{
                    from: "finalresults",
                    localField: "joinedleaugesData.challengeid",
                    foreignField:"challengeid" ,
                    as: "finalResultData"
                  }
            },)
            pipline.push({
                $unwind:{
                    path: "$joinedleaugesData",
                  }
            },)
            pipline.push({
                $lookup:{
                    from: "matchchallenges",
                   let:{matchid:"$joinedleaugesData.challengeid"},
                   pipeline:[
                     {
                        $match:{ $expr:
                                      { $and:
                                         [
                                           { $eq: [ "$_id",  "$$matchid" ] },
                                          { $eq: [ "$status", "closed" ] }
                                         ]
                                      }
                                }
                     }
                     ],
                    as: "matchchallengesData"
                  }
            },)
            pipline.push({
                $unwind:{
                    path: "$matchchallengesData",
                  }
            },)
            pipline.push({
                $lookup:{
                    from: "listmatches",
                    localField: "joinedleaugesData.matchkey",
                    foreignField: "_id",
                    as: "listmatcheData"
                  }
            },)
            pipline.push({
                $unwind:{
                    path: "$listmatcheData",
                  }
            },)
            pipline.push({
                $group:{
                    _id: "$listmatcheData._id",
                    matchName: {
                      $first: "$listmatcheData.name"
                    }
                  }
            },)
            
            
            const data=await userModel.aggregate(pipline);
            
            return data;


        }catch(error){
            throw error;
        }
    }
    async youtuberProfitInitiation(req){
        try{
            let challenge_id=req.query.challenge_id;
            let refer_id=req.query.refer_id;
            let total_profit=req.query.total_profit
            const check_amount=await userModel.findOne({_id:mongoose.Types.ObjectId(refer_id)});
            let total=Number(check_amount.userbalance.bonus) + Number(check_amount.userbalance.winning)+Number(check_amount.userbalance.balance);
            let winn=Number(check_amount.userbalance.winning)+Number(total_profit).toFixed(2);
            const updateWinnningAmount=await userModel.updateOne({_id:mongoose.Types.ObjectId(refer_id)},{
              $set:{
                "userbalance.winning":winn
              }
            });
            let transactiondata={};
            transactiondata['type'] = 'Affiliate Commission';
            transactiondata['amount'] = Number(total_profit);
            transactiondata['transaction_id'] = 'MG11-YP-'+Date.now();
            transactiondata['transaction_by'] = 'Riskle';
            transactiondata['challengeid'] = challenge_id;
            transactiondata['userid'] = refer_id;
            transactiondata['paymentstatus'] = 'confirmed';
            transactiondata['bal_bonus_amt'] =Number(check_amount.userbalance.bonus);
            transactiondata['bal_win_amt'] = winn;
            transactiondata['win_amt'] = Number(total_profit);
            transactiondata['bal_fund_amt'] = Number(check_amount.userbalance.balance);
            transactiondata['total_available_amt'] =Number(total);
      
            const transactionsUser=await transactionsModel.create(transactiondata);
      
            let data={};
            data.userid=refer_id,
            data.seen=0;
            let titleget="Youtuber Profit Initiated";
            let module_name= data['module_name']= "youtuber_profit";
            let msg  =  data['title']='Rs '+transactionsUser['amount']+' added as Youtuber profit to your account.';
      
            const insertNotification=await notificationModel.create(data);
      
            await utility.PushNotifications(titleget,msg,'',refer_id,module_name)

            return {
                status:true,
                message:'successfully Initiated..'
            }

        }catch(error){
            throw error;
        }
    }
    
}
module.exports = new youtuberServices();