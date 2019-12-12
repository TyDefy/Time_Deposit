import { ActionType } from 'typesafe-actions';
import * as actions from './actions';
import { ApplicationRootState } from 'types';

/* --- STATE --- */
interface AdminPoolsOverviewPageState {
  readonly default: any;
}

/* --- ACTIONS --- */
type AdminPoolsOverviewPageActions = ActionType<typeof actions>;

/* --- EXPORTS --- */

type RootState = ApplicationRootState;
type ContainerState = AdminPoolsOverviewPageState;
type ContainerActions = AdminPoolsOverviewPageActions;

export { RootState, ContainerState, ContainerActions };
