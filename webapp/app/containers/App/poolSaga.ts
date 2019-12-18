import { BlockchainContext } from "blockchainContext";
import { getContext, takeEvery, call, put, fork, take } from "redux-saga/effects";
// import { Log } from "ethers/providers";
import { poolDeployed, addPoolTx } from "./actions";
// import { eventChannel } from "redux-saga";
import { getType } from "typesafe-actions";
import { Contract } from "ethers";
import PoolContractAbi from '../../../../blockchain/build/abis/BasicPool-abi.json';
import { BasicPool as Pool } from '../../../../blockchain/contractInterfaces/BasicPool';
import { Log } from "ethers/providers";
import { formatEther } from "ethers/utils";
import { eventChannel } from "redux-saga";

function* poolTransactionListener(poolContract: Pool) {
  const { provider }: BlockchainContext = yield getContext('blockchain');

  const poolTransactionChannel = eventChannel(emit => {
    const depositHandler = (eventArgs) => emit({
      type: 'Deposit',
      ...eventArgs,
    });
    const withdrawHandler = (eventArgs) => emit({
      type: 'Withdraw',
      ...eventArgs,
    });
    poolContract.on(poolContract.filters.Deposit(null, null, null), depositHandler);
    poolContract.on(poolContract.filters.Withdraw(null, null, null), withdrawHandler);
    return () => {
      poolContract.off(poolContract.filters.Deposit(null, null, null), depositHandler);
      poolContract.off(poolContract.filters.Withdraw(null, null, null), withdrawHandler);
    };
  });

  while (true) {
    const newTx = yield take(poolTransactionChannel);
    const txDate = yield call([provider, provider.getBlock], newTx.blockNumber);
    (newTx.type === 'Deposit') ?
      yield put(addPoolTx({
        poolAddress: poolContract.address,
        userAddress: newTx.user,
        type: 'Deposit',
        txHash: newTx.transactionHash || '0x',
        time: new Date(txDate.timestamp * 1000),
        amount: Number(formatEther(newTx.amountInCollateral)),
      })) :
      yield put(addPoolTx({
        poolAddress: poolContract.address,
        userAddress: newTx.user,
        type: 'Withdraw',
        txHash: newTx.transactionHash || '0x',
        time: new Date(txDate.timestamp * 1000),
        amount: Number(formatEther(newTx.amount.add(newTx.penalty)))
      }))
  }
}

function* poolWatcherSaga(action) {
  const { provider, signer }: BlockchainContext = yield getContext('blockchain');

  const poolContract: Pool = new Contract(action.payload.address, PoolContractAbi, signer || provider)

  // TODO: Get current pool interest rate
  // Get all past transactions (deposits/withdrawls)
  try {
    const depositLogs: Log[] = yield call([provider, provider.getLogs], {
      ...poolContract.filters.Deposit(null, null, null),
      fromBlock: 0,
      toBlock: 'latest',
    })

    const depositTxActions = yield depositLogs.map(
      async log => {
        const parsedDeposit = poolContract.interface.parseLog(log).values;

        return addPoolTx({
          poolAddress: poolContract.address,
          userAddress: parsedDeposit.user,
          type: 'Deposit',
          txHash: log.transactionHash || '0x',
          time: new Date((await provider.getBlock(log.blockNumber || 0)).timestamp * 1000),
          amount: Number(formatEther(parsedDeposit.amountInCollateral)),
        })
      });

    const withdrawLogs: Log[] = yield call([provider, provider.getLogs], {
      ...poolContract.filters.Withdraw(null, null, null),
      fromBlock: 0,
      toBlock: 'latest',
    })

    const withdrawTxActions = yield withdrawLogs.map(
      async log => {
        const parsedWithdraw = poolContract.interface.parseLog(log).values;

        return addPoolTx({
          poolAddress: poolContract.address,
          userAddress: parsedWithdraw.user,
          type: 'Withdraw',
          txHash: log.transactionHash || '0x',
          time: new Date((await provider.getBlock(log.blockNumber || 0)).timestamp * 1000),
          amount: Number(formatEther(parsedWithdraw.amount.add(parsedWithdraw.penalty)))
        })
      });

    const actions = depositTxActions.concat(withdrawTxActions).sort((a, b) => a.time - b.time);

    for (const action of actions) {
      yield put(action);
    }
  } catch (error) {
    console.log('There was an error getting the pools transaction logs');
  }

  yield fork(poolTransactionListener(poolContract));
}

export default function* poolSaga() {
  yield takeEvery(getType(poolDeployed), poolWatcherSaga)
}