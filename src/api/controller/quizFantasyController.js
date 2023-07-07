const moment = require('moment')
const matchServices = require('../services/matchServices');
const listMatchesModel = require('../../models/listMatchesModel');
const quizfantasyServices = require('../services/quizFantasyServices');
const contestservices = require("../services/contestServices")
class QuizController {
    constructor() {
        return {
            
           
            getQuiz:this.getQuiz.bind(this),
            getSingleQuiz:this.getSingleQuiz.bind(this),
            quizGiveAnswer:this.quizGiveAnswer.bind(this),
            quizgetUsableBalance:this.quizgetUsableBalance.bind(this),
            joinQuiz:this.joinQuiz.bind(this),
            quizAnswerMatch: this.quizAnswerMatch.bind(this),
        }
    }

    async getQuiz(req, res, next) {
        try {
            const data = await quizfantasyServices.getQuiz(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: true }, data));
            } else {
                return res.status(200).json(Object.assign({ success: true }, data));
            }
        } catch (error) {
            next(error);
        }
    }

    async getSingleQuiz(req, res, next) {
        try {
            const data = await quizfantasyServices.getSingleQuiz(req);
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
    async quizgetUsableBalance(req, res, next) {
        try {
            const data = await quizfantasyServices.quizgetUsableBalance(req);
            return res.status(200).json(Object.assign({ success: true }, data));
        } catch (error) {
            next(error);
        }
    }
    async joinQuiz(req, res, next) {
        try {
            const data = await quizfantasyServices.joinQuiz(req);
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
}
module.exports = new QuizController();