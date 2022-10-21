const { network } = require("hardhat")
const {
    developmentChains,
    DECIMALS,
    INICIAL_ANSWER,
} = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    // deployments have a 2 functions
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    //const { chainId } = network.config.chainId
    console.log(deployer)

    if (developmentChains.includes(network.name)) {
        log("Localhost detected! Deploying mocks contract...")
        await deploy("MockV3Aggregator", {
            from: deployer,
            args: [DECIMALS, INICIAL_ANSWER], // for AggregatorV3Interface
            log: true,
        })
        log("Mocks deployed!")
        log("------------------------------------------------")
    }
}

// with tags we can deploy only selected contracts doing:
// yarn hardhat deploy --tags mocks
module.exports.tags = ["all", "mocks"]
