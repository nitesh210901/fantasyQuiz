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