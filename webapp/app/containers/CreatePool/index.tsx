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
import selectCreatePool from './selectors';
import saga from './saga';
import * as Yup from 'yup';
import PoolDetailsForm from 'components/PoolDetailsForm';
import { Utility } from 'containers/App';
import { createPool } from 'containers/App/actions';

interface OwnProps { }

interface DispatchProps {
  createPool({
    name,
    description,
    type,
    utilityAddress,
    cycleLength,
    withdrawName,
    penaltyAddress,
    penaltyName,
    penaltyRate,
    feeRate,
    canWithdrawInViolation,
    canWithdrawInterestInViolation
  }): void
}

export interface StateProps {
  utilities: Array<Utility>;
}

type Props = StateProps & DispatchProps & OwnProps;

const CreatePool: React.FunctionComponent<Props> = ({ utilities, createPool }: Props) => {
  const CreatePoolSchema = Yup.object().shape({
    name: Yup.string().max(24, 'Name is too long').required('Name is required'),
    description: Yup.string().max(180, 'Description is too long').required('Description is required'),
    type: Yup.number().required(),
    feeRate: Yup.number().min(0).max(100).required(),
    penaltyRate: Yup.number().min(0).max(100).required(),
  });
  const poolTypes = [{ value: 0, label: 'cDAI' }]

  return (
    <Formik
      initialValues={{
        name: '',
        description: '',
        type: 0,
        utilityAddress: 'new',
        cycleLength: 0,
        withdrawName: 'new',
        penaltyAddress: 'new',
        penaltyName: 'new',
        penaltyRate: 0,
        feeRate: 0,
        canWithdrawInViolation: false,
        canWithdrawInterestInViolation: false,
      }}
      validationSchema={CreatePoolSchema}
      onSubmit={(values, actions) => {
        createPool(values)
      }}
      render={({values}) =>
        <PoolDetailsForm
          utilities={[{
            withdrawAddress: 'new',
            cycleLength: 0,
            withdrawName: 'new',
            penaltyAddress: 'new',
            penaltyRate: 0,
            penaltyName: 'new',
            canWithdrawInViolation: true,
            canWithdrawInterestInViolation: true,
          },
          ...utilities]}
          poolTypes={poolTypes}
          values={values}
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
    createPool: (poolDetails) => dispatch(createPool.request(poolDetails)),
  };
};

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);


// <OwnProps> restricts access to the HOC's other props. This component must not do anything with saga hoc
const withSaga = injectSaga<OwnProps>({ key: 'createPool', saga: saga });

export default compose(
  withSaga,
  withConnect,
)(CreatePool);
