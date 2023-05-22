const overResultServices = require("../services/overResultService");
class overResultController {
    constructor() {
      return {
        //sahil overfantasy
        overupdate_results_of_matches: this.overupdate_results_of_matches.bind(this)
      };
    }
    //sahil overfantsy
    async overupdate_results_of_matches(req, res, next) {
      try {console.log("overcontroller")
        const getResult = await overResultServices.overupdateResultMatches(req);
        res.json(getResult);
      } catch (error) {
        throw error;
      }
    }
}
module.exports = new overResultController();
  