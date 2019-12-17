pragma solidity 0.5.10;

import { BasicRegistry } from "./BasicRegistry.sol";
import { BasicPool } from "./BasicPool.sol";
import { CyclicWithdraw } from "./CyclicWithdraw.sol";
import { BasicPenalty } from "./BasicPenalty.sol";
import { WhitelistAdminRole } from "openzeppelin-solidity/contracts/access/roles/WhitelistAdminRole.sol";

contract BasicFactory is WhitelistAdminRole {
    address internal collateral_;
    address internal interestCollateral_;
    BasicRegistry internal registryInstance_;

    event DeployedUtilities(
        address indexed withdraw,
        string _withdrawName,
        string _withdrawDescription,
        address indexed penalty,
        string _penaltyName,
        string _penaltyDescription
    );

    event DeployedPool(
        address indexed pool,
        address indexed withdraw,
        string name,
        string description
    );

    constructor(
        address _admin,
        address _registry,
        address _collateral,
        address _interestToken
    )
        public
    {
        collateral_ = _collateral;
        interestCollateral_ = _interestToken;
        addWhitelistAdmin(_admin);
        registryInstance_ = BasicRegistry(_registry);
    }

    function deployBasicPool(
        address _withdraw,
        string memory _poolName,
        string memory _poolDescription
    )
        public
        onlyWhitelistAdmin()
        returns(address)
    {
        BasicPool newPool = new BasicPool(
            msg.sender,
            _withdraw,
            collateral_,
            interestCollateral_
        );

        require(
            registryInstance_.registerPool(
                msg.sender,
                address(newPool),
                _withdraw,
                _poolName,
                _poolDescription
            ),
            "Pool registration falied"
        );

        emit DeployedPool(address(newPool), _withdraw, _poolName, _poolDescription);

        return(address(newPool));
    }

    function deployUtility(
        uint8 _penaltyPercentage,
        uint256 _cycleLength,
        string memory _penaltyName,
        string memory _penaltyDescription,
        string memory _withdrawName,
        string memory _withdrawDescription
    )
        public
        onlyWhitelistAdmin()
        returns(address, address)
    {
        BasicPenalty newPenalty = new BasicPenalty(
            _penaltyPercentage
        );

        CyclicWithdraw newWithdraw = new CyclicWithdraw(
            address(newPenalty),
            _cycleLength,
            true
        );

        require(
            registryInstance_.registerUtility(
                msg.sender,
                address(newPenalty),
                _penaltyName,
                _penaltyDescription,
                2
            ),
            "Penalty registration failed"
        );
        require(
            registryInstance_.registerUtility(
                msg.sender,
                address(newWithdraw),
                _withdrawName,
                _withdrawDescription,
                1
            ),
            "Penalty registration failed"
        );

        emit DeployedUtilities(
            address(newWithdraw),
            _withdrawName,
            _withdrawDescription,
            address(newPenalty),
            _penaltyName,
            _penaltyDescription
        );

        return(
            address(newWithdraw),
            address(newPenalty)
        );
    }
}