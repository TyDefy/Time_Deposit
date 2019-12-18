import { createStructuredSelector, createSelector } from 'reselect';
import { RootState } from 'containers/App/types';
import { StateProps, OwnProps } from '.';
import { selectPools } from 'containers/HomePage/selectors';
import { selectDaiBalance, selectEthAddress } from 'containers/App/selectors';

const selectSelectedPoolAddress = (state: RootState, props: OwnProps) => {
  return props.match.params.poolAddress
};

export const selectPool = createSelector(
  selectPools, 
  selectEthAddress,
  selectSelectedPoolAddress, 
  (allPools, ethAddress, selectedPool) => {
    const pool = allPools.filter(p => p.address === selectedPool)[0];
    pool.transactions = pool.transactions?.filter(t => t.address === ethAddress);
    return pool;
  })

const selectPoolDetailsPage = createStructuredSelector<RootState, OwnProps, StateProps>({
  pool: selectPool,
  daiBalance: selectDaiBalance,
});

export default selectPoolDetailsPage;
