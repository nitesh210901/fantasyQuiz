const mongoose = require('mongoose');
const moment = require("moment");

const quizModel = require('../../models/quizModel');
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
class quizServices {
    constructor() {
        return {
            AddQuiz: this.AddQuiz.bind(this),
            QuizGIveAnswer: this.QuizGIveAnswer.bind(this),
            editQuizData: this.editQuizData.bind(this),
            editQuiz: this.editQuiz.bind(this),
            deletequiz: this.deletequiz.bind(this),
            quizRefundAmount: this.quizRefundAmount.bind(this),
            quizrefundprocess: this.quizrefundprocess.bind(this),
            cancelQuiz: this.cancelQuiz.bind(this),
            quizdistributeWinningAmountWithAnswerMatch: this.quizdistributeWinningAmountWithAnswerMatch.bind(this),
            viewtransactions: this.viewtransactions.bind(this),
            quizallRefundAmount: this.quizallRefundAmount.bind(this)
        }
    }

    async AddQuiz(req) {
        try {
            if(req.fileValidationError){
                return{
                    status:false,
                    message:req.fileValidationError
                }

            }
            let { matchkey, question, options, answer, entryfee, winning_amount, bonus_percentage ,is_bonus} = req.body
            let option = []
            let opt = {}
            if (options.length > 0) {
                for (let i = 0; i < options.length; i++) {
                    opt[`option_${i+1}`] = options[i]
                }
            }
            option.push(opt)
            let image;
            if (req.file) {
                image = `/${req.body.typename}/${req.file.filename}`;
            }
            let addquiz = new quizModel({
                matchkey: matchkey,
                question: question,
                options: option,
                answer: answer,
                entryfee: entryfee,
                winning_amount: winning_amount * entryfee,
                is_bonus:is_bonus,
                bonus_percentage: bonus_percentage,
                image: image,
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
        if(req.fileValidationError){
            return{
                status:false,
                message:req.fileValidationError
            }

        }
        let image = `/${req.body.typename}/${req.file?.filename}` || "";
        let { matchkey, question, options, answer, entryfee, winning_amount, bonus_percentage, is_bonus } = req.body
        console.log(is_bonus,"pppp",bonus_percentage)
            let option = []
            let opt = {}
            if (options.length > 0) {
                for (let i = 0; i < options.length; i++) {
                    opt[`option_${i+1}`] = options[i]
                }
             }
        option.push(opt)
           let doc
            if (req.file) {
                 doc = {
                    matchkey: matchkey,
                    question: question,
                    options: option,
                    answer: answer,
                    entryfee: entryfee,
                    winning_amount: winning_amount * entryfee,
                     is_bonus:is_bonus,
                    bonus_percentage: bonus_percentage,
                    image: image
                }
            } else {
                 doc = {
                    matchkey: matchkey,
                    question: question,
                    options: option,
                    answer: answer,
                    entryfee: entryfee,
                    winning_amount: winning_amount * entryfee,
                    is_bonus:is_bonus,
                    bonus_percentage: bonus_percentage
                }
            }
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

    async quizdistributeWinningAmountWithAnswerMatch(req) {
        try {
            let { id, status } = req.params;
            let joinData = await QuizJoinLeaugeModel.find({ matchkey: id })
            let quizData = await quizModel.find({ matchkey: id })
            if (joinData.length == 0) {
                return {
                    message: "Quiz Answer Not Found",
                    status: false,
                    data: {}
                }
            }
            if (quizData.length == 0) {
                return {
                    message: " Quiz not found",
                    status: false,
                    data: {}
                }
            }
            let data;
            if (joinData.length > 0 && quizData.length > 0) {
                for (let join_data of joinData) {
                    for (let quiz_data of quizData) {
                        if (quiz_data._id.toString() === join_data.quizId.toString() && quiz_data.matchkey.toString() === join_data.matchkey.toString()) {
                            let keys = Object.keys(quiz_data.options[0])
                            for (let res of keys) {
                                if (res === quiz_data.answer) {
                                    if (quiz_data.options[0][res] === join_data.answer) {
                                        const user = await userModel.findOne({ _id: join_data.userid }, { userbalance: 1, totalwinning: 1 });
                                        data = await QuizJoinLeaugeModel.findOneAndUpdate({ matchkey: join_data.matchkey, quizId: join_data.quizId ,userid:join_data.userid}, { winamount: quiz_data.winning_amount }, { new: true })
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
                                            'userbalance.winning': winning + quiz_data.winning_amount,
                                            'totalwinning': totalwinning + quiz_data.winning_amount
                                        };
                                        const transactiondata = {
                                            type: 'Quiz Winning Amount',
                                            amount: quiz_data.winning_amount,
                                            total_available_amt: totalBalance + quiz_data.winning_amount,
                                            transaction_by: constant.APP_SHORT_NAME,
                                            quizId: join_data.quizId,
                                            userid: join_data.userid,
                                            paymentstatus: constant.PAYMENT_STATUS_TYPES.CONFIRMED,
                                            bal_bonus_amt: bonus,
                                            bal_win_amt: winning + quiz_data.winning_amount,
                                            bal_fund_amt: balance,
                                            win_amt: quiz_data.winning_amount,
                                            transaction_id: transactionidsave
                                        }
                                          
                                        let finalResult = {
                                            userid: join_data.userid,
                                            amount: quiz_data.winning_amount,
                                            matchkey: join_data.matchkey,
                                            quizId: join_data.quizId,
                                            seriesid: join_data.seriesid,
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
                                            quizModel.findOneAndUpdate({ _id:join_data.quizId},{quiz_status:status},{new:true}),
                                            userModel.findOneAndUpdate({ _id: join_data.userid }, userObj, { new: true }),
                                            TransactionModel.create(transactiondata),
                                        ])
                                    }
                                }
                            }
                        }
                    }
                }
                return {
                    message: "Quiz Amount distribute successfully",
                    status: true,
                    data: joinData
                }
            }
        
        }catch(error){
            throw error;
        }
    }

    async quizallRefundAmount(req, reason) {
        console.log("-------------------------------------quizallRefundAmount-------------------------")
        let { id, status } = req.params;
        let quizData = await quizModel.find({ matchkey: mongoose.Types.ObjectId(id) });
        if (quizData.length > 0) {
            for (let quiz of quizData) {
                let getresponse = await this.quizrefundprocess(quiz._id, quiz.entryfee, id, reason);
                if (getresponse == true) {
                    await quizModel.updateOne({ _id: mongoose.Types.ObjectId(quiz._id) }, {
                        $set: {
                            quiz_status: 'canceled'
                        }
                    });
                }
            }
        }
    }

    async QuizGIveAnswer(req) {
        try {
            let { answer } = req.body
            let _id = req.params.id;
            let data = await quizModel.findOneAndUpdate({ _id },{answer:answer},{new:true});
            if (!data) {
                return {
                    status:false,
                    message:'quiz not found'
                } 
            }
            return {
                status:true,
                message: 'quiz answer update successfully',
                data:data
            }
        } catch (error) {
            throw error;
        }
    }

    async quizrefundprocess(quizId, entryfee, matchkey, reason) {
        console.log("-------------------------------------quizrefundprocess-----------------------------")
        let joinLeagues = await QuizJoinLeaugeModel.find({
            matchkey: mongoose.Types.ObjectId(matchkey),
            quizId: mongoose.Types.ObjectId(quizId),
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
                            quizId: league.quizId,
                            matchkey: matchkey,
                            reason: reason,
                            transaction_id: transaction_id
                        };
                        const transactiondata = {
                            type: 'Quiz Refund',
                            amount: entryfee,
                            total_available_amt: totalBalance + entryfee,
                            transaction_by: constant.APP_SHORT_NAME,
                            quizId: quizId,
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
                if (match.quizData.length > 0) {
                    for (let value1 of match.quizData) {
                        let data = {};
                        
                        let getresponse = await this.quizrefundprocess(value1._id, value1.entryfee, match._id, 'quiz cancel');
                        if (getresponse == true) {
                            await quizModel.updateOne({ _id: mongoose.Types.ObjectId(value1._id) }, {
                                $set: {
                                    status: 'canceled'
                                }
                            });
                        }
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
            const matchContest= await quizModel.find({matchkey:req.query.matchkey});
            if(matchContest.length > 0){
                for await(let key of matchContest){
                    req.params.quizId=key._id
                  
                    const getMatchContestData = await quizModel.findOne({ _id: req.params.quizId,matchkey:req.query.matchkey});
           
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
                const getMatchContestData1 = await quizModel.updateOne({ _id: req.params.quizId }, {
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
}
module.exports = new quizServices();