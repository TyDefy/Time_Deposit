import { createStructuredSelector } from 'reselect';
import { RootState } from 'containers/App/types';
import { StateProps } from '.';


/**
 * Default selector used by AdminPoolDetailsPage
 */

const selectAdminPoolDetailsPage = createStructuredSelector<RootState, StateProps>({

});

export default selectAdminPoolDetailsPage;