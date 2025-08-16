import { ethers } from 'ethers';

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const UNISWAP_V3_ROUTER_ABI = [
  "function exactInputSingle((address,address,uint24,address,uint256,uint256,uint256,uint160)) external payable returns (uint256)"
];

export interface SwapResult {
  transactionHash: string;
  amountOut: string;
}

export class UniswapService {
  private provider: ethers.Provider;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
  }

  async swapUSDCtoPyUSD(
    depositPrivateKey: string,
    usdcAmount: bigint,
    recipientAddress: string
  ): Promise<SwapResult> {
    // Use the simpler implementation for better reliability
    return this.swapUSDCtoPyUSDSimple(depositPrivateKey, usdcAmount, recipientAddress);
  }

  // Direct contract interaction implementation
  async swapUSDCtoPyUSDSimple(
    depositPrivateKey: string,
    usdcAmount: bigint,
    recipientAddress: string,
    poolFee: number = 3000 // 0.3%
  ): Promise<SwapResult> {
    const wallet = new ethers.Wallet(depositPrivateKey, this.provider);
    
    // Create contracts
    const usdcContract = new ethers.Contract(
      process.env.USDC_ADDRESS!,
      ERC20_ABI,
      wallet
    );

    const routerContract = new ethers.Contract(
      process.env.UNISWAP_V3_ROUTER!,
      UNISWAP_V3_ROUTER_ABI,
      wallet
    );

    // Check balance
    const balance = await usdcContract.balanceOf(wallet.address);
    if (balance < usdcAmount) {
      throw new Error('Insufficient USDC balance');
    }

    // Approve USDC spending
    const approveTx = await usdcContract.approve(process.env.UNISWAP_V3_ROUTER!, usdcAmount);
    await approveTx.wait();

    // Calculate minimum amount out (with 0.5% slippage)
    const minAmountOut = (usdcAmount * 995n) / 1000n; // Assuming 1:1 ratio with 0.5% slippage

    // Prepare swap parameters
    const params = {
      tokenIn: process.env.USDC_ADDRESS!,
      tokenOut: process.env.PYUSD_ADDRESS!,
      fee: poolFee,
      recipient: recipientAddress,
      deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes
      amountIn: usdcAmount,
      amountOutMinimum: minAmountOut,
      sqrtPriceLimitX96: 0
    };

    // Execute swap
    const swapTx = await routerContract.exactInputSingle(params);
    const receipt = await swapTx.wait();

    return {
      transactionHash: receipt.hash,
      amountOut: minAmountOut.toString()
    };
  }
}