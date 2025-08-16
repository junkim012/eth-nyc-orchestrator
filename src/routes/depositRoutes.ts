import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { WalletService } from '../services/WalletService';
import { CreateUserMappingRequest } from '../models/UserMapping';

const router = Router();

router.get('/cached-monitoring-addresses', async (req: Request, res: Response) => {
  try {
    const dbService = DatabaseService.getInstance();
    await dbService.authenticate();

    // Get database addresses and cache stats
    const allAddresses = await dbService.getAllDepositAddresses();
    const cacheStats = dbService.getCacheStats();
    
    res.json({
      message: 'Cached monitoring addresses retrieved successfully',
      database: {
        totalAddresses: allAddresses.length,
        addresses: allAddresses
      },
      cache: {
        size: cacheStats.size,
        addresses: cacheStats.addresses
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error retrieving cached monitoring addresses:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

router.post('/refresh-cache', async (req: Request, res: Response) => {
  try {
    const dbService = DatabaseService.getInstance();
    await dbService.authenticate();
    await dbService.initializeCache();

    const cacheStats = dbService.getCacheStats();
    
    res.json({
      message: 'Cache refreshed successfully',
      cacheSize: cacheStats.size,
      addresses: cacheStats.addresses,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error refreshing cache:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

router.post('/create-deposit-address', async (req: Request, res: Response) => {
  try {
    const { userPublicAddress }: CreateUserMappingRequest = req.body;

    if (!userPublicAddress) {
      return res.status(400).json({
        error: 'userPublicAddress is required'
      });
    }

    if (!WalletService.isValidEthereumAddress(userPublicAddress)) {
      return res.status(400).json({
        error: 'Invalid Ethereum address format'
      });
    }

    const dbService = DatabaseService.getInstance();
    await dbService.authenticate();

    // Check if user already has a deposit address
    const existingMapping = await dbService.getUserMappingByUserAddress(userPublicAddress);
    if (existingMapping) {
      return res.json({
        depositAddress: existingMapping.depositAddress,
        userPublicAddress: existingMapping.userPublicAddress,
        message: 'Deposit address already exists for this user'
      });
    }

    // Generate new wallet for deposit address
    const walletInfo = WalletService.generateNewWallet();

    // Store mapping in database
    const userMapping = await dbService.createUserMapping({
      userPublicAddress,
      depositAddress: walletInfo.address,
      privateKey: walletInfo.privateKey
    });

    res.json({
      depositAddress: userMapping.depositAddress,
      userPublicAddress: userMapping.userPublicAddress,
      message: 'Deposit address created successfully'
    });

  } catch (error) {
    console.error('Error creating deposit address:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

router.get('/get-deposit-address', async (req: Request, res: Response) => {
  try {
    const { userPublicAddress } = req.query;

    if (!userPublicAddress || typeof userPublicAddress !== 'string') {
      return res.status(400).json({
        error: 'userPublicAddress query parameter is required'
      });
    }

    if (!WalletService.isValidEthereumAddress(userPublicAddress)) {
      return res.status(400).json({
        error: 'Invalid Ethereum address format'
      });
    }

    const dbService = DatabaseService.getInstance();
    await dbService.authenticate();

    // Check if user exists
    const existingMapping = await dbService.getUserMappingByUserAddress(userPublicAddress);
    if (!existingMapping) {
      return res.status(404).json({
        error: 'User does not exist'
      });
    }

    res.json({
      depositAddress: existingMapping.depositAddress,
      userPublicAddress: existingMapping.userPublicAddress,
      message: 'Deposit address retrieved successfully'
    });

  } catch (error) {
    console.error('Error retrieving deposit address:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

export default router;