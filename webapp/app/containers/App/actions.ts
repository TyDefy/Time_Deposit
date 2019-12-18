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

export const setDaiBalance = createStandardAction('SET_DAI_BALANCE')<number>();
export const setIsAdmin = createStandardAction('SET_IS_ADMIN')<boolean>();
export const poolDeployed = createStandardAction('POOL_DEPLOYED')<{
  address: string, 
  withdraw: string,
  name: string,
  description: string,
  type: string,
  period: number,
}>();

export const createPool = createAsyncAction(
  '@TX_REQUEST/CREATE_POOL',
  '@TX_SUCCESS/CREATE_POOL',
  '@TX_FAILURE/CREATE_POOL')<number,undefined,string>();