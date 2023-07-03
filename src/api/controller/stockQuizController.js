const moment = require('moment')
const matchServices = require('../services/matchServices');
const listMatchesModel = require('../../models/listMatchesModel');
const stockQuizService = require('../services/stockQuizServices');
const contestservices = require("../services/contestServices")
class stockQuizController {
    constructor() {
        return {
            
            getStockQuiz:this.getStockQuiz.bind(this),
            getStockSingleQuiz:this.getStockSingleQuiz.bind(this),
            quizGiveAnswer:this.quizGiveAnswer.bind(this),
            stockquizgetUsableBalance:this.stockquizgetUsableBalance.bind(this),
            joinStockQuiz:this.joinStockQuiz.bind(this),
            quizAnswerMatch: this.quizAnswerMatch.bind(this),
            NewjoinedStockQuiz: this.NewjoinedStockQuiz.bind(this),
            NewjoinedStockQuizLive: this.NewjoinedStockQuizLive.bind(this),
            AllCompletedStockQuiz: this.AllCompletedStockQuiz.bind(this),

        }
    }

    async getStockQuiz(req, res, next) {
        try {
            const data = await stockQuizService.getStockQuiz(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: true }, data));
            } else {
                return res.status(200).json(Object.assign({ success: true }, data));
            }
        } catch (error) {
            next(error);
        }
    }

    async getStockSingleQuiz(req, res, next) {
        try {
            const data = await stockQuizService.getStockSingleQuiz(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: true }, data));
            } else {
                return res.status(200).json(Object.assign({ success: true }, data));
            }
        } catch (error) {
            next(error);
        }
    }
    async quizGiveAnswer(req, res, next) {
        try {
            const data = await quizfantasyServices.quizGiveAnswer(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: true }, data));
            } else {
                return res.status(200).json(Object.assign({ success: true }, data));
            }
        } catch (error) {
            next(error);
        }
    }

    async quizAnswerMatch(req, res, next) {
        try {
            const currentDate = moment().format('YYYY-MM-DD 00:00:00');
            const listmatches = await listMatchesModel.find({
                fantasy_type: "Cricket",
                start_date: { $gte: currentDate },
                launch_status: 'launched',
                final_status: { $nin: ['winnerdeclared','IsCanceled'] },
                status: { $ne: 'completed' },
            })
            let data;
            if (listmatches.length > 0) {
                for (let index of listmatches) {
                    let matchkey = index._id
                    // let userId = req.user._id
                     data = await quizfantasyServices.quizAnswerMatch(matchkey);
                }
            }
            if (data) {
                if (data.status === false) {
                    return res.status(200).json(Object.assign({ success: true }, data));
                } else {
                    return res.status(200).json(Object.assign({ success: data.status }, data));
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    async stockquizgetUsableBalance(req, res, next) {
        try {
            const data = await stockQuizService.stockquizgetUsableBalance(req);
            return res.status(200).json(Object.assign({ success: true }, data));
        } catch (error) {
            next(error);
        }
    }
    async joinStockQuiz(req, res, next) {
        try {
            const data = await stockQuizService.joinStockQuiz(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            } else {
                return res.status(200).json(Object.assign({ success: true }, data));
            }
        } catch (error) {
            console.log(error);
            next(error);
        }
    }

    async NewjoinedStockQuiz(req, res, next) {
        try {
            const data = await stockQuizService.NewjoinedStockQuiz(req);
            return res.status(200).json(Object.assign({ success: true }, data));
        } catch (error) {
            console.log(error);
        }
    }
    async NewjoinedStockQuizLive(req,res,next){
        try{
            const data = await stockQuizService.NewjoinedStockQuizLive(req);
            return res.status(200).json(Object.assign({ success: true }, data));

        }catch(error){
            next(error);
        }
    }
    async AllCompletedStockQuiz(req, res, next) {
        try {
            const data = await stockQuizService.AllCompletedStockQuiz(req);
            return res.status(200).json(Object.assign({ success: true }, data));
        } catch (error) {
            next(error);
        }
    }
}
module.exports = new stockQuizController();