import { createAsyncAction, createStandardAction } from "typesafe-actions";

export const connectMetamask = createAsyncAction(
    'REQUEST/CONNECT_METAMASK',
    'SUCCESS/CONNECT_METAMASK',
    'FAILURE/CONNECT_METAMASK')
    <undefined, 
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

export const saveStorageValue = createStandardAction('SAVE_STORAGE_VALUE')<number>();
export const setNewStorageValue = createAsyncAction(
  '@TX_REQUEST/UPDATE_CONTRACT_VALUE',
  '@TX_SUCCESS/UPDATE_CONTRACT_VALUE',
  '@TX_FAILURE/UPDATE_CONTRACT_VALUE')<number,undefined,string>();

export const setDaiBalance = createStandardAction('SET_DAI_BALANCE')<number>();
export const setIsAdmin = createStandardAction('SET_IS_ADMIN')<boolean>();
export const poolDeployed = createStandardAction('POOL_DEPLOYED')<{pool: string, withdraw: string}>();