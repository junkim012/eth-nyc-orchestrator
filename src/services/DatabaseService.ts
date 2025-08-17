import { UserMapping, CreateUserMappingRequest } from '../models/UserMapping';
import { Transaction, CreateTransactionRequest } from '../models/Transaction';

export class DatabaseService {
  private static instance: DatabaseService;
  private pb: any;
  private initialized: Promise<void>;
  private depositAddressCache: Set<string> = new Set();

  private constructor(url: string = process.env.POCKETBASE_URL || 'http://localhost:8090') {
    this.initialized = this.initializePocketBase(url);
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private async initializePocketBase(url: string): Promise<void> {
    try {
      // Use Function constructor to bypass CommonJS module restriction
      const dynamicImport = new Function('module', 'return import(module)');
      const { default: PocketBase } = await dynamicImport('pocketbase');
      this.pb = new PocketBase(url);
      
      // Disable auto-cancellation to handle high-frequency requests
      this.pb.autoCancellation(false);
    } catch (error) {
      console.error('Failed to initialize PocketBase:', error);
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    await this.initialized;
  }

  async authenticate(): Promise<void> {
    try {
      await this.ensureInitialized();
      await this.pb.admins.authWithPassword(
        process.env.POCKETBASE_ADMIN_EMAIL!,
        process.env.POCKETBASE_ADMIN_PASSWORD!
      );
    } catch (error) {
      console.error('Failed to authenticate with PocketBase:', error);
      throw error;
    }
  }

  async createUserMapping(userMapping: UserMapping): Promise<UserMapping> {
    try {
      await this.ensureInitialized();
      const record = await this.pb.collection('user_mappings').create(userMapping);
      // Add to cache
      this.depositAddressCache.add(userMapping.depositAddress);
      return record as unknown as UserMapping;
    } catch (error) {
      console.error('Failed to create user mapping:', error);
      throw error;
    }
  }

  async getUserMappingByUserAddress(userPublicAddress: string): Promise<UserMapping | null> {
    try {
      await this.ensureInitialized();
      const record = await this.pb.collection('user_mappings')
        .getFirstListItem(`userPublicAddress="${userPublicAddress}"`);
      return record as unknown as UserMapping;
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      console.error('Failed to get user mapping:', error);
      throw error;
    }
  }

  async getUserMappingByDepositAddress(depositAddress: string): Promise<UserMapping | null> {
    try {
      await this.ensureInitialized();
      
      // Quick cache check first - if not in cache, it's definitely not ours
      if (!this.depositAddressCache.has(depositAddress)) {
        return null;
      }
      
      const record = await this.pb.collection('user_mappings')
        .getFirstListItem(`depositAddress="${depositAddress}"`);
      return record as unknown as UserMapping;
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      // Handle auto-cancellation gracefully
      if (error.isAbort) {
        console.log('Database request auto-cancelled, skipping...');
        return null;
      }
      console.error('Failed to get user mapping by deposit address:', error);
      throw error;
    }
  }

  async getAllDepositAddresses(): Promise<string[]> {
    try {
      await this.ensureInitialized();
      const records = await this.pb.collection('user_mappings').getFullList();
      const addresses = records.map((record: any) => record.depositAddress);
      
      // Update cache
      this.depositAddressCache.clear();
      addresses.forEach((addr: string) => this.depositAddressCache.add(addr));
      
      return addresses;
    } catch (error) {
      console.error('Failed to get all deposit addresses:', error);
      throw error;
    }
  }

  // Initialize cache on startup
  async initializeCache(): Promise<void> {
    try {
      await this.getAllDepositAddresses();
      console.log(`Initialized deposit address cache with ${this.depositAddressCache.size} addresses`);
    } catch (error) {
      console.warn('Failed to initialize deposit address cache:', error);
    }
  }

  // Get cached deposit addresses for monitoring
  getCachedDepositAddresses(): string[] {
    return Array.from(this.depositAddressCache);
  }

  // Get cache statistics
  getCacheStats(): { size: number; addresses: string[] } {
    return {
      size: this.depositAddressCache.size,
      addresses: Array.from(this.depositAddressCache)
    };
  }

  // Transaction methods
  async createTransaction(transaction: CreateTransactionRequest): Promise<Transaction> {
    try {
      await this.ensureInitialized();
      const record = await this.pb.collection('transactions').create(transaction);
      return record as unknown as Transaction;
    } catch (error) {
      console.error('Failed to create transaction:', error);
      throw error;
    }
  }

  async getTransactionsByUserAddress(userPublicAddress: string): Promise<Transaction[]> {
    try {
      await this.ensureInitialized();
      const records = await this.pb.collection('transactions')
        .getFullList({
          filter: `userPublicAddress="${userPublicAddress}"`,
          sort: '-created'
        });
      return records as unknown as Transaction[];
    } catch (error) {
      console.error('Failed to get transactions by user address:', error);
      throw error;
    }
  }
}