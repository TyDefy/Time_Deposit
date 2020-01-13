/*
 *
 * MyProjectsContainer reducer
 *
 */

import { ContainerActions } from './types';
import { getType } from 'typesafe-actions';
import { Utility } from '.';
import { utilityDeployed } from './actions';

export interface UtilityState {
  [index: string]: Utility;
}

export const initialState: UtilityState = {

};

function utilitiesReducer(state: UtilityState = initialState, action: ContainerActions) {
  switch (action.type) {
    case getType(utilityDeployed): {
      return {
        ...state,
        [action.payload.withdrawAddress]: {
          ...action.payload,
        }
      }
    }

    default:
      return state;
  }
}

export default utilitiesReducer;
