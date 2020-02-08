pragma solidity 0.5.10;

import { BasicRegistry } from "./BasicRegistry.sol";
import { BasicPool } from "./BasicPool.sol";
import { CyclicWithdraw } from "./CyclicWithdraw.sol";
import { RollingWithdraw } from "./RollingWithdraw.sol";
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
        uint8 _cycleLength,
        string _withdrawName,
        address indexed penalty,
        uint8 _penaltyRate,
        string _penaltyName,
        bool _canWithdrawInViolation,
        bool _canWithdrawInterestInViolation
    );
    event DeployedPool(
        address indexed pool,
        address indexed withdraw,
        uint8 penaltyPercentage,
        string name,
        string description,
        uint8 cycleLength,
        string tokenSymbol,
        bool canWithdrawInViolation,
        bool canWithdrawInterestInViolation
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

        uint8 cycleLength = 0;
        address penaltyInstance = address(0);
        uint8 penaltyPercentage = 0;
        bool canWithdrawInterestInViolation = true;
        bool canWithdrawInViolation = true;

        if(_withdraw != address(0)) {
            cycleLength = IWithdraw(_withdraw).getCycle();
            penaltyInstance = IWithdraw(_withdraw).getPenalty();
            penaltyPercentage = BasicPenalty(penaltyInstance).penalty();
            canWithdrawInterestInViolation = IWithdraw(_withdraw).canWithdrawInterestInViolation();
            canWithdrawInViolation = IWithdraw(_withdraw).canWithdrawInViolation();
        }

        emit DeployedPool(
            address(newPool), 
            _withdraw, 
            penaltyPercentage,
            _poolName, 
            _poolDescription, 
            cycleLength,
            tokenSymbol_,
            canWithdrawInterestInViolation,
            canWithdrawInViolation
        );

        return(address(newPool));
    }

    function deployUtility(
        uint8 _penaltyPercentage,
        uint8 _cycleLength,
        bool _canWithdrawInViolation,
        bool _canWithdrawInterestInViolation,
        string memory _penaltyName,
        string memory _withdrawName
    )
        public
        onlyWhitelistAdmin()
        returns(address, address)
    {
        BasicPenalty newPenalty = new BasicPenalty(
            _penaltyPercentage
        );

        IWithdraw newWithdraw;

        if(_cycleLength == 0) {
            RollingWithdraw newRollingWithdraw = new RollingWithdraw(
                address(newPenalty),
                _cycleLength,
                _canWithdrawInViolation,
                _canWithdrawInterestInViolation
            );
            newWithdraw = IWithdraw(newRollingWithdraw);

            require(
                registryInstance_.registerUtility(
                    msg.sender,
                    address(newWithdraw),
                    _withdrawName,
                2
                ),
                "Penalty registration failed"
            );
        } else {
            CyclicWithdraw newCyclicWithdraw = new CyclicWithdraw(
                address(newPenalty),
                _cycleLength,
                _canWithdrawInViolation,
                _canWithdrawInterestInViolation
            );
            newWithdraw = IWithdraw(newCyclicWithdraw);

            require(
                registryInstance_.registerUtility(
                    msg.sender,
                    address(newWithdraw),
                    _withdrawName,
                    1
                ),
                "Penalty registration failed"
            );
        }

        require(
            registryInstance_.registerUtility(
                msg.sender,
                address(newPenalty),
                _penaltyName,
                3
            ),
            "Penalty registration failed"
        );

        emit DeployedUtilities(
            address(newWithdraw),
            _cycleLength,
            _withdrawName,
            address(newPenalty),
            _penaltyPercentage,
            _penaltyName,
            _canWithdrawInViolation,
            _canWithdrawInterestInViolation
        );

        return(
            address(newWithdraw),
            address(newPenalty)
        );
    }
}