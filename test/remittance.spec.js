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
});
