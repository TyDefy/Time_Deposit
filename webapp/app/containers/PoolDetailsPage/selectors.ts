import { createStructuredSelector, createSelector } from 'reselect';
import { RootState } from 'containers/App/types';
import { StateProps, OwnProps } from '.';
import { selectPools } from 'containers/HomePage/selectors';
import { selectDaiBalance } from 'containers/App/selectors';

const selectSelectedPoolAddress = (state: RootState, props: OwnProps) => {
  return props.match.params.poolAddress
};

const selectPool = createSelector(
  selectPools, 
  selectSelectedPoolAddress, 
  (allPools, selectedPool) => allPools.filter(p => p.address === selectedPool)[0])

const selectPoolDetailsPage = createStructuredSelector<RootState, OwnProps, StateProps>({
  pool: selectPool,
  daiBalance: selectDaiBalance,
});

export default selectPoolDetailsPage;
