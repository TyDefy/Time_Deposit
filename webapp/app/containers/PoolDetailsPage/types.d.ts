import { ActionType } from 'typesafe-actions';
import * as actions from './actions';
import { ApplicationRootState } from 'types';

/* --- STATE --- */
interface PoolDetailsPageState {
  readonly default: any;
}

/* --- ACTIONS --- */
type PoolDetailsPageActions = ActionType<typeof actions>;

/* --- EXPORTS --- */

type RootState = ApplicationRootState;
type ContainerState = PoolDetailsPageState;
type ContainerActions = PoolDetailsPageActions;

export { RootState, ContainerState, ContainerActions };
