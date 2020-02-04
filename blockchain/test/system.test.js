const { 
    ethers,
    etherlime,
    BigNumber,
    basicPoolAbi,
    cyclicWithdrawAbi,
    penaltyAbi,
    pDaiAbi,
    basicFactoryAbi,
    basicRegistryAbi,
    cDaiAbi,
    test_settings
} = require("./testing.settings.js");

describe("System wide test", async () => {
    let deployerInsecure = accounts[1];
    let admin = accounts[2];
    let user1 = accounts[3];
    let user2 = accounts[4];
    let deployer = new etherlime.EtherlimeGanacheDeployer(deployerInsecure.secretKey);
    
    let basicPoolInstance, 
        cyclicWithdrawInstance, 
        penaltyInstance, 
        pDaiInstance,
        factoryInstance,
        registryInstance,
        cDaiInstance;

    beforeEach('', async () => {
        pDaiInstance = await deployer.deploy(
            pDaiAbi,
            false,
            test_settings.pDaiSettings.name,
            test_settings.pDaiSettings.symbol,
            test_settings.pDaiSettings.decimals,
        );

        cDaiInstance = await deployer.deploy(
            cDaiAbi,
            false,
            test_settings.pcTokenSettings.name,
            test_settings.pcTokenSettings.symbol,
            test_settings.pcTokenSettings.decimals,
            pDaiInstance.contract.address
        );

        registryInstance = await deployer.deploy(
            basicRegistryAbi,
            false,
            admin.signer.address
        );

        factoryInstance = await deployer.deploy(
            basicFactoryAbi,
            false,
            admin.signer.address,
            registryInstance.contract.address,
            pDaiInstance.contract.address,
            test_settings.pDaiSettings.symbol,
            cDaiInstance.contract.address,
            test_settings.pcTokenSettings.symbol
        );

        await registryInstance.from(admin).registerDeployer(
            factoryInstance.contract.address,
            true
        );
    });

    describe("Deploying functionality", async () => {
        it("Can deploy a utility", async () => {

        });
    });
});