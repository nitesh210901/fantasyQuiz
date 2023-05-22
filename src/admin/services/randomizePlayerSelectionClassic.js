const matchServices = require("./matchServices");
const listMatchesModel = require("../../models/listMatchesModel");
const joinLeagueModel = require("../../models/JoinLeaugeModel");
const matchPlayersModel = require("../../models/matchPlayersModel");
const mongoose = require("mongoose");
const JoinTeamModel = require("../../models/JoinTeamModel");

class RandomizePlayerSelection {
  constructor() {
    return {
      aggregationPipeline: this.aggregationPipeline.bind(this),
      getCustomPlayers: this.getCustomPlayers.bind(this),
    };
  }

  async aggregationPipeline(matchId) {
    try {
      console.log("----------------matchId------------",matchId)
      let pipe = [];
      const ListMatchesData = await listMatchesModel.findOne(
        {
          _id: mongoose.Types.ObjectId(matchId),
        },
        { team1Id: 1, team2Id: 1, _id: 0 }
      );
      // console.log("---ListMatchesData---",ListMatchesData)
      pipe.push({
        $match: {
          matchkey: mongoose.Types.ObjectId(matchId),
          playingstatus: 1,
        },
      });
      pipe.push({
        $lookup: {
          from: "players",
          let: { playerId: "$playerid" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$_id", "$$playerId"] }],
                },
              },
            },
            {
              $project: {
                _id: 0,
                team: {
                  $cond: [
                    {
                      $eq: [
                        "$team",
                        mongoose.Types.ObjectId(`${ListMatchesData.team1Id}`),
                      ],
                    },
                    "team1",
                    "team2",
                  ],
                },
              },
            },
          ],
          as: "team",
        },
      });
      pipe.push({
        $unwind: "$team",
      });
      pipe.push({
        $addFields: {
          team: "$team.team",
        },
      });
      pipe.push({
        $group: {
          _id: "$role",
          player: { $push: "$$ROOT" },
        },
      });
      const data = await matchPlayersModel.aggregate(pipe);
      return data;
    } catch (e) {
      throw e;
    }
  }

  async LimitData(array, limit, role) {
    try {
      // console.log("----array, limit, role-----",array, limit, role)
      let data;
      if (array && Array.isArray(array) && array.length > 0) {
        data = array.find((doc) => doc._id === role);
        // console.log("---data------limitData--",data);
        if(data != undefined){
        data.player.sort((a, b) => {
          return b.points - a.points;
        });
      }
        if (role == "allrounder") {
          if(data != undefined && data){
          return {
            player: [data.player[0]],
            rest: data.player.slice(1, data.player.length),
          };
        }
        }
        if (role == "keeper") {
          if(data != undefined && data){
          return {
            player: [data.player[0]],
            rest: data.player.slice(1, data.player.length),
          };
        }
        }
        if (role == "bowler") {
          if(data != undefined && data){
          return {
            player: [data.player[0], data.player[1], data.player[2]],
            rest: data.player.slice(3, data.player.length),
          };
        }
        }
        if (role == "batsman") {
          if(data != undefined && data){
          return {
            player: [data.player[0], data.player[1], data.player[2]],
            rest: data.player.slice(3, data.player.length),
          };
        }
        }
      }
    } catch (e) {
      throw e;
    }
  }

  async generateNewrandomPlayers(matchkey, data) {
    try {
      const role = {
        bowl: "bowler",
        bat: "batsman",
        all: "allrounder",
        wk: "keeper",
      };

      let keeper = 1,
        batsman = 3,
        allrounder = 1,
        bowler = 3;
      let allReamingPlayer = [];
      if (data && Array.isArray(data) && data.length > 0) {
        let getPlayers = [];
        if (role.all) {
          let rolePlayers = await this.LimitData(data, allrounder, role.all);
          allReamingPlayer = [...allReamingPlayer, ...rolePlayers.rest];
          getPlayers = [...getPlayers, ...rolePlayers.player];
        }
        if (role.bat) {
          let rolePlayers = await this.LimitData(data, batsman, role.bat);
          allReamingPlayer = [...allReamingPlayer, ...rolePlayers.rest];
          getPlayers = [...getPlayers, ...rolePlayers.player];
        }
        if (role.wk) {
          let rolePlayers = await this.LimitData(data, keeper, role.wk);
          allReamingPlayer = [...allReamingPlayer, ...rolePlayers.rest];
          getPlayers = [...getPlayers, ...rolePlayers.player];
        }
        if (role.bowl) {
          let rolePlayers = await this.LimitData(data, bowler, role.bowl);
          allReamingPlayer = [...allReamingPlayer, ...rolePlayers.rest];
          getPlayers = [...getPlayers, ...rolePlayers.player];
        }
        // console.log("------getPlayers.length--",getPlayers)
        if (getPlayers && Array.isArray(getPlayers) && getPlayers.length > 0) {
          if (getPlayers.length > 8){
            console.log("---------gebn--------",data)
            return await this.generateNewrandomPlayers(matchkey, data);
          }else {
            return {
              message: "Random Players",
              status: true,
              length: getPlayers.length,
              data: getPlayers,
              allReamingPlayer: allReamingPlayer,
            };
          }
        }
      }
      else{
        return {
          message: "Random Players",
          status: false,
          length: 0,
          data: [],
          allReamingPlayer: [],
        };
      }
    } catch (e) {
      throw e;
    }
  }

  getRandomData(min, max) {
    const randomElement = Math.floor(Math.random() * (max - min + 1) + min);
    return randomElement;
  }

  createShuffledData(arr) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());

    return shuffled;
  }

  async getCustomPlayers(data, matchkey) {
    let t1 = [],
      t2 = [],
      team1 = [],
      team2 = [],
      cap,
      vc;
// console.log("---ata, matchkey, ---201-------",data, matchkey)
    const randomData = await this.generateNewrandomPlayers(matchkey, data);
    // console.log("---randomData-->>>>>>>>-----",randomData)
    const { data: teamPlayer, allReamingPlayer } = await randomData;
    teamPlayer.map((itm) => {
      if (itm.team === "team1") t1.push(itm.playerid);
      else t2.push(itm.playerid);
    });

    allReamingPlayer.map((itm) => {
      if (itm.team === "team1") team1.push(itm.playerid);
      else team2.push(itm.playerid);
    });

    let finalTeams = [];

    const joinTeamsDataBasedOnUserType = await JoinTeamModel.find({
      user_type: 1,
      matchkey: matchkey,
      is_viewed: false,
    });
    const updateData = async () => {
      let team1RemaingCount =
        team1.length > t1.length
          ? team1.length - t1.length
          : t1.length - team1.length;
      let team2RemaingCount =
        team2.length > t2.length
          ? team2.length - t2.length
          : t2.length - team2.length;

      let diff = 0;
      if (team1RemaingCount > 3 && team2RemaingCount > 3) {
        diff =
          team1RemaingCount > team2RemaingCount
            ? team1RemaingCount - team2RemaingCount
            : team2RemaingCount - team1RemaingCount;
      } else if (team1RemaingCount > 3) {
        diff = team2RemaingCount;
      } else if (team2RemaingCount > 3) {
        diff = team1RemaingCount;
      }

      const commonCount = this.getRandomData(0, diff); //1
      const newCount = 3 - commonCount;
      const returnRandomNumber = () => {
        let randomNumber = this.getRandomData(0, 1);
        let randomNumber1 = this.getRandomData(0, 1);


        if (randomNumber !== randomNumber1) {
          return { randomNumber, randomNumber1 };
        }
        return returnRandomNumber();
      };

      const { randomNumber, randomNumber1 } = returnRandomNumber();
      // console.log('randomNumber, randomNumber1 ', randomNumber, randomNumber1);
      cap = teamPlayer[randomNumber].playerid.toString();
      vc = teamPlayer[randomNumber1].playerid.toString();

      const team1ShuffledData = this.createShuffledData(team1).slice(
        0,
        commonCount
      );
      const team2ShuffledData = this.createShuffledData(team2).slice(
        0,
        newCount
      );

      let finalTeam = {
        players: [...team1ShuffledData, ...team2ShuffledData, ...t1, ...t2],
        playersArray: [
          ...team1ShuffledData,
          ...team2ShuffledData,
          ...t1,
          ...t2,
        ].join(","),
        captain: cap,
        vicecaptain: vc,
      };
      const joinTeamsDataBasedOnUserType = await JoinTeamModel.findOne({
        user_type: 1,
        players: { $eq: finalTeam.players },
        captain: { $eq: finalTeam.captain },
        vicecaptain: { $eq: finalTeam.vicecaptain },
        is_viewed: false,
      });
      if (joinTeamsDataBasedOnUserType) return updateData();

      return finalTeam;
    };
    let updateTeam = [];
    for (let itm of joinTeamsDataBasedOnUserType) {
      const teams = await updateData();
      const updateTeamData = await JoinTeamModel.findOneAndUpdate(
        {
          _id: itm._id,
        },
        teams
      );
      updateTeam.push({ teams, updateTeamData });
      // updateTeam.push({ teams });
    }
    return {
      updateTeam,
    };
  }
}

module.exports = new RandomizePlayerSelection();
