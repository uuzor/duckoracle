// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

interface IChainGPTOracle {
    function requestPrediction(string memory prompt, uint256 marketId) external returns (bytes32);
    function getLatestPrediction(bytes32 requestId) external view returns (bool, bool, uint256, string memory);
}

contract DuckOracleV2 is ReentrancyGuard, Ownable, Pausable {
    using Counters for Counters.Counter;
    
    IERC20 public immutable duckToken;
    IChainGPTOracle public chainGPTOracle;
    Counters.Counter private marketCounter;
    
    enum MarketStatus { Active, Resolving, Resolved, Disputed, Cancelled }
    enum DataSource { OnChain, OffChain, Hybrid }
    
    struct Market {
        string question;
        string criteria;
        address creator;
        DataSource dataSource;
        uint256 creationTime;
        uint256 resolutionTime;
        uint256 yesShares;
        uint256 noShares;
        uint256 totalVolume;
        MarketStatus status;
        bool outcome;
        uint256 creatorFee;
        mapping(address => uint256) userYesShares;
        mapping(address => uint256) userNoShares;
        mapping(address => bool) hasClaimed;
    }
    
    struct AIAgent {
        string name;
        uint256 reputation;
        uint256 totalPredictions;
        uint256 correctPredictions;
        bool isActive;
    }
    
    mapping(uint256 => Market) public markets;
    mapping(address => AIAgent) public aiAgents;
    mapping(bytes32 => uint256) public requestToMarket;
    
    uint256 public constant MIN_LIQUIDITY = 100 * 10**18;
    uint256 public constant MAX_FEE = 500; // 5%
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public platformFee = 200; // 2%
    address public feeRecipient;
    
    event MarketCreated(uint256 indexed marketId, address indexed creator, string question);
    event SharesPurchased(uint256 indexed marketId, address indexed buyer, bool outcome, uint256 shares, uint256 cost);
    event MarketResolved(uint256 indexed marketId, bool outcome);
    event PredictionReceived(uint256 indexed marketId, bytes32 requestId, bool outcome, uint256 confidence);
    
    constructor(address _duckToken, address _chainGPTOracle, address _feeRecipient) {
        duckToken = IERC20(_duckToken);
        chainGPTOracle = IChainGPTOracle(_chainGPTOracle);
        feeRecipient = _feeRecipient;
    }
    
    function createMarket(
        string memory question,
        string memory criteria,
        DataSource dataSource,
        uint256 resolutionTime,
        uint256 initialLiquidity,
        uint256 creatorFee
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(bytes(question).length > 0 && bytes(question).length <= 200, "Invalid question");
        require(resolutionTime > block.timestamp + 1 hours, "Invalid resolution time");
        require(initialLiquidity >= MIN_LIQUIDITY, "Insufficient liquidity");
        require(creatorFee <= MAX_FEE, "Fee too high");
        require(duckToken.transferFrom(msg.sender, address(this), initialLiquidity), "Transfer failed");
        
        marketCounter.increment();
        uint256 marketId = marketCounter.current();
        
        Market storage market = markets[marketId];
        market.question = question;
        market.criteria = criteria;
        market.creator = msg.sender;
        market.dataSource = dataSource;
        market.creationTime = block.timestamp;
        market.resolutionTime = resolutionTime;
        market.status = MarketStatus.Active;
        market.creatorFee = creatorFee;
        
        uint256 initialShares = initialLiquidity / 2;
        market.yesShares = initialShares;
        market.noShares = initialShares;
        market.totalVolume = initialLiquidity;
        market.userYesShares[msg.sender] = initialShares;
        market.userNoShares[msg.sender] = initialShares;
        
        emit MarketCreated(marketId, msg.sender, question);
        return marketId;
    }
    
    function buyShares(uint256 marketId, bool outcome, uint256 maxCost) external nonReentrant whenNotPaused {
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        require(block.timestamp < market.resolutionTime, "Market expired");
        
        uint256 cost = getSharePrice(marketId, outcome, 1);
        require(cost <= maxCost, "Price too high");
        require(duckToken.transferFrom(msg.sender, address(this), cost), "Transfer failed");
        
        if (outcome) {
            market.userYesShares[msg.sender] += 1;
            market.yesShares += 1;
        } else {
            market.userNoShares[msg.sender] += 1;
            market.noShares += 1;
        }
        
        market.totalVolume += cost;
        emit SharesPurchased(marketId, msg.sender, outcome, 1, cost);
    }
    
    function getSharePrice(uint256 marketId, bool outcome, uint256 shares) public view returns (uint256) {
        Market storage market = markets[marketId];
        require(market.yesShares > 0 && market.noShares > 0, "Invalid market");
        
        uint256 k = market.yesShares * market.noShares;
        
        if (outcome) {
            uint256 newYes = market.yesShares + shares;
            uint256 newNo = k / newYes;
            return (market.noShares - newNo) * 1e18 / market.yesShares;
        } else {
            uint256 newNo = market.noShares + shares;
            uint256 newYes = k / newNo;
            return (market.yesShares - newYes) * 1e18 / market.noShares;
        }
    }
    
    function requestResolution(uint256 marketId) external {
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Active, "Invalid status");
        require(block.timestamp >= market.resolutionTime, "Too early");
        
        market.status = MarketStatus.Resolving;
        
        string memory prompt = string(abi.encodePacked(
            "Question: ", market.question,
            " Criteria: ", market.criteria
        ));
        
        bytes32 requestId = chainGPTOracle.requestPrediction(prompt, marketId);
        requestToMarket[requestId] = marketId;
    }
    
    function fulfillPrediction(bytes32 requestId, bool outcome, uint256 confidence, string memory reasoning) external {
        require(msg.sender == address(chainGPTOracle), "Only oracle");
        
        uint256 marketId = requestToMarket[requestId];
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Resolving, "Invalid status");
        
        emit PredictionReceived(marketId, requestId, outcome, confidence);
        
        if (confidence >= 80) {
            market.status = MarketStatus.Resolved;
            market.outcome = outcome;
            emit MarketResolved(marketId, outcome);
        }
    }
    
    function claimWinnings(uint256 marketId) external nonReentrant {
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Resolved, "Not resolved");
        require(!market.hasClaimed[msg.sender], "Already claimed");
        
        uint256 winningShares = market.outcome ? market.userYesShares[msg.sender] : market.userNoShares[msg.sender];
        require(winningShares > 0, "No winning shares");
        
        uint256 totalWinning = market.outcome ? market.yesShares : market.noShares;
        uint256 payout = (market.totalVolume * winningShares) / totalWinning;
        
        uint256 totalFee = (payout * (platformFee + market.creatorFee)) / FEE_DENOMINATOR;
        uint256 netPayout = payout - totalFee;
        
        market.hasClaimed[msg.sender] = true;
        
        require(duckToken.transfer(msg.sender, netPayout), "Transfer failed");
        
        uint256 platformAmount = (totalFee * platformFee) / (platformFee + market.creatorFee);
        require(duckToken.transfer(feeRecipient, platformAmount), "Fee transfer failed");
        require(duckToken.transfer(market.creator, totalFee - platformAmount), "Creator fee failed");
    }
    
    function getMarket(uint256 marketId) external view returns (
        string memory question,
        address creator,
        uint256 yesShares,
        uint256 noShares,
        uint256 totalVolume,
        MarketStatus status,
        bool outcome,
        uint256 resolutionTime
    ) {
        Market storage market = markets[marketId];
        return (
            market.question,
            market.creator,
            market.yesShares,
            market.noShares,
            market.totalVolume,
            market.status,
            market.outcome,
            market.resolutionTime
        );
    }
    
    function getUserShares(uint256 marketId, address user) external view returns (uint256, uint256, bool) {
        Market storage market = markets[marketId];
        return (market.userYesShares[user], market.userNoShares[user], market.hasClaimed[user]);
    }
    
    function getCurrentMarketId() external view returns (uint256) {
        return marketCounter.current();
    }
    
    function setPlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_FEE, "Fee too high");
        platformFee = newFee;
    }
    
    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid address");
        feeRecipient = newRecipient;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}