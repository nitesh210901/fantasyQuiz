const mongoose = require("mongoose");
const userModel=require("../../models/userModel");
const transactionsModel=require("../../models/transactionModel");
const notificationModel=require("../../models/notificationModel");
const utils=require("../../utils/notifications");
const refer_amtModel=require("../../models/refer_amtModel");

class LevelServices{
    constructor(){
        return{
            give_referrer_bonus:this.give_referrer_bonus.bind(this)
        }
    }
    async give_referrer_bonus(id, entryfee){
        try{
            let refer_users=await userModel.find({_id:mongoose.Types.ObjectId(id)});

            let admin_levels=[
                1,0.5,0.25
            ];
            let admin_levels_count=admin_levels.length;
            let i = 0;
            let admin_levels_according_users = refer_users.slice(refer_users,0,admin_levels_count,true);
            if(admin_levels_according_users){
                for await(let level of admin_levels_according_users){
                let referrer_bonus = (entryfee * admin_levels[i]) / 100;
                if(Number(referrer_bonus) > 0){

                
                let refer_amt={};
                // refer amt table entry
                i++;
                refer_amt['user_id'] = level._id;
                refer_amt['from_id'] = id; /* joiner */
                refer_amt['level'] = i;
                refer_amt['amount'] = Number(referrer_bonus.toFixed());
                refer_amt['type'] = 'Referral Reward';
                refer_amt['txnid'] = `Riskle-${Date.now()}`;
                
                const saveData=await refer_amtModel.create(refer_amt);

                let transaction={};
                transaction['userid'] = level._id;
                transaction['transaction_id'] = `Riskle-${Date.now()}`;
                transaction['transaction_by'] = 'wallet';
                transaction['type'] = 'Referral Reward';
                transaction['amount'] =  Number(referrer_bonus.toFixed());
                transaction['bonus_amt'] =  Number(referrer_bonus.toFixed());
                
                transaction['bal_fund_amt'] = level.userbalance.balance;
                transaction['bal_win_amt'] = level.userbalance.winning;
                transaction['bal_bonus_amt'] = level.userbalance.bonus + transaction['bonus_amt'];
                
                transaction['total_available_amt'] = transaction['bal_fund_amt'] + transaction['bal_win_amt'] + transaction['bal_bonus_amt'];
                
                transaction['total_available_amt'] = Number(transaction['total_available_amt']).toFixed(2);

                const updateBonus=await userModel.updateOne({_id:level._id},{
                    $inc:{
                        bonus:Number(referrer_bonus).toFixed(2)
                    }
                })
                transaction['paymentstatus'] = 'success';

                const createTransection=await transactionsModel.create(transaction);

                let notificationmy={};
                notificationmy['userid']= level._id;
                notificationmy['seen']=0;
                let message  =  notificationmy['title'] = 'You have received reward of Rs.' +referrer_bonus+ ' from your referral ' +level.username + '('+level.mobile+')';
                const createNotificationmy=await notificationModel.create(notificationmy);

                let title="Referral Reward Received";
                const result =await utils.PushNotifications(title,message,'',level._id)
            }
         }
            }

        }catch(error){
            throw error;
        }
    }
}

module.exports=new LevelServices();