import { ActionType } from 'typesafe-actions';
import * as actions from './actions';
import { ApplicationRootState } from 'types';
import {Utility} from '../App'

/* --- STATE --- */
interface PoolDetailsPageState {
  readonly showModal: boolean;
}

interface UtilityState {
  [index: string]: Utility;
}


/* --- ACTIONS --- */
type PoolDetailsPageActions = ActionType<typeof actions>;

/* --- EXPORTS --- */

type RootState = ApplicationRootState;
type ContainerState = PoolDetailsPageState;
type ContainerActions = PoolDetailsPageActions;

export { RootState, ContainerState, ContainerActions, UtilityState };
