import { createSelector, createStructuredSelector } from 'reselect';
import { RootState } from './types';
import { StateProps } from '.';
import { selectEthAddress } from 'containers/App/selectors';

/**
 * Direct selector to the homePage state domain
 */

export const selectPools = createSelector((state: RootState) => state.pools, selectEthAddress, (pools, ethAddress) => 
  Object.values(pools).map(p => {
    return {
    ...p,
    balance: p.transactions?.reduce((poolBalance, t) => 
      t.type === 'Deposit' ? poolBalance += t.amount : poolBalance -= t.amount, 0) || 0,
    participants: new Set(p.transactions?.map(t => t.userAddress)).size,
    contribution: ethAddress ? 
      p.transactions?.filter(t => t.userAddress === ethAddress)
      .reduce((contribution, t) => t.type === 'Deposit' ? contribution += t.amount : contribution -= t.amount, 0) : 0,
  }})
); 
const selectPoolsBalance = createSelector(selectPools, allPools => allPools.reduce((totalBalance, pool) => totalBalance += pool.balance, 0))


const selectHomePage = createStructuredSelector<RootState, StateProps>({
  pools: selectPools,
  poolsBalance: selectPoolsBalance,
});


export default selectHomePage;
