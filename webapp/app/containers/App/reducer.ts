/*
 *
 * MyProjectsContainer reducer
 *
 */

import { ContainerState, ContainerActions } from './types';
import * as AppActions from './actions';
import { getType } from 'typesafe-actions';

export const initialState: ContainerState = {
  ethAddress: '',
  isMetamaskInstalled: false,
  storageValue: undefined,
  approvedChainId: 0,
  approvedNetworkName: '',
  approvedNetwork: false,
  networkName: '',
  chainId: 0,
};

function appReducer(state: ContainerState = initialState, action: ContainerActions ) {
  switch (action.type) {
    case getType(AppActions.setWeb3): {
      return {
        ...state,
        ...action.payload,
      }
    }
    case getType(AppActions.connectMetamask.success): {
      return {
        ...state,
        ...action.payload,
      }
    }
    case getType(AppActions.saveStorageValue): {
      return {
        ...state,
        storageValue: action.payload,
      }
    }
    default:
      return state;
  }
}

export default appReducer;
