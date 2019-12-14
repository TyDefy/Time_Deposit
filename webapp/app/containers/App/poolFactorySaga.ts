import { BlockchainContext } from "blockchainContext";
import { getContext, call, put, spawn, take } from "redux-saga/effects";
import { Log } from "ethers/providers";
import { poolDeployed, createPool } from "./actions";
import { eventChannel } from "redux-saga";
import { getType } from "typesafe-actions";

function* deployedPoolWatcher() {
  const {poolFactoryContract}: BlockchainContext = yield getContext('blockchain');

  const poolDeployedChannel = eventChannel(emit => {
    const poolDeployedHandler = (pool, withdraw) => emit({pool: pool, withdraw: withdraw} );
    poolFactoryContract.on(poolFactoryContract.filters.DeployedPool(), poolDeployedHandler);
    return () => {
      poolFactoryContract.off('accountsChanged', poolDeployedHandler);
    };
  });

  while (true) {
    const newPool: {pool: string, withdraw: string} = yield take(poolDeployedChannel);
    yield put(poolDeployed(newPool));
  }
}

function* createPoolSaga(action) {
  const {poolFactoryContract}: BlockchainContext = yield getContext('blockchain');
  yield call([poolFactoryContract, poolFactoryContract.deployBasicPool], '0x', 'test', 'test')
}

export default function* poolFactorySaga() {
  const { poolFactoryContract, provider }: BlockchainContext = yield getContext('blockchain')

  const deployedPoolEventFilter = {
    ...poolFactoryContract.filters.DeployedPool(null, null),
    fromBlock: 0,
    toBlock: 'latest',
  }

  try {
    const deployedPoolLogs: Log[] = yield call([provider, provider.getLogs],deployedPoolEventFilter);
    const parsedLogs = deployedPoolLogs.map(log => poolFactoryContract.interface.parseLog(log).values as {pool: string, withdraw: string});
    for (const log of parsedLogs) {
      yield put(poolDeployed(log));
    };
  } catch (error) {
    console.log('error');
  }

  yield spawn(deployedPoolWatcher);
  yield takeEvery(getType(createPool.request), createPoolSaga)
}