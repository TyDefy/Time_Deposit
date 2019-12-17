import { createSelector, createStructuredSelector } from 'reselect';
import { ApplicationRootState } from 'types';
import { RootState } from './types';
import { StateProps } from '.';

/**
 * Direct selector to the homePage state domain
 */

const selectPools = createSelector((state: ApplicationRootState) => state.pools, (substate) => Object.values(substate)); 
const selectPoolsBalance = createSelector(selectPools, allPools => allPools.reduce((totalBalance, pool) => totalBalance += pool.balance, 0))


const selectHomePage = createStructuredSelector<RootState, StateProps>({
  pools: selectPools,
  poolsBalance: selectPoolsBalance,
});


export default selectHomePage;
