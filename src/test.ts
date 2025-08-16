import { WalletService } from './services/WalletService';

console.log('Testing wallet generation...');

// Test wallet generation
const wallet = WalletService.generateNewWallet();
console.log('Generated wallet:', {
  address: wallet.address,
  privateKeyLength: wallet.privateKey.length
});

// Test address validation
const testAddresses = [
  '0x1234567890123456789012345678901234567890',
  '0xinvalid',
  'not-an-address',
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
];

testAddresses.forEach(addr => {
  console.log(`Address "${addr}" is valid: ${WalletService.isValidEthereumAddress(addr)}`);
});

console.log('Test completed successfully!');