export interface Transaction {
  id?: string;
  userPublicAddress: string;
  depositAddress: string;
  transactionHash: string;
  amountIn: string; // USDC amount in
  amountOut: string; // pyUSD amount out
  timestamp: string;
  created?: string;
  updated?: string;
}

export interface CreateTransactionRequest {
  userPublicAddress: string;
  depositAddress: string;
  transactionHash: string;
  amountIn: string;
  amountOut: string;
  timestamp: string;
}