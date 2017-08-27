var Remittance = artifacts.require("./Remittance.sol");

contract('Remittance', function(accounts) {
  let instance;
  const owner = accounts[0];
  const duration = 2;
  const ethHolder = accounts[1];
  const withdrawer = accounts[2];
  const password = 'qwe123';
  const amountEthToRelease = 2;

  beforeEach(() => {
    return Remittance.new(
      duration,
      withdrawer,
      ethHolder,
      password,
      amountEthToRelease,
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
