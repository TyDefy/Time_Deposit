
import { createStructuredSelector, createSelector } from 'reselect';
import { RootState } from './types';
import { StateProps } from 'containers/App';
import { ApplicationRootState } from 'types';



const selectApp = createStructuredSelector<RootState, StateProps>({
  isMetamaskInstalled: createSelector((state: ApplicationRootState) => state.app.isMetamaskInstalled, (substate) => substate),
  ethAddress: createSelector((state: ApplicationRootState) => state.app.ethAddress, substate => substate),
});

export default selectApp;
