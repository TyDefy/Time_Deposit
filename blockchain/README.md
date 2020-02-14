<div align="center">
    <img src="../webapp/app/images/favicon.png">
    <h1>Nobuntu Time Deposit</h1>
    <h3>A collective savings mechanism</h3>
</div>

---

# Index
* [Time Deposit Purpose](#time-deposit-purpose)
* [Smart contract overview](#smart-contracts-overview)
* [How the smart contracts fit together](#how-the-smart-contracts-fit-together)
* [Individual Contract Breakdown](#individual-contract-breakdown)
    * [Registry](#registry)
    * [Factory](#factory)
    * [Pool](#pool)
    * [Utilities](#utilities)

---

# Time Deposit Purpose
The time deposit smart contract ecosystem is designed as a collective savings mechanism. The `pool` allows users to deposit Dai (but is designed so that Dai could be swapped out for any ERC20 compliant token). The pool than buys cDai (cDai can be swapped out for any interest bearing token, so long as that token is wrapped in the `ICToken` interface). 

The pool will hold the cDai until the user wishes to withdraw their funds. If the pool is using a `cyclicWithdraw` utility, than the user will be penalized if they try remove funding before the end of the cycle. The penalty is available to any user with tokens inside the pool, distributed by the users portion of cDai to the pools total balance of cDai. This allows for a flat distribution amount depositors.

This contract ecosystem will also serve as the base for future iterations of the time deposit ecosystem. 

# Smart Contracts Overview
The smart contracts for this project where designed in such a way as to allow for  flexible extension of  the contract ecosystem. The hub and spoke pattern was used, as can be seen in the `factory` and `registry`. The `registry` contract stores all deployed pools and their associated information. Factories are registered with the `register` and thereafter are able to register pools. Should a new type of pool be created, a new `factory` can be created to deploy the new pool. The new `factory` can then be registered with the `registry` as a deployer, and be able to deploy and interact with the smart contract ecosystem. 

# How the Smart Contracts Fit Together
Below is a diagram outlining the design and structure of the smart contract architecture. 

<div align="center">
<img src="./imgs/Nobuntu_contract_architecture.png">
</div>

As can be seen by the `Future factory`, `future pools` and `future utils`, this ecosystem has been designed to accommodate newer versions and iterations of the pool and utils. Factories can also be switched on and off as registered deployers. 

# Individual Contract Breakdown
Below is a further break down of important functionality within each of the contracts. 

**Note:** All contracts (except the utilities) inherit `WhitelistAdmin` and are owned and controlled by their admin. The deployer (the address that was used to deploy the contracts) is removed as an admin. This is to ensure the insecure deployer address is never the admin of any contract. The reason the utilities do not inherit from `WhitelistAdmin` is because nothing can change within them after deployment, so they do not need to be admin managed. 

## Registry
The `registry` contract is a storage mechanism for factories, deployed pools and utilities. Factories get resisted as deployers:

```
 /**
   * @notice  Allows a whitelist admin to register a deployer.
   * @param   _deployer The address of the deployer
   * @param   _deployerStatus If the deployer should be active or inactive.
   */
function registerDeployer(
        address _deployer,
        bool _deployerStatus
    )
        public
        onlyWhitelistAdmin()
    {
```
The `_deployerStatus` is used to toggle a deployers status on and off. 

The factory is then able to register pools. The pool can be registered with or without a withdraw utility. Below is the function to register a pool:
```
 /**
   * @notice This allows a registered deployer to register a deployed pool.
   * @param  _admin The address of the admin
   * @param  _pool The address of the pool
   * @param  _withdraw The address of the withdraw library. Note: This can be
   *         a 0 address if the pool was deployed without a withdraw library
   * @param  _poolName The name of the pool
   * @param  _poolDescription The description of the pool
   * @return bool If the pool was successfully registered
   */
function registerPool(
        address _admin,
        address _pool,
        address _withdraw,
        string memory _poolName,
        string memory _poolDescription
    )
        public
        onlyDeployer()
        returns(bool)
    {
```

The registry also stores the utilities that have been deployed (so that they can be reused in different pools). Below is the function to register a utility:

```
 /**
   * @notice Allows a registered deployer to register a deployed utility
   * @param  _admin The address of the admin (user who deployed)
   * @param  _contract The address of the utility (penalty/cyclic/rolling)
   * @param  _name The name for the utility
   * @param  _type The type of utility being registered (please see the 
   *         ContractType enum for utility types)
   * @return bool If the utility was successfully registered.
   */
function registerUtility(
        address _admin,
        address _contract,
        string memory _name,
        uint8 _type
    )
        public
        onlyDeployer()
        returns(bool)
    {
```
Each utility must be registered separately. 

## Factory


## Pool

## Utilities 