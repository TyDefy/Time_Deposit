import { BaseProvider } from "ethers/providers";
import { getDefaultProvider, Signer, ethers, Contract } from "ethers";
import { getNetwork } from "ethers/utils";
import DaiContractAbi from '../../blockchain/build/abis/pDai-abi.json';
import PoolRegistryContractAbi from '../../blockchain/build/abis/BasicRegistry-abi.json';
import PoolFactoryContractAbi from '../../blockchain/build/abis/BasicFactory-abi.json';
import { pDai } from '../../blockchain/contractInterfaces/pDai';
import { BasicFactory as PoolFactory } from '../../blockchain/contractInterfaces/BasicFactory';
import { BasicRegistry as PoolRegistry } from '../../blockchain/contractInterfaces/BasicRegistry';

export interface BlockchainContext {
  isMetamaskInstalled: boolean
  isAppAuthorised: boolean;
  approvedNetwork: boolean;
  approvedNetworkName: string;
  approvedChainId: number;
  chainId?: number;
  networkName?: string;
  provider: BaseProvider;
  signer?: Signer;
  signerAddress?: string;
  daiContract: pDai;
  poolRegistryContract: PoolRegistry;
  poolFactoryContract: PoolFactory;
  ethAddress?: string;
  enableEthereum();
}

export class blockchainContext implements BlockchainContext {
  isMetamaskInstalled: boolean = false;
  isAppAuthorised: boolean = false;
  approvedNetwork: boolean = false;
  approvedNetworkName: string;
  approvedChainId: number;
  chainId?: number;
  networkName?: string;
  provider: BaseProvider;
  signer?: Signer;
  ethAddress?: string;
  daiContract: pDai;
  poolRegistryContract: PoolRegistry;
  poolFactoryContract: PoolFactory;

  constructor() {
    const network = getNetwork(parseInt(`${process.env.CHAIN_ID}`));
    this.provider = network.name === 'unknown' ?
      new ethers.providers.JsonRpcProvider('http://localhost:8545/') :
      getDefaultProvider(network);

    this.approvedNetworkName = network.name;
    this.approvedChainId = network.chainId;

    
    // Instantiate a read-only version of the main contracts
    this.daiContract = new Contract(`${process.env.DAI_ADDRESS}`,
      DaiContractAbi,
      this.provider);
    
    this.poolRegistryContract = new Contract(`${process.env.POOL_REGISTRY_ADDRESS}`,
      PoolRegistryContractAbi,
      this.provider);

    this.poolFactoryContract = new Contract(`${process.env.POOL_FACTORY_ADDRESS}`,
      PoolFactoryContractAbi,
      this.provider);
    
    this.enableEthereum = this.enableEthereum.bind(this);
    const { ethereum } = window as any;
    if (ethereum && ethereum.isMetaMask) {
      this.isMetamaskInstalled = true;
    }
  }

  async enableEthereum(): Promise<BlockchainContext> {
    if (!this.isMetamaskInstalled) {
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
    const network = await web3Provider.getNetwork();
    this.chainId = network.chainId;
    this.networkName = network.name;
    this.approvedNetwork = (this.approvedChainId === this.chainId);
    this.signer = web3Provider.getSigner();

    if (this.approvedNetwork && this.signer) {
      // @ts-ignore
      const writeableDaiContract = this.daiContract.connect(this.signer);
      this.daiContract = writeableDaiContract;
      
      // @ts-ignore
      const writeablePoolRegistryContract = this.poolRegistryContract.connect(this.signer);
      this.poolRegistryContract = writeablePoolRegistryContract;

      // @ts-ignore
      const writeablePoolFactoryContract = this.poolFactoryContract.connect(this.signer);
      this.poolFactoryContract = writeablePoolFactoryContract;
    }

    return this;
  }
}

