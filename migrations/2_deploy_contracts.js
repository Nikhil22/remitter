var Remittance = artifacts.require("./Remittance.sol");
var Owned = artifacts.require("./Owned.sol");

module.exports = function(deployer) {
  deployer.deploy(Remittance);
  deployer.deploy(Owned);
};
