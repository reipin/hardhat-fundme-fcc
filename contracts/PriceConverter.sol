// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    function getPrice(AggregatorV3Interface priceFeed)
        internal
        view
        returns (uint256)
    {
        /*        
        AggregatorV3Interface priceFeed = AggregatorV3Interface(
            0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e
        );
*/
        (
            ,
            /*uint80 roundID*/
            int256 price, /*uint startedAt*/ /*uint timeStamp*/
            ,
            ,

        ) = /*uint80 answeredInRound*/
            priceFeed.latestRoundData();
        return uint256(price * 1e10);
        // price = 1e8
    }

    function getConvesionRate(
        uint256 _ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        // 1eth = 1200usd
        // 50usd = 1 / 1200 * 50 * 1.01
        // msg.value >= (50 * 1.01)/price
        uint256 ethPrice = getPrice(priceFeed);
        uint256 ethAmountInUsd = (_ethAmount * ethPrice) / 1e18;
        return ethAmountInUsd;
    }
}
