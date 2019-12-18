import { createStructuredSelector } from 'reselect';
import { RootState } from './types';
import { StateProps } from '.';
import { selectPools } from 'containers/HomePage/selectors';

const selectAdminPoolsOverview = createStructuredSelector<RootState, StateProps>({
  pools: selectPools,
});


export default selectAdminPoolsOverview;
