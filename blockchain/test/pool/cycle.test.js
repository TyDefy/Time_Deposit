const { 
    ethers,
    etherlime,
    BigNumber,
    basicPoolAbi,
    cyclicWithdrawAbi,
    basicRegistryAbi,
    penaltyAbi,
    pDaiAbi,
    cDaiAbi,
    basicFactoryAbi,
    test_settings
} = require("../testing.settings.js");

describe("Pool tests - cyclic & rollover", async () => {
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

    describe("Roll over functionality", async () => {
        it("Can create a pool with no cycle", async () => {
            basicPoolInstance = await deployer.deploy(
                basicPoolAbi, 
                false, 
                admin.signer.address,
                "0x0000000000000000000000000000000000000000",
                pDaiInstance.contract.address,
                cDaiInstance.contract.address,
            );

            await pDaiInstance.from(user1).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );

            let allowance = await pDaiInstance.from(user1).allowance(
                user1.signer.address,
                basicPoolInstance.contract.address
            );

            await basicPoolInstance.from(user1).deposit(
                test_settings.basicPool.deposit
            );

            let liveness = await basicPoolInstance.isPoolActive();

            let withdrawInfo = await basicPoolInstance.canWithdraw(
                user1.signer.address,
                test_settings.basicPool.deposit
            );

            assert.equal(
                liveness,
                true,
                "pool is incorecctly inactive"
            );
            assert.equal(
                withdrawInfo[0],
                true,
                "User is incorrectly blocked from withdrawing"
            );
            assert.equal(
                withdrawInfo[1].toString(),
                test_settings.basicPool.deposit.toString(),
                "User withdraw amount is not correct"
            );
            assert.equal(
                withdrawInfo[2].toString(),
                0,
                "Penalty incorrectly applied"
            );
        });
    });
});
