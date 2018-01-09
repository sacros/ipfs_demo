pragma solidity ^0.4.17;

contract HashStore {

    //Events
    event OwnershipTransferred(address indexed _previousOwner, address indexed _newOwner);
    event NewHashStored(address indexed _hashSender, uint _hashId, string _hashContent, uint timestamp);
    event Withdrawn(address indexed _hashSender, uint amount);

    //Storage
    struct Hash {
        address sender;
        string content;
        uint timestamp;
    }

    mapping(uint => Hash) public hashes;
    address public owner;
    uint public lastHashId;
    uint public price;

    //Modifier
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    //Public functions
    function HashStore(uint _price) public {
        require(_price > 0);
        owner = msg.sender;
        price = _price;
        lastHashId = 0;
    }

    function transferOwnership(address _newOwner) onlyOwner public {
        require(_newOwner != address(0));
        OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;        
    }

    function withdrawBalance() onlyOwner public {
        var amount = this.balance;
        owner.transfer(this.balance);
        Withdrawn(owner, amount);
    }

    function save(string _hashContent) payable public {
        require(msg.value >= price);
        uint hashId = ++lastHashId;
        hashes[hashId].sender = msg.sender;
        hashes[hashId].content = _hashContent;
        hashes[hashId].timestamp = block.timestamp;

        NewHashStored(hashes[hashId].sender, hashId, hashes[hashId].content, hashes[hashId].timestamp);
    }

    function find(uint _hashId) constant public returns (address hashSender, string hashContent, uint hashTimestamp) {
        return (hashes[_hashId].sender, hashes[_hashId].content, hashes[_hashId].timestamp);
    }

}