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
  approvedChainId: 0,
  approvedNetworkName: '',
  approvedNetwork: false,
  networkName: '',
  chainId: 0,
  isAdmin: false,
  daiBalance: 0,
  exchangeRate: 0,
  interestRate: 0
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
    case getType(AppActions.setIsAdmin): {
      return {
        ...state,
        isAdmin: action.payload,
      }
    }
    case getType(AppActions.setDaiBalance): {
      return {
        ...state,
        daiBalance: action.payload,
      }
    }
    case getType(AppActions.setCDaiRates.success): {
      return {
        ...state,
        interestRate: action.payload.interestRate,
        exchangeRate: action.payload.exchangeRate,
      }
    }
    default:
      return state;
  }
}

export default appReducer;
