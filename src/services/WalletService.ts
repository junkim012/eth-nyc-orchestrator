import { ethers } from 'ethers';

export interface WalletInfo {
  address: string;
  privateKey: string;
}

export class WalletService {
  static generateNewWallet(): WalletInfo {
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      privateKey: wallet.privateKey
    };
  }

  static getWalletFromPrivateKey(privateKey: string): ethers.Wallet {
    return new ethers.Wallet(privateKey);
  }

  static isValidEthereumAddress(address: string): boolean {
    return ethers.isAddress(address);
  }
}