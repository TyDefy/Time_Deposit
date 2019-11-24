const { 
    ethers,
    etherlime,
    BigNumber,
    prtAbi,
    prt_settings
} = require("./testing.settings.js");

describe("PRT tests", async () => {
    let api = accounts[1];
    let inactive = accounts[2];
    let pmo = accounts[3];
    let req = accounts[4];
    let fin = accounts[5];
    let hod = accounts[6];
    let ven_1 = accounts[7];
    let ven_2 = accounts[8];
    
    let prtInstance;
  
    beforeEach('', async () => {
        deployer = new etherlime.EtherlimeGanacheDeployer(api.secretKey);

        prtInstance = await deployer.deploy(
            prtAbi, 
            false, 
            api.signer.address
        );
    });

    describe("Basic functionality", async () => {
        it("Adding user roles", async () => {
            // Adding a PMO
            let pmo_role_before = await prtInstance.getUserRole(pmo.signer.address);
            await prtInstance.from(api.signer.address).updateUser(
                pmo.signer.address,
                1
            );
            let pmo_role_after = await prtInstance.getUserRole(pmo.signer.address);

            // Adding a REQ
            let req_role_before = await prtInstance.getUserRole(req.signer.address);
            await prtInstance.from(pmo.signer.address).updateUser(
                req.signer.address,
                2
            );
            let req_role_after = await prtInstance.getUserRole(req.signer.address);

            // Adding a FIN
            let fin_role_before = await prtInstance.getUserRole(fin.signer.address);
            await prtInstance.from(pmo.signer.address).updateUser(
                fin.signer.address,
                3
            );
            let fin_role_after = await prtInstance.getUserRole(fin.signer.address);

            // Adding a HOD
            let hod_role_before = await prtInstance.getUserRole(hod.signer.address);
            await prtInstance.from(pmo.signer.address).updateUser(
                hod.signer.address,
                4
            );
            let hod_role_after = await prtInstance.getUserRole(hod.signer.address);

            // Adding a VEN_1
            let ven_1_role_before = await prtInstance.getUserRole(ven_1.signer.address);
            await prtInstance.from(pmo.signer.address).updateUser(
                ven_1.signer.address,
                5
            );
            let ven_1_role_after = await prtInstance.getUserRole(ven_1.signer.address);

            // Adding a VEN_2
            let ven_2_role_before = await prtInstance.getUserRole(ven_2.signer.address);
            await prtInstance.from(api.signer.address).updateUser(
                ven_2.signer.address,
                5
            );
            let ven_2_role_after = await prtInstance.getUserRole(ven_2.signer.address);
            
            // Checking initial state
            assert.equal(pmo_role_before.toString(), 0, "User did not start with no role");
            assert.equal(req_role_before.toString(), 0, "User did not start with no role");
            assert.equal(fin_role_before.toString(), 0, "User did not start with no role");
            assert.equal(hod_role_before.toString(), 0, "User did not start with no role");
            assert.equal(ven_1_role_before.toString(), 0, "User did not start with no role");
            assert.equal(ven_2_role_before.toString(), 0, "User did not start with no role");
            // Checking role change
            assert.equal(pmo_role_after.toString(), 1, "User was not assigned correct role");
            assert.equal(req_role_after.toString(), 2, "User was not assigned correct role");
            assert.equal(fin_role_after.toString(), 3, "User was not assigned correct role");
            assert.equal(hod_role_after.toString(), 4, "User was not assigned correct role");
            assert.equal(ven_1_role_after.toString(), 5, "User was not assigned correct role");
            assert.equal(ven_2_role_after.toString(), 5, "User was not assigned correct role");
        });

        it("Negative testing: Adding user roles (incorrect permissions)", async () => {
            await assert.revert(
                prtInstance.from(ven_2.signer.address).updateUser(
                    ven_2.signer.address,
                    5
                ),
                "User with incorrect permissions added another user"
            );
        });

        it("Negative testing: Adding user roles (user already role)", async () => {
            await prtInstance.from(api.signer.address).updateUser(
                ven_2.signer.address,
                5
            );

            await assert.revert(
                prtInstance.from(pmo.signer.address).updateUser(
                    ven_2.signer.address,
                    5
                ),
                "User already had role, and was re-assigned same role"
            );
        });
    });

    describe("PRT functionality", async () => { 
        beforeEach('', async () => {
            // Setting up users with expected roles
            await prtInstance.from(api.signer.address).updateUser(
                pmo.signer.address,
                1
            );
            await prtInstance.from(api.signer.address).updateUser(
                req.signer.address,
                2
            );
            await prtInstance.from(api.signer.address).updateUser(
                fin.signer.address,
                3
            );
            await prtInstance.from(api.signer.address).updateUser(
                hod.signer.address,
                4
            );
            await prtInstance.from(api.signer.address).updateUser(
                ven_1.signer.address,
                5
            );
            await prtInstance.from(api.signer.address).updateUser(
                ven_2.signer.address,
                5
            );
        });

        it("Creating a token", async () => {
            let tokenId = await prtInstance.from(pmo).startProcessTracker(
                req.signer.address,
                fin.signer.address,
                hod.signer.address,
                [
                    ven_1.signer.address,
                    ven_2.signer.address
                ]
            );
            const transactionReceipt = await prtInstance.verboseWaitForTransaction(tokenId);
            // Checking balances updated correctly
            let balance_of_pmo = await prtInstance.balanceOf(pmo.signer.address);
            
            assert.equal(
                transactionReceipt.events[1].args.token.toString(),
                1,
                "First token created incorrectly"
            );
            assert.equal(balance_of_pmo.toString(), 1, "PMO balance incorrect");
        });

        it("Negative testing: Creating a token (incorrect user roles)", async () => {
            await assert.revert(
                prtInstance.from(pmo).startProcessTracker(
                    fin.signer.address,
                    fin.signer.address,
                    hod.signer.address,
                    [
                        ven_1.signer.address,
                        ven_2.signer.address
                    ]
                ),
                "User had incorrect role assigned to token"
            );
            await assert.revert(
                prtInstance.from(pmo).startProcessTracker(
                    req.signer.address,
                    req.signer.address,
                    hod.signer.address,
                    [
                        ven_1.signer.address,
                        ven_2.signer.address
                    ]
                ),
                "User had incorrect role assigned to token"
            );
            await assert.revert(
                prtInstance.from(pmo).startProcessTracker(
                    req.signer.address,
                    fin.signer.address,
                    req.signer.address,
                    [
                        ven_1.signer.address,
                        ven_2.signer.address
                    ]
                ),
                "User had incorrect role assigned to token"
            );
            await assert.revert(
                prtInstance.from(pmo).startProcessTracker(
                    req.signer.address,
                    fin.signer.address,
                    hod.signer.address,
                    [
                        req.signer.address,
                        ven_2.signer.address
                    ]
                ),
                "User had incorrect role assigned to token"
            );
            await assert.revert(
                prtInstance.from(pmo).startProcessTracker(
                    req.signer.address,
                    fin.signer.address,
                    hod.signer.address,
                    [
                        ven_1.signer.address,
                        hod.signer.address
                    ]
                ),
                "User had incorrect role assigned to token"
            );
        });

        it("Creating multiple tokens", async () => {
            let tokenId = await prtInstance.from(pmo).startProcessTracker(
                req.signer.address,
                fin.signer.address,
                hod.signer.address,
                [
                    ven_1.signer.address,
                    ven_2.signer.address
                ]
            );
            const transactionReceipt = await prtInstance.verboseWaitForTransaction(tokenId);
            let balance_of_pmo_before = await prtInstance.balanceOf(pmo.signer.address);
            let tokenId2 = await prtInstance.from(pmo).startProcessTracker(
                req.signer.address,
                fin.signer.address,
                hod.signer.address,
                [
                    ven_1.signer.address,
                    ven_2.signer.address
                ]
            );
            const transactionReceipt2 = await prtInstance.verboseWaitForTransaction(tokenId2);
            let balance_of_pmo_after = await prtInstance.balanceOf(pmo.signer.address);

            assert.equal(
                transactionReceipt.events[1].args.token.toString(),
                1,
                "First token created incorrectly"
            );
            assert.equal(
                transactionReceipt2.events[1].args.token.toString(),
                2,
                "First token created incorrectly"
            );
            assert.equal(balance_of_pmo_before.toString(), 1, "PMO balance incorrect");
            assert.equal(balance_of_pmo_after.toString(), 2, "PMO balance incorrect");
        });

        it("Negative testing: Creating multiple tokens (failed token creation)", async () => {
            let tokenId = await prtInstance.from(pmo).startProcessTracker(
                req.signer.address,
                fin.signer.address,
                hod.signer.address,
                [
                    ven_1.signer.address,
                    ven_2.signer.address
                ]
            );
            const transactionReceipt = await prtInstance.verboseWaitForTransaction(tokenId);
            let balance_of_pmo_before = await prtInstance.balanceOf(pmo.signer.address);
            await assert.revert(prtInstance.from(req).startProcessTracker(
                req.signer.address,
                fin.signer.address,
                hod.signer.address,
                [
                    ven_1.signer.address,
                    ven_2.signer.address
                ]
            ));
            let balance_of_pmo_after = await prtInstance.balanceOf(pmo.signer.address);

            assert.equal(
                transactionReceipt.events[1].args.token.toString(),
                1,
                "First token created incorrectly"
            );
            assert.equal(balance_of_pmo_before.toString(), 1, "PMO balance incorrect");
            assert.equal(balance_of_pmo_after.toString(), 1, "PMO balance incorrect");
        });
    });
});
