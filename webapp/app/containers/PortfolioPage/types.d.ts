import { ActionType } from 'typesafe-actions';
import * as actions from './actions';
import { ApplicationRootState } from 'types';

/* --- STATE --- */
interface PortfolioPageState {
  readonly default: any;
}

/* --- ACTIONS --- */
type PortfolioPageActions = ActionType<typeof actions>;

/* --- EXPORTS --- */

type RootState = ApplicationRootState;
type ContainerState = PortfolioPageState;
type ContainerActions = PortfolioPageActions;

export { RootState, ContainerState, ContainerActions };
