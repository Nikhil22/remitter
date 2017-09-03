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
  const passwordOne = web3.sha3('abc', {encoding: 'hex'});
  const passwordTwo = web3.sha3('def', {encoding: 'hex'});
  const wrongPassword = web3.sha3('bla', {encoding: 'hex'});;
  const amountEthToRelease = web3.toWei(2, 'ether');
  const longDuration = 100;

  beforeEach(() => {
    return Remittance.new(
      withdrawer,
      { from: owner }
    )
    .then(thisInstance => {
      instance = thisInstance;
      return instance;
    })
    .then(instance => {
      instance.createRemittance(
        10,
        passwordOne,
        passwordTwo,
        { from: owner, value: amountEthToRelease }
      );
    });
  });

  it("owner should be set", () => {
    instance.owner()
      .then(_owner => {
        assert.equal(owner, _owner, 'owner is not set');
      })
  });

  it('should reject durations that are too long', () => {
    return expectedExceptionPromise(() => {
      return instance.createRemittance(
        longDuration,
        web3.sha3('abc', {encoding: 'hex'}),
        web3.sha3('def', {encoding: 'hex'}),
        { from: owner, value: amountEthToRelease, gas: 1000000 })
      .then(txObj => txObj.tx);
    }, 1000000);
  });

  //should reject already used passwords

  it('should not release funds to any account without correct passwords', () => {
    var initialBalance;

    return promisify((cb) => web3.eth.getBalance(withdrawer, cb))
      .then(balance => {
        initialBalance = balance;
        return expectedExceptionPromise(() => {
          return instance.releaseEther(
            web3.sha3('bla', {encoding: 'hex'}),
            web3.sha3('def', {encoding: 'hex'}),
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
            web3.sha3('abc', {encoding: 'hex'}),
            web3.sha3('def', {encoding: 'hex'}),
            {from: notRecipient, gas: 1000000})
          .then(txObj => txObj.tx);
        }, 1000000);
      })
  });

  it('should release funds to recipient if both correct hashes are provided', () => {
    var initialBalance;

    return promisify((cb) => web3.eth.getBalance(withdrawer, cb))
      .then(balance => {
        initialBalance = balance;
        return instance.releaseEther(
          passwordOne,
          passwordTwo,
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

});
