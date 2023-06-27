const { default: axios } = require("axios")
const mongoose=require("mongoose");
const listMatchModel = require("../../models/listMatchesModel");
const teamModel = require("../../models/teamModel");
const seriesModel = require("../../models/addSeriesModel");
const playersModel = require("../../models/playerModel");
const matchPlayersModel = require("../../models/matchPlayersModel");
const moment = require('moment');
const status = {
    1: 'notstarted',
    2: 'completed',
    3: 'started',
    4: 'completed'
}
const format = {
    1: 'one-day',
    2: 'test',
    3: 't20',
    4: 'one-day',
    5: 'test',
    6: 't20',
    7: 'one-day',
    8: 't20',
    9: 'one-day',
    10: 't20',
    17: 't10',
    18: 'the-hundred',
    19: 'the-hundred'
}
const toss_decision = {
    0: null,
    1: 'batting',
    2: 'bowling'
}
const role = {
    'bowl': 'bowler',
    'bat': 'batsman',
    'all': 'allrounder',
    'wk': 'keeper',
    'wkbat': 'keeper',
    'cap': 'allrounder',
    'squad': 'allrounder',
}
class cricketApiController {
    constructor() {
        return {
            listOfMatches: this.listOfMatches.bind(this),
            listOfMatches_entity: this.listOfMatches_entity.bind(this),
            fetchPlayerByMatch_entity: this.fetchPlayerByMatch_entity.bind(this),
            getmatchscore: this.getmatchscore.bind(this),
            //child_fetchPlayerByMatch_entity: this.child_fetchPlayerByMatch_entity.bind(this)
            overData:this.overData.bind(this)
        }
    }
    listOfMatches(req, res) {
        try {
            let url = `https://rest.entitysport.com/v2/matches/?status=1&token=511e8069b2d704bb93a126ac44c13cbd&per_page=70&&paged=1`
            axios.get(url).then(async(result) => {
                this.newMethod(result);
            });
            res.send({ success: true });
        } catch (error) {
            // console.log(error)
            req.flash('error','something is wrong please try again letter');
            res.redirect('/');
        }
    }


    newMethod(result) {
        for (let obkey1 of Object.values(result.data)) {
            obkey1.matches.flatMap(async(Obj) => {
                // console.log("x..........",Obj)
                const checkMatchkey = await listMatchModel.find({ real_matchkey: Obj.matchkey });
                if (checkMatchkey.length == 0) {
                    let url= `http://rest.entitysport.com/v2/matches/${Obj.matchkey}/info?token=511e8069b2d704bb93a126ac44c13cbd`
                    await axios.get(url).then(async(matchData) => {
                        let matchDATA = JSON.parse(matchData.data.matchdata);
                        if (matchDATA) {
                            if (moment(moment(matchDATA.data.card.start_date.iso).format()).isAfter(moment().format())) {
                                let insertTeam1 = new teamModel({
                                    fantasy_type: 'Cricket',
                                    teamName: matchDATA.data.card.teams.a.name,
                                    team_key: matchDATA.data.card.teams.a.key,
                                    short_name: matchDATA.data.card.teams.a.short_name
                                });
                                let temaData1 = await insertTeam1.save();
                                let insertTeam2 = new teamModel({
                                    fantasy_type: 'Cricket',
                                    teamName: matchDATA.data.card.teams.b.name,
                                    team_key: matchDATA.data.card.teams.b.key,
                                    short_name: matchDATA.data.card.teams.a.short_name
                                });
                                let temaData2 = await insertTeam2.save();

                                let insertListmatch = new listMatchModel({
                                    fantasy_type: 'Cricket',
                                    name: matchDATA.data.card.name,
                                    team1Id: temaData1._id,
                                    team2Id: temaData2._id,
                                    real_matchkey: matchDATA.data.card.key,
                                    start_date: moment(matchDATA.data.card.start_date.iso).format('YYYY-MM-DD hh:mm:ss'),
                                    status: matchDATA.data.card.status,
                                    format: matchDATA.data.card.format,
                                    launch_status: 'pending',
                                    final_status: 'pending',
                                    status_overview: matchDATA.data.card.status_overview,
                                });
                                let insertMatchList = await insertListmatch.save();

                            }
                        }

                    });
                } else {
                    let url= `http://rest.entitysport.com/v2/matches/${Obj.matchkey}/info?token=511e8069b2d704bb93a126ac44c13cbd`
                    await axios.get(url).then(async(matchData) => {
                        let matchDATA = JSON.parse(matchData.data.matchdata);
                        if (matchDATA) {
                            if (moment(moment(matchDATA.data.card.start_date.iso).format()).isAfter(moment().format())) {
                                let insertTeam1 = new teamModel({
                                    fantasy_type: 'Cricket',
                                    teamName: matchDATA.data.card.teams.a.name,
                                    team_key: matchDATA.data.card.teams.a.key,
                                    short_name: matchDATA.data.card.teams.a.short_name
                                });
                                let temaData1 = await insertTeam1.save();
                                let insertTeam2 = new teamModel({
                                    fantasy_type: 'Cricket',
                                    teamName: matchDATA.data.card.teams.b.name,
                                    team_key: matchDATA.data.card.teams.b.key,
                                    short_name: matchDATA.data.card.teams.a.short_name
                                });
                                let temaData2 = await insertTeam2.save();
                                const updateListMatch = await listMatchModel.findOneAndUpdate({ real_matchkey: matchDATA.data.card.key }, {
                                    $set: {
                                        name: matchDATA.data.card.name,
                                        team1Id: temaData1._id,
                                        team2Id: temaData2._id,
                                        start_date: moment(matchDATA.data.card.start_date.iso).format('YYYY-MM-DD HH:mm:ss'),
                                        status: matchDATA.data.card.status,
                                        format: matchDATA.data.card.format,
                                        status_overview: matchDATA.data.card.status_overview,
                                    }
                                });

                            }
                        }


                    })

                }
            });


        }
    }
    async listOfMatches_entity(req, res) {
        try {
            let pageno = 1;
            let url = `https://rest.entitysport.com/v2/matches/?status=1&token=511e8069b2d704bb93a126ac44c13cbd&per_page=70&&paged=1`;
                axios.get(url).then(async(matchData) => {
                // console.log('matchData.response-->',matchData.data.response)
                await this.child_listOfMatches_entity(matchData.data.response.items);
                res.redirect('/view_AllUpcomingMatches');
            })
        } catch (error) {
            console.log('error',error)
            next(error);
        }
    }

    async child_listOfMatches_entity(items) {
        for (let mymatch of items) {
            // let mymatch= JSON.parse(match.matchdata);
            const checkMatchkey = await listMatchModel.find({ real_matchkey:mymatch.match_id });
            if (checkMatchkey.length == 0) {
                if (moment(moment(mymatch.date_start_ist).format()).isAfter(moment().format())) {
                    let temaData1, temaData2, series;
                    if (await teamModel.findOne({ team_key:mymatch.teama.team_id })) {
                        temaData1 = await teamModel.findOneAndUpdate({ team_key:mymatch.teama.team_id }, {
                            $set: {
                                teamName:mymatch.teama.name,
                                short_name:mymatch.teama.short_name,
                               
                            }
                        }, { new: true });
                    } else {
                        let insertTeam1 = new teamModel({
                            fantasy_type: 'Cricket',
                            teamName:mymatch.teama.name,
                            team_key:mymatch.teama.team_id,
                            short_name:mymatch.teama.short_name,
                           
                        });
                        temaData1 = await insertTeam1.save();
                    }

                    if (await teamModel.findOne({ team_key:mymatch.teamb.team_id })) {
                        temaData2 = await teamModel.findOneAndUpdate({ team_key:mymatch.teamb.team_id }, {
                            $set: {
                                teamName:mymatch.teamb.name,
                                short_name:mymatch.teamb.short_name,
                               
                            }
                        }, { new: true });
                    } else {
                        let insertTeam2 = new teamModel({
                            fantasy_type: 'Cricket',
                            teamName:mymatch.teamb.name,
                            team_key:mymatch.teamb.team_id,
                            short_name:mymatch.teamb.short_name,
                           
                        });
                        temaData2 = await insertTeam2.save();
                    }
                    let insertListmatch = new listMatchModel({
                        fantasy_type: 'Cricket',
                        name:mymatch.title,
                        //short_name:mymatch.short_title,
                        team1Id: temaData1._id,
                        team2Id: temaData2._id,
                        // series: series._id,
                        real_matchkey:mymatch.match_id,
                        start_date:mymatch.date_start_ist,
                        status: status[mymatch.status],
                        format: format[mymatch.format],
                        launch_status: 'pending',
                        final_status: 'pending',
                        tosswinner_team:mymatch.toss.winner != 0 ?mymatch.toss.winner : null,
                        toss_decision: toss_decision[mymatch.toss.decision],
                    });
                    let insertMatchList = await insertListmatch.save();
                }
            } else {
                if (moment(moment(mymatch.date_start_ist).format()).isAfter(moment().format())) {
                    let temaData1, temaData2, series;
                    if (await teamModel.findOne({ team_key:mymatch.teama.team_id })) {
                        temaData1 = await teamModel.findOneAndUpdate({ team_key:mymatch.teama.team_id }, {
                            $set: {
                                teamName:mymatch.teama.name,
                                short_name:mymatch.teama.short_name,
                               
                            }
                        }, { new: true });
                    } else {
                        let insertTeam1 = new teamModel({
                            fantasy_type: 'Cricket',
                            teamName:mymatch.teama.name,
                            team_key:mymatch.teama.team_id,
                           short_name:mymatch.teama.short_name,
                           
                        });
                        temaData1 = await insertTeam1.save();
                    }

                    if (await teamModel.findOne({ team_key:mymatch.teamb.team_id })) {
                        temaData2 = await teamModel.findOneAndUpdate({ team_key:mymatch.teamb.team_id }, {
                            $set: {
                                teamName:mymatch.teamb.name,
                                short_name:mymatch.teamb.short_name,
                               
                            }
                        }, { new: true });
                    } else {
                        let insertTeam2 = new teamModel({
                            fantasy_type: 'Cricket',
                            teamName:mymatch.teamb.name,
                            team_key:mymatch.teamb.team_id,
                           short_name:mymatch.teamb.short_name,
                           
                        });
                        temaData2 = await insertTeam2.save();
                    }
                    const updateListMatch = await listMatchModel.findOneAndUpdate({ real_matchkey:mymatch.match_id }, {
                        $set: {
                            name:mymatch.title,
                            short_name:mymatch.short_title,
                            team1Id: temaData1._id,
                            team2Id: temaData2._id,
                            real_matchkey:mymatch.match_id,
                            start_date:mymatch.date_start_ist,
                            tosswinner_team:mymatch.toss.winner != 0 ?mymatch.toss.winner : null,
                            toss_decision: toss_decision[mymatch.toss.decision],
                        }
                    }, { new: true });
                }
            }
        }
    }
    fetchPlayerByMatch_entity(req, res) {
        try {
          axios.get(
                `http://rest.entitysport.com/v2/matches/${req.params.matchkey}/squads?token=1&token=511e8069b2d704bb93a126ac44c13cbd`
              ).then(async (matchData) => {
                if(matchData.data)
                {
                    let listmatch = await listMatchModel.findOne({
                        real_matchkey: req.params.matchkey,
                    });
                    
                await this.child_fetchPlayerByMatch_entity(
                    matchData.data,
                    listmatch._id,
                    req.params.matchkey
                );
                  res.redirect(`/launch-match/${listmatch._id}`);
                }
              });


        } catch (error) {
        
        }
      }
    
       async child_fetchPlayerByMatch_entity(myresponse, matchkey,real_matchkey) {
        // let lastresponse=JSON.parse(myresponse.playersdata);
        let response=myresponse.response;
        if(response['teama'].squads.length==0){
            return false;
        }
        
        let team1Id = response.teama.team_id;
        let team2Id = response.teamb.team_id;
        let data = await Promise.all([
            this.importPlayer(team1Id, response, matchkey, 'teama'),
            this.importPlayer(team2Id, response, matchkey, 'teamb'),
        ]);
    }
    async importPlayer(teamId, response, matchkey, team) {
        let teamDAta = await teamModel.findOne({ team_key: teamId });
        if (teamDAta) {
            for (let player of response[team].squads) {
                let playerTeam = await playersModel.findOne({ players_key: player.player_id,team: teamDAta._id  });
        
                let checkPlayersKey = response['players'].find(o => o.pid == player.player_id);
                let player_role = (role[checkPlayersKey.playing_role]) ? role[checkPlayersKey.playing_role] : 'allrounder';
                if (playerTeam) {
                    player_role = playerTeam.role;
                    if (!await matchPlayersModel.findOne({ playerid: playerTeam._id, matchkey })) {
                        let matchPlayerData = new matchPlayersModel({
                            matchkey: matchkey,
                            playerid: playerTeam._id,
                            credit: playerTeam.credit,
                            name: player.name,
                            role: player_role,
                            legal_name: player.name

                        });
                        let insmatchPlayerData = await matchPlayerData.save();
                    }
                } else {
                    let playerData = new playersModel({
                        fantasy_type: 'Cricket',
                        player_name: player.name,
                        players_key: player.player_id,
                        team: teamDAta._id,
                        role: player_role,
                        fullname: player.name,
                    })
                    let insertPlayer = await playerData.save();

                    let matchPlayerData = new matchPlayersModel({
                        matchkey: matchkey,
                        playerid: insertPlayer._id,
                        credit: insertPlayer.credit,
                        name: player.name,
                        role: player_role,
                        legal_name: player.name

                    })
                    let insmatchPlayerData = await matchPlayerData.save();
                }

            }
        }
    }
    
    async getmatchscore(real_matchkey) {
        try {
            let matchData = await axios.get(`http://rest.entitysport.com/v2/matches/${real_matchkey}/scorecard?token=1&token=511e8069b2d704bb93a126ac44c13cbd`);
            return matchData.data.response;
        } catch (error) {
        }
    }
    async overData(real_matchkey,inning) {
        try {
            let matchData = await axios.get(`https://rest.entitysport.com/v2/matches/${real_matchkey}/innings/${inning}/commentary?token=511e8069b2d704bb93a126ac44c13cbd`);
            return matchData;
            
        } catch (error) {
        }
    }
   
}
module.exports = new cricketApiController();