const etherlime = require('etherlime-lib');
const ethers = require('ethers');
const BigNumber = require('bignumber.js');

let basicPoolAbi = require('../build/BasicPool.json');
let cyclicWithdrawAbi = require('../build/CyclicWithdraw.json');
let penaltyAbi = require('../build/BasicPenalty.json');
let pDaiAbi = require('../build/pDai.json');
let cDaiAbi = require('../build/pcToken.json');
let basicRegistryAbi = require('../build/BasicRegistry.json');

const test_settings = {
    cyclicWithdraw: {
        cycleLength: "1",
        withdrawViolation: true
    },
    penalty: {
        percentage: 15
    },
    basicPool: {
        deposit: ethers.utils.parseUnits("100", 18),
        withdraw: ethers.utils.parseUnits("50", 18),
        mintAmount: ethers.utils.parseUnits("10", 18),
        withdrawAmount: ethers.utils.parseUnits("425", 17),
        withdrawPenalty: ethers.utils.parseUnits("75", 17)
    },
    pDaiSettings: {
        name: "pDai",
        symbol: "PDAI",
        decimals: 18,
        mintAmount: "100000000000000000000000000",
        mintAmountMinusDeposit: "99999900000000000000000000",
    },
    pcTokenSettings: {
        name: "pcToken",
        symbol: "PCT",
        decimals: 18,
        mintAmount: "4737129700923136780314"
    },
    registrySettings: {
        penalty: {
            name: "Basic fixed penalty",
            implementationType: "Fixed percentage penalty",
            type: 2
        },
        withdraw: {
            name: "Cyclic withdraw",
            implementationType: "Cyclic penalty withdraw",
            type: 1
        },
        pool: {
            name: "3 Month Savings Pool"
        }
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
    basicRegistryAbi,
    test_settings
}
