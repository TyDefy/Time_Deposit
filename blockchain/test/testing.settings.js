const etherlime = require('etherlime-lib');
const ethers = require('ethers');
const BigNumber = require('bignumber.js');

let basicPoolAbi = require('../build/BasicPool.json');
let cyclicWithdrawAbi = require('../build/CyclicWithdraw.json');
let penaltyAbi = require('../build/BasicPenalty.json');
let pDaiAbi = require('../build/pDai.json');
let cDaiAbi = require('../build/pcToken.json');
let basicRegistryAbi = require('../build/BasicRegistry.json');
let basicFactoryAbi = require('../build/BasicFactory.json');

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
        mintAmount: ethers.utils.parseUnits("10", 18),
        withdrawAmount: ethers.utils.parseUnits("425", 17),
        withdrawPenalty: ethers.utils.parseUnits("75", 17),
        withdrawAmountOn100: ethers.utils.parseUnits("85", 18),
        penaltyAmountOn100: ethers.utils.parseUnits("15", 18),
        penaltyAmountInCdai: "710569455138470517047",
        fee: 20,
        interestEarned: "2244038717306567",
        penaltyShare: "710569455138470517047",
        penaltyShareMinusFee: "568455564110776413638",
        penaltyShareMinusFeePlusInterest: "568457808149493720205",
        userCdaiBalanceWithPenalty: "5447699156061607297361"
    },
    pDaiSettings: {
        name: "pDai",
        symbol: "DAI",
        decimals: 18,
        mintAmount: "100000000000000000000000000",
        mintAmountMinusDeposit: "99999900000000000000000000",
        withdrawWithPenalty: "99999985000000000000000000",
        withdrawInterestBalancePenalty: "99999915000000000000000000",
        withdrawInterestBalance: "99999900000047371297009232",
        withdrawInterestPusPenaltyMinusFee: "99999912000053055852650340"
    },
    pcTokenSettings: {
        name: "cToken",
        symbol: "cDAI",
        decimals: 18,
        mintAmount: "4737129700923136780314",
        mintAmountMinusInterestPenalty: "4026560245784666263267",
        mintAmountMinusInterest: "4737127456884419473747",
        mintAmountMinusPenaltyInterestFee: "4168671892773643060109",
        interestRateYearly: "17989044278774400",
        exchangeIncrease: ethers.utils.parseUnits("100", 18)
    },
    registrySettings: {
        penalty: {
            name: "15% flat penalty",
            implementationType: "A flat rate fee of 15% of withdraw amount",
            type: 2
        },
        withdraw: {
            name: "Cyclic withdraw",
            implementationType: "Cyclic penalty withdraw",
            type: 1
        },
        pool: {
            name: "3 Month Savings Pool",
            description: "A short term savings commitment mechanism"
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
    basicFactoryAbi,
    test_settings
}
