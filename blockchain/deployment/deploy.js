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
		const deployer = new etherlime.JSONRPCPrivateKeyDeployer(
			secret, 
			'http://localhost:8545/', 
			defaultConfigs
		);

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

		let registeringDeployer = await poolRegistryInstance.registerDeployer(
			poolFactoryInstance.contract.address,
			true
		);

		await poolRegistryInstance.verboseWaitForTransaction(registeringDeployer, "Factory registered as deployer");

		let removingAdmin = await poolRegistryInstance.init();

		await poolRegistryInstance.verboseWaitForTransaction(removingAdmin, "Removing insecure deployer as admin in registry");

		const CONTRACT_ADDRESSES = `
			DAI_ADDRESS=${pDaiInstance.contract.address}
			CDAI_ADDRESS=${pcDaiInstance.contract.address}
			POOL_REGISTRY_ADDRESS=${poolRegistryInstance.contract.address}
			POOL_FACTORY_ADDRESS=${poolFactoryInstance.contract.address}
		`;
		console.log(CONTRACT_ADDRESSES);

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

		console.log("Withdraw address:" + withdrawAddress);
		console.log("Penalty address:" + penaltyAddress);

		let newPool = await(await poolFactoryInstance.deployBasicPool(
			withdrawAddress,
			process.env.POOL_NAME,
			process.env.POOL_DESCRIPTION,
			10,
		)).wait();

		// const poolInstance = deployer.wrapDeployedContract(
		// 	basicPoolABI, 
		// 	newPool.events[3].args.pool
		// );

		let removingAdminPool = await poolFactoryInstance.init();

		await poolFactoryInstance.verboseWaitForTransaction(removingAdminPool, "Removing insecure deployer as admin in factory");

		const addresses = (process.env.ADDESSES_TO_MINT).split(',');
		
		for (const address of addresses) {
			await (await pDaiInstance.mintTo(address)).wait();
			console.log(`successfully minted to ${address}`);
		}

	} else if (network === 'rinkeby') {
		const deployer = new etherlime.InfuraPrivateKeyDeployer(
			secret, 
			network, 
			process.env.INFURA_API_KEY_RINKEBY, 
			defaultConfigs
		);

		const deploy = (...args) => deployer.deployAndVerify(...args);

		const dai = "0x5592ec0cfb4dbc12d3ab100b257153436a1f0fea";

		const pDaiInstance = deployer.wrapDeployedContract(erc20ABI, dai);

		const cDai = "0x6d7f0754ffeb405d23c51ce938289d4835be3b14";

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

		const addresses = (process.env.ADDESSES_TO_MINT).split(',');

		for (const address of addresses) {
			await (await pDaiInstance.allocateTo(
                address,
                ethers.utils.parseUnits("1000", 18)
            )).wait();
			console.log(`successfully minted to ${address}`);
			await(await poolFactoryInstance.addWhitelistAdmin(address)).wait();
			console.log(`successfully added ${address} to factory admin`);
			await(await poolRegistryInstance.addWhitelistAdmin(address)).wait();
			console.log(`successfully added ${address} to registry admin`);
		}

		let removingAdminRegistry = await poolRegistryInstance.init();

		await poolRegistryInstance.verboseWaitForTransaction(
			removingAdminRegistry, 
			"Removing insecure deployer as admin in registry"
		);

		let removingAdminFactory = await poolFactoryInstance.init();

		await poolFactoryInstance.verboseWaitForTransaction(
			removingAdminFactory, 
			"Removing insecure deployer as admin in factory"
		);

		const CONTRACT_ADDRESSES = `
			DAI_ADDRESS=${dai}
			CDAI_ADDRESS=${cDai}
			POOL_REGISTRY_ADDRESS=${poolRegistryInstance.contract.address}
			POOL_FACTORY_ADDRESS=${poolFactoryInstance.contract.address}
		`;
		console.log(CONTRACT_ADDRESSES);

	} else if (network === 'mainnet') {
	    console.log("Script & contracts are not ready for main net deployment")
	}
};

module.exports = {
	deploy
};
