import { ActionType } from 'typesafe-actions';
import * as actions from './actions';
import { ApplicationRootState } from 'types';

/* --- STATE --- */
interface AdminPoolDetailsPageState {
}

/* --- ACTIONS --- */
type AdminPoolDetailsPageActions = ActionType<typeof actions>;

/* --- EXPORTS --- */

type RootState = ApplicationRootState;
type ContainerState = AdminPoolDetailsPageState;
type ContainerActions = AdminPoolDetailsPageActions;

export { RootState, ContainerState, ContainerActions };
