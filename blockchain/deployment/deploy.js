require('dotenv').config();

const poolRegistryABI = require('../build/BasicRegistry.json');
const BasicFactoryABI = require('../build/BasicFactory.json');
const pcDaiABI = require('../build/pcToken.json');
const pDaiABI = require('../build/pDai.json');
const erc20ABI = require('../build/IERC20_Rinkeby.json');
const pcTokenABI = require('../build/ICToken.json');
const basicPoolABI = require('../build/BasicPool.json');

let DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

const etherlime = require('etherlime-lib');
const ethers = require('ethers');

Array.prototype.asyncForEach = async function (callback, thisArg) {
	thisArg = thisArg || this
	for (let i = 0, l = this.length; i !== l; ++i) {
		await callback.call(thisArg, this[i], i, this)
	}
}

const defaultConfigs = {
	// chainId: 4,
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
			"cDAI"
		);

		await poolRegistryInstance.registerDeployer(
			poolFactoryInstance.contract.address,
			true
		);

		let newUtilities = await (await poolFactoryInstance.deployUtility(
			process.env.PENALTY_PERCENTAGE,
			process.env.CYCLE_LENGTH,
			process.env.CAN_WITHDRAW_IN_VIOLATION,
			process.env.CAN_WITHDRAW_INTEREST_IN_VIOLATION,
			process.env.PENALTY_NAME,
			process.env.WITHDRAW_NAME
		)).wait();

		const withdrawAddress = newUtilities.events[2].args.withdraw;
		const penaltyAddress = newUtilities.events[2].args.penalty;

		let newPool = await (await poolFactoryInstance.deployBasicPool(
			withdrawAddress,
			process.env.POOL_NAME,
			process.env.POOL_DESCRIPTION
		)).wait();
		
		// console.log(newPool.events[3].args);

		const poolInstance = deployer.wrapDeployedContract(basicPoolABI, newPool.events[3].args.pool);

		await(await poolInstance.init(10)).wait();

		const CONTRACT_ADDRESSES = `
			DAI_ADDRESS=${pDaiInstance.contract.address}
			POOL_REGISTRY_ADDRESS=${poolRegistryInstance.contract.address}
			POOL_FACTORY_ADDRESS=${poolFactoryInstance.contract.address}
		`;
		console.log(CONTRACT_ADDRESSES);

		console.log("Withdraw address:" + withdrawAddress);
		console.log("Penalty address:" + penaltyAddress + "\nPool address:");

		const addresses = (process.env.ADDESSES_TO_MINT).split(',');

		for (const address of addresses) {
			await (await pDaiInstance.mintTo(address));
			console.log(`successfully minted to ${address}`);
		}

	} else if (network === 'rinkeby') {
		const deployer = new etherlime.InfuraPrivateKeyDeployer(secret, network, process.env.INFURA_API_KEY_RINKEBY, defaultConfigs)

		const deploy = (...args) => deployer.deployAndVerify(...args);

		const dai = "0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa";

		const pDaiInstance = deployer.wrapDeployedContract(erc20ABI, dai);

		const cDai = "0x2acc448d73e8d53076731fea2ef3fc38214d0a7d";

		const pcDaiInstance = deployer.wrapDeployedContract(pcTokenABI, cDai);

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
			dai,
			"DAI",
			cDai,
			"cDai"
		);

		await poolRegistryInstance.registerDeployer(
			poolFactoryInstance.contract.address,
			true
		);

		const CONTRACT_ADDRESSES = `
			DAI_ADDRESS=${dai}
			POOL_REGISTRY_ADDRESS=${poolRegistryInstance.contract.address}
			POOL_FACTORY_ADDRESS=${poolFactoryInstance.contract.address}
		`;
		console.log(CONTRACT_ADDRESSES);

		const addresses = (process.env.ADDESSES_TO_MINT).split(',');

		for (const address of addresses) {
			await (await pDaiInstance.allocateTo(
                address,
                ethers.utils.parseUnits("100", 18)
            ));
			console.log(`successfully minted to ${address}`);
		}
	} else if (network === 'mainnet') {
	    console.log("Script & contracts are not ready for main net deployment")
	}
};

module.exports = {
	deploy
};
