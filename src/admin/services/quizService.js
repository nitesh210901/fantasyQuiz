const mongoose = require('mongoose');
const moment = require("moment");

const quizModel = require('../../models/quizModel');
const listMatches = require('../../models/listMatchesModel');
const joinLeague = require('../../models/JoinLeaugeModel')
const TransactionModel = require('../../models/transactionModel')
const tdsDetailModel = require('../../models/tdsDetailModel')
const userModel = require('../../models/userModel')
const finalQuizResultModel = require('../../models/finalQuizResultModel')
const constant = require('../../config/const_credential');
const LevelServices = require("./LevelServices");
class quizServices {
    constructor() {
        return {
            AddQuiz: this.AddQuiz.bind(this),
            seriesDataTable: this.seriesDataTable.bind(this),
            updateStatusforSeries: this.updateStatusforSeries.bind(this),
            edit_Series: this.edit_Series.bind(this),
            editSeriesData: this.editSeriesData.bind(this),
            findSeries: this.findSeries.bind(this),
            editQuizData: this.editQuizData.bind(this),
            editQuiz: this.editQuiz.bind(this),
            deletequiz: this.deletequiz.bind(this),
            quizdistributeWinningAmount: this.quizdistributeWinningAmount.bind(this)
        }
    }

    async findSeries(data) {
        let result = await seriesModel.find(data);
        return result;
    }

    async AddQuiz(req) {
        try {
            let addquiz = new quizModel({
                question: req.body.question,
                option_A: req.body.option_A,
                option_B: req.body.option_B,
                option_C: req.body.option_C,
                option_D: req.body.option_D,
                answer: req.body.answer,
                matchkey_id: req.body.matchkey_id,
                point:req.body.point
            });

            let savequiz = await addquiz.save();
            if (savequiz) {
                return {
                    status:true,
                    message:'quiz add successfully'
                }
            }else{
                return {
                    status:false,
                    message:'quiz not add error..'
                }
            }
        } catch (error) {
            throw error;
        }
    }

    async seriesDataTable(req) {
        try {
            let limit1 = req.query.length;
            let start = req.query.start;
            let sortObject = {},
                dir, join
                //  console.log("sortObject..",sortObject);
                // let name;
                // if (req.query.name && req.query.name !== "")
                // {
                //     name = req.query.name;
                //     console.log("name..",name)
                // }
            let conditions = {};
            if (req.query.seriesName) {
                let seriesName = req.query.seriesName;
                conditions.seriesName ={ $regex: new RegExp("^" + seriesName.toLowerCase(), "i") }
            }
            // console.log("conditions.....", conditions)

            seriesModel.countDocuments(conditions).exec((err, rows) => {
                let totalFiltered = rows;
                let data = [];
                let count = 1;
                seriesModel.find(conditions).skip(Number(start)).limit(Number(limit1)).sort(sortObject).exec((err, rows1) => {
                   
                    if (err) console.log(err);
                    rows1.forEach((index) => {
                     
                        data.push({
                            "fantasy_type": index.fantasy_type,
                            "name": index.name,
                            "start_date": moment(index.start_date).format("dddd, MMMM Do YYYY, h:mm:ss a"),
                            "end_date": moment(index.end_date).format("dddd, MMMM Do YYYY, h:mm:ss a"),
                            "status": index.status,
                            "Actions": `<div class="row">
                        <div class="col-md-6">
                        <a href="#" ><i class="bi bi-pencil-square" style="color:blue;" title="update"></i></a>
                        </div>
                        <div class="col-md-6">
                        <a href="#"><i class="bi bi-trash2-fill" style="color:blue;" title="delete"></i></a>
                        </div>
                        </div>`
                        });
                        count++;

                        if (count > rows1.length) {
                           
                            let json_data = JSON.stringify({
                                "recordsTotal": rows,
                                "recordsFiltered": totalFiltered,
                                "data": data
                            });
                            return json_data;
                        }
                    });
                });
            });
        } catch (error) {
            throw error;
        }
    }

    async updateStatusforSeries(req) {
        try {
            // console.log('id',req.params.id);
            // console.log('id',req.query.status);
            let data = await seriesModel.updateOne({ _id: req.params.id }, { $set: { status: req.query.status } });
            
            if (data.modifiedCount == 1) {
                return true;
            }
        } catch (error) {
            throw error;
        }
    }

    async edit_Series(req) {
        try {
            if(req.params.id){

                let whereObj = {
                    is_deleted: false,
                    _id: req.params.id
                };
                let data = await this.findSeries(whereObj);
                
                if (data.length > 0) {
                    return {
                        status:true,
                        data:data
                    }
                }else{
                    return {
                        status:false,
                        message:'series not found ..'
                    }
                }

            }else{
                return{
                    status:false,
                    message:'Invalid series Id..'
                }
            }
            
        } catch (error) {
            throw error;
        }
    }

    async editSeriesData(req) {
        try {
            if(req.body.seriesName){
                let doc = req.body
                doc.name = doc.seriesName;
                delete doc.seriesName;
    
                let whereObj = {
                    is_deleted: false,
                    _id: { $ne: req.params.id },
                    name: doc.name,
    
                }
                const data = await this.findSeries(whereObj);
                // console.log(`data-------services-------`, data);
                if (data.length > 0) {
                    return {
                        message: "series Name already exist...",
                        status: false,
                        data: data[0]
                    };
                } else {
                    let whereObj = {
                        is_deleted: false,
                        _id: req.params.id
    
                    }
                    const data = await this.findSeries(whereObj);
                    // console.log(`(moment(doc.startdate).format('DD-MM-YYYY')).isBefore(moment(doc.enddate).format('DD-MM-YYYY'))`, moment(moment(doc.startdate).format('DD-MM-YYYY'), 'DD-MM-YYYY').isBefore(moment(moment(doc.enddate).format('DD-MM-YYYY'), 'DD-MM-YYYY')))
                    if (moment(moment(doc.start_date).format('DD-MM-YYYY'), 'DD-MM-YYYY').isBefore(moment(moment(doc.end_date).format('DD-MM-YYYY'), 'DD-MM-YYYY')) === false) {
                     
                        return {
                            message: "start date should be less then end date...",
                            status: false,
                            data: data[0]
                        };
                    } else if (moment(moment().format('DD-MM-YYYY'), 'DD-MM-YYYY').isBefore(moment(moment(doc.end_date).format('DD-MM-YYYY'), 'DD-MM-YYYY')) === false) {
                        return {
                            message: "end date should be greater then current date...",
                            status: false,
                            data: data[0]
                        };
                    } else {
                        let data = await seriesModel.updateOne({ _id: req.params.id }, { $set: doc });
    
                        if (data.modifiedCount == 1) {
                            return {
                                status:true,
                                message:'series update successfully'
                            }
                        }
                    }
                }
            }else{
                return{
                    status:false,
                    message:'series name required..'
                }
            }
            
        } catch (error) {
            throw error;
        }
    }

    async editQuiz(req){
        let whereObj ={
            _id:req.params.id
        }
        let data = await quizModel.find(whereObj);
        if(data.length > 0){
            return data[0];
        }
    }

    async editQuizData(req){ 
        let whereObj ={
            _id:req.params.id
        }
        let doc=req.body;
        delete doc.typename;
        const data=await quizModel.updateOne(whereObj,{$set:doc});
        if(data.modifiedCount == 1){
            return {
                status:true,
                message:"Quiz Update successfully"
            } 
      }
    }

    async deletequiz(req){
        try {
            const deletequiz = await quizModel.deleteOne({ _id: req.query.quizId });
            if(deletequiz.deletedCount > 0 ){
                return {
                    status:true,
                    message:'quiz deleted successfully'
                };
            }else{
                return {
                    status:false,
                    message:'quiz can not delete --error'
                }
            }

        }catch(error){
            throw error;
        }
    }

    async quizdistributeWinningAmount(req) {
        console.log("-------------------------------------quizdistributeWinningAmount------------------------------")
        let { id, status } = req.params;
        let matchkey = id;
        let match_time = moment().subtract(10, 'm').format('YYYY-MM-DD HH:mm:ss');
        let pipeline = [];
        pipeline.push({
            $match: {
                _id: mongoose.Types.ObjectId(matchkey),
                launch_status: 'launched',
                final_status: { $nin: ["winnerdeclared", "IsCanceled", "IsAbandoned"] }
            }
        });
        pipeline.push({
            $lookup: {
                from: 'matchchallenges',
                let: { matckey: "$_id" },
                pipeline: [{
                    $match: {
                        status: { $ne: "canceled" },
                        fantasy_type:"quiz",
                        // _id:mongoose.Types.ObjectId("628b08fd250227be46ae4374"),
                        $expr: {
                            $and: [
                                { $eq: ["$matchkey", "$$matckey"] },
                            ],
                        },
                    },
                },],
                as: 'matchChallengesData'
            }
        })
        let listmatches = await listMatches.aggregate(pipeline);
        console.log(listmatches)
        if (listmatches.length > 0) {
            for (let challenge of listmatches[0].matchChallengesData) {
                let pipeline1 = [];
                pipeline1.push({
                    $match: {
                        matchkey: mongoose.Types.ObjectId(listmatches[0]._id),
                        challengeid: mongoose.Types.ObjectId(challenge._id)
                    }
                });
                pipeline1.push({
                    $lookup: {
                        from: 'joinquizteam',
                        localField: 'teamid',
                        foreignField: '_id',
                        as: 'joinTeamData'
                    }
                });
                pipeline1.push({
                    $unwind: {
                        path: "$joinTeamData"
                    }
                });
                pipeline1.push({
                    $project: {
                        _id: 1,
                        "points": "$joinTeamData.points",
                        userid: 1
                    }
                });
                let joinedusers = await joinLeague.aggregate(pipeline1);
                console.log("-------joinedusers-------->--", joinedusers.length)
                if (joinedusers.length > 0) {
                    let prc_arr = [];
                    if (challenge.contest_type == 'Amount') {
                        if (challenge.pricecard_type == 'Amount') {
                            // console.log('challenge.matchpricecards',challenge.matchpricecards)
                            if (challenge.amount_type == 'prize') {
                                if (challenge.matchpricecards.length > 0) {
                                    for await(let prccrd of challenge.matchpricecards) {
                                        let min_position = prccrd.min_position;
                                        let max_position = prccrd.max_position;
                                        for (let i = min_position; i < max_position; i++) {
                                            let Obj = {};
                                            Obj['gift_type'] = prccrd.gift_type ? prccrd.gift_type : "amount"
                                            if(Obj['gift_type'] == "gift"){
                                                Obj['price'] = prccrd.prize_name;
                                            }else{
                                                Obj['price'] = prccrd.price;
                                            }
                                            prc_arr.push(Obj)
                                        }
                                    }
                                } else {
                                    let Obj = {};
                                    Obj['price'] = challenge.win_amount;
                                    Obj['gift_type'] = "amount";
                                    prc_arr.push(Obj)
                                }
                               
                            } else {
                                if (challenge.matchpricecards.length > 0) {
                                    for await(let prccrd of challenge.matchpricecards) {
                                        let min_position = prccrd.min_position;
                                        let max_position = prccrd.max_position;
                                        for (let i = min_position; i < max_position; i++) {
                                            let Obj = {};
                                            Obj['price'] = prccrd.price;
                                            Obj['gift_type'] = "amount";
                                            prc_arr.push(Obj)
                                        }
                                    }
                                } else {
                                    let Obj = {};
                                    Obj['price'] = challenge.win_amount;
                                    Obj['gift_type'] = "amount";
                                    prc_arr.push(Obj)
                                }
                            }
                        } else {
                            if (challenge.matchpricecards.length > 0) {
                                for await(let prccrd of challenge.matchpricecards) {
                                    let min_position = prccrd.min_position;
                                    let max_position = prccrd.max_position;
                                    for (let i = min_position; i < max_position; i++) {
                                        let Obj = {};
                                        Obj['price'] = (prccrd.price_percent / 100) * (challenge.win_amount);
                                        Obj['gift_type'] = prccrd.gift_type ? prccrd.gift_type : "amount";
                                        prc_arr.push(Obj)
                                    }
                                }
                            } else {
                                let Obj = {};
                                Obj['price'] = challenge.win_amount;
                                Obj['gift_type'] ="amount";
                                prc_arr.push(Obj)
                            }
                        }
                    } else if (challenge.contest_type == 'Percentage') {
                        let getwinningpercentage = challenge.winning_percentage;
                        let gtjnusers = challenge.joinedusers;
                        let toWin = Math.floor(gtjnusers * getwinningpercentage / 100);
                        prc_arr = [];
                        for (let i = 0; i < toWin; i++) {
                            let Obj = {};
                            Obj['price'] = challenge.win_amount;
                            Obj['gift_type'] = "amount";
                            prc_arr.push(Obj)
                        }
                    }
                    let user_points = [];
                    if (joinedusers.length > 0) {
                        let lp = 0;
                        for await(let jntm of joinedusers) {
                            user_points[lp] = {};
                            user_points[lp]['id'] = jntm.userid.toString();
                            user_points[lp]['points'] = jntm.points;
                            user_points[lp]['joinedid'] = jntm._id.toString();
                            lp++;
                        }
                    }

                    user_points.sort((a, b) => {
                        return  b.points - a.points ;
                    });
                    // console.log("=============user_points==========",user_points)
                    let poin_user = [];
                    let ids_str = "";
                    let userids_str = "";
                    for (let usr of user_points) {
                        let indexings = poin_user.findIndex(element => element.points == usr.points);
                        if (indexings == -1) {
                            poin_user.push({
                                id: [usr.id],
                                points: usr.points,
                                joinedid: [usr.joinedid]
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
                        }
                    }


                    poin_user.sort((a, b) => {
                        return  b.points - a.points ;
                    });

                    let win_usr = [];
                    let win_cnt = 0;
                    let count = prc_arr.length;
                    for (let [k, pu] of poin_user.entries()) {
                        if (win_cnt < count) {
                            // let obj1 = {};
                            win_usr[k] = {};
                            win_usr[k]['min'] = win_cnt + 1;
                            win_cnt = win_cnt + pu['joinedid'].length;
                            win_usr[k]['max'] = win_cnt;
                            win_usr[k]['count'] = pu['joinedid'].length;
                            win_usr[k]['joinedid'] = pu['joinedid'];
                            win_usr[k]['id'] = pu['id'];
                            win_usr[k]['points'] = pu['points'];
                        } else {
                            break;
                        }
                    }
                //    console.log("---prc_arr------->>>",prc_arr);
                    let final_poin_user = [];
                    for (let [ks, ps] of win_usr.entries()) {
                        let num=ps['min']-1;
                        let lnum=ps['max']-1;
                        if (prc_arr[num]) {
                            if (ps['count'] == 1) {
                                let obj2 = {};
                                
                                obj2[ps['joinedid'][0]] = {};
                                obj2[ps['joinedid'][0]]['points'] = ps['points'];
                                obj2[ps['joinedid'][0]]['amount'] = prc_arr[num]['price'];
                                obj2[ps['joinedid'][0]]['gift_type'] = prc_arr[num]['gift_type'];
                                obj2[ps['joinedid'][0]]['rank'] = num+1;
                                obj2[ps['joinedid'][0]]['userid'] = ps['id'][0];
                                final_poin_user.push(obj2);
                                // console.log('win_usr final_poin_user' , final_poin_user);
                            } else {
                                let ttl = 0;
                                let avg_ttl = 0;
                                for (let jj = num; jj <= lnum; jj++) {
                                    let sm=0;
                                    if (prc_arr[jj]) {
                                        if(prc_arr[jj]['gift_type'] != "prize"){
                                            sm = prc_arr[jj]['price'];
                                        }
                                    }
                                    ttl = ttl + sm;
                                }
                                avg_ttl =  ttl / ps['count'];

                                for (let [keyuser, fnl] of ps['joinedid'].entries()) {
                                    let obj3 = {};

                                    obj3[fnl] = {};
                                    obj3[fnl]['points'] =ps['points'];
                                    obj3[fnl]['amount'] = avg_ttl;
                                    // obj2[fnl['gift_type'] = prc_arr[ps['min']]['gift_type']
                                    obj3[fnl]['rank'] = ps['min'];
                                    obj3[fnl]['gift_type'] = prc_arr[num]['gift_type'];
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
                            let checkWinning = await finalQuizResultModel.findOne({ joinedid: mongoose.Types.ObjectId(fpuskjoinid) });
                            if (!checkWinning) {
                                let randomStr = randomstring.generate({
                                    length: 4,
                                    charset: 'alphabetic',
                                    capitalization: 'uppercase'
                                });
                                // console.log("------randomStr-------", randomStr)
                                let transactionidsave = `${constant.APP_SHORT_NAME}-Quiz-WIN-${Date.now()}-${randomStr}`;
                                
                                let finalResultArr;
                                if(fpusv['gift_type'] == "gift"){
                                    finalResultArr = {
                                        userid: fpusk,
                                        points: fpusv['points'],
                                        amount: 0,
                                        prize:fpusv['amount'],
                                        rank: fpusv['rank'],
                                        matchkey: matchkey,
                                        challengeid: challenge._id,
                                        seriesid: listmatches[0].series,
                                        transaction_id: transactionidsave,
                                        joinedid: fpuskjoinid
                                    };
                                }else{
                                    finalResultArr = {
                                        userid: fpusk,
                                        points: fpusv['points'],
                                        amount: fpusv['amount'],
                                        rank: fpusv['rank'],
                                        matchkey: matchkey,
                                        challengeid: challenge._id,
                                        seriesid: listmatches[0].series,
                                        transaction_id: transactionidsave,
                                        joinedid: fpuskjoinid
                                    };
                                }
                                // if(challenge.amount_type=='price')
                                // {
                                //     finalResultArr.amount = fpusv['amount'].toFixed(2);
                                //     finalResultArr.bonus=  fpusv['bonus'] || 0;
                                // }
                                // else
                                // {
                                //     finalResultArr.bonus=0;
                                //     finalResultArr.amount=0;
                                //     finalResultArr.prize_money=fpusv['amount'];
                                // }
                                let checkWinningUser = await finalQuizResultModel.findOne({
                                    joinedid: mongoose.Types.ObjectId(fpuskjoinid),
                                    userid: mongoose.Types.ObjectId(fpusk)
                                });
                                // console.log("---checkWinningUser---",checkWinningUser)
                                if (!checkWinningUser) {
                                    await finalQuizResultModel.create(finalResultArr);
                                    const user = await userModel.findOne({ _id: fpusk }, { userbalance: 1, totalwinning: 1 });
                                    // console.log("---user---",user)
                                    // let type
                                    // if (challenge.amount_type == 'prize') {
                                    //     type = 'Challenge Winning Prize ';
                                    // } else {
                                    //     type = 'Challenge Winning Amount';
                                    // }
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
                                                challengeid: challenge._id,
                                                seriesid: listmatches[0].series
                                            };
                                            const userObj = {
                                                'userbalance.balance': balance,
                                                'userbalance.bonus': bonus,
                                                'userbalance.winning': winning + amount,
                                                'totalwinning': totalwinning + amount
                                            };
                                            const transactiondata = {
                                                type: 'Challenge Winning Amount',
                                                amount: amount,
                                                total_available_amt: totalBalance + amount,
                                                transaction_by: constant.APP_SHORT_NAME,
                                                challengeid: challenge._id,
                                                userid: fpusk,
                                                paymentstatus: constant.PAYMENT_STATUS_TYPES.CONFIRMED,
                                                bal_bonus_amt: bonus,
                                                bal_win_amt: winning + amount,
                                                bal_fund_amt: balance,
                                                win_amt: amount,
                                                transaction_id: transactionidsave
                                            };
                                            // console.log("---userObj--1-",userObj)
                                            // console.log("----userObj--1--",userObj)
                                            // console.log("---transactiondata--1-",transactiondata)
                                            await Promise.all([
                                                userModel.findOneAndUpdate({ _id: fpusk }, userObj, { new: true }),
                                                tdsDetailModel.create(tdsData),
                                                TransactionModel.create(transactiondata),
                                            ]);
                                            if (fpusv['amount'] > 0) {
                                                let entryfee = challenge.entryfee;
                                                let userid = fpusk;
                                                await LevelServices.give_referrer_bonus(userid, entryfee);
                                            }
                                        } else {
                                            const bonus = parseFloat(user.userbalance.bonus.toFixed(2));
                                            const balance = parseFloat(user.userbalance.balance.toFixed(2));
                                            const winning = parseFloat(user.userbalance.winning.toFixed(2));
                                            const totalwinning = parseFloat(user.totalwinning.toFixed(2));
                                            const totalBalance = bonus + balance + winning;
                                            let amount = fpusv['amount'];
                                            let userObj ;
                                            let total_available_amt;
                                            let bal_win_amt ;
                                            let type ;
                                            let transactiondata ;
                                            // console.log("--------fpusv['gift_type']----///----",fpusv)
                                            if(fpusv['gift_type'] == "gift"){
                                                type = "Challenge Winning Gift"
                                                total_available_amt = totalBalance
                                                bal_win_amt = totalwinning
                                                 userObj = {
                                                    'userbalance.balance': balance,
                                                    'userbalance.bonus': bonus,
                                                    'userbalance.winning': winning,
                                                    'totalwinning': totalwinning
    
                                                };
                                                transactiondata = {
                                                    type: type,
                                                    amount: 0,
                                                    prize:amount,
                                                    total_available_amt:total_available_amt,
                                                    transaction_by: constant.APP_SHORT_NAME,
                                                    challengeid: challenge._id,
                                                    userid: fpusk,
                                                    paymentstatus: constant.PAYMENT_STATUS_TYPES.CONFIRMED,
                                                    bal_bonus_amt: bonus,
                                                    bal_win_amt: bal_win_amt,
                                                    bal_fund_amt: balance,
                                                    win_amt: 0,
                                                    transaction_id: transactionidsave
                                                };
                                                
                                            }else{
                                                type ="Challenge Winning Amount"
                                                total_available_amt = totalBalance + amount ;
                                                bal_win_amt =  winning + amount ;
                                                 userObj = {
                                                    'userbalance.balance': balance,
                                                    'userbalance.bonus': bonus,
                                                    'userbalance.winning': bal_win_amt,
                                                    'totalwinning': total_available_amt
    
                                                };
                                                transactiondata = {
                                                    type: type,
                                                    amount: amount,
                                                    total_available_amt:total_available_amt,
                                                    transaction_by: constant.APP_SHORT_NAME,
                                                    challengeid: challenge._id,
                                                    userid: fpusk,
                                                    paymentstatus: constant.PAYMENT_STATUS_TYPES.CONFIRMED,
                                                    bal_bonus_amt: bonus,
                                                    bal_win_amt: bal_win_amt,
                                                    bal_fund_amt: balance,
                                                    win_amt: amount,
                                                    transaction_id: transactionidsave
                                                };
                                            }
                                        
                                            
                                            // console.log("----transactiondata---",transactiondata)
                                            // console.log("--userObj---",userObj)
                                           let myinserttt= await Promise.all([
                                                userModel.findOneAndUpdate({ _id: fpusk }, userObj, { new: true }),
                                                TransactionModel.create(transactiondata)
                                            ]);
                                            // console.log("---myinserttt--",myinserttt)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                
            }
        }
        return true;
    }
}
module.exports = new quizServices();