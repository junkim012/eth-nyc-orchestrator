import { ethers } from 'ethers';
import { DatabaseService } from './DatabaseService';
import { UniswapService } from './UniswapService';

const USDC_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

export class EthereumService {
  private provider: ethers.Provider;
  private usdcContract: ethers.Contract;
  private dbService: DatabaseService;
  private uniswapService: UniswapService;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    this.usdcContract = new ethers.Contract(
      process.env.USDC_ADDRESS!,
      USDC_ABI,
      this.provider
    );
    this.dbService = new DatabaseService();
    this.uniswapService = new UniswapService();
  }

  async startListening(): Promise<void> {
    console.log('Starting Ethereum event listener...');
    
    await this.dbService.authenticate();
    await this.dbService.initializeCache();

    // Listen for USDC Transfer events
    this.usdcContract.on('Transfer', async (from: string, to: string, value: bigint, event: any) => {
      try {
        await this.handleUSDCTransfer(from, to, value, event);
      } catch (error) {
        // console.error('Error handling USDC transfer:', error);
      }
    });

    console.log('Ethereum event listener started successfully');
  }

  private async handleUSDCTransfer(from: string, to: string, value: bigint, event: any): Promise<void> {
    // console.log(`USDC Transfer detected: ${from} -> ${to}, value: ${ethers.formatUnits(value, 6)} USDC`);

    // Check if the destination address is one of our deposit addresses
    const userMapping = await this.dbService.getUserMappingByDepositAddress(to);
    
    if (!userMapping) {
      // Not one of our deposit addresses, ignore
      return;
    }

    console.log(`Transfer to our deposit address detected for user: ${userMapping.userPublicAddress}`);

    try {
      // Perform USDC to pyUSD swap
      const swapResult = await this.uniswapService.swapUSDCtoPyUSD(
        userMapping.privateKey,
        value,
        userMapping.userPublicAddress
      );

      console.log(`Swap completed successfully. Transaction hash: ${swapResult.transactionHash}`);
    } catch (error) {
      console.error('Failed to perform swap:', error);
      // In a production system, you might want to implement retry logic
      // or store failed transactions for manual processing
    }
  }

  async stopListening(): Promise<void> {
    console.log('Stopping Ethereum event listener...');
    this.usdcContract.removeAllListeners();
    console.log('Ethereum event listener stopped');
  }
}