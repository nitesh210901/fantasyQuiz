const mongoose=require("mongoose");
const stockContestService = require('../services/stockPortfolioService');
const stockContestModel = require('../../models/stockContestModel');
const stockCategoryModel = require("../../models/stockcategoryModel")
const stockContestCategoryModel = require('../../models/stockContestCategory');
const joinStockLeagueModel    = require("../../models/joinStockLeagueModel")
const TransactionModel    = require("../../models/transactionModel")
class stockPortfolioController {
    constructor() {
        return {
            getStocklistInPortfolio: this.getStocklistInPortfolio.bind(this),
            createPortfolio: this.createPortfolio.bind(this),
            updatePortfolio: this.updatePortfolio.bind(this),
            deletePortfolio: this.deletePortfolio.bind(this)
        }
    }
   
    async getStocklistInPortfolio(req, res, next) {
        try {
            const data = await stockContestService.getStocklistInPortfolio(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: true }, data));
            } else {
                return res.status(200).json(Object.assign({ success: true }, data));
            }
        } catch (error) {
            next(error);
        }
    }

    async createPortfolio(req, res, next) {
        try {
            const data = await stockContestService.createPortfolio(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: true }, data));
            } else {
                return res.status(200).json(Object.assign({ success: true }, data));
            }
        } catch (error) {
            next(error);
        }
    }

    async updatePortfolio(req, res, next) {
        try {
            const data = await stockContestService.updatePortfolio(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: true }, data));
            } else {
                return res.status(200).json(Object.assign({ success: true }, data));
            }
        } catch (error) {
            next(error);
        }
    }

    async deletePortfolio(req, res, next) {
        try {
            const data = await stockContestService.deletePortfolio(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: true }, data));
            } else {
                return res.status(200).json(Object.assign({ success: true }, data));
            }
        } catch (error) {
            next(error);
        }
    }
}
module.exports = new stockPortfolioController();