require('dotenv').config();

const poolRegistryABI = require('../build/BasicRegistry.json');
const BasicFactoryABI = require('../build/BasicFactory.json');
const pcDaiABI = require('../build/pcToken.json');
const pDaiABI = require('../build/pDai.json');

let DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

const etherlime = require('etherlime-lib');

Array.prototype.asyncForEach = async function (callback, thisArg) {
	thisArg = thisArg || this
	for (let i = 0, l = this.length; i !== l; ++i) {
		await callback.call(thisArg, this[i], i, this)
	}
}

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

		const pDaiInstance = await deploy(
			pDaiABI,
			false,
			"PseudoDai",
			"pDAI",
			18
		);

		const pcDaiInstance = await deploy(
			pcDaiABI,
			false,
			"pcToken",
			"pcDai",
			18,
			pDaiInstance.contract.address
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
			pDaiInstance.contract.address,
			"DAI",
			pcDaiInstance.contract.address,
			"cDai"
		);

		await poolRegistryInstance.registerDeployer(
			poolFactoryInstance.contract.address,
			true
		);

		let newUtilities = await (await poolFactoryInstance.deployUtility(
			process.env.PENALTY_PERCENTAGE,
			process.env.CYCLE_LENGTH,
			process.env.PENALTY_NAME,
			process.env.PENALTY_DESCRIPTION,
			process.env.WITHDRAW_NAME,
			process.env.WITHDRAW_DESCRIPTION,
		)).wait();

		const withdrawAddress = newUtilities.events[2].args.withdraw;
		const penaltyAddress = newUtilities.events[2].args.penalty;

		let newPool = await (await poolFactoryInstance.deployBasicPool(
			withdrawAddress,
			process.env.POOL_NAME,
			process.env.POOL_DESCRIPTION
		)).wait();

		const CONTRACT_ADDRESSES = `
			DAI_ADDRESS=${pDaiInstance.contract.address}
			POOL_REGISTRY_ADDRESS=${poolRegistryInstance.contract.address}
			POOL_FACTORY_ADDRESS=${poolFactoryInstance.contract.address}
		`;
		console.log(CONTRACT_ADDRESSES);

		const addresses = (process.env.ADDESSES_TO_MINT).split(',');

		for (const address of addresses) {
			await (await pDaiInstance.mintTo(address));
			console.log(`successfully minted to ${address}`);
		}

	} else if (network === 'rinkeby') {

	}
};

module.exports = {
	deploy
};
