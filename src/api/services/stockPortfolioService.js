const mongoose = require('mongoose');
const stockModel = require('../../models/stockModel');
const myPortfolioModel = require('../../models/myPortfolioModel');

class stockPortfolioServices {
    constructor() {
        return {

            getStocklistInPortfolio: this.getStocklistInPortfolio.bind(this),
            createPortfolio: this.createPortfolio.bind(this),
            updatePortfolio: this.updatePortfolio.bind(this),
            deletePortfolio: this.deletePortfolio.bind(this),
            myPortfolioData: this.myPortfolioData.bind(this)

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
            const existingPortfolio = await myPortfolioModel.findOne({ portfolioCat});
             if (existingPortfolio) {
                let data = await myPortfolioModel.findOneAndUpdate({ portfolioCat }, { stocks },{new:true});
                return {
                    status:true,
                    message: 'portfolio updated successfully',
                    data:data
                }
            } else {
                let data = await myPortfolioModel.create({stocks,portfolioCat,userId})
             return{
                status:true,
                message: 'portfolio created successfully',
                data:data
            }
        }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async updatePortfolio(req){
        try {
            const { stocks, portfolioCat} = req.body;
            let userId = req.user._id
            const existingPortfolio = await myPortfolioModel.findOne({ portfolioCat});

            if (existingPortfolio) {
                await myPortfolioModel.findOneAndUpdate({portfolioCat},{stocks});
                return {
                    status: true,
                    message: 'portfolio updated successfully'
                }
            } else {
                return {
                    message: 'No Portfolio found for this Category.',
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

    async myPortfolioData(req){
        try {
            const { portfolioCat } = req.query;
            let aggPipe = [{
                '$match': {
                  'portfolioCat': portfolioCat
                }
              }, {
                '$lookup': {
                  'from': 'stocks', 
                  'let': {
                    'id': '$stocks'
                  }, 
                  'pipeline': [
                    {
                      '$match': {
                        '$expr': {
                          '$in': [
                            '$_id', '$$id'
                          ]
                        }
                      }
                    }
                  ], 
                  'as': 'stocks'
                }
              }, {
                '$unwind': {
                  'path': '$stocks', 
                  'preserveNullAndEmptyArrays': true
                }
              }, {
                '$replaceRoot': {
                  'newRoot': '$stocks'
                }
              }];
            const data = await myPortfolioModel.aggregate(aggPipe);
            if (data.length === 0) {
                return {
                    status: false,
                    message:"Portfolio is empty",
                }
            }
            return{
                status:true,
                message: 'Portfolio Listing',
                data: data
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
}

module.exports = new stockPortfolioServices();