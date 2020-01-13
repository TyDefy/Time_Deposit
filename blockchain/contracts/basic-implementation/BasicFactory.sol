pragma solidity 0.5.10;

import { BasicRegistry } from "./BasicRegistry.sol";
import { BasicPool } from "./BasicPool.sol";
import { CyclicWithdraw } from "./CyclicWithdraw.sol";
import { IWithdraw } from "../interfaces/IWithdraw.sol";
import { BasicPenalty } from "./BasicPenalty.sol";
import { WhitelistAdminRole } from "openzeppelin-solidity/contracts/access/roles/WhitelistAdminRole.sol";

contract BasicFactory is WhitelistAdminRole {
    address internal collateral_;
    string internal collateralSymbol_;
    address internal interestToken_;
    string internal tokenSymbol_;
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
        uint256 penaltyPercentage,
        string name,
        string description,
        uint256 cycleLength,
        string collateralSymbol,
        string tokenSymbol
    );

    constructor(
        address _admin,
        address _registry,
        address _collateral,
        string memory _collateralSymbol,
        address _interestToken,
        string memory _tokenSymbol
    )
        public
    {
        addWhitelistAdmin(_admin);

        collateral_ = _collateral;
        collateralSymbol_ = _collateralSymbol;

        interestToken_ = _interestToken;
        tokenSymbol_ = _tokenSymbol;

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
            interestToken_
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

        uint256 cycleLength = 0;
        address penaltyInstance = address(0);
        uint256 penaltyPercentage = 0;

        if(_withdraw != address(0)) {
            cycleLength = IWithdraw(_withdraw).getCycle();
            penaltyInstance = IWithdraw(_withdraw).getPenalty();
            penaltyPercentage = BasicPenalty(penaltyInstance).penalty();
        }

        emit DeployedPool(
            address(newPool), 
            _withdraw, 
            penaltyPercentage,
            _poolName, 
            _poolDescription, 
            cycleLength,
            collateralSymbol_,
            tokenSymbol_
        );

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