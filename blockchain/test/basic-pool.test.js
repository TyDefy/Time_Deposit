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
        it("Interest withdraw (interest)", async () => {
            // 2 users deposit
            let userDaiBalanceBefore = await pDaiInstance.balanceOf(user1.signer.address);
            let poolDaiBalanceBefore = await pDaiInstance.balanceOf(basicPoolInstance.contract.address);
            let poolCdaiBalanceBefore = await cDaiInstance.balanceOf(basicPoolInstance.contract.address);

            console.log("User dai balance");
            console.log(userDaiBalanceBefore.toString());
            console.log("pool dai balance");
            console.log(poolDaiBalanceBefore.toString());
            console.log("pool cdai balance");
            console.log(poolCdaiBalanceBefore.toString());

            await pDaiInstance.from(user1).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            await basicPoolInstance.from(user1).deposit(
                test_settings.basicPool.deposit
            );

            await cDaiInstance.increaseExchange(test_settings.pcTokenSettings.exchangeIncrease);

            let interstAmount = await(await basicPoolInstance.getInterestAmount(user1.signer.address)).wait();
            console.log(interstAmount);
            console.log(interstAmount.toString());

            await basicPoolInstance.from(user1).withdrawInterest();

            let userDaiBalanceAfter = await pDaiInstance.balanceOf(user1.signer.address);
            let poolDaiBalanceAfter = await pDaiInstance.balanceOf(basicPoolInstance.contract.address);
            let poolCdaiBalanceAfter = await cDaiInstance.balanceOf(basicPoolInstance.contract.address);

            console.log("User dai balance");
            console.log(userDaiBalanceAfter.toString());
            console.log("pool dai balance");
            console.log(poolDaiBalanceAfter.toString());
            console.log("pool cdai balance");
            console.log(poolCdaiBalanceAfter.toString());
        });
        
        it("Interest withdraw (penalty & interest)", async () => {
            // 2 users deposit

            //  1 user withdraws with penalty

            // increase exchange rate

            // user 2 withdraws interest 
        });

        it("Interest withdraw", async () => {
            let poolDaiBalanceBefore = await pDaiInstance.balanceOf(basicPoolInstance.contract.address);
            let poolCdaiBalanceBefore = await cDaiInstance.balanceOf(basicPoolInstance.contract.address);
            let userDaiBalanceBefore = await pDaiInstance.balanceOf(user1.signer.address);
            let user2DaiBalanceBefore = await pDaiInstance.balanceOf(user2.signer.address);

            console.log(poolDaiBalanceBefore.toString());//0
            console.log(poolCdaiBalanceBefore.toString());//0
            console.log(userDaiBalanceBefore.toString());//100000000000000000000000000
            console.log(user2DaiBalanceBefore.toString());//100000000000000000000000000

            await pDaiInstance.from(user1).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            await pDaiInstance.from(user2).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            await basicPoolInstance.from(user1).deposit(
                test_settings.basicPool.deposit
            );
            await basicPoolInstance.from(user2).deposit(
                test_settings.basicPool.deposit
            );

            userDaiBalanceBefore = await pDaiInstance.balanceOf(user1.signer.address);
            user2DaiBalanceBefore = await pDaiInstance.balanceOf(user2.signer.address);

            console.log(userDaiBalanceBefore.toString());//100000000000000000000000000
            console.log(user2DaiBalanceBefore.toString());//100000000000000000000000000

            let tx = await(await basicPoolInstance.from(user2).withdraw(
                test_settings.basicPool.deposit
            )).wait();

            let balanceBefore = await basicPoolInstance.getUserInfo(user1.signer.address);
            let balance2Before = await basicPoolInstance.getUserInfo(user2.signer.address);
            let balanceInPcToken = await cDaiInstance.balanceOf(user1.signer.address);
            let poolDaiBalanceAfterDeposit = await pDaiInstance.balanceOf(basicPoolInstance.contract.address);
            let poolCdaiBalanceAfterDeposit = await cDaiInstance.balanceOf(basicPoolInstance.contract.address);

            console.log("user pool balance");
            console.log(balanceBefore.toString());
            console.log("User 2 balance");
            console.log(balance2Before.toString());
            console.log("user cdai balance");
            console.log(balanceInPcToken.toString());
            console.log("pool dai balance");
            console.log(poolDaiBalanceAfterDeposit.toString());
            console.log("pool cdai balance");
            console.log(poolCdaiBalanceAfterDeposit.toString());

            await basicPoolInstance.from(user1).withdrawInterest();

            let balanceAfter = await basicPoolInstance.getUserInfo(user1.signer.address);
            let balance2After = await basicPoolInstance.getUserInfo(user2.signer.address);
            let balanceInPcTokenAfter = await cDaiInstance.balanceOf(user1.signer.address);
            let poolDaiBalanceAfter = await pDaiInstance.balanceOf(basicPoolInstance.contract.address);
            let poolCdaiBalanceAfter = await cDaiInstance.balanceOf(basicPoolInstance.contract.address);

            console.log("\n<<after interest withdra>>\n\nuser pool balance");
            console.log(balanceAfter.toString());
            console.log("User 2 balance");
            console.log(balance2After.toString());
            console.log("user cdai balance");
            console.log(balanceInPcTokenAfter.toString());
            console.log("pool dai balance");
            console.log(poolDaiBalanceAfter.toString());
            console.log("pool cdai balance");
            console.log(poolCdaiBalanceAfter.toString());
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

        it("Get interest amount for user (penalty pot portion)", async () => {
            let penaltyPot = await basicPoolInstance.penaltyPotBalance();
            let amount = await(await basicPoolInstance.getInterestAmount(user1.signer.address)).wait();

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
            // Ensuring the second user has a share of penalty pot
            amount = await(await basicPoolInstance.getInterestAmount(user2.signer.address)).wait();

            assert.equal( 
                penaltyPot.toString(),
                test_settings.basicPool.penaltyShare,
                "Penalty pot has incorrect balance"
            );
            assert.equal(
                amount.events[0].args.amount.toString(),
                test_settings.basicPool.penaltyShare,
                "User does not have access to ful penalty pot portion"
            );
        });

        it("Get interest amount for user (interest earned)", async () => {
            let penaltyPot = await basicPoolInstance.penaltyPotBalance();
            let amount = await(await basicPoolInstance.getInterestAmount(user1.signer.address)).wait();

            assert.equal(
                penaltyPot.toString(),
                0,
                "Penalty pot incorrectly populated"
            );
            assert.equal(
                amount.events[0].args.amount.toString(),
                0,
                "User incorrectly has interest available"
            );

            // User1 deposits and withdraws amount
            await pDaiInstance.from(user1).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            await basicPoolInstance.from(user1).deposit(
                test_settings.basicPool.deposit
            );
            // Creating earned interest
            await cDaiInstance.from(admin).increaseExchange(test_settings.pcTokenSettings.exchangeIncrease);
            amount = await(await basicPoolInstance.getInterestAmount(user1.signer.address)).wait();

            assert.equal(
                amount.events[0].args.amount.toString(),
                test_settings.basicPool.interestEarned,
                "User interest withdraw amount incorrect"
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