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
    let user3 = accounts[5];
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
        // Minting dai for user 3
        await pDaiInstance.from(user3).mint();
        // Approving cDai as a spender
        await pDaiInstance.from(user3).approve(
            cDaiInstance.contract.address,
            test_settings.basicPool.deposit
        );
        // Approving dai as a spender
        await cDaiInstance.from(user3).approve(
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
                test_settings.pcTokenSettings.daiBalanceUnrounded,
                "User has incorrect dai balance after redeem"
            );
            assert.equal(
                print.events[1].args.value.toString(),
                test_settings.pcTokenSettings.depositBalanceUnrounded,
                "User has been redeemed the incorrect amount"
            );
            assert.equal(
                pcTokenBalanceInDaiAfter.toString(),
                test_settings.pcTokenSettings.roundingMargin,
                "cDai contract has a balance in dai after redeem"
            );
        });
    });

    describe("Core Functionality", async () => {
        it("Kill switch on pool", async () => {
            await pDaiInstance.from(user1).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            
            await basicPoolInstance.from(user1).deposit(
                test_settings.basicPool.deposit
            );

            let user1BalanceAfterDeposit = await basicPoolInstance.getUserInfo(user1.signer.address);

            basicPoolInstance.from(admin).terminatePool();

            await assert.revert(
                basicPoolInstance.from(user1).deposit(
                    test_settings.basicPool.deposit
                )
            );

            await assert.revert(
                basicPoolInstance.from(user1).withdraw(
                    test_settings.basicPool.deposit
                )
            );

            await assert.revert(
                basicPoolInstance.from(user1).withdrawInterest()
            );

            await assert.revert(
                basicPoolInstance.from(user1).withdrawAndClose()
            );

            let userBalanceBefore = await basicPoolInstance.getUserInfo(user1.signer.address);

            await assert.notRevert(basicPoolInstance.from(user1).finalWithdraw());

            let userBalanceAfter = await basicPoolInstance.getUserInfo(user1.signer.address);

            assert.equal(
                userBalanceBefore[0].toString(),
                test_settings.basicPool.deposit.toString(),
                "User deposit balance incorrect"
            );
            assert.equal(
                userBalanceBefore[1].toString(),
                test_settings.pcTokenSettings.mintAmount,
                "User cdai deposit balance incorrect"
            );
            assert.equal(
                userBalanceAfter[0].toString(),
                0,
                "User dai balance not 0 after final withdraw"
            );
            assert.equal(
                userBalanceAfter[1].toString(),
                0,
                "User cDai balance not 0 after final withdraw"
            );
        });

        it("Pool termination - 0 penalty balance, 2 users", async () => {
            await pDaiInstance.from(user1).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            await basicPoolInstance.from(user1).deposit(
                test_settings.basicPool.deposit
            );
            // User 2 now has a steak in the penalty pot
            await pDaiInstance.from(user2).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            await basicPoolInstance.from(user2).deposit(
                test_settings.basicPool.deposit
            );
           
            let tx2 = await (await basicPoolInstance.from(admin).terminatePool()).wait();

            let aliveStatus = await basicPoolInstance.isPoolActive();

            assert.equal(
                aliveStatus,
                false,
                "The pool has not been terminated"
            );

            let penalty = await basicPoolInstance.penaltyPotBalance();
            let poolBalanceInCdai = await cDaiInstance.balanceOf(basicPoolInstance.contract.address);

            assert.equal(
                penalty.toString(),
                0,
                "Penalty has been incorreclt populated"
            );
            assert.equal(
                poolBalanceInCdai.toString(),
                test_settings.basicPool.twoUsersFullAmount,
                "Pool has incorrect balance"
            );

            await basicPoolInstance.from(user1).finalWithdraw();

             penalty = await basicPoolInstance.penaltyPotBalance();
             poolBalanceInCdai = await cDaiInstance.balanceOf(basicPoolInstance.contract.address);

            assert.equal(
                penalty.toString(),
                0,
                "Penalty has been incorreclt populated"
            );
            assert.equal(
                poolBalanceInCdai.toString(),
                test_settings.basicPool.twoUsersHalfAmount,
                "Pool has not had half balance removed"
            );

            await basicPoolInstance.from(user2).finalWithdraw();

             penalty = await basicPoolInstance.penaltyPotBalance();
             poolBalanceInCdai = await cDaiInstance.balanceOf(basicPoolInstance.contract.address);

            assert.equal(
                penalty.toString(),
                0,
                "Penalty has been incorreclt populated"
            );
            assert.equal(
                poolBalanceInCdai.toString(),
                0,
                "Pool still has balance after both user full withdraw"
            );
        });

        it("Pool termination - non 0 penalty balance, 2 users", async () => {
            // User 1 will now have a steak in the penalty pot
            await pDaiInstance.from(user1).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            await basicPoolInstance.from(user1).deposit(
                test_settings.basicPool.deposit
            );

            // User 2 now has a steak in the penalty pot
            await pDaiInstance.from(user2).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            await basicPoolInstance.from(user2).deposit(
                test_settings.basicPool.deposit
            );

            let user1DaiBalance = await pDaiInstance.balanceOf(user1.signer.address);
            let user2DaiBalance = await pDaiInstance.balanceOf(user2.signer.address);
            let user1Info = await basicPoolInstance.getUserInfo(user1.signer.address);
            let user2Info = await basicPoolInstance.getUserInfo(user2.signer.address);

            assert.equal(
                user1DaiBalance.toString(),
                test_settings.pDaiSettings.mintAmountMinusDeposit,
                "Users balance not as expected after deposit"
            );
            assert.equal(
                user1DaiBalance.toString(),
                user2DaiBalance.toString(),
                "Users balances are different after initial deposits of same amount"
            );
            assert.equal(
                user1Info[0].toString(),
                test_settings.basicPool.deposit.toString(),
                "User internal dai balance not as expected after deposit"
            );
            assert.equal(
                user1Info[0].toString(),
                user2Info[0].toString(),
                "User internal pool dai balances are different after initial deposits of same amount"
            );
            assert.equal(
                user1Info[1].toString(),
                test_settings.basicPool.twoUsersHalfAmount,
                "User internal pool cdai balance not as expected after deposit"
            );
            assert.equal(
                user1Info[1].toString(),
                user2Info[1].toString(),
                "User internal pool cdai balances are different after initial deposits of same amount"
            );

            let tx = await(await basicPoolInstance.from(user2).withdraw(
                test_settings.basicPool.deposit
            )).wait();

            user2DaiBalance = await pDaiInstance.balanceOf(user2.signer.address);
            user2Info = await basicPoolInstance.getUserInfo(user2.signer.address);
            let penaltyPotBalanceAfterWithdraw = await basicPoolInstance.penaltyPotBalance();
            let totalPoolCdaiBalance = await cDaiInstance.balanceOf(basicPoolInstance.contract.address);

            assert.equal(
                user2DaiBalance.toString(),
                test_settings.pDaiSettings.withdrawWithPenalty,
                "User 2 balance has not been incrfeased as expected afer full withdraw"
            );
            assert.equal(
                user2Info[0].toString(),
                0,
                "User 2 has unexpected internal pool dai balance"
            );
            assert.equal(
                user2Info[1].toString(),
                1,
                "User 2 has unexpected internal pool cDai balance"
            );
            assert.equal(
                penaltyPotBalanceAfterWithdraw.toString(),
                test_settings.basicPool.penaltyAmountInCdai,
                "Penalty amount in pool is unexpected after user 2 fill withdraw"
            );
            assert.equal(
                totalPoolCdaiBalance.toString(),
                test_settings.basicPool.poolBalanceWithOneUserAndPenalty,
                "Pool cDai balance is unexpected after user 2 full withdraw"
            );

            let tx2 = await (await basicPoolInstance.from(admin).terminatePool()).wait();
            let aliveStatus = await basicPoolInstance.isPoolActive();

            assert.equal(
                aliveStatus,
                false,
                "The pool has not been terminated"
            );

            await basicPoolInstance.from(user1).finalWithdraw();

            user1DaiBalance = await pDaiInstance.balanceOf(user1.signer.address);
            user1Info = await basicPoolInstance.getUserInfo(user1.signer.address);
            penaltyPotBalanceAfterWithdraw = await basicPoolInstance.penaltyPotBalance();
            totalPoolCdaiBalance = await cDaiInstance.balanceOf(basicPoolInstance.contract.address);

            assert.equal(
                user1DaiBalance.toString(),
                test_settings.pDaiSettings.otherWithdrawInterestBalancePenalty,
                "User dai balance is an unexpected after final withdraw"
            );
            assert.equal(
                user1Info[0].toString(),
                0,
                "User 1 is an undexpected internal pool dai balance after final withdraw"
            );
            assert.equal(
                user1Info[1].toString(),
                0,
                "User 1 is an undexpected internal pool cDai balance after final withdraw"
            );
            assert.equal(
                penaltyPotBalanceAfterWithdraw.toString(),
                1,
                "Penalty pot is an unexpected vaule after user 1 final withdraw"
            );
            assert.equal(
                totalPoolCdaiBalance.toString(),
                2,
                "Pool cDai balance is an unexpected vaule after user 1 final withdraw"
            );

            await assert.revert(basicPoolInstance.from(user2).finalWithdraw());

            user2DaiBalance = await pDaiInstance.balanceOf(user2.signer.address);
            user2Info = await basicPoolInstance.getUserInfo(user2.signer.address);
            penaltyPotBalanceAfterWithdraw = await basicPoolInstance.penaltyPotBalance();
            totalPoolCdaiBalance = await cDaiInstance.balanceOf(basicPoolInstance.contract.address);

            assert.equal(
                user2DaiBalance.toString(),
                test_settings.pDaiSettings.withdrawWithPenalty,
                "User 2 balance has not been incrfeased as expected afer full withdraw"
            );
            assert.equal(
                user2Info[0].toString(),
                0,
                "User 2 has unexpected internal pool dai balance"
            );
            assert.equal(
                user2Info[1].toString(),
                1,
                "User 2 has unexpected internal pool cDai balance"
            );
            assert.equal(
                penaltyPotBalanceAfterWithdraw.toString(),
                1,
                "Penalty amount in pool is unexpected after user 2 fill withdraw"
            ); //TODO this should equal 0
            assert.equal(
                totalPoolCdaiBalance.toString(),
                2,
                "Pool cDai balance is unexpected after user 2 full withdraw"
            ); //TODO this shoild = 0
        });

        it("Pool termination - non 0 penalty balance, 3 users", async () => {
            // User 1 will now have a steak in the penalty pot
            await pDaiInstance.from(user1).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            await basicPoolInstance.from(user1).deposit(
                test_settings.basicPool.deposit
            );

            // User 2 now has a steak in the penalty pot
            await pDaiInstance.from(user2).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            await basicPoolInstance.from(user2).deposit(
                test_settings.basicPool.deposit
            );

            // User 2 now has a steak in the penalty pot
            await pDaiInstance.from(user3).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            await basicPoolInstance.from(user3).deposit(
                test_settings.basicPool.deposit
            );

            let user1DaiBalance = await pDaiInstance.balanceOf(user1.signer.address);
            let user2DaiBalance = await pDaiInstance.balanceOf(user2.signer.address);
            let user3DaiBalance = await pDaiInstance.balanceOf(user3.signer.address);
            let user1Info = await basicPoolInstance.getUserInfo(user1.signer.address);
            let user2Info = await basicPoolInstance.getUserInfo(user2.signer.address);
            let user3Info = await basicPoolInstance.getUserInfo(user3.signer.address);

            assert.equal(
                user1DaiBalance.toString(),
                test_settings.pDaiSettings.mintAmountMinusDeposit,
                "Users balance not as expected after deposit"
            );
            assert.equal(
                user1DaiBalance.toString(),
                user2DaiBalance.toString(),
                "Users balances are different after initial deposits of same amount"
            );
            assert.equal(
                user3DaiBalance.toString(),
                user2DaiBalance.toString(),
                "Users balances are different after initial deposits of same amount"
            );
            assert.equal(
                user1Info[0].toString(),
                test_settings.basicPool.deposit.toString(),
                "User internal dai balance not as expected after deposit"
            );
            assert.equal(
                user1Info[0].toString(),
                user2Info[0].toString(),
                "User internal pool dai balances are different after initial deposits of same amount"
            );
            assert.equal(
                user3Info[0].toString(),
                user2Info[0].toString(),
                "User internal pool dai balances are different after initial deposits of same amount"
            );
            assert.equal(
                user1Info[1].toString(),
                test_settings.basicPool.twoUsersHalfAmount,
                "User internal pool cdai balance not as expected after deposit"
            );
            assert.equal(
                user1Info[1].toString(),
                user2Info[1].toString(),
                "User internal pool cdai balances are different after initial deposits of same amount"
            );
            assert.equal(
                user3Info[1].toString(),
                user2Info[1].toString(),
                "User internal pool cdai balances are different after initial deposits of same amount"
            );

            let tx = await(await basicPoolInstance.from(user2).withdraw(
                test_settings.basicPool.withdraw
            )).wait();

            user2DaiBalance = await pDaiInstance.balanceOf(user2.signer.address);
            user2Info = await basicPoolInstance.getUserInfo(user2.signer.address);
            let penaltyPotBalanceAfterWithdraw = await basicPoolInstance.penaltyPotBalance();
            let totalPoolCdaiBalance = await cDaiInstance.balanceOf(basicPoolInstance.contract.address);

            assert.equal(
                user2DaiBalance.toString(),
                test_settings.pDaiSettings.partialWithdrawWithPeanlty,
                "User 2 balance has not been incrfeased as expected afer full withdraw"
            );
            assert.equal(
                user2Info[0].toString(),
                test_settings.basicPool.withdraw.toString(),
                "User 2 has unexpected internal pool dai balance"
            );
            assert.equal(
                user2Info[1].toString(),
                test_settings.basicPool.userBalanceIncDdaiAfterWithdraw.toString(),
                "User 2 has unexpected internal pool cDai balance"
            );
            assert.equal(
                penaltyPotBalanceAfterWithdraw.toString(),
                test_settings.basicPool.penaltyInterest,
                "Penalty amount in pool is unexpected after user 2 partial withdraw"
            );
            assert.equal(
                totalPoolCdaiBalance.toString(),
                test_settings.pcTokenSettings.poolBalanceAfterPartialWithdraw,
                "Pool cDai balance is unexpected after user 2 partial withdraw"
            );

            tx = await(await basicPoolInstance.from(user3).withdraw(
                test_settings.basicPool.deposit
            )).wait();

            user3DaiBalance = await pDaiInstance.balanceOf(user3.signer.address);
            user3Info = await basicPoolInstance.getUserInfo(user3.signer.address);
            penaltyPotBalanceAfterWithdraw = await basicPoolInstance.penaltyPotBalance();
            totalPoolCdaiBalance = await cDaiInstance.balanceOf(basicPoolInstance.contract.address);

            assert.equal(
                user3DaiBalance.toString(),
                test_settings.pDaiSettings.withdrawWithPenalty,
                "User 3 balance has not been incrfeased as expected afer full withdraw"
            );
            assert.equal(
                user3Info[0].toString(),
                0,
                "User 3 has unexpected internal pool dai balance"
            );
            assert.equal(
                user3Info[1].toString(),
                1,
                "User 3 has unexpected internal pool cDai balance"
            );
            assert.equal(
                penaltyPotBalanceAfterWithdraw.toString(),
                test_settings.basicPool.penaltyAountinCdaiTwoUserWithdraw,
                "Penalty amount in pool is unexpected after user 3 fill withdraw"
            );
            assert.equal(
                totalPoolCdaiBalance.toString(),
                test_settings.pcTokenSettings.poolBalanceAfterPartialAndFullWithraw,
                "Pool cDai balance is unexpected after user 3 full withdraw"
            );

            let tx2 = await (await basicPoolInstance.from(admin).terminatePool()).wait();
            let aliveStatus = await basicPoolInstance.isPoolActive();

            assert.equal(
                aliveStatus,
                false,
                "The pool has not been terminated"
            );

            await basicPoolInstance.from(user1).finalWithdraw();

            user1DaiBalance = await pDaiInstance.balanceOf(user1.signer.address);
            user1Info = await basicPoolInstance.getUserInfo(user1.signer.address);
            penaltyPotBalanceAfterWithdraw = await basicPoolInstance.penaltyPotBalance();
            totalPoolCdaiBalance = await cDaiInstance.balanceOf(basicPoolInstance.contract.address);

            assert.equal(
                user1DaiBalance.toString(),
                test_settings.pDaiSettings.otherWithdrawInterestBalancePenalty,
                "User dai balance is an unexpected after final withdraw"
            );
            assert.equal(
                user1Info[0].toString(),
                0,
                "User 1 is an undexpected internal pool dai balance after final withdraw"
            );
            assert.equal(
                user1Info[1].toString(),
                0,
                "User 1 is an undexpected internal pool cDai balance after final withdraw"
            );
            assert.equal(
                penaltyPotBalanceAfterWithdraw.toString(),
                test_settings.basicPool.penaltyPotAfterInterestWithdraw,
                "Penalty pot is an unexpected vaule after user 1 final withdraw"
            );//TODO this will break if the 1 left behind is fixed
            assert.equal(
                totalPoolCdaiBalance.toString(),
                test_settings.pcTokenSettings.poolBalanceAfterfinalWithdrawUser1,
                "Pool cDai balance is an unexpected vaule after user 1 final withdraw"
            ); //TODO this will break if the 1 left behind is fixed

            await basicPoolInstance.from(user2).finalWithdraw();

            user2DaiBalance = await pDaiInstance.balanceOf(user2.signer.address);
            user2Info = await basicPoolInstance.getUserInfo(user2.signer.address);
            penaltyPotBalanceAfterWithdraw = await basicPoolInstance.penaltyPotBalance();
            totalPoolCdaiBalance = await cDaiInstance.balanceOf(basicPoolInstance.contract.address);

            assert.equal(
                user2DaiBalance.toString(),
                test_settings.pDaiSettings.daiBalanceAfterPartialWithdrawFinalWithdraw,
                "User 2 dai balance is an unexpected after final withdraw"
            );
            assert.equal(
                user2Info[0].toString(),
                0,
                "User 2 is an undexpected internal pool dai balance after final withdraw"
            );
            assert.equal(
                user2Info[1].toString(),
                0,
                "User 2 is an undexpected internal pool cDai balance after final withdraw"
            );
            assert.equal(
                penaltyPotBalanceAfterWithdraw.toString(),
                1,
                "Penalty pot is an unexpected vaule after user 2 final withdraw"
            );//TODO this will break if the 1 left behind is fixed
            assert.equal(
                totalPoolCdaiBalance.toString(),
                2,
                "Pool cDai balance is an unexpected vaule after user 2 final withdraw"
            ); //TODO this will break if the 1 left behind is fixed

            await assert.revert(basicPoolInstance.from(user3).finalWithdraw());
        });

        it("Pool termination - non 0 penalty balance, non 0 fee, 2 users", async () => {
            //TODO
        });

        it("Penalty is distributed evenly", async () => {
            // User 1 will now have a steak in the penalty pot
            await pDaiInstance.from(user1).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            await basicPoolInstance.from(user1).deposit(
                test_settings.basicPool.deposit
            );
            // User 2 now has a steak in the penalty pot
            await pDaiInstance.from(user2).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            await basicPoolInstance.from(user2).deposit(
                test_settings.basicPool.deposit
            );
            // User 3 will now populate the penalty pot
            await pDaiInstance.from(user3).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            await basicPoolInstance.from(user3).deposit(
                test_settings.basicPool.deposit
            );
            let tx = await(await basicPoolInstance.from(user3).withdraw(
                test_settings.basicPool.deposit
            )).wait();

            let penaltyPotBalance = await basicPoolInstance.penaltyPotBalance();
            let user1Interest = await basicPoolInstance.getUserInterest(user1.signer.address);
            let user2Interest = await basicPoolInstance.getUserInterest(user2.signer.address);
            let userPenaltyShareUI = await basicPoolInstance.getUserInfo(user1.signer.address);

            assert.equal(
                penaltyPotBalance.toString(),
                test_settings.basicPool.penaltyAmountInCdai,
                "Penalty pot amount is incorrect after user 3 withdraw"
            );
            assert.equal(
                user1Interest.toString(),
                test_settings.basicPool.penaltyInterest,
                "user 1 has incorrect penalty share portion"
            );
            assert.equal(
                user2Interest.toString(),
                test_settings.basicPool.penaltyInterest,
                "user 2 has incorrect penalty share portion"
            );

            await basicPoolInstance.from(user1).withdrawInterest();

            penaltyPotBalance = await basicPoolInstance.penaltyPotBalance();
            user1Interest = await basicPoolInstance.getUserInterest(user1.signer.address);
            user2Interest = await basicPoolInstance.getUserInterest(user2.signer.address);

            assert.equal(
                penaltyPotBalance.toString(),
                test_settings.basicPool.penaltyPotAfterInterestWithdraw,
                "Penalty pot amount is incorrect after user 1 interest withdraw"
            );
            assert.equal(
                user1Interest.toString(),
                0,
                "user 1 has incorrect penalty share portion after withdrawing interest"
            );
            assert.equal(
                user2Interest.toString(),
                test_settings.basicPool.penaltyInterest,
                "user 2 has incorrect penalty share portion"
            );

            await basicPoolInstance.from(user2).withdrawInterest();

            penaltyPotBalance = await basicPoolInstance.penaltyPotBalance();
            user1Interest = await basicPoolInstance.getUserInterest(user1.signer.address);
            user2Interest = await basicPoolInstance.getUserInterest(user2.signer.address);

            assert.equal(
                penaltyPotBalance.toString(),
                1,
                "Penalty pot amount is incorrect after all users interest withdraw"
            );
            assert.equal(
                user1Interest.toString(),
                0,
                "user 1 has incorrect penalty share portion after withdrawing interest"
            );
            assert.equal(
                user2Interest.toString(),
                0,
                "user 2 has incorrect penalty share portion after withdrawing interest"
            ); 
        });

        it("Penalty is stable between deposits and withdraws", async () => {
            // User 1 will now have a steak in the penalty pot
            await pDaiInstance.from(user1).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            await basicPoolInstance.from(user1).deposit(
                test_settings.basicPool.deposit
            );
            // User 2 now has a steak in the penalty pot
            await pDaiInstance.from(user2).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            await basicPoolInstance.from(user2).deposit(
                test_settings.basicPool.deposit
            );
            // User 3 will now populate the penalty pot
            await pDaiInstance.from(user3).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            await basicPoolInstance.from(user3).deposit(
                test_settings.basicPool.deposit
            );
            let tx = await(await basicPoolInstance.from(user3).withdraw(
                test_settings.basicPool.deposit
            )).wait();

            let penaltyPotBalance = await basicPoolInstance.penaltyPotBalance();
            let user1Interest = await basicPoolInstance.getUserInterest(user1.signer.address);
            let user2Interest = await basicPoolInstance.getUserInterest(user2.signer.address);
            let userPenaltyShareUI = await basicPoolInstance.getUserInfo(user1.signer.address);

            assert.equal(
                penaltyPotBalance.toString(),
                test_settings.basicPool.penaltyAmountInCdai,
                "Penalty pot amount is incorrect after user 3 withdraw"
            );
            assert.equal(
                user1Interest.toString(),
                test_settings.basicPool.penaltyInterest,
                "user 1 has incorrect penalty share portion"
            );
            assert.equal(
                user2Interest.toString(),
                test_settings.basicPool.penaltyInterest,
                "user 2 has incorrect penalty share portion"
            );

            let interestAvaliableUser1 = await basicPoolInstance.getInterestAmount(user1.signer.address);
            let interestAvaliableUser2 = await basicPoolInstance.getInterestAmount(user2.signer.address);
            let interestAvaliableUser3 = await basicPoolInstance.getInterestAmount(user3.signer.address);

            assert.equal(
                interestAvaliableUser1[1].toString(),
                test_settings.basicPool.penaltyInterest,
                "User 1 has incorect penalty balance"
            );
            assert.equal(
                interestAvaliableUser2[1].toString(),
                test_settings.basicPool.penaltyInterest,
                "User 2 has incorect penalty balance"
            );
            assert.equal(
                interestAvaliableUser3[1].toString(),
                0,
                "User 3 has penalty balance after full withraw"
            );
            
            await basicPoolInstance.from(user2).withdraw(
                test_settings.basicPool.withdraw
            );

            interestAvaliableUser1 = await basicPoolInstance.getInterestAmount(user1.signer.address);
            interestAvaliableUser2 = await basicPoolInstance.getInterestAmount(user2.signer.address);
            interestAvaliableUser3 = await basicPoolInstance.getInterestAmount(user3.signer.address);

            assert.equal(
                interestAvaliableUser1[1].toString(),
                test_settings.basicPool.penaltyShare,
                "User 1 has incorect penalty balance"
            );
            assert.equal(
                interestAvaliableUser2[1].toString(),
                test_settings.basicPool.penaltyShare,
                "User 2 has incorect penalty balance"
            );
            assert.equal(
                interestAvaliableUser3[1].toString(),
                test_settings.basicPool.penaltyShare,
                "User 3 has incorect penalty balance"
            );

            await pDaiInstance.from(user2).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.withdraw
            );
            await basicPoolInstance.from(user2).deposit(
                test_settings.basicPool.withdraw
            );

            interestAvaliableUser1 = await basicPoolInstance.getInterestAmount(user1.signer.address);
            interestAvaliableUser2 = await basicPoolInstance.getInterestAmount(user2.signer.address);
            interestAvaliableUser3 = await basicPoolInstance.getInterestAmount(user3.signer.address);

            assert.equal(
                interestAvaliableUser1[1].toString(),
                test_settings.basicPool.penShareAfterWithdraws,
                "User 1 has incorect penalty balance"
            );
            assert.equal(
                interestAvaliableUser2[1].toString(),
                test_settings.basicPool.penShareAfterWithdrawsEarner,
                "User 2 has incorect penalty balance"
            );
            assert.equal(
                interestAvaliableUser3[1].toString(),
                test_settings.basicPool.penShareAfterWithdraws,
                "User 3 has incorect penalty balance"
            );

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

        it("🧪 Get total balance", async () => {
            let user1Balance = await basicPoolInstance.getUserBalance(user1.signer.address);
            let user2Balance = await basicPoolInstance.getUserBalance(user2.signer.address);
            let penaltyPotBalace = await basicPoolInstance.penaltyPotBalance();

            assert.equal(
                user1Balance.toString(),
                0,
                "User 1 has pre-existing balance"
            );
            assert.equal(
                user2Balance.toString(),
                0,
                "User 2 has pre-existing balance"
            );
            assert.equal(
                penaltyPotBalace.toString(),
                0,
                "Penalty pot pre-existing balance"
            );

            await pDaiInstance.from(user1).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            
            await basicPoolInstance.from(user1).deposit(
                test_settings.basicPool.deposit
            );
            
            await assert.notRevert(basicPoolInstance.from(user1).withdrawAndClose());

            user1Balance = await basicPoolInstance.getUserInfo(user1.signer.address);
            user2Balance = await basicPoolInstance.getUserInfo(user2.signer.address);
            penaltyPotBalace = await basicPoolInstance.penaltyPotBalance();

            assert.equal(
                user1Balance[0].toString(),
                0,
                "User 1 has balance after withdrawing"
            );
            assert.equal(
                user1Balance[1].toString(),
                1,
                "User 1 has balance after withdrawing"
            );
            assert.equal(
                user2Balance[0].toString(),
                0,
                "User 2 has pre-existing balance"
            );
            assert.equal(
                penaltyPotBalace.toString(),
                test_settings.basicPool.penaltyAmountInCdai.toString(),
                "Penalty pot has not been contributed towards by premature withdraw"
            );

            await pDaiInstance.from(user2).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            
            await basicPoolInstance.from(user2).deposit(
                test_settings.basicPool.deposit
            );

            console.log()

            user1Balance = await basicPoolInstance.getUserBalance(user1.signer.address);
            user2Balance = await basicPoolInstance.getUserBalance(user2.signer.address);
            penaltyPotBalace = await basicPoolInstance.penaltyPotBalance();

            console.log()

            assert.equal(
                user1Balance.toString(),
                1,
                "User 1 has balance after withdrawing"
            );
            assert.equal(
                user2Balance.toString(),
                test_settings.basicPool.userCdaiBalanceWithPenalty.toString(),
                "User cDai balance + penalty share is incorrect"
            );
            assert.equal(
                penaltyPotBalace.toString(),
                test_settings.basicPool.penaltyAmountInCdai.toString(),
                "Penalty pot has unexpectedly changed"
            );
        });

        it("Get user interest", async () => {
            let userInterest = await basicPoolInstance.getUserInterest(user1.signer.address);

            assert.equal(
                userInterest.toString(),
                0,
                "User has interest before depositing"
            );

            await pDaiInstance.from(user1).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            await basicPoolInstance.from(user1).deposit(
                test_settings.basicPool.deposit
            );

            userInterest = await basicPoolInstance.getUserInterest(user1.signer.address);

            assert.equal(
                userInterest.toString(),
                0,
                "User has interest before interest has been earned"
            );

            await cDaiInstance.from(admin).increaseExchange(test_settings.pcTokenSettings.exchangeIncrease);

            userInterest = await basicPoolInstance.getUserInterest(user1.signer.address);

            assert.equal(
                userInterest.toString(),
                test_settings.basicPool.earnedInterest,
                "User has not earned interest"
            );

            await pDaiInstance.from(user2).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            await basicPoolInstance.from(user2).deposit(
                test_settings.basicPool.deposit
            );
            let tx = await(await basicPoolInstance.from(user2).withdraw(
                test_settings.basicPool.deposit
            )).wait();

            userInterest = await basicPoolInstance.getUserInterest(user1.signer.address);

            assert.equal(
                userInterest.toString(),
                test_settings.basicPool.earnedInterestWithPenalty,
                "User has not gained penalty"
            );
        });

        it("Get user total balance", async () => {
            let userInterest = await basicPoolInstance.getUserBalance(user1.signer.address);

            assert.equal(
                userInterest.toString(),
                0,
                "User has interest before depositing"
            );

            await pDaiInstance.from(user1).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            await basicPoolInstance.from(user1).deposit(
                test_settings.basicPool.deposit
            );

            userInterest = await basicPoolInstance.getUserInterest(user1.signer.address);

            assert.equal(
                userInterest.toString(),
                0,
                "User has interest before interest has been earned"
            );

            await cDaiInstance.from(admin).increaseExchange(test_settings.pcTokenSettings.exchangeIncrease);

            userInterest = await basicPoolInstance.getUserBalance(user1.signer.address);

            assert.equal(
                userInterest.toString(),
                test_settings.basicPool.fullBalanceWithInterest,
                "User has not earned interest"
            );

            await pDaiInstance.from(user2).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            await basicPoolInstance.from(user2).deposit(
                test_settings.basicPool.deposit
            );
            let tx = await(await basicPoolInstance.from(user2).withdraw(
                test_settings.basicPool.deposit
            )).wait();

            userInterest = await basicPoolInstance.getUserBalance(user1.signer.address);

            assert.equal(
                userInterest.toString(),
                test_settings.basicPool.fullBalanceWithInterestAndPenalty,
                "User has not gained penalty"
            );
        });
    });
});