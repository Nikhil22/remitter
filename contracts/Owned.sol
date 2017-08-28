pragma solidity ^0.4.10;

contract Owned {
	address public owner;

	function Owned() {
		owner = msg.sender;
	}
}
