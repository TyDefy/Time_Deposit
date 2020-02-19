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
        withdrawViolation: true,
        interestWithdrawViolation: true
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
        penaltyAmountInCdai: "71056945513",
        otherPenaltyAmountInCdai: "71056945514",
        fee: 20,
        interestEarned: "2244038717306567",
        otherInterestEarned: "1758334395",
        penaltyShare: "71056945512",
        penaltyShareMinusFee: "56845556411",
        otherPenaltyShareMinusFee: "58603666402",
        penaltyShareMinusFeePlusInterest: "224404",
        otherPenaltyShareMinusFeePlusInterest: "58603890806",
        userCdaiBalanceWithPenalty: "544769915604",
        earnedInterest: "224404",
        earnedInterestWithPenalty: "71057136257",
        fullBalanceWithInterest: "473713194496",
        fullBalanceWithInterestAndPenalty: "544770106349",
        penaltyInterest: "35528472756",
        penaltyPotAfterInterestWithdraw: "35528472757"
    },
    pDaiSettings: {
        name: "pDai",
        symbol: "DAI",
        decimals: 18,
        mintAmount: "100000000000000000000000000",
        mintAmountMinusDeposit: "99999900000000000000000000",
        withdrawWithPenalty: "99999985000000000000000000",
        withdrawInterestBalancePenalty: "99999914999999999610090535",
        withdrawInterestBalance: "99999900000047371324086683",
        otherWithdrawInterestBalance: "99999912371187252061701985",
        withdrawInterestPusPenaltyMinusFee: "99999912000053055652239429"
    },
    pcTokenSettings: {
        name: "cToken",
        symbol: "cDAI",
        decimals: 18,
        mintAmount: "473712970092",
        daiBalanceUnrounded: "99999999999999999933783102",
        depositBalanceUnrounded: "99999999999933783102",
        mintAmountMinusInterestPenalty: "473712970092",
        mintAmountMinusInterest: "473712745688",
        mintAmountMinusPenaltyInterestFee: "4168671892773643060109",
        otherMintAmountMinusPenaltyInterestFee: "473712745688",
        interestRateYearly: "17989044278774400",
        exchangeIncrease: ethers.utils.parseUnits("100", 18),
        roundingMargin: "66216898"
    },
    registrySettings: {
        penalty: {
            name: "15% flat penalty",
            implementationType: "A flat rate fee of 15% of withdraw amount",
            type: 3
        },
        withdraw: {
            name: "Cyclic withdraw",
            implementationType: "Cyclic penalty withdraw",
            type: 1
        },
        withdrawRolling: {
            name: "Cyclic withdraw",
            implementationType: "Cyclic penalty withdraw",
            type: 2
        },
        pool: {
            name: "3 Month Savings Pool",
            description: "A short term savings commitment mechanism",
            noFee: 0,
            fee: 15,
            invalidFee: 106
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
