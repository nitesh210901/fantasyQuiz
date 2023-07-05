const res = require('express/lib/response');
const mongoose = require('mongoose');
const axios = require('axios');

const moment = require('moment');
const randomstring = require("randomstring");
const stockContestModel = require('../../models/stockContestModel');
const stockModel = require('../../models/stockModel');
const joinStockLeagueModel = require('../../models/joinStockLeagueModel');
const stockPriceCardModel = require('../../models/stockPriceCardModel');
const contestCategoryModel = require('../../models/contestcategoryModel');
const stockFinalResult = require('../../models/stockFinalResult');
const userModel = require('../../models/userModel');
const refundMatchModel = require('../../models/refundModel');
const TransactionModel = require('../../models/transactionModel');
const constant = require('../../config/const_credential');

class challengersService {
    constructor() {
        return {
            getContest: this.getContest.bind(this),
            addStockContestData: this.addStockContestData.bind(this),
            priceCardChallengers: this.priceCardChallengers.bind(this),
            addpriceCard_Post: this.addpriceCard_Post.bind(this),
            addpricecardPostbyPercentage: this.addpricecardPostbyPercentage.bind(this),
            deletepricecard_data: this.deletepricecard_data.bind(this),
            deleteMultiStockContest: this.deleteMultiStockContest.bind(this),
            enableDisableContest: this.enableDisableContest.bind(this),
            cancelStockContest: this.cancelStockContest.bind(this),
            editStockContestPage: this.editStockContestPage.bind(this),
            editStockContestData: this.editStockContestData.bind(this),
            launchStockContest: this.launchStockContest.bind(this),
            allRefundAmount: this.allRefundAmount.bind(this),
            refundprocess: this.refundprocess.bind(this),
            distributeWinningAmount: this.distributeWinningAmount.bind(this),
            stockviewtransactions: this.stockviewtransactions.bind(this),
            cancelContestStock: this.cancelContestStock.bind(this),
            saveCurrentPriceOfStock: this.saveCurrentPriceOfStock.bind(this),
            updateResultStocks: this.updateResultStocks.bind(this),
            getSockScoresUpdates: this.getSockScoresUpdates.bind(this),
        }
    }
   
    async getContest(req) {
        try {

            const getContest = await contestCategoryModel.find({}, { name: 1 });
            if (getContest) {
                return {
                    status: true,
                    data: getContest
                }
            } else {
                return {
                    status: false,
                    message: 'data not found'
                }
            }

        } catch (error) {
            throw error;
        }
    }

    async addStockContestData(req) {
        try {
            if(req.fileValidationError){
                return{
                    status:false,
                    message:req.fileValidationError
                }

            }
            if (req.body.entryfee || req.body.entryfee == '0' && req.body.win_amount || req.body.win_amount == '0' && req.body.contest_type && req.body.contest_cat && req.body.start_date &&  req.body.start_date) {
               
                let data = {}
                
                    if (req.body.team_limit) {
                        if (Number(req.body.team_limit) == 0 || Number(req.body.team_limit) > Number(process.env.TEAM_LIMIT)) {
                            return {
                                status: false,
                                message: `Value of Team limit not equal to 0..or more then ${config.TEAM_LIMIT}.`
                            }
                        } else {
                            // data.multi_entry = 1;
                        }
                    }
                    if (req.body.maximum_user) {
                        if (req.body.maximum_user < 2) {
                            return {
                                status: false,
                                message: 'Value of maximum user not less than 2...'
                            }
                        }
                    }
                    if (req.body.winning_percentage) {
                        if (req.body.winning_percentage == 0) {
                            return {
                                status: false,
                                message: 'Value of winning percentage not equal to 0...'
                            }
                        }
                    }
                    if (req.body.bonus_percentage) {
                        if (req.body.bonus_percentage == 0) {
                            return {
                                status: false,
                                message: 'Value of bonus percentage not equal to 0...'
                            }
                        }
                    }
                    if (!req.body.bonus_percentage) {
                        data.bonus_percentage = 0
                        data.is_bonus = 0;
                    }
                    if (req.body.contest_type == 'Percentage') {
                        req.body.maximum_user = '0';
                        req.body.pricecard_type = '0';
                    }
                    if (req.body.maximum_user) {
                        data.maximum_user = req.body.maximum_user;
                    }

                    if (req.body.winning_percentage) {
                        data.winning_percentage = req.body.winning_percentage;
                    }

                    // if (req.body.confirmed_challenge) {
                    //     data.confirmed_challenge = 1;
                    // } else {
                    //     if (req.body.contest_type == 'Amount' && req.body.pricecard_type == 'Percentage') {
                    //         data.confirmed_challenge = 1;
                    //     }
                    // }

                    if (req.body.is_running) {
                        // console.log("...is_running'.. found");
                        data.is_running = 1;
                    }
                    if (req.body.is_bonus) {
                        data.is_bonus = 1;
                        data.bonus_percentage = req.body.bonus_percentage;
                    }
                    if (req.body.multi_entry) {
                        // data.multi_entry = 1;
                        // data.multi_entry = req.body.multi_entry;
                        data.team_limit = req.body.team_limit;
                   }
                    let start_date
                    if (req.body.start_date) {
                    start_date = moment(req.body.start_date, 'YYYY/MM/DD HH:mm').format('YYYY-MM-DD HH:mm:ss');
                    }
                    let end_date
                    if (req.body.end_date) {
                     end_date = moment(req.body.end_date, 'YYYY/MM/DD HH:mm').format('YYYY-MM-DD HH:mm:ss');
                }
                
                    if (req.file) {
                        data.image = `/${req.body.typename}/${req.file.filename}`;
                    }
                    data.contest_type = req.body.contest_type;
                    data.fantasy_type = req.body.stock_contest_cat;
                    data.pricecard_type = req.body.pricecard_type;
                    data.contest_cat = req.body.contest_cat;
                    data.contest_name = req.body.contest_name;
                    data.entryfee = req.body.entryfee;
                    data.fantasy_type = req.body.stock_contest_cat;
                    data.status = 'notstarted';
                    data.investment = req.body.investment;
                    data.win_amount = req.body.win_amount;
                    // data.amount_type = req.body.amount_type;
                    // data.select_team = req.body.select_team;
                    data.start_date = start_date;
                    data.end_date = end_date;
                    data.stock_contest_cat = req.body.stock_contest_cat;
                    data.stock_categoryId = req.body.stock_categoryId;
                    if (req.body.contest_type == 'Amount') {
                        data.winning_percentage = '0';
                    }


                    const insertChallengers = new stockContestModel(data);
                    const saveInsert = await insertChallengers.save();
                    if (saveInsert) {
                        return {
                            status: true,
                            renderStatus: req.body.contest_type,
                            data: saveInsert,
                            message: 'Stock Contest Created successfully'
                        };
                    }

                // }

            } else {
                return {
                    status: false,
                    message: 'please fill ..Entry Fee & win Amount & Contest Type & Contest Category '
                }
            }

        } catch (error) {
            throw error;
        }
    }


    async deleteMultiStockContest(req) {
        try {
            let { deletedId } = req.body
            for(let i of deletedId){
                const deleteChallenger = await stockContestModel.deleteOne({ _id: i });
            }
            return true ;

        } catch (error) {
            throw error;
        }
    }

    async priceCardChallengers(req) {
        try {
            console.log(req.params,"+++++++++++++=++")
            console.log("req.query,req.params..................", req.query, req.params)
            if (req.params) {
                const challenger_Details = await stockContestModel.findOne({ _id: req.params.id, is_deleted: false });
                if (challenger_Details) {
                    const check_PriceCard = await stockPriceCardModel.find({ stockcontestId: req.params.id, is_deleted: false });
                    let totalAmountForPercentage = 0;

                    if (check_PriceCard.length == 0) {
                        let position = 0;
                        return {
                            status: true,
                            challenger_Details,
                            position,
                            totalAmountForPercentage,
                            // amount_type: challenger_Details.amount_type
                        }
                    } else {

                        let lastIndexObject = (check_PriceCard.length) - 1;
                        // console.log("lastIndexObject............",lastIndexObject)
                        let lastObject = check_PriceCard[lastIndexObject];
                        // console.log("lastObject.............", lastObject)
                        let position = lastObject.max_position
                        for (let key of check_PriceCard) {
                            totalAmountForPercentage = totalAmountForPercentage + key.total
                        }
                        // console.log("position..........price card checked..",position)
                        return {
                            status: true,
                            challenger_Details,
                            position,
                            check_PriceCard,
                            totalAmountForPercentage,
                            // amount_type: challenger_Details.amount_type
                        }
                    }
                } else {
                    return {
                        status: false,
                        message: 'challenge not found..'
                    }
                }

            } else {
                return {
                    status: false,
                    message: 'Invalid request Id'
                }
            }



        } catch (error) {
            console.log(error)
            throw error;
        }
    }

    async addpriceCard_Post(req) {
        try {
            if (req.fileValidationError) {
                return {
                    status: false,
                    message: req.fileValidationError
                }
            }

            if (req.body.typename == "prize" && req.body.gift_type == "gift") {
                req.body.price = 0;
                if (!req.file || !req.body.prize_name) {
                    return {
                        status: false,
                        message: "Please Fill Prize Name && Image "
                    }
                }
            }
            if (req.body.gift_type == "amount") {
                if (req.body.price <= 0 || !req.body.price) {
                    return {
                        status: false,
                        message: 'price should not zero..'
                    }
                }
            }
            const challenger_Details = await stockContestModel.findOne({ _id: mongoose.Types.ObjectId(req.body.stockcontestId) });


            const check_PriceCard = await stockPriceCardModel.find({ stockcontestId: mongoose.Types.ObjectId(req.body.stockcontestId) });

            if (req.body.min_position && req.body.winners) {


                if (req.body.typename != "prize") {
                    if (Number(req.body.winners) == 0 || Number(req.body.price) == 0) {
                        if (req.file) {
                            let filePath = `public/${req.body.typename}/${req.file.filename}`;
                            if (fs.existsSync(filePath) == true) {
                                fs.unlinkSync(filePath);
                            }
                        }

                        return {
                            status: false,
                            message: 'winners or price can not equal to Zero'
                        }
                    }
                }

                if (check_PriceCard.length == 0) {
                    if (challenger_Details.win_amount < ((Number(req.body.winners)) * (Number(req.body.price)))) {

                        if (req.file) {
                            let filePath = `public/${req.body.typename}/${req.file.filename}`;
                            if (fs.existsSync(filePath) == true) {
                                fs.unlinkSync(filePath);
                            }
                        }

                        return {
                            status: false,
                            message: 'price should be less or equal challengers winning amount'
                        }
                    } else if (challenger_Details.maximum_user < Number(req.body.winners)) {

                        if (req.file) {
                            let filePath = `public/${req.body.typename}/${req.file.filename}`;
                            if (fs.existsSync(filePath) == true) {
                                fs.unlinkSync(filePath);
                            }
                        }
                        return {
                            status: false,
                            message: 'number of Winner should be less or equal challengers maximum user'
                        }
                    } else {
                        
                        let obj = {
                            stockcontestId: mongoose.Types.ObjectId(req.body.stockcontestId),
                            winners: Number(req.body.winners),
                            price: Number(req.body.price),
                            min_position: Number(req.body.min_position),
                            max_position: (Math.abs((Number(req.body.min_position)) - (Number(req.body.winners)))),
                            total: ((Number(req.body.winners)) * (Number(req.body.price))).toFixed(2),
                            type: 'Amount'
                        }
                        if (req.file) {
                            obj.image = `/${req.body.typename}/${req.file.filename}`,
                                obj.gift_type = "gift"
                        } else {
                            obj.gift_type = "amount"
                        }
                        if (req.body.prize_name) {
                            obj.prize_name = req.body.prize_name;
                        }
                        console.log("../////___1st >> insert..Obj.--->", obj)
                        const insertPriceData = new stockPriceCardModel(obj)

                        let savePriceData = await insertPriceData.save();
                        if (savePriceData) {
                            return {
                                status: true,
                                message: 'price Card added successfully'
                            };
                        }
                    }


                } else {

                    let lastIndexObject = (check_PriceCard.length) - 1;

                    let lastObject = check_PriceCard[lastIndexObject];

                    let position = lastObject.max_position

                    let totalAmountC = 0;
                    for (let key of check_PriceCard) {
                        totalAmountC = totalAmountC + key.total
                    }
                    if (!req.body.typename && req.body.typename != "prize") {
                        if ((totalAmountC + ((Number(req.body.price) * (Number(req.body.winners))))) > challenger_Details.win_amount) {
                            if (req.file) {
                                let filePath = `public/${req.body.typename}/${req.file.filename}`;
                                if (fs.existsSync(filePath) == true) {
                                    fs.unlinkSync(filePath);
                                }
                            }
                            return {
                                status: false,
                                message: 'price should be less or equal to challenge winning Amount'
                            }
                        }
                    }
                    if (challenger_Details.maximum_user < (position + Number(req.body.winners))) {
                        if (req.file) {
                            let filePath = `public/${req.body.typename}/${req.file.filename}`;
                            if (fs.existsSync(filePath) == true) {
                                fs.unlinkSync(filePath);
                            }
                        }
                        return {
                            status: false,
                            message: 'number of Winner should be less or equal challengers maximum user'
                        }
                    } else {
                        let obj = {
                            stockcontestId: mongoose.Types.ObjectId(req.body.stockcontestId),
                            winners: Number(req.body.winners),
                            price: Number(req.body.price),
                            min_position: position,
                            max_position: ((Number(req.body.min_position)) + (Number(req.body.winners))),
                            total: ((Number(req.body.winners)) * (Number(req.body.price))).toFixed(2),
                            type: 'Amount'
                        }
                        if (req.file) {
                            obj.image = `/${req.body.typename}/${req.file.filename}`,
                                obj.gift_type = "gift"
                        } else {
                            obj.gift_type = "amount"
                        }
                        if (req.body.prize_name) {
                            obj.prize_name = req.body.prize_name;
                        }
                        console.log("---obj insert--- 2---->>", obj)
                        const insertPriceData = new stockPriceCardModel(obj)
                        let savePriceData = await insertPriceData.save();
                        if (savePriceData) {
                            return {
                                status: true,
                                message: 'price Card added successfully'
                            };
                        }
                    }

                }

            }

        } catch (error) {
            throw error;
        }
    }

    async addpricecardPostbyPercentage(req) {
        try {

            const challenger_Details = await stockContestModel.findOne({ _id: req.body.stockcontestId });
            if (Number(req.body.price_percent) == 0 || Number(req.body.winners) == 0) {
                return {
                    status: false,
                    message: 'price percent or winners can not equal to Zero'
                }
            }
            const check_PriceCard = await stockPriceCardModel.find({ stockcontestId: req.body.stockcontestId });
            let min_position = req.body.min_position;
            let winners
            let price_percent
            let price
            if (req.body.Percentage) {
                if (req.body.user_selection == 'number') {
                    winners = Number(req.body.winners);
                    price_percent = (Number(req.body.price_percent));
                    price = ((challenger_Details.win_amount) * ((Number(req.body.price_percent)) / 100)).toFixed(2);
                    // console.log('.......in Number.EPSILON..........', winners, price_percent, price)
                } else {
                    winners = ((challenger_Details.maximum_user) * ((Number(req.body.winners)) / 100)).toFixed(2)
                    price_percent = (Number(req.body.price_percent));
                    price = ((challenger_Details.win_amount) * ((Number(req.body.price_percent)) / 100)).toFixed(2);
                    // console.log('.......in percentegae.EPSILON..........', winners, price_percent, price)
                }
            } else {
                return {
                    status: false,
                    message: 'is not Percentage'
                }
            }
            if (min_position && winners && price_percent) {
                if (winners <= 0) {
                    return {
                        status: false,
                        message: 'winner should not equal or less then zero'
                    }
                }
                if (min_position && winners && price_percent) {
                    if (check_PriceCard.length == 0) {
                        if (challenger_Details.win_amount < ((Number(winners)) * (Number(price)))) {
                            return {
                                status: false,
                                message: 'price should be less or equal challengers winning amount'
                            }
                        } else if (challenger_Details.maximum_user < Number(winners)) {
                            return {
                                status: false,
                                message: 'number of Winner should be less or equal challengers maximum user'
                            }
                        } else {
                            console.log("......insertPriceData........../////////////////////////////////////.")
                            let obj = {
                                stockcontestId: mongoose.Types.ObjectId(req.body.stockcontestId),
                                winners: (Number(winners)) || 0,
                                price: (Number(price)) || 0,
                                price_percent: (Number(price_percent)) || 0,
                                min_position: (Number(min_position)) || 0,
                                max_position: (Math.abs((Number(min_position)) - (Number(winners)))) || 0,
                                total: ((Number(winners)) * (Number(price))) || 0,
                                type: 'Amount'
                            }
                            if (req.file) {
                                obj.image = `/${req.body.typename}/${req.file.filename}`
                            }
                            const insertPriceData = new stockPriceCardModel(obj)
                            let savePriceData = await insertPriceData.save();
                            if (savePriceData) {
                                return {
                                    status: true,
                                    message: 'price Card added successfully'
                                };
                            }
                        }


                    } else {

                        let lastIndexObject = (check_PriceCard.length) - 1;
                        // console.log("lastIndexObject.........",lastIndexObject)
                        let lastObject = check_PriceCard[lastIndexObject];
                        // console.log("lastObject........",lastObject);
                        let position = lastObject.max_position

                        let totalAmountC = 0;
                        for (let key of check_PriceCard) {
                            totalAmountC = totalAmountC + key.total
                        }
                        if ((totalAmountC + ((Number(price) * (Number(winners))))) > challenger_Details.win_amount) {
                            return {
                                status: false,
                                message: 'price should be less or equal to challengers winning Amount'
                            }
                        } else if (challenger_Details.maximum_user < (position + Number(winners))) {
                            return {
                                status: false,
                                message: 'number of Winner should be less or equal challengers maximum user'
                            }
                        } else {

                            let obj = {
                                stockcontestId: mongoose.Types.ObjectId(req.body.stockcontestId),
                                winners: (Number(winners)) || 0,
                                price: (Number(price)) || 0,
                                price_percent: (Number(price_percent)) || 0,
                                min_position: (position) || 0,
                                max_position: ((Number(min_position)) + (Number(winners))) || 0,
                                total: ((Number(winners)) * (Number(price))) || 0,
                                type: 'Amount'
                            };

                            if (req.file) {
                                obj.image = `/${req.body.typename}/${req.file.filename}`
                            }
                            const insertPriceData = new stockPriceCardModel(obj)
                            let savePriceData = await insertPriceData.save();
                            if (savePriceData) {
                                return {
                                    status: true,
                                    message: 'price Card added successfully'
                                }
                            } else {
                                return {
                                    status: false,
                                    message: 'data not insert ..error..'
                                }
                            }
                        }

                    }

                }
            } else {
                return {
                    status: false,
                    message: 'please enter proper values'
                }
            }

        } catch (error) {
            return true;
        }
    }
    
    async deletepricecard_data(req) {
        try {
            const _checkData = await stockPriceCardModel.findOne({ _id: req.params.id });
            if (!_checkData) {
                return {
                    status: false,
                    message: "something wrong please try letter.."
                }
            } else {
                if (_checkData.image) {
                    let filePath = `public${_checkData.image}`;
                    if (fs.existsSync(filePath) == true) {
                        fs.unlinkSync(filePath);
                    }
                }
                const deletequery = await stockPriceCardModel.deleteOne({ _id: req.params.id });
                if (deletequery.deletedCount == 1) {
                    return {
                        status: true,
                        message: 'delete successfully'
                    }
                } else if (deletequery.deletedCount == 0) {
                    return {
                        status: false,
                        message: 'unable to delete'
                    }
                }
            }


        } catch (error) {
            throw error;
        }
    }

    async enableDisableContest(req){
        try {
            let {_id} = req.query;
            const chkData = await stockContestModel.findOne({_id});
            console.log(chkData)
            if(chkData.isEnable){
                chkData.isEnable=false
            }else{
                chkData.isEnable=true
            }
            chkData.save();
            return chkData;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
    async cancelStockContest(req){
        try {
            let {id} = req.params;
            const chkData = await stockContestModel.findOne({_id:id});
            if(chkData.isCancelled === false){
                chkData.isCancelled = true
                chkData.save();
                return chkData;
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async editStockContestPage(req) {
        try {
            if (req.params.id) {
                 const stockcontestdata = await stockContestModel.findOne({_id:req.params.id});
                if (stockcontestdata) {
                    return {
                        status: true,
                        StockData: stockcontestdata
                    };
                } else {
                    return {
                        status: false,
                        message: 'Stock Contest Not Found '
                    }
                }
            } else {
                return {
                    status: false,
                    message: 'Invalid Stock Contest Id'
                }
            }
        } catch (error) {
            throw error;
        }
    }

    async editStockContestData(req) {
        try {
            if(req.fileValidationError){
                return{
                    status:false,
                    message:req.fileValidationError
                }

            }
            if (req.body.entryfee && req.body.win_amount && req.body.contest_type) {
                // const checkContestName=await challengersModel.findOne({_id:{$ne: req.body.globelContestsId},contest_name:req.body.contest_name});
                // if(checkContestName){
                //     return {
                //         status: false,
                //         message: 'Contest Name already exist..'
                //     }
                // }
                if (Number(req.body.entryfee) == 0 || Number(req.body.win_amount) == 0 || Number(req.body.maximum_user) == 0) {
                    return {
                        status: false,
                        message: 'entryfee or win amount or maximum user can not equal to Zero'
                    }
                }
                let data = {}
                // console.log("req.body", req.body, "req.params", req.params, "req.query", req.query)
                const stockcontestData = await stockContestModel.findOne({ _id: req.body.stockContestsId });
                // console.log("challengerData......................", challengerData)
                const checkData = await stockContestModel.findOne({ _id: { $ne: req.body.stockContestsId }, entryfee: req.body.entryfee, win_amount: req.body.win_amount, contest_type: req.body.contest_type, is_deleted: false });

                if (checkData) {
                    // console.log("check Data.. found");
                    return {
                        status: false,
                        message: 'This contest is already exist with the same winning amount, entry fees and maximum number ,contest type ...'
                    }
                } else {
                    if (req.body.team_limit) {
                        if (Number(req.body.team_limit) == 0 || Number(req.body.team_limit) > Number(process.env.TEAM_LIMIT)) {
                            // console.log("team_limit == 0. found");
                            return {
                                status: false,
                                message: `Value of Team limit not equal to 0..or more then ${config.TEAM_LIMIT}.`
                            }
                        } else {
                            // data.multi_entry = 1;
                        }
                    }

                    // if (req.body.multi_entry) {
                    //     req.body.multi_entry = 1;
                    // } else {
                    //     req.body.multi_entry = 0;
                    // }
                    // if (req.body.confirmed_challenge) {
                    //     req.body.confirmed_challenge = 1;
                    // } else {
                    //     req.body.confirmed_challenge = 0;
                    // }

                    if (req.body.is_running) {
                        req.body.is_running = 1;
                    } else {
                        req.body.is_running = 0;
                    }

                    if (req.body.maximum_user) {
                        if (req.body.maximum_user < 2) {
                            // console.log("maximum_user < 2 found");
                            return {
                                status: false,
                                message: 'Value of maximum user not less than 2...'
                            }
                        }
                    }
                    if (req.body.winning_percentage) {
                        if (req.body.winning_percentage == 0) {
                            // console.log("winning_percentage == 0. found");
                            return {
                                status: false,
                                message: 'Value of winning percentage not equal to 0...'
                            }
                        }
                    }
                    if (req.body.bonus_percentage) {
                        if (req.body.bonus_percentage == 0) {
                            // console.log("bonus_percentage == 0. found");
                            return {
                                status: false,
                                message: 'Value of bonus percentage not equal to 0...'
                            }
                        }
                    }
                    if (!req.body.bonus_percentage) {
                        // console.log("..!req.body.bonus_percentage found");
                        req.body.bonus_percentage = 0
                        req.body.is_bonus = 0;
                    }
                    if (!req.body.maximum_user) {
                        req.body.maximum_user = 0
                    }
                    if (!req.body.winning_percentage) {
                        req.body.winning_percentage = 0;
                    }
                    if (Number(req.body.win_amount) != Number(stockcontestData.win_amount)) {
                        // console.log("delete Price Card By win_Amount")
                        const deletepriceCard = await stockPriceCardModel.deleteMany({ stockcontestId: stockcontestData._id });
                        // console.log("deletepriceCard..", deletepriceCard)
                    }
                    if (req.body.contest_type == 'Percentage') {
                        // console.log("..contest_type == 'Percentage' found");
                        req.body.maximum_user = 0;
                        req.body.pricecard_type = 0;
                        const checkPriceCard = await stockPriceCardModel.findOne({ stockcontestId: stockcontestData._id });
                        if (checkPriceCard) {
                            const deletepriceCard = await stockPriceCardModel.deleteMany({ stockcontestId: stockcontestData._id });
                        }
                    }
                    if (req.body.contest_type == 'Amount') {
                        if (!req.body.pricecard_type) {
                            req.body.pricecard_type = 'Amount'
                        }
                        req.body.winning_percentage = 0
                    }
                    if (req.body.maximum_user) {
                        // console.log("..maximum_user' found");
                        data.maximum_user = req.body.maximum_user;
                    }

                    if (req.body.winning_percentage) {
                        // console.log("..winning_percentage.. found");
                        data.winning_percentage = req.body.winning_percentage;
                    }

                    // if (req.body.confirmed_challenge) {
                    //     console.log("..confirmed_challenge.. found");
                    //     data.confirmed_challenge = 1;
                    // } else {
                    //     data.confirmed_challenge = 0;
                    // }

                    if (req.body.is_running) {
                        // console.log("...is_running'.. found");
                        data.is_running = 1;
                    } else {
                        data.is_running = 0;
                    }
                    if (req.body.is_bonus) {
                        // console.log("....is_bonus'.. found");
                        data.is_bonus = 1;
                        data.bonus_percentage = req.body.bonus_percentage;
                    } else {
                        data.is_bonus = 0;
                        data.bonus_percentage = 0;
                    }
                    if (req.body.multi_entry) {
                        // data.multi_entry = 1;
                        // data.multi_entry = req.body.multi_entry;
                        data.team_limit = req.body.team_limit;
                    } else {
                        // data.multi_entry = 0;
                    }
                    if (Number(req.body.maximum_user) != Number(stockcontestData.maximum_user)) {
                        const checkPriceCard = await stockPriceCardModel.findOne({ stockcontestId: stockcontestData._id });
                        if (checkPriceCard) {
                            const deletepriceCard = await stockPriceCardModel.deleteMany({ stockcontestId: stockcontestData._id });
                        }
                    }
                    if (req.body.pricecard_type != stockcontestData.pricecard_type) {
                        const checkPriceCard = await stockPriceCardModel.findOne({ stockcontestId: stockcontestData._id });
                        if (checkPriceCard) {
                            const deletepriceCard = await stockPriceCardModel.deleteMany({ stockcontestId: stockcontestData._id });
                        }
                    }
                    let image = `/${req.body.typename}/${req.file ? req.file.filename : ""}`;

                    if (req.file) {
                        data.image = image;
                    }
                    data.contest_type = req.body.contest_type;
                    data.pricecard_type = req.body.pricecard_type;
                    data.contest_cat = req.body.contest_cat;
                    data.contest_name = req.body.contest_name;
                    data.entryfee = req.body.entryfee;
                    data.win_amount = req.body.win_amount;
                    data.fantasy_type = req.body.fantasy_type;
                    // data.amount_type = req.body.amount_type;
                    // data.select_team = req.body.select_team;
                    data.start_date = req.body.start_date;
                    data.end_date = req.body.end_date;
                    data.stock_contest_cat = req.body.stock_contest_cat;
                    data.stock_categoryId = req.body.stock_categoryId;
                    if (req.body.contest_type == 'Amount') {
                        data.winning_percentage = 0;
                    }
                    const updatestockContest = await stockContestModel.updateOne({ _id: mongoose.Types.ObjectId(req.body.stockContestsId) }, { $set: data });
                    if (updatestockContest.modifiedCount > 0) {
                        return {
                            status: true,
                            message: 'stock contest successfully update'
                        };
                    } else {
                        return {
                            status: false,
                            message: "Not Able To Update stock Contest  ..ERROR.."
                        }
                    }
                }

            }

        } catch (error) {
            throw error;
        }
    }

    async launchStockContest(req){
        try {
            let {id} = req.params;
            const chkLaunchData = await stockContestModel.findOne({_id:id});
            if(chkLaunchData.launch_status === 'notstarted'){
                chkLaunchData.launch_status = 'launched'
                chkLaunchData.save();
                return chkLaunchData;
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async cancelContestStock(req){
        try{
            const matchContest= await stockContestModel.find({_id:req.query.contestId});
            if(matchContest.length > 0){
                for await(let key of matchContest){
                    req.params.stockContestId=key._id
                  
                    const getMatchContestData = await stockContestModel.findOne({ _id: req.params.stockContestId});
           
              if (getMatchContestData) {
                let joinLeagues = await joinStockLeagueModel.find({ contestId: getMatchContestData._id });
       
                if (joinLeagues.length > 0) {
                    for (let league of joinLeagues) {
                        let leaugestransaction = league.leaugestransaction;
                        let randomStr=randomstring.generate({
                            length: 4,
                            charset: 'alphabetic',
                            capitalization:'uppercase'
                          });
                        let refund_data = await refundMatchModel.findOne({ joinid: mongoose.Types.ObjectId(league._id) });
                  
                        if (!refund_data) {
                            const user = await userModel.findOne({ _id: leaugestransaction.user_id }, { userbalance: 1 });
                            if (user) {
                                const bonus = parseFloat(user.userbalance.bonus.toFixed(2));
                                const balance = parseFloat(user.userbalance.balance.toFixed(2));
                                const winning = parseFloat(user.userbalance.winning.toFixed(2));
                                const totalBalance = bonus + balance + winning;
                                const userObj = {
                                    'userbalance.balance': balance + leaugestransaction.balance,
                                    'userbalance.bonus': bonus + leaugestransaction.bonus,
                                    'userbalance.winning': winning + leaugestransaction.winning,
                                };
                               
                                let transaction_id = `${constant.APP_SHORT_NAME}-${Date.now()}-${randomStr}`;
                                let refundData = {
                                    userid: leaugestransaction.user_id,
                                    amount: getMatchContestData.entryfee,
                                    joinid: league._id,
                                    stockContestId: league.contestId,
                                    reason: 'cancel stock contest',
                                    transaction_id: transaction_id
                                };
                               
                                const transactiondata = {
                                    type: 'Refund',
                                    amount: getMatchContestData.entryfee,
                                    total_available_amt: totalBalance + getMatchContestData.entryfee,
                                    transaction_by: constant.APP_SHORT_NAME,
                                    stockContestId: getMatchContestData._id,
                                    userid: leaugestransaction.user_id,
                                    paymentstatus: constant.PAYMENT_STATUS_TYPES.CONFIRMED,
                                    bal_bonus_amt: bonus + leaugestransaction.bonus,
                                    bal_win_amt: winning + leaugestransaction.winning,
                                    bal_fund_amt: balance + leaugestransaction.balance,
                                    bonus_amt: leaugestransaction.bonus,
                                    win_amt: leaugestransaction.winning,
                                    addfund_amt: leaugestransaction.balance,
                                    transaction_id: transaction_id
                                };
                               
                                let profmiss =await Promise.all([
                                    userModel.findOneAndUpdate({ _id: leaugestransaction.user_id }, userObj, { new: true }),
                                    refundMatchModel.create(refundData),
                                    TransactionModel.create(transactiondata)
                                ]);
                             
                            }
                        }
                    }
                }
                const getMatchContestData1 = await stockContestModel.updateOne({ _id: req.params.stockContestId }, {
                    $set: {
                        isCancelled:true,
                        status: constant.MATCH_CHALLENGE_STATUS.CANCELED
                    }
                });
               
                
              } 
             }
           }
            const updateStockCancel = await stockContestModel.updateOne({_id:req.query.contestId},{
                $set:{
                    final_status:req.query.status
                }
            })
          
            return{
                status:true,
                message:'stock Contest cancel successfully'
            }

        }catch(error){
            console.log(error)
        }
    }

    async refundprocess(contestid, entryfee, reason) {
        console.log("-------------------------------------refundprocess-----------------------------")
        let joinLeagues = await joinStockLeagueModel.find({
            contestId: mongoose.Types.ObjectId(contestid),
        });
        if (joinLeagues.length > 0) {
            for (let league of joinLeagues) {
                let leaugestransaction = league.leaugestransaction;
                let refund_data = await refundMatchModel.findOne({ joinid: mongoose.Types.ObjectId(league._id) });
                if (!refund_data) {
                    const user = await userModel.findOne({ _id: leaugestransaction.user_id }, { userbalance: 1 });
                    if (user) {
                        const bonus = parseFloat(user.userbalance.bonus.toFixed(2));
                        const balance = parseFloat(user.userbalance.balance.toFixed(2));
                        const winning = parseFloat(user.userbalance.winning.toFixed(2));
                        const totalBalance = bonus + balance + winning;
                        const userObj = {
                            'userbalance.balance': balance + leaugestransaction.balance,
                            'userbalance.bonus': bonus + leaugestransaction.bonus,
                            'userbalance.winning': winning + leaugestransaction.winning,
                        };
                        let randomStr = randomstring.generate({
                            length: 4,
                            charset: 'alphabetic',
                            capitalization: 'uppercase'
                        });
                        console.log("------randomStr-------2", randomStr)
                        let transaction_id = `${constant.APP_SHORT_NAME}-${Date.now()}-${randomStr}`;
                        let refundData = {
                            userid: leaugestransaction.user_id,
                            amount: entryfee,
                            joinid: league._id,
                            stockContestId: league.contestId,
                            reason: reason,
                            transaction_id: transaction_id
                        };
                        const transactiondata = {
                            type: 'Refund',
                            amount: entryfee,
                            total_available_amt: totalBalance + entryfee,
                            transaction_by: constant.APP_SHORT_NAME,
                            stockContestId: contestid,
                            userid: leaugestransaction.user_id,
                            paymentstatus: constant.PAYMENT_STATUS_TYPES.CONFIRMED,
                            bal_bonus_amt: bonus + leaugestransaction.bonus,
                            bal_win_amt: winning + leaugestransaction.winning,
                            bal_fund_amt: balance + leaugestransaction.balance,
                            bonus_amt: leaugestransaction.bonus,
                            win_amt: leaugestransaction.winning,
                            addfund_amt: leaugestransaction.balance,
                            transaction_id: transaction_id
                        };
                        console.log("----refundprocess----transactiondata----",transactiondata)
                        console.log("----refundprocess----refundData----",refundData)
                        await Promise.all([
                            userModel.findOneAndUpdate({ _id: leaugestransaction.user_id }, userObj, { new: true }),
                            refundMatchModel.create(refundData),
                            TransactionModel.create(transactiondata)
                        ]);
                    }
                }
            }
        }
        return true;
    }

    async allRefundAmount(req, reason) {
        console.log("-------------------------------------allRefundAmount-------------------------")
        let { id, status } = req.params;
        let stockContestData = await stockContestModel.find({ _id: id });
        if (stockContestData.length > 0) {
            for (let stockContest of stockContestData) {
                let getresponse = await this.refundprocess(stockContest._id, stockContest.entryfee,reason);
                if (getresponse == true) {
                    await stockContestModel.updateOne({ _id: mongoose.Types.ObjectId(stockContest._id) }, {
                        $set: {
                            status: 'canceled'
                        }
                    });
                }
            }
        }
    }

    async distributeWinningAmount(req) {
        console.log("-------------------------------------distributeWinningAmount------------------------------")
        let { id, status } = req.params;
        let contestId = id;
        let match_time = moment().subtract(10, 'm').format('YYYY-MM-DD HH:mm:ss');
        let pipeline = [];
        pipeline.push({
            $match: {
                _id: mongoose.Types.ObjectId(contestId),
                launch_status: 'launched',
                final_status: { $nin: ["winnerdeclared", "IsCanceled", "IsAbandoned"] },
                status: { $ne: "canceled" }
            }
        });
        
        let contest = await stockContestModel.aggregate(pipeline);
        
        if (contest.length > 0) {
            for (let challenge of contest) {
                let joinedusers = await joinStockLeagueModel.aggregate([
                    {
                      '$match': {
                        'contestId': mongoose.Types.ObjectId(challenge._id),
                      }
                    }, {
                      '$lookup': {
                        'from': 'joinstockteams', 
                        'localField': 'teamid', 
                        'foreignField': '_id', 
                        'as': 'joinTeamData'
                      }
                    }, {
                      '$addFields': {
                        'stockContedId': {
                          '$map': {
                            'input': '$joinTeamData', 
                            'as': 'item', 
                            'in': '$$item.contestId'
                          }
                        }
                      }
                    }, {
                      '$lookup': {
                        'from': 'stockpricecards', 
                        'let': {
                          'id': '$stockContedId'
                        }, 
                        'pipeline': [
                          {
                            '$match': {
                              '$expr': {
                                '$in': [
                                  '$stockcontestId', '$$id'
                                ]
                              }
                            }
                          }
                        ], 
                        'as': 'matchpricecards'
                      }
                    }, {
                      '$unwind': {
                        'path': '$matchpricecards'
                      }
                    }, {
                      '$lookup': {
                        'from': 'stockfinalresults', 
                        'localField': 'teamid', 
                        'foreignField': 'teamid', 
                        'as': 'stockfinalresults'
                      }
                    }, {
                      '$unwind': {
                        'path': '$joinTeamData'
                      }
                    }, {
                      '$unwind': {
                        'path': '$stockfinalresults'
                      }
                    }, {
                      '$project': {
                        '_id': 1, 
                        'points': '$stockfinalresults.finalvalue', 
                        'userid': 1, 
                        'matchpricecards': 1
                      }
                    }
                  ]);
                // console.log("-------joinedusers-------->--", joinedusers)
                if (joinedusers.length > 0) {

                    let prc_arr = [];
                    if (challenge.contest_type == 'Amount') {
                        if (challenge.type == 'Amount') {
                            if (challenge.matchpricecards.length > 0) {
                                for await(let prccrd of challenge.matchpricecards) {
                                    let min_position = prccrd.min_position;
                                    let max_position = prccrd.max_position;
                                    for (let i = min_position; i < max_position; i++) {
                                        let Obj = {};
                                        Obj['price'] = prccrd.price;
                                        Obj['gift_type'] = "amount";
                                        prc_arr.push(Obj)
                                    }
                                }
                            } else {
                                let Obj = {};
                                Obj['price'] = challenge.win_amount;
                                Obj['gift_type'] = "amount";
                                prc_arr.push(Obj)
                            }
                            
                        } else {

                            if (challenge.matchpricecards) {
                                for await(let prccrd of challenge.matchpricecards) {
                                    let min_position = prccrd.min_position;
                                    let max_position = prccrd.max_position;
                                    for (let i = min_position; i < max_position; i++) {
                                        let Obj = {};
                                        Obj['price'] = (prccrd.price_percent / 100) * (challenge.win_amount);
                                        Obj['gift_type'] = prccrd.gift_type ? prccrd.gift_type : "amount";
                                        prc_arr.push(Obj)
                                    }
                                }
                            } else {
                                let Obj = {};
                                Obj['price'] = challenge.win_amount;
                                Obj['gift_type'] ="amount";
                                prc_arr.push(Obj)
                            }
                        }
                    } else if (challenge.contest_type == 'Percentage') {
                        let getwinningpercentage = challenge.winning_percentage;
                        let gtjnusers = challenge.joinedusers;
                        let toWin = Math.floor(gtjnusers * getwinningpercentage / 100);
                        prc_arr = [];
                        for (let i = 0; i < toWin; i++) {
                            let Obj = {};
                            Obj['price'] = challenge.win_amount;
                            Obj['gift_type'] = "amount";
                            prc_arr.push(Obj)
                        }
                    }
                    let user_points = [];
                    if (joinedusers.length > 0) {
                        let lp = 0;
                        for await(let jntm of joinedusers) {
                            user_points[lp] = {};
                            user_points[lp]['id'] = jntm.userid.toString();
                            user_points[lp]['points'] = jntm.points;
                            user_points[lp]['joinId'] = jntm._id.toString();
                            lp++;
                        }
                    }

                    user_points.sort((a, b) => {
                        return  b.points - a.points ;
                    });
                    // console.log("=============user_points==========",user_points)
                    let poin_user = [];
                    let ids_str = "";
                    let userids_str = "";
                    for (let usr of user_points) {
                        let indexings = poin_user.findIndex(element => element.points == usr.points);
                        if (indexings == -1) {
                            poin_user.push({
                                id: [usr.id],
                                points: usr.points,
                                joinId: [usr.joinId]
                            });
                        } else {
                            let ids_arr = [];
                            let userids_arr = [];
                            let getdatatype = Array.isArray(poin_user[indexings].joinId);
                            if (getdatatype) {
                                ids_arr = [];
                                userids_arr = [];
                                ids_str = poin_user[indexings].joinId.join(',');
                                ids_str = ids_str + ',' + usr.joinId;
                                ids_arr = ids_str.split(',');
                                userids_str = poin_user[indexings].id.join(',');
                                userids_str = userids_str + ',' + usr.id;
                                userids_arr = userids_str.split(',');
                                poin_user[indexings].joinId = ids_arr;
                                poin_user[indexings].id = userids_arr;
                                poin_user[indexings].points = usr.points;
                            } else {
                                ids_arr = [];
                                userids_arr = [];
                                ids_str = poin_user[indexings].joinId;
                                ids_str = ids_str + ',' + usr.joinId;
                                ids_arr = ids_str.split(',');
                                userids_str = poin_user[indexings].id;
                                userids_str = userids_str + ',' + usr.id;
                                userids_arr = userids_str.split(',');
                                poin_user[indexings].joinId = ids_arr;
                                poin_user[indexings].id = userids_arr;
                                poin_user[indexings].points = usr.points;
                            }
                        }
                    }

                    poin_user.sort((a, b) => {
                        return  b.points - a.points ;
                    });

                    let win_usr = [];
                    let win_cnt = 0;
                    let count = prc_arr.length;
                    for (let [k, pu] of poin_user.entries()) {
                        if (win_cnt < count) {
                            // let obj1 = {};
                            win_usr[k] = {};
                            win_usr[k]['min'] = win_cnt + 1;
                            win_cnt = win_cnt + pu['joinId'].length;
                            win_usr[k]['max'] = win_cnt;
                            win_usr[k]['count'] = pu['joinId'].length;
                            win_usr[k]['joinId'] = pu['joinId'];
                            win_usr[k]['id'] = pu['id'];
                            win_usr[k]['points'] = pu['points'];
                        } else {
                            break;
                        }
                    }
                    let final_poin_user = [];
                    for (let [ks, ps] of win_usr.entries()) {
                        let num=ps['min']-1;
                        let lnum=ps['max']-1;
                        if (prc_arr[num]) {
                            if (ps['count'] == 1) {
                                let obj2 = {};
                                
                                obj2[ps['joinId'][0]] = {};
                                obj2[ps['joinId'][0]]['points'] = ps['points'];
                                obj2[ps['joinId'][0]]['amount'] = prc_arr[num]['price'];
                                obj2[ps['joinId'][0]]['gift_type'] = prc_arr[num]['gift_type'];
                                obj2[ps['joinId'][0]]['rank'] = num+1;
                                obj2[ps['joinId'][0]]['userid'] = ps['id'][0];
                                final_poin_user.push(obj2);
                                // console.log('win_usr final_poin_user' , final_poin_user);
                            } else {
                                let ttl = 0;
                                let avg_ttl = 0;
                                for (let jj = num; jj <= lnum; jj++) {
                                    let sm=0;
                                    if (prc_arr[jj]) {
                                        if(prc_arr[jj]['gift_type'] != "prize"){
                                            sm = prc_arr[jj]['price'];
                                        }
                                    }
                                    ttl = ttl + sm;
                                }
                                avg_ttl =  ttl / ps['count'];

                                for (let [keyuser, fnl] of ps['joinId'].entries()) {
                                    let obj3 = {};

                                    obj3[fnl] = {};
                                    obj3[fnl]['points'] =ps['points'];
                                    obj3[fnl]['amount'] = avg_ttl;
                                    // obj2[fnl['gift_type'] = prc_arr[ps['min']]['gift_type']
                                    obj3[fnl]['rank'] = ps['min'];
                                    obj3[fnl]['gift_type'] = prc_arr[num]['gift_type'];
                                    obj3[fnl]['userid'] = ps['id'][keyuser];
                                    final_poin_user.push(obj3);
                                }
                            }
                        }
                    }

                    if (final_poin_user.length > 0) {
                        for (let finalPoints of final_poin_user) {
                            let fpusv = Object.values(finalPoints)[0];
                            let fpuskjoinid = Object.keys(finalPoints)[0];
                            let fpusk = fpusv['userid'];
                            let checkWinning = await stockFinalResult.findOne({ joinId: mongoose.Types.ObjectId(fpuskjoinid) });
                            
                            if (!checkWinning.amount) {
                                let randomStr = randomstring.generate({
                                    length: 4,
                                    charset: 'alphabetic',
                                    capitalization: 'uppercase'
                                });
                                // console.log("------randomStr-------", randomStr)
                                let transactionidsave = `${constant.APP_SHORT_NAME}-WIN-${Date.now()}-${randomStr}`;
                                
                                let finalResultArr;
                                if(fpusv['gift_type'] == "gift"){
                                    finalResultArr = {
                                        userid: fpusk,
                                        finalvalue: fpusv['points'],
                                        amount: 0,
                                        prize:fpusv['amount'],
                                        rank: fpusv['rank'],
                                        contestId: contestId,
                                        challengeid: challenge._id,
                                        seriesid: contest[0].series,
                                        transaction_id: transactionidsave,
                                        joinId: fpuskjoinid
                                    };
                                }else{
                                    finalResultArr = {
                                        userid: fpusk,
                                        finalvalue: fpusv['points'],
                                        amount: fpusv['amount'],
                                        rank: fpusv['rank'],
                                        contestId: contestId,
                                        challengeid: challenge._id,
                                        seriesid: contest[0].series,
                                        transaction_id: transactionidsave,
                                        joinId: fpuskjoinid
                                    };
                                }

                                let checkWinningUser = await stockFinalResult.findOne({
                                    joinId: mongoose.Types.ObjectId(fpuskjoinid),
                                    userid: mongoose.Types.ObjectId(fpusk)
                                });
                                // console.log(checkWinningUser,"checking")
                                if (!checkWinningUser.amount) {
                                    let dataa = await stockFinalResult.findOneAndUpdate({joinId:joinedusers._id, userId:joinedusers.userid, contestId:joinedusers.matchpricecards.stockcontestId}, finalResultArr, {upsert:true});
                                    const user = await userModel.findOne({ _id: fpusk }, { userbalance: 1, totalwinning: 1 });
                                 
                                    if (user) {
                                        if (fpusv['amount'] > 10000) {
                                            const bonus = parseFloat(user.userbalance.bonus.toFixed(2));
                                            const balance = parseFloat(user.userbalance.balance.toFixed(2));
                                            const winning = parseFloat(user.userbalance.winning.toFixed(2));
                                            const totalwinning = parseFloat(user.totalwinning.toFixed(2));
                                            const totalBalance = bonus + balance + winning;

                                            let tds_amount = (31.2 / 100) * fpusv['amount'];
                                            let amount = fpusv['amount'] - tds_amount;
                                            let tdsData = {
                                                userid: fpusk,
                                                amount: fpusv['amount'],
                                                tds_amount: tds_amount,
                                                challengeid: challenge._id,
                                                seriesid: contest[0].series
                                            };
                                            const userObj = {
                                                'userbalance.balance': balance,
                                                'userbalance.bonus': bonus,
                                                'userbalance.winning': winning + amount,
                                                'totalwinning': totalwinning + amount
                                            };
                                            const transactiondata = {
                                                type: `${contest.fantasy_type} Winning Amount`,
                                                amount: amount,
                                                total_available_amt: totalBalance + amount,
                                                transaction_by: constant.APP_SHORT_NAME,
                                                stockContestId: challenge._id,
                                                userid: fpusk,
                                                paymentstatus: constant.PAYMENT_STATUS_TYPES.CONFIRMED,
                                                bal_bonus_amt: bonus,
                                                bal_win_amt: winning + amount,
                                                bal_fund_amt: balance,
                                                win_amt: amount,
                                                transaction_id: transactionidsave
                                            };
                                            await Promise.all([
                                                userModel.findOneAndUpdate({ _id: fpusk }, userObj, { new: true }),
                                                tdsDetailModel.create(tdsData),
                                                TransactionModel.create(transactiondata),
                                            ]);
                                            if (fpusv['amount'] > 0) {
                                                let entryfee = challenge.entryfee;
                                                let userid = fpusk;
                                                await LevelServices.give_referrer_bonus(userid, entryfee);
                                            }
                                        } else {
                                            const bonus = parseFloat(user.userbalance.bonus.toFixed(2));
                                            const balance = parseFloat(user.userbalance.balance.toFixed(2));
                                            const winning = parseFloat(user.userbalance.winning.toFixed(2));
                                            const totalwinning = parseFloat(user.totalwinning.toFixed(2));
                                            const totalBalance = bonus + balance + winning;
                                            let amount = fpusv['amount'];
                                            let userObj ;
                                            let total_available_amt;
                                            let bal_win_amt ;
                                            let type ;
                                            let transactiondata ;
                                            if(fpusv['gift_type'] == "gift"){
                                                type = "Contest Winning Gift"
                                                total_available_amt = totalBalance
                                                bal_win_amt = totalwinning
                                                 userObj = {
                                                    'userbalance.balance': balance,
                                                    'userbalance.bonus': bonus,
                                                    'userbalance.winning': winning,
                                                    'totalwinning': totalwinning
                                                };
                                                transactiondata = {
                                                    type: `${contest.fantasy_type} Winning Amount`,
                                                    amount: 0,
                                                    prize:amount,
                                                    total_available_amt:total_available_amt,
                                                    transaction_by: constant.APP_SHORT_NAME,
                                                    stockContestId: challenge._id,
                                                    userid: fpusk,
                                                    paymentstatus: constant.PAYMENT_STATUS_TYPES.CONFIRMED,
                                                    bal_bonus_amt: bonus,
                                                    bal_win_amt: bal_win_amt,
                                                    bal_fund_amt: balance,
                                                    win_amt: 0,
                                                    transaction_id: transactionidsave
                                                };
                                                
                                            }else{
                                                type =`${contest.fantasy_type} Winning Amount`
                                                total_available_amt = totalBalance + amount ;
                                                bal_win_amt =  winning + amount ;
                                                 userObj = {
                                                    'userbalance.balance': balance,
                                                    'userbalance.bonus': bonus,
                                                    'userbalance.winning': bal_win_amt,
                                                    'totalwinning': total_available_amt
                                                };
                                                transactiondata = {
                                                    type: `${contest.fantasy_type} Winning Amount`,
                                                    amount: amount,
                                                    total_available_amt:total_available_amt,
                                                    transaction_by: constant.APP_SHORT_NAME,
                                                    stockContestId: challenge._id,
                                                    userid: fpusk,
                                                    paymentstatus: constant.PAYMENT_STATUS_TYPES.CONFIRMED,
                                                    bal_bonus_amt: bonus,
                                                    bal_win_amt: bal_win_amt,
                                                    bal_fund_amt: balance,
                                                    win_amt: amount,
                                                    transaction_id: transactionidsave
                                                };
                                            }
                                        
                                            
                                           
                                           let myinserttt= await Promise.all([
                                                userModel.findOneAndUpdate({ _id: fpusk }, userObj, { new: true }),
                                                TransactionModel.create(transactiondata)
                                            ]);
                                          
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                
            }
        }
        return true;
    }

    async stockviewtransactions(req) {
        try {
            const findTransactions = await TransactionModel.findOne({ userid: req.query.userid, stockContestId:req.query.contestId });
            if (findTransactions) {
                return {
                    status: true,
                    data: findTransactions,
                }
            }
        } catch (error) {
            console.log(error);
           throw error;
        }
    }

    async saveCurrentPriceOfStock(req, res) {
        try {
          const stockData = await stockModel.find({ isEnable: true });
    
          const headers = {
            "Authorization": `token ${process.env.KITE_Api_kEY}:${process.env.KITE_ACCESS_TOKEN}`
          };
    
          const formattedDate = moment().format('YYYY-MM-DD+HH:mm');
          const requests = stockData.map(async (stock) => {
            try {
              const resp = await axios.get(`https://api.kite.trade/instruments/historical/${stock.instrument_token}/minute?from=${formattedDate}:00&to=${formattedDate}:00`, {
                "headers": headers
              });
              const historicalData = resp.data.data.candles;
              const updates = historicalData.map(async (candle) => {
                const openPrice = candle[1];
                const closePrice = candle[4];
                await stockModel.findOneAndUpdate({ instrument_token: stock.instrument_token }, { "openPrice": openPrice, 'closePrice': closePrice }, { upsert: true });
              });
              await Promise.all(updates);
            } catch (err) {
              throw err;
            }
          });
          await Promise.all(requests);
          return {
            "message": "League Data",
            data: requests || {}
          };
        } catch (error) {
          throw error;
        }
    }
    async updateResultStocks(req) {
        try {
          console.log('nitesh______+++++++++');
          const currentDate = moment().subtract(2, 'days').format('YYYY-MM-DD 00:00:00');
          let newData;
          const listContest = await stockContestModel.find({
            fantasy_type: { $ne: 'CRICKET' },
            start_date: { $gte: currentDate },
            launch_status: 'launched',
            final_status: { $nin: ['winnerdeclared', 'IsCanceled'] },
            status: { $ne: 'completed' }
          });
          if (listContest.length > 0) {
            for (let index of listContest) {
              let matchTimings = index.start_date;
              const currentDate1 = moment().format('YYYY-MM-DD+HH:mm:ss');
    
              if (currentDate1 >= matchTimings) {
                const result = await this.getSockScoresUpdates(listContest);
    
                const headers = {
                  "Authorization": `token ${process.env.KITE_Api_kEY}:${process.env.KITE_ACCESS_TOKEN}`
                };
    
                await Promise.all(result.map(async (ele) => {
                  const insertData = {
                    userId: ele.userid,
                    teamid: ele.teamid,
                    contestId: ele.contestId,
                    joinId: ele._id,
                  };
    
                  const investment = +ele.invested;
                  const startDate = ele.start_date;
                  const formattedDate = moment(startDate, 'YYYY/MM/DD HH:mm').format('YYYY-MM-DD+HH:mm:ss');
                  const dateFormat = moment().format('YYYY/MM/DD HH:mm');
                  let matchStatus = {};
                  if (dateFormat >= ele.start_date) {
                    matchStatus['status'] = 'started';
                    matchStatus['final_status'] = 'IsReviewed';
                  }
                  await stockContestModel.findByIdAndUpdate({_id:ele.contestId}, matchStatus);
                
                  const chkSave = await stockContestModel.findOneAndUpdate({ _id: ele.contestId }, matchStatus, { upsert: true });
                  let total = 0;
    
                  await Promise.all(ele.stockTeam.map(async (stock) => {
                    try {
                      const resp = await axios.get(`https://api.kite.trade/instruments/historical/${stock.instrument_token}/minute?from=${formattedDate}&to=${formattedDate}`, {
                        headers: headers
                      });
    
                      total += resp.data.data.candles.reduce((acc, candle) => {
                        const openPrice = candle[1];
                        const closePrice = candle[4];
                        return acc + (investment * closePrice / openPrice);
                      }, 0);
                    } catch (err) {
                      console.log(err);
                      console.error(err);
                    }
                  }));
    
                  insertData.finalvalue = total;
                  await this.rankUpdateInMatch1(ele.contestId);  
    
                  newData = await stockFinalResult.findOneAndUpdate(
                    { userId: ele.userid, teamid: ele.teamid, contestId: ele.contestId },
                    insertData,
                    { upsert: true }
                  );
                }));
    
    
              }
    
            }
          }
    
          return {
            "message": "League Data",
            data: newData || {}
          };
    
        } catch (error) {
          console.log(error);
          throw error;
        }
    }

    async rankUpdateInMatch1(contestId){
        try {
            let agePipe = [];
            agePipe.push({
                $match: {
                    _id:mongoose.Types.ObjectId(contestId)
                }
            });
          
            agePipe.push({
                $lookup: {
                    from: "stockfinalresults",
                    let: {
                      contestId: "$_id",
                    },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $and: [
                              {
                                $eq: ["$contestId", "$$contestId"],
                              },
                            ],
                          },
                        },
                      },
                      {
                        $setWindowFields: {
                          partitionBy: "",
                          sortBy: {
                            finalvalue: -1,
                          },
                          output: {
                            rank: {
                              $rank: {},
                            },
                          },
                        },
                      },
                      {
                        $project: {
                          _id: 1,
                          rank: 1,
                          finalvalue: 1,
                        },
                      },
                    ],
                    as: "leaderboards",
                }
            });
            agePipe.push({
                $project: {
                    _id: 1,
                    status: 1,
                    leaderboards: 1,
                    start_date: 1
                }
            })
            let getLiveMatches = await stockContestModel.aggregate(agePipe);
    
          
          if (getLiveMatches.length > 0) {
            if (getLiveMatches[0].leaderboards.length > 0) {
                    const bulkUpdateOperations = [];
                      for (let leaderboard of getLiveMatches[0].leaderboards) {
                            bulkUpdateOperations.push({
                                updateMany: {
                                    filter: { _id: leaderboard._id },
                                    update: { $set: { rank: leaderboard.rank } }
                                }
                            });
              }
                        if (bulkUpdateOperations.length > 0) {
                            await stockFinalResult.bulkWrite(bulkUpdateOperations);
                        }
                    }
                }
            return { message: "Done", status: 200, data: [] };
        }
        catch (error) {
            console.log("error", error)
        }
      }

    async getSockScoresUpdates(listContest) {
        try {
          const currentDate = moment().subtract(2, 'days').format('YYYY-MM-DD 00:00:00');
          const constedleaugeData = await joinStockLeagueModel.aggregate([
            {
              '$lookup': {
                'from': 'stock_contests',
                'localField': 'contestId',
                'foreignField': '_id',
                'as': 'contestData'
              }
            }, {
              '$match': {
                'contestData': {
                  '$elemMatch': {
                    'launch_status': 'launched',
                    'final_status': {
                      '$nin': [
                        'winnerdeclared', 'IsCanceled'
                      ]
                    },
                    'fantasy_type': {
                      '$ne': 'CRICKET'
                    },
                    'status': {
                      '$ne': 'completed'
                    }, 'start_date': { $gte: currentDate },
                  }
                }
              }
            }, {
              '$lookup': {
                'from': 'joinstockteams',
                'localField': 'teamid',
                'foreignField': '_id',
                'as': 'teamData'
              }
            }, {
              '$addFields': {
                'stock': {
                  '$getField': {
                    'field': 'stock',
                    'input': {
                      '$arrayElemAt': [
                        '$teamData', 0
                      ]
                    }
                  }
                }
              }
            }, {
              '$unwind': {
                'path': '$stock'
              }
            }, {
              '$lookup': {
                'from': 'stocks',
                'let': {
                  'id': '$stock.stockId'
                },
                'pipeline': [
                  {
                    '$match': {
                      '$expr': {
                        '$eq': [
                          '$_id', '$$id'
                        ]
                      }
                    }
                  }
                ],
                'as': 'stockTeam'
              }
            }, {
              '$addFields': {
                'stockTeam': {
                  '$arrayElemAt': [
                    '$stockTeam', 0
                  ]
                }
              }
            }, {
              '$addFields': {
                'stockTeam.percentage': '$stock.percentage'
              }
            }, {
              '$project': {
                'stock': 0,
                'teamData': 0,
                'leaugestransaction': 0
              }
            }, {
              '$group': {
                '_id': '$_id',
                'transaction_id': {
                  '$first': '$transaction_id'
                },
                'userid': {
                  '$first': '$userid'
                },
                'teamid': {
                  '$first': '$teamid'
                },
                'contestId': {
                  '$first': '$contestId'
                },
                'contestData': {
                  '$first': '$contestData'
                },
                'stockTeam': {
                  '$push': '$stockTeam'
                }
              }
            }, {
              '$addFields': {
                'invested': {
                  '$getField': {
                    'field': 'investment',
                    'input': {
                      '$arrayElemAt': [
                        '$contestData', 0
                      ]
                    }
                  }
                },
                'start_date': {
                  '$getField': {
                    'field': 'start_date',
                    'input': {
                      '$arrayElemAt': [
                        '$contestData', 0
                      ]
                    }
                  }
                },
                'end_date': {
                  '$getField': {
                    'field': 'end_date',
                    'input': {
                      '$arrayElemAt': [
                        '$contestData', 0
                      ]
                    }
                  }
                }
              }
            }
          ]);
          return constedleaugeData;
        } catch (error) {
          console.log("error" + error);
          throw error;
        }
    }
}
module.exports = new challengersService();