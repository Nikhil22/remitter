var Remittance = artifacts.require("./Remittance.sol");
var util = require('./util');
var getTransactionReceiptMined = util.getTransactionReceiptMined;
var expectedExceptionPromise = util.expectedExceptionPromise;

contract('Remittance', function(accounts) {
  let instance;
  const owner = accounts[0];
  const duration = 2;
  const ethHolder = accounts[1];
  const withdrawer = accounts[2];
  const password = "yoyo";
  const wrongPassword = "blah";
  const amountEthToRelease = web3.toWei(2, 'ether');
  const longDuration = 100;

  beforeEach(() => {
    return Remittance.new(
      duration,
      withdrawer,
      ethHolder,
      amountEthToRelease,
      web3.sha3(password, {encoding: 'hex'}),
      web3.sha3(withdrawer, {encoding: 'hex'}),
      { from: owner }
    )
    .then(thisInstance => {
      instance = thisInstance;
    });
  });

  it("owner should be set", () => {
    instance.owner()
      .then(_owner => {
        assert.equal(owner, _owner, 'owner is not set');
      })
  });
  it("amountEthToRelease should be set", () => {
    instance.amountEthToRelease()
      .then(_amountEthToRelease => {
        assert.equal(amountEthToRelease, _amountEthToRelease, 'amountEthToRelease is not set');
      })
  });

  it('should reject durations that are too long', () => {
    return expectedExceptionPromise(() => {
      return Remittance.new(
        longDuration,
        withdrawer,
        ethHolder,
        amountEthToRelease,
        web3.sha3(password, {encoding: 'hex'}),
        web3.sha3(withdrawer, {encoding: 'hex'}),
        { from: owner, gas: 1000000 })
      .then(txObj => txObj.tx);
    }, 1000000);
  });

  // it('should be not be withdrawable after deadline', () => {
  //     var instance;
  //     return Remittance.new(
  //       sender,
  //       web3.sha3(password, {encoding: 'hex'}),
  //       web3.sha3(recipient, {encoding: 'hex'}),
  //       duration,
  //       {from: owner})
  //     .then(_instance => {
  //       instance = _instance;
  //       return web3.eth.sendTransaction(
  //         {from: alice, value: amount, to: Remittance.address});
  //     })
  //     .then(tx => {
  //       return expectedExceptionPromise(() => {
  //         return instance.refund({from: alice, gas: 1000000})
  //         .then(txObj => txObj.tx);
  //       }, 1000000);
  //     });
  //   });
  // it("should throw an exception when deadline has passed", function() {
  //   instance.releaseEther(
  //
  //   )
  //   .then(function(returnValue) {
  //     assert(false, "testThrow was supposed to throw but didn't.");
  //   }).catch(function(error) {
  //     if(error.toString().indexOf("invalid JUMP") != -1) {
  //       console.log("We were expecting a Solidity throw (aka an invalid JUMP), we got one. Test succeeded.");
  //     } else {
  //       // if the error is something else (e.g., the assert from previous promise), then we fail the test
  //       assert(false, error.toString());
  //     }
  //   });
  // });
});
