const { getNamedAccounts, ethers } = require("hardhat")

async function main() {
    const { deployer } = await getNamedAccounts()
    const fundMe = await ethers.getContract("FundMe", deployer)
    console.log("Funding to FundMe contract...")

    const transactionResponse = await fundMe.fund({
        value: ethers.utils.parseEther("0.2"),
    })
    await transactionResponse.wait(1)
    console.log("Funded!")
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
