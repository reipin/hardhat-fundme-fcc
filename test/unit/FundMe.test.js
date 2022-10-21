const chai = require("chai")
const { assert, expect } = require("chai")
const { getNamedAccounts, ethers, network } = require("hardhat")
const { solidity } = require("ethereum-waffle")
const { developmentChains } = require("../../helper-hardhat-config")
chai.use(solidity)

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe
          let deployer
          let mockV3Aggregator
          let sendValue = ethers.utils.parseEther("1") // 1 ETH

          beforeEach(async function () {
              // deploy our fundme contract using "hardhat-deploy" plugin
              // deployments.fixture will run all the srcipts taged inside "deploy" folder ("all" in this case)
              await deployments.fixture(["all"])

              // in order to use "deployer" var outside the scope, doing something tricky...
              //const { deployer } = await getNamedAccounts()
              deployer = (await getNamedAccounts()).deployer

              // getContract function get the newest deployed contract (hardhat-ethers function)
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", function () {
              it("set the aggregator addresses correctry", async function () {
                  const ethUsds_priceFeedAddress = mockV3Aggregator.address
                  //const result = await fundMe.s_priceFeed()
                  const result = await fundMe.getPriceFeed()
                  assert.equal(result, ethUsds_priceFeedAddress)
              })
          })

          describe("fund", function () {
              it("should revert if fund amount is less than $50", async function () {
                  // using ethereum-waffle
                  await expect(fundMe.fund()).to.be.reverted
              })
              it("updates the amount fund data structure", async function () {
                  await fundMe.fund({ value: sendValue })
                  // to get value from an array or dict, use "()" in stead of "[]"
                  //const response = await fundMe.s_addressToAmountFunded(deployer)
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString, sendValue.toString)
              })
              it("Adds funder to array of s_funders", async function () {
                  await fundMe.fund({ value: sendValue })
                  // to get value from an array or dict, use "()" in stead of "[]"
                  //const response = await fundMe.s_funders(0)
                  const response = await fundMe.getFunders(0)
                  assert.equal(response, deployer)
              })
          })

          describe("withdraw", function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })
              it("withdraw ETH from single funder", async function () {
                  // Arrange
                  // provider.getBalance is a ether.js function => returns balance of any contract in BigNumber
                  const inicialBalanceFundMe = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const inicialBalanceDeployer =
                      await fundMe.provider.getBalance(deployer)
                  // Act
                  const transactionResponce = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponce.wait(1)

                  // with {} we can pull out objects from another object
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const totalGasUsed = gasUsed.mul(effectiveGasPrice).toString()

                  const endingBalanceFundMe = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingBalanceDeployer =
                      await fundMe.provider.getBalance(deployer)

                  // Assert
                  assert.equal(endingBalanceFundMe, 0)
                  assert.equal(
                      inicialBalanceFundMe
                          .add(inicialBalanceDeployer)
                          .toString(),
                      endingBalanceDeployer.add(totalGasUsed).toString()
                  )
              })

              it("allow us to withdraw with multiple fundes", async function () {
                  // Arrage
                  // getSigners is a hardhat-ethers function
                  const accounts = await ethers.getSigners()
                  for (i = 1; i < 11; i++) {
                      // contract.connect is a ether.js function
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const inicialBalanceFundMe = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const inicialBalanceDeployer =
                      await fundMe.provider.getBalance(deployer)

                  // Act
                  const transactionResponce = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponce.wait(1)

                  // with {} we can pull out objects from another object
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const totalGasUsed = gasUsed.mul(effectiveGasPrice).toString()

                  const endingBalanceFundMe = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingBalanceDeployer =
                      await fundMe.provider.getBalance(deployer)

                  // Assert
                  assert.equal(endingBalanceFundMe, 0)
                  assert.equal(
                      inicialBalanceFundMe
                          .add(inicialBalanceDeployer)
                          .toString(),
                      endingBalanceDeployer.add(totalGasUsed).toString()
                  )
                  // make sure that the s_funders are reset properly
                  await expect(fundMe.getFunders(0)).to.be.reverted

                  let totalFundsLeft = 0
                  for (i = 1; i < 11; i++) {
                      const s_fundersFund =
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          )
                      totalFundsLeft += s_fundersFund
                  }
                  assert.equal(totalFundsLeft, 0)
              })

              it("only allows owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const attaker = accounts[1]
                  const attakerConnectedContrat = fundMe.connect(attaker)
                  await expect(
                      attakerConnectedContrat.withdraw()
                  ).to.be.revertedWith("FundMe__NotOwner")
              })

              it("withdraw ETH from single funder", async function () {
                  // Arrange
                  // provider.getBalance is a ether.js function => returns balance of any contract in BigNumber
                  const inicialBalanceFundMe = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const inicialBalanceDeployer =
                      await fundMe.provider.getBalance(deployer)
                  // Act
                  const transactionResponce = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponce.wait(1)

                  // with {} we can pull out objects from another object
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const totalGasUsed = gasUsed.mul(effectiveGasPrice).toString()

                  const endingBalanceFundMe = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingBalanceDeployer =
                      await fundMe.provider.getBalance(deployer)

                  // Assert
                  assert.equal(endingBalanceFundMe, 0)
                  assert.equal(
                      inicialBalanceFundMe
                          .add(inicialBalanceDeployer)
                          .toString(),
                      endingBalanceDeployer.add(totalGasUsed).toString()
                  )
              })

              it("allow us to withdraw with multiple fundes", async function () {
                  // Arrage
                  // getSigners is a hardhat-ethers function
                  const accounts = await ethers.getSigners()
                  for (i = 1; i < 11; i++) {
                      // contract.connect is a ether.js function
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const inicialBalanceFundMe = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const inicialBalanceDeployer =
                      await fundMe.provider.getBalance(deployer)

                  // Act
                  const transactionResponce = await fundMe.cheaperWithdraw()
                  const transactionReceipt = await transactionResponce.wait(1)

                  // with {} we can pull out objects from another object
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const totalGasUsed = gasUsed.mul(effectiveGasPrice).toString()

                  const endingBalanceFundMe = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingBalanceDeployer =
                      await fundMe.provider.getBalance(deployer)

                  // Assert
                  assert.equal(endingBalanceFundMe, 0)
                  assert.equal(
                      inicialBalanceFundMe
                          .add(inicialBalanceDeployer)
                          .toString(),
                      endingBalanceDeployer.add(totalGasUsed).toString()
                  )
                  // make sure that the s_funders are reset properly
                  await expect(fundMe.getFunders(0)).to.be.reverted

                  let totalFundsLeft = 0
                  for (i = 1; i < 11; i++) {
                      const s_fundersFund =
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          )
                      totalFundsLeft += s_fundersFund
                  }
                  assert.equal(totalFundsLeft, 0)
              })

              it("only allows owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const attaker = accounts[1]
                  const attakerConnectedContrat = fundMe.connect(attaker)
                  await expect(
                      attakerConnectedContrat.cheaperWithdraw()
                  ).to.be.revertedWith("FundMe__NotOwner")
              })
          })
      })
