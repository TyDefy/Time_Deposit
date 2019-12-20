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

        it("Redeem token", async () => {
            let userBalanceBefore = await cDaiInstance.balanceOf(user1.signer.address);
            let userDaiBalanceBefore = await pDaiInstance.balanceOf(user1.signer.address);
            let pcTokenBalanceInDaiBefore = await pDaiInstance.balanceOf(cDaiInstance.contract.address);
            
            let mintTx = await(await cDaiInstance.from(user1).mint(
                test_settings.basicPool.deposit
            )).wait();

            let userBalanceAfterMint = await cDaiInstance.balanceOf(user1.signer.address);
            let userDaiBalanceAfterMint = await pDaiInstance.balanceOf(user1.signer.address);
            let pcTokenBalanceInDai = await pDaiInstance.balanceOf(cDaiInstance.contract.address);
            
            // Before mint value checks
            assert.equal(
                userBalanceBefore.toString(),
                0,
                "User has cDai balance before minting"
            );
            assert.equal(
                userDaiBalanceBefore.toString(),
                test_settings.pDaiSettings.mintAmount.toString(),
                "User has incorrect dai balance"
            );
            assert.equal(
                pcTokenBalanceInDaiBefore.toString(),
                0,
                "cDai contract has dai balance before mint"
            );
            // After mint value checks
            assert.equal(
                mintTx.events[0].args.value.toString(),
                test_settings.pcTokenSettings.mintAmount.toString(),
                "User has incorrect cDai balance after minting"
            );
            assert.equal(
                mintTx.events[1].args.value.toString(),
                test_settings.basicPool.deposit.toString(),
                "Event and deposit amount differ after minting"
            );
            assert.equal(
                userBalanceAfterMint.toString(),
                test_settings.pcTokenSettings.mintAmount.toString(),
                "User has incorrect cDai balance after minting"
            );
            assert.equal(
                userDaiBalanceAfterMint.toString(),
                test_settings.pDaiSettings.mintAmountMinusDeposit.toString(),
                "User has incorrect dai balance after minting"
            );
            assert.equal(
                pcTokenBalanceInDai.toString(),
                test_settings.basicPool.deposit.toString(),
                "User has incorrect dai balance after minting"
            );

            let print = await(await cDaiInstance.from(user1).redeem(
                userBalanceAfterMint)
            ).wait();

            let userBalanceAfterRedeem = await cDaiInstance.balanceOf(user1.signer.address);
            let userDaiBalanceAfterRedeem = await pDaiInstance.balanceOf(user1.signer.address);
            let pcTokenBalanceInDaiAfter = await pDaiInstance.balanceOf(cDaiInstance.contract.address);

            assert.equal(
                userBalanceAfterRedeem.toString(),
                0,
                "User has incorrect cDai balance after redeem"
            );
            assert.equal(
                userDaiBalanceAfterRedeem.toString(),
                test_settings.pDaiSettings.mintAmount.toString(),
                "User has incorrect dai balance after redeem"
            );
            assert.equal(
                print.events[1].args.value.toString(),
                test_settings.basicPool.deposit.toString(),
                "User has been redeemed the incorrect amount"
            );
            assert.equal(
                pcTokenBalanceInDaiAfter.toString(),
                0,
                "cDai contract has a balance in dai after redeem"
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
            let poolDaiBalanceBefore = await pDaiInstance.balanceOf(basicPoolInstance.contract.address);
            let poolCdaiBalanceBefore = await cDaiInstance.balanceOf(basicPoolInstance.contract.address);

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
            let withdrawInformation = await basicPoolInstance.canWithdraw(
                user1.signer.address,
                test_settings.basicPool.deposit
            );

            assert.equal(
                poolDaiBalanceAfterDeposit.toString(),
                0,
                "Pool incorrectly has Dai after user deposit"
            );
            assert.equal(
                poolCdaiBalanceAfterDeposit.toString(),
                test_settings.pcTokenSettings.mintAmount.toString(),
                "Pool has incorrect cDai balance after user deposit"
            );
            assert.equal(
                balanceBefore[0].toString(),
                test_settings.basicPool.deposit.toString(),
                "User pool dai balance incorrect"
            );
            assert.equal(
                balanceBefore[1].toString(),
                test_settings.pcTokenSettings.mintAmount.toString(),
                "User pool cDai balance incorrect"
            );
            assert.equal(
                balanceInPcToken.toString(),
                0,
                "user incorrectly has cDai balance (against cDai contract)"
            );
            assert.equal(
                withdrawInformation[0],
                true,
                "User is incorrectly blocked from withdrawing"
            );
            assert.equal(
                withdrawInformation[1].toString(),
                test_settings.basicPool.withdrawAmountOn100.toString(),
                "User is incorrectly blocked from withdrawing"
            );
            assert.equal(
                withdrawInformation[2].toString(),
                test_settings.basicPool.penaltyAmountOn100.toString(),
                "User is incorrectly blocked from withdrawing"
            );
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

            await assert.notRevert(basicPoolInstance.from(user1).withdraw(
                test_settings.basicPool.deposit
            ));

            let withdrawInfo2 = await basicPoolInstance.canWithdraw(
                user1.signer.address,
                test_settings.basicPool.deposit
            );

            assert.equal(
                withdrawInfo2[0],
                false,
                "User can withdraw with 0 balance"
            );
            assert.equal(
                withdrawInfo2[1].toString(),
                0,
                "User has withdraw allowance (dai) with 0 balance"
            );
            assert.equal(
                withdrawInfo2[2].toString(),
                0,
                "User has withdraw allowance (cDai) with 0 balance"
            );

            let balanceInPcTokenAfter = await cDaiInstance.balanceOf(user1.signer.address);
            let userDaiBalanceAfterWithdraw = await pDaiInstance.balanceOf(user1.signer.address);
            let balanceOfUserInPoolAfterWithdraw = await basicPoolInstance.getUserInfo(user1.signer.address);
            let poolDaiBalanceAfter = await pDaiInstance.balanceOf(basicPoolInstance.contract.address);
            let poolCdaiBalanceAfter = await cDaiInstance.balanceOf(basicPoolInstance.contract.address);
            let penaltyPotBalance = await basicPoolInstance.penaltyPotBalance();

            assert.equal(
                balanceOfUserInPoolAfterWithdraw[0].toString(),
                0,
                "User has dai in pool after withdraw"
            );
            assert.equal(
                balanceOfUserInPoolAfterWithdraw[1].toString(),
                0,
                "User has cDai in pool after withdraw"
            );
            assert.equal(
                userDaiBalanceAfterWithdraw.toString(),
                test_settings.pDaiSettings.withdrawWithPenalty.toString(),
                "User has not had penalty removed"
            );
            assert.equal(
                poolDaiBalanceAfter.toString(),
                0,
                "Pool has dai after withdraw"
            );
            assert.equal(
                penaltyPotBalance.toString(),
                test_settings.basicPool.penaltyAmountInCdai.toString(),
                "Penalty pot has not been contributed towards by premature withdraw"
            );
            assert.equal(
                poolCdaiBalanceAfter.toString(),
                test_settings.basicPool.penaltyAmountInCdai.toString(),
                "Pool does not own penalty amount of cdai"
            );
            assert.equal(
                balanceInPcTokenAfter.toString(),
                0,
                "User has cDai balance"
            );
        });

        it("💵 Can withdraw (with penalty and fee)", async () => {
            await basicPoolInstance.from(admin).init(test_settings.basicPool.fee);

            let feeAmount = await basicPoolInstance.fee();

            assert.equal(
                feeAmount.toString(),
                test_settings.basicPool.fee,
                "Fee has not been implemented"
            );

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
            let withdrawInformation = await basicPoolInstance.canWithdraw(
                user1.signer.address,
                test_settings.basicPool.deposit
            );

            assert.equal(
                poolDaiBalanceAfterDeposit.toString(),
                0,
                "Pool incorrectly has Dai after user deposit"
            );
            assert.equal(
                poolCdaiBalanceAfterDeposit.toString(),
                test_settings.pcTokenSettings.mintAmount.toString(),
                "Pool has incorrect cDai balance after user deposit"
            );
            assert.equal(
                balanceBefore[0].toString(),
                test_settings.basicPool.deposit.toString(),
                "User pool dai balance incorrect"
            );
            assert.equal(
                balanceBefore[1].toString(),
                test_settings.pcTokenSettings.mintAmount.toString(),
                "User pool cDai balance incorrect"
            );
            assert.equal(
                balanceInPcToken.toString(),
                0,
                "user incorrectly has cDai balance (against cDai contract)"
            );
            assert.equal(
                withdrawInformation[0],
                true,
                "User is incorrectly blocked from withdrawing"
            );
            assert.equal(
                withdrawInformation[1].toString(),
                test_settings.basicPool.withdrawAmountOn100.toString(),
                "User is incorrectly blocked from withdrawing"
            );
            assert.equal(
                withdrawInformation[2].toString(),
                test_settings.basicPool.penaltyAmountOn100.toString(),
                "User is incorrectly blocked from withdrawing"
            );
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

            await assert.notRevert(basicPoolInstance.from(user1).withdraw(
                test_settings.basicPool.deposit
            ));

            //TODO check that the fee has been removed from the penalty,
            //TODO that it has not been removed from pool cDai balance
            //TODO check that admin user has been credited correct dai and cDai amount
        });

        it("🚫 Negative testing withdraw", async () => {
            //TODO if expired 
            //TODO if disabled they cannot withdraw
            //TODO no balance to withdraw
        });

        it("Interest withdraw", async () => {
            await pDaiInstance.from(user1).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            await basicPoolInstance.from(user1).deposit(
                test_settings.basicPool.deposit
            );
            console.log("0");
            await pDaiInstance.from(user2).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            await basicPoolInstance.from(user2).deposit(
                test_settings.basicPool.deposit
            );
            console.log("0");
            let tx = await(await basicPoolInstance.from(user2).withdraw(
                test_settings.basicPool.deposit
            )).wait();
            console.log("0");
            await basicPoolInstance.getInterestAmount(user1.signer.address);
        });

        it("Close pool to deposits", async () => {

        });

        it("Kill switch on pool", async () => {

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

        it("Get interest", async () => {
            let interestRatePerBlock = await basicPoolInstance.getInterestRatePerYear();

            assert.equal(
                interestRatePerBlock.toString(),
                test_settings.pcTokenSettings.interestRateYearly.toString(),
                "Unexpected interest rate per year"
            );
        });

        it("", async () => {

        });

        it("", async () => {

        });

        it("", async () => {

        });
    });
});