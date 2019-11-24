
import { createStructuredSelector } from 'reselect';
import { RootState } from './types';
import { StateProps } from 'containers/App';

const selectApp = createStructuredSelector<RootState, StateProps>({

});

export default selectApp;
