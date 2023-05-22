const randomizePlayerSelectionClassic = require("../services/randomizePlayerSelectionClassic");
const listMatchesModel = require("../../models/listMatchesModel");
const moment = require('moment');

class RandomizePlayerSelection {
  constructor() {
    return {
      generateRandomPlayerClassic: this.generateRandomPlayerClassic.bind(this),
    };
  }

  async generateRandomPlayerClassic(req, res, next) {
    try {
      let today = moment().subtract('5', 'minutes').format("YYYY-MM-DD HH:mm:ss");
      const  matches = await listMatchesModel.find({ status: 'started', launch_status: 'launched', start_date: { $lte: today } });
      if (matches && Array.isArray(matches) && matches.length > 0) {
      
        let i = 0;
        for (let match of matches) {
          i++;
       
          let result = await randomizePlayerSelectionClassic.aggregationPipeline(
            match._id
          );
          // console.log("--result-------????24---------",result)
          const data = await randomizePlayerSelectionClassic.getCustomPlayers(
            result,
            match._id,
          );
        }
        // return res.status(200).json({ success: true });
      } else {
        console.log({ message: "No Match Found" });
        // return res.status(200).json({ success: false });
      }
    } catch (error) {
    
    }
  }
}

module.exports = new RandomizePlayerSelection();
