import { createAsyncAction } from "typesafe-actions";

export const connectMetamask = createAsyncAction(
    'CONNECT_METAMASK_REQUEST',
    'CONNECT_METAMASK_SUCCESS',
    'CONNECT_METAMASK_FAILURE')
    <void, 
    { 
      ethAddress: string, 
      networkId: number, 
      approvedNetwork: boolean, 
    }, 
    string>();