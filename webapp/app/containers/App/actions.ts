import { createAsyncAction, createStandardAction } from "typesafe-actions";

export const connectMetamask = createAsyncAction(
    'CONNECT_METAMASK_REQUEST',
    'CONNECT_METAMASK_SUCCESS',
    'CONNECT_METAMASK_FAILURE')
    <void, 
    { 
      ethAddress: string,
    }, 
    string>();

export const setWeb3 = createStandardAction('BLOCKCHAIN_READY')<boolean>();