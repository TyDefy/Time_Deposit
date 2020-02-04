const { 
    ethers,
    etherlime,
    BigNumber,
    basicPoolAbi,
    cyclicWithdrawAbi,
    penaltyAbi,
    pDaiAbi,
    cDaiAbi,
    basicRegistryAbi,
    test_settings
} = require("./testing.settings.js");

describe("Basic Registry Tests", async () => {
    let deployerInsecure = accounts[1];
    let admin = accounts[2];
    let registeredDeployer = accounts[3];
    let user1 = accounts[4];
    let user2 = accounts[5];
    let deployer = new etherlime.EtherlimeGanacheDeployer(deployerInsecure.secretKey);
    
    let basicPoolInstance, 
        cyclicWithdrawInstance, 
        penaltyInstance, 
        pDaiInstance, 
        cDaiInstance,
        basicRegistryInstance;

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

        penaltyInstance = await deployer.deploy(
            penaltyAbi,
            false,
            test_settings.penalty.percentage
        );

        cyclicWithdrawInstance = await deployer.deploy(
            cyclicWithdrawAbi, 
            false, 
            penaltyInstance.contract.address,
            test_settings.cyclicWithdraw.cycleLength,
            test_settings.cyclicWithdraw.withdrawViolation,
            test_settings.cyclicWithdraw.interestWithdrawViolation
        );

        basicPoolInstance = await deployer.deploy(
            basicPoolAbi, 
            false, 
            admin.signer.address,
            cyclicWithdrawInstance.contract.address,
            pDaiInstance.contract.address,
            cDaiInstance.contract.address,
        );

        basicRegistryInstance = await deployer.deploy(
            basicRegistryAbi,
            false,
            admin.signer.address
        );

        await basicRegistryInstance.from(admin).registerDeployer(
            registeredDeployer.signer.address,
            true
        );

        // Minting admin Dai
        await pDaiInstance.from(admin).mint();
        // Minting user 1 dai
        await pDaiInstance.from(user1).mint();
        // Approving cDai as a spender
        await pDaiInstance.from(user1).approve(
            cDaiInstance.contract.address,
            test_settings.basicPool.deposit
        );
        // Approving dai as a spender
        await cDaiInstance.from(user1).approve(
            pDaiInstance.contract.address,
            test_settings.basicPool.deposit
        );
        // Minting dai for user 2
        await pDaiInstance.from(user2).mint();
        // Approving cDai as a spender
        await pDaiInstance.from(user2).approve(
            cDaiInstance.contract.address,
            test_settings.basicPool.deposit
        );
        // Approving dai as a spender
        await cDaiInstance.from(user2).approve(
            pDaiInstance.contract.address,
            test_settings.basicPool.deposit
        );
    });

    describe("Core Functionality", async () => {
        it("Registers a utility", async () => {
            await basicRegistryInstance.from(registeredDeployer).registerUtility(
                admin.signer.address,
                penaltyInstance.contract.address,
                test_settings.registrySettings.penalty.name,
                test_settings.registrySettings.penalty.type
            );
            
            let details = await basicRegistryInstance.utilityDetails(
                penaltyInstance.contract.address
            );

            assert.equal(
                details[0],
                test_settings.registrySettings.penalty.name,
                "Name of util incorrectly registered"
            );
            assert.equal(
                details[1],
                test_settings.registrySettings.penalty.type,
                "Type of util incorrect"
            );
            assert.equal(
                details[2],
                true,
                "Util was not registered as active"
            );
        });

        it("Registers a pool", async () => {
            await basicRegistryInstance.from(registeredDeployer).registerUtility(
                admin.signer.address,
                penaltyInstance.contract.address,
                test_settings.registrySettings.penalty.name,
                test_settings.registrySettings.penalty.type
            );

            await basicRegistryInstance.from(registeredDeployer).registerUtility(
                admin.signer.address,
                cyclicWithdrawInstance.contract.address,
                test_settings.registrySettings.withdraw.name,
                test_settings.registrySettings.withdraw.type
            );

            await basicRegistryInstance.from(registeredDeployer).registerPool(
                admin.signer.address,
                basicPoolInstance.contract.address,
                cyclicWithdrawInstance.contract.address,
                test_settings.registrySettings.pool.name,
                test_settings.registrySettings.pool.description
            );

            let details = await basicRegistryInstance.poolDetails(
                basicPoolInstance.contract.address
            );

            assert.equal(
                details[0],
                test_settings.registrySettings.pool.name,
                "Pool registered with incorrect name"
            );
            assert.equal(
                details[1],
                cyclicWithdrawInstance.contract.address,
                "Pool was registered with incorrect withdraw"
            );
            assert.equal(
                details[2],
                penaltyInstance.contract.address,
                "Pool registered with incorrect penalty contract"
            );
        });

        it("Negative test Registers a pool (withdraw)", async () => {
            await basicRegistryInstance.from(registeredDeployer).registerUtility(
                admin.signer.address,
                penaltyInstance.contract.address,
                test_settings.registrySettings.penalty.name,
                test_settings.registrySettings.penalty.type
            );

            await assert.revert(basicRegistryInstance.from(registeredDeployer).registerPool(
                admin.signer.address,
                basicPoolInstance.contract.address,
                cyclicWithdrawInstance.contract.address,
                test_settings.registrySettings.pool.name,
                test_settings.registrySettings.pool.description
            ));

            await assert.revert(basicRegistryInstance.from(admin).registerPool(
                admin.signer.address,
                basicPoolInstance.contract.address,
                cyclicWithdrawInstance.contract.address,
                test_settings.registrySettings.pool.name,
                test_settings.registrySettings.pool.description
            ));
        });
    });

    describe("Supporting Functionality", async () => {
        it("Utility details", async () => {
            await basicRegistryInstance.from(registeredDeployer).registerUtility(
                admin.signer.address,
                penaltyInstance.contract.address,
                test_settings.registrySettings.penalty.name,
                test_settings.registrySettings.penalty.type
            );
            
            let details = await basicRegistryInstance.utilityDetails(
                penaltyInstance.contract.address
            );

            assert.equal(
                details[0],
                test_settings.registrySettings.penalty.name,
                "Name of util incorrectly registered"
            );
            assert.equal(
                details[1],
                test_settings.registrySettings.penalty.type,
                "Type of util incorrect"
            );
            assert.equal(
                details[2],
                true,
                "Util was not registered as active"
            );

            await basicRegistryInstance.from(registeredDeployer).registerUtility(
                admin.signer.address,
                cyclicWithdrawInstance.contract.address,
                test_settings.registrySettings.withdraw.name,
                test_settings.registrySettings.withdraw.type
            );
            
            details = await basicRegistryInstance.utilityDetails(
                cyclicWithdrawInstance.contract.address
            );

            assert.equal(
                details[0],
                test_settings.registrySettings.withdraw.name,
                "Name of util incorrectly registered"
            );
            assert.equal(
                details[1],
                test_settings.registrySettings.withdraw.type,
                "Type of util incorrect"
            );
            assert.equal(
                details[2],
                true,
                "Util was not registered as active"
            );
        });

        it("Negative test utility details", async () => {
            let details = await basicRegistryInstance.utilityDetails(
                penaltyInstance.contract.address
            );

            assert.equal(
                details[0],
                "",
                "Name of util incorrectly registered"
            );
            assert.equal(
                details[1],
                0,
                "Type of util incorrect"
            );
            assert.equal(
                details[2],
                false,
                "Util was not registered as active"
            );

            details = await basicRegistryInstance.utilityDetails(
                cyclicWithdrawInstance.contract.address
            );

            assert.equal(
                details[0],
                "",
                "Name of util incorrectly registered"
            );
            assert.equal(
                details[1],
                0,
                "Type of util incorrect"
            );
            assert.equal(
                details[2],
                false,
                "Util was not registered as active"
            );
        });

        it("Pool details", async () => {
            await basicRegistryInstance.from(registeredDeployer).registerUtility(
                admin.signer.address,
                penaltyInstance.contract.address,
                test_settings.registrySettings.penalty.name,
                test_settings.registrySettings.penalty.type
            );

            await basicRegistryInstance.from(registeredDeployer).registerUtility(
                admin.signer.address,
                cyclicWithdrawInstance.contract.address,
                test_settings.registrySettings.withdraw.name,
                test_settings.registrySettings.withdraw.type
            );

            await basicRegistryInstance.from(registeredDeployer).registerPool(
                admin.signer.address,
                basicPoolInstance.contract.address,
                cyclicWithdrawInstance.contract.address,
                test_settings.registrySettings.pool.name,
                test_settings.registrySettings.pool.description
            );

            let details = await basicRegistryInstance.poolDetails(
                basicPoolInstance.contract.address
            );

            assert.equal(
                details[0],
                test_settings.registrySettings.pool.name,
                "Pool registered with incorrect name"
            );
            assert.equal(
                details[1],
                cyclicWithdrawInstance.contract.address,
                "Pool was registered with incorrect withdraw"
            );
            assert.equal(
                details[2],
                penaltyInstance.contract.address,
                "Pool registered with incorrect penalty contract"
            );
        });

        it("Negative test pool details", async () => {
            let details = await basicRegistryInstance.poolDetails(
                basicPoolInstance.contract.address
            );

            assert.equal(
                details[0],
                "",
                "Pool registered with incorrect name"
            );
            assert.equal(
                details[1],
                0x0,
                "Pool was registered with incorrect withdraw"
            );
            assert.equal(
                details[2],
                0x0,
                "Pool registered with incorrect penalty contract"
            );
        });
    });
});