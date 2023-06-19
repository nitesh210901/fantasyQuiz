var KiteTicker = require("kiteconnect").KiteTicker;

var ticker = new KiteTicker({
  api_key: "74f8oggch3zuubyp",
  access_token: "Taw7foYNn0aVRGAQdMobYCRDxLA39kv4"
});
let globalData;
ticker.connect();
function test(result, allData) {
  globalData = allData;
  ticker.on("connect", subscribe(result, allData));
  return true;
}



function subscribe(req, allData) {
  var items = [req];
  ticker.subscribe(items);
  ticker.setMode(ticker.modeFull, items);
  ticker.on('ticks', onTicks);
}

async function onTicks (ticks) {
  console.log('++++++++++=',globalData)

  // console.log(ticks.map((e) => e.last_price));
}


module.exports = { subscribe, test };