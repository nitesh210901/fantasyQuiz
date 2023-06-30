const mongoose = require('mongoose');
const stockModel = require('../../models/stockModel');
const myPortfolioModel = require('../../models/myPortfolioModel');

class overfantasyServices {
    constructor() {
        return {

            getStocklistInPortfolio: this.getStocklistInPortfolio.bind(this),
            createPortfolio: this.createPortfolio.bind(this),
            updatePortfolio: this.updatePortfolio.bind(this),
            deletePortfolio: this.deletePortfolio.bind(this)

        }
    }

    async getStocklistInPortfolio(req){
        try {
            const { stockCat } = req.query;
            const aggPipe = [];

            if(stockCat === 'STOCKS'){
                aggPipe.push({
                    $match: {
                        type:{
                            $in:["NSE","BSE"]
                        },
                        isEnable:true
                    }
                })
            }else{
                aggPipe.push({
                    $match: {
                        type:stockCat
                    },
                    isEnable:true,
                })
            }
            const data = await stockModel.aggregate(aggPipe);
            return data;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
  
    async createPortfolio(req){
        try {
            const { stock, userid, portfolioCat } = req;
            const existingPortfolio = await myPortfolioModel.findOne({ userid });

            if (existingPortfolio) {
            return {
                message: 'Portfolio already exists for this user.',
                status: true,
                data: [],
            };
            } else {
            const updatedPortfolio = new myPortfolioModel({
                stock,
                userid,
                portfolioCat,
            });

            await updatedPortfolio.save();

            return updatedPortfolio;
        }

        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async updatePortfolio(req){
        try {
            const { stock, userid, portfolioCat } = req;
            const existingPortfolio = await myPortfolioModel.findOne({ userid, portfolioCat});

            if (existingPortfolio) {
                
                await myPortfolioModel.findOneAndUpdate({userid, portfolioCat}, req.body);
    
                return myPortfolioModel;
            } else {
                return {
                    message: 'No Portfolio found for this user.',
                    status: true,
                    data: [],
                };
            }

        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async deletePortfolio(req){
        try {
            const { userid, portfolioCat } = req.query;

            const deletedPortfolio = await myPortfolioModel.findOneAndDelete({ userid, portfolioCat });
            
            return deletedPortfolio;

        } catch (error) {
            console.log(error);
            throw error;
        }
    }
}

module.exports = new overfantasyServices();