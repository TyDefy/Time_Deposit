const { 
    ethers,
    etherlime,
    BigNumber,
    basicPoolAbi,
    cyclicWithdrawAbi,
    penaltyAbi,
    pDaiAbi,
    cDaiAbi,
    test_settings
} = require("../testing.settings.js");

describe("Pool tests - deposit", async () => {
    let deployerInsecure = accounts[1];
    let admin = accounts[2];
    let user1 = accounts[3];
    let user2 = accounts[4];
    let deployer = new etherlime.EtherlimeGanacheDeployer(deployerInsecure.secretKey);
    
    let basicPoolInstance, 
        cyclicWithdrawInstance, 
        penaltyInstance, 
        pDaiInstance, 
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
            test_settings.cyclicWithdraw.withdrawViolation
        );

        basicPoolInstance = await deployer.deploy(
            basicPoolAbi, 
            false, 
            admin.signer.address,
            cyclicWithdrawInstance.contract.address,
            pDaiInstance.contract.address,
            cDaiInstance.contract.address,
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

    describe("Deposit functionality", async () => {
        it("Can deposit", async () => {
            let userInfoBeforeDeposit = await basicPoolInstance.getUserInfo(user1.signer.address);
            let userBalanceDaiBeforeDeposit = await pDaiInstance.balanceOf(user1.signer.address);
            let poolBalanceCdaiBeforeDeposit = await cDaiInstance.balanceOf(basicPoolInstance.contract.address);
            let cTokenBalanceDaiBeforeDeposit = await pDaiInstance.balanceOf(cDaiInstance.contract.address);
            
            await pDaiInstance.from(user1).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );

            let allowance = await pDaiInstance.from(user1).allowance(
                user1.signer.address,
                basicPoolInstance.contract.address
            );

            // User info in pool
            assert.equal(
                userInfoBeforeDeposit[0].toString(),
                0,
                "Pre-existing collateral balance for user in pool"
            );
            assert.equal(
                userInfoBeforeDeposit[1].toString(),
                0,
                "Pre-existing balance for user in pool"
            );
            assert.equal(
                userInfoBeforeDeposit[2].toString(),
                0,
                "Pre-existing last deposit for user in pool"
            );
            assert.equal(
                userInfoBeforeDeposit[3].toString(),
                0,
                "Pre-existing last withdraw for user in pool"
            );
            // user dai balance 
            assert.equal(
                userBalanceDaiBeforeDeposit.toString(),
                test_settings.pDaiSettings.mintAmount,
                "user has incorrect dai balance"
            );
            // Pool cDai balance
            assert.equal(
                poolBalanceCdaiBeforeDeposit.toString(),
                0,
                "Pool has pre-existing dai balance"
            );
            // Allowance is correct
            assert.equal(
                allowance.toString(),
                test_settings.basicPool.deposit.toString(),
                "User cDai allowance is incorrect"
            );
            // Balance of cToken in Dai
            assert.equal(
                cTokenBalanceDaiBeforeDeposit.toString(),
                0,
                "cDai contract has dai balance before deposit"
            );

            await basicPoolInstance.from(user1).deposit(
                test_settings.basicPool.deposit
            );

            let userInfoAfterDeposit = await basicPoolInstance.getUserInfo(user1.signer.address);
            let userBalanceInDaiAfterDeposit = await pDaiInstance.balanceOf(user1.signer.address);
            let poolBalanceDaiAfterDeposit = await pDaiInstance.balanceOf(basicPoolInstance.contract.address);
            let poolBalanceCdaiAfterDeposit = await cDaiInstance.balanceOf(basicPoolInstance.contract.address);

            // User info in pool after deposit
            assert.equal(
                userInfoAfterDeposit[0].toString(),
                test_settings.basicPool.deposit.toString(),
                "User collateral invested after deposit incorrect"
            );
            assert.equal(
                userInfoAfterDeposit[1].toString(),
                test_settings.pcTokenSettings.mintAmount.toString(),
                "User pool cDai balance after depositing incorrect"
            );
            // User balance in Dai after
            assert.equal(
                userBalanceInDaiAfterDeposit.toString(),
                test_settings.pDaiSettings.mintAmountMinusDeposit.toString(),
                "User dai balance after deposit incorrect"
            );
            // Pool balance in dai after
            assert.equal(
                poolBalanceDaiAfterDeposit.toString(),
                0,
                "Pool still has Dai after deposit"
            );
            // Pool balance in cdai after
            assert.equal(
                poolBalanceCdaiAfterDeposit.toString(),
                test_settings.pcTokenSettings.mintAmount.toString(),
                "Pool has incorrect cDai balance after deposit"
            );
        });

        it("Negative testing deposit", async () => {
            let userInfoBeforeDeposit = await basicPoolInstance.getUserInfo(user1.signer.address);
            let userBalanceDaiBeforeDeposit = await pDaiInstance.balanceOf(user1.signer.address);
            let poolBalanceDaiBeforeDeposit = await pDaiInstance.balanceOf(basicPoolInstance.contract.address);
            let poolBalanceCdaiBeforeDeposit = await cDaiInstance.balanceOf(basicPoolInstance.contract.address);
            let cTokenBalanceDaiBeforeDeposit = await pDaiInstance.balanceOf(cDaiInstance.contract.address);
            await pDaiInstance.from(user1).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.withdraw
            );
            let allowance = await pDaiInstance.from(user1).allowance(
                user1.signer.address,
                basicPoolInstance.contract.address
            );

            // User info in pool
            assert.equal(
                userInfoBeforeDeposit[0].toString(),
                0,
                "Pre-existing collateral balance for user in pool"
            );
            assert.equal(
                userInfoBeforeDeposit[1].toString(),
                0,
                "Pre-existing balance for user in pool"
            );
            assert.equal(
                userInfoBeforeDeposit[2].toString(),
                0,
                "Pre-existing last deposit for user in pool"
            );
            assert.equal(
                userInfoBeforeDeposit[3].toString(),
                0,
                "Pre-existing last withdraw for user in pool"
            );
            // user dai balance 
            assert.equal(
                userBalanceDaiBeforeDeposit.toString(),
                test_settings.pDaiSettings.mintAmount.toString(),
                "user has incorrect dai balance"
            );
            // Pool dai balance
            assert.equal(
                poolBalanceDaiBeforeDeposit.toString(),
                0,
                "Pool has pre-existing dai balance"
            );
            // Pool cDai balance
            assert.equal(
                poolBalanceCdaiBeforeDeposit.toString(),
                0,
                "Pool has pre-existing cdai balance"
            );
            // Allowance is correct
            assert.equal(
                allowance.toString(),
                test_settings.basicPool.withdraw.toString(),
                "Pool allowed spending for user incorrect"
            );
            // Balance of cToken in Dai
            assert.equal(
                cTokenBalanceDaiBeforeDeposit.toString(),
                0,
                "cToken has pre-existing balance before deposit"
            );

            await assert.revert(basicPoolInstance.from(user1).deposit(
                test_settings.basicPool.deposit
            ));
        });
    });
});