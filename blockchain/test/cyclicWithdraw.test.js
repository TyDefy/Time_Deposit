const { 
    ethers,
    etherlime,
    BigNumber,
    cyclicWithdrawAbi,
    test_settings
} = require("./testing.settings.js");

describe("PRT tests", async () => {
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
                test_settings.cyclicWithdraw.withdrawViolation
            );
        });

        it("All variables correctly initialized", async () => {
            let cycleLength = await cyclicWithdrawInstance.getCycle();
            console.log(cycleLength);


            let pmo_role_before = await prtInstance.getUserRole(pmo.signer.address);
            await prtInstance.from(api.signer.address).updateUser(
                pmo.signer.address,
                1
            );
            let ven_2_role_after = await prtInstance.getUserRole(ven_2.signer.address);
            
            // Checking initial state
            assert.equal(pmo_role_before.toString(), 0, "User did not start with no role");
            assert.equal(req_role_before.toString(), 0, "User did not start with no role");
            assert.equal(fin_role_before.toString(), 0, "User did not start with no role");
            assert.equal(hod_role_before.toString(), 0, "User did not start with no role");
            assert.equal(ven_1_role_before.toString(), 0, "User did not start with no role");
            assert.equal(ven_2_role_before.toString(), 0, "User did not start with no role");
        });
    });
});