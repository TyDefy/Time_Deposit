import { createAsyncAction, createStandardAction } from "typesafe-actions";

export const connectMetamask = createAsyncAction(
    'CONNECT_METAMASK_REQUEST',
    'CONNECT_METAMASK_SUCCESS',
    'CONNECT_METAMASK_FAILURE')
    <void, 
    { 
      approvedNetwork: boolean,
      ethAddress: string,
      networkName?: string,
      chainId: number
    }, 
    string>();

export const setWeb3 = createStandardAction('BLOCKCHAIN_READY')<{
  isMetamaskInstalled: boolean,
  approvedNetworkName: string,
  approvedChainId: number
}>();

export const setStorageValue = createStandardAction('SIMPLE_STORAGE_VALUE')<number>();