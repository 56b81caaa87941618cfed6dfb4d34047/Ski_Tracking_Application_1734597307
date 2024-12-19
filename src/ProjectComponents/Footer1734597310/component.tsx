
import React from 'react';
import { ethers } from 'ethers';

const StakingInterface: React.FC = () => {
  const [provider, setProvider] = React.useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = React.useState<ethers.Signer | null>(null);
  const [contract, setContract] = React.useState<ethers.Contract | null>(null);
  const [stakeAmount, setStakeAmount] = React.useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = React.useState<string>('');
  const [userStake, setUserStake] = React.useState<string>('0');
  const [userRewards, setUserRewards] = React.useState<string>('0');
  const [status, setStatus] = React.useState<string>('');

  const contractAddress = '0xc3039ee6993608c56ffAAcDb892b1ca5857858dD';
  const chainId = 17000; // Holesky testnet

  const contractABI = [
    "function stake(uint256 _amount) external",
    "function withdraw(uint256 _amount) external",
    "function getRewards() external",
    "function checkRewards(address _account) external view returns (uint256)",
    "function userStakeAmount(address) public view returns (uint256)"
  ];

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(web3Provider);
        const web3Signer = web3Provider.getSigner();
        setSigner(web3Signer);
        const stakingContract = new ethers.Contract(contractAddress, contractABI, web3Signer);
        setContract(stakingContract);
        setStatus('Wallet connected');
      } else {
        setStatus('Please install MetaMask');
      }
    } catch (error) {
      setStatus('Failed to connect wallet');
      console.error(error);
    }
  };

  const checkAndSwitchNetwork = async () => {
    if (!provider) {
      setStatus('Please connect your wallet first');
      return false;
    }
    const network = await provider.getNetwork();
    if (network.chainId !== chainId) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ethers.utils.hexValue(chainId) }],
        });
        return true;
      } catch (error) {
        setStatus('Failed to switch network');
        console.error(error);
        return false;
      }
    }
    return true;
  };

  const stakeTokens = async () => {
    if (!contract || !signer) {
      await connectWallet();
    }
    if (!(await checkAndSwitchNetwork())) return;
    try {
      const tx = await contract!.stake(ethers.utils.parseEther(stakeAmount));
      await tx.wait();
      setStatus(`Successfully staked ${stakeAmount} tokens`);
      updateUserInfo();
    } catch (error) {
      setStatus('Staking failed');
      console.error(error);
    }
  };

  const withdrawTokens = async () => {
    if (!contract || !signer) {
      await connectWallet();
    }
    if (!(await checkAndSwitchNetwork())) return;
    try {
      const tx = await contract!.withdraw(ethers.utils.parseEther(withdrawAmount));
      await tx.wait();
      setStatus(`Successfully withdrawn ${withdrawAmount} tokens`);
      updateUserInfo();
    } catch (error) {
      setStatus('Withdrawal failed');
      console.error(error);
    }
  };

  const claimRewards = async () => {
    if (!contract || !signer) {
      await connectWallet();
    }
    if (!(await checkAndSwitchNetwork())) return;
    try {
      const tx = await contract!.getRewards();
      await tx.wait();
      setStatus('Successfully claimed rewards');
      updateUserInfo();
    } catch (error) {
      setStatus('Claiming rewards failed');
      console.error(error);
    }
  };

  const updateUserInfo = async () => {
    if (!contract || !signer) return;
    try {
      const address = await signer.getAddress();
      const stake = await contract.userStakeAmount(address);
      const rewards = await contract.checkRewards(address);
      setUserStake(ethers.utils.formatEther(stake));
      setUserRewards(ethers.utils.formatEther(rewards));
    } catch (error) {
      console.error('Failed to update user info:', error);
    }
  };

  React.useEffect(() => {
    if (contract && signer) {
      updateUserInfo();
    }
  }, [contract, signer]);

  return (
    <div className="bg-gray-100 p-5 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Staking Interface</h2>
      
      <div className="mb-4">
        <p>Your Stake: {userStake} tokens</p>
        <p>Your Rewards: {userRewards} tokens</p>
      </div>

      <div className="mb-4">
        <input
          type="number"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
          placeholder="Amount to stake"
          className="p-2 border rounded mr-2"
        />
        <button onClick={stakeTokens} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          Stake
        </button>
      </div>

      <div className="mb-4">
        <input
          type="number"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
          placeholder="Amount to withdraw"
          className="p-2 border rounded mr-2"
        />
        <button onClick={withdrawTokens} className="bg-green-500 text-white p-2 rounded hover:bg-green-600">
          Withdraw
        </button>
      </div>

      <button onClick={claimRewards} className="bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600 mb-4">
        Claim Rewards
      </button>

      <p className="text-sm text-gray-600">{status}</p>
    </div>
  );
};

export { StakingInterface as component };
