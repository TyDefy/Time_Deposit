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
          type: 'cDAI', // TODO: Get this from the action payload
          transactions: [],
        }
      }
    }
    case getType(AppActions.setPoolInterestRate): {
      return {
        ...state,
        [action.payload.poolAddress]: {
          ...state[action.payload.poolAddress],
          interestRate: action.payload.interestRate,
        }
      }
    }
    case getType(AppActions.setUserInfo): {
      return {
        ...state,
        [action.payload.poolAddress]: {
          ...state[action.payload.poolAddress],
          userLastDepositDate: action.payload.lastDepositDate,
          userLastWithdrawDate: action.payload.lastWithdrawDate,
        }
      }
    }
    case getType(AppActions.setPoolPenaltyPotBalance): {
      return {
        ...state,
        [action.payload.poolAddress]: {
          ...state[action.payload.poolAddress],
          penaltyPotBalance: action.payload.penaltyPotBalance
        }
      }
    }
    case getType(AppActions.setPoolInterestAccrued): {
      return {
        ...state,
        [action.payload.poolAddress]: {
          ...state[action.payload.poolAddress],
          interestAccrued: action.payload.interestAccrued,
        }
      }
    }
    case getType(AppActions.setUserTotalBalanceAmount): {
      return {
        ...state,
        [action.payload.poolAddress]: {
          ...state[action.payload.poolAddress],
          userTotalBalanceAndPenaltiesCDai: action.payload.totalBalance,
        }
      }
    }
    case getType(AppActions.addPoolTx): {
      return {
        ...state,
        [action.payload.poolAddress]: {
          ...state[action.payload.poolAddress],
          transactions: [
            ...state[action.payload.poolAddress]?.transactions,
            action.payload,
          ],
        }
      }
    }
    case getType(AppActions.terminatePool.success): {
      return {
        ...state,
        [action.payload.poolAddress]: {
          ...state[action.payload.poolAddress],
          active: false,
        }
      }
    }
    default:
      return state;
  }
}

export default poolsReducer;
