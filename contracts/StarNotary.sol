// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Importing OpenZeppelin's ERC721, ReentrancyGuard, AccessControl, and Address utilities
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Address.sol";

// StarNotary contract inheriting from ERC721, ReentrancyGuard, and AccessControl
contract StarNotary is ERC721, ReentrancyGuard, AccessControl {
    using Address for address;

    // Struct to represent a Star
    struct Star {
        string name;
    }

    // Mapping from token ID to Star info
    mapping(uint256 => Star) public tokenIdToStarInfo;
    // Mapping from token ID to sale price
    mapping(uint256 => uint256) public starsForSale;
    // Mapping to keep track of existing tokens
    mapping(uint256 => bool) private _tokenExists;

    // Constant for the admin role
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Events
    event StarCreated(uint256 indexed tokenId, string name);
    event StarPutUpForSale(uint256 indexed tokenId, uint256 price);
    event StarBought(uint256 indexed tokenId, address owner);

    // Constructor
    constructor() ERC721("StarNotary", "STAR") {
        // Granting the deployer the admin role
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // Override for supportsInterface
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721, AccessControl) returns (bool) {
        return
            ERC721.supportsInterface(interfaceId) ||
            AccessControl.supportsInterface(interfaceId);
    }

    // Function to create a new star
    function createStar(
        string memory name,
        uint256 tokenId
    ) public onlyRole(ADMIN_ROLE) {
        require(!_tokenExists[tokenId], "Star already exists");
        Star memory newStar = Star(name);
        tokenIdToStarInfo[tokenId] = newStar;
        _mint(msg.sender, tokenId);
        _tokenExists[tokenId] = true;
        emit StarCreated(tokenId, name);
    }

    // Function to put a star up for sale
    function putStarUpForSale(uint256 tokenId, uint256 price) public {
        require(
            ownerOf(tokenId) == msg.sender,
            "You can't sell a star you don't own"
        );
        require(_tokenExists[tokenId], "Star does not exist");
        starsForSale[tokenId] = price;
        emit StarPutUpForSale(tokenId, price);
    }

    // Function to buy a star
    function buyStar(uint256 tokenId) public payable nonReentrant {
        require(_tokenExists[tokenId], "Star does not exist");
        require(starsForSale[tokenId] > 0, "The star is not for sale");
        uint256 starCost = starsForSale[tokenId];
        require(msg.value >= starCost, "Not enough Ether to buy this star");
        address starOwner = ownerOf(tokenId);
        _transfer(starOwner, msg.sender, tokenId);
        Address.sendValue(payable(starOwner), starCost);
        if (msg.value > starCost) {
            Address.sendValue(payable(msg.sender), msg.value - starCost);
        }
        starsForSale[tokenId] = 0;
        emit StarBought(tokenId, msg.sender);
    }

    // Function to look up star information by token ID
    function lookUptokenIdToStarInfo(
        uint256 tokenId
    ) public view returns (string memory) {
        require(_tokenExists[tokenId], "Star does not exist");
        return tokenIdToStarInfo[tokenId].name;
    }

    // Function to exchange stars between two owners
    function exchangeStars(uint256 tokenId1, uint256 tokenId2) public {
        require(tokenId1 != tokenId2, "Cannot exchange the same star");
        require(
            _tokenExists[tokenId1] && _tokenExists[tokenId2],
            "One or both stars do not exist"
        );
        require(
            ownerOf(tokenId1) == msg.sender || ownerOf(tokenId2) == msg.sender,
            "You must own one of the stars"
        );

        address owner1 = ownerOf(tokenId1);
        address owner2 = ownerOf(tokenId2);
        _transfer(owner1, owner2, tokenId1);
        _transfer(owner2, owner1, tokenId2);
    }

    // Function to transfer a star to another address
    function transferStar(address to, uint256 tokenId) public {
        require(
            ownerOf(tokenId) == msg.sender,
            "You can't transfer a star you don't own"
        );
        require(_tokenExists[tokenId], "Star does not exist");
        _transfer(msg.sender, to, tokenId);
    }
}
