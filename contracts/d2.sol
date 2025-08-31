// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title IChainGPTAI
 * @dev Interface for ChainGPT AI inference and data aggregation
 */
interface IChainGPTAI {
    struct AIRequest {
        string prompt;
        string[] dataSources;
        uint256 confidenceThreshold;
        uint256 maxResponseTime;
        bytes parameters;
    }

    struct AIResponse {
        bool outcome;
        uint256 confidence;
        string reasoning;
        bytes32[] dataHashes;
        uint256 timestamp;
        address validator;
    }

    function requestInference(
        bytes32 requestId,
        AIRequest memory request
    ) external returns (bool);

    function getInferenceResult(bytes32 requestId) 
        external view returns (AIResponse memory);

    function validateDataSource(string memory source) 
        external view returns (bool isValid, uint256 reliability);
}

/**
 * @title ChainGPTOracle
 * @dev Advanced oracle system using ChainGPT for AI-powered predictions
 */
contract ChainGPTOracle is ReentrancyGuard, Ownable, Pausable {
    using Counters for Counters.Counter;

    IChainGPTAI public chainGPTAI;
    
    Counters.Counter private requestCounter;
    
    struct PredictionRequest {
        bytes32 requestId;
        uint256 marketId;
        address requester;
        string question;
        string[] dataSources;
        uint256 timestamp;
        uint256 deadline;
        bool fulfilled;
        bool disputed;
        uint256 stakeAmount;
    }

    struct DataSource {
        string name;
        string endpoint;
        uint256 reliability; // 0-100
        bool isActive;
        address validator;
        uint256 lastUpdate;
    }

    struct AIAgent {
        address agentAddress;
        string name;
        uint256 reputation;
        uint256 totalPredictions;
        uint256 correctPredictions;
        uint256 stakeRequired;
        bool isActive;
        mapping(string => uint256) specializations; // domain -> expertise level
    }

    struct Consensus {
        uint256 totalVotes;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 totalStake;
        uint256 yesStake;
        uint256 noStake;
        mapping(address => bool) hasVoted;
        mapping(address => uint256) votes; // 0=NO, 1=YES
        mapping(address => uint256) stakes;
    }

    // State variables
    mapping(bytes32 => PredictionRequest) public requests;
    mapping(bytes32 => IChainGPTAI.AIResponse) public responses;
    mapping(bytes32 => Consensus) public consensus;
    mapping(string => DataSource) public dataSources;
    mapping(address => AIAgent) public aiAgents;
    mapping(bytes32 => mapping(address => bool)) public agentParticipation;

    string[] public approvedDataSources;
    address[] public activeAgents;

    // Configuration
    uint256 public constant MIN_CONSENSUS_AGENTS = 3;
    uint256 public constant CONSENSUS_TIMEOUT = 24 hours;
    uint256 public constant MIN_CONFIDENCE = 70; // 70%
    uint256 public constant DISPUTE_BOND = 1000e18; // 1000 DUCK
    uint256 public requestFee = 100e18; // 100 DUCK

    IERC20 public duckToken;
    address public duckOracleContract;

    // Events
    event PredictionRequested(
        bytes32 indexed requestId,
        uint256 indexed marketId,
        string question,
        string[] dataSources
    );

    event AIAgentResponse(
        bytes32 indexed requestId,
        address indexed agent,
        bool outcome,
        uint256 confidence,
        string reasoning
    );

    event ConsensusReached(
        bytes32 indexed requestId,
        bool outcome,
        uint256 confidence,
        uint256 participatingAgents
    );

    event DataSourceAdded(string indexed sourceName, address validator);
    event AgentRegistered(address indexed agent, string name);
    event DisputeRaised(bytes32 indexed requestId, address disputer);

    modifier onlyDuckOracle() {
        require(msg.sender == duckOracleContract, "Only DuckOracle contract");
        _;
    }

    modifier validAgent() {
        require(aiAgents[msg.sender].isActive, "Agent not active");
        _;
    }

    constructor(
        address _chainGPTAI,
        address _duckToken
    ) {
        chainGPTAI = IChainGPTAI(_chainGPTAI);
        duckToken = IERC20(_duckToken);
    }

    /**
     * @dev Set the DuckOracle contract address
     */
    function setDuckOracleContract(address _duckOracle) external onlyOwner {
        duckOracleContract = _duckOracle;
    }

    /**
     * @dev Register an AI agent with specialization
     */
    function registerAIAgent(
        string memory name,
        string[] memory specializations,
        uint256[] memory expertiseLevels
    ) external {
        require(!aiAgents[msg.sender].isActive, "Already registered");
        require(specializations.length == expertiseLevels.length, "Length mismatch");

        AIAgent storage agent = aiAgents[msg.sender];
        agent.agentAddress = msg.sender;
        agent.name = name;
        agent.reputation = 1000; // Starting reputation
        agent.stakeRequired = 500e18; // 500 DUCK stake
        agent.isActive = true;

        for (uint i = 0; i < specializations.length; i++) {
            agent.specializations[specializations[i]] = expertiseLevels[i];
        }

        activeAgents.push(msg.sender);
        emit AgentRegistered(msg.sender, name);
    }

    /**
     * @dev Add approved data source
     */
    function addDataSource(
        string memory name,
        string memory endpoint,
        uint256 reliability,
        address validator
    ) external onlyOwner {
        require(reliability <= 100, "Invalid reliability");
        
        dataSources[name] = DataSource({
            name: name,
            endpoint: endpoint,
            reliability: reliability,
            isActive: true,
            validator: validator,
            lastUpdate: block.timestamp
        });

        approvedDataSources.push(name);
        emit DataSourceAdded(name, validator);
    }

    /**
     * @dev Request AI prediction with multi-agent consensus
     */
    function requestPrediction(
        string memory question,
        uint256 marketId,
        string[] memory dataSources_,
        uint256 deadline
    ) external onlyDuckOracle returns (bytes32) {
        require(deadline > block.timestamp, "Invalid deadline");
        require(dataSources_.length > 0, "No data sources provided");
        
        requestCounter.increment();
        bytes32 requestId = keccak256(abi.encodePacked(
            requestCounter.current(),
            block.timestamp,
            msg.sender,
            question
        ));

        requests[requestId] = PredictionRequest({
            requestId: requestId,
            marketId: marketId,
            requester: msg.sender,
            question: question,
            dataSources: dataSources_,
            timestamp: block.timestamp,
            deadline: deadline,
            fulfilled: false,
            disputed: false,
            stakeAmount: requestFee
        });

        // Initialize consensus tracking
        consensus[requestId].totalVotes = 0;
        consensus[requestId].totalStake = 0;

        // Request inference from ChainGPT AI
        IChainGPTAI.AIRequest memory aiRequest = IChainGPTAI.AIRequest({
            prompt: _buildPrompt(question, dataSources_),
            dataSources: dataSources_,
            confidenceThreshold: MIN_CONFIDENCE,
            maxResponseTime: deadline - block.timestamp,
            parameters: abi.encodePacked(marketId, requestId)
        });

        chainGPTAI.requestInference(requestId, aiRequest);

        emit PredictionRequested(requestId, marketId, question, dataSources_);
        return requestId;
    }

    /**
     * @dev AI agents submit their predictions
     */
    function submitPrediction(
        bytes32 requestId,
        bool outcome,
        uint256 confidence,
        string memory reasoning,
        uint256 stakeAmount
    ) external validAgent nonReentrant {
        require(!requests[requestId].fulfilled, "Request already fulfilled");
        require(block.timestamp < requests[requestId].deadline, "Deadline passed");
        require(!agentParticipation[requestId][msg.sender], "Already participated");
        require(confidence >= MIN_CONFIDENCE, "Confidence too low");
        require(stakeAmount >= aiAgents[msg.sender].stakeRequired, "Insufficient stake");

        // Transfer stake
        require(
            duckToken.transferFrom(msg.sender, address(this), stakeAmount),
            "Stake transfer failed"
        );

        // Record participation
        agentParticipation[requestId][msg.sender] = true;
        
        // Update consensus
        Consensus storage cons = consensus[requestId];
        cons.totalVotes += 1;
        cons.totalStake += stakeAmount;
        
        if (outcome) {
            cons.yesVotes += 1;
            cons.yesStake += stakeAmount;
            cons.votes[msg.sender] = 1;
        } else {
            cons.noVotes += 1;
            cons.noStake += stakeAmount;
            cons.votes[msg.sender] = 0;
        }
        
        cons.stakes[msg.sender] = stakeAmount;
        cons.hasVoted[msg.sender] = true;

        emit AIAgentResponse(requestId, msg.sender, outcome, confidence, reasoning);

        // Check if consensus reached
        if (cons.totalVotes >= MIN_CONSENSUS_AGENTS) {
            _checkConsensus(requestId);
        }
    }

    /**
     * @dev Check and finalize consensus
     */
    function _checkConsensus(bytes32 requestId) internal {
        Consensus storage cons = consensus[requestId];
        PredictionRequest storage req = requests[requestId];
        
        if (req.fulfilled) return;

        // Calculate weighted consensus
        uint256 yesWeight = (cons.yesStake * 100) / cons.totalStake;
        uint256 noWeight = (cons.noStake * 100) / cons.totalStake;
        
        bool finalOutcome;
        uint256 finalConfidence;
        
        if (yesWeight > noWeight) {
            finalOutcome = true;
            finalConfidence = yesWeight;
        } else {
            finalOutcome = false;
            finalConfidence = noWeight;
        }

        // Require supermajority (60%+ weighted consensus)
        if (finalConfidence >= 60) {
            req.fulfilled = true;
            
            // Store response
            responses[requestId] = IChainGPTAI.AIResponse({
                outcome: finalOutcome,
                confidence: finalConfidence,
                reasoning: "Multi-agent consensus reached",
                dataHashes: new bytes32[](0),
                timestamp: block.timestamp,
                validator: address(this)
            });

            // Distribute rewards to correct predictors
            _distributeRewards(requestId, finalOutcome);

            // Update agent reputations
            _updateReputations(requestId, finalOutcome);

            emit ConsensusReached(requestId, finalOutcome, finalConfidence, cons.totalVotes);

            // Callback to DuckOracle
            IDuckOracleCallback(duckOracleContract).fulfillPrediction(
                requestId,
                req.marketId,
                finalOutcome,
                finalConfidence,
                "Multi-agent AI consensus"
            );
        }
    }

    /**
     * @dev Distribute rewards to agents who predicted correctly
     */
    function _distributeRewards(bytes32 requestId, bool correctOutcome) internal {
        Consensus storage cons = consensus[requestId];
        uint256 totalRewardPool = cons.totalStake;
        uint256 correctStake = correctOutcome ? cons.yesStake : cons.noStake;
        
        if (correctStake == 0) return; // No one was correct
        
        for (uint i = 0; i < activeAgents.length; i++) {
            address agent = activeAgents[i];
            if (!cons.hasVoted[agent]) continue;
            
            uint256 agentVote = cons.votes[agent];
            uint256 agentStake = cons.stakes[agent];
            
            // Agent predicted correctly
            if ((correctOutcome && agentVote == 1) || (!correctOutcome && agentVote == 0)) {
                uint256 reward = (totalRewardPool * agentStake) / correctStake;
                duckToken.transfer(agent, reward);
                
                // Increase reputation
                aiAgents[agent].reputation += 10;
                aiAgents[agent].correctPredictions += 1;
            } else {
                // Agent predicted incorrectly - lose stake
                aiAgents[agent].reputation = aiAgents[agent].reputation > 5 ? 
                    aiAgents[agent].reputation - 5 : 0;
            }
            
            aiAgents[agent].totalPredictions += 1;
        }
    }

    /**
     * @dev Update agent reputations based on performance
     */
    function _updateReputations(bytes32 requestId, bool correctOutcome) internal {
        Consensus storage cons = consensus[requestId];
        
        for (uint i = 0; i < activeAgents.length; i++) {
            address agent = activeAgents[i];
            if (!cons.hasVoted[agent]) continue;
            
            uint256 agentVote = cons.votes[agent];
            bool wasCorrect = (correctOutcome && agentVote == 1) || (!correctOutcome && agentVote == 0);
            
            if (wasCorrect) {
                aiAgents[agent].correctPredictions += 1;
            }
            
            aiAgents[agent].totalPredictions += 1;
            
            // Adjust stake requirements based on performance
            uint256 accuracy = (aiAgents[agent].correctPredictions * 100) / aiAgents[agent].totalPredictions;
            if (accuracy > 80) {
                aiAgents[agent].stakeRequired = aiAgents[agent].stakeRequired * 90 / 100; // Reduce by 10%
            } else if (accuracy < 60) {
                aiAgents[agent].stakeRequired = aiAgents[agent].stakeRequired * 110 / 100; // Increase by 10%
            }
        }
    }

    /**
     * @dev Raise a dispute against a prediction
     */
    function disputePrediction(bytes32 requestId) external {
        require(requests[requestId].fulfilled, "Request not fulfilled");
        require(!requests[requestId].disputed, "Already disputed");
        require(
            duckToken.transferFrom(msg.sender, address(this), DISPUTE_BOND),
            "Dispute bond transfer failed"
        );

        requests[requestId].disputed = true;
        
        emit DisputeRaised(requestId, msg.sender);
        
        // Initiate dispute resolution process
        _initiateDispute(requestId, msg.sender);
    }

    /**
     * @dev Initiate dispute resolution with enhanced consensus
     */
    function _initiateDispute(bytes32 requestId, address disputer) internal {
        // Reset consensus for re-evaluation
        delete consensus[requestId];
        requests[requestId].fulfilled = false;
        requests[requestId].deadline = block.timestamp + CONSENSUS_TIMEOUT;
        
        // Require higher threshold for dispute resolution
        // Implementation would include additional verification mechanisms
    }

    /**
     * @dev Build AI prompt for ChainGPT
     */
    function _buildPrompt(
        string memory question,
        string[] memory dataSources_
    ) internal pure returns (string memory) {
        return string(abi.encodePacked(
            "Analyze the following prediction market question and provide a binary outcome (true/false): ",
            question,
            ". Use the following data sources for analysis: ",
            _joinStrings(dataSources_),
            ". Consider market trends, historical data, and current events. Provide confidence level and detailed reasoning."
        ));
    }

    /**
     * @dev Join string array for prompt building
     */
    function _joinStrings(string[] memory strings) internal pure returns (string memory) {
        if (strings.length == 0) return "";
        
        string memory result = strings[0];
        for (uint i = 1; i < strings.length; i++) {
            result = string(abi.encodePacked(result, ", ", strings[i]));
        }
        return result;
    }

    /**
     * @dev Get prediction result
     */
    function getLatestPrediction(bytes32 requestId) external view returns (
        bool isResolved,
        bool outcome,
        uint256 confidence,
        string memory reasoning
    ) {
        PredictionRequest memory req = requests[requestId];
        if (!req.fulfilled) {
            return (false, false, 0, "");
        }

        IChainGPTAI.AIResponse memory response = responses[requestId];
        return (true, response.outcome, response.confidence, response.reasoning);
    }

    /**
     * @dev Get agent statistics
     */
    function getAgentStats(address agent) external view returns (
        uint256 reputation,
        uint256 totalPredictions,
        uint256 correctPredictions,
        uint256 accuracy,
        uint256 stakeRequired
    ) {
        AIAgent storage a = aiAgents[agent];
        uint256 acc = a.totalPredictions > 0 ? (a.correctPredictions * 100) / a.totalPredictions : 0;
        
        return (
            a.reputation,
            a.totalPredictions,
            a.correctPredictions,
            acc,
            a.stakeRequired
        );
    }

    /**
     * @dev Emergency functions
     */
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setRequestFee(uint256 newFee) external onlyOwner {
        requestFee = newFee;
    }

    /**
     * @dev Withdraw accumulated fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = duckToken.balanceOf(address(this));
        duckToken.transfer(owner(), balance);
    }
}

/**
 * @title IDuckOracleCallback
 * @dev Interface for DuckOracle to receive predictions
 */
interface IDuckOracleCallback {
    function fulfillPrediction(
        bytes32 requestId,
        uint256 marketId,
        bool outcome,
        uint256 confidence,
        string memory reasoning
    ) external;
}

/**
 * @title EnhancedDuckOracle
 * @dev Enhanced prediction market with advanced features
 */
contract EnhancedDuckOracle is ReentrancyGuard, Ownable, Pausable {
    using Counters for Counters.Counter;

    // Interfaces
    IDuckToken public duckToken;
    ChainGPTOracle public chainGPTOracle;
    AggregatorV3Interface internal priceFeed; // For BTC/USD price feed

    Counters.Counter private marketCounter;

    enum MarketStatus { Active, Resolving, Resolved, Disputed, Cancelled }
    enum DataSource { OnChain, OffChain, Hybrid, PriceFeed }
    enum MarketType { Binary, Scalar, Categorical }

    struct Market {
        uint256 id;
        string question;
        string resolutionCriteria;
        address creator;
        DataSource dataSource;
        MarketType marketType;
        uint256 creationTime;
        uint256 resolutionTime;
        uint256 totalYesShares;
        uint256 totalNoShares;
        uint256 totalVolume;
        uint256 liquidityPool;
        MarketStatus status;
        bool outcome;
        bytes32[] aiRequestIds;
        mapping(address => uint256) yesShares;
        mapping(address => uint256) noShares;
        mapping(address => bool) hasClaimed;
        mapping(address => uint256) liquidity; // LP tokens
        uint256 k; // AMM constant product
        uint256 creatorBond;
        address[] validators;
    }

    struct LiquidityPosition {
        uint256 yesTokens;
        uint256 noTokens;
        uint256 lpTokens;
        uint256 timestamp;
    }

    struct MarketMetadata {
        string category;
        string[] tags;
        string description;
        string[] dataSources;
        uint256 minLiquidity;
        uint256 tradingFee; // in basis points
        bool isVerified;
    }

    // State mappings
    mapping(uint256 => Market) public markets;
    mapping(uint256 => MarketMetadata) public marketMetadata;
    mapping(uint256 => mapping(address => LiquidityPosition)) public liquidityPositions;
    mapping(address => uint256[]) public userMarkets;
    mapping(string => uint256[]) public categoryMarkets;
    
    // Platform configuration
    uint256 public platformFee = 200; // 2%
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant MIN_LIQUIDITY = 10000e18; // 10k DUCK
    uint256 public constant CREATOR_BOND = 5000e18; // 5k DUCK
    uint256 public liquidityMiningRate = 100e18; // 100 DUCK per day
    
    address public feeRecipient;
    address public governance;

    // Events
    event MarketCreated(
        uint256 indexed marketId,
        address indexed creator,
        string question,
        MarketType marketType,
        uint256 initialLiquidity
    );

    event LiquidityAdded(
        uint256 indexed marketId,
        address indexed provider,
        uint256 yesAmount,
        uint256 noAmount,
        uint256 lpTokens
    );

    event SharesTraded(
        uint256 indexed marketId,
        address indexed trader,
        bool outcome,
        uint256 shares,
        uint256 cost,
        uint256 fee
    );

    event MarketResolved(
        uint256 indexed marketId,
        bool outcome,
        uint256 totalVolume,
        address resolver
    );

    constructor(
        address _duckToken,
        address _chainGPTOracle,
        address _feeRecipient,
        address _priceFeed
    ) {
        duckToken = IDuckToken(_duckToken);
        chainGPTOracle = ChainGPTOracle(_chainGPTOracle);
        feeRecipient = _feeRecipient;
        priceFeed = AggregatorV3Interface(_priceFeed);
        governance = msg.sender;
    }

    /**
     * @dev Create enhanced prediction market
     */
    function createMarket(
        string memory question,
        string memory resolutionCriteria,
        string memory category,
        string[] memory tags,
        string memory description,
        string[] memory dataSources_,
        DataSource dataSource,
        MarketType marketType,
        uint256 resolutionTime,
        uint256 initialLiquidity,
        uint256 tradingFee
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(bytes(question).length > 0, "Empty question");
        require(resolutionTime > block.timestamp + 1 hours, "Invalid resolution time");
        require(initialLiquidity >= MIN_LIQUIDITY, "Insufficient liquidity");
        require(tradingFee <= 500, "Fee too high"); // Max 5%
        
        // Transfer creator bond and initial liquidity
        uint256 totalRequired = CREATOR_BOND + initialLiquidity;
        require(
            duckToken.transferFrom(msg.sender, address(this), totalRequired),
            "Transfer failed"
        );

        marketCounter.increment();
        uint256 marketId = marketCounter.current();

        Market storage newMarket = markets[marketId];
        newMarket.id = marketId;
        newMarket.question = question;
        newMarket.resolutionCriteria = resolutionCriteria;
        newMarket.creator = msg.sender;
        newMarket.dataSource = dataSource;
        newMarket.marketType = marketType;
        newMarket.creationTime = block.timestamp;
        newMarket.resolutionTime = resolutionTime;
        newMarket.status = MarketStatus.Active;
        newMarket.creatorBond = CREATOR_BOND;

        // Initialize AMM with equal liquidity
        uint256 initialShares = initialLiquidity / 2;
        newMarket.totalYesShares = initialShares;
        newMarket.totalNoShares = initialShares;
        newMarket.liquidityPool = initialLiquidity;
        newMarket.k = initialShares * initialShares; // x * y = k
        
        // Store metadata
        marketMetadata[marketId] = MarketMetadata({
            category: category,
            tags: tags,
            description: description,
            dataSources: dataSources_,
            minLiquidity: MIN_LIQUIDITY,
            tradingFee: tradingFee,
            isVerified: false
        });

        // Creator gets LP tokens
        liquidityPositions[marketId][msg.sender] = LiquidityPosition({
            yesTokens: initialShares,
            noTokens: initialShares,
            lpTokens: initialLiquidity,
            timestamp: block.timestamp
        });

        userMarkets[msg.sender].push(marketId);
        categoryMarkets[category].push(marketId);

        emit MarketCreated(marketId, msg.sender, question, marketType, initialLiquidity);
        return marketId;
    }

    /**
     * @dev Add liquidity to market AMM
     */
    function addLiquidity(
        uint256 marketId,
        uint256 maxYesAmount,
        uint256 maxNoAmount
    ) external whenNotPaused nonReentrant {
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        
        // Calculate optimal amounts based on current ratio
        uint256 yesAmount = (maxYesAmount * market.totalNoShares) / market.totalYesShares;
        uint256 noAmount = maxNoAmount;
        
        if (yesAmount > maxYesAmount) {
            yesAmount = maxYesAmount;
            noAmount = (maxNoAmount * market.totalYesShares) / market.totalNoShares;
        }

        require(yesAmount > 0 && noAmount > 0, "Invalid amounts");
        
        uint256 totalAmount = yesAmount + noAmount;
        require(
            duckToken.transferFrom(msg.sender, address(this), totalAmount),
            "Transfer failed"
        );

        // Calculate LP tokens to mint
        uint256 lpTokens = (totalAmount * market.liquidityPool) / (market.totalYesShares + market.totalNoShares);
        
        // Update market state
        market.totalYesShares += yesAmount;
        market.totalNoShares += noAmount;
        market.liquidityPool += totalAmount;
        market.k = market.totalYesShares * market.totalNoShares;

        // Update user position
        LiquidityPosition storage position = liquidityPositions[marketId][msg.sender];
        position.yesTokens += yesAmount;
        position.noTokens += noAmount;
        position.lpTokens += lpTokens;

        emit LiquidityAdded(marketId, msg.sender, yesAmount, noAmount, lpTokens);
    }

    /**
     * @dev Enhanced AMM trading with dynamic pricing
     */
    function buyShares(
        uint256 marketId,
        bool outcome,
        uint256 minShares,
        uint256 maxCost
    ) external whenNotPaused nonReentrant returns (uint256 sharesBought) {
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        require(block.timestamp < market.resolutionTime, "Market expired");

        // Calculate shares and cost using enhanced AMM
        (uint256 cost, uint256 shares) = calculateTradeOutput(marketId, outcome, maxCost);
        require(shares >= minShares, "Insufficient output");
        require(cost <= maxCost, "Cost too high");

        // Calculate trading fee
        uint256 tradingFee = (cost * marketMetadata[marketId].tradingFee) / FEE_DENOMINATOR;
        uint256 totalCost = cost + tradingFee;

        require(
            duckToken.transferFrom(msg.sender, address(this), totalCost),
            "Transfer failed"
        );

        // Update AMM state
        if (outcome) {
            market.yesShares[msg.sender] += shares;
            market.totalYesShares += shares;
        } else {
            market.noShares[msg.sender] += shares;
            market.totalNoShares += shares;
        }

        market.totalVolume += cost;
        market.k = market.totalYesShares * market.totalNoShares;

        // Distribute fees
        if (tradingFee > 0) {
            uint256 lpFee = tradingFee / 2; // 50% to LPs
            uint256 platformFee_ = tradingFee - lpFee; // 50% to platform
            
            market.liquidityPool += lpFee;
            duckToken.transfer(feeRecipient, platformFee_);
        }

        emit SharesTraded(marketId, msg.sender, outcome, shares, cost, tradingFee);
        return shares;
    }

    /**
     * @dev Calculate trade output using enhanced AMM formula
     */
    function calculateTradeOutput(
        uint256 marketId,
        bool outcome,
        uint256 inputAmount
    ) public view returns (uint256 cost, uint256 shares) {
        Market storage market = markets[marketId];
        
        if (outcome) {
            // Buying YES shares - calculate based on constant product formula
            uint256 yesReserve = market.totalYesShares;
            uint256 noReserve = market.totalNoShares;
            
            // Calculate shares received for given input
            uint256 numerator = inputAmount * noReserve;
            uint256 denominator = yesReserve + inputAmount;
            shares = numerator / denominator;
            
            cost = inputAmount;
        } else {
            // Buying NO shares
            uint256 yesReserve = market.totalYesShares;
            uint256 noReserve = market.totalNoShares;
            
            uint256 numerator = inputAmount * yesReserve;
            uint256 denominator = noReserve + inputAmount;
            shares = numerator / denominator;
            
            cost = inputAmount;
        }
    }

    /**
     * @dev Request AI resolution for market
     */
    function requestAIResolution(uint256 marketId) external whenNotPaused {
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        require(block.timestamp >= market.resolutionTime, "Not ready for resolution");
        
        market.status = MarketStatus.Resolving;
        
        MarketMetadata memory metadata = marketMetadata[marketId];
        
        bytes32 requestId = chainGPTOracle.requestPrediction(
            market.question,
            marketId,
            metadata.dataSources,
            block.timestamp + 24 hours // 24 hour deadline
        );
        
        market.aiRequestIds.push(requestId);
    }

    /**
     * @dev Callback from ChainGPT Oracle
     */
    function fulfillPrediction(
        bytes32 requestId,
        uint256 marketId,
        bool outcome,
        uint256 confidence,
        string memory reasoning
    ) external {
        require(msg.sender == address(chainGPTOracle), "Only oracle");
        
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Resolving, "Not in resolving state");
        
        // Resolve market if confidence is sufficient
        if (confidence >= 75) {
            market.status = MarketStatus.Resolved;
            market.outcome = outcome;
            
            emit MarketResolved(marketId, outcome, market.totalVolume, msg.sender);
        }
    }

    /**
     * @dev Claim winnings from resolved market
     */
    function claimWinnings(uint256 marketId) external nonReentrant {
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.Resolved, "Market not resolved");
        require(!market.hasClaimed[msg.sender], "Already claimed");
        
        uint256 winningShares = market.outcome ? market.yesShares[msg.sender] : market.noShares[msg.sender];
        require(winningShares > 0, "No winning shares");
        
        uint256 totalWinningShares = market.outcome ? market.totalYesShares : market.totalNoShares;
        uint256 payout = (market.liquidityPool * winningShares) / totalWinningShares;
        
        // Deduct platform fee
        uint256 fee = (payout * platformFee) / FEE_DENOMINATOR;
        uint256 netPayout = payout - fee;
        
        market.hasClaimed[msg.sender] = true;
        
        require(duckToken.transfer(msg.sender, netPayout), "Transfer failed");
        require(duckToken.transfer(feeRecipient, fee), "Fee transfer failed");
    }

    /**
     * @dev Get price feed data for on-chain resolution
     */
    function getLatestPrice() public view returns (int256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return price;
    }

    /**
     * @dev Auto-resolve price-based markets
     */
    function resolveByPrice(uint256 marketId, int256 targetPrice) external {
        Market storage market = markets[marketId];
        require(market.dataSource == DataSource.PriceFeed, "Not price-based market");
        require(block.timestamp >= market.resolutionTime, "Too early");
        
        int256 currentPrice = getLatestPrice();
        bool outcome = currentPrice >= targetPrice;
        
        market.status = MarketStatus.Resolved;
        market.outcome = outcome;
        
        emit MarketResolved(marketId, outcome, market.totalVolume, msg.sender);
    }

    // Governance functions
    function setGovernance(address _governance) external onlyOwner {
        governance = _governance;
    }

    function setPlatformFee(uint256 _fee) external {
        require(msg.sender == governance, "Only governance");
        require(_fee <= 1000, "Fee too high"); // Max 10%
        platformFee = _fee;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}