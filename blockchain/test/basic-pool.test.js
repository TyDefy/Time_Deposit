const { 
    ethers,
    etherlime,
    BigNumber,
    basicPoolAbi,
    cyclicWithdrawAbi,
    test_settings
} = require("./testing.settings.js");

describe("Basic Pool Tests", async () => {
    let deployerInsecure = accounts[1];
    let admin = accounts[2];
    let user1 = accounts[3];
    let token = accounts[4];
    
    let basicPoolInstance, cyclicWithdrawInstance;

    beforeEach('', async () => {
        deployer = new etherlime.EtherlimeGanacheDeployer(deployerInsecure.secretKey);

        basicPoolInstance = await deployer.deploy(
            basicPoolAbi, 
            false, 
            admin.signer.address,
            token.signer.address
        );

        cyclicWithdrawInstance = await deployer.deploy(
            cyclicWithdrawAbi, 
            false, 
            basicPoolInstance.contract.address,
            test_settings.cyclicWithdraw.cycleLength,
            test_settings.cyclicWithdraw.withdrawViolation
        );

        await basicPoolInstance
            .from(admin)
            .init(cyclicWithdrawInstance.contract.address);
    });

    describe("Core Functionality", async () => {
        
        it("Can deposit", async () => {
            let balanceBefore = await basicPoolInstance.balanceOf(user1.signer.address);
            await basicPoolInstance.from(user1).deposit(
                test_settings.basicPool.deposit
            );
            let balanceAfter = await basicPoolInstance.balanceOf(user1.signer.address);
            
            //TODO check balance of token increases on contract
            //TODO check balance of tokens decreases on user

            assert.equal(
                balanceBefore.toString(),
                0,
                "Pre-existing balance for user"
            );
            assert.equal(
                balanceAfter.toString(),
                test_settings.basicPool.deposit,
                "user has incorrect balance after"
            );
        });

        it("Negative testing deposit", async () => {
            //TODO if transfer fails, deposit fails
        });

        it("Can withdraw (no penalty)", async () => {            
            await basicPoolInstance.from(user1).deposit(
                test_settings.basicPool.deposit
            );
            let balanceBefore = await basicPoolInstance.balanceOf(user1.signer.address);
            await basicPoolInstance.from(user1).withdraw(
                test_settings.basicPool.withdraw
            );
            let balanceAfter = await basicPoolInstance.balanceOf(user1.signer.address);
            
            //TODO check token balances change

            assert.equal(
                balanceBefore.toString(),
                test_settings.basicPool.deposit,
                "user has incorrect balance after"
            );
            assert.equal(
                balanceAfter.toString(),
                test_settings.basicPool.withdraw,
                "user has incorrect balance after"
            );
        });

        it("Can withdraw (with penalty)", async () => {     
            //TODO add second withdraw       
            await basicPoolInstance.from(user1).deposit(
                test_settings.basicPool.deposit
            );
            let balanceBefore = await basicPoolInstance.balanceOf(user1.signer.address);
            await basicPoolInstance.from(user1).withdraw(
                test_settings.basicPool.withdraw
            );
            let balanceAfter = await basicPoolInstance.balanceOf(user1.signer.address);
            
            //TODO check token balances change
            //TODO check that fee gets taken off
            //TODO ensue and handle fee distribution

            assert.equal(
                balanceBefore.toString(),
                test_settings.basicPool.deposit,
                "user has incorrect balance after"
            );
            assert.equal(
                balanceAfter.toString(),
                test_settings.basicPool.withdraw,
                "user has incorrect balance after"
            );
        });

        it("Negative testing withdraw", async () => {
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
        it("", async () => {

        });

        it("", async () => {

        });

        it("", async () => {

        });
    });
});