/*
 *
 * MyProjectsContainer reducer
 *
 */

import { ContainerState, ContainerActions } from './types';
import * as poolDetailsActions from './actions';
import { getType } from 'typesafe-actions';

export const initialState: ContainerState = {
  showModal: false,
};

function poolDetailsReducer(state: ContainerState = initialState, action: ContainerActions ) {
  switch (action.type) {
    case getType(poolDetailsActions.setShowModal): {
      return {
        ...state,
        showModal: action.payload.showModal,
      }
    }
    default:
      return state;
  }
}

export default poolDetailsReducer;
