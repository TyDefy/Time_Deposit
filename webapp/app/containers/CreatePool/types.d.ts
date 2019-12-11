import { ActionType } from 'typesafe-actions';
import * as actions from './actions';
import { ApplicationRootState } from 'types';

/* --- STATE --- */
interface CreatePoolState {
  readonly default: any;
}

/* --- ACTIONS --- */
type CreatePoolActions = ActionType<typeof actions>;

/* --- EXPORTS --- */

type RootState = ApplicationRootState;
type ContainerState = CreatePoolState;
type ContainerActions = CreatePoolActions;

export { RootState, ContainerState, ContainerActions };
