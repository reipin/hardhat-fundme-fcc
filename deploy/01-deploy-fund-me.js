// import
// main function
// calling main function

// One way to depoloy a contract in hardhat
/*
async function deployFunc(hre) {
    console.log("Hi!")
    // hre.getNamedAccount
    // hre. deployments

}
module.exports.default = deployFunc
*/

// Another way to do it
/*
module.exports = async (hre) => {
    const {getNamedAccounts, deployments} = hre
    // hre.getNamedAccount
    // hre. deployments
}
*/

// Deployments are done through hardhat-deploy plugin!

const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { network } = require("hardhat")
const { verify } = require("../utils/verify")
// Or using js Syntactic sugar
module.exports = async ({ getNamedAccounts, deployments }) => {
    // deployments have a 2 functions
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    // deployment
    //const ethUsdPriceFeed = networkConfig[chainId]["ethUsdPriceFeed"]
    let ethUsdPriceFeedAddress
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    const args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, // for AggregatorV3Interface
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args)
    }
    log("-----------------------------------------")
}
module.exports.tags = ["all", "fundme"]
