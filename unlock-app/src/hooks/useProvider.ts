import { useState } from 'react'
import { WalletService } from '@unlock-protocol/unlock-js'

export interface EthereumWindow extends Window {
  web3: any
  ethereum: any
}

/**
 * Initializes a provider passed
 * @param providerAdapter
 */
export const useProvider = (config: any) => {
  const [loading, setLoading] = useState(false)
  const [walletService, setWalletService] = useState<any>()
  const [network, setNetwork] = useState<string | undefined>(undefined)
  const [account, setAccount] = useState<string | undefined>(undefined)
  const [email, setEmail] = useState<string | undefined>(undefined)
  const [isUnlockAccount, setIsUnlockAccount] = useState<boolean>(false)
  const [encryptedPrivateKey, setEncryptedPrivateKey] = useState<
    any | undefined
  >(undefined)

  const connectProvider = async (provider: any, callback: any) => {
    setLoading(true)
    try {
      const _walletService = new WalletService(config.networks)

      // walletService wants an ethers provider!
      const _network = await _walletService.connect(provider)

      setNetwork(_network || undefined)

      const _account = await _walletService.getAccount()

      setWalletService(_walletService)
      setAccount(_account || undefined)
      setIsUnlockAccount(provider.isUnlock)
      setEmail(provider.emailAddress)
      setEmail(provider.emailAddress)
      setEncryptedPrivateKey(provider.passwordEncryptedPrivateKey)
      if (callback) {
        callback(_account)
      }
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  return {
    loading,
    network,
    account,
    email,
    isUnlockAccount,
    encryptedPrivateKey,
    walletService,
    connectProvider,
  }
}
