function btcProfitable(shitcoinbtc, shitcoineth, ethbtc) {
  var ret = (shitcoinbtc["SELL"][0][0] / shitcoineth["BUY"][0][0]) / ethbtc["BUY"][0][0];
  console.log(ret);
  return ret;
}

const Kucoin = require('kucoin-api');
let kc = new Kucoin("5a582fb13b947c66994515c5", "9d007fd6-31cf-43b3-8399-53efd858db60");
var inData = false;
var btc = 0;
var eth = 0;


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
              var amountprl = ((min > btc ? btc : min) / prlbtc["SELL"][0][0]) * .97;
              amountprl = amountprl.toFixed(4);
              if (amountprl > 1.0) {
                btc -= (min > btc ? btc : min);
                console.log(amountprl);
                kc.createOrder({pair: 'PRL-BTC', amount: amountprl, price: prlbtc["SELL"][0][0], type: 'BUY'}).then(function(res){
                  amountprl = amountprl - (amountprl * .0011);
                  amountprl = amountprl.toFixed(4);
                  console.log(amountprl);
                  kc.cancelOrder({pair: 'PRL-BTC', txOid: res["data"]["orderOid"]}).then(function(res) {
                    setTimeout(function() {
                      kc.getBalance({symbol: 'PRL'}).then(function(res) {
                        kc.createOrder({pair: 'PRL-ETH', amount: amountprl, price: .000001, type: 'SELL'}).then(function(res) {
                          var amounteth = (amountprl * prleth["BUY"][0][0]) * .999;
                          amounteth = amounteth.toFixed(6);
                          eth += amounteth;
                          inData = false;
                          console.log("TRADED");
                          console.log("BTC: " + btc);
                          console.log("ETH: " + eth);
                        }).catch(console.error);
                      }).catch(console.error);
                    }, 1500);
                  }).catch(console.error);
                }).catch(console.error);
              } else {
                inData = false;
                console.log("NOT ENOUGH PRL");
              }
            } else if ((btcProfitable(prlbtc, prleth, ethbtc) - .0045) > 1.0 && eth > .01) {
              var min = Math.min(prlbtc["SELL"][0][2] / ethbtc["SELL"][0][0], prleth["BUY"][0][2], ethbtc["BUY"][0][1]);
              var amountprl = ((min > eth ? eth : min) / prleth["SELL"][0][0]) * .97;
              amountprl = amountprl.toFixed(4);
              if (amountprl > 1.0) {
                eth -= (min > eth ? eth : min);
                console.log(amountprl);
                kc.createOrder({pair: 'PRL-ETH', amount: amountprl, price: prleth["SELL"][0][0], type: 'BUY'}).then(function(res){
                  amountprl = amountprl - (amountprl * .0011);
                  amountprl = amountprl.toFixed(4);
                  console.log(amountprl);
                  kc.cancelOrder({pair: 'PRL-ETH', txOid: res["data"]["orderOid"]}).then(function(res){
                    setTimeout(function() {
                      kc.getBalance({symbol: 'PRL'}).then(function(res){
                        kc.createOrder({pair: 'PRL-BTC', amount: res["data"]["balance"], price: .000001, type: 'SELL'}).then(function(res) {
                          btc += (amountprl * prlbtc["BUY"][0][0]) * .999;
                          inData = false;
                          console.log("TRADED");
                          console.log("BTC: " + btc);
                          console.log("ETH: " + eth);
                        }).catch(console.error);
                      }).catch(console.error);
                    }, 1000);
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