import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import hre, { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { describe } from "mocha";
import {
  DECIMALS,
  INITIAL_ANSWER,
  developmentChains,
} from "../../helper-hardhat-config";
import { expect, assert } from "chai";

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe development test", async function () {
      const sendValue = ethers.parseUnits("1", "ether");
      async function deployFundMeFixture() {
        // const accounts = await ethers.getSigners();
        // const account0 = accounts[0];
        const { deployer } = await getNamedAccounts();
        await deployments.fixture(["all"]);
        const [owner, otherAccount] = await hre.ethers.getSigners();
        const MockV3Aggregator = await hre.ethers.getContractFactory(
          "MockV3Aggregator"
        );
        const mockV3Aggregator = await MockV3Aggregator.deploy(
          DECIMALS,
          INITIAL_ANSWER,
          {
            from: deployer,
          }
        );
        const FundMe = await hre.ethers.getContractFactory("FundMe");
        const fundMe = await FundMe.deploy(
          await mockV3Aggregator.getAddress(),
          {
            from: deployer,
          }
        );
        console.log(`owner: ${JSON.stringify(owner)}`);
        console.log(`otherAccount: ${JSON.stringify(otherAccount)}`);
        return { fundMe, mockV3Aggregator, owner, otherAccount };
      }
      async function FundMeFixture() {
        const { fundMe, owner } = await loadFixture(deployFundMeFixture);
        await fundMe.fund({ value: sendValue });
        return { fundMe, owner };
      }
      describe("constructor", async function () {
        it("Should set the aggregator address correctly", async function () {
          const { fundMe, mockV3Aggregator, owner } = await loadFixture(
            deployFundMeFixture
          );
          const res = await fundMe.getPriceFeed();
          console.log(`res: ${res}`);
          console.log(
            `mockV3Aggregator.getAddress(): ${await mockV3Aggregator.getAddress()}`
          );
          assert.equal(res, await mockV3Aggregator.getAddress());
          assert.equal(await fundMe.getOwner(), owner.address);
        });
      });

      describe("fund", async function () {
        it("Fails if you do not spend enough ETH!", async function () {
          const { fundMe } = await loadFixture(deployFundMeFixture);
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          );
        });
        it("Update the amount for funded address", async function () {
          const { fundMe, owner } = await loadFixture(deployFundMeFixture);
          await fundMe.fund({ value: sendValue });
          const fundedAmount = await fundMe.getAddressToAmountFunded(
            owner.address
          );
          const funderAddress = await fundMe.getFunder(0);
          assert.equal(fundedAmount.toString(), sendValue.toString());
          assert.equal(funderAddress, owner.address);
        });
      });

      describe("withdraw", async function () {
        it("Withdraw ETH from a single funder", async function () {
          // arrange
          const { fundMe, owner } = await loadFixture(FundMeFixture);
          const startingFundMeBalance = await ethers.provider.getBalance(
            await fundMe.getAddress()
          );
          const startingDeployedBalance = await ethers.provider.getBalance(
            owner.address
          );
          // act
          const transactionRes = await fundMe.withdraw();
          const transactionReceipt = await transactionRes.wait(1);
          const { gasUsed, gasPrice } = transactionReceipt!;
          const gasCost = gasUsed * gasPrice;

          const endingFundMeBalance = await ethers.provider.getBalance(
            await fundMe.getAddress()
          );
          const endingDeployedBalance = await ethers.provider.getBalance(
            owner.address
          );
          // assert
          assert.equal(endingFundMeBalance.toString(), "0");

          assert.equal(
            startingFundMeBalance + startingDeployedBalance,
            endingDeployedBalance + gasCost
          );
        });
        it("Allow us to withdraw multiple funders", async function () {
          // arrange
          const { fundMe, owner } = await loadFixture(FundMeFixture);
          const accounts = await ethers.getSigners();
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = fundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: sendValue });
          }
          const startingFundMeBalance = await ethers.provider.getBalance(
            await fundMe.getAddress()
          );
          const startingDeployedBalance = await ethers.provider.getBalance(
            owner.address
          );
          // act
          const transactionRes = await fundMe.withdraw();
          const transactionReceipt = await transactionRes.wait(1);
          const { gasUsed, gasPrice } = transactionReceipt!;
          const gasCost = gasUsed * gasPrice;

          const endingFundMeBalance = await ethers.provider.getBalance(
            await fundMe.getAddress()
          );
          const endingDeployedBalance = await ethers.provider.getBalance(
            owner.address
          );
          // assert
          assert.equal(endingFundMeBalance.toString(), "0");
          assert.equal(
            startingFundMeBalance + startingDeployedBalance,
            endingDeployedBalance + gasCost
          );

          // Make sure that the funders are reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted;

          for (let i = 1; i < 6; i++) {
            const accountFundAmount = await fundMe.getAddressToAmountFunded(
              accounts[i].address
            );
            assert.equal(accountFundAmount.toString(), "0");
          }
        });
        it("Only allow the owner to withdraw", async function () {
          const { fundMe } = await loadFixture(FundMeFixture);
          const accounts = await ethers.getSigners();
          const attacker = accounts[1];
          const attackerConnectedContract = fundMe.connect(attacker);
          await expect(
            attackerConnectedContract.withdraw()
          ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");
        });
      });

      describe("cheaperWithdraw", async function () {
        it("cheaperWithdraw ETH from a single funder", async function () {
          // arrange
          const { fundMe, owner } = await loadFixture(FundMeFixture);
          const startingFundMeBalance = await ethers.provider.getBalance(
            await fundMe.getAddress()
          );
          const startingDeployedBalance = await ethers.provider.getBalance(
            owner.address
          );
          // act
          const transactionRes = await fundMe.cheaperWithdraw();
          const transactionReceipt = await transactionRes.wait(1);
          const { gasUsed, gasPrice } = transactionReceipt!;
          const gasCost = gasUsed * gasPrice;

          const endingFundMeBalance = await ethers.provider.getBalance(
            await fundMe.getAddress()
          );
          const endingDeployedBalance = await ethers.provider.getBalance(
            owner.address
          );
          // assert
          assert.equal(endingFundMeBalance.toString(), "0");

          assert.equal(
            startingFundMeBalance + startingDeployedBalance,
            endingDeployedBalance + gasCost
          );
        });
        it("Allow us to cheaperWithdraw multiple funders", async function () {
          // arrange
          const { fundMe, owner } = await loadFixture(FundMeFixture);
          const accounts = await ethers.getSigners();
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = fundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: sendValue });
          }
          const startingFundMeBalance = await ethers.provider.getBalance(
            await fundMe.getAddress()
          );
          const startingDeployedBalance = await ethers.provider.getBalance(
            owner.address
          );
          // act
          const transactionRes = await fundMe.cheaperWithdraw();
          const transactionReceipt = await transactionRes.wait(1);
          const { gasUsed, gasPrice } = transactionReceipt!;
          const gasCost = gasUsed * gasPrice;

          const endingFundMeBalance = await ethers.provider.getBalance(
            await fundMe.getAddress()
          );
          const endingDeployedBalance = await ethers.provider.getBalance(
            owner.address
          );
          // assert
          assert.equal(endingFundMeBalance.toString(), "0");
          assert.equal(
            startingFundMeBalance + startingDeployedBalance,
            endingDeployedBalance + gasCost
          );

          // Make sure that the funders are reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted;

          for (let i = 1; i < 6; i++) {
            const accountFundAmount = await fundMe.getAddressToAmountFunded(
              accounts[i].address
            );
            assert.equal(accountFundAmount.toString(), "0");
          }
        });
        it("Only allow the owner to cheaperWithdraw", async function () {
          const { fundMe } = await loadFixture(FundMeFixture);
          const accounts = await ethers.getSigners();
          const attacker = accounts[1];
          const attackerConnectedContract = fundMe.connect(attacker);
          await expect(
            attackerConnectedContract.cheaperWithdraw()
          ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");
        });
      });
    });
