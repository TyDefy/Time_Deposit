import { BlockchainContext } from "blockchainContext";
import { getContext, takeEvery, call, put, fork, take, select } from "redux-saga/effects";
import { poolDeployed, addPoolTx, connectMetamask, deposit } from "./actions";
import { getType } from "typesafe-actions";
import { Contract, ContractTransaction } from "ethers";
import PoolContractAbi from '../../../../blockchain/build/abis/BasicPool-abi.json';
import { BasicPool as Pool } from '../../../../blockchain/contractInterfaces/BasicPool';
import { Log } from "ethers/providers";
import { formatEther, BigNumber } from "ethers/utils";
import { eventChannel } from "redux-saga";
import { selectLatestPoolTxTime } from "./selectors";
import { enqueueSnackbar } from "containers/Notification/actions";

function* poolDepositListener(poolContract: Pool) {
  while (true) {
    const { signer }: BlockchainContext = yield getContext('blockchain');

    if (signer) {
      //@ts-ignore
      const writeableContract = poolContract.connect(signer);
      const action = yield take(getType(deposit.request));
      if (action.payload.poolAddress === poolContract.address) {
        // TODO: Check allowance and increase if necessary
        const tx: ContractTransaction = yield call([poolContract, poolContract.deposit], action.payload.amount);
        yield call([tx, tx.wait])
      }
    } else {
      yield put(enqueueSnackbar({
        message: 'Please connect with metamask to continue',
        options: {
          variant: 'error'
        }
      }))
      yield take(getType(connectMetamask.success));
    }
  }
}

function* poolTransactionListener(poolContract: Pool) {
  const { provider }: BlockchainContext = yield getContext('blockchain');

  const poolTransactionChannel = eventChannel(emit => {
    const depositHandler = (address, daiAmount, cDaiAmount, tx) => {
      emit({
        type: 'Deposit',
        address,
        daiAmount,
        cDaiAmount,
        blockNumber: tx.blockNumber,
        transactionHash: tx.transactionHash,
      })
    };
    const withdrawHandler = (address, withdrawAmount, penaltyAmount, tx) => {
      emit({
        type: 'Withdraw',
        address,
        withdrawAmount,
        penaltyAmount,
        blockNumber: tx.blockNumber,
        transactionHash: tx.transactionHash,
      })
    };
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
    const latestTx = yield select(selectLatestPoolTxTime(poolContract.address));
    debugger;
    if (new Date(txDate.timestamp * 1000) > latestTx) {
      (newTx.type === 'Deposit') ?
        yield put(addPoolTx({
          poolAddress: poolContract.address,
          userAddress: newTx.address,
          type: 'Deposit',
          txHash: newTx.transactionHash || '0x',
          time: new Date(txDate.timestamp * 1000),
          amount: Number(formatEther(newTx.daiAmount)),
        })) :
        yield put(addPoolTx({
          poolAddress: poolContract.address,
          userAddress: newTx.address,
          type: 'Withdraw',
          txHash: newTx.transactionHash || '0x',
          time: new Date(txDate.timestamp * 1000),
          amount: Number(formatEther(newTx.amount.add(newTx.penalty)))
        }))
    } else {
      console.log('duplicate or old tx detected');
    }
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

    const depositTxActions = yield Promise.all(depositLogs.map(
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
      }));

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
    console.log(error);
  }

  yield fork(poolTransactionListener, poolContract);
  yield fork(poolDepositListener, poolContract);
}

export default function* poolSaga() {
  yield takeEvery(getType(poolDeployed), poolWatcherSaga)
}