
// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract staking_contract_1734597307 is ReentrancyGuard, Ownable {
    IERC20 public stakingToken;
    
    uint256 public constant REWARD_RATE_DECIMALS = 18;
    uint256 public rewardRate; // Rewards per second per token staked
    uint256 public lastUpdateTime;
    uint256 public totalStaked;

    mapping(address => uint256) public userStakeAmount;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public userRewardPerTokenPaid;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardRateUpdated(uint256 newRate);

    constructor() Ownable() {
        stakingToken = IERC20(0x5FbDB2315678afecb367f032d93F642f64180aa3); // Placeholder address, change before deployment
        rewardRate = 1e15; // 0.001 tokens per second per staked token (adjust as needed)
        lastUpdateTime = block.timestamp;
    }

    function setRewardRate(uint256 _rewardRate) external onlyOwner {
        updateReward(address(0));
        rewardRate = _rewardRate;
        emit RewardRateUpdated(_rewardRate);
    }

    function stake(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Cannot stake 0");
        updateReward(msg.sender);
        totalStaked += _amount;
        userStakeAmount[msg.sender] += _amount;
        require(stakingToken.transferFrom(msg.sender, address(this), _amount), "Stake failed");
        emit Staked(msg.sender, _amount);
    }

    function withdraw(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Cannot withdraw 0");
        require(userStakeAmount[msg.sender] >= _amount, "Not enough staked");
        updateReward(msg.sender);
        totalStaked -= _amount;
        userStakeAmount[msg.sender] -= _amount;
        require(stakingToken.transfer(msg.sender, _amount), "Withdraw failed");
        emit Withdrawn(msg.sender, _amount);
    }

    function getRewards() external nonReentrant {
        updateReward(msg.sender);
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            require(stakingToken.transfer(msg.sender, reward), "Reward transfer failed");
            emit RewardPaid(msg.sender, reward);
        }
    }

    function checkRewards(address _account) external view returns (uint256) {
        return rewards[_account] + (
            (userStakeAmount[_account] * (rewardPerToken() - userRewardPerTokenPaid[_account])) / (10**REWARD_RATE_DECIMALS)
        );
    }

    function updateReward(address _account) internal {
        uint256 rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        if (_account != address(0)) {
            rewards[_account] = rewards[_account] + (
                (userStakeAmount[_account] * (rewardPerTokenStored - userRewardPerTokenPaid[_account])) / (10**REWARD_RATE_DECIMALS)
            );
            userRewardPerTokenPaid[_account] = rewardPerTokenStored;
        }
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return 0;
        }
        return (rewardRate * (block.timestamp - lastUpdateTime) * (10**REWARD_RATE_DECIMALS)) / totalStaked;
    }
}
