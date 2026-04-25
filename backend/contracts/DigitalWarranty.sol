// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract DigitalWarranty is ERC721URIStorage, AccessControl {
    using Strings for uint256;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 private _nextTokenId;

    struct Warranty {
        string serialNumber;
        uint256 productId;
        uint256 expiryDate;
        bool isVoided;
        address issuer;
    }

    mapping(uint256 => string) public productTypes;
    mapping(uint256 => Warranty) public warrantyDetails;

    event WarrantyIssued(uint256 indexed tokenId, address indexed customer, string serialNumber, uint256 expiryDate);

    constructor(address defaultAdmin) ERC721("UMKM Digital Warranty", "UWAR") {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, defaultAdmin);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function registerProductType(uint256 productId, string calldata productName) external onlyRole(ADMIN_ROLE) {
        productTypes[productId] = productName;
    }

    function issueWarranty(
        address customer,
        uint256 productId,
        uint256 durationInDays,
        string calldata metadataURI
    ) public onlyRole(MINTER_ROLE) returns (uint256) {
        require(bytes(productTypes[productId]).length > 0, "Product type not registered");

        uint256 tokenId = _nextTokenId++;
        uint256 expiryDate = block.timestamp + (durationInDays * 1 days);
        string memory serialNumber = _generateSerialNumber(productId, tokenId);

        warrantyDetails[tokenId] = Warranty({
            serialNumber: serialNumber,
            productId: productId,
            expiryDate: expiryDate,
            isVoided: false,
            issuer: msg.sender
        });

        _safeMint(customer, tokenId);
        _setTokenURI(tokenId, metadataURI);

        emit WarrantyIssued(tokenId, customer, serialNumber, expiryDate);

        return tokenId;
    }

    function batchIssueWarranty(
        address[] calldata customers,
        uint256 productId,
        uint256 durationInDays,
        string[] calldata metadataURIs
    ) external onlyRole(MINTER_ROLE) {
        require(customers.length == metadataURIs.length, "Arrays length mismatch");
        require(bytes(productTypes[productId]).length > 0, "Product type not registered");

        // Gas efficient loop
        uint256 len = customers.length;
        for (uint256 i = 0; i < len; ) {
            issueWarranty(customers[i], productId, durationInDays, metadataURIs[i]);
            unchecked { ++i; }
        }
    }

    function _generateSerialNumber(uint256 productId, uint256 tokenId) private view returns (string memory) {
        bytes32 hash = keccak256(abi.encodePacked(msg.sender, productId, block.timestamp, tokenId));
        bytes4 partialHash = bytes4(hash);

        return string(abi.encodePacked("PROD-", _toHex8(partialHash), "-2026"));
    }

    function _toHex8(bytes4 data) private pure returns (string memory) {
        bytes memory alphabet = "0123456789ABCDEF";
        bytes memory str = new bytes(8);
        for (uint256 i = 0; i < 4; i++) {
            str[i*2] = alphabet[uint8(data[i] >> 4)];
            str[1+i*2] = alphabet[uint8(data[i] & 0x0f)];
        }
        return string(str);
    }
}
