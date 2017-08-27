pragma solidity ^ 0.4 .6;

import './Owned.sol';

contract Remittance is Owned {

    mapping(address => uint) balances;
    mapping(bytes32 => bool) usedPasswords;
    address private ethHolder;
    uint private deadline;
    bytes32 private passwordHash1;
    bytes32 private passwordHash2;
    address private withdrawer;
    uint public requiredGas = 40000;
    uint public amountEthToRelease;
    uint private maxDuration = 20;

    modifier hasTimeLeft() {
        require(block.number < deadline);
        _;
    }

    modifier isWithinMaxDuration(uint _duration) {
        require(_duration <= maxDuration);
        _;
    }

    modifier isOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier hasPositiveBalance() {
        require(balances[msg.sender] > 0);
        _;
    }

    modifier ethHolderHasEnoughEth() {
        require(balances[ethHolder] - (tx.gasprice * requiredGas) - amountEthToRelease > 0);
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
        require(!usedPasswords[_passwordHash1]);
        require(!usedPasswords[_passwordHash2]);
        _;
    }

    modifier isPasswordCorrect(
        bytes32 _passwordHash1,
        bytes32 _passwordHash2
    ) {
        require(sha3(_passwordHash1) == passwordHash1);
        require(sha3(_passwordHash2) == passwordHash2);
        _;
    }

    event LogOwnerWithdrawal(address account, uint amount);
    event LogETHRelease(address toAccount, uint amount);

    function Remittance(
        uint duration,
        address _withdrawer,
        address _ethHolder,
        uint _amountEthToRelease,
        bytes32 _passwordHash1,
        bytes32 _passwordHash2
    ) public isWithinMaxDuration(duration) {
        /* set owner */
        owner = msg.sender;

        /* set deadline */
        deadline = block.number + duration;

        amountEthToRelease = _amountEthToRelease;
        withdrawer = _withdrawer;
        ethHolder = _ethHolder;
        balances[ethHolder] = _ethHolder.balance;

        /* set passwords */
        passwordHash1 = sha3(_passwordHash1);
        passwordHash2 = sha3(_passwordHash2);
    }

    function releaseEther(
        bytes32 _passwordHash1,
        bytes32 _passwordHash2
    )
    public
    hasTimeLeft()
    ethHolderHasEnoughEth()
    isAuthorizedWithdrawer()
    arePasswordsNew(_passwordHash1, _passwordHash2)
    isPasswordCorrect(_passwordHash1, _passwordHash2)
    returns(bool success) {
        /* update used passwords */
        updateUsedPasswords(_passwordHash1, _passwordHash2);

        /* owner collects fees */
        uint ownerFee = tx.gasprice * requiredGas;
        balances[owner] += ownerFee;

        /* decrement the eth holder's balance */
        balances[ethHolder] -= (amountEthToRelease + ownerFee);

        /* release ether to the sender of the transaction */
        LogETHRelease(msg.sender, amountEthToRelease);
        msg.sender.transfer(amountEthToRelease);
        return true;
    }

    function withdrawFunds()
    isOwner()
    hasPositiveBalance()
    returns(bool success) {
        uint balance = balances[msg.sender];
        balances[msg.sender] = 0;
        LogOwnerWithdrawal(msg.sender, balance);
        msg.sender.transfer(balance);
        return true;
    }

    function updateUsedPasswords(bytes32 _passwordHash1, bytes32 _passwordHash2) {
        usedPasswords[_passwordHash1] = true;
        usedPasswords[_passwordHash2] = true;
    }
}
