require('dotenv').config();

const poolRegistryABI = require('../build/BasicRegistry.json');
const BasicFactoryABI = require('../build/BasicFactory.json');
const PseudoCdaiABI = require('../build/pcToken.json');
const PseudoDaiABI = require('../build/pDai.json');

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

  const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS_PUBLIC_KEY;

  	if (network === 'local') {
		const deployer = new etherlime.JSONRPCPrivateKeyDeployer(secret, 'http://localhost:8545/', defaultConfigs);

		const deploy = (...args) => deployer.deploy(...args);

		const pseudoDaiInstance = await deploy(
			PseudoDaiABI,
			false,
			"PseudoDai",
			"pDAI",
			18
		);

		const pseudoCdaiInstance = await deploy(
			PseudoCdaiABI,
			false,
			"pcToken",
			"pcDai",
			18,
			pseudoDaiInstance.contract.address
		);
		
		const poolRegistryInstance = await deploy(
			poolRegistryABI,
			false,
			ADMIN_ADDRESS
		);
		
		const poolFactoryInstance = await deploy(
			BasicFactoryABI,
			false,
			ADMIN_ADDRESS,
			poolRegistryInstance.contract.address,
			pseudoDaiInstance.contract.address,
			pseudoCdaiInstance.contract.address
		);

		await poolRegistryInstance.registerDeployer(
			poolFactoryInstance.contract.address,
			true
		);

		let newUtilities = await(await poolFactoryInstance.deployUtility(
			process.env.PENALTY_PERCENTAGE,
			process.env.CYCLE_LENGTH,
			process.env.PENALTY_NAME,
			process.env.PENALTY_DESCRIPTION,
			process.env.WITHDRAW_NAME,
			process.env.WITHDRAW_DESCRIPTION,
		)).wait();

		const withdrawAddress = newUtilities.events[2].args.withdraw;
		const penaltyAddress = newUtilities.events[2].args.penalty;

		let newPool = await(await poolFactoryInstance.deployBasicPool(
			withdrawAddress,
			process.env.POOL_NAME,
			process.env.POOL_DESCRIPTION
		)).wait();

		const poolAddress = newPool.events[1].args.pool;

		const CONTRACT_ADDRESSES = `
			DAI_ADDRESS=${pseudoDaiInstance.contract.address}
			POOL_REGISTRY_ADDRESS=${poolRegistryInstance.contract.address}
			POOL_FACTORY_ADDRESS=${poolFactoryInstance.contract.address}
			WITHDRAW_ADDRESS=${withdrawAddress}
			PENALTY_ADDRESS=${penaltyAddress}
			POOL_ADDRESS=${poolAddress}
		`;
		console.log(CONTRACT_ADDRESSES);
	} else if (network === 'rinkeby') {

	}
};

module.exports = {
  deploy
};
