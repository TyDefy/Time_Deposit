const etherlime = require('etherlime-lib');
const ethers = require('ethers');
const BigNumber = require('bignumber.js');

let prtAbi = require('../build/PRT.json');

const prt_settings = {

}
module.exports = { 
    ethers,
    etherlime,
    BigNumber,
    prtAbi,
    prt_settings
}
