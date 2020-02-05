import { BlockchainContext } from "blockchainContext";
import { getContext, call, put, spawn, take, takeEvery } from "redux-saga/effects";
import { Log } from "ethers/providers";
import { poolDeployed, createPool, utilityDeployed } from "./actions";
import { eventChannel } from "redux-saga";
import { getType } from "typesafe-actions";
import { setTxContext, setTxHash } from "containers/TransactionModal/actions";
import { ContractTransaction, Contract } from "ethers";
import { BasicPool as Pool } from '../../../../blockchain/contractInterfaces/BasicPool';
import PoolContractAbi from '../../../../blockchain/build/abis/BasicPool-abi.json';

export function* deployedUtilityWatcher() {
  const { poolFactoryContract, provider }: BlockchainContext = yield getContext('blockchain');

  const deployedUtilitiesEventFilter = {
    ...poolFactoryContract.filters.DeployedUtilities(null, null, null, null, null, null, null, null),
    fromBlock: 0,
    toBlock: 'latest',
  }

  try {
    const deployedUtilityLogs: Log[] = yield call([provider, provider.getLogs], deployedUtilitiesEventFilter);
    const parsedLogs = deployedUtilityLogs.map(log =>
      poolFactoryContract.interface.parseLog(log).values);
    for (const log of parsedLogs) {
      yield put(
        utilityDeployed({
          withdrawAddress: log.withdraw,
          cycleLength: log._cycleLength,
          withdrawName: log._withdrawName,
          penaltyAddress: log.penalty,
          penaltyName: log._penaltyName,
          penaltyRate: log._penaltyRate,
          canWithdrawInViolation: log._canWithdrawInVoilation,
          canWithdrawInterestInViolation: log._canWithdrawInterestInViolation,
        })
      );
    };
  } catch (error) {
    console.log('error');
    console.log(error);
  }

  const utilityDeployedChannel = eventChannel(emit => {
    const utilityDeployedHandler = (
      withdraw,
      cycleLength,
      withdrawName,
      penalty,
      penaltyRate,
      penaltyName,
      canWithdrawInViolation,
      canWithdrawInterestInViolation
    ) => emit({
      withdraw,
      cycleLength,
      withdrawName,
      penalty,
      penaltyRate,
      penaltyName,
      canWithdrawInViolation,
      canWithdrawInterestInViolation
    })

    poolFactoryContract.on(poolFactoryContract.filters.DeployedUtilities(null, null, null, null, null, null, null, null),
      utilityDeployedHandler);
    return () => {
      poolFactoryContract.off(poolFactoryContract.filters.DeployedUtilities(null, null, null, null, null, null, null, null),
        utilityDeployedHandler);
    }
  })

  while (true) {
    const newUtility = yield take(utilityDeployedChannel);
    yield put(
      utilityDeployed({
        withdrawAddress: newUtility.withdraw,
        cycleLength: newUtility.cycleLength,
        withdrawName: newUtility.withdrawName,
        penaltyAddress: newUtility.penalty,
        penaltyName: newUtility.penaltyName,
        penaltyRate: newUtility.penaltyRate,
        canWithdrawInViolation: newUtility.canWithdrawInViolation,
        canWithdrawInterestInViolation: newUtility.canWithdrawInterestInViolation
      })
    )
  }
}

function* deployedPoolWatcher() {
  const { poolFactoryContract }: BlockchainContext = yield getContext('blockchain');

  const poolDeployedChannel = eventChannel(emit => {
    const poolDeployedHandler = (
      pool,
      withdraw,
      penaltyPercentage,
      name,
      description,
      period,
      tokenSymbol,
      canWithdrawInterestInViolation,
      canWithdrawInViolation,
    ) => {
      emit({
        pool,
        withdraw,
        penaltyPercentage,
        name,
        description,
        period,
        tokenSymbol,
        canWithdrawInterestInViolation,
        canWithdrawInViolation,
      })
    };

    poolFactoryContract.on(poolFactoryContract.filters.DeployedPool(null, null, null, null, null, null, null, null, null),
      poolDeployedHandler);
    return () => {
      poolFactoryContract.off(poolFactoryContract.filters.DeployedPool(null, null, null, null, null, null, null, null, null),
        poolDeployedHandler);
    };
  });

  while (true) {
    const newPool = yield take(poolDeployedChannel);
    yield put(poolDeployed({
      address: newPool.pool,
      withdraw: newPool.withdraw,
      name: newPool.name,
      description: newPool.description,
      type: newPool.tokenSymbol,
      period: newPool.period,
      active: true,
      penaltyRate: newPool.penaltyPercentage,
      canWithdrawInViolation: newPool.canWithdrawInViolation,
      canWithdrawInterestInViolation: newPool.canWithdrawInterestInViolation,
    }));
  }
}

function* createPoolSaga(action) {
  const { poolFactoryContract, signer, provider }: BlockchainContext = yield getContext('blockchain');
  try {
    let utilityAddress = action.payload.utilityAddress;
    if (utilityAddress === 'new') {
      yield put(setTxContext('Deploying utilities'));
      const deployUtilitiesTx: ContractTransaction = yield call(
        [poolFactoryContract, poolFactoryContract.deployUtility],
        action.payload.penaltyRate,
        action.payload.cycleLength,
        action.payload.canWithdrawInViolation,
        action.payload.canWithdrawInterestInViolation,
        action.payload.penaltyName,
        action.payload.withdrawName);

      yield put(setTxHash(deployUtilitiesTx.hash));
      yield call([deployUtilitiesTx, deployUtilitiesTx.wait]);
      const newUtilityAction = yield take(utilityDeployed);
      utilityAddress = newUtilityAction.payload.withdrawAddress;
    }
    yield put(setTxContext('Deploying pool'));
    const deployPoolTx: ContractTransaction = yield call(
      [poolFactoryContract, poolFactoryContract.deployBasicPool],
      utilityAddress,
      action.payload.name,
      action.payload.description);
    yield put(setTxHash(deployPoolTx.hash));
    yield call([deployPoolTx, deployPoolTx.wait]);
    const newPoolAction = yield take(poolDeployed);
    if (action.payload.feeRate !== 0) {
      //@ts-ignore
      const poolContract: Pool = new Contract(newPoolAction.payload.address, PoolContractAbi, signer || provider)
      yield put(setTxContext('Initialising pool'));
      const initTx: ContractTransaction = yield call([poolContract, poolContract.init], action.payload.feeRate);
      yield put(setTxHash(initTx.hash));
      yield call([initTx, initTx.wait]);
    }
    yield put(createPool.success());
  } catch (error) {
    yield put(createPool.failure(error.message));
  }
}

export default function* poolFactorySaga() {
  const { poolFactoryContract, provider }: BlockchainContext = yield getContext('blockchain')

  const deployedPoolEventFilter = {
    ...poolFactoryContract.filters.DeployedPool(null, null, null, null, null, null, null, null, null),
    fromBlock: 0,
    toBlock: 'latest',
  }

  try {
    const deployedPoolLogs: Log[] = yield call([provider, provider.getLogs], deployedPoolEventFilter);
    const parsedLogs = deployedPoolLogs.map(log =>
      poolFactoryContract.interface.parseLog(log).values);
    for (const log of parsedLogs) {
      yield put(
        poolDeployed({
          address: log.pool,
          withdraw: log.withdraw,
          name: log.name,
          description: log.description,
          type: log.tokenSymbol,
          period: log.cycleLength,
          penaltyRate: log.penaltyPercentage,
          active: true,
          canWithdrawInViolation: log.canWithdrawInViolation,
          canWithdrawInterestInViolation: log.canWithdrawInterestInViolation,
        })
      );
    };
  } catch (error) {
    console.log('error');
    console.log(error);
  }

  yield spawn(deployedPoolWatcher);
  // yield spawn(deployedUtilityWatcher);
  yield takeEvery(getType(createPool.request), createPoolSaga)
}