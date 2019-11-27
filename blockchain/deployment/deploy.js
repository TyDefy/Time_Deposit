require('dotenv').config();

const simpleStorageABI = require('../build/simpleStorage.json');

DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

const etherlime = require('etherlime-lib');


const defaultConfigs = {
  chainId: 4,
  etherscanApiKey: process.env.ETHERSCAN_API_KEY,
};

const deploy = async (network, secret) => {
  if (!secret) {
    secret = DEPLOYER_PRIVATE_KEY;
  }
  if (!network) {
    network = 'local';
  }

  if (network === 'local') {
    const deployer = new etherlime.JSONRPCPrivateKeyDeployer(secret, 'http://localhost:8545/', defaultConfigs);

    const deploy = (...args) => deployer.deploy(...args);
    const simpleStorageInstance = await deploy(
      simpleStorageABI,
      false
    )
    const CONTRACT_ADDRESSES = `
    SIMPLE_STORAGE_ADDRESS=${simpleStorageInstance.contract.address}
      `;
    console.log(CONTRACT_ADDRESSES);
  }
};

module.exports = {
  deploy
};
