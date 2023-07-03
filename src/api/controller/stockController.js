const moment = require('moment');
const convertCsv =  require('csvtojson');
const stockModel = require('../../models/stockModel');
const stockContestService = require("../services/stockContestService");
const axios = require('axios');

class stockController {

    constructor() {

        return {
            stockCreateTeam: this.stockCreateTeam.bind(this),
            listStockContest: this.listStockContest.bind(this),
            stockJoinContest: this.stockJoinContest.bind(this),
            getStockContestCategory: this.getStockContestCategory.bind(this),
            getAllNewStock: this.getAllNewStock.bind(this),
            getStockCategory: this.getStockCategory.bind(this),
            getStockAccordingCategory: this.getStockAccordingCategory.bind(this),
            myJoinedStockContests: this.myJoinedStockContests.bind(this),
            getSingleContestDetails: this.getSingleContestDetails.bind(this),
            viewStockTeam: this.viewStockTeam.bind(this),
            completeContest: this.completeContest.bind(this),
            getStockMyTeams: this.getStockMyTeams.bind(this),
            myContestleaderboard: this.myContestleaderboard.bind(this),
            getAllStockWithAllSelector: this.getAllStockWithAllSelector.bind(this),
            liveStockRanksLeaderboard: this.liveStockRanksLeaderboard.bind(this),
            getStockUsableBalance: this.getStockUsableBalance.bind(this),
            Newjoinedcontest: this.Newjoinedcontest.bind(this),
            NewjoinedcontestLive: this.NewjoinedcontestLive.bind(this),
            AllCompletedContest: this.AllCompletedContest.bind(this),
            getStockContest: this.getStockContest.bind(this),
            rankUpdateInMatch1: this.rankUpdateInMatch1.bind(this),

        }
    }

   

    async listStockContest (req, res){
        try {
            const data = await stockContestService.listStockContest(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: true }, data));
            } else {
                return res.status(200).json(Object.assign(
            {   message: 'All Contest Data',
                status: true,
                data:data
            }))
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
    async getAllStockWithAllSelector(req, res){
        try {
            const data = await stockContestService.getAllStockWithAllSelector(req);
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

    async getSingleContestDetails(req, res, next) {
        try {
            const data = await stockContestService.getSingleContestDetails(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: true }, data));
            } else {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            }
        } catch (error) {
            next(error);
        }
    }

    async viewStockTeam(req, res, next) {
        try {
            const data = await stockContestService.viewStockTeam(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            } else {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            }
        } catch (error) {
            next(error);
        }
    }

    async completeContest(req, res, next) {
        try {
            const data = await stockContestService.completeContest(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            } else {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            }
        } catch (error) {
            next(error);
        }
    }


    
    async myContestleaderboard(req, res, next) {
        try {
            const data = await stockContestService.myContestleaderboard(req);
            return res.status(200).json(Object.assign({ success: true }, data));
        } catch (error) {
            next(error);
        }
    }

    


   
    
    async liveStockRanksLeaderboard(req, res, next) {
        try {
            const data = await stockContestService.liveStockRanksLeaderboard(req);
            return res.status(200).json(Object.assign({ success: true }, data));
        } catch (error) {
            next(error);
        }
    }

    async getStockUsableBalance(req, res, next) {
        try {
            // console.log(`here`, req.user._id);
            const data = await stockContestService.getStockUsableBalance(req);
            return res.status(200).json(Object.assign({ success: true }, data));
        } catch (error) {
            next(error);
        }
    }


    async Newjoinedcontest(req, res, next) {
        try {
            const data = await stockContestService.Newjoinedcontest(req);
            return res.status(200).json(Object.assign({ success: true }, data));
        } catch (error) {
            console.log(error);
        }
    }

    async NewjoinedcontestLive(req,res,next){
        try{
            const data = await stockContestService.NewjoinedcontestLive(req);
            return res.status(200).json(Object.assign({ success: true }, data));

        }catch(error){
            next(error);
        }
    }

    async AllCompletedContest(req, res, next) {
        try {
            const data = await stockContestService.AllCompletedContest(req);
            return res.status(200).json(Object.assign({ success: true }, data));
        } catch (error) {
            next(error);
        }
    }

    async getStockContest(req, res, next) {
        try {
            const data = await stockContestService.getStockContest(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: true }, data));
            } else {
                return res.status(200).json(Object.assign({ success: true }, data));
            }
        } catch (error) {
            next(error);
        }
    }
       
    async rankUpdateInMatch1(req, res, next) {
        try {
            const data = await stockContestService.rankUpdateInMatch1(req);
            return res.status(200).json(Object.assign({ success: true }, data));
        } catch (error) {
            next(error);
        }
    }
}
module.exports = new stockController();