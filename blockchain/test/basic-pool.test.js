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
        it("Interest withdraw (penalty)", async () => {
            let penaltyPot = await basicPoolInstance.penaltyPotBalance();
            let amount = await(await basicPoolInstance.getInterestAmount(user2.signer.address)).wait();
            let user2DaiBalanceBefore = await pDaiInstance.balanceOf(user2.signer.address);
            let poolCdaiBalanceBefore = await cDaiInstance.balanceOf(basicPoolInstance.contract.address);
            let userDetailsBefore = await basicPoolInstance.getUserInfo(user2.signer.address);

            console.log("");

            assert.equal(
                amount.events[0].args.amount.toString(),
                0,
                "Interest amount is not 0 before penalty populated"
            );
            assert.equal(
                penaltyPot.toString(),
                0,
                "Penalty pot incorrectly has balance"
            );
            assert.equal(
                user2DaiBalanceBefore.toString(),
                test_settings.pDaiSettings.mintAmount,
                "User has incorrect initial dai balance"
            );
            assert.equal(
                poolCdaiBalanceBefore.toString(),
                0,
                "Pool incorrectly has cDai balance before deposits"
            );
            assert.equal(
                userDetailsBefore[0].toString(),
                0,
                "User has dai balance before deposit"
            );
            assert.equal(
                userDetailsBefore[1].toString(),
                0,
                "User has cDai balance before deposit"
            );

            // User1 deposits and withdraws amount
            await pDaiInstance.from(user1).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            await basicPoolInstance.from(user1).deposit(
                test_settings.basicPool.deposit
            );
            let tx = await(await basicPoolInstance.from(user1).withdraw(
                test_settings.basicPool.deposit
            )).wait();
            // Ensuring the penalty pot has funds
            penaltyPot = await basicPoolInstance.penaltyPotBalance();
            // User 2 deposits into pool to have stake on penalty pot
            await pDaiInstance.from(user2).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            await basicPoolInstance.from(user2).deposit(
                test_settings.basicPool.deposit
            );
            let user2DaiBalanceAfterDeposit = await pDaiInstance.balanceOf(user2.signer.address);
            let userDetailsAfterDeposit = await basicPoolInstance.getUserInfo(user2.signer.address);
            // Withdrawing the interest
            await(await basicPoolInstance.from(user2).withdrawInterest()).wait();

            let user2DaiBalanceAfterInterestWithdraw = await pDaiInstance.balanceOf(user2.signer.address);
            let userDetailsAfterInterestWithdraw = await basicPoolInstance.getUserInfo(user2.signer.address);

            console.log("");

            assert.equal(
                userDetailsAfterDeposit[0].toString(),
                test_settings.basicPool.deposit,
                "Users dai balance incorrect after deposit"
            );
            assert.equal(
                userDetailsAfterDeposit[1].toString(),
                test_settings.pcTokenSettings.mintAmount,
                "Users cdai balance incorrect after deposit"
            );
            assert.equal(
                userDetailsAfterInterestWithdraw[0].toString(),
                test_settings.basicPool.deposit,
                "Users dai balance incorrectly affected by withdraw interest"
            );
            assert.equal(
                userDetailsAfterInterestWithdraw[1].toString(),
                test_settings.pcTokenSettings.mintAmountMinusInterest,
                "Users cdai balance incorrect after deposit"
            );
            assert.equal(
                user2DaiBalanceAfterDeposit.toString(),
                test_settings.pDaiSettings.mintAmountMinusDeposit,
                "User dai balance incorrect after deposit"
            );
            assert.equal(
                user2DaiBalanceAfterInterestWithdraw.toString(),
                test_settings.pDaiSettings.withdrawInterestBalance,
                "User dai balance has not been incremented with interest withdraw"
            );
        });

        it("Interest withdraw (interest)", async () => {
            // // 2 users deposit
            // let userDaiBalanceBefore = await pDaiInstance.balanceOf(user1.signer.address);
            // let poolDaiBalanceBefore = await pDaiInstance.balanceOf(basicPoolInstance.contract.address);
            // let poolCdaiBalanceBefore = await cDaiInstance.balanceOf(basicPoolInstance.contract.address);

            // console.log("User dai balance");
            // console.log(userDaiBalanceBefore.toString());
            // console.log("pool dai balance");
            // console.log(poolDaiBalanceBefore.toString());
            // console.log("pool cdai balance");
            // console.log(poolCdaiBalanceBefore.toString());

            // await pDaiInstance.from(user1).approve(
            //     basicPoolInstance.contract.address,
            //     test_settings.basicPool.deposit
            // );
            // await basicPoolInstance.from(user1).deposit(
            //     test_settings.basicPool.deposit
            // );

            // await cDaiInstance.increaseExchange(test_settings.pcTokenSettings.exchangeIncrease);

            // let interstAmount = await(await basicPoolInstance.getInterestAmount(user1.signer.address)).wait();
            // console.log(interstAmount);
            // console.log(interstAmount.toString());

            // await basicPoolInstance.from(user1).withdrawInterest();

            // let userDaiBalanceAfter = await pDaiInstance.balanceOf(user1.signer.address);
            // let poolDaiBalanceAfter = await pDaiInstance.balanceOf(basicPoolInstance.contract.address);
            // let poolCdaiBalanceAfter = await cDaiInstance.balanceOf(basicPoolInstance.contract.address);

            // console.log("User dai balance");
            // console.log(userDaiBalanceAfter.toString());
            // console.log("pool dai balance");
            // console.log(poolDaiBalanceAfter.toString());
            // console.log("pool cdai balance");
            // console.log(poolCdaiBalanceAfter.toString());
        });
        
        it("Interest withdraw (penalty & interest)", async () => {
            // 2 users deposit

            //  1 user withdraws with penalty

            // increase exchange rate

            // user 2 withdraws interest 
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

        it("Get interest per year", async () => {
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
    });
});