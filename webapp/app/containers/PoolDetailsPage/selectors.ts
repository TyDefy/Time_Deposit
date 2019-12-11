import { createStructuredSelector } from 'reselect';
import { RootState } from 'containers/App/types';
import { StateProps } from '.';

const selectPoolDetailsPage = createStructuredSelector<RootState, StateProps>(
  {},
);

export default selectPoolDetailsPage;
