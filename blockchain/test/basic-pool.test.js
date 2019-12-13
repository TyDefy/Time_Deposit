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
} = require("./testing.settings.js");

describe("Basic Pool Tests", async () => {
    let deployerInsecure = accounts[1];
    let admin = accounts[2];
    let user1 = accounts[3];
    let deployer = new etherlime.EtherlimeGanacheDeployer(deployerInsecure.secretKey);;
    
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

        await pDaiInstance.from(admin).mint();
        await pDaiInstance.from(admin).transfer(
            cDaiInstance.contract.address,
            test_settings.basicPool.deposit
        );
        await pDaiInstance.from(user1).mint();
        await pDaiInstance.from(user1).approve(
            cDaiInstance.contract.address,
            test_settings.basicPool.deposit
        );
        await cDaiInstance.from(user1).approve(
            pDaiInstance.contract.address,
            test_settings.basicPool.deposit
        );
    });

    describe("pcToken mock test", async () => {
        it("Redeem underlying collateral", async () => {
            let userBalanceBefore = await cDaiInstance.balanceOf(user1.signer.address);
            let mintTx = await(await cDaiInstance.from(user1).mint(
                test_settings.basicPool.deposit
            )).wait();
            let userBalanceAfterMint = await cDaiInstance.balanceOf(user1.signer.address);
            let print = await(await cDaiInstance.from(user1).redeemUnderlying(
                test_settings.basicPool.deposit)
            ).wait();
            let userBalanceAfterRedeemUnderlying = await cDaiInstance.balanceOf(user1.signer.address);

            assert.equal(
                userBalanceBefore.toString(),
                userBalanceAfterRedeemUnderlying.toString(),
                "User balance is not 0 after redeem"
            );
            assert.equal(
                print.events[1].args.value.toString(),
                test_settings.basicPool.deposit.toString(),
                "User was refunded incorrect amount"
            );
            assert.equal(
                userBalanceAfterMint.toString(),
                mintTx.events[0].args.value.toString(),
                "User balance incorrect after mint"
            );
        });
    });

    describe("Core Functionality", async () => {
        it("💵 Can deposit", async () => {
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
                test_settings.basicPool.deposit,
                "Pool has pre-existing dai balance"
            );
            // Allowance is correct
            assert.equal(
                allowance.toString(),
                test_settings.basicPool.deposit,
                "Pool has pre-existing dai balance"
            );
            // Balance of cToken in Dai
            assert.equal(
                cTokenBalanceDaiBeforeDeposit.toString(),
                0,
                "Pool has pre-existing dai balance"
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
                test_settings.basicPool.deposit,
                "User collateral invested after deposit incorrect"
            );
            assert.equal(
                userInfoAfterDeposit[1].toString(),
                test_settings.basicPool.mintAmount,
                "User balance after depositing incorrect"
            );
            // User balance in Dai after
            assert.equal(
                userBalanceInDaiAfterDeposit.toString(),
                test_settings.pDaiSettings.mintAmountMinusDeposit,
                "User Dai balance after deposit incorrect"
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
                test_settings.basicPool.mintAmount,
                "Pool has incorrect cDai balance after deposit"
            );

        });

        it("🚫 Negative testing deposit", async () => {
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
                test_settings.pDaiSettings.mintAmount,
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
                test_settings.basicPool.withdraw,
                "Pool allowed spending for user incorrect"
            );
            // Balance of cToken in Dai
            assert.equal(
                cTokenBalanceDaiBeforeDeposit.toString(),
                test_settings.basicPool.deposit,
                "cToken has pre-existing balance before deposit"
            );

            await assert.revert(basicPoolInstance.from(user1).deposit(
                test_settings.basicPool.deposit
            ));
        });

        it("💵 Can withdraw (no penalty)", async () => {    
            let poolDaiBalanceBefore = await pDaiInstance.balanceOf(basicPoolInstance.contract.address);
            let poolCdaiBalanceBefore = await cDaiInstance.balanceOf(basicPoolInstance.contract.address);
            let userDaiBalanceBefore = await pDaiInstance.balanceOf(user1.signer.address);

            assert.equal(
                poolDaiBalanceBefore.toString(),
                0,
                "Pool has Dai before mint"
            );
            assert.equal(
                poolCdaiBalanceBefore.toString(),
                0,
                "Pool has cDai before mint"
            );

            await pDaiInstance.from(user1).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            await basicPoolInstance.from(user1).deposit(
                test_settings.basicPool.deposit
            );
            let balanceBefore = await basicPoolInstance.getUserInfo(user1.signer.address);
            let balanceInPcToken = await cDaiInstance.balanceOf(user1.signer.address);
            let poolDaiBalanceAfterDeposit = await pDaiInstance.balanceOf(basicPoolInstance.contract.address);
            let poolCdaiBalanceAfterDeposit = await cDaiInstance.balanceOf(basicPoolInstance.contract.address);

            assert.equal(
                balanceBefore[0].toString(),
                test_settings.basicPool.deposit.toString(),
                "Pool incorrectly has Dai after deposit"
            );
            assert.equal(
                poolDaiBalanceAfterDeposit.toString(),
                0,
                "Pool incorrectly has Dai after deposit"
            );
            assert.equal(
                balanceInPcToken.toString(),
                0,
                "User balance in cDai is incorrect"
            );
            assert.equal(
                poolCdaiBalanceAfterDeposit.toString(),
                balanceBefore[1].toString(),
                "Pool cDai is different to deposit balance"
            );

            let withdrawInfo = await basicPoolInstance.canWithdraw(
                user1.signer.address,
                test_settings.basicPool.withdraw
            );

            assert.equal(
                withdrawInfo[0],
                true,
                "User is blocked from withdrawing with penalty"
            );
            assert.equal(
                withdrawInfo[1].toString(),
                test_settings.basicPool.withdrawAmount,
                "Withdraw amount is not correct"
            );
            assert.equal(
                withdrawInfo[2].toString(),
                test_settings.basicPool.withdrawPenalty,
                "Penalty amount is not correct"
            );

            await utils.timeTravel(deployer.provider, test_settings.cyclicWithdraw.cycleLength);
            let withdrawInfoAfter = await basicPoolInstance.canWithdraw(
                user1.signer.address,
                test_settings.basicPool.withdraw
            );

            assert.equal(
                withdrawInfoAfter[0],
                true,
                "User is blocked from withdrawing with penalty"
            );
            assert.equal(
                withdrawInfoAfter[1].toString(),
                test_settings.basicPool.withdraw,
                "Withdraw amount is not correct"
            );
            assert.equal(
                withdrawInfoAfter[2].toString(),
                0,
                "Penalty amount is not correct"
            );

            let tx = await(await basicPoolInstance.from(user1).withdraw(
                test_settings.basicPool.deposit
            )).wait();

            let balanceInPcTokenAfter = await cDaiInstance.balanceOf(user1.signer.address);
            let balanceDaiAFter = await pDaiInstance.balanceOf(user1.signer.address);
            let balanceOfUserInPoolAfterWithdraw = await basicPoolInstance.getUserInfo(user1.signer.address);
            let poolDaiBalanceAfter = await pDaiInstance.balanceOf(basicPoolInstance.contract.address);
            let poolCdaiBalanceAfter = await cDaiInstance.balanceOf(basicPoolInstance.contract.address);
            
            assert.equal(
                balanceInPcTokenAfter.toString(),
                0,
                "User has incorrect cDai balance after withdraw"
            );
            assert.equal(
                balanceDaiAFter.toString(),
                userDaiBalanceBefore.toString(),
                "User has not been refunded all dai"
            );
            assert.equal(
                balanceOfUserInPoolAfterWithdraw[0].toString(),
                0,
                "User has a balance in pool after withdrawing"
            );
            assert.equal(
                poolDaiBalanceAfter.toString(),
                0,
                "Pool has dai after withdraw"
            );
            assert.equal(
                poolCdaiBalanceAfter.toString(),
                0,
                "Pool has cDai after withdraw"
            );
        });

        it("💵 Can withdraw (with penalty)", async () => {   
            // await pDaiInstance.from(user1).approve(
            //     basicPoolInstance.contract.address,
            //     test_settings.basicPool.deposit
            // );  
            // //TODO add second withdraw       
            // await basicPoolInstance.from(user1).deposit(
            //     test_settings.basicPool.deposit
            // );
            // let balanceBefore = await basicPoolInstance.balanceOf(user1.signer.address);
            // await basicPoolInstance.from(user1).withdraw(
            //     test_settings.basicPool.withdraw
            // );
            // let balanceAfter = await basicPoolInstance.balanceOf(user1.signer.address);
            
            // //TODO check token balances change
            // //TODO check that fee gets taken off
            // //TODO ensue and handle fee distribution

            // assert.equal(
            //     balanceBefore.toString(),
            //     test_settings.basicPool.deposit,
            //     "user has incorrect balance after"
            // );
            // assert.equal(
            //     balanceAfter.toString(),
            //     test_settings.basicPool.withdraw,
            //     "user has incorrect balance after"
            // );
        });

        it("🚫 Negative testing withdraw", async () => {
            //TODO if expired 
            //TODO if disabled they cannot withdraw
            //TODO no balance to withdraw
        });

        it("", async () => {

        });

        it("", async () => {

        });
    });

    describe("Supporting Functionality", async () => {
        it("Get user info", async () => {
            let userInfoBeforeDeposit = await basicPoolInstance.getUserInfo(user1.signer.address);

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
        });

        it("Balance Of (pool)", async () => {
            let balanceOfUser = await basicPoolInstance.balanceOf(user1.signer.address);
            await pDaiInstance.from(user1).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );

            await basicPoolInstance.from(user1).deposit(
                test_settings.basicPool.deposit
            );
            let balanceOfUserAfter = await basicPoolInstance.balanceOf(user1.signer.address);

            assert.equal(
                balanceOfUser.toString(),
                0,
                "User has pre-existing balance"
            );
            assert.equal(
                balanceOfUserAfter.toString(),
                test_settings.basicPool.deposit,
                "User balance has not updated correctly"
            );
        });

        it("Can withdraw", async () => {
            await pDaiInstance.from(user1).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            await basicPoolInstance.from(user1).deposit(
                test_settings.basicPool.deposit
            );
            let withdrawInfo = await basicPoolInstance.canWithdraw(
                user1.signer.address,
                test_settings.basicPool.withdraw
            );

            assert.equal(
                withdrawInfo[0],
                true,
                "User is blocked from withdrawing with penalty"
            );
            assert.equal(
                withdrawInfo[1].toString(),
                test_settings.basicPool.withdrawAmount,
                "Withdraw amount is not correct"
            );
            assert.equal(
                withdrawInfo[2].toString(),
                test_settings.basicPool.withdrawPenalty,
                "Penalty amount is not correct"
            );

            await utils.timeTravel(deployer.provider, test_settings.cyclicWithdraw.cycleLength);
            let withdrawInfoAfter = await basicPoolInstance.canWithdraw(
                user1.signer.address,
                test_settings.basicPool.withdraw
            );

            assert.equal(
                withdrawInfoAfter[0],
                true,
                "User is blocked from withdrawing with penalty"
            );
            assert.equal(
                withdrawInfoAfter[1].toString(),
                test_settings.basicPool.withdraw,
                "Withdraw amount is not correct"
            );
            assert.equal(
                withdrawInfoAfter[2].toString(),
                0,
                "Penalty amount is not correct"
            );
        });

        it("", async () => {

        });

        it("", async () => {

        });

        it("", async () => {

        });

        it("", async () => {

        });
    });
});