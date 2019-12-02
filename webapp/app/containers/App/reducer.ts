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
};

function appReducer(state: ContainerState = initialState, action: ContainerActions ) {
  switch (action.type) {
    case getType(AppActions.setWeb3): {
      return {
        ...state,
        isMetamaskInstalled: action.payload,  
      }
    }
    case getType(AppActions.connectMetamask.success): {
      return {
        ...state,
        ethAddress: action.payload,
      }
    }
    default:
      return state;
  }
}

export default appReducer;
