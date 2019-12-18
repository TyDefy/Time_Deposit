import { createStructuredSelector, createSelector } from 'reselect';
import { RootState } from 'containers/App/types';
import { StateProps, OwnProps } from '.';
import { selectPools } from 'containers/HomePage/selectors';
import { selectDaiBalance } from 'containers/App/selectors';

const selectSelectedPoolAddress = (state, props: OwnProps) => {
  debugger;  
  return props.match.params.poolAddress
};

const selectPool = createSelector(
  selectPools, 
  selectSelectedPoolAddress, 
  (allPools, selectedPool) => {
    const pools = allPools.filter(p => p.address === selectedPool);
    debugger;
    return pools[0]})

const selectPoolDetailsPage = createStructuredSelector<RootState, OwnProps, StateProps>({
  pool: selectPool,
  daiBalance: selectDaiBalance,
});

export default selectPoolDetailsPage;
