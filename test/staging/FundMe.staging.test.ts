import { describe } from "mocha";
import hre, { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  developmentChains,
  DECIMALS,
  INITIAL_ANSWER,
} from "../../helper-hardhat-config";
import { assert } from "chai";
developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe staging test", async function () {
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
      const sendValue = ethers.parseUnits("1", "ether");
      it("allows people to fund and withdraw", async function () {
        // arrange
        const { fundMe, owner } = await loadFixture(deployFundMeFixture);
        // act
        await fundMe.fund({ value: sendValue });
        await fundMe.withdraw();
        // assert
        const endingBalance = await ethers.provider.getBalance(
          await fundMe.getAddress()
        );
        assert.equal(endingBalance.toString(), "0");
      });
    });
