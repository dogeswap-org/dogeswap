pragma solidity >=0.5.0;

interface IDogeSwapV1Exchange {
    function balanceOf(address owner) external view returns (uint);

    function transferFrom(
        address from,
        address to,
        uint value
    ) external returns (bool);

    function removeLiquidity(
        uint,
        uint,
        uint,
        uint
    ) external returns (uint, uint);

    function tokenToDCSwapInput(
        uint,
        uint,
        uint
    ) external returns (uint);

    function dcToTokenSwapInput(uint, uint) external payable returns (uint);
}
