
import { createStructuredSelector, createSelector } from 'reselect';
import { RootState } from './types';
import { StateProps } from 'containers/App';
import { ApplicationRootState } from 'types';



const selectApp = createStructuredSelector<RootState, StateProps>({
  isMetamaskInstalled: createSelector((state: ApplicationRootState) => state.app.isMetamaskInstalled, (substate) => substate),
  isLoggedIn: createSelector((state: ApplicationRootState) => state.app.ethAddress, ethAddress => (ethAddress) ? true : false),
  ethAddress: createSelector((state: ApplicationRootState) => state.app.ethAddress, substate => substate),
  authorizedNetwork: createSelector((state: ApplicationRootState) => state.app.approvedNetwork, substate => substate),
  isAdmin: createSelector((state: ApplicationRootState) => state.app.isAdmin, substate => substate),
  daiBalance: createSelector((state: ApplicationRootState) => state.app.daiBalance, substate => substate),
});

export default selectApp;
