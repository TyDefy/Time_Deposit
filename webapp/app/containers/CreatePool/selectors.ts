import { createStructuredSelector } from 'reselect';
import { RootState } from 'containers/App/types';
import { StateProps } from '.';

const selectCreatePool = createStructuredSelector<RootState, StateProps>({});

export default selectCreatePool;
