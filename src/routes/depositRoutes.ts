import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { WalletService } from '../services/WalletService';
import { CreateUserMappingRequest } from '../models/UserMapping';

const router = Router();

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

    const dbService = new DatabaseService();
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

export default router;