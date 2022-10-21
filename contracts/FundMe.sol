//SPDX-License-Identifier: MIT

// Advanced tecnique to make a contract gas efficiente:
// 1. Use "constant" and "immutable" keywords
// 2. Stop using "require", use custom error instead
// 3. Use private or internal insted of public
// 4. Set get fucntion to access private type values
// 5. Minimize usage of store and read from the blockchain

pragma solidity ^0.8.0;

import "./PriceConverter.sol";
error FundMe__NotOwner();

contract FundMe {
    uint256 public constant MINIMUM_USD = 50 * 1e18; // CAPILAT LETTER for constant
    address[] private s_funders; // "s" for stored
    mapping(address => uint256) private s_addressToAmountFunded;
    using PriceConverter for uint256;
    address private immutable i_owner; //"i" for immutable

    AggregatorV3Interface public s_priceFeed;

    // constant keyword gas: 972077 => 949611
    // calling minimumusd : 23515 => 21415
    constructor(address s_priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(s_priceFeedAddress);
    }

    function fund() public payable {
        //require( getConvesionRate(msg.value) >= minimamUsd, "Not enogth fund...");

        // When using library, variables put in front of a funtion is considered as a first parameter passed
        // msg.value.getConvesionRate() == getConvesionRate(msg.value)
        // x.getConversionRate(y) == getConversionRate(x, y)
        require(
            msg.value.getConvesionRate(s_priceFeed) >= MINIMUM_USD,
            "Not enogth fund..."
        );
        //msg.value = 1e18
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] += msg.value;
    }

    function withdraw() public onlyOwner {
        for (
            uint256 s_fundersIndex = 0;
            s_fundersIndex < s_funders.length;
            s_fundersIndex++
        ) {
            address funder = s_funders[s_fundersIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        // Reset array
        s_funders = new address[](0);

        /*
        // Transfer
        payable(msg.sender).transfer(address(this).balance);
        // Send
        bool sendSuccess = payable(msg.sender).send(address(this).balance);
        require(sendSuccess, "Send failed");
        */
        // Call
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    function cheaperWithdraw() public onlyOwner {
        // set funders array in memeroy in order not to read value each time
        address[] memory funders = s_funders;
        for (
            uint256 fundersIndex = 0;
            fundersIndex < funders.length;
            fundersIndex++
        ) {
            address funder = funders[fundersIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        // Reset array
        s_funders = new address[](0);

        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    modifier onlyOwner() {
        //require(msg.sender == i_owner, "Only owner can call this function!");
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        // "_" means all other code
        _;
    }

    // What happens when someone accidentaly send eth without calling fund()
    // We can use specila functions in solidity:
    // recieve() and fallback() => both external function with payable keyword
    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunders(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(address funder)
        public
        view
        returns (uint256)
    {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
