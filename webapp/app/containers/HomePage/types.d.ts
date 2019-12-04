import { ActionType } from 'typesafe-actions';
import * as actions from './actions';
import { ApplicationRootState } from 'types';

/* --- STATE --- */
interface HomePageState {
  readonly default: any;
}

/* --- ACTIONS --- */
type HomePageActions = ActionType<typeof actions>;

/* --- EXPORTS --- */

type RootState = ApplicationRootState;
type ContainerState = HomePageState;
type ContainerActions = HomePageActions;

export { RootState, ContainerState, ContainerActions };
