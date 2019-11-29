const etherlime = require('etherlime-lib');
const ethers = require('ethers');
const BigNumber = require('bignumber.js');

let basicPoolAbi = require('../build/BasicPool.json');
let cyclicWithdrawAbi = require('../build/CyclicWithdraw.json');

const test_settings = {
    cyclicWithdraw: {
        cycleLength: "1000",
        withdrawViolation: true
    },
    basicPool: {
        deposit: 100,
        withdraw: 50
    }
}

module.exports = { 
    ethers,
    etherlime,
    BigNumber,
    basicPoolAbi,
    cyclicWithdrawAbi,
    test_settings
}
