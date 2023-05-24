const matchServices = require('../services/matchServices');
const listMatchesModel = require('../../models/listMatchesModel');
const quizfantasyServices = require('../services/quizFantasyServices');
class matchController {
    constructor() {
        return {
            
            // quiz_getmatchlist: this.quiz_getmatchlist.bind(this),
            // quiz_Newjoinedmatches: this.quiz_Newjoinedmatches.bind(this),
            // quizAllCompletedMatches: this.quizAllCompletedMatches.bind(this),
            quizCreateTeam: this.quizCreateTeam.bind(this),
            // quizGetMyTeams: this.quizGetMyTeams.bind(this),
            // quizInformations: this.quizInformations.bind(this),
            // quizViewTeam: this.quizViewTeam.bind(this),
            // quizLivematches:this.quizLivematches.bind(this),
            getQuestionList:this.getQuestionList.bind(this)
            
        }
    }

    async getQuestionList(req, res, next) {
        try {
            const data = await quizfantasyServices.getQuestionList(req);
            return res.status(200).json(Object.assign({ success: data.status }, data));
        } catch (error) {
            next(error);
        }
    }

    async getAllNewContests(req, res, next) {
        try {
            const data = await contestservices.getAllNewContests(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: true }, data));
            } else {
                return res.status(200).json(Object.assign({ success: true }, data));
            }
        } catch (error) {
            next(error);
        }
    }


    async quizCreateTeam(req,res,next){
        try {
            const data = await quizfantasyServices.quizCreateTeam(req);
            return res.status(200).json(Object.assign({ success: true }, data));
        } catch (error) {
            next(error);
        }
    }


    // async quiz_getmatchlist(req, res, next) {
    //     try {
    //         const upcomingMatches = await quizfantasyServices.quiz_getmatchlist(req);
    //         // console.log(`upcomingMatches`, upcomingMatches);
    //         const joinedMatches = await quizfantasyServices.latestJoinedMatches(req);
    //         // console.log("joinedMatches_-----------------",joinedMatches)

    //         let final = {
    //             message: 'all match data',
    //             status: true,
    //             data: {
    //                 upcomingMatches,
    //                 joinedMatches
    //             }

    //         }
    //         return res.status(200).json(Object.assign({ success: true }, final));
    //     } catch (error) {
    //         next(error);
    //     }
    // }

    // async quiz_Newjoinedmatches(req, res, next) {
    //     try {
    //         const data = await quizfantasyServices.quiz_Newjoinedmatches(req);
    //         return res.status(200).json(Object.assign({ success: true }, data));
    //     } catch (error) {
    //         console.log(error);
    //     }
    // }
    // async quizAllCompletedMatches(req, res, next) {
    //     try {
    //         const data = await quizfantasyServices.quizAllCompletedMatches(req);
    //         return res.status(200).json(Object.assign({ success: true }, data));
    //     } catch (error) {
    //         next(error);
    //     }
    // }

   
    

    // async quizInformations(req,res,next){
    //     try {
    //         const data = await quizfantasyServices.quizInformations(req);
    //         return res.status(200).json(Object.assign({ success: true }, data));
    //     } catch (error) {
    //         next(error);
    //     }
    // }
    // async quizViewTeam(req,res,next){
    //     try {
    //         const data = await quizfantasyServices.quizViewTeam(req);
    //         return res.status(200).json(Object.assign({ success: true }, data));
    //     } catch (error) {
    //         next(error);
    //     }
    // }
    // async quizLivematches(req,res,next){
    //     try {
    //         const data = await quizfantasyServices.quizLivematches(req);
    //         return res.status(200).json(Object.assign({ success: true }, data));
    //     } catch (error) {
    //         next(error);
    //     }
    // }
    // async quizGetMyTeams(req, res, next) {
    //     try {
    //         const data = await quizfantasyServices.quizGetMyTeams(req);
    //         if (data.status === false) {
    //             return res.status(200).json(Object.assign({ success: true }, data));
    //         } else {
    //             return res.status(200).json(Object.assign({ success: data.status }, data));
    //         }
    //     } catch (error) {
    //         next(error);
    //     }
    // }
}
module.exports = new matchController();