
import { createStructuredSelector, createSelector } from 'reselect';
import { RootState } from './types';
import { StateProps } from 'containers/App';
import { ApplicationRootState } from 'types';

export const selectEthAddress = createSelector((state: ApplicationRootState) => state.app.ethAddress, substate => substate);
export const selectDaiBalance = createSelector((state: ApplicationRootState) => state.app.daiBalance, substate => substate);

export const selectLatestPoolTxTime = (poolAddress: string) => createSelector((state: ApplicationRootState) => 
  state.pools, pools => pools[poolAddress].transactions.map(t => t.time).reduce((a, b) => a > b ? a : b));

const selectApp = createStructuredSelector<RootState, StateProps>({
  isMetamaskInstalled: createSelector((state: ApplicationRootState) => state.app.isMetamaskInstalled, substate => substate),
  ethAddress: selectEthAddress,
  authorizedNetwork: createSelector((state: ApplicationRootState) => state.app.approvedNetwork, substate => substate),
  isAdmin: createSelector((state: ApplicationRootState) => state.app.isAdmin, substate => substate),
  daiBalance: selectDaiBalance,
  approvedNetworkName: createSelector((state: ApplicationRootState) => state.app.approvedNetworkName, substate => substate),
});

export default selectApp;
