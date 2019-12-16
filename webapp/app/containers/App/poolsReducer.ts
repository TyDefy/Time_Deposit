/*
 *
 * MyProjectsContainer reducer
 *
 */

import { ContainerActions } from './types';
import * as AppActions from './actions';
import { getType } from 'typesafe-actions';

export const initialState = {
  pools: {

  },
};

function poolsReducer(state = initialState, action: ContainerActions) {
  switch (action.type) {
    case getType(AppActions.poolDeployed): {
      return {
        ...state,
        pools: {
          ...state.pools,
          [action.payload.address]: {
            ...action.payload,
          } 
        }
      }
    }
    default:
      return state;
  }
}

export default poolsReducer;
