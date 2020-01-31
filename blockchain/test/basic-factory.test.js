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

describe("Basic pool factory", async () => {
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
            let deployedUtilityTx = await(await factoryInstance.from(admin).deployUtility(
                test_settings.penalty.percentage,
                test_settings.cyclicWithdraw.cycleLength,
                test_settings.cyclicWithdraw.withdrawViolation,
                test_settings.cyclicWithdraw.interestWithdrawViolation,
                test_settings.registrySettings.penalty.name,
                test_settings.registrySettings.withdraw.name
            )).wait();

            let utilityDetails = await registryInstance.from(admin).utilityDetails(
                deployedUtilityTx.events[2].args.withdraw
            );

            assert.equal(
                utilityDetails[0],
                test_settings.registrySettings.withdraw.name,
                "Withdraw contract name incorrect"
            );
            assert.equal(
                utilityDetails[1],
                test_settings.registrySettings.withdraw.type,
                "Withdraw contract type incorrect"
            );
            assert.equal(
                utilityDetails[2],
                true,
                "Withdraw contract activity incorrect"
            );
        });

        it("Can deploy a basic pool", async () => {
            let deployedUtilityTx = await(await factoryInstance.from(admin).deployUtility(
                test_settings.penalty.percentage,
                test_settings.cyclicWithdraw.cycleLength,
                test_settings.cyclicWithdraw.withdrawViolation,
                test_settings.cyclicWithdraw.interestWithdrawViolation,
                test_settings.registrySettings.penalty.name,
                test_settings.registrySettings.withdraw.name
            )).wait();

            let deployedPoolTx = await(await factoryInstance.from(admin).deployBasicPool(
                deployedUtilityTx.events[2].args.withdraw,
                test_settings.registrySettings.pool.name,
                test_settings.registrySettings.pool.description,
            )).wait();

            let utilityDetails = await registryInstance.from(admin).poolDetails(
                deployedPoolTx.events[3].args.pool
            );

            assert.equal(
                utilityDetails[0],
                test_settings.registrySettings.pool.name,
                "Pool name incorrect"
            );
            assert.equal(
                utilityDetails[1],
                deployedUtilityTx.events[2].args.withdraw,
                "withdraw address incorrect"
            );
            assert.equal(
                utilityDetails[3],
                true,
                "pool is incorreectly inactive"
            );
        });

        it("Can deploy a basic pool without withdraw", async () => {
            let deployedPoolTx = await(await factoryInstance.from(admin).deployBasicPool(
                "0x0000000000000000000000000000000000000000",
                test_settings.registrySettings.pool.name,
                test_settings.registrySettings.pool.description,
            )).wait();

            let utilityDetails = await registryInstance.from(admin).poolDetails(
                deployedPoolTx.events[3].args.pool
            );

            assert.equal(
                utilityDetails[0],
                test_settings.registrySettings.pool.name,
                "Pool name incorrect"
            );
            assert.equal(
                utilityDetails[1],
                "0x0000000000000000000000000000000000000000",
                "withdraw address incorrect"
            );
            assert.equal(
                utilityDetails[2],
                "0x0000000000000000000000000000000000000000",
                "withdraw address incorrect"
            );
            assert.equal(
                utilityDetails[3],
                true,
                "pool is incorreectly inactive"
            );
        });
    });
});