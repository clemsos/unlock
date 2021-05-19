import React, { useState, useContext, useReducer } from 'react'
import Head from 'next/head'
import styled from 'styled-components'
import { Web3Service } from '@unlock-protocol/unlock-js'
import { RoundedLogo } from '../Logo'

import { ConfigContext } from '../../../utils/withConfig'
import { Web3ServiceContext } from '../../../utils/withWeb3Service'
import CheckoutWrapper from './CheckoutWrapper'
import CheckoutContainer from './CheckoutContainer'
import { Locks } from './Locks'
import { CallToAction } from './CallToAction'
import Buttons from '../buttons/lock'
import Loading from '../Loading'
import WalletPicker from './WalletPicker'
import CheckoutMethod from './CheckoutMethod'
import CryptoCheckout from './CryptoCheckout'
import CardCheckout from './CardCheckout'
import CardConfirmationCheckout from './CardConfirmationCheckout'
import NewAccountCheckout from './NewAccountCheckout'
import { pageTitle } from '../../../constants'
import { EnjoyYourMembership } from './EnjoyYourMembership'
import LogInSignUp from '../LogInSignUp'

import {
  UserInfo,
  TransactionInfo,
} from '../../../hooks/useCheckoutCommunication'
import { PaywallConfigContext } from '../../../contexts/PaywallConfigContext'
import { AuthenticationContext } from '../Authenticate'

interface CheckoutProps {
  emitCloseModal: () => void
  emitTransactionInfo: (info: TransactionInfo) => void
  emitUserInfo: (info: UserInfo) => void
  web3Provider: any
}

const keysReducer = (state: any, key: any) => {
  // Keeps track of all the keys, by lock
  return {
    ...state,
    [key.lock]: key,
  }
}

const hasValidMembership = (keys: Array<any>) => {
  const now = new Date().getTime() / 1000
  return !!(
    Object.values(keys).filter(({ expiration }) => expiration > now).length > 0
  )
}

const hasPendingMembership = (keys: Array<any>) => {
  return !!(
    Object.values(keys).filter(({ expiration }) => expiration == Infinity)
      .length > 0
  )
}

const hasExpiredMembership = (keys: Array<any>) => {
  const now = new Date().getTime() / 1000
  return !!(
    Object.values(keys).filter(
      ({ expiration }) => expiration > 0 && expiration < now
    ).length > 0
  )
}

export const Checkout = ({
  emitCloseModal,
  emitTransactionInfo,
  emitUserInfo,
  web3Provider, // provider passed from the website which implements the paywall so we can support any wallet!
}: CheckoutProps) => {
  const { authenticate, account, isUnlockAccount } = useContext(
    AuthenticationContext
  )

  const paywallConfig = useContext(PaywallConfigContext)
  const config = useContext(ConfigContext)
  const [state, setState] = useState('')
  const [cardDetails, setCardDetails] = useState(null)
  const [existingKeys, setHasKey] = useReducer(keysReducer, {})
  const [selectedLock, selectLock] = useState<any>(null)

  if (!paywallConfig || !config) {
    return <Loading />
  }

  const requiredNetwork = paywallConfig.network
  const allowClose = !(!paywallConfig || paywallConfig.persistentCheckout)
  const handleTransactionInfo = (info: any) => {
    emitTransactionInfo(info)
  }

  const onProvider = (provider: any) => {
    authenticate(provider, (address: string) => {
      emitUserInfo({
        address,
      })
    })
    if (selectedLock) {
      if (!provider.isUnlock) {
        setState('crypto-checkout')
      } else {
        setState('card-purchase')
      }
    } else {
      setState('')
    }
  }
  const web3Service = new Web3Service(config.networks)

  let content
  let paywallCta = 'default'
  if (hasPendingMembership(existingKeys)) {
    paywallCta = 'pending'
  } else if (hasValidMembership(existingKeys)) {
    paywallCta = 'confirmed'
  } else if (hasExpiredMembership(existingKeys)) {
    paywallCta = 'expired'
  }

  const connectWallet = () => {
    setState('wallet-picker')
  }

  const onSelected = (lock: any) => {
    // Here we should set the state based on the account
    selectLock(lock)
    if (!account) {
      setState('pick-method')
    } else if (account && !isUnlockAccount) {
      setState('crypto-checkout')
    } else {
      setState('card-purchase')
    }
  }

  const lockProps = selectedLock && paywallConfig.locks[selectedLock.address]
  if (state === 'login') {
    content = (
      <LogInSignUp
        network={1} // We don't actually need a network here really.
        embedded
        login
        onProvider={onProvider}
      />
    )
  } else if (state === 'wallet-picker') {
    content = (
      <WalletPicker
        onProvider={(provider) => {
          if (selectedLock) {
            setState('crypto-checkout')
          }
          onProvider(provider)
        }}
      />
    )
  } else if (state === 'crypto-checkout') {
    content = (
      <CryptoCheckout
        paywallConfig={paywallConfig}
        emitTransactionInfo={handleTransactionInfo}
        network={lockProps?.network || requiredNetwork}
        name={lockProps?.name || ''}
        lock={selectedLock}
        emitCloseModal={emitCloseModal}
        setCardPurchase={() => setState('card-purchase')}
      />
    )
  } else if (state === 'card-purchase') {
    content = (
      <CardCheckout
        handleCard={(card, token) => {
          setCardDetails({ card, token })
          setState('confirm-card-purchase')
        }}
        network={lockProps?.network || requiredNetwork}
      />
    )
  } else if (state === 'confirm-card-purchase') {
    content = (
      <CardConfirmationCheckout
        emitTransactionInfo={handleTransactionInfo}
        lock={selectedLock}
        network={lockProps?.network || requiredNetwork}
        name={lockProps?.name || ''}
        emitCloseModal={emitCloseModal}
        {...cardDetails}
      />
    )
  } else if (state === 'new-account') {
    content = (
      <NewAccountCheckout
        showLogin={() => setState('login')}
        network={lockProps?.network || requiredNetwork}
        onAccountCreated={(unlockProvider, { card, token }) => {
          setCardDetails({ card, token })
          onProvider(unlockProvider)
          setState('confirm-card-purchase')
        }}
      />
    )
  } else if (state === 'pick-method') {
    content = (
      <CheckoutMethod
        network={lockProps?.network || requiredNetwork}
        showLogin={() => setState('login')}
        lock={selectedLock}
        onWalletSelected={() => setState('wallet-picker')}
        onNewAccountSelected={() => setState('new-account')}
      />
    )
  } else {
    content = (
      <>
        <Locks
          network={requiredNetwork}
          locks={paywallConfig.locks}
          setHasKey={setHasKey}
          onSelected={onSelected}
        />

        {!account && (
          <>
            <Prompt>Already a member? Access with your</Prompt>
            <CheckoutButtons>
              <Buttons.Account as="button" onClick={() => setState('login')} />
              <Buttons.Wallet as="button" onClick={connectWallet} />
            </CheckoutButtons>
          </>
        )}

        {hasValidMembership(existingKeys) && (
          <EnjoyYourMembership emitCloseModal={emitCloseModal} />
        )}
      </>
    )
  }

  const back = () => {
    setState('')
    selectLock(null)
  }

  return (
    <Web3ServiceContext.Provider value={web3Service}>
      <CheckoutContainer close={emitCloseModal}>
        <CheckoutWrapper
          back={back}
          allowClose={allowClose}
          hideCheckout={emitCloseModal}
        >
          <Head>
            <title>{pageTitle('Checkout')}</title>
          </Head>

          <PaywallLogoWrapper>
            {paywallConfig.icon ? (
              <PublisherLogo alt="Publisher Icon" src={paywallConfig.icon} />
            ) : (
              <RoundedLogo size="56px" />
            )}
          </PaywallLogoWrapper>

          <CallToAction
            state={paywallCta}
            callToAction={paywallConfig.callToAction}
          />
          {content}
        </CheckoutWrapper>
      </CheckoutContainer>
    </Web3ServiceContext.Provider>
  )
}

const PaywallLogoWrapper = styled.div`
  width: 100%;

  > img {
    height: 50px;
    max-width: 200px;
  }
`

const CheckoutButtons = styled.div`
  width: 50%;
  display: flex;
  justify-content: space-around;
  small {
    display: inline-block;
  }
`

const Prompt = styled.p`
  font-size: 16px;
  color: var(--dimgrey);
`

const PublisherLogo = styled.img``
