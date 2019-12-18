/*
 *
 * MyProjectsContainer reducer
 *
 */

import { ContainerActions } from './types';
import * as AppActions from './actions';
import { getType } from 'typesafe-actions';
import { Pool } from '.';

export interface PoolState {
  [index: string]: Pool;
}

export const initialState: PoolState = {

};

function poolsReducer(state: PoolState = initialState, action: ContainerActions) {
  switch (action.type) {
    case getType(AppActions.poolDeployed): {
      return {
        ...state,
        [action.payload.address]: {
          ...action.payload,
        }
      }
    }
    default:
      return state;
  }
}

export default poolsReducer;