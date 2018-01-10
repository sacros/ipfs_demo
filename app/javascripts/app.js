import "../stylesheets/app.css";

import {
  default as Web3
} from 'web3';
import {
  default as contract
} from 'truffle-contract'

import hashstore_artifacts from '../../build/contracts/HashStore.json'

const IPFS = require('ipfs-mini');
const ipfs = new IPFS({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https'
});

var HashStore = contract(hashstore_artifacts);
var price;
var lastHashId;

function loadPrice() {
  HashStore.deployed().then(function (contractInstance) {
    contractInstance.price().then((result) => {
      price = result.toNumber();
      console.log("loadPrice updated: ",price);
    })
  });
}

function loadLastHashId() {
  HashStore.deployed().then(function (contractInstance) {
    contractInstance.lastHashId().then((result) => {
      lastHashId = result.toNumber();
      console.log("lastHashId updated: "+ lastHashId);      
    })
  })
}

window.yo1 = function () {
  console.log(price);
  var name = document.getElementById('inp1').value;
  var title = document.getElementById('inp2').value;
  var msg = document.getElementById('inp3').value;
  var final_data = {
    name,
    title,
    msg
  };
  console.log(final_data);
  ipfs.addJSON(final_data, (err, hash) => {
    if (err) {
      return console.log(err);
    }
    HashStore.deployed().then(function (contractInstance) {
      contractInstance.save(hash, {
        from: web3.eth.accounts[0],
        value: price,
        gas: 200000
      }).then((result) => {
        console.log('Data saved successfully, Tx:', result.tx);
        let log = result.logs[0];
        let hashId = log.args._hashId.toNumber();

        document.getElementById("ans1").innerHTML += "<p>hashID: " + hashId + "</p>";
      }).catch((err) => {
        console.error(err);
        alert(err.message, "error");
      });
    })
    lastHashId++;
    console.log("lastHashId updated: ", lastHashId);
    console.log("HASH:", hash);
    document.getElementById("ans1").innerHTML += "<p>Hash: " + hash + "</p>";
  });
}

window.yo2 = function () {
  var hashId = document.getElementById("inp4").value;
  console.log(hashId);
  HashStore.deployed().then(function (contractInstance) {
    contractInstance.find(hashId, {
      from: web3.eth.accounts[0]
    }).then((result) => {
      console.log(result);
      document.getElementById("ans2").innerHTML += "<p>sender: " + result[0] + "</p>" + "<p>hash: " + result[1] + "</p>";
      var hash = result[1];
      ipfs.catJSON(hash, (err, data) => {
        if (err) {
          console.log(err);
        }
        document.getElementById("ans2").innerHTML += "<p>data:" + JSON.stringify(data);
      });
    })
  })
}

window.yo3 = async function () {
  console.log("lastHashId is: ",lastHashId);

  try{for (var i = lastHashId; i > lastHashId - 5; i--) {
    let submission = await loadSubmission(i);
    console.log(submission);
    document.getElementById("ans3").innerHTML += "<p>Tx #" + i + "<br>" + "data:   " + JSON.stringify(submission);
  }}
  catch(err){
    console.error(err.message);
  }
}

function loadSubmission(hashId) {
    return new Promise((resolve, reject) => {
    console.log("Inside loadSubmission() with i= ",hashId);
    let submission = {};
    HashStore.deployed().then(function(contractInstance){
      contractInstance.find(hashId, {from: web3.eth.accounts[0]}).then((values) => {
        submission.sender = values[0];
        submission.hashContent = values[1];
        submission.timestamp = values[2].toNumber();
        submission.hashId = hashId;
        ipfs.catJSON(values[1], (err, data) => {
          if(err){
            console.log(err);
            return resolve(submission);
          }
          submission.title = data.title;
          submission.text = data.text;
          submission.fullName = data.fullName;
          resolve(submission);
        });
        
      }).catch((err) => {
        return reject(err);
      });
    });
  });
}

window.addEventListener('load', function () {
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://127.0.0.1:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));
    const ipfs = new IPFS({
      host: 'ipfs.infura.io',
      port: 5001,
      protocol: 'https'
    });
    this.setState({
      ipfs: ipfs
    });
  }

  HashStore.setProvider(web3.currentProvider);
  loadPrice();
  setTimeout(function(){ console.log("price loaded: "+ price) }, 3000);
  loadLastHashId();
  setTimeout(function(){ console.log("lastHashId loaded: "+ lastHashId) }, 3000);
});