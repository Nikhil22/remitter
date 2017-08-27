pragma solidity ^ 0.4 .6;

import './Owned.sol';

contract Remittance is Owned {

    mapping(address => uint) balances;
    address private ethHolder;
    uint private deadline;
    string private password;
    address private withdrawer;
    uint public requiredGas = 40000;
    uint public amountEthToRelease;

    modifier hasTimeLeft() {
        require(block.number < deadline);
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

    modifier isPasswordCorrect(
        string passwordFromAlice,
        string passwordFromBob
    ) {
        bytes32 passwordsHashed = keccak256(passwordFromAlice, passwordFromBob);
        require(passwordsHashed == getPassword());
        _;
    }

    event LogOwnerWithdrawal(address account, uint amount);
    event LogETHRelease(address toAccount, uint amount);

    function Remittance(
        uint duration,
        address _withdrawer,
        address _ethHolder,
        string _password,
        uint _amountEthToRelease
    ) public {
        owner = msg.sender;
        deadline = block.number + duration;
        amountEthToRelease = _amountEthToRelease;
        withdrawer = _withdrawer;
        ethHolder = _ethHolder;
        balances[ethHolder] = _ethHolder.balance;
        password = _password;
    }

    function releaseEther(
        string passwordFromAlice,
        string passwordFromBob
    )
    public
    hasTimeLeft()
    ethHolderHasEnoughEth()
    isAuthorizedWithdrawer()
    isPasswordCorrect(passwordFromAlice, passwordFromBob)
    returns(bool success) {
        uint ownerFee = tx.gasprice * requiredGas;
        balances[owner] += ownerFee;
        balances[ethHolder] -= (amountEthToRelease + ownerFee);
        LogETHRelease(msg.sender, amountEthToRelease);
        msg.sender.transfer(amountEthToRelease);
        return true;
    }

    function getPassword() private returns(bytes32 _password) {
        return keccak256(password);
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
}
