require('dotenv').config();

const poolRegistryABI = require('../build/BasicRegistry.json');

let DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

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

  const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS;

  if (network === 'local') {
    const deployer = new etherlime.JSONRPCPrivateKeyDeployer(secret, 'http://localhost:8545/', defaultConfigs);

    const deploy = (...args) => deployer.deploy(...args);
    const poolRegistryInstance = await deploy(
      poolRegistryABI,
      false,
      ADMIN_ADDRESS
    )
    const CONTRACT_ADDRESSES = `
    POOL_REGISTRY_ADDRESS=${poolRegistryInstance.contract.address}
    `;
    console.log(CONTRACT_ADDRESSES);
  }
};

module.exports = {
  deploy
};
