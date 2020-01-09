/**
 *
 * CreatePool
 *
 */

import React from 'react';
import { connect } from 'react-redux';
import { compose, Dispatch } from 'redux';
import { Formik } from 'formik';

import injectSaga from 'utils/injectSaga';
import injectReducer from 'utils/injectReducer';
import selectCreatePool from './selectors';
import reducer from './reducer';
import saga from './saga';
import * as Yup from 'yup';
import PoolDetailsForm from 'components/PoolDetailsForm';
import { Utility } from 'containers/App';

interface OwnProps {}

interface DispatchProps {}

export interface StateProps {
  utilities: Array<Utility>;
}

type Props = StateProps & DispatchProps & OwnProps;


const CreatePool: React.FunctionComponent<Props> = ({utilities}: Props) => {
  const CreatePoolSchema = Yup.object().shape({
    name: Yup.string().max(120, 'Name is too long').required('Name is required'),
    description: Yup.string().max(180, 'Description is too long').required('Description is required'),
    type: Yup.number().required(),
    utilityAddress: Yup.string().required(),
    feeRate: Yup.number().min(0).max(100).required(),
    penaltyRate: Yup.number().min(0).max(100).required(),
  });
  const poolTypes = [{value: 0, label: 'cDAI'}]

  
  return (
    <Formik
      initialValues={{
        name: '',
        description: '',
        type: 0,
        utilityAddress: 'new',
        feeRate: 0,
        penaltyRate: 0,
      }}
      validationSchema={CreatePoolSchema}
      onSubmit={(values, actions) => {
        console.log(values)
      }}
      render={() =>
        <PoolDetailsForm 
          utilities={[{
            withdrawAddress: 'new',
            withdrawName: 'new',
            withdrawDescription: 'new',
            penaltyAddress: 'new',
            penaltyDescription: 'new',
            penaltyName: 'new',
          },
          ...utilities]}
          poolTypes={poolTypes}
        />
      }
    />
  );
};

const mapStateToProps = state => selectCreatePool(state);

const mapDispatchToProps = (
  dispatch: Dispatch,
  ownProps: OwnProps,
): DispatchProps => {
  return {
    dispatch: dispatch,
  };
};

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

// Remember to add the key to ./app/types/index.d.ts ApplicationRootState
// <OwnProps> restricts access to the HOC's other props. This component must not do anything with reducer hoc
const withReducer = injectReducer<OwnProps>({
  key: 'createPool',
  reducer: reducer,
});
// <OwnProps> restricts access to the HOC's other props. This component must not do anything with saga hoc
const withSaga = injectSaga<OwnProps>({ key: 'createPool', saga: saga });

export default compose(
  withReducer,
  withSaga,
  withConnect,
)(CreatePool);
