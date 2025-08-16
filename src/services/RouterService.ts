import { ethers } from 'ethers';

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const ROUTER_ABI = [
  "function swapToPyUSD(uint256 amountIn, uint256 minAmountOut, address recipient) external returns (uint256 amountOut)"
];

export interface SwapResult {
  transactionHash: string;
  amountOut: string;
}

export class RouterService {
  private provider: ethers.Provider;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
  }

  async swapUSDCtoPyUSD(
    depositPrivateKey: string,
    recipientAddress: string
  ): Promise<SwapResult> {
    const wallet = new ethers.Wallet(depositPrivateKey, this.provider);
    
    // Create contracts
    const usdcContract = new ethers.Contract(
      process.env.USDC_ADDRESS!,
      ERC20_ABI,
      wallet
    );

    const routerContract = new ethers.Contract(
      process.env.ROUTER_ADDRESS!,
      ROUTER_ABI,
      wallet
    );

    // Get total USDC balance in the deposit address
    const usdcAmount = await usdcContract.balanceOf(wallet.address);
    if (usdcAmount === 0n) {
      throw new Error('No USDC balance in deposit address');
    }

    // Calculate minAmountOut (allowing 1% slippage)
    const minAmountOut = (usdcAmount * 99n) / 100n;

    // Approve USDC spending by the Router contract
    const approveTx = await usdcContract.approve(process.env.ROUTER_ADDRESS!, usdcAmount);
    await approveTx.wait();

    // Execute swap through Router contract
    const swapTx = await routerContract.swapToPyUSD(usdcAmount, minAmountOut, recipientAddress);
    const receipt = await swapTx.wait();

    return {
      transactionHash: receipt.hash,
      amountOut: minAmountOut.toString()
    };
  }
}