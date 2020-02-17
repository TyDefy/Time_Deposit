const { 
    ethers,
    etherlime,
    BigNumber,
    cyclicWithdrawAbi,
    test_settings
} = require("./testing.settings.js");

describe("Cyclic Withdraw Tests", async () => {
    let deployerInsecure = accounts[1];
    let pool = accounts[2];
    let user1 = accounts[3];
    let user2 = accounts[4];
    
    let cyclicWithdrawInstance;

    describe("Isolated functionality", async () => {
        beforeEach('', async () => {
            deployer = new etherlime.EtherlimeGanacheDeployer(deployerInsecure.secretKey);
    
            cyclicWithdrawInstance = await deployer.deploy(
                cyclicWithdrawAbi, 
                false, 
                pool.signer.address,
                test_settings.cyclicWithdraw.cycleLength,
                test_settings.cyclicWithdraw.withdrawViolation,
                test_settings.cyclicWithdraw.interestWithdrawViolation
            );
        });

        it("All variables correctly initialized", async () => {
            let cycleLength = await cyclicWithdrawInstance.getCycle();
            let canWithdraw = await cyclicWithdrawInstance.canWithdrawInViolation();
            let canWithdrawInterest = await cyclicWithdrawInstance.canWithdrawInterestInViolation();
            let penaltyInstance = await cyclicWithdrawInstance.getPenalty();

            assert.equal(
                test_settings.cyclicWithdraw.cycleLength,
                cycleLength.toString(),
                "Cycle length incorrect"
            );
            assert.equal(
                canWithdraw,
                test_settings.cyclicWithdraw.withdrawViolation,
                "Can withdraw in violation"
            );
            assert.equal(
                canWithdrawInterest,
                test_settings.cyclicWithdraw.interestWithdrawViolation,
                "Can withdraw in violation"
            );
            assert.equal(
                penaltyInstance,
                pool.signer.address,
                "Can withdraw in violation"
            );
        });
    });
});