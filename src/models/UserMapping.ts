export interface UserMapping {
  id?: string;
  userPublicAddress: string;
  depositAddress: string;
  privateKey: string;
  created?: string;
  updated?: string;
}

export interface CreateUserMappingRequest {
  userPublicAddress: string;
}