import { createSelector, createStructuredSelector } from 'reselect';
import { ApplicationRootState } from 'types';
import { RootState } from './types';
import { StateProps } from '.';

/**
 * Direct selector to the homePage state domain
 */

const selectHomePage = createStructuredSelector<RootState, StateProps>({
  isMetamaskInstalled: createSelector((state: ApplicationRootState) => state.app.isMetamaskInstalled, (substate) => substate),
  ethAddress: createSelector((state: ApplicationRootState) => state.app.ethAddress, substate => substate),
  approvedNetwork: createSelector((state:ApplicationRootState) => state.app.approvedNetwork, substate => substate),
  approvedChainId: createSelector((state:ApplicationRootState) => state.app.approvedChainId, substate => substate),
  approvedNetworkName: createSelector((state:ApplicationRootState) => state.app.approvedNetworkName, substate => substate),
  chainId: createSelector((state:ApplicationRootState) => state.app.chainId, substate => substate),
  networkName: createSelector((state:ApplicationRootState) => state.app.networkName, substate => substate),
  isAdmin: createSelector((state: ApplicationRootState) => state.app.isAdmin, substate => substate),
  daiBalance: createSelector((state: ApplicationRootState) => state.app.daiBalance, substate => substate),
});


export default selectHomePage;
