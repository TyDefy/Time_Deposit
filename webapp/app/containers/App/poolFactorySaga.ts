import { BlockchainContext } from "blockchainContext";
import { getContext, call, put, spawn, take, takeEvery } from "redux-saga/effects";
import { Log } from "ethers/providers";
import { poolDeployed, createPool } from "./actions";
import { eventChannel } from "redux-saga";
import { getType } from "typesafe-actions";

function* deployedPoolWatcher() {
  const { poolFactoryContract }: BlockchainContext = yield getContext('blockchain');

  const poolDeployedChannel = eventChannel(emit => {
    const poolDeployedHandler = (eventArgs) => emit({
      ...eventArgs,
    });

    poolFactoryContract.on(poolFactoryContract.filters.DeployedPool(null, null, null, null, null, null, null), poolDeployedHandler);
    return () => {
      poolFactoryContract.off('accountsChanged', poolDeployedHandler);
    };
  });

  while (true) {
    const newPool = yield take(poolDeployedChannel);
    console.log(newPool.cycleLength.toString());
    yield put(poolDeployed({
      address: newPool.pool,
      withdraw: newPool.withdraw,
      name: newPool.name,
      description: newPool.description,
      type: newPool.tokenSymbol,
      period: newPool.cycleLength.toNumber(),
    }));
  }
}

function* createPoolSaga(action) {
  const { poolFactoryContract }: BlockchainContext = yield getContext('blockchain');
  try {
    // TODO Figure out how to populate the withdraw address, what to do with the user's period, fee and other parameters
    yield call([poolFactoryContract, poolFactoryContract.deployBasicPool], '0xed266174978Cc3ec95Ae6C28F4e5Dd378B9036b9', 'test', 'test')
    yield put(createPool.success());
  } catch (error) {
    yield put(createPool.failure(error.message));
  }
}

export default function* poolFactorySaga() {
  const { poolFactoryContract, provider }: BlockchainContext = yield getContext('blockchain')

  const deployedPoolEventFilter = {
    ...poolFactoryContract.filters.DeployedPool(null, null, null, null, null, null, null),
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
          period: log.cycleLength.toNumber(),
        })
      );
    };
  } catch (error) {
    console.log('error');
  }

  yield spawn(deployedPoolWatcher);
  yield takeEvery(getType(createPool.request), createPoolSaga)
}