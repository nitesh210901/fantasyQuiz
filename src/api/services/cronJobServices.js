const mongoose = require('mongoose');
const moment = require('moment');

const listMatchesModel = require('../../models/listMatchesModel');
const matchPlayersModel = require('../../models/matchPlayersModel');
const JoinTeamModel = require('../../models/JoinTeamModel');
const Redis = require('../../utils/redis');
class CronJob {
    constructor() {
        return {
            // updatePlayerSelected: this.updatePlayerSelected.bind(this),
            updatePlayersCount:this.updatePlayersCount.bind(this)
        }
    }

    // async updatePlayerSelected(req, res, next) {
    //     try {
    //         let aggpipe = [];
    //         // let matchdata = await listMatchesModel.find({ start_date: moment().format("YYYY-MM-DD") }).populate({
    //         //     path: '_id',
    //         //     select: 'matchkey'
    //         // })
    //         aggpipe.push({
    //             $match: {
    //                 start_date: { $gte: moment().format("YYYY-MM-DD 00:00:00") },
    //                 status: 'notstarted',
    //                 launch_status: 'launched'
    //             }
    //         });
    //         aggpipe.push({
    //             $lookup: {
    //                 from: 'matchplayers',
    //                 let: { id: '$_id' },
    //                 pipeline: [{
    //                     $match: {
    //                         $expr: {
    //                             $eq: ['$$id', '$matchkey']
    //                         }
    //                     }
    //                 }, { $project: { playerid: 1 } }],
    //                 as: 'allplayers'
    //             }
    //         });
    //         let matchdata = await listMatchesModel.aggregate(aggpipe);
    //         let i = 0;
    //         for (let match of matchdata) {
    //             i++;
    //             for (let player of match.allplayers) {
    //                 let [totalSelected, captainSelected, vicecaptainSelected] = await Promise.all([
    //                     await JoinTeamModel.find({
    //                         matchkey: mongoose.Types.ObjectId(match._id),
    //                         players: { $in: [mongoose.Types.ObjectId(player.playerid)] }
    //                     }).count(),
    //                     await JoinTeamModel.find({
    //                         matchkey: mongoose.Types.ObjectId(match._id),
    //                         captain: mongoose.Types.ObjectId(player.playerid)
    //                     }).count(),
    //                     await JoinTeamModel.find({
    //                         matchkey: mongoose.Types.ObjectId(match._id),
    //                         vicecaptain: mongoose.Types.ObjectId(player.playerid)
    //                     }).count()
    //                 ]);
    //                 // console.log(totalSelected, '-----------', captainSelected, '------------------', vicecaptainSelected);
    //                 await matchPlayersModel.updateOne({ matchkey: mongoose.Types.ObjectId(match._id), playerid: mongoose.Types.ObjectId(player.playerid) }, { totalSelected, captainSelected, vicecaptainSelected });
    //             }
    //             // if (matchdata.length == i) {
    //             //     res.status(200).send('done');
    //             // }
    //         }
    //         // return res.send(matchdata);
    //         return true;
    //     } catch (error) {
    //         next(error);
    //     }
    // }
    async updatePlayersCount(req,res,next){
        try{
            let curTime = moment().format("YYYY-MM-DD HH:mm:ss");
            // {start_date:{$gte:curTime},status:"notstarted",launch_status:"launched"}
            const findmatchexist=await listMatchesModel.find({start_date:{$gte:curTime},status:"notstarted",launch_status:"launched"});
            // const findmatchexist=await listMatchesModel.find({_id:"63fd749179494aff832d5325"});
            if(findmatchexist.length > 0){
                for await(let matchexist of findmatchexist){
                    // console.log("----matchexist._id-----",matchexist._id)
                    let pipeline=[];
                    pipeline.push({
                        $match:{
                            "matchkey":mongoose.Types.ObjectId(matchexist._id)
                           }
                    },)
                    pipeline.push({
                        $project:{
                            "players":1,
                           }
                    },)
                    
                    pipeline.push({
                        $unwind:{
                            path: "$players",
                          }
                    },)
                    pipeline.push({
                        $group:{
                            _id: "$players",
                            player: {
                              $sum: 1
                            }
                          }
                    })
                    let pipeline2=[];
                    pipeline2.push({
                        $match:{
                            "matchkey":mongoose.Types.ObjectId(matchexist._id)
                           }
                    },)
                    pipeline2.push({
                        $project:{
                            "vicecaptain":1,
                           }
                    },)
                    pipeline2.push({
                        $group:{
                            _id: "$vicecaptain",
                            player: {
                              $sum: 1
                            }
                          }
                    })
                    let pipeline3=[];
                    pipeline3.push({
                        $match:{
                            "matchkey":mongoose.Types.ObjectId(matchexist._id)
                           }
                    },)
                    pipeline3.push({
                        $project:{
                            "captain":1,
                           }
                    },)
                    pipeline3.push({
                        $group:{
                            _id: "$captain",
                            player: {
                              $sum: 1
                            }
                          }
                    })
                    const player = await JoinTeamModel.aggregate(pipeline);
                    const totalTeam = await JoinTeamModel.find({ matchkey:matchexist._id });
                    // console.log('totalTeam-->',totalTeam);
                        if(player.length > 0){
                            for await(let key of player){
                                    let perc=((Number(key.player)/totalTeam.length)*100).toFixed(2);
                                    // console.log("--perc--",perc,"--totalTeam--",totalTeam.length,"--key.player--",key.player)
                               const add_count_player=await matchPlayersModel.findOneAndUpdate({playerid:key._id,matchkey:matchexist._id},{
                                        "totalSelected":Number(perc),
                                        "players_count":Number(key.player)
                                     });
                                // console.log("---add_count_player----",add_count_player)
                            }
                        }
                        const voiceCaptainData=await JoinTeamModel.aggregate(pipeline2);
                        if(voiceCaptainData.length > 0){
                            for await(let key of voiceCaptainData){
                                let perc=((Number(key.player)/totalTeam.length)*100).toFixed(2);
                                // console.log("-vicecaptain >>>----player---perc---",perc,"-----key.player,--",key.player,"---totalTeam.length----",totalTeam.length,"-----key._id--",key._id)
                                const vicecaptain_perce=await matchPlayersModel.updateOne({playerid:key._id,matchkey:matchexist._id},{
                                    $set:{
                                        vicecaptainSelected:perc
                                    }
                                })
                            }
                        }
                        const captainData=await JoinTeamModel.aggregate(pipeline3);
                        if(captainData.length > 0){
                            for await(let key of captainData){
                                let perc=((Number(key.player)/totalTeam.length)*100).toFixed(2);
                                // console.log("--captain>>>>---player---perc---",perc,"-----key.player,--",key.player,"---totalTeam.length----",totalTeam.length)
                                const captain_perce=await matchPlayersModel.updateOne({playerid:key._id,matchkey:matchexist._id},{
                                    $set:{
                                        captainSelected:perc
                                    }
                                })
                            }
                        }
                }
               
            }
            return 1;



        }catch(error){
            next(error)
        }
    }
}

module.exports = new CronJob();