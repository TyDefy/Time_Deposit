import { createStructuredSelector, createSelector } from 'reselect';
import { RootState } from '../App/types';
import { StateProps, OwnProps } from '.';
import { selectPools } from '../HomePage/selectors';
import { selectSelectedPoolAddress } from '../PoolDetailsPage/selectors';

export const selectSelectedPoolUserAddress = (state: RootState, props: OwnProps) => {
  return props.match.params.userAddress
};

const selectAdminPoolUserDetails = createSelector(
  selectPools,
  selectSelectedPoolAddress,
  selectSelectedPoolUserAddress,
  (pools, poolAddress, poolUserAddress) => {
    const pool = pools.filter(p => p.address === poolAddress)[0];
    pool.transactions = pool.transactions?.filter(t => t.userAddress.toLowerCase() === poolUserAddress.toLowerCase())
      .sort((a, b) => (a.time < b.time) ? -1 : 1);
    return pool;
  }
)

const selectAdminPoolUserDetailsPage = createStructuredSelector<RootState, OwnProps, StateProps>({
  pool: selectAdminPoolUserDetails,
});

export default selectAdminPoolUserDetailsPage;