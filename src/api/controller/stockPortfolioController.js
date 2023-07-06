const mongoose=require("mongoose");
const stockPortfolioService = require('../services/stockPortfolioService');
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
            deletePortfolio: this.deletePortfolio.bind(this),
            myPortfolioData: this.myPortfolioData.bind(this),
        }
    }
   
    async getStocklistInPortfolio(req, res, next) {
        try {
            const data = await stockPortfolioService.getStocklistInPortfolio(req);
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
            const data = await stockPortfolioService.createPortfolio(req);
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
            const data = await stockPortfolioService.updatePortfolio(req);
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
            const data = await stockPortfolioService.deletePortfolio(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: true }, data));
            } else {
                return res.status(200).json(Object.assign({ success: true }, data));
            }
        } catch (error) {
            next(error);
        }
    }

    async myPortfolioData(req, res, next) {
        try {
            const data = await stockPortfolioService.myPortfolioData(req);
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