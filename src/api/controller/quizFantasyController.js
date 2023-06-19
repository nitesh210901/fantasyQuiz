const moment = require('moment')
const matchServices = require('../services/matchServices');
const listMatchesModel = require('../../models/listMatchesModel');
const quizfantasyServices = require('../services/quizFantasyServices');
const contestservices = require("../services/contestServices")
class matchController {
    constructor() {
        return {
            
            quizCreateTeam: this.quizCreateTeam.bind(this),
            getQuiz:this.getQuiz.bind(this),
            getSingleQuiz:this.getSingleQuiz.bind(this),
            quizGiveAnswer:this.quizGiveAnswer.bind(this),
            quizgetUsableBalance:this.quizgetUsableBalance.bind(this),
            joinQuiz:this.joinQuiz.bind(this),
            getAllNewContests: this.getAllNewContests.bind(this),
            quizGetMyTeams: this.quizGetMyTeams.bind(this),
            quizAnswerMatch: this.quizAnswerMatch.bind(this),
            joinQuizContest: this.joinQuizContest.bind(this),
            getMyQuizJoinedContest: this.getMyQuizJoinedContest.bind(this),
        }
    }

    async getQuiz(req, res, next) {
        try {
            const data = await quizfantasyServices.getQuiz(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: true }, data));
            } else {
                return res.status(200).json(Object.assign({ success: true }, data));
            }
        } catch (error) {
            next(error);
        }
    }

    async getSingleQuiz(req, res, next) {
        try {
            const data = await quizfantasyServices.getSingleQuiz(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: true }, data));
            } else {
                return res.status(200).json(Object.assign({ success: true }, data));
            }
        } catch (error) {
            next(error);
        }
    }
    async quizGiveAnswer(req, res, next) {
        try {
            const data = await quizfantasyServices.quizGiveAnswer(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: true }, data));
            } else {
                return res.status(200).json(Object.assign({ success: true }, data));
            }
        } catch (error) {
            next(error);
        }
    }

    async getAllNewContests(req, res, next) {
        try {
            const data = await quizfantasyServices.getAllNewContests(req);
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
    async quizGetMyTeams(req, res, next) {
        try {
            const data = await quizfantasyServices.quizGetMyTeams(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: true }, data));
            } else {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            }
        } catch (error) {
            next(error);
        }
    }
    async quizAnswerMatch(req, res, next) {
        try {
            const currentDate = moment().format('YYYY-MM-DD 00:00:00');
            const listmatches = await listMatchesModel.find({
                fantasy_type: "Cricket",
                start_date: { $gte: currentDate },
                launch_status: 'launched',
                final_status: { $nin: ['winnerdeclared','IsCanceled'] },
                status: { $ne: 'completed' },
            })
            let data;
            if (listmatches.length > 0) {
                for (let index of listmatches) {
                    let matchkey = index._id
                    // let userId = req.user._id
                     data = await quizfantasyServices.quizAnswerMatch(matchkey);
                }
            }
            if (data) {
                if (data.status === false) {
                    return res.status(200).json(Object.assign({ success: true }, data));
                } else {
                    return res.status(200).json(Object.assign({ success: data.status }, data));
                }
            }
        } catch (error) {
            console.log(error);
        }
    }
    // async quiz_refund_amount(req, res, next) {
    //     try {
            // const data = await quizfantasyServices.quiz_refund_amount(req);
    //         if (data.status === false) {
    //             return res.status(200).json(Object.assign({ success: true }, data));
    //         } else {
    //             return res.status(200).json(Object.assign({ success: data.status }, data));
    //         }
    //       } catch (error) {
    //         console.log('error',error);
    //      }
    // }
    async joinQuizContest(req, res, next) {
        try {
            const data = await quizfantasyServices.joinQuizContest(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            } else {
                return res.status(200).json(Object.assign({ success: true }, data));
            }
        } catch (error) {
            next(error);
        }
    }

    async getMyQuizJoinedContest(req, res, next) {
        try {
            const data = await quizfantasyServices.getMyQuizJoinedContest(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            } else {
                return res.status(200).json(Object.assign({ success: true }, data));
            }
        } catch (error) {
            next(error);
        }
    }
    async quizgetUsableBalance(req, res, next) {
        try {
            const data = await quizfantasyServices.quizgetUsableBalance(req);
            return res.status(200).json(Object.assign({ success: true }, data));
        } catch (error) {
            next(error);
        }
    }
    async joinQuiz(req, res, next) {
        try {
            const data = await quizfantasyServices.joinQuiz(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            } else {
                return res.status(200).json(Object.assign({ success: true }, data));
            }
        } catch (error) {
            console.log(error);
            next(error);
        }
    }
}
module.exports = new matchController();