var KiteTicker = require("kiteconnect").KiteTicker;
var ticker = new KiteTicker({
  api_key: "fyp6vl0zg8uhway6",
  access_token: "access_token",
});

ticker.connect();
ticker.on("ticks", onTicks);
ticker.on("connect", subscribe);

function onTicks(ticks) {
  console.log("Ticks", ticks);
}

function subscribe() {
  var items = [738561];
  ticker.subscribe(items);
  ticker.setMode(ticker.modeFull, items);
}