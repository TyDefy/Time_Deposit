const etherlime = require('etherlime-lib');
const ethers = require('ethers');
const BigNumber = require('bignumber.js');

let cyclicWithdrawAbi = require('../build/CyclicWithdraw.json');

const test_settings = {
    cyclicWithdraw: {
        cycleLength: "1000",
        withdrawViolation: true
    }
}

module.exports = { 
    ethers,
    etherlime,
    BigNumber,
    cyclicWithdrawAbi,
    test_settings
}
