var Remittance = artifacts.require("./Remittance.sol");
var util = require('./util');
var getTransactionReceiptMined = util.getTransactionReceiptMined;
var expectedExceptionPromise = util.expectedExceptionPromise;
var promisify = util.promisify;

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

  it('should release funds to recipient if both correct hashes are provided', () => {
    var initialBalance;

    return promisify((cb) => web3.eth.getBalance(withdrawer, cb))
    .then(balance => {
      initialBalance = balance;
      return instance.releaseEther(
        web3.sha3(password, {encoding: 'hex'}),
        web3.sha3(withdrawer, {encoding: 'hex'}),
        { from: withdrawer });
    })
    .then(txObj => {
      return web3.eth.getBalance(withdrawer);
    })
    .then(balance => {
      assert.isAbove(
        balance.toNumber(),
        initialBalance.toNumber(),
        "Withdrawer's balance wasn't credited!")
    });
  });

  it('should not release funds to any account without correct passwords', () => {
  var initialBalance;

  return promisify((cb) => web3.eth.getBalance(withdrawer, cb))
    .then(balance => {
      initialBalance = balance;
      return expectedExceptionPromise(() => {
        return instance.releaseEther(
          web3.sha3(wrongPassword, {encoding: 'hex'}),
          web3.sha3(withdrawer, {encoding: 'hex'}),
          {from: withdrawer, gas: 1000000})
        .then(txObj => txObj.tx);
      }, 1000000);
    })
  });

it("should not release funds to any address that isn't the recipient", () => {
  var initialBalance;
  var notRecipient = ethHolder;
  return promisify((cb) => web3.eth.getBalance(withdrawer, cb))
    .then(balance => {
      initialBalance = balance;
      return expectedExceptionPromise(() => {
        return instance.releaseEther(
          web3.sha3(password, {encoding: 'hex'}),
          web3.sha3(withdrawer, {encoding: 'hex'}),
          {from: notRecipient, gas: 1000000})
        .then(txObj => txObj.tx);
      }, 1000000);
    })
  });

  // it('it should give some commission to the owner upon withdrawal', () => {
  //   var initialBalance;
  //   return Remittance.new(
  //     sender,
  //     web3.sha3(password, {encoding: 'hex'}),
  //     web3.sha3(recipient, {encoding: 'hex'}),
  //     0,
  //     {from: owner})
  //   .then(instance => {
  //     contractInstance = instance;
  //     return web3.eth.getBalance(owner);
  //   })
  //   .then(_balance => {
  //     initialBalance = _balance;
  //     var txn = web3.eth.sendTransaction(
  //       {from: alice, value: amount, to: contractInstance.address});
  //     return getTransactionReceiptMined(txn);
  //   })
  //   .then(receipt => {
  //     return web3.eth.getBalance(owner);
  //   })
  //   .then(balance => {
  //     assert.isAbove(
  //       balance.toNumber(),
  //       initialBalance.toNumber(),
  //       "Owner's balance wasn't credited!")
  //   });
  // });

});
