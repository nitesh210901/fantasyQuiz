const mongoose = require('mongoose');
const moment=require("moment");
const finalResultModel=require("../../models/finalResultModel");
const randomstring=require("randomstring");
const seriesModel=require("../../models/addSeriesModel");
const adminModel=require("../../models/adminModel");
const userModel=require("../../models/userModel");
const seriesPricecardModel=require("../../models/seriesPriceCardModel");
const seriesLeaderBoardModel=require("../../models/seriesLeaderBoardModel");
const constant=require("../../config/const_credential");
const TransactionModel=require("../../models/transactionModel");
class leaderboardServices {
    constructor() {
        return {
            viewLeaderBoarderPage: this.viewLeaderBoarderPage.bind(this),
            addSeriesPriceCardPage:this.addSeriesPriceCardPage.bind(this),
            addSeriesPriceCardData:this.addSeriesPriceCardData.bind(this),
            deleteSeriesPriceCard:this.deleteSeriesPriceCard.bind(this),
            distributeWinningAmountSeriesLeaderboard:this.distributeWinningAmountSeriesLeaderboard.bind(this),
            updateHasLeaderBoard:this.updateHasLeaderBoard.bind(this)
        }
    }
    // --------------------
   async viewLeaderBoarderPage(req){
    try{

        const seriesData=await seriesModel.find();
        return seriesData;
        

    }catch(error){
        console.log(error)
    }
   }
   async addSeriesPriceCardPage(req){
    try{
        if (req.params) {
            const series_Data = await seriesModel.findOne({ _id: mongoose.Types.ObjectId(req.params.id), is_deleted: false });
            if (series_Data) {
                    const check_PriceCard = await seriesPricecardModel.find({ seriesId: mongoose.Types.ObjectId(req.params.id), is_deleted: false });
                    // console.log("check_PriceCard.....", check_PriceCard);
                    let totalAmountForPercentage = 0;

                    if (check_PriceCard.length == 0) {
                        let position = 0;
                        return {
                            status: true,
                            series_Data,
                            position,
                            totalAmountForPercentage,
                        }
                    } else {
                        let lastIndexObject = (check_PriceCard.length) - 1;
                        let lastObject = check_PriceCard[lastIndexObject];
                        let position = lastObject.max_position
                        for (let key of check_PriceCard) {
                                totalAmountForPercentage = totalAmountForPercentage + key.total
                        }
                        return {
                            status: true,
                            series_Data,
                            position,
                            check_PriceCard,
                            totalAmountForPercentage
                        }
                    }
            } else {
                return {
                    status: false,
                    message: 'series not found..'
                }
            }

        } else {
            return {
                status: false,
                message: 'Invalid request Id'
            }
        }
    }catch(error){
        console.log(error)
    }
   }
   async addSeriesPriceCardData(req){
    try{
        const series_Data = await seriesModel.findOne({ _id: req.body.seriesId });
        const check_PriceCard = await seriesPricecardModel.find({ seriesId: req.body.seriesId });

        if (req.body.min_position && req.body.winners && req.body.price) {
            if (Number(req.body.winners) == 0 || Number(req.body.price) == 0) {
                return {
                    status: false,
                    message: 'winners or price can not equal to Zero'
                }
            }
            if (check_PriceCard.length == 0) {
                   
                    const insertPriceData = new seriesPricecardModel({
                        seriesId: mongoose.Types.ObjectId(req.body.seriesId),
                        winners: Number(req.body.winners),
                        price: Number(req.body.price),
                        min_position: Number(req.body.min_position),
                        max_position: (Math.abs((Number(req.body.min_position)) - (Number(req.body.winners)))).toFixed(2),
                        total: ((Number(req.body.winners)) * (Number(req.body.price))).toFixed(2),
                        type: 'Amount',
                    })
                    let savePriceData = await insertPriceData.save();
                    if (savePriceData) {
                        return {
                            status: true,
                            message: 'price Card added successfully'
                        };
                    }
                }else {

                let lastIndexObject = (check_PriceCard.length) - 1;
                let lastObject = check_PriceCard[lastIndexObject];
                let position = lastObject.max_position

                let totalAmountC = 0;
                for (let key of check_PriceCard) {
                        totalAmountC = totalAmountC + key.total
                    
                }
                    const insertPriceData = new seriesPricecardModel({
                        seriesId: mongoose.Types.ObjectId(req.body.seriesId),
                        winners: Number(req.body.winners),
                        price: Number(req.body.price),
                        min_position: position,
                        max_position: ((Number(req.body.min_position)) + (Number(req.body.winners))),
                        total: ((Number(req.body.winners)) * (Number(req.body.price))).toFixed(2),
                        type: 'Amount',
                    })
                    let savePriceData = await insertPriceData.save();
                    if (savePriceData) {
                        return {
                            status: true,
                            message: 'price Card added successfully'
                        };
                    }
                }
                }
    }catch(error){
        console.log(error)
    }
   }
   async deleteSeriesPriceCard(req){
    try {
        const deletequery = await seriesPricecardModel.deleteOne({ _id: req.params.id });
        if (deletequery.deletedCount > 0) {
            return {
                status: true,
                message: 'delete successfully'
            }
        } else  {
            return {
                status: false,
                message: 'unable to delete'
            }
        }

    } catch (error) {
        throw error;
    }
   }
   async distributeWinningAmountSeriesLeaderboard(req){
    try{
        
        let id = req.params.id;
        let pipeline = [];
        pipeline.push({
            $match:{
                series_id:mongoose.Types.ObjectId(id),
            },
        });
        pipeline.push({
            $lookup:{
                from:"users",
                localField:"userid",
                foreignField:"_id",
                as:"userData"
            },
        });
        pipeline.push({
            $unwind:{
                path:"$userData",
              }
        });
        pipeline.push({
           $group:{
            _id: "$userid",
            totalPoints: {
              $sum: "$points"
            },
            matchkey:{$first:"$matchkey"},
            userid:{$first:"$userid"},
            series_id:{$first:"$series_id"},
            jointeam_id:{$first:"$jointeam_id"},
            userData:{$first:"$userData"},
          }
        });
        pipeline.push({
            $sort:{totalPoints:-1},
        })

        const getData=await seriesLeaderBoardModel.aggregate(pipeline);
       
        let joson=[]
        if(getData.length > 0){
            let Rank=1;
            for await(let key of getData){
                const userData=await userModel.findOne({_id:mongoose.Types.ObjectId(key.userid)});
                if(userData){
                    let obj={};
                    obj.userid=key.userid;
                    obj.team=userData.team;
                    if(userData.image == "" || !userData.image){
                        obj.image='/user.png'
                    }else{
                        obj.image=userData.image
                    }
                    obj.points=key.totalPoints;
                    obj.rank=Rank;
                    joson.push(obj)
                    Rank++;
                }
            }
        }
       
        let prc_arr=[];
        if(joson.length > 0){
           let seriespricecards=await seriesPricecardModel.find({seriesId:mongoose.Types.ObjectId(id)});
            if(seriespricecards.length > 0){
                for(let key2 of seriespricecards){
                    let min_position=key2.min_position;
                    let max_position=key2.max_position;
                    for(let i=min_position; i<max_position;i++){
                        let obj={};
                        obj.price=key2.price
                        prc_arr.push(obj);
                    }
                }
            }else{
                obj.price=0
                prc_arr.push(obj);
            }
        }
      
        let userPoints=[];
        if(joson.length > 0){
            let lp=0;
            for await(let key3 of joson){
                let obj={};
                obj.id=key3.userid;
                obj.points=key3.points;
                obj.joindid=key3.userid;
                userPoints.push(obj);
            }
        }
        userPoints.sort((a, b) => {
            return a.points - b.points;
        });
        let poin_user = [];
                    let ids_str = "";
                    let userids_str = "";
                    for (let usr of userPoints) {
                        // console.log("--usr--",usr)
                        let indexings = poin_user.findIndex(element => element.points == usr.points);
                        if (indexings == -1) {
                            poin_user.push({
                                id: [usr.id],
                                points: usr.points,
                                joinedid: [usr.joindid]
                            });
                        } else {
                            let ids_arr = [];
                            let userids_arr = [];
                            let getdatatype = Array.isArray(poin_user[indexings].joinedid);
                            if (getdatatype) {
                                ids_arr = [];
                                userids_arr = [];
                                ids_str = poin_user[indexings].joinedid.join(',');
                                ids_str = ids_str + ',' + usr.joinedid;
                                ids_arr = ids_str.split(',');
                                userids_str = poin_user[indexings].id.join(',');
                                userids_str = userids_str + ',' + usr.id;
                                userids_arr = userids_str.split(',');
                                poin_user[indexings].joinedid = ids_arr;
                                poin_user[indexings].id = userids_arr;
                                poin_user[indexings].points = usr.points;
                            } else {
                                ids_arr = [];
                                userids_arr = [];
                                ids_str = poin_user[indexings].joinedid;
                                ids_str = ids_str + ',' + usr.joinedid;
                                ids_arr = ids_str.split(',');
                                userids_str = poin_user[indexings].id;
                                userids_str = userids_str + ',' + usr.id;
                                userids_arr = userids_str.split(',');
                                poin_user[indexings].joinedid = ids_arr;
                                poin_user[indexings].id = userids_arr;
                                poin_user[indexings].points = usr.points;
                            }
                            // console.log("--ids_arr--",ids_arr);
                            // console.log("---userids_arr--",userids_arr);
                        }
                    }
                    poin_user.sort((a, b) => {
                        return a.points - b.points;
                    });
                    let win_usr = [];
                    let win_cnt = 0;
                    let count = prc_arr.length;
                    // console.log('count',count);
                    for (let [k, pu] of poin_user.entries()) {
                        if (win_cnt < count) {
                            // console.log('win_cnt',win_cnt);
                            // let obj1 = {};
                            win_usr[k] = {};
                            win_usr[k]['min'] = win_cnt + 1;
                            win_cnt = win_cnt + pu['joinedid'].length;
                            win_usr[k]['max'] = win_cnt;
                            win_usr[k]['count'] = pu['joinedid'].length;
                            win_usr[k]['joinedid'] = pu['joinedid'];
                            win_usr[k]['id'] = pu['id'];
                            win_usr[k]['points'] = pu['points'];
                            // win_usr.push(obj1);
                        } else {
                            break;
                        }
                    }
                    let final_poin_user = [];
                    for (let [ks, ps] of win_usr.entries()) {
                        if (prc_arr[ps['min']]) {
                            if (ps['count'] == 1) {
                                let obj2 = {};
                                obj2[ps['joinedid'][0]] = {};
                                obj2[ps['joinedid'][0]]['points'] = ps['points'];
                                obj2[ps['joinedid'][0]]['amount'] = prc_arr[ps['min']]['price'];
                                obj2[ps['joinedid'][0]]['rank'] = ps['min'];
                                obj2[ps['joinedid'][0]]['userid'] = ps['id'][0];
                                final_poin_user.push(obj2);
                                // console.log('win_usr final_poin_user' , final_poin_user);
                            } else {
                                let ttl = 0;
                                let avg_ttl = 0;
                                for (let jj = ps['min']; jj <= ps['max']; jj++) {
                                    let sm = 0;
                                    if (prc_arr[jj]) {
                                        sm = prc_arr[jj]['price'];
                                    }
                                    ttl = ttl + sm;
                                }
                                avg_ttl = ttl / ps['count'];
                                
                                for (let [keyuser, fnl] of ps['joinedid'].entries()) {
                                    let obj3 = {};
                                    obj3[fnl] = {};
                                    obj3[fnl]['points'] = ps['min'];
                                    obj3[fnl]['amount'] = avg_ttl;
                                    obj3[fnl]['rank'] = ps['min'];
                                    obj3[fnl]['userid'] = ps['id'][keyuser];
                                    final_poin_user.push(obj3);
                                }
                            }
                        }
                    }
                    if (final_poin_user.length > 0) {
                        for (let finalPoints of final_poin_user) {
                            let fpusv = Object.values(finalPoints)[0];
                            let fpuskjoinid = Object.keys(finalPoints)[0];
                            let fpusk = fpusv['userid'];
                            let checkWinning = await finalResultModel.findOne({ 
                                joinedid:mongoose.Types.ObjectId(fpusk),
                                seriesid:mongoose.Types.ObjectId(id)
                            });
                            if (!checkWinning) {
                                let randomStr=randomstring.generate({
                                    length: 4,
                                    charset: 'alphabetic',
                                    capitalization:'uppercase'
                                  });
                                let transactionidsave = `${constant.APP_SHORT_NAME}-WIN-${Date.now()}-${randomStr}`;
                                
                                let finalResultArr = {
                                    userid: fpusk,
                                    points: fpusv['points'],
                                    amount: fpusv['amount'].toFixed(2),
                                    rank: fpusv['rank'],
                                    seriesid: ids_str,
                                    transaction_id: transactionidsave,
                                    joinedid: fpuskjoinid
                                };
                                let checkWinningUser = await finalResultModel.findOne({
                                    joinedid: mongoose.Types.ObjectId(fpuskjoinid),
                                    userid: mongoose.Types.ObjectId(fpusk)
                                });
                                if (!checkWinningUser) {
                                    await finalResultModel.create(finalResultArr);
                                    const user = await userModel.findOne({ _id: fpusk }, { userbalance: 1, totalwinning: 1 });
                                    if (user) {
                                        if (fpusv['amount'] > 10000) {
                                            const bonus = parseFloat(user.userbalance.bonus.toFixed(2));
                                            const balance = parseFloat(user.userbalance.balance.toFixed(2));
                                            const winning = parseFloat(user.userbalance.winning.toFixed(2));
                                            const totalwinning = parseFloat(user.totalwinning.toFixed(2));
                                            const totalBalance = bonus + balance + winning;

                                            let tds_amount = (31.2 / 100) * fpusv['amount'];
                                            let amount = fpusv['amount'] - tds_amount;
                                            let tdsData = {
                                                userid: fpusk,
                                                amount: fpusv['amount'],
                                                tds_amount: tds_amount,
                                                seriesid: id
                                            };
                                            const userObj = {
                                                'userbalance.balance': balance,
                                                'userbalance.bonus': bonus,
                                                'userbalance.winning': winning + amount,
                                                'totalwinning': totalwinning + amount
                                            };
                                            const transactiondata = {
                                                type: 'Series Winning Amount',
                                                amount: amount,
                                                total_available_amt: totalBalance + amount,
                                                transaction_by: constant.APP_SHORT_NAME,
                                                userid: fpusk,
                                                paymentstatus: constant.PAYMENT_STATUS_TYPES.CONFIRMED,
                                                bal_bonus_amt: bonus,
                                                bal_win_amt: winning + amount,
                                                bal_fund_amt: balance,
                                                win_amt: amount,
                                                transaction_id: transactionidsave
                                            };
                                            await Promise.all([
                                                userModel.findOneAndUpdate({ _id: fpusk }, userObj, { new: true }),
                                                tdsDetailModel.create(tdsData),
                                                TransactionModel.create(transactiondata)
                                            ]);
                                        } else {
                                            const bonus = parseFloat(user.userbalance.bonus.toFixed(2));
                                            const balance = parseFloat(user.userbalance.balance.toFixed(2));
                                            const winning = parseFloat(user.userbalance.winning.toFixed(2));
                                            const totalwinning = parseFloat(user.totalwinning.toFixed(2));
                                            const totalBalance = bonus + balance + winning;
                                            let amount = fpusv['amount'];
                                            const userObj = {
                                                'userbalance.balance': balance,
                                                'userbalance.bonus': bonus,
                                                'userbalance.winning': winning + amount,
                                                'totalwinning': totalwinning + amount

                                            };
                                            const transactiondata = {
                                                type: 'Series Winning Amount',
                                                amount: amount,
                                                total_available_amt: totalBalance + amount,
                                                transaction_by: constant.APP_SHORT_NAME,
                                                userid: fpusk,
                                                paymentstatus: constant.PAYMENT_STATUS_TYPES.CONFIRMED,
                                                bal_bonus_amt: bonus,
                                                bal_win_amt: winning + amount,
                                                bal_fund_amt: balance,
                                                win_amt: amount,
                                                transaction_id: transactionidsave
                                            };
                                           
                                            await Promise.all([
                                                userModel.findOneAndUpdate({ _id: fpusk }, userObj, { new: true }),
                                                TransactionModel.create(transactiondata)
                                            ]);
                                        }
                                    }
                                }
                            }
                        }
                    }
        return true;

    }catch(error){
        console.log(error)
    }
   }
   async updateHasLeaderBoard(req){
    try{
        const updatefind=await seriesModel.findOne({_id:mongoose.Types.ObjectId(req.params.id)});
        if(!updatefind){
            return{
                status:false,
                message:'series not found..something wrong..'
            }
        }
        const updateData=await seriesModel.updateOne({_id:mongoose.Types.ObjectId(req.params.id)},{
            $set:{
                has_leaderboard:req.query.has_leaderBorad
            }
        });
        if(updateData.modifiedCount > 0){
            return{
                status:true,
                message:'Series Leaderboard Activate Successful'
            }
        }else{
            return{
                status:false,
                message:'Series Leaderboard Activate Not Activate Something Wrong'
            }
        }

    }catch(error){
       console.log(error);
    }
   }

}
module.exports = new leaderboardServices();