import { createSelector, createStructuredSelector } from 'reselect';
import { ApplicationRootState } from 'types';
import { RootState } from 'containers/App/types';
import { StateProps } from '.';

/**
 * Direct selector to the transactionModal state domain
 */

const selectTransactionModal = createStructuredSelector<RootState, StateProps>({
  open: createSelector((state: ApplicationRootState) => state.transactionModal.open, (substate) => substate),
});

export default selectTransactionModal;