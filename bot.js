function btcProfitable(shitcoinbtc, shitcoineth, ethbtc) {
  var ret = (shitcoinbtc["SELL"][0][0] / shitcoineth["BUY"][0][0]) / ethbtc["BUY"][0][0];
  console.log(ret);
  return ret;
}

const Kucoin = require('kucoin-api');
let kc = new Kucoin("REDACTED", "REDACTED");
var inData = false;
var btc = 0;
var eth = 0;

function checkBalances(cb) {
  kc.getBalance({symbol: 'BTC'}).then(function(res) {
    btc = res["data"]["balance"];
    kc.getBalance({symbol: 'ETH'}).then(function(res) {
      eth = res["data"]["balance"];
      cb();
    }).catch(console.error);
  }).catch(console.error);
}
function arbitrage() {
  setInterval(function() {
    if (!inData) {
      inData = true;
      kc.getOrderBooks({pair: 'PRL-BTC', limit: 1}).then(function(res){
        var prlbtc = res["data"];
        kc.getOrderBooks({pair: 'PRL-ETH', limit: 1}).then(function(res){
          var prleth = res["data"];
          kc.getOrderBooks({pair: 'ETH-BTC', limit: 1}).then(function(res) {
            var ethbtc = res["data"];
            if ((btcProfitable(prlbtc, prleth, ethbtc) + .0045) < 1.0 && btc > .001) {
              var min = Math.min(prlbtc["SELL"][0][2], prleth["BUY"][0][2] * ethbtc["BUY"][0][0], ethbtc["BUY"][0][2]);
              var amountprl = (((min > btc ? btc : min) * .2) / prlbtc["SELL"][0][0]) * .97;
              amountprl = amountprl.toFixed(4);
              if (amountprl > 1.0) {
                btc -= (min > btc ? btc : min);
                console.log(amountprl);
                kc.createOrder({pair: 'PRL-BTC', amount: amountprl, price: prlbtc["SELL"][0][0], type: 'BUY'}).then(function(res){
                  amountprl = amountprl - (amountprl * .0011);
                  amountprl = amountprl.toFixed(4);
                  console.log(amountprl);
                  kc.cancelOrder({pair: 'PRL-BTC', orderOid: res["data"]["orderOid"], type: 'BUY'}).then(function(res) {
                    setTimeout(function() {
                      kc.getBalance({symbol: 'PRL'}).then(function(res) {
                        var prl = (res["data"]["balance"] * .999).toFixed(4);
                        console.log(prl);
                        kc.createOrder({pair: 'PRL-ETH', amount: prl, price: .000001, type: 'SELL'}).then(function(res) {
                          var amounteth = (amountprl * prleth["BUY"][0][0]) * .999;
                          amounteth = amounteth.toFixed(6);
                          eth += amounteth;
                          checkBalances(function() {
                            inData = false;
                            console.log("TRADED");
                            console.log("BTC: " + btc);
                            console.log("ETH: " + eth);
                          });
                        }).catch(console.error);
                      }).catch(console.error);
                    }, 2000);
                  }).catch(function(res) {
                    if (res["msg"] == 'Order has been was dealed') setTimeout(function() {
                      kc.getBalance({symbol: 'PRL'}).then(function(res) {
                        var prl = (res["data"]["balance"] * .999).toFixed(4);
                        console.log(prl);
                        kc.createOrder({pair: 'PRL-ETH', amount: prl, price: .000001, type: 'SELL'}).then(function(res) {
                          var amounteth = (amountprl * prleth["BUY"][0][0]) * .999;
                          amounteth = amounteth.toFixed(6);
                          eth += amounteth;
                          checkBalances(function() {
                            inData = false;
                            console.log("TRADED");
                            console.log("BTC: " + btc);
                            console.log("ETH: " + eth);
                          });
                        }).catch(console.error);
                      }).catch(console.error);
                    }, 2000);
                  });
                }).catch(console.error);
              } else {
                inData = false;
                console.log("NOT ENOUGH PRL");
              }
            } else if ((btcProfitable(prlbtc, prleth, ethbtc) - .0045) > 1.0 && eth > .01) {
              var min = Math.min(prlbtc["SELL"][0][2] / ethbtc["SELL"][0][0], prleth["BUY"][0][2], ethbtc["BUY"][0][1]);
              var amountprl = (((min > eth ? eth : min) * .2) / prleth["SELL"][0][0]) * .97;
              amountprl = amountprl.toFixed(4);
              if (amountprl > 1.0) {
                eth -= (min > eth ? eth : min);
                console.log(amountprl);
                kc.createOrder({pair: 'PRL-ETH', amount: amountprl, price: prleth["SELL"][0][0], type: 'BUY'}).then(function(res){
                  amountprl = amountprl - (amountprl * .0011);
                  amountprl = amountprl.toFixed(4);
                  console.log(amountprl);
                  kc.cancelOrder({pair: 'PRL-ETH', orderOid: res["data"]["orderOid"], type: 'BUY'}).then(function(res){
                    setTimeout(function() {
                      kc.getBalance({symbol: 'PRL'}).then(function(res){
                        var prl = (res["data"]["balance"] * .999).toFixed(4);
                        console.log(prl);
                        kc.createOrder({pair: 'PRL-BTC', amount: prl, price: .000001, type: 'SELL'}).then(function(res) {
                          btc += (amountprl * prlbtc["BUY"][0][0]) * .999;
                          checkBalances(function() {
                            inData = false;
                            console.log("TRADED");
                            console.log("BTC: " + btc);
                            console.log("ETH: " + eth);
                          });
                        }).catch(console.error);
                      }).catch(console.error);
                    }, 2000);
                  }).catch(function(res){
                    if (res["msg"] == 'Order has been was dealed') setTimeout(function() {
                      kc.getBalance({symbol: 'PRL'}).then(function(res){
                        var prl = (res["data"]["balance"] * .999).toFixed(4);
                        console.log(prl);
                        kc.createOrder({pair: 'PRL-BTC', amount: prl, price: .000001, type: 'SELL'}).then(function(res) {
                          btc += (amountprl * prlbtc["BUY"][0][0]) * .999;
                          checkBalances(function() {
                            inData = false;
                            console.log("TRADED");
                            console.log("BTC: " + btc);
                            console.log("ETH: " + eth);
                          });
                        }).catch(console.error);
                      }).catch(console.error);
                    }, 2000);
                  });
                }).catch(console.error);
              } else {
                inData = false;
                console.log("NOT ENOUGH PRL");
              }
            } else {
              inData = false;
            }
          });
        });
      });
    }
  }, 1000);
}

kc.getBalance({symbol: 'BTC'}).then(function(res) {
  btc = res["data"]["balance"];
  kc.getBalance({symbol: 'ETH'}).then(function(res) {
    eth = res["data"]["balance"];
    console.log("BTC: " + btc);
    console.log("ETH: " + eth);
    arbitrage();
  }).catch(console.error);
}).catch(console.error);
