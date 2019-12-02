import { BaseProvider } from "ethers/providers";
import { getDefaultProvider, Signer, ethers, Contract } from "ethers";
import { getNetwork } from "ethers/utils";
import SimpleStorageContractAbi from '../../blockchain/build/abis/SimpleStorage-abi.json';

export interface BlockchainContext {
  isWeb3Enabled: boolean
  isAppAuthorised: boolean;
  provider: BaseProvider;
  signer?: Signer;
  simpleStorageContract: Contract;
  ethAddress?: string;
  enableEthereum();
}

export class blockchainContext implements BlockchainContext {
  isAppAuthorised: boolean = false;
  isWeb3Enabled: boolean = false;
  provider: BaseProvider;
  signer?: Signer;
  ethAddress?: string;
  simpleStorageContract: Contract;

  constructor() {
    const network = getNetwork(parseInt(`${process.env.CHAIN_ID}`));
    this.provider = network.name === 'unknown' ?
      new ethers.providers.JsonRpcProvider('http://localhost:8545/') :
      getDefaultProvider(network);

    this.simpleStorageContract = new Contract(`${process.env.SIMPLE_STORAGE_CONTRACT_ADDRESS}`,
      SimpleStorageContractAbi,
      this.provider)

    this.enableEthereum = this.enableEthereum.bind(this);
    const { ethereum } = window as any;
    if (ethereum) {
      this.isWeb3Enabled = true;
    }
  }

  async enableEthereum(): Promise<BlockchainContext> {
    if (!this.isWeb3Enabled) {
      throw Error('The browser you are using is not web3 enabled. Functionality will be limited.')
    }

    const { ethereum } = window as any;

    try {
      const accounts = await ethereum.send('eth_requestAccounts')
      this.ethAddress = accounts.result[0];
    } catch (error) {
      if (error.code === 4001) {
        throw Error('Please allow connection to MetaMask.');
      } else {
        throw Error(error);
      }
    }
    this.isAppAuthorised = true;
    const web3Provider = new ethers.providers.Web3Provider(ethereum);
    this.signer = web3Provider.getSigner();
    const writeableSimpleStorageContract = this.simpleStorageContract.connect(this.signer);
    this.simpleStorageContract = writeableSimpleStorageContract;
    return this;
  }
}

