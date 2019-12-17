import { BlockchainContext } from "blockchainContext";
import { getContext, call, put, spawn, take, takeEvery } from "redux-saga/effects";
import { Log } from "ethers/providers";
import { poolDeployed, createPool } from "./actions";
import { eventChannel } from "redux-saga";
import { getType } from "typesafe-actions";
import { Contract } from "ethers";
import PoolContractAbi from '../../../../blockchain/build/abis/BasicPool-abi.json';
import { BasicPool as Pool } from '../../../../blockchain/contractInterfaces/BasicPool';

function* poolWatcherSaga(action) {
  const { provider, signer }: BlockchainContext = yield getContext('blockchain');

  const poolContract: Pool = new Contract(action.payload.address, PoolContractAbi, signer || provider) 
  console.log(`starting watcher for pool ${action.payload.address}`);

  // Get all past transactions (deposits/withdrawls) as well as interest rate

  // Dispatch an action

  // Set up listeners for transactions for pool

  // Dispatch 
}

export default function* poolSaga() {
  yield takeEvery(getType(poolDeployed), poolWatcherSaga)
}