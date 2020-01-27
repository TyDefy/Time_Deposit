
import { createStructuredSelector, createSelector } from 'reselect';
import { RootState } from './types';
import { StateProps } from 'containers/App';
import { ApplicationRootState } from 'types';

export const selectEthAddress = createSelector((state: ApplicationRootState) => state.app.ethAddress, substate => substate);
export const selectDaiBalance = createSelector((state: ApplicationRootState) => state.app.daiBalance, substate => substate);
export const selectIsAdmin = createSelector((state: ApplicationRootState) => state.app.isAdmin, substate => substate);
export const selectExchangeRate = createSelector((state: ApplicationRootState) => state.app.exchangeRate, substate => substate);
export const selectInterestRate = createSelector((state: ApplicationRootState) => state.app.interestRate, substate => substate);

export const selectLatestPoolTxTime = (poolAddress: string) => createSelector((state: ApplicationRootState) => 
  state.pools, pools => pools[poolAddress].transactions.map(t => t.time).reduce((a, b) => a > b ? a : b, new Date('01/01/1970')));

const selectApp = createStructuredSelector<RootState, StateProps>({
  isMetamaskInstalled: createSelector((state: ApplicationRootState) => state.app.isMetamaskInstalled, substate => substate),
  ethAddress: selectEthAddress,
  authorizedNetwork: createSelector((state: ApplicationRootState) => state.app.approvedNetwork, substate => substate),
  isAdmin: selectIsAdmin,
  daiBalance: selectDaiBalance,
  approvedNetworkName: createSelector((state: ApplicationRootState) => state.app.approvedNetworkName, substate => substate),
  exchangeRate: selectExchangeRate,
  interestRate: selectInterestRate,
});

export default selectApp;
