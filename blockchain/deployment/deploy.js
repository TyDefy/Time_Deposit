require('dotenv').config();
DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

const etherlime = require('etherlime-lib');


const defaultConfigs = {
  chainId: 4,
  etherscanApiKey: process.env.ETHERSCAN_API_KEY,
};

const deploy = async (network, secret) => {
  if(!secret) {
    secret = DEPLOYER_PRIVATE_KEY;
  }
  if(!network) {
    network = 'rinkeby';
  }

  const deployer = new etherlime.InfuraPrivateKeyDeployer(secret, network, process.env.INFURA_API_KEY, defaultConfigs);
  // const deployer = new etherlime.JSONRPCPrivateKeyDeployer(secret, 'http://localhost:8545/', defaultConfigs);

  const deploy = (...args) => deployer.deployAndVerify(...args);


  const CONTRACT_ADDRESSES = ``;
  console.log(CONTRACT_ADDRESSES);
};

module.exports = {
  deploy
};
