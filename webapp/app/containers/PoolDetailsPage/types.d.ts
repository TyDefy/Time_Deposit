import { ActionType } from 'typesafe-actions';
import * as actions from './actions';
import { ApplicationRootState } from 'types';

/* --- STATE --- */
interface PoolDetailsPageState {
  readonly default: any;
}

interface UtilityState {
  [index: string]: Utility;
 
}

interface Utility {
  withdrawAddress: string;
  cycleLength: number;
  withdrawName: string;
  penaltyAddress: string;
  penaltyName: string;
  penaltyRate: number;
}


/* --- ACTIONS --- */
type PoolDetailsPageActions = ActionType<typeof actions>;

/* --- EXPORTS --- */

type RootState = ApplicationRootState;
type ContainerState = PoolDetailsPageState;
type ContainerActions = PoolDetailsPageActions;

export { RootState, ContainerState, ContainerActions, UtilityState };
