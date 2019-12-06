const etherlime = require('etherlime-lib');
const ethers = require('ethers');
const BigNumber = require('bignumber.js');

let basicPoolAbi = require('../build/BasicPool.json');
let cyclicWithdrawAbi = require('../build/CyclicWithdraw.json');
let penaltyAbi = require('../build/BasicPenalty.json');
let pDaiAbi = require('../build/pDai.json');
let cDaiAbi = require('../build/pcToken.json');

const test_settings = {
    cyclicWithdraw: {
        cycleLength: "10",
        withdrawViolation: true
    },
    penalty: {
        percentage: 15
    },
    basicPool: {
        deposit: ethers.utils.parseUnits("100", 18),
        withdraw: ethers.utils.parseUnits("50", 18),
        mintAmount: ethers.utils.parseUnits("10", 18)
    },
    pDaiSettings: {
        name: "pDai",
        symbol: "PDAI",
        decimals: 18,
        mintAmount: "100000000000000000000000000",
        mintAmountMinusDeposit: "99999900000000000000000000"
    },
    pcTokenSettings: {
        name: "pcToken",
        symbol: "PCT",
        decimals: 18
    }
}

module.exports = { 
    ethers,
    etherlime,
    BigNumber,
    basicPoolAbi,
    cyclicWithdrawAbi,
    penaltyAbi,
    pDaiAbi,
    cDaiAbi,
    test_settings
}
