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

describe("Pool tests - withdraw", async () => {
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

    describe("Withdraw functionality", async () => {
        it("Can withdraw (no penalty)", async () => {    
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
                balanceOfUserInPoolAfterWithdraw[1].toString(),
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

        it("🧪 Can withdraw (penalty)", async () => {   
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

            console.log();

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

            console.log();

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

        it("🧪 Can withdraw (penalty + fee)", async () => {
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

            console.log();

            let penaltyPotBalanceAfter = await basicPoolInstance.penaltyPotBalance();
            let feeCollectedAfter = await basicPoolInstance.accumulativeFee();
            let poolCdaiBalanceAfter = await cDaiInstance.balanceOf(basicPoolInstance.contract.address);
            let checkSum = BigNumber.sum(penaltyPotBalanceAfter, feeCollectedAfter);
            let checkSumForFee = checkSum.multipliedBy(0.2).decimalPlaces(0, 1);
            let userBalances = await basicPoolInstance.getUserInfo(user1.signer.address);
            let userWithdrawInfo = await basicPoolInstance.canWithdraw(
                user1.signer.address,
                test_settings.basicPool.deposit
            );
            let userBalanceInDai = await pDaiInstance.balanceOf(user1.signer.address);
            let poolBalanceInDai = await pDaiInstance.balanceOf(basicPoolInstance.contract.address);

            console.log();

            assert.equal(
                userBalanceInDai.toString(),
                test_settings.pDaiSettings.withdrawWithPenalty.toString(),
                "User balance has not been correctly affected by withdraw"
            );
            assert.equal(
                poolBalanceInDai.toString(),
                0,
                "Pool has excess Dai"
            );
            assert.equal(
                userWithdrawInfo[0],
                false,
                "User is able to withdraw with 0 balance"
            );
            assert.equal(
                userWithdrawInfo[1].toString(),
                0,
                "User is able to withdraw with 0 balance"
            );
            assert.equal(
                userWithdrawInfo[2].toString(),
                0,
                "User is able to withdraw with 0 balance"
            );
            assert.equal(
                checkSum.toString(),
                poolCdaiBalanceAfter.toString(),
                "Pool cDai balance is not equal to penalty and fee"
            );
            assert.equal(
                checkSumForFee.toString(),
                feeCollectedAfter.toString(),
                "Fee collected is not the correct amount"
            );
            assert.equal(
                userBalances[1].toString(),
                0,
                "User has remaining cDai balance after complete withdraw"
            );
            assert.equal(
                userBalances[0].toString(),
                0,
                "User has Dai balance after complete withdraw"
            );
        });

        it("Negative testing withdraw", async () => {
            //TODO if expired 
            //TODO if disabled they cannot withdraw
            //TODO no balance to withdraw
        });
    });

    describe("Interest withdraw functionality", async () => {
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
                test_settings.pcTokenSettings.mintAmountMinusInterestPenalty,
                "Users cdai balance incorrect after deposit"
            );
            assert.equal(
                user2DaiBalanceAfterDeposit.toString(),
                test_settings.pDaiSettings.mintAmountMinusDeposit,
                "User dai balance incorrect after deposit"
            );
            assert.equal(
                user2DaiBalanceAfterInterestWithdraw.toString(),
                test_settings.pDaiSettings.withdrawInterestBalancePenalty,
                "User dai balance has not been incremented with interest withdraw"
            );
        });

        it("Interest withdraw (interest)", async () => {
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
            await pDaiInstance.from(user2).approve(
                basicPoolInstance.contract.address,
                test_settings.basicPool.deposit
            );
            await basicPoolInstance.from(user2).deposit(
                test_settings.basicPool.deposit
            );
            // Creating earned interest
            await cDaiInstance.from(admin).increaseExchange(test_settings.pcTokenSettings.exchangeIncrease);

            let user2DaiBalanceAfterDeposit = await pDaiInstance.balanceOf(user2.signer.address);
            let userDetailsAfterDeposit = await basicPoolInstance.getUserInfo(user2.signer.address);
            
            // Withdrawing the interest
            await(await basicPoolInstance.from(user2).withdrawInterest()).wait();

            let user2DaiBalanceAfterInterestWithdraw = await pDaiInstance.balanceOf(user2.signer.address);
            let userDetailsAfterInterestWithdraw = await basicPoolInstance.getUserInfo(user2.signer.address);

            console.log("");

            assert.equal(
                user2DaiBalanceAfterDeposit.toString(),
                test_settings.pDaiSettings.mintAmountMinusDeposit.toString(),
                "User dai balance incorrect after deposit"
            );
            assert.equal(
                userDetailsAfterDeposit[0].toString(),
                test_settings.basicPool.deposit.toString(),
                "User dai balance in pool incorrectly affected"
            );
            assert.equal(
                userDetailsAfterDeposit[1].toString(),
                test_settings.pcTokenSettings.mintAmount.toString(),
                "User dai balance in pool incorrectly affected"
            );
            assert.equal(
                userDetailsAfterInterestWithdraw[0].toString(),
                test_settings.basicPool.deposit.toString(),
                "User dai balance in pool incorrectly affected"
            );
            assert.equal(
                userDetailsAfterInterestWithdraw[1].toString(),
                test_settings.pcTokenSettings.mintAmountMinusInterest.toString(),
                "User dai balance in pool incorrectly affected"
            );
            assert.equal(
                user2DaiBalanceAfterInterestWithdraw.toString(),
                test_settings.pDaiSettings.withdrawInterestBalance.toString(),
                "User dai balance has not been incremented to include interest"
            );
        });

        it("🧪 Interest withdraw (penalty & interest + fee)", async () => {
            await basicPoolInstance.from(admin).init(test_settings.basicPool.fee);
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
            // Creating earned interest
            await cDaiInstance.from(admin).increaseExchange(test_settings.pcTokenSettings.exchangeIncrease);

            let user2DaiBalanceAfterDeposit = await pDaiInstance.balanceOf(user2.signer.address);
            let userDetailsAfterDeposit = await basicPoolInstance.getUserInfo(user2.signer.address);
            
            // Withdrawing the interest
            await(await basicPoolInstance.from(user2).withdrawInterest()).wait();

            let user2DaiBalanceAfterInterestWithdraw = await pDaiInstance.balanceOf(user2.signer.address);
            let userDetailsAfterInterestWithdraw = await basicPoolInstance.getUserInfo(user2.signer.address);
            let cDaiBalanceBefore = new BigNumber(userDetailsAfterDeposit[1].toString());
            let cDaiBalanceAfterInterestWithdraw = new BigNumber(userDetailsAfterInterestWithdraw[1].toString());
            let diff = cDaiBalanceBefore.minus(cDaiBalanceAfterInterestWithdraw);

            console.log("");

            assert.equal(
                diff.toString(),
                test_settings.basicPool.penaltyShareMinusFeePlusInterest.toString(),
                "Difference between balances does not equal penalty share + interest (- fee)"
            );
            assert.equal(
                user2DaiBalanceAfterDeposit.toString(),
                test_settings.pDaiSettings.mintAmountMinusDeposit.toString(),
                "User dai balance incorrect after deposit"
            );
            assert.equal(
                user2DaiBalanceAfterInterestWithdraw.toString(),
                test_settings.pDaiSettings.withdrawInterestPusPenaltyMinusFee.toString(),
                "User dai balance has not been incremented to include interest"
            );
            assert.equal(
                userDetailsAfterDeposit[0].toString(),
                test_settings.basicPool.deposit.toString(),
                "User dai balance in pool incorrectly affected"
            );
            assert.equal(
                userDetailsAfterDeposit[1].toString(),
                test_settings.pcTokenSettings.mintAmount.toString(),
                "User dai balance in pool incorrectly affected"
            );
            assert.equal(
                userDetailsAfterInterestWithdraw[0].toString(),
                test_settings.basicPool.deposit.toString(),
                "User dai balance in pool incorrectly affected"
            );
            assert.equal(
                userDetailsAfterInterestWithdraw[1].toString(),
                test_settings.pcTokenSettings.mintAmountMinusPenaltyInterestFee.toString(),
                "User dai balance in pool incorrectly affected"
            );
        });
    });

    describe("interest withdraw supporting functionality", async () => {
        it("🧪 Get interest amount for user (penalty)", async () => {
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

            console.log("");

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

        it("Get interest amount for user (interest)", async () => {
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

        it("🧪 Get interest amount for user (penalty + fee)", async () => {
            await basicPoolInstance.from(admin).init(test_settings.basicPool.fee);
            let penaltyPot = await basicPoolInstance.penaltyPotBalance();
            let amount = await(await basicPoolInstance.getInterestAmount(user1.signer.address)).wait();

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

            console.log("");

            assert.equal( 
                penaltyPot.toString(),
                test_settings.basicPool.penaltyShareMinusFee,
                "Penalty pot has incorrect balance"
            );
            assert.equal(
                amount.events[0].args.amount.toString(),
                test_settings.basicPool.penaltyShareMinusFee,
                "User does not have access to ful penalty pot portion"
            );
        });

        it("🧪 Get interest amount for user (interest & penalty + fee)", async () => {
            await basicPoolInstance.from(admin).init(test_settings.basicPool.fee);
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
            // Creating earned interest
            await cDaiInstance.from(admin).increaseExchange(test_settings.pcTokenSettings.exchangeIncrease);

            // Ensuring the second user has a share of penalty pot
            amount = await(await basicPoolInstance.getInterestAmount(user2.signer.address)).wait();
            let interest = new BigNumber(amount.events[0].args.amount.toString());
            let diff = interest.minus(penaltyPot);

            console.log("");

            assert.equal( 
                penaltyPot.toString(),
                test_settings.basicPool.penaltyShareMinusFee,
                "Penalty pot has incorrect balance"
            );
            assert.equal(
                amount.events[0].args.amount.toString(),
                test_settings.basicPool.penaltyShareMinusFeePlusInterest,
                "User does not have access to ful penalty pot portion"
            );
            assert.equal(
                diff.toString(),
                test_settings.basicPool.interestEarned.toString(),
                "Interest earned above penalty is not correct"
            );
        });

        //TODO test the final withdraw as well as closing withdraw
    });
});