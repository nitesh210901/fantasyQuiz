const res = require('express/lib/response');
const mongoose = require('mongoose');
const moment = require('moment');
const randomstring = require("randomstring");
const stockContestModel = require('../../models/stockContestModel');
const stockPriceCardModel = require('../../models/stockPriceCardModel');
const contestCategoryModel = require('../../models/contestcategoryModel');

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
            if (req.body.entryfee || req.body.entryfee == '0' && req.body.win_amount || req.body.win_amount == '0' && req.body.contest_type && req.body.contest_cat && req.body.start_date &&  req.body.start_date) {
               
                let data = {}
                
                    if (req.body.team_limit) {
                        if (Number(req.body.team_limit) == 0 || Number(req.body.team_limit) > Number(process.env.TEAM_LIMIT)) {
                            return {
                                status: false,
                                message: `Value of Team limit not equal to 0..or more then ${config.TEAM_LIMIT}.`
                            }
                        } else {
                            data.multi_entry = 1;
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

                    if (req.body.confirmed_challenge) {
                        data.confirmed_challenge = 1;
                    } else {
                        if (req.body.contest_type == 'Amount' && req.body.pricecard_type == 'Percentage') {
                            data.confirmed_challenge = 1;
                        }
                    }

                    if (req.body.is_running) {
                        // console.log("...is_running'.. found");
                        data.is_running = 1;
                    }
                    if (req.body.is_bonus) {
                        data.is_bonus = 1;
                        data.bonus_percentage = req.body.bonus_percentage;
                    }
                    if (req.body.multi_entry) {
                        data.multi_entry = 1;
                        data.multi_entry = req.body.multi_entry;
                        data.team_limit = req.body.team_limit;
                    }
                    data.contest_type = req.body.contest_type;
                    data.pricecard_type = req.body.pricecard_type;
                    data.contest_cat = req.body.contest_cat;
                    data.contest_name = req.body.contest_name;
                    data.entryfee = req.body.entryfee;
                    data.fantasy_type = req.body.fantasy_type;
                    data.win_amount = req.body.win_amount;
                    data.amount_type = req.body.amount_type;
                    data.select_team = req.body.select_team;
                    data.start_date = req.body.start_date;
                    data.end_date = req.body.end_date;
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
                            message: 'Stock Contest Create successfully'
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
            const deleteChallenger = await stockContestModel.deleteOne({ _id: req.body.deletedId });
            if (deleteChallenger.deletedCount == 1) {
                const deletePriceCard = await stockPriceCardModel.deleteMany({ stockcontestId: req.query.globelContestsId });
                return true;
            } else {
                return false;
            }

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
                            amount_type: challenger_Details.amount_type
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
                            amount_type: challenger_Details.amount_type
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
                            data.multi_entry = 1;
                        }
                    }

                    if (req.body.multi_entry) {
                        req.body.multi_entry = 1;
                    } else {
                        req.body.multi_entry = 0;
                    }
                    if (req.body.confirmed_challenge) {
                        req.body.confirmed_challenge = 1;
                    } else {
                        req.body.confirmed_challenge = 0;
                    }

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

                    if (req.body.confirmed_challenge) {
                        // console.log("..confirmed_challenge.. found");
                        data.confirmed_challenge = 1;
                    } else {
                        data.confirmed_challenge = 0;
                    }

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
                        data.multi_entry = 1;
                        data.multi_entry = req.body.multi_entry;
                        data.team_limit = req.body.team_limit;
                    } else {
                        data.multi_entry = 0;
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
                    data.contest_type = req.body.contest_type;
                    data.pricecard_type = req.body.pricecard_type;
                    data.contest_cat = req.body.contest_cat;
                    data.contest_name = req.body.contest_name;
                    data.entryfee = req.body.entryfee;
                    data.win_amount = req.body.win_amount;
                    data.fantasy_type = req.body.fantasy_type;
                    data.amount_type = req.body.amount_type;
                    data.select_team = req.body.select_team;
                    data.start_date = req.body.start_date;
                    data.end_date = req.body.end_date;
                    if (req.body.contest_type == 'Amount') {
                        data.winning_percentage = 0;
                    }
                    console.log("data................", data)
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
            if(chkLaunchData.launch_status === false){
                chkLaunchData.launch_status = true
                chkLaunchData.save();
                return chkLaunchData;
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
}
module.exports = new challengersService();