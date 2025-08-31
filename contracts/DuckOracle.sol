// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// ChainGPT Oracle Interface
interface IChainGPTOracle {
    function requestPrediction(
        string memory prompt,
        uint256 marketId,
        bytes32 requestId
    ) external returns (bytes32);
    
    function getLatestPrediction(bytes32 requestId) external view returns (
        bool isResolved,
        bool outcome,
        uint256 confidence,
        string memory reasoning
    );
}

// DUCK Token Interface
interface IDuckToken is IERC20 {
    function mint(address to, uint256 amount) external;
    function burn(uint256 amount) external;
}

/**
 * @title DuckToken
 * @dev ERC20 token for DuckOracle ecosystem
 */
contract DuckToken is IERC20, Ownable {
    using Counters for Counters.Counter;
    
    string public constant name = "Duck Token";
    string public constant symbol = "DUCK";
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    
    mapping(address => uint256) private balances;
    mapping(address => mapping(address => uint256)) private allowances;
    mapping(address => bool) public minters;
    
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    
    modifier onlyMinter() {
        require(minters[msg.sender] || msg.sender == owner(), "Not authorized to mint");
        _;
    }
    
    constructor(uint256 _initialSupply) {
        totalSupply = _initialSupply * 10**decimals;
        balances[msg.sender] = totalSupply;
        minters[msg.sender] = true;
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    function addMinter(address _minter) external onlyOwner {
        minters[_minter] = true;
        emit MinterAdded(_minter);
    }
    
    function removeMinter(address _minter) external onlyOwner {
        minters[_minter] = false;
        emit MinterRemoved(_minter);
    }
    
    function balanceOf(address account) public view override returns (uint256) {
        return balances[account];
    }
    
    function transfer(address to, uint256 amount) public override returns (bool) {
        address owner = msg.sender;
        _transfer(owner, to, amount);
        return true;
    }
    
    function allowance(address owner, address spender) public view override returns (uint256) {
        return allowances[owner][spender];
    }
    
    function approve(address spender, uint256 amount) public override returns (bool) {
        address owner = msg.sender;
        _approve(owner, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        address spender = msg.sender;
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }
    
    function mint(address to, uint256 amount) external onlyMinter {
        totalSupply += amount;
        balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }
    
    function burn(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        totalSupply -= amount;
        emit Transfer(msg.sender, address(0), amount);
    }
    
    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "Transfer from zero address");
        require(to != address(0), "Transfer to zero address");
        require(balances[from] >= amount, "Insufficient balance");
        
        balances[from] -= amount;
        balances[to] += amount;
        emit Transfer(from, to, amount);
    }
    
    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "Approve from zero address");
        require(spender != address(0), "Approve to zero address");
        
        allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }
    
    function _spendAllowance(address owner, address spender, uint256 amount) internal {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "Insufficient allowance");
            _approve(owner, spender, currentAllowance - amount);
        }
    }
}

/**
 * @title DuckOracle
 * @dev Main prediction market contract
 */
contract DuckOracle is ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;
    
    IDuckToken public duckToken;
    IChainGPTOracle public chainGPTOracle;
    
    Counters.Counter private marketCounter;
    
    enum MarketStatus { Active, Resolving, Resolved, Disputed }
    enum DataSource { OnChain, OffChain, Hybrid }
    
    struct Market {
        uint256 id;
        string question;
        string resolutionCriteria;
        address creator;
        DataSource dataSource;
        uint256 creationTime;
        uint256 resolutionTime;
        uint256 totalYesShares;
        uint256 totalNoShares;
        uint256 totalVolume;
        MarketStatus status;
        bool outcome; // true for YES, false for NO
        bytes32[] aiRequestIds;
        mapping(address => uint256) yesShares;
        mapping(address => uint256) noShares;
        mapping(address => bool) hasClaimed;
    }
    
    struct AIAgent {
        address agentAddress;
        string name;
        uint256 reputation;
        uint256 totalPredictions;
        uint256 correctPredictions;
        bool isActive;
    }
    
    struct Prediction {
        bytes32 requestId;
        uint256 marketId;
        address agent;
        bool outcome;
        uint256 confidence;
        string reasoning;
        uint256 timestamp;
    }
    
    mapping(uint256 => Market) public markets;
    mapping(bytes32 => Prediction) public predictions;
    mapping(address => AIAgent) public aiAgents;
    mapping(uint256 => address[]) public marketParticipants;
    
    // Platform fees
    uint256 public platformFee = 200; // 2%
    uint256 public constant FEE_DENOMINATOR = 10000;
    address public feeRecipient;
    
    // Market parameters
    uint256 public constant MIN_INITIAL_LIQUIDITY = 1000 * 10**18; // 1000 DUCK
    uint256 public constant RESOLUTION_PERIOD = 1 days;
    uint256 public constant DISPUTE_PERIOD = 3 days;
    
    event MarketCreated(
        uint256 indexed marketId,
        address indexed creator,
        string question,
        uint256 initialLiquidity
    );
    
    event SharesPurchased(
        uint256 indexed marketId,
        address indexed buyer,
        bool outcome,
        uint256 shares,
        uint256 cost
    );
    
    event MarketResolved(
        uint256 indexed marketId,
        bool outcome,
        uint256 totalVolume
    );
    
    event PredictionReceived(
        uint256 indexed marketId,
        bytes32 indexed requestId,
        address indexed agent,
        bool outcome,
        uint256 confidence
    );
    
    event AIAgentRegistered(
        address indexed agent,
        string name
    );
    
    modifier onlyActiveMarket(uint256 marketId) {
        require(markets[marketId].status == MarketStatus.Active, "Market not active");
        _;
    }
    
    modifier onlyValidMarket(uint256 marketId) {
        require(marketId > 0 && marketId <= marketCounter.current(), "Invalid market ID");
        _;
    }
    
    constructor(
        address _duckToken,
        address _chainGPTOracle,
        address _feeRecipient
    ) {
        duckToken = IDuckToken(_duckToken);
        chainGPTOracle = IChainGPTOracle(_chainGPTOracle);
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @dev Register an AI agent for making predictions
     */
    function registerAIAgent(string memory name) external {
        require(!aiAgents[msg.sender].isActive, "Agent already registered");
        
        aiAgents[msg.sender] = AIAgent({
            agentAddress: msg.sender,
            name: name,
            reputation: 1000, // Starting reputation
            totalPredictions: 0,
            correctPredictions: 0,
            isActive: true
        });
        
        emit AIAgentRegistered(msg.sender, name);
    }
    
    /**
     * @dev Create a new prediction market
     */
    function createMarket(
        string memory question,
        string memory resolutionCriteria,
        DataSource dataSource,
        uint256 resolutionTime,
        uint256 initialLiquidity
    ) external nonReentrant returns (uint256) {
        require(bytes(question).length > 0, "Question cannot be empty");
        require(resolutionTime > block.timestamp, "Resolution time must be in future");
        require(initialLiquidity >= MIN_INITIAL_LIQUIDITY, "Insufficient initial liquidity");
        require(
            duckToken.transferFrom(msg.sender, address(this), initialLiquidity),
            "Token transfer failed"
        );
        
        marketCounter.increment();
        uint256 marketId = marketCounter.current();
        
        Market storage newMarket = markets[marketId];
        newMarket.id = marketId;
        newMarket.question = question;
        newMarket.resolutionCriteria = resolutionCriteria;
        newMarket.creator = msg.sender;
        newMarket.dataSource = dataSource;
        newMarket.creationTime = block.timestamp;
        newMarket.resolutionTime = resolutionTime;
        newMarket.status = MarketStatus.Active;
        
        // Initialize with equal YES/NO shares for AMM
        uint256 initialShares = initialLiquidity / 2;
        newMarket.totalYesShares = initialShares;
        newMarket.totalNoShares = initialShares;
        newMarket.totalVolume = initialLiquidity;
        
        // Creator gets initial shares
        newMarket.yesShares[msg.sender] = initialShares;
        newMarket.noShares[msg.sender] = initialShares;
        marketParticipants[marketId].push(msg.sender);
        
        emit MarketCreated(marketId, msg.sender, question, initialLiquidity);
        return marketId;
    }
    
    /**
     * @dev Buy shares in a market using AMM pricing
     */
    function buyShares(
        uint256 marketId,
        bool outcome,
        uint256 maxCost
    ) external nonReentrant onlyValidMarket(marketId) onlyActiveMarket(marketId) {
        Market storage market = markets[marketId];
        require(block.timestamp < market.resolutionTime, "Market resolution time passed");
        
        // Calculate AMM pricing
        uint256 cost = calculateCost(marketId, outcome, 1);
        require(cost <= maxCost, "Cost exceeds maximum");
        require(duckToken.transferFrom(msg.sender, address(this), cost), "Token transfer failed");
        
        // Update shares
        if (outcome) {
            market.yesShares[msg.sender] += 1;
            market.totalYesShares += 1;
        } else {
            market.noShares[msg.sender] += 1;
            market.totalNoShares += 1;
        }
        
        market.totalVolume += cost;
        
        // Add to participants if first time
        if (market.yesShares[msg.sender] == 1 || market.noShares[msg.sender] == 1) {
            if (market.yesShares[msg.sender] <= 1 && market.noShares[msg.sender] <= 1) {
                marketParticipants[marketId].push(msg.sender);
            }
        }
        
        emit SharesPurchased(marketId, msg.sender, outcome, 1, cost);
    }
    
    /**
     * @dev Calculate cost for buying shares using constant product AMM
     */
    function calculateCost(
        uint256 marketId,
        bool outcome,
        uint256 shares
    ) public view onlyValidMarket(marketId) returns (uint256) {
        Market storage market = markets[marketId];
        
        if (outcome) {
            // Buying YES shares increases YES supply, price goes up
            uint256 k = market.totalYesShares * market.totalNoShares;
            uint256 newYesShares = market.totalYesShares + shares;
            uint256 newNoShares = k / newYesShares;
            return (market.totalNoShares - newNoShares) * 1e18 / market.totalYesShares;
        } else {
            // Buying NO shares increases NO supply, price goes up
            uint256 k = market.totalYesShares * market.totalNoShares;
            uint256 newNoShares = market.totalNoShares + shares;
            uint256 newYesShares = k / newNoShares;
            return (market.totalYesShares - newYesShares) * 1e18 / market.totalNoShares;
        }
    }
    
    /**
     * @dev Request AI predictions for market resolution
     */
    function requestAIPredictions(uint256 marketId) external onlyValidMarket(marketId) {
        Market storage market = markets[marketId];
        require(block.timestamp >= market.resolutionTime, "Market not ready for resolution");
        require(market.status == MarketStatus.Active, "Market not in active state");
        
        market.status = MarketStatus.Resolving;
        
        string memory prompt = string(abi.encodePacked(
            "Analyze and predict the outcome for: ",
            market.question,
            " Based on criteria: ",
            market.resolutionCriteria
        ));
        
        // Request predictions from ChainGPT
        bytes32 requestId = chainGPTOracle.requestPrediction(prompt, marketId, keccak256(abi.encodePacked(marketId, block.timestamp)));
        market.aiRequestIds.push(requestId);
    }
    
    /**
     * @dev Callback function for ChainGPT oracle responses
     */
    function fulfillPrediction(
        bytes32 requestId,
        uint256 marketId,
        bool outcome,
        uint256 confidence,
        string memory reasoning
    ) external {
        require(msg.sender == address(chainGPTOracle), "Only oracle can fulfill");
        
        predictions[requestId] = Prediction({
            requestId: requestId,
            marketId: marketId,
            agent: msg.sender,
            outcome: outcome,
            confidence: confidence,
            reasoning: reasoning,
            timestamp: block.timestamp
        });
        
        emit PredictionReceived(marketId, requestId, msg.sender, outcome, confidence);
        
        // Auto-resolve if confidence is high enough
        if (confidence >= 80) {
            resolveMarket(marketId, outcome);
        }
    }
    
    /**
     * @dev Resolve a market with the determined outcome
     */
    function resolveMarket(uint256 marketId, bool outcome) public onlyValidMarket(marketId) {
        Market storage market = markets[marketId];
        require(
            market.status == MarketStatus.Resolving || 
            (market.status == MarketStatus.Active && block.timestamp >= market.resolutionTime + RESOLUTION_PERIOD),
            "Cannot resolve market yet"
        );
        
        market.status = MarketStatus.Resolved;
        market.outcome = outcome;
        
        emit MarketResolved(marketId, outcome, market.totalVolume);
    }
    
    /**
     * @dev Claim winnings from a resolved market
     */
    function claimWinnings(uint256 marketId) external nonReentrant onlyValidMarket(marketId) {
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Resolved, "Market not resolved");
        require(!market.hasClaimed[msg.sender], "Already claimed");
        
        uint256 winningShares = market.outcome ? market.yesShares[msg.sender] : market.noShares[msg.sender];
        require(winningShares > 0, "No winning shares");
        
        uint256 totalWinningShares = market.outcome ? market.totalYesShares : market.totalNoShares;
        uint256 payout = (market.totalVolume * winningShares) / totalWinningShares;
        
        // Deduct platform fee
        uint256 fee = (payout * platformFee) / FEE_DENOMINATOR;
        uint256 netPayout = payout - fee;
        
        market.hasClaimed[msg.sender] = true;
        
        require(duckToken.transfer(msg.sender, netPayout), "Payout transfer failed");
        require(duckToken.transfer(feeRecipient, fee), "Fee transfer failed");
    }
    
    /**
     * @dev Get market information
     */
    function getMarket(uint256 marketId) external view onlyValidMarket(marketId) returns (
        string memory question,
        address creator,
        uint256 totalYesShares,
        uint256 totalNoShares,
        uint256 totalVolume,
        MarketStatus status,
        bool outcome,
        uint256 resolutionTime
    ) {
        Market storage market = markets[marketId];
        return (
            market.question,
            market.creator,
            market.totalYesShares,
            market.totalNoShares,
            market.totalVolume,
            market.status,
            market.outcome,
            market.resolutionTime
        );
    }
    
    /**
     * @dev Get user's shares in a market
     */
    function getUserShares(uint256 marketId, address user) external view onlyValidMarket(marketId) returns (
        uint256 yesShares,
        uint256 noShares,
        bool hasClaimed
    ) {
        Market storage market = markets[marketId];
        return (
            market.yesShares[user],
            market.noShares[user],
            market.hasClaimed[user]
        );
    }
    
    /**
     * @dev Get current market count
     */
    function getCurrentMarketId() external view returns (uint256) {
        return marketCounter.current();
    }
    
    /**
     * @dev Update platform fee (only owner)
     */
    function setPlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee too high"); // Max 10%
        platformFee = newFee;
    }
    
    /**
     * @dev Update fee recipient (only owner)
     */
    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid recipient");
        feeRecipient = newRecipient;
    }
    
    /**
     * @dev Emergency pause function (only owner)
     */
    function pause() external onlyOwner {
        // Implementation for pausing contract functionality
    }
}

/**
 * @title ChainGPTOracleMock
 * @dev Mock implementation for testing ChainGPT integration
 */
contract ChainGPTOracleMock is IChainGPTOracle, Ownable {
    using Counters for Counters.Counter;
    
    struct PredictionRequest {
        string prompt;
        uint256 marketId;
        bytes32 requestId;
        bool fulfilled;
        bool outcome;
        uint256 confidence;
        string reasoning;
    }
    
    mapping(bytes32 => PredictionRequest) public requests;
    address public duckOracleContract;
    Counters.Counter private requestCounter;
    
    event PredictionRequested(bytes32 indexed requestId, uint256 indexed marketId, string prompt);
    event PredictionFulfilled(bytes32 indexed requestId, bool outcome, uint256 confidence);
    
    modifier onlyDuckOracle() {
        require(msg.sender == duckOracleContract, "Only DuckOracle can call");
        _;
    }
    
    function setDuckOracleContract(address _duckOracle) external onlyOwner {
        duckOracleContract = _duckOracle;
    }
    
    function requestPrediction(
        string memory prompt,
        uint256 marketId,
        bytes32 requestId
    ) external override onlyDuckOracle returns (bytes32) {
        requests[requestId] = PredictionRequest({
            prompt: prompt,
            marketId: marketId,
            requestId: requestId,
            fulfilled: false,
            outcome: false,
            confidence: 0,
            reasoning: ""
        });
        
        emit PredictionRequested(requestId, marketId, prompt);
        
        // In production, this would trigger actual ChainGPT API call
        // For demo, we'll auto-fulfill with mock data after delay
        _mockFulfillPrediction(requestId, marketId);
        
        return requestId;
    }
    
    function getLatestPrediction(bytes32 requestId) external view override returns (
        bool isResolved,
        bool outcome,
        uint256 confidence,
        string memory reasoning
    ) {
        PredictionRequest memory request = requests[requestId];
        return (
            request.fulfilled,
            request.outcome,
            request.confidence,
            request.reasoning
        );
    }
    
    // Mock function to simulate ChainGPT response
    function _mockFulfillPrediction(bytes32 requestId, uint256 marketId) internal {
        // Generate pseudo-random prediction for demo
        uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp, requestId))) % 100;
        bool outcome = random >= 50;
        uint256 confidence = 75 + (random % 25); // 75-99% confidence
        
        string memory reasoning = outcome 
            ? "Based on market analysis and technical indicators, positive outcome is likely."
            : "Current market conditions and risk factors suggest negative outcome is probable.";
        
        requests[requestId].fulfilled = true;
        requests[requestId].outcome = outcome;
        requests[requestId].confidence = confidence;
        requests[requestId].reasoning = reasoning;
        
        // Call back to DuckOracle
        DuckOracle(duckOracleContract).fulfillPrediction(
            requestId,
            marketId,
            outcome,
            confidence,
            reasoning
        );
        
        emit PredictionFulfilled(requestId, outcome, confidence);
    }
    
    // Manual fulfillment for testing
    function fulfillPredictionManual(
        bytes32 requestId,
        uint256 marketId,
        bool outcome,
        uint256 confidence,
        string memory reasoning
    ) external onlyOwner {
        require(!requests[requestId].fulfilled, "Already fulfilled");
        
        requests[requestId].fulfilled = true;
        requests[requestId].outcome = outcome;
        requests[requestId].confidence = confidence;
        requests[requestId].reasoning = reasoning;
        
        DuckOracle(duckOracleContract).fulfillPrediction(
            requestId,
            marketId,
            outcome,
            confidence,
            reasoning
        );
        
        emit PredictionFulfilled(requestId, outcome, confidence);
    }
}