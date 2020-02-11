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
        it("Close pool to deposits", async () => {
            //TODO
        });

        it("Kill switch on pool", async () => {
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
            console.log("Penalty Pot:\t" + penaltyPotBalance.toString());

            let userPenaltyShare = await basicPoolInstance.getTotalBalance(user1.signer.address);
            console.log("User 1 tb:\t" + userPenaltyShare.toString())

            let user2PenaltyShare = await basicPoolInstance.getTotalBalance(user2.signer.address);
            console.log("User 2 tb:\t" + user2PenaltyShare.toString())

            let user3PenaltyShare = await basicPoolInstance.getTotalBalance(user3.signer.address);
            console.log("User 3 tb:\t" + user3PenaltyShare.toString())

            // User 1 withdraws their portion of the penalty pot
            await basicPoolInstance.from(user1).withdrawInterest();

            penaltyPotBalance = await basicPoolInstance.penaltyPotBalance();
            console.log("Penalty Pot:\t" + penaltyPotBalance.toString());

            userPenaltyShare = await basicPoolInstance.getTotalBalance(user1.signer.address);
            console.log("User 1 tb:\t" + userPenaltyShare.toString())

            user2PenaltyShare = await basicPoolInstance.getTotalBalance(user2.signer.address);
            console.log("User 2 tb:\t" + user2PenaltyShare.toString())

            // User 1 withdraws more than their share of the penalty pot
            await basicPoolInstance.from(user1).withdrawInterest();

            penaltyPotBalance = await basicPoolInstance.penaltyPotBalance();
            console.log("Penalty Pot:\t" + penaltyPotBalance.toString());

            userPenaltyShare = await basicPoolInstance.getTotalBalance(user1.signer.address);
            console.log("User 1 tb:\t" + userPenaltyShare.toString())

            user2PenaltyShare = await basicPoolInstance.getTotalBalance(user2.signer.address);
            console.log("User 2 tb:\t" + user2PenaltyShare.toString())

            /**
            Penalty Pot:	71056945513
            User 1 tb:	    509241442848
            User 2 tb:	    509241442848 //User 2's balance should not change between this call 
            User 3 tb:	    1
            User one withdraw's their interest
            Penalty Pot:	35528472757
            User 1 tb:	    473712970092
            User 2 tb:	    492169319576 //and this call???????
            User one trys to withdraw interest again
            Penalty Pot:	35528472757
            User 1 tb:	    473712970092
            User 2 tb:	    492169319576
             */
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

        it("Get interest per year", async () => {
            let interestRatePerBlock = await basicPoolInstance.getInterestRatePerYear();

            assert.equal(
                interestRatePerBlock.toString(),
                test_settings.pcTokenSettings.interestRateYearly.toString(),
                "Unexpected interest rate per year"
            );
        });

        it("🧪 Get total balance", async () => {
            let user1Balance = await basicPoolInstance.getTotalBalance(user1.signer.address);
            let user2Balance = await basicPoolInstance.getTotalBalance(user2.signer.address);
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

            let user1BalanceAfterDeposit = await basicPoolInstance.getUserInfo(user1.signer.address);
            console.log(user1BalanceAfterDeposit[0].toString())
            console.log(user1BalanceAfterDeposit[1].toString())
            console.log()

            await assert.notRevert(basicPoolInstance.from(user1).withdrawAndClose());

            user1Balance = await basicPoolInstance.getUserInfo(user1.signer.address);
            user2Balance = await basicPoolInstance.getUserInfo(user2.signer.address);
            penaltyPotBalace = await basicPoolInstance.penaltyPotBalance();
            
            console.log(user1Balance[0].toString())
            console.log(user1Balance[1].toString())//TODO This = 1, should be 0
            console.log(penaltyPotBalace.toString())

            assert.equal(
                user1Balance[0].toString(),
                0,
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

            user1Balance = await basicPoolInstance.getTotalBalance(user1.signer.address);//TODO = 1 should be 0
            user2Balance = await basicPoolInstance.getTotalBalance(user2.signer.address);
            penaltyPotBalace = await basicPoolInstance.penaltyPotBalance();

            console.log()

            // assert.equal(
            //     user1Balance.toString(),
            //     0,
            //     "User 1 has balance after withdrawing"
            // );
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
            let userInterest = await basicPoolInstance.getTotalBalance(user1.signer.address);

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

            userInterest = await basicPoolInstance.getTotalBalance(user1.signer.address);

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

            userInterest = await basicPoolInstance.getTotalBalance(user1.signer.address);

            assert.equal(
                userInterest.toString(),
                test_settings.basicPool.fullBalanceWithInterestAndPenalty,
                "User has not gained penalty"
            );
        });
    });
});