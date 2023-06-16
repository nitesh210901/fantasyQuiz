const moment = require('moment');
const convertCsv =  require('csvtojson');
const stockModel = require('../../models/stockModel');
const stockContestService = require("../services/stockContestService");
const axios = require('axios');

class matchController {

    constructor() {

        return {
            stockCreateTeam: this.stockCreateTeam.bind(this),
            listStockContest: this.listStockContest.bind(this),
            stockJoinContest: this.stockJoinContest.bind(this),
            getStockContestCategory: this.getStockContestCategory.bind(this),
            saveStocks: this.saveStocks.bind(this),
            getAllNewStock: this.getAllNewStock.bind(this),
            getStockCategory: this.getStockCategory.bind(this),
            getStockAccordingCategory: this.getStockAccordingCategory.bind(this),
            myJoinedStockContests: this.myJoinedStockContests.bind(this),
            getStockMyTeams: this.getStockMyTeams.bind(this),
            myStockLeaderboard: this.myStockLeaderboard.bind(this),
        }
    }

    async saveStocks(req, res, next){
        try {
            let stockdata = await axios.get(`https://api.kite.trade/instruments`);
            const data = await convertCsv().fromString(stockdata.data);
            let arr = [];
            for(let i of data){
                if(i.exchange === 'NSE' || i.exchange === 'MCX'){
                    i['type'] = i.exchange;
                    arr.push(stockModel.updateOne(
                    { instrument_token: i.instrument_token },
                    { $set: i },
                    { upsert: true }));
                }
            }
            Promise.allSettled(arr).then((values) => {
                return res.status(200).json(Object.assign({ success: true }));
            });
              return res.status(200).json(Object.assign({ success: true }, data));
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async listStockContest (req, res){
        try {
            const data = await stockContestService.listStockContest(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: true }, data));
            } else {
                return res.status(200).json(Object.assign({ success: true }, data));
            }
        } catch (error) {
            console.log(error);
            throw error;
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

    async stockJoinContest(req, res){
        try {
            const data = await stockContestService.stockJoinContest(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: true }, data));
            } else {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async getStockContestCategory(req, res){
        try {
            const data = await stockContestService.getStockContestCategory(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: true }, data));
            } else {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async getAllNewStock(req, res, next) {
        try {
            const data = await stockContestService.getAllNewStock(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: true }, data));
            } else {
                return res.status(200).json(Object.assign({ success: true }, data));
            }
        } catch (error) {
            next(error);
        }
    }

    async getStockCategory(req, res){
        try {
            const data = await stockContestService.getStockCategory(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: true }, data));
            } else {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async getStockAccordingCategory(req, res){
        try {
            const data = await stockContestService.getStockAccordingCategory(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: true }, data));
            } else {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
    async myJoinedStockContests(req, res, next) {
        try {
            const data = await stockContestService.myJoinedStockContests(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            } else {
                return res.status(200).json(Object.assign({ success: true }, data));
            }
        } catch (error) {
            next(error);
        }
    }
    async getStockMyTeams(req, res, next) {
        try {
            const data = await stockContestService.getStockMyTeams(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: true }, data));
            } else {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            }
        } catch (error) {
            next(error);
        }
    }
    async myStockLeaderboard(req, res, next) {
        try {
            const data = await stockContestService.myStockLeaderboard(req);
            return res.status(200).json(Object.assign({ success: true }, data));
        } catch (error) {
            next(error);
        }
    }
}
module.exports = new matchController();