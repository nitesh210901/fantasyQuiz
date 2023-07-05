const mongoose = require('mongoose');
const stockModel = require('../../models/stockModel');
const myPortfolioModel = require('../../models/myPortfolioModel');

class stockPortfolioServices {
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
            let aggPipe = [];
            if (stockCat === 'STOCKS') {
                aggPipe.push({
                    $match: {
                        type:{
                            $in:["NSE","BSE"]
                        },
                        isEnable:true
                    }
                })
            } else {
                aggPipe.push({
                    $match: {
                        type:stockCat,
                        isEnable:true,
                    },
                })
            }
            const data = await stockModel.aggregate(aggPipe);
            if (data.length === 0) {
                return {
                    status: false,
                    message:"stock listing not found in portfolio",
                }
            }
            return{
                status:true,
                message: 'stock listing in portfolio',
                data: data
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
  
    async createPortfolio(req){
        try {
            const { stocks, portfolioCat } = req.body;
            const userId = req.user._id;
            if (stocks.length === 0) {
                return {
                    status: false,
                    message:"stock not found in portfolio"
                }
            }
            const existingPortfolio = await myPortfolioModel.findOne({ userId ,portfolioCat});
            if (existingPortfolio) {
            return {
                message: 'Portfolio already exists for this user.',
                status: true,
                data: [],
            };
            } else {
                stocks.map(async (stock) => {
                  await myPortfolioModel.insertMany({stockId:stock,portfolioCat,userId})
                })
            return{
                status:true,
                message: 'portfolio created successfully',
            }
        }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async updatePortfolio(req){
        try {
            const { _id ,stockId,portfolioCat} = req.body;
            let userId = req.user._id
            const existingPortfolio = await myPortfolioModel.findOne({ _id});

            if (existingPortfolio) {
                await myPortfolioModel.findOneAndUpdate({_id},{stockId,portfolioCat});
    
                return {
                    status: true,
                    message: 'portfolio updated successfully'
                }
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
            const {id } = req.query;
            const deletedPortfolio = await myPortfolioModel.findOneAndDelete({ _id: id })
            return {
                status: true,
                message:"Portfolio deleted"
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
}

module.exports = new stockPortfolioServices();