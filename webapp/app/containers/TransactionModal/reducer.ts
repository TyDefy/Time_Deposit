/*
 *
 * TransactionModal reducer
 *
 */

import { ContainerState, ContainerActions } from './types';
import { setModalOpen } from './actions';
import { getType } from 'typesafe-actions';

export const initialState: ContainerState = {
  open: false,
};

function transactionModalReducer(state: ContainerState = initialState, action: ContainerActions ) {
  switch (action.type) {
    case getType(setModalOpen):
      return {
        ...state,
        open: action.payload,
      };
    default:
      return state;
  }
}

export default transactionModalReducer;
