// const { 
//     ethers,
//     etherlime,
//     BigNumber,
//     cyclicWithdrawAbi,
//     test_settings
// } = require("./testing.settings.js");

// describe("Cyclic Withdraw Tests", async () => {
//     let deployerInsecure = accounts[1];
//     let pool = accounts[2];
//     let user1 = accounts[3];
//     let user2 = accounts[4];
    
//     let cyclicWithdrawInstance;

//     describe("Isolated functionality", async () => {
//         beforeEach('', async () => {
//             deployer = new etherlime.EtherlimeGanacheDeployer(deployerInsecure.secretKey);
    
//             cyclicWithdrawInstance = await deployer.deploy(
//                 cyclicWithdrawAbi, 
//                 false, 
//                 pool.signer.address,
//                 test_settings.cyclicWithdraw.cycleLength,
//                 test_settings.cyclicWithdraw.withdrawViolation
//             );
//         });

//         it("All variables correctly initialized", async () => {
//             let cycleLength = await cyclicWithdrawInstance.getCycle();
//             let canWithdraw = await cyclicWithdrawInstance.cantWithdrawInViolation();

//             assert.equal(
//                 test_settings.cyclicWithdraw.cycleLength,
//                 cycleLength.toString(),
//                 "Cycle length incorrect"
//             );
//             assert.equal(
//                 test_settings.cyclicWithdraw.withdrawViolation,
//                 canWithdraw,
//                 "Can withdraw in violation"
//             );
//         });

//         it("Unitized variables secure", async () => {
//             let balance = await cyclicWithdrawInstance.from(user1).balanceOf(user1.signer.address);
//             let userInfo = await cyclicWithdrawInstance.cantWithdrawInViolation();

//             console.log(balance)
//             // assert.equal(
//             //     test_settings.cyclicWithdraw.cycleLength,
//             //     cycleLength.toString(),
//             //     "Cycle length incorrect"
//             // );
//             // assert.equal(
//             //     test_settings.cyclicWithdraw.withdrawViolation,
//             //     canWithdraw,
//             //     "Can withdraw in violation"
//             // );
//         });
//     });
// });