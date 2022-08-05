// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;
pragma abicoder v2;

/// @notice A fork of Multicall2 specifically tailored for the DogeSwap Interface
contract DogeSwapInterfaceMulticall {
    struct Call {
        address target;
        uint gasLimit;
        bytes callData;
    }

    struct Result {
        bool success;
        uint gasUsed;
        bytes returnData;
    }

    function getCurrentBlockTimestamp() public view returns (uint timestamp) {
        timestamp = block.timestamp;
    }

    function getWDOGEBalance(address addr) public view returns (uint balance) {
        balance = addr.balance;
    }

    function multicall(Call[] memory calls) public returns (uint blockNumber, Result[] memory returnData) {
        blockNumber = block.number;
        returnData = new Result[](calls.length);
        for (uint i = 0; i < calls.length; i++) {
            (address target, uint gasLimit, bytes memory callData) = (
                calls[i].target,
                calls[i].gasLimit,
                calls[i].callData
            );
            uint gasLeftBefore = gasleft();
            (bool success, bytes memory ret) = target.call{gas: gasLimit}(callData);
            uint gasUsed = gasLeftBefore - gasleft();
            returnData[i] = Result(success, gasUsed, ret);
        }
    }
}
