const matchServices = require('../services/matchServices');
const listMatchesModel = require('../../models/listMatchesModel');
class matchController {
    constructor() {
        return {
            getMatchList: this.getMatchList.bind(this),
            getAllSeries: this.getAllSeries.bind(this),
            update: this.update.bind(this),
            getMatchDetails: this.getMatchDetails.bind(this),
            getallplayers: this.getallplayers.bind(this),
            getallplayersopt:this.getallplayersopt.bind(this),
            getPlayerInfo: this.getPlayerInfo.bind(this),
            createMyTeam: this.createMyTeam.bind(this),
            getMyTeams: this.getMyTeams.bind(this),
            viewTeam: this.viewTeam.bind(this),
            Newjoinedmatches: this.Newjoinedmatches.bind(this),
            AllCompletedMatches: this.AllCompletedMatches.bind(this),
            getLiveScores: this.getLiveScores.bind(this),
            liveRanksLeaderboard: this.liveRanksLeaderboard.bind(this),
            fantasyScoreCards: this.fantasyScoreCards.bind(this),
            matchlivedata: this.matchlivedata.bind(this),
            NewjoinedmatchesLive:this.NewjoinedmatchesLive.bind(this),
            getAllPlayersWithPlayingStatus:this.getAllPlayersWithPlayingStatus.bind(this),
            joinTeamPlayerInfo:this.joinTeamPlayerInfo.bind(this),
            matchPlayerFantasyScoreCards: this.matchPlayerFantasyScoreCards.bind(this),
            //sahil apk download
            downloadApp:this.downloadApp.bind(this),
            phonepayapi:this.phonepayapi.bind(this),
            phonepayapiwithbase64:this.phonepayapiwithbase64.bind(this),
            phonepayapiwithcalling:this.phonepayapiwithcalling.bind(this)
        }
    }

    async getMatchList(req, res, next) {
        try {
            const upcomingMatches = await matchServices.getMatchList(req);
            // console.log(`upcomingMatches`, upcomingMatches);
            const joinedMatches = await matchServices.latestJoinedMatches(req);
            // console.log("joinedMatches_-----------------",joinedMatches)

            let final = {
                message: 'all match data',
                status: true,
                data: {
                    upcomingMatches,
                    joinedMatches
                }

            }
            return res.status(200).json(Object.assign({ success: true }, final));
        } catch (error) {
            console.log(error);
            next(error);
        }
    }
    async getAllSeries(req, res, next) {
        try {
            const data = await matchServices.getAllSeries(req);
            return res.status(200).json(Object.assign({ success: true }, data));
        } catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
        try {
            const data = await listMatchesModel.updateMany({}, { playing11_status: 0, order_status: 0 });
            return res.status(200).json(Object.assign({ success: true }, data));
        } catch (error) {
            next(error);
        }
    }
    async getMatchDetails(req, res, next) {
        try {
            const data = await matchServices.getMatchDetails(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            } else {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            }
        } catch (error) {
            next(error);
        }
    }

    async getallplayers(req, res, next) {
        try {
            const data = await matchServices.getallplayers(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            } else {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            }
        } catch (error) {
            next(error);
        }
    }
    async getallplayersopt(req, res, next) {
        try {
            const data = await matchServices.getallplayersopt(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            } else {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            }
        } catch (error) {
            next(error);
        }
    }
    // sahil apk code 
    async downloadApp(req, res, next) {
        try {
            const data = await matchServices.downloadApp(req,res);
            
            
        } catch (error) {
            next(error);
        }
    }
    // sahil apk code download

    async getPlayerInfo(req, res, next) {
        try {
            const data = await matchServices.getPlayerInfo(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            } else {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            }
        } catch (error) {
            next(error);
        }
    }

    async createMyTeam(req, res, next) {
        try {
            const data = await matchServices.createMyTeam(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            } else {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            }
        } catch (error) {
            next(error);
        }
    }
    //sahil phonepayapi now
    async phonepayapi(req, res, next) {
        
        try {
            const data = await matchServices.phonepayapi(req);
            console.log("data",data)
            return res.status(200).json(Object.assign({ success: data }));
        } catch (error) {
            next(error);
        }
        
        // try {
        //     const data = await matchServices.phonepayapi(req);
        //     if (data.status === false) {
        //         return res.status(200).json(Object.assign({ success: data.status }, data));
        //     } else {
        //         return res.status(200).json(Object.assign({ success: data.status }, data));
        //     }
        // } catch (error) {
        //     next(error);
        // }
    }
    async phonepayapiwithbase64(req, res, next) {
        
        try {
            const data = await matchServices.phonepayapiwithbase64(req);
            console.log("data",data)
            return res.status(200).json(Object.assign({ success: data }));
        } catch (error) {
            next(error);
        }
        
        // try {
        //     const data = await matchServices.phonepayapi(req);
        //     if (data.status === false) {
        //         return res.status(200).json(Object.assign({ success: data.status }, data));
        //     } else {
        //         return res.status(200).json(Object.assign({ success: data.status }, data));
        //     }
        // } catch (error) {
        //     next(error);
        // }
    }

    
    //sahil phonepayapi end
//phonepayapicalling
async phonepayapiwithcalling(req, res, next) {
        
    try {
        const data = await matchServices.phonepayapiwithcalling(req);
        console.log("data",data)
        return res.status(200).json(Object.assign({ success: data }));
    } catch (error) {
        next(error);
    }
    
    
}
//phonepayapicallingend

    async getMyTeams(req, res, next) {
        try {
            const data = await matchServices.getMyTeams(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: true }, data));
            } else {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            }
        } catch (error) {
            next(error);
        }
    }

    async viewTeam(req, res, next) {
        try {
            const data = await matchServices.viewTeam(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            } else {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            }
        } catch (error) {
            next(error);
        }
    }

    async Newjoinedmatches(req, res, next) {
        try {
            const data = await matchServices.Newjoinedmatches(req);
            return res.status(200).json(Object.assign({ success: true }, data));
        } catch (error) {
            console.log(error);
        }
    }

    async AllCompletedMatches(req, res, next) {
        try {
            const data = await matchServices.AllCompletedMatches(req);
            return res.status(200).json(Object.assign({ success: true }, data));
        } catch (error) {
            next(error);
        }
    }

    async getLiveScores(req, res, next) {
        try {
            const data = await matchServices.getLiveScores(req);
            return res.status(200).json(Object.assign({ success: true }, data));
        } catch (error) {
            next(error);
        }
    }

    async liveRanksLeaderboard(req, res, next) {
        try {
            const data = await matchServices.liveRanksLeaderboard(req);
            return res.status(200).json(Object.assign({ success: true }, data));
        } catch (error) {
            next(error);
        }
    }

    async fantasyScoreCards(req, res, next) {
        try {
            const data = await matchServices.fantasyScoreCards(req);
            return res.status(200).json(Object.assign({ success: true }, data));
        } catch (error) {
            next(error);
        }
    }
    async matchPlayerFantasyScoreCards(req, res, next) {
        try {console.log("hello")
            const data = await matchServices.matchPlayerFantasyScoreCards(req);
            return res.status(200).json(Object.assign({ success: true }, data));
        } catch (error) {
            next(error);
        }
    }
    async matchlivedata(req, res, next) {
        try {
            const data = await matchServices.matchlivedata(req);
            return res.status(200).json(Object.assign({ success: true }, data));
        } catch (error) {
            next(error);
        }
    }
    async NewjoinedmatchesLive(req,res,next){
        try{
            const data = await matchServices.NewjoinedmatchesLive(req);
            return res.status(200).json(Object.assign({ success: true }, data));

        }catch(error){
            next(error);
        }
    }
    async getAllPlayersWithPlayingStatus(req, res, next) {
        try {
            const data = await matchServices.getAllPlayersWithPlayingStatus(req);
            if (data.status === false) {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            } else {
                return res.status(200).json(Object.assign({ success: data.status }, data));
            }
        } catch (error) {
            next(error);
        }
    }
    async joinTeamPlayerInfo(req, res, next) {
        try {
            const data = await matchServices.joinTeamPlayerInfo(req);
            return res.status(200).json(Object.assign({ success: true }, data));
        } catch (error) {
            next(error);
        }
    }

}
module.exports = new matchController();