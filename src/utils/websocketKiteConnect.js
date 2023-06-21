var KiteTicker = require("kiteconnect").KiteTicker;

var ticker = new KiteTicker({
  api_key: "74f8oggch3zuubyp",
  access_token: "EJmQMyd34V2jcMrpTS4aQVH7Kfnh4lP6"
});
let globalData;
ticker.connect();

function test(result, allData) {
  console.log(allData)
  globalData = allData;
  ticker.on("connect", subscribe(result, allData));
  return true;
}



function subscribe(req, obj) {
  for (let i of obj)
  {var items = i;
  ticker.subscribe(items);
  ticker.setMode(ticker.q, items);
  ticker.on('ticks', onTicks.bind({allData:obj}));}
}



async function onTicks (ticks) {
  console.log(ticks)
  // console.log(this.allData)
  // let team_A_Last_price = ticks[0]?.last_price;
  // let team_A_OpenPrice = ticks[0]?.ohlc.open;
  // let team_B_Last_price = ticks[1]?.last_price;
  // let team_B_OpenPrice = ticks[1]?.ohlc.open;
  // let team_A_percentage = globalData[0];
  // let team_B_percentage = globalData[3];
  // let investedPrice = +globalData[2];
  let  t= []
for (let i of ticks)
{
  t.push(i.instrument_token)
}
  console.log(t)
  // let finalValueOfTeamA = investedPrice * team_A_Last_price/team_A_OpenPrice;
  // let finalValueOfTeamB = investedPrice * team_B_Last_price/team_B_OpenPrice;

  // console.log(finalValueOfTeamA , finalValueOfTeamB)
}



module.exports = { subscribe, test };