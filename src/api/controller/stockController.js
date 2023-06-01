const moment = require('moment')
const matchServices = require('../services/matchServices');
const listMatchesModel = require('../../models/listMatchesModel');
const quizfantasyServices = require('../services/quizFantasyServices');
const stockContestService = require("../services/stockContestService")
class matchController {
    constructor() {

        return {
            stockCreateTeam: this.stockCreateTeam.bind(this),
        }
    }

 
    async stockCreateTeam(req, res) {
        try {
            const data = await stockContestService.stockCreateTeam(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: true }, data));
            } else {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            }
          } catch (error) {
            console.log('error',error);
         }
    }
}
module.exports = new matchController();