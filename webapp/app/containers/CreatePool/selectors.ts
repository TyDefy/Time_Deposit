import { createStructuredSelector, createSelector } from 'reselect';
import { RootState } from 'containers/App/types';
import { StateProps } from '.';

const selectCreatePool = createStructuredSelector<RootState, StateProps>({
  utilities: createSelector((state: RootState) => state.utilities, substate => 
    Object.values(substate)
  ),
});

export default selectCreatePool;
