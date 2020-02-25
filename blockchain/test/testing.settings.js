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
        penaltyAountinCdaiTwoUserWithdraw: "106585418269",
        poolBalanceWithOneUserAndPenalty: "544769915606",
        otherPenaltyAmountInCdai: "71056945514",
        fee: 20,
        interestEarned: "2244038717306567",
        otherInterestEarned: "1758334395",
        otherInterestEarned2Users: "17764236378",
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
        penaltyPotAfterInterestWithdraw: "35528472757",
        penShareAfterWithdraws: "53292709134",
        penShareAfterWithdrawsEarner: "79939063701",
        userBalanceIncDdaiAfterWithdraw: "236856485047",
        twoUsersFullAmount: "947425940184",
        twoUsersHalfAmount: "473712970092",
        penaltyBalances: {
            after2userWithdraws: "85268334616",
            after3userWithdraws: '26664668214'
        }
    },
    pDaiSettings: {
        name: "pDai",
        symbol: "DAI",
        decimals: 18,
        mintAmount: "100000000000000000000000000",
        mintAmountMinusDeposit: "99999900000000000000000000",
        withdrawWithPenalty: "99999985000000000000000000",
        partialWithdrawWithPeanlty: "99999942500000000000000000",
        withdrawInterestBalancePenalty: "99999914999999999610090535",
        otherWithdrawInterestBalancePenalty: "100000014999999999543873638",
        fullWithdrawBal: "100000012371134020304758204",
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
        daiBalanceAfterPartialWithdrawFinalWithdraw: "99999999999999999983035113",
        mintAmountMinusInterestPenalty: "473712970092",
        mintAmountMinusInterest: "473712745688",
        mintAmountMinusPenaltyInterestFee: "4168671892773643060109",
        otherMintAmountMinusPenaltyInterestFee: "473712745688",
        interestRateYearly: "17989044278774400",
        exchangeIncrease: ethers.utils.parseUnits("100", 18),
        roundingMargin: "66216898",
        poolBal: {
            poolBalAfterUser1Fullwithdraw: "284838236915",
            poolBalAfterFeeWithdraw: "263521153262",
        },
        poolBalanceAfterPartialWithdraw: "1219810897987",
        poolBalanceAfterPartialAndFullWithraw: "817154873409",
        poolBalanceAfterfinalWithdrawUser1: "272384957805",
        poolTotalBalAfter3Defposits: "1421138910276",
        poolTotalBalanceAfter1FullWithdraw: "1018482885698",
        adminFee: {
            oneFullWithdraw: "14211389102",
            oneFullOnePartial: "21317083653",
        }
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
