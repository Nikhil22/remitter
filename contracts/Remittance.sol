pragma solidity ^ 0.4.10;

contract Remittance {

    mapping(address => uint) balances;
    mapping(bytes32 => bool) usedPasswords;
    mapping(bytes32 => RemittanceObject) remittances;
    bytes32 public hashedPassword;
    address public owner;

    address private withdrawer;
    uint public requiredGas = 40000;
    uint private maxDuration = 20;

    struct RemittanceObject {
      uint deadline;
      bytes32 password;
    }

    event LogOwnerWithdrawal(address account, uint amount);
    event LogETHRelease(address toAccount, uint amount);
    event NewRemittance(bytes32 hash, uint duration);
    event NewPassword(bytes32 hash);

    function Remittance(address _withdrawer) {
      owner = msg.sender;
      withdrawer = _withdrawer;
    }

    function createRemittance(
        uint duration,
        bytes32 _passwordHash1,
        bytes32 _passwordHash2
      )
      public
      payable
      isWithinMaxDuration(duration)
      arePasswordsNew(_passwordHash1, _passwordHash2)
      returns (bool success)
    {
      bytes32 singleHash = sha3(_passwordHash1, _passwordHash2);
      hashedPassword = singleHash;
      RemittanceObject memory remittance = RemittanceObject(
        block.number + duration,
        singleHash
      );
      remittances[singleHash] = remittance;
      NewRemittance(singleHash, duration);
      updateUsedPasswords(singleHash);
      return true;
    }

    function releaseEther(
        bytes32 _passwordHash1,
        bytes32 _passwordHash2
    )
      public
      hasTimeLeft(_passwordHash1, _passwordHash2)
      isAuthorizedWithdrawer()
      isPasswordCorrect(_passwordHash1, _passwordHash2)
    returns(bool success) {
        /* owner collects fees */
        uint ownerFee = tx.gasprice * requiredGas;
        balances[owner] += ownerFee;

        /* release ether to the sender of the transaction */
        msg.sender.transfer(this.balance);
        return true;
    }

    function withdrawFunds()
      public
      hasPositiveBalance()
      isOwner
      returns(bool success)
    {
        uint balance = balances[msg.sender];
        balances[msg.sender] = 0;
        LogOwnerWithdrawal(msg.sender, balance);
        msg.sender.transfer(balance);
        return true;
    }

    function updateUsedPasswords(bytes32 _passwordHash)
      private
      returns (bool success)
    {
        usedPasswords[_passwordHash] = true;
        NewPassword(_passwordHash);
        return true;
    }

    modifier hasTimeLeft(
      bytes32 _passwordHash1,
      bytes32 _passwordHash2
    ) {
        bytes32 singleHash = sha3(_passwordHash1, _passwordHash2);
        RemittanceObject storage remittance = remittances[singleHash];
        require(block.number < remittance.deadline);
        _;
    }

    modifier isWithinMaxDuration(uint _duration) {
        require(_duration <= maxDuration);
        _;
    }

    modifier hasPositiveBalance() {
        require(balances[msg.sender] > 0);
        _;
    }

    modifier isAuthorizedWithdrawer() {
        require(msg.sender == withdrawer);
        _;
    }

    modifier arePasswordsNew(
        bytes32 _passwordHash1,
        bytes32 _passwordHash2
    ) {
        require(!usedPasswords[sha3(_passwordHash1, _passwordHash2)]);
        _;
    }

    modifier isPasswordCorrect(
        bytes32 _passwordHash1,
        bytes32 _passwordHash2
    ) {
        require(sha3(_passwordHash1, _passwordHash2) == hashedPassword);
        _;
    }

    modifier isOwner() {
        require(msg.sender == owner);
        _;
    }
}
