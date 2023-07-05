const express = require("express");

// coustimize the default console.log function 
console.logCopy = console.log.bind(console);
console.log = function (...data) {
    const currentDate = '[' + new Date().toString() + ']';
    this.logCopy(`${currentDate}-->`, ...data);
}

const app = express();

const { connectDB } = require("./src/db/dbconnection");
const constant = require('./src/config/const_credential');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { updatePlayersCount, saveCurrentPriceOfStock, updateResultOfMatches, botUserJoinTeamPercentage, botAutoClassicTeam,refund_amount, botAutoBattingTeam, botAutoBowlingTeam, botAutoReverseTeam, generateRandomPlayerClassic, generateRandomPlayerBatting, generateRandomPlayerBowling, generateRandomPlayerReverse, autoWinnerDeclared,series_leaderboard,overUpdateResultOfMatches ,quizPointCalculator, saveStocks, updateResultOfStocks,updateResultOfStocksQuiz} = require('./src/config/cronjob');
//overUpdateResultOfMatches
// overUpdateResultOfMatches.start();
// updatePlayerSelected.start();
saveCurrentPriceOfStock.start();

updateResultOfMatches.start();
// botUserJoinTeamPercentage.start();
botAutoClassicTeam.start();
// generateRandomPlayerClassic.start();
updatePlayersCount.start();
// series_leaderboard.start();
refund_amount.start();

//quiz point calculation
// quizPointCalculator.start();

updateResultOfStocks.start();

updateResultOfStocksQuiz.start();

saveStocks.start();
// ------------
// autoWinnerDeclared.start();
// botAutoBattingTeam.start();
// botAutoBowlingTeam.start();
// botAutoReverseTeam.start();
// generateRandomPlayerBatting.start();
// generateRandomPlayerBowling.start();
// generateRandomPlayerReverse.start();


// const adminRouter = require("./src/admin/routes/adminPanelRoute/route");
// app.use("/", adminRouter);

// const errorRoute = require("./src/admin/routes/adminPanelRoute/errorRoute");
// app.use(errorRoute);

const port = constant.CRON_PORT;
connectDB();
app.listen(port, () => {
    console.log(`server started on port ${port}`);
});