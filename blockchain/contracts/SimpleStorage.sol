pragma solidity 0.5.13;

contract SimpleStorage {
    uint storedData;
    event StorageUpdated(uint newValue);

    function set(uint x) public {
        storedData = x;
        emit StorageUpdated(x);
    }

    function get() public view returns (uint) {
        return storedData;
    }
}