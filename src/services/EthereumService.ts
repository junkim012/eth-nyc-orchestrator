import { ethers } from 'ethers';
import { DatabaseService } from './DatabaseService';
import { RouterService } from './RouterService';

const USDC_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

export class EthereumService {
  private provider: ethers.Provider;
  private usdcContract: ethers.Contract;
  private dbService: DatabaseService;
  private routerService: RouterService;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    this.usdcContract = new ethers.Contract(
      process.env.USDC_ADDRESS!,
      USDC_ABI,
      this.provider
    );
    this.dbService = DatabaseService.getInstance();
    this.routerService = new RouterService();
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
    // Check if the destination address is one of our deposit addresses
    const userMapping = await this.dbService.getUserMappingByDepositAddress(to);
    
    if (!userMapping) {
      // Not one of our deposit addresses, ignore
      return;
    }

    // Log detailed event information for monitored addresses
    console.log('=================== USDC TRANSFER EVENT ===================');
    console.log(`Event Details:`);
    console.log(`  From Address: ${from}`);
    console.log(`  To Address (Deposit): ${to}`);
    console.log(`  Amount: ${ethers.formatUnits(value, 6)} USDC`);
    console.log(`  Amount (Raw): ${value.toString()}`);
    console.log(`  Block Number: ${event.blockNumber}`);
    console.log(`  Transaction Hash: ${event.transactionHash}`);
    console.log(`  Log Index: ${event.logIndex}`);
    console.log(`User Mapping:`);
    console.log(`  User Public Address: ${userMapping.userPublicAddress}`);
    console.log(`  Deposit Address: ${userMapping.depositAddress}`);
    console.log(`  Mapping ID: ${userMapping.id}`);
    console.log('========================================================');

    try {
      // Perform USDC to pyUSD swap using Router contract
      const swapResult = await this.routerService.swapUSDCtoPyUSD(
        userMapping.privateKey,
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