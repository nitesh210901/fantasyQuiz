const mongoose = require('mongoose');
const randomstring = require("randomstring");
const moment = require('moment');
const axios = require("axios")
const fs = require('fs');

require('../../models/challengersModel');
const stockContestModel = require('../../models/stockContestModel');

class overfantasyServices {
    constructor() {
        return {
            stockCreateTeam: this.stockCreateTeam.bind(this),
            checkForDuplicateTeam: this.checkForDuplicateTeam.bind(this),
            findArrayIntersection: this.findArrayIntersection.bind(this),
            getMatchTime: this.getMatchTime.bind(this),
        }
    }

    async stockCreateTeam(req) {
        try {

            const { matchkey, stock, teamnumber, contestId } = req.body;
            let stockArray = stock.map(item => item.stockId);

            const chkStockLimit = await stockContestModel.findById({_id:contestId},{select_team:1});
            if (stockArray.length < chkStockLimit) {
                return {
                    message: `Select atleast ${chkStockLimit} Stocks.`,
                    status: false,
                    data: {}
                };
            }

            let stockObjectIdArray = []; 
            for(let stockId of stockArray){
                stockObjectIdArray.push(mongoose.Types.ObjectId(stockId.stockId));
            }
            
            const joinlist = await stockContestModel.find({ matchkey: matchkey, userid: req.user._id }).sort({ teamnumber: -1 });





            // const { matchkey, teamnumber, stock } = req.body;
            // let stockArray = stock.map(item => item.stockId),
            // stockObjectIdArray = [];
            // if (stockArray.length < 2) {
            //     return {
            //         message: 'Select atleast 2 Stocks.',
            //         status: false,
            //         data: {}
            //     };
            // }
            // for (let stockObjectId of stockArray) stockObjectIdArray.push(mongoose.Types.ObjectId(stockObjectId.questionId));
            // const joinlist = await stockContestModel.find({ matchkey: matchkey, userid: req.user._id }).sort({ teamnumber: -1 });
            // const duplicateData = await this.checkForDuplicateTeam(joinlist, stockArray, teamnumber);
            // if (duplicateData === false) {
            //     return {
            //         message: 'You cannot create the same team.',
            //         status: false,
            //         data: {}
            //     };
            // }

            // let listmatchData = await stockContestModel.findOne({ _id: mongoose.Types.ObjectId(matchkey) });
            // const matchTime = await this.getMatchTime(listmatchData.start_date);
            // if (matchTime === false) {
            //     return {
            //         message: 'Match has been closed, You cannot create or edit team now',
            //         status: false,
            //         data: {}
            //     }
            // }
            // const data = {}

            // data['userid'] = req.user._id;
            // data['matchkey'] = matchkey;
            // data['teamnumber'] = teamnumber;
            // data['stock'] = stock;
            // data['type'] = "stock";
            // const joinTeam = await JoinTeamModel.findOne({
            //     matchkey: matchkey,
            //     teamnumber: parseInt(teamnumber),
            //     userid: req.user._id,
            // }).sort({ teamnumber: -1 });
            // if (joinTeam) {
            //     data["user_type"] = 0;
            //     data['created_at'] = joinTeam.createdAt;
            //     const updateTeam = await JoinTeamModel.findOneAndUpdate({ _id: joinTeam._id }, data, {
            //         new: true,
            //     });
            //     if (updateTeam) {
            //         return {
            //             message: 'Team Updated Successfully',
            //             status: true,
            //             data: {
            //                 teamid: updateTeam._id
            //             }
            //         }
            //     }
            // } else {
            //     const joinTeam = await JoinTeamModel.find({
            //         matchkey: matchkey,
            //         userid: req.user._id,
            //     });
            //     if (joinTeam.length > 0) {
            //         data['teamnumber'] = joinTeam.length + 1;
            //     } else {
            //         data['teamnumber'] = 1;
            //     }
            //     if (data['teamnumber'] <= 11) {
            //         data["user_type"] = 0;
            //         let jointeamData = await JoinTeamModel.create(data);
            //         if (jointeamData) {
            //             return {
            //                 message: 'Team Created Successfully',
            //                 status: true,
            //                 data: {
            //                     teamid: jointeamData._id
            //                 }
            //             }
            //         }
            //     } else {
            //         return {
            //             message: 'You Cannot Create More Team',
            //             status: false,
            //             data: {}
            //         }
            //     }
            // }
        } catch (error) {
            throw error;
        }
    }

    async checkForDuplicateTeam(joinlist, quizArray, teamnumber) {
        if (joinlist.length == 0) return true;
        for await (const list of joinlist) {
            const quizCount = await this.findArrayIntersection(quizArray, list.quiz);
            if (quizCount.length == quizArray.length) return false;
        }
        return true;
    }
    

    async findArrayIntersection(quizArray, previousQuiz) {
        const c = [];
        let j = 0,
            i = 0;
        let data = previousQuiz.map((value) => value.questionId.toString())
            for (i = 0; i < quizArray.length; ++i) {
                if (data.indexOf(quizArray[i]) != -1) {
                    c[j++] = quizArray[i];
            }
        }
        if (i >= quizArray.length) {
            return c;
        }
    }

    async getMatchTime(start_date) {
        const currentdate = new Date();
        const currentOffset = currentdate.getTimezoneOffset();
        const ISTOffset = 330; // IST offset UTC +5:30
        const ISTTime = new Date(currentdate.getTime() + (ISTOffset + currentOffset) * 60000);
        if (ISTTime >= start_date) {
            return false;
        } else {
            return true;
        }
    }

}
module.exports = new overfantasyServices();s