const mongoose = require('mongoose');
const moment = require("moment");

const stockQuizModel = require('../../models/stockQuizModel');
const stockQuizFinalResult = require('../../models/stockQuizFinalResult');
const QuizJoinLeaugeModel = require('../../models/QuizJoinLeaugeModel');
const refundMatchModel = require('../../models/refundModel');
const listMatchesModel = require('../../models/listMatchesModel');
const matchchallengersModel = require("../../models/matchChallengersModel")
const challengersModel = require("../../models/challengersModel")
const priceCardModel = require("../../models/priceCardModel")
const globalQuizModel = require('../../models/globalQuizModel');
const listMatches = require('../../models/listMatchesModel');
const joinLeague = require('../../models/JoinLeaugeModel')
const TransactionModel = require('../../models/transactionModel')
const tdsDetailModel = require('../../models/tdsDetailModel')
const userModel = require('../../models/userModel')
const finalQuizResultModel = require('../../models/finalQuizResultModel')
const constant = require('../../config/const_credential');
const LevelServices = require("./LevelServices");
const randomstring = require("randomstring");
const StockQuizJoinLeaugeModel = require('../../models/StockQuizJoinLeaugeModel');
class StockquizServices {
    constructor() {
        return {
            AddQuiz: this.AddQuiz.bind(this),
            QuizGIveAnswer: this.QuizGIveAnswer.bind(this),
            seriesDataTable: this.seriesDataTable.bind(this),
            updateStatusforSeries: this.updateStatusforSeries.bind(this),
            edit_Series: this.edit_Series.bind(this),
            editSeriesData: this.editSeriesData.bind(this),
            findSeries: this.findSeries.bind(this),
            editQuizData: this.editQuizData.bind(this),
            editQuiz: this.editQuiz.bind(this),
            deletequiz: this.deletequiz.bind(this),
            quizdistributeWinningAmount: this.quizdistributeWinningAmount.bind(this),
            addGlobalQuestion: this.addGlobalQuestion.bind(this),
            editglobalquestion: this.editglobalquestion.bind(this),
            editGlobalQuestionData: this.editGlobalQuestionData.bind(this),
            deleteGlobalQuestion: this.deleteGlobalQuestion.bind(this),
            globalQuestionMuldelete: this.globalQuestionMuldelete.bind(this),
            createCustomQuestions: this.createCustomQuestions.bind(this),
            importQuestionData: this.importQuestionData.bind(this),
            quizcreateCustomContest: this.quizcreateCustomContest.bind(this),
            quizimportchallengersData: this.quizimportchallengersData.bind(this),
            quizRefundAmount: this.quizRefundAmount.bind(this),
            stockquizrefundprocess: this.stockquizrefundprocess.bind(this),
            cancelQuiz: this.cancelQuiz.bind(this),
            stockquizdistributeWinningAmountWithAnswerMatch: this.stockquizdistributeWinningAmountWithAnswerMatch.bind(this),
            quizCancel: this.quizCancel.bind(this),
            viewtransactions: this.viewtransactions.bind(this),
            EnableStockQuiz: this.EnableStockQuiz.bind(this),
            cancelStockQuiz: this.cancelStockQuiz.bind(this),
            stockquizviewtransactions: this.stockquizviewtransactions.bind(this),
            stockquizallRefundAmount: this.stockquizallRefundAmount.bind(this),
            updateResultOfStocksQuiz: this.updateResultOfStocksQuiz.bind(this),
            getStockQuizUpdates: this.getStockQuizUpdates.bind(this),
        }
    }

    async findSeries(data) {
        let result = await seriesModel.find(data);
        return result;
    }

    async AddQuiz(req) {
        try {
            let { question, option_1, option_2, option_3, entryfee, winning_amount } = req.body;
            let start_date
            if (req.body.start_date) {
            start_date = moment(req.body.start_date, 'YYYY/MM/DD HH:mm').format('YYYY-MM-DD HH:mm:ss');
            }
            let end_date
            if (req.body.end_date) {
                end_date = moment(req.body.end_date, 'YYYY/MM/DD HH:mm').format('YYYY-MM-DD HH:mm:ss');
                }
            let addquiz = new stockQuizModel({
                question: question,
                option_1: option_1,
                option_2: option_2,
                option_3: option_3,
                entryfee: entryfee,
                winning_amount: winning_amount * entryfee,
                start_date: start_date,
                end_date:end_date
            });
            let savequiz = await addquiz.save();
            if (savequiz) {
                return {
                    status:true,
                    message:'stock quiz add successfully'
                }
            }else{
                return {
                    status:false,
                    message:'stock quiz not add error..'
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
            let sortObject = {};
            let conditions = {};
            if (req.query.seriesName) {
                let seriesName = req.query.seriesName;
                conditions.seriesName ={ $regex: new RegExp("^" + seriesName.toLowerCase(), "i") }
            }

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

    async EnableStockQuiz(req) {
        try {
            let { stockQuiztId } = req.query
            let savequiz = await stockQuizModel.findOne({ _id: stockQuiztId })
            if (savequiz) {
                savequiz.is_enabled = true
                await savequiz.save();
                return {
                    status:true,
                    message:'stock quiz enable successfully'
                }
            }else{
                return {
                    status:false,
                    message:'stock quiz not found error..'
                }
            }
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
        let data = await stockQuizModel.find(whereObj);
        if(data.length > 0){
            return data[0];
        }
    }

    async editQuizData(req){ 
        let whereObj ={
            _id:req.params.id
        }
        let { question, option_1, option_2, option_3, entryfee, winning_amount } = req.body
        let start_date
        if (req.body.start_date) {
        start_date = moment(req.body.start_date, 'YYYY/MM/DD HH:mm').format('YYYY-MM-DD HH:mm:ss');
        }
        let end_date
        if (req.body.end_date) {
            end_date = moment(req.body.end_date, 'YYYY/MM/DD HH:mm').format('YYYY-MM-DD HH:mm:ss');
        }
           let doc
                 doc = {
                    question: question,
                    option_1: option_1,
                    option_2: option_2,
                    option_3: option_3,
                    entryfee: entryfee,
                    winning_amount: winning_amount * entryfee,
                    start_date: start_date,
                    end_date:end_date
                }
            const data=await stockQuizModel.updateOne(whereObj,{$set:doc});
            if(data.modifiedCount == 1){
            return {
                status:true,
                message:"Quiz Update successfully"
            } 
      }
    }
    async deletequiz(req){
        try {
            const deletequiz = await stockQuizModel.deleteOne({ _id: req.query.quizId });
            if(deletequiz.deletedCount > 0 ){
                return {
                    status:true,
                    message:'stock quiz deleted successfully'
                };
            }else{
                return {
                    status:false,
                    message:'stock quiz can not delete --error'
                }
            }

        }catch(error){
            throw error;
        }
    }

    async stockquizdistributeWinningAmountWithAnswerMatch(req) {
        try {
            let { id, status } = req.params;
            let joinData = await StockQuizJoinLeaugeModel.find({ stockquizId: id })
            let quizData = await stockQuizModel.findOne({ _id: id })
            if (joinData.length == 0) {
                return {
                    message: "Stock Quiz Answer Not Found",
                    status: false,
                    data: {}
                }
            }
            if (!quizData) {
                return {
                    message: " Stock Quiz not found",
                    status: false,
                    data: {}
                }
            }
            let data;
            if (joinData.length > 0 && quizData) {
                for (let join_data of joinData) {
                        if (quizData._id.toString() === join_data.stockquizId.toString()) {
                                    if (quizData.answer === join_data.answer) {
                                        const user = await userModel.findOne({ _id: join_data.userid }, { userbalance: 1, totalwinning: 1 });
                                        data = await StockQuizJoinLeaugeModel.findOneAndUpdate({ stockquizId: join_data.stockquizId,userid:join_data.userid}, { winamount: quizData.winning_amount }, { new: true })
                                        const bonus = parseFloat(user.userbalance.bonus.toFixed(2));
                                        const balance = parseFloat(user.userbalance.balance.toFixed(2));
                                        const winning = parseFloat(user.userbalance.winning.toFixed(2));
                                        const totalwinning = parseFloat(user.totalwinning.toFixed(2));
                                        const totalBalance = bonus + balance + winning;
                                        let randomStr = randomstring.generate({
                                            length: 4,
                                            charset: 'alphabetic',
                                            capitalization: 'uppercase'
                                        });
                                        let transactionidsave = `${constant.APP_SHORT_NAME}-WIN-${Date.now()}-${randomStr}`;
                                        const userObj = {
                                            'userbalance.balance': balance,
                                            'userbalance.bonus': bonus,
                                            'userbalance.winning': winning + quizData.winning_amount,
                                            'totalwinning': totalwinning + quizData.winning_amount
                                        };
                                        const transactiondata = {
                                            type: 'Stock Quiz Winning Amount',
                                            amount: quizData.winning_amount,
                                            total_available_amt: totalBalance + quizData.winning_amount,
                                            transaction_by: constant.APP_SHORT_NAME,
                                            stockquizId: join_data.stockquizId,
                                            userid: join_data.userid,
                                            paymentstatus: constant.PAYMENT_STATUS_TYPES.CONFIRMED,
                                            bal_bonus_amt: bonus,
                                            bal_win_amt: winning + quizData.winning_amount,
                                            bal_fund_amt: balance,
                                            win_amt: quizData.winning_amount,
                                            transaction_id: transactionidsave
                                        }
                                          
                                        let finalResult = {
                                            userid: join_data.userid,
                                            amount: quizData.winning_amount,
                                            quizId: join_data.stockquizId,
                                            transaction_id: transactionidsave,
                                            joinedid: join_data._id
                                        };

                                        let checkWinningUser = await finalQuizResultModel.findOne({
                                            joinedid: mongoose.Types.ObjectId(join_data._id),
                                            userid: mongoose.Types.ObjectId(join_data.userid,)
                                        });

                                        if (!checkWinningUser) {
                                            await finalQuizResultModel.create(finalResult);
                                        }
                                        await Promise.all([
                                            stockQuizModel.findOneAndUpdate({ _id:join_data.stockquizId},{final_status:status},{new:true}),
                                            userModel.findOneAndUpdate({ _id: join_data.userid }, userObj, { new: true }),
                                            TransactionModel.create(transactiondata),
                                        ])
                                    }
                        }
                    
                }
                return {
                    message: "Stock Quiz Amount distribute successfully",
                    status: true,
                    data: joinData
                }
            }
        
        }catch(error){
            throw error;
        }
    }

    async quizdistributeWinningAmount(req) {
        console.log("-------------------------------------distributeWinningAmount------------------------------")
        let { id, status } = req.params;
        let matchkey = id;
        let match_time = moment().subtract(10, 'm').format('YYYY-MM-DD HH:mm:ss');
        let pipeline = [];
        pipeline.push({
            $match: {
                _id: mongoose.Types.ObjectId(matchkey),
                launch_status: 'launched',
                quiz_status: { $nin: ["winnerdeclared", "IsCanceled", "IsAbandoned"] }
            }
        });
        pipeline.push({
            $lookup: {
                from: 'matchchallenges',
                let: { matckey: "$_id" },
                pipeline: [{
                    $match: {
                        status: { $ne: "canceled" },
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
                        from: 'jointeams',
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
                            let checkWinning = await finalResultModel.findOne({ joinedid: mongoose.Types.ObjectId(fpuskjoinid) });
                            if (!checkWinning) {
                                let randomStr = randomstring.generate({
                                    length: 4,
                                    charset: 'alphabetic',
                                    capitalization: 'uppercase'
                                });
                                // console.log("------randomStr-------", randomStr)
                                let transactionidsave = `${constant.APP_SHORT_NAME}-WIN-${Date.now()}-${randomStr}`;
                                
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
                                let checkWinningUser = await finalResultModel.findOne({
                                    joinedid: mongoose.Types.ObjectId(fpuskjoinid),
                                    userid: mongoose.Types.ObjectId(fpusk)
                                });
                                // console.log("---checkWinningUser---",checkWinningUser)
                                if (!checkWinningUser) {
                                    await finalResultModel.create(finalResultArr);
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

    async stockquizallRefundAmount(req, reason) {
        console.log("-------------------------------------stockquizallRefundAmount-------------------------")
        let { id, status } = req.params;
        let quizData = await stockQuizModel.find({ _id: mongoose.Types.ObjectId(id) });
        if (quizData.length > 0) {
            for (let quiz of quizData) {
                let getresponse = await this.stockquizrefundprocess(quiz._id, quiz.entryfee, id, reason);
                if (getresponse == true) {
                    await stockQuizModel.updateOne({ _id: mongoose.Types.ObjectId(quiz._id) }, {
                        $set: {
                            final_status: status
                        }
                    });
                }
            }
        }
    }

    async addGlobalQuestion(req) {
        try {
            let addglobalquiz = new globalQuizModel({
                question: req.body.question,
                option_A: req.body.option_A,
                option_B: req.body.option_B,
                option_C: req.body.option_C,
                option_D: req.body.option_D,
                answer: req.body.answer,
                point:req.body.point
            });

            let savequiz = await addglobalquiz.save();
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

    async editglobalquestion(req) {
        try {
            if (req.params.id) {
                let globalquestions = await globalQuizModel.findOne({_id:req.params.id})
                if (globalquestions) {
                    return {
                        status: true,
                        data:globalquestions
                    }
                } else {
                    return {
                        status: false,
                        message: 'Quiz Not Found'
                    }
                }
            } else {
                return {
                    status: false,
                    message: 'Invalid Quiz Id'
                }
            }
        } catch (error) {
            throw error;
        }
    }

    async editGlobalQuestionData(req) {
        try {
                let data = {}
                const globalQuestionData = await globalQuizModel.findOne({ _id: req.body.globelQuestionId });
                if (!globalQuestionData) {
                    return {
                        status: false,
                        message: 'Quiz Not Found',
                    }
                } else {
                    data.question = req.body.question;
                    data.option_A = req.body.option_A;
                    data.option_B = req.body.option_B;
                    data.option_C = req.body.option_C;
                    data.option_D = req.body.option_D;
                    data.answer = req.body.answer;
                    data.point = req.body.point;
                    const updateGlobalQuestion = await globalQuizModel.updateOne({ _id: mongoose.Types.ObjectId(req.body.globelQuestionId) }, { $set: data });
                    if (updateGlobalQuestion.modifiedCount > 0) {
                        return {
                            status: true,
                            message: 'globel Question successfully update'
                        };
                    } else {
                        return {
                            status: false,
                            message: "Not Able To Update Globel Question  ..ERROR.."
                        }
                    }
                }
        } catch (error) {
            throw error;
        }
    }

    async deleteGlobalQuestion(req) {
        try {
            const deleteQuestions = await globalQuizModel.deleteOne({ _id: req.query.globelQuestionId });
            if (deleteQuestions.deletedCount == 1) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            throw error;
        }
    }
    async globalQuestionMuldelete(req) {
        try {
            console.log(req.body.deletedId,"iiiiiiiiiiiiiii")
            let deleteIds = req.body.deletedId;
            for (let key of deleteIds) {
                const deleteQuestion = await globalQuizModel.deleteOne({ _id: mongoose.Types.ObjectId(key) })
            }
            if (deleteIds.length == 0) {
                return true;
            }

        } catch (error) {
            throw error;
        }
    }
    async createCustomQuestions(req) {
        try {
            let curTime = moment().format("YYYY-MM-DD HH:mm:ss");
            const getLunchedMatch = await listMatches.find({ status: "notstarted", launch_status: "launched", start_date: { $gt: curTime } ,isQuiz:1}, { name: 1 });
            let getlistofMatches
            let anArray = [];
            if (req.query.matchkey) {
                let qukey = req.query.matchkey
                let objfind={};
                objfind.matchkey= mongoose.Types.ObjectId(qukey)
                getlistofMatches = await globalQuizModel.find(objfind);
                for await (let keyy of getlistofMatches) {
                    let obj = {};
                        obj._id = keyy._id
                        obj.question = keyy.question;
                        obj.option_A = keyy.option_A;
                        obj.option_B = keyy.option_B;
                        obj.option_C = keyy.option_C;
                        obj.option_D = keyy.option_D;
                        obj.answer = keyy.answer;
                        obj.point = keyy.point;
                        anArray.push(obj)
                }
            } else {
                getlistofMatches = []
            }
            if (getLunchedMatch.length>0) {
                return {
                    quizData: anArray,
                    matchkey: req.body.matchkey,
                    data: getLunchedMatch,
                    status: true
                }
            } else {
                return {
                    status: false,
                    message: 'can not get list-Matches data'
                }
            }
        } catch (error) {
            throw error;
        }
    }
    async importQuestionData(req) {
        try {
            let listmatchData = await listMatches.findOne({ _id: mongoose.Types.ObjectId(req.params.matchKey), isQuiz: 1, is_deleted: false });
            if (listmatchData) {
                // const findleauges = await challengersModel.find({ fantasy_type: { $regex: new RegExp(findmatch.fantasy_type.toLowerCase(), "i") } });
                let findQuestions
                if (req.query.question_count && req.query.question_count>0) {
                    findQuestions = await globalQuizModel.find().limit(req.query.question_count);
                    if (findQuestions.length < req.query.question_count) {
                        return {
                            status: false,
                            message: `You Select Only ${findQuestions.length} questions`
                        }
                    }
                } else {
                    return {
                        status: false,
                        message: 'Please Add Atleast One Question'
                    }
                }
                let anArray = [];
                if (findQuestions.length > 0) {
                    for await (let key1 of findQuestions) {
                        // const findchallengeexist = await matchchallengersModel.find({ matchkey: mongoose.Types.ObjectId(req.params.matchKey), challenge_id: mongoose.Types.ObjectId(key1._id) });
                        const findquestionexist = await stockQuizModel.find({ matchkey_id: mongoose.Types.ObjectId(req.params.matchKey), global_quizId: mongoose.Types.ObjectId(key1._id) });
                        if (findquestionexist.length == 0) {
                            let data = {};
                            data['matchkey_id'] = req.params.matchKey;
                            data['question'] = key1.question;
                            data['option_A'] = key1.option_A;
                            data['option_B'] = key1.option_B;
                            data['option_C'] = key1.option_C;
                            data['option_D'] = key1.option_D;
                            data['answer'] = key1.answer;
                            data['point'] = key1.point;
                            data['global_quizId'] = mongoose.Types.ObjectId(key1._id);
                            const insertData = new stockQuizModel(data);
                            let saveInsert = await insertData.save();
                        }
                    }
                    return {
                        status: true,
                        message: 'Questions imported successfully'
                    }
                }
                return {
                    status: false,
                    message: 'Question not Found ..error..'
                }

            }
            return {
                status: false,
                message: 'Questions not imported ..error..'
            }
        } catch (error) {
            throw error;
        }
    }

    async quizcreateCustomContest(req) {
        try {
            let curTime = moment().format("YYYY-MM-DD HH:mm:ss");
            const getLunchedMatch = await listMatches.find({ status: "notstarted", launch_status: "launched", start_date: { $gt: curTime } ,isQuiz:1}, {name: 1 });
            let getlistofMatches
            let anArray = [];
            if (req.query.matchkey) {
                let qukey = req.query.matchkey
                let objfind={};
                objfind.matchkey= mongoose.Types.ObjectId(qukey)
                if(req.query.entryfee && req.query.entryfee != ""){
                objfind.entryfee= Number(req.query.entryfee)
                }
                if(req.query.win_amount && req.query.win_amount != ""){
                objfind.win_amount= Number(req.query.win_amount)
                }
                if(req.query.team_limit && req.query.team_limit != ""){
                objfind.team_limit= Number(req.query.team_limit)
                }
                objfind.type_contest = "Quiz"
                getlistofMatches = await matchchallengersModel.find(objfind);
                for await (let keyy of getlistofMatches) {
                    let obj = {};
                    let newDate = moment(keyy.createdAt).format('MMM Do YY');
                    let day = moment(keyy.createdAt).format('dddd');
                    let time = moment(keyy.createdAt).format('h:mm:ss a');
                    if (keyy.is_expert == 1) {
                        obj.newDate = newDate;
                        obj.day = day;
                        obj.time = time;
                        obj.contest_cat = keyy.contest_cat;
                        obj.matchkey = keyy.matchkey;
                        obj.fantasy_type = keyy.fantasy_type
                        obj.entryfee = keyy.entryfee;
                        obj.win_amount = keyy.win_amount;
                        obj.status = keyy.status;
                        obj.contest_type = keyy.contest_type;
                        obj.winning_percentage = keyy.winning_percentage;
                        obj.is_bonus = keyy.is_bonus;
                        obj.bonus_percentage = keyy.bonus_percentage;
                        obj.amount_type = keyy.amount_type;
                        obj.c_type = keyy.c_type;
                        obj.is_private = keyy.is_private;
                        obj.is_running = keyy.is_running;
                        obj.confirmed_challenge = keyy.confirmed_challenge;
                        obj.multi_entry = keyy.multi_entry;
                        obj._id = keyy._id;
                        obj.joinedusers = keyy.joinedusers;
                        obj.team_limit = keyy.team_limit;

                    } else {
                        obj.newDate = newDate;
                        obj.day = day;
                        obj.time = time;
                        obj._id = keyy._id;
                        obj.contest_cat = keyy.contest_cat;
                        obj.challenge_id = keyy.challenge_id;
                        obj.matchkey = keyy.matchkey;
                        obj.fantasy_type = keyy.fantasy_type;
                        obj.entryfee = keyy.entryfee;
                        obj.win_amount = keyy.win_amount;
                        obj.maximum_user = keyy.maximum_user;
                        obj.status = keyy.status;
                        obj.joinedusers = keyy.joinedusers;
                        obj.contest_type = keyy.contest_type;
                        obj.contest_name = keyy?.contest_name;
                        obj.mega_status = keyy.mega_status;
                        obj.winning_percentage = keyy.winning_percentage;
                        obj.is_bonus = keyy.is_bonus;
                        obj.bonus_percentage = keyy.bonus_percentage;
                        obj.pricecard_type = keyy.pricecard_type;
                        obj.minimum_user = keyy.minimum_user;
                        obj.confirmed_challenge = keyy.confirmed_challenge;
                        obj.multi_entry = keyy.multi_entry;
                        obj.team_limit = keyy.team_limit;
                        obj.c_type = keyy.c_type;
                        obj.is_private = keyy.is_private;
                        obj.is_running = keyy.is_running;
                        obj.is_deleted = keyy.is_deleted;
                        obj.matchpricecards = keyy.matchpricecards;
                        obj.amount_type = keyy.amount_type;
                    }
                    anArray.push(obj)
                }
            } else {
                getlistofMatches = []
            }
            // console.log("anArray.................//////////.anArray.............................................", anArray)
            if (getLunchedMatch) {
                return {
                    matchData: anArray,
                    matchkey: req.body.matchkey,
                    data: getLunchedMatch,
                    status: true
                }
            } else {
                return {
                    status: false,
                    message: 'can not get list-Matches data'
                }
            }
        } catch (error) {
            throw error;
        }
    }
    async quizimportchallengersData(req) {
        try {
            
            let findmatch = await listMatches.findOne({ _id: mongoose.Types.ObjectId(req.params.matchKey), isQuiz: 1, is_deleted: false });
            if (findmatch) {
                const findleauges = await challengersModel.find({ fantasy_type: { $regex: new RegExp(findmatch.fantasy_type.toLowerCase(), "i") } ,type_contest: "Quiz"});
                let anArray = [];
                if (findleauges.length > 0) {
                    for await (let key1 of findleauges) {
                        const findchallengeexist = await matchchallengersModel.find({ matchkey: mongoose.Types.ObjectId(req.params.matchKey), challenge_id: mongoose.Types.ObjectId(key1._id),type_contest:"Quiz" });
                        if (findchallengeexist.length == 0) {
                            let data = {};
                            data['challenge_id'] = mongoose.Types.ObjectId(key1._id);
                            data['contest_cat'] = mongoose.Types.ObjectId(key1.contest_cat);
                            data['contest_type'] = key1.contest_type;
                            data['winning_percentage'] = key1.winning_percentage;
                            data['is_bonus'] = key1.is_bonus;
                            data['bonus_percentage'] = key1.bonus_percentage;
                            data['pricecard_type'] = key1.pricecard_type;
                            data['entryfee'] = key1.entryfee;
                            data['win_amount'] = key1.win_amount;
                            data['maximum_user'] = key1.maximum_user;
                            data['status'] = 'opened';
                            data['confirmed_challenge'] = key1.confirmed_challenge;
                            data['is_running'] = key1.is_running;
                            data['multi_entry'] = key1.multi_entry;
                            data['team_limit'] = key1.team_limit;
                            data['matchkey'] = mongoose.Types.ObjectId(req.params.matchKey);
                            data['contest_name'] = key1.contest_name;
                            data['amount_type'] = key1.amount_type;
                            data['type_contest'] = key1.type_contest;
                            
                            const insertData = new matchchallengersModel(data);
                            let saveInsert = await insertData.save();

                            let findpricecrads = await priceCardModel.find({ challengersId: key1._id });
                            if (findpricecrads.length > 0) {
                                for await (let key2 of findpricecrads) {
                                    let pdata = {};
                                    pdata['challengeId'] = mongoose.Types.ObjectId(key2.challengersId);
                                    pdata['matchkey'] = mongoose.Types.ObjectId(req.params.matchKey);
                                    pdata['winners'] = key2.winners;
                                    pdata['price'] = key2.price;
                                    if (key2.price_percent) {
                                        pdata['price_percent'] = key2.price_percent;
                                    }
                                    if (key1.amount_type == "prize") {
                                        pdata['prize_name'] = key2.prize_name;
                                        pdata['image'] = key2.image;
                                    }
                                    pdata["gift_type"] = key2.gift_type || "amount";
                                    pdata['min_position'] = key2.min_position;
                                    pdata['max_position'] = key2.max_position;
                                    pdata['total'] = key2.total;
                                    pdata['type'] = key2.type;

                                    const updateInsert = await matchchallengersModel.updateOne({ _id: mongoose.Types.ObjectId(saveInsert._id) }, {
                                        $push: {
                                            matchpricecards: pdata
                                        }
                                    })
                                }
                            }
                        }
                    }
                    return {
                        status: true,
                        message: 'Challenge imported successfully'
                    }

                }
                return {
                    status: false,
                    message: 'Challenge not Found ..error..'
                }

            }
            return {
                status: false,
                message: 'Challenge not imported ..error..'
            }
        } catch (error) {
            throw error;
        }
    }

    async QuizGIveAnswer(req) {
        try {
            let { answer } = req.body
            let _id = req.params.id;
            let data = await stockQuizModel.findOneAndUpdate({ _id },{answer:answer},{new:true});
            if (!data) {
                return {
                    status:false,
                    message:'stock quiz not found'
                } 
            }
            return {
                status:true,
                message: 'stock quiz answer update successfully',
                data:data
            }
        } catch (error) {
            throw error;
        }
    }

    async stockquizrefundprocess(stockquizId, entryfee, matchkey, reason) {
        console.log("-------------------------------------stockquizrefundprocess-----------------------------")
        let joinLeagues = await StockQuizJoinLeaugeModel.find({
            stockquizId: mongoose.Types.ObjectId(stockquizId),
        });
        if (joinLeagues.length > 0) {
            for (let league of joinLeagues) {
                let leaugestransaction = league.leaugestransaction;
                let refund_data = await refundMatchModel.findOne({ joinid: mongoose.Types.ObjectId(league._id) });
                if (!refund_data) {
                    const user = await userModel.findOne({ _id: leaugestransaction.user_id }, { userbalance: 1 });
                    if (user) {
                        const bonus = parseFloat(user.userbalance.bonus.toFixed(2));
                        const balance = parseFloat(user.userbalance.balance.toFixed(2));
                        const winning = parseFloat(user.userbalance.winning.toFixed(2));
                        const totalBalance = bonus + balance + winning;
                        const userObj = {
                            'userbalance.balance': balance + leaugestransaction.balance,
                            'userbalance.bonus': bonus + leaugestransaction.bonus,
                            'userbalance.winning': winning + leaugestransaction.winning,
                        };
                        let randomStr = randomstring.generate({
                            length: 4,
                            charset: 'alphabetic',
                            capitalization: 'uppercase'
                        });
                        console.log("------randomStr-------2", randomStr)
                        let transaction_id = `${constant.APP_SHORT_NAME}-${Date.now()}-${randomStr}`;
                        let refundData = {
                            userid: leaugestransaction.user_id,
                            amount: entryfee,
                            joinid: league._id,
                            stockquizId: league.stockquizId,
                            reason: reason,
                            transaction_id: transaction_id
                        };
                        const transactiondata = {
                            type: 'Refund',
                            amount: entryfee,
                            total_available_amt: totalBalance + entryfee,
                            transaction_by: constant.APP_SHORT_NAME,
                            stockquizId: stockquizId,
                            userid: leaugestransaction.user_id,
                            paymentstatus: constant.PAYMENT_STATUS_TYPES.CONFIRMED,
                            bal_bonus_amt: bonus + leaugestransaction.bonus,
                            bal_win_amt: winning + leaugestransaction.winning,
                            bal_fund_amt: balance + leaugestransaction.balance,
                            bonus_amt: leaugestransaction.bonus,
                            win_amt: leaugestransaction.winning,
                            addfund_amt: leaugestransaction.balance,
                            transaction_id: transaction_id
                        };
                        await Promise.all([
                            userModel.findOneAndUpdate({ _id: leaugestransaction.user_id }, userObj, { new: true }),
                            refundModel.create(refundData),
                            TransactionModel.create(transactiondata)
                        ]);
                    }
                }
            }
        }
        return true;
    }
    async quizRefundAmount(req) {
        try {
        console.log("-------------------------------------quizrefundAmount-------------------------")
        const currentDate = moment().format('YYYY-MM-DD HH:mm:ss');
        let match_time = moment().add(10, 'm').format('YYYY-MM-DD HH:mm:ss');
      
        let pipeline = [];
        pipeline.push({
            $match: {
                // _id:mongoose.Types.ObjectId('63fd749179494aff832d5325'),
                // fantasy_type: "Cricket",
                // start_date: { $lte: match_time },
                launch_status: 'launched',
                final_status: { $nin: ["winnerdeclared", "IsCanceled"] }
            }
        });
        // --------------
        let today= new Date();
        today.setHours(today.getHours() + 5);
        today.setMinutes(today.getMinutes() + 30);
        // let lastDate = today.setMinutes(today.getMinutes() + 10);
        // console.log("--today-+10---",today)
        pipeline.push({
            $addFields: {
                date: {
                    $dateFromString: {
                        dateString: '$start_date',
                        timezone: "-00:00"
                    }
                },
                curDate: today
            }
        });
        pipeline.push({
            $match:{
                $expr: {
                    $and: [{
                        $lte: ['$date','$curDate'],
                        },
                    ],
                },
            }
        });
        // --------------
        pipeline.push({
            $lookup: {
                from: 'matchchallenges',
                let: { matckey: "$_id" },
                pipeline: [{
                    $match: {
                        status: { $ne: "canceled" },
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
            pipeline.push({
                $lookup: {
                from: 'quizzes',
                let: { matckey: "$_id" },
                pipeline: [{
                    $match: {
                        $expr: {
                            $and: [
                                { $eq: ["$matchkey", "$$matckey"] },
                            ],
                        },
                    },
                },],
                as: 'quizData'
            }
            
        })
        let listmatches = await listMatchesModel.aggregate(pipeline);
        if (listmatches.length > 0) {
            for (let match of listmatches) {
                // if (match.matchChallengesData.length > 0) {
                //     for (let value1 of match.matchChallengesData) {
                //         let data = {};
                //         if (value1.maximum_user > value1.joinedusers) {
                //             if (value1.confirmed_challenge == 0) {
                //                 let getresponse = await this.quizrefundprocess(value1._id, value1.entryfee, match._id, 'challenge cancel');
                //                 if (getresponse == true) {
                //                     await matchchallengesModel.updateOne({ _id: mongoose.Types.ObjectId(value1._id) }, {
                //                         $set: {
                //                             status: 'canceled'
                //                         }
                //                     });
                //                 }
                //             }
                //         }
                //         if (value1.pricecard_type == 'Percentage') {
                //             let joinedUsers = await JoinLeaugeModel.find({
                //                 matchkey: mongoose.Types.ObjectId(match.matchkey),
                //                 challengeid: mongoose.Types.ObjectId(value1._id),
                //             }).count();
                //             if (value1.confirmed_challenge == 1 && joinedUsers == 1) {
                //                 let getresponse = await this.quizrefundprocess(value1._id, value1.entryfee, match.matchkey, 'challenge cancel');
                //                 if (getresponse == true) {
                //                     data['status'] = 'canceled';
                //                     await matchchallengesModel.updateOne({ _id: mongoose.Types.ObjectId(value1._id) }, {
                //                         $set: {
                //                             status: 'canceled'
                //                         }
                //                     });
                //                 }
                //             }
                //         }
                //     }
                // }
                if (match.quizData.length > 0) {
                    for (let value1 of match.quizData) {
                        let data = {};
                        
                        let getresponse = await this.quizrefundprocess(value1._id, value1.entryfee, match._id, 'quiz cancel');
                        if (getresponse == true) {
                            await stockQuizModel.updateOne({ _id: mongoose.Types.ObjectId(value1._id) }, {
                                $set: {
                                    status: 'canceled'
                                }
                            });
                        }
                            
                        // if (value1.pricecard_type == 'Percentage') {
                        //     let joinedUsers = await JoinLeaugeModel.find({
                        //         matchkey: mongoose.Types.ObjectId(match.matchkey),
                        //         challengeid: mongoose.Types.ObjectId(value1._id),
                        //     }).count();
                        //     if (value1.confirmed_challenge == 1 && joinedUsers == 1) {
                        //         let getresponse = await this.quizrefundprocess(value1._id, value1.entryfee, match.matchkey, 'challenge cancel');
                        //         if (getresponse == true) {
                        //             data['status'] = 'canceled';
                        //             await matchchallengesModel.updateOne({ _id: mongoose.Types.ObjectId(value1._id) }, {
                        //                 $set: {
                        //                     status: 'canceled'
                        //                 }
                        //             });
                        //         }
                        //     }
                        // }
                    }
                }
            }
         }
         return {
            message: 'Refund amount successfully ',
            success: true,
        }
        } catch (error) {
            throw error;
        }
    }

    async cancelQuiz(req){
        try {
            const matchContest= await stockQuizModel.find({matchkey:req.query.matchkey});
            if(matchContest.length > 0){
                for await(let key of matchContest){
                    req.params.quizId=key._id
                  
                    const getMatchContestData = await stockQuizModel.findOne({ _id: req.params.quizId,matchkey:req.query.matchkey});
           
            if (getMatchContestData) {
                let joinLeagues = await QuizJoinLeaugeModel.find({ matchkey: getMatchContestData.matchkey, quizId: getMatchContestData._id });
       
                if (joinLeagues.length > 0) {
                    for (let league of joinLeagues) {
                        let leaugestransaction = league.leaugestransaction;
                        let randomStr=randomstring.generate({
                            length: 4,
                            charset: 'alphabetic',
                            capitalization:'uppercase'
                          });
                        let refund_data = await refundMatchModel.findOne({ joinid: mongoose.Types.ObjectId(league._id) });
                  
                        if (!refund_data) {
                            const user = await userModel.findOne({ _id: leaugestransaction.user_id }, { userbalance: 1 });
                            if (user) {
                                const bonus = parseFloat(user.userbalance.bonus.toFixed(2));
                                const balance = parseFloat(user.userbalance.balance.toFixed(2));
                                const winning = parseFloat(user.userbalance.winning.toFixed(2));
                                const totalBalance = bonus + balance + winning;
                                const userObj = {
                                    'userbalance.balance': balance + leaugestransaction.balance,
                                    'userbalance.bonus': bonus + leaugestransaction.bonus,
                                    'userbalance.winning': winning + leaugestransaction.winning,
                                };
                               
                                let transaction_id = `${constant.APP_SHORT_NAME}-${Date.now()}-${randomStr}`;
                                let refundData = {
                                    userid: leaugestransaction.user_id,
                                    amount: getMatchContestData.entryfee,
                                    joinid: league._id,
                                    quizId: league.quizId,
                                    matchkey: getMatchContestData.matchkey,
                                    reason: 'cancel quiz',
                                    transaction_id: transaction_id
                                };
                               
                                const transactiondata = {
                                    type: 'Refund',
                                    amount: getMatchContestData.entryfee,
                                    total_available_amt: totalBalance + getMatchContestData.entryfee,
                                    transaction_by: constant.APP_SHORT_NAME,
                                    quizId: getMatchContestData._id,
                                    userid: leaugestransaction.user_id,
                                    paymentstatus: constant.PAYMENT_STATUS_TYPES.CONFIRMED,
                                    bal_bonus_amt: bonus + leaugestransaction.bonus,
                                    bal_win_amt: winning + leaugestransaction.winning,
                                    bal_fund_amt: balance + leaugestransaction.balance,
                                    bonus_amt: leaugestransaction.bonus,
                                    win_amt: leaugestransaction.winning,
                                    addfund_amt: leaugestransaction.balance,
                                    transaction_id: transaction_id
                                };
                               
                                let profmiss =await Promise.all([
                                    userModel.findOneAndUpdate({ _id: leaugestransaction.user_id }, userObj, { new: true }),
                                    refundMatchModel.create(refundData),
                                    TransactionModel.create(transactiondata)
                                ]);
                             
                            }
                        }
                    }
                }
                const getMatchContestData1 = await stockQuizModel.updateOne({ _id: req.params.quizId }, {
                    $set: {
                        // quiz_status: constant.MATCH_CHALLENGE_STATUS.CANCELED
                        quiz_status: req.query.status
                    }
                });
                
              } 
             }
            }
            const updateMatchCancel = await listMatchesModel.updateOne({_id:req.query.matchkey},{
                $set:{
                    quiz_status:req.query.status
                }
            })
          
            return{
                status:true,
                message:'quiz cancel successfully'
            }

        }catch(error){
            console.log(error)
        }
    }

    async quizCancel(req) {
        try {
            const getMatchContestData = await stockQuizModel.findOne({ _id: req.params.QuidId, matchkey: req.query.matchkey });
            if (getMatchContestData) {
                let joinLeagues = await QuizJoinLeaugeModel.find({ matchkey: getMatchContestData.matchkey, quizId: getMatchContestData._id });
                if (joinLeagues.length > 0) {
                    for (let league of joinLeagues) {
                        let leaugestransaction = league.leaugestransaction;
                        let randomStr = randomstring.generate({
                            length: 4,
                            charset: 'alphabetic',
                            capitalization: 'uppercase'
                        });
                        let refund_data = await refundMatchModel.findOne({ joinid: mongoose.Types.ObjectId(league._id) });
                        console.log("--refund_data--", refund_data)
                        if (!refund_data) {
                            const user = await userModel.findOne({ _id: leaugestransaction.user_id }, { userbalance: 1 });
                            if (user) {
                                const bonus = parseFloat(user.userbalance.bonus.toFixed(2));
                                const balance = parseFloat(user.userbalance.balance.toFixed(2));
                                const winning = parseFloat(user.userbalance.winning.toFixed(2));
                                const totalBalance = bonus + balance + winning;
                                const userObj = {
                                    'userbalance.balance': balance + leaugestransaction.balance,
                                    'userbalance.bonus': bonus + leaugestransaction.bonus,
                                    'userbalance.winning': winning + leaugestransaction.winning,
                                };

                                let transaction_id = `${constant.APP_SHORT_NAME}-${Date.now()}-${randomStr}`;
                                let refundData = {
                                    userid: leaugestransaction.user_id,
                                    amount: getMatchContestData.entryfee,
                                    joinid: league._id,
                                    quizId: league.quizId,
                                    matchkey: getMatchContestData.matchkey,
                                    reason: 'cancel quiz',
                                    transaction_id: transaction_id
                                };

                                const transactiondata = {
                                    type: 'Refund',
                                    amount: getMatchContestData.entryfee,
                                    total_available_amt: totalBalance + getMatchContestData.entryfee,
                                    transaction_by: constant.APP_SHORT_NAME,
                                    quizId: getMatchContestData._id,
                                    userid: leaugestransaction.user_id,
                                    paymentstatus: constant.PAYMENT_STATUS_TYPES.CONFIRMED,
                                    bal_bonus_amt: bonus + leaugestransaction.bonus,
                                    bal_win_amt: winning + leaugestransaction.winning,
                                    bal_fund_amt: balance + leaugestransaction.balance,
                                    bonus_amt: leaugestransaction.bonus,
                                    win_amt: leaugestransaction.winning,
                                    addfund_amt: leaugestransaction.balance,
                                    transaction_id: transaction_id
                                };

                                let profmiss = await Promise.all([
                                    userModel.findOneAndUpdate({ _id: leaugestransaction.user_id }, userObj, { new: true }),
                                    refundMatchModel.create(refundData),
                                    TransactionModel.create(transactiondata)
                                ]);
                                console.log("--profmiss---", profmiss)
                            }
                        }
                    }
                }
                const getMatchContestData1 = await stockQuizModel.updateOne({ _id: req.params.QuidId }, {
                    $set: {
                        quiz_status: "canceled"
                    }
                });
                return {
                    status: true,
                    message: 'quiz canceled'
                };

            } else {
                return {
                    status: false,
                    message: 'quiz not found ..error'
                }
            }

        } catch (error) {
            console.log(error)
        }
    }

    async viewtransactions(req) {
        try {
            const findTransactions = await TransactionModel.findOne({ userid: req.params.id });
            if (findTransactions) {
                return {
                    status: true,
                    data: findTransactions,
                }
            }
        } catch (error) {
           throw error;
        }
    }
    async cancelStockQuiz(req){
        try {
            const matchContest= await stockQuizModel.find({_id:req.params.id});
            if(matchContest.length > 0){
                for await(let key of matchContest){
                    req.params.stockquizId=key._id
                  
                    const getMatchContestData = await stockQuizModel.findOne({ _id: req.params.stockquizId});
           
            if (getMatchContestData) {
                let joinLeagues = await StockQuizJoinLeaugeModel.find({ stockquizId: getMatchContestData._id });
       
                if (joinLeagues.length > 0) {
                    for (let league of joinLeagues) {
                        let leaugestransaction = league.leaugestransaction;
                        let randomStr=randomstring.generate({
                            length: 4,
                            charset: 'alphabetic',
                            capitalization:'uppercase'
                          });
                        let refund_data = await refundMatchModel.findOne({ joinid: mongoose.Types.ObjectId(league._id) });
                  
                        if (!refund_data) {
                            const user = await userModel.findOne({ _id: leaugestransaction.user_id }, { userbalance: 1 });
                            if (user) {
                                const bonus = parseFloat(user.userbalance.bonus.toFixed(2));
                                const balance = parseFloat(user.userbalance.balance.toFixed(2));
                                const winning = parseFloat(user.userbalance.winning.toFixed(2));
                                const totalBalance = bonus + balance + winning;
                                const userObj = {
                                    'userbalance.balance': balance + leaugestransaction.balance,
                                    'userbalance.bonus': bonus + leaugestransaction.bonus,
                                    'userbalance.winning': winning + leaugestransaction.winning,
                                };
                               
                                let transaction_id = `${constant.APP_SHORT_NAME}-${Date.now()}-${randomStr}`;
                                let refundData = {
                                    userid: leaugestransaction.user_id,
                                    amount: getMatchContestData.entryfee,
                                    joinid: league._id,
                                    stockquizId: league.stockquizId,
                                    reason: 'cancel stock quiz',
                                    transaction_id: transaction_id
                                };
                               
                                const transactiondata = {
                                    type: 'Refund',
                                    amount: getMatchContestData.entryfee,
                                    total_available_amt: totalBalance + getMatchContestData.entryfee,
                                    transaction_by: constant.APP_SHORT_NAME,
                                    stockquizId: getMatchContestData._id,
                                    userid: leaugestransaction.user_id,
                                    paymentstatus: constant.PAYMENT_STATUS_TYPES.CONFIRMED,
                                    bal_bonus_amt: bonus + leaugestransaction.bonus,
                                    bal_win_amt: winning + leaugestransaction.winning,
                                    bal_fund_amt: balance + leaugestransaction.balance,
                                    bonus_amt: leaugestransaction.bonus,
                                    win_amt: leaugestransaction.winning,
                                    addfund_amt: leaugestransaction.balance,
                                    transaction_id: transaction_id
                                };
                               
                                let profmiss =await Promise.all([
                                    userModel.findOneAndUpdate({ _id: leaugestransaction.user_id }, userObj, { new: true }),
                                    refundMatchModel.create(refundData),
                                    TransactionModel.create(transactiondata)
                                ]);
                             
                            }
                        }
                    }
                }
                const getMatchContestData1 = await stockQuizModel.updateOne({ _id: req.params.stockquizId }, {
                    $set: {
                        // quiz_status: constant.MATCH_CHALLENGE_STATUS.CANCELED
                        final_status: req.query.status
                    }
                });
                
              } 
             }
            }
            // const updateMatchCancel = await listMatchesModel.updateOne({_id:req.query.matchkey},{
            //     $set:{
            //         quiz_status:req.query.status
            //     }
            // })
          
            return{
                status:true,
                message:'stock quiz cancel successfully'
            }

        }catch(error){
            console.log(error)
        }
    }

    async stockquizviewtransactions(req) {
        try {
            const findTransactions = await TransactionModel.findOne({ userid: req.params.id });
            if (findTransactions) {
                return {
                    status: true,
                    data: findTransactions,
                }
            }
        } catch (error) {
           throw error;
        }
    }

    async updateResultOfStocksQuiz(req) {
        try {
          console.log('punit______+++++++++');
          const currentDate = moment().subtract(2, 'days').format('YYYY-MM-DD 00:00:00');
          let newData;
          const listContest = await stockQuizModel.find({
            start_date: { $gte: currentDate },
            is_enabled: true,
            final_status: { $nin: ['winnerdeclared', 'IsCanceled'] },
            status: { $ne: 'completed' }
          });
          if (listContest.length > 0) {
            for (let index of listContest) {
              let stockQuizTimings = index.start_date;
              const currentDate1 = moment().format('YYYY-MM-DD+HH:mm:ss');
              if (currentDate1 >= stockQuizTimings) {
                const result = await this.getStockQuizUpdates(listContest);
                await Promise.all(result.map(async (ele) => {
                  const insertData = {
                    userId: ele.userid,
                    stockquizId: ele.stockquizId,
                    joinId: ele._id,
                  };
                  const startDate = ele.start_date;
                  const formattedDate = moment(startDate, 'YYYY/MM/DD HH:mm').format('YYYY-MM-DD+HH:mm:ss');
                  const dateFormat = moment().format('YYYY/MM/DD HH:mm');
                  let matchStatus = {};
                  if (dateFormat >= ele.start_date) {
                    matchStatus['status'] = 'started';
                    matchStatus['final_status'] = 'IsReviewed';
                  }
                //   await stockContestModel.findByIdAndUpdate({_id:ele.contestId}, matchStatus);
                
                  const chkSave = await stockQuizModel.findOneAndUpdate({ _id: ele.stockquizId }, matchStatus, { upsert: true });
                  let total = 0;

                  newData = await stockQuizFinalResult.findOneAndUpdate(
                    { userId: ele.userid, stockquizId: ele.stockquizId },
                    insertData,
                    { upsert: true }
                  );
                }));
              }
    
            }
          }
    
          return {
            "message": "Stock Quiz League Data",
            data: newData || {}
          };
    
        } catch (error) {
          console.log(error);
          throw error;
        }
    }

    async getStockQuizUpdates(listContest) {
        try {
          const currentDate = moment().subtract(2, 'days').format('YYYY-MM-DD 00:00:00');
          const stockQuizleaugeData = await StockQuizJoinLeaugeModel.aggregate([
            {
                '$lookup': {
                    'from': 'stockquizzes', 
                    'localField': 'stockquizId', 
                    'foreignField': '_id', 
                    'as': 'stockQuizData'
                }
            }, {
                '$match': {
                    'stockQuizData': {
                        '$elemMatch': {
                            'is_enabled': true, 
                            'final_status': {
                                '$nin': [
                                    'winnerdeclared', 'IsCanceled'
                                ]
                            }, 
                            'status': {
                                '$ne': 'completed'
                            }, 
                            'start_date': {
                                '$gte': currentDate
                            }
                        }
                    }
                }
            }, {
                '$group': {
                    '_id': '$_id', 
                    'transaction_id': {
                        '$first': '$transaction_id'
                    }, 
                    'userid': {
                        '$first': '$userid'
                    }, 
                    'stockquizId': {
                        '$first': '$stockquizId'
                    }, 
                    'stockQuizData': {
                        '$first': '$stockQuizData'
                    }
                }
            }, {
                '$addFields': {
                    'start_date': {
                        '$getField': {
                            'field': 'start_date', 
                            'input': {
                                '$arrayElemAt': [
                                    '$stockQuizData', 0
                                ]
                            }
                        }
                    }, 
                    'end_date': {
                        '$getField': {
                            'field': 'end_date', 
                            'input': {
                                '$arrayElemAt': [
                                    '$stockQuizData', 0
                                ]
                            }
                        }
                    }
                }
            }
        ]);
    
          return stockQuizleaugeData;
        } catch (error) {
          console.log("error" + error);
          throw error;
        }
    }
}
module.exports = new StockquizServices();