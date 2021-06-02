import React, { useContext, useState, useEffect } from 'react'
import styled from 'styled-components'
import { Lock } from './Lock'
import { AuthenticationContext } from '../Authenticate'
import { useLock } from '../../../hooks/useLock'
import { TransactionInfo } from '../../../hooks/useCheckoutCommunication'
import { PaywallConfig } from '../../../unlockTypes'
import { EnjoyYourMembership } from './EnjoyYourMembership'
import { useAccount } from '../../../hooks/useAccount'
import { userCanAffordKey } from '../../../utils/checkoutLockUtils'
import Buttons from '../buttons/lock'
import Button from '../buttons/Button'

interface CryptoCheckoutProps {
  emitTransactionInfo: (info: TransactionInfo) => void
  paywallConfig: PaywallConfig
  lock: any
  network: number
  name: string
  emitCloseModal: () => void
  setCardPurchase: () => void
}

export const CryptoCheckout = ({
  emitTransactionInfo,
  paywallConfig,
  lock,
  network,
  name,
  emitCloseModal,
  setCardPurchase,
}: CryptoCheckoutProps) => {
  const { network: walletNetwork, account } = useContext(AuthenticationContext)
  const { purchaseKey } = useLock(lock, network)
  const [keyExpiration, setKeyExpiration] = useState(0)
  const [canAfford, setCanAfford] = useState(true)
  const [purchasePending, setPurchasePending] = useState(false)
  const userIsOnWrongNetwork = walletNetwork && walletNetwork !== network
  const { getTokenBalance } = useAccount(account, network)

  const now = new Date().getTime() / 1000
  const cryptoDisabled =
    userIsOnWrongNetwork || hasValidkey || hasOptimisticKey || !canAfford
  const cardDisabled = hasValidkey || hasOptimisticKey
  const isCreditCardEnabled = lock.fiatPricing?.creditCardEnabled
  const handleHasKey = (key: any) => {
    setKeyExpiration(key.expiration)
  }

  const cryptoPurchase = () => {
    if (!cryptoDisabled) {
      setPurchasePending(true)
      const referrer =
        paywallConfig && paywallConfig.referrer
          ? paywallConfig.referrer
          : account
      purchaseKey(account, referrer, (hash: string) => {
        emitTransactionInfo({
          lock: lock.address,
          hash,
        })
        setKeyExpiration(Infinity) // Optimistic!
        setPurchasePending(false)
      })
    }
  }

  useEffect(() => {
    // TODO: COMBINE + ADD LOADING STATE
    const getBalance = async () => {
      const balance = await getTokenBalance(lock.currencyContractAddress)
      setCanAfford(userCanAffordKey(lock, balance))
    }
    getBalance()
  }, [lock.address])

  const hasValidkey = keyExpiration > now && keyExpiration < Infinity
  const hasOptimisticKey = keyExpiration === Infinity
  return (
    <>
      <Lock
        network={network}
        lock={lock}
        name={name}
        setHasKey={handleHasKey}
        onSelected={null}
        optimisticKey={hasOptimisticKey}
        purchasePending={purchasePending}
      />
      {userIsOnWrongNetwork && !hasValidkey && (
        <Warning>You are on the wrong network.</Warning>
      )}
      {!userIsOnWrongNetwork && !hasValidkey && !canAfford && (
        <Warning>You cannot afford this lock!</Warning>
      )}

      {keyExpiration < now && (
        <>
          <Prompt>Pay for your membership with </Prompt>

          <CheckoutOptions>
            <CheckoutButton disabled={cryptoDisabled}>
              <Buttons.Wallet as="button" onClick={cryptoPurchase} />
            </CheckoutButton>
            {isCreditCardEnabled && (
              <CheckoutButton>
                <Buttons.CreditCard
                  backgroundColor="var(--blue)"
                  fillColor="var(--white)"
                  showLabel
                  size="36px"
                  disabled={cardDisabled}
                  as="button"
                  onClick={setCardPurchase}
                />
              </CheckoutButton>
            )}
          </CheckoutOptions>
        </>
      )}
      {hasValidkey && (
        <>
          <Message>You already have a valid membership for this lock!</Message>
          <EnjoyYourMembership emitCloseModal={emitCloseModal} />
        </>
      )}
      {hasOptimisticKey && (
        <EnjoyYourMembership emitCloseModal={emitCloseModal} />
      )}
    </>
  )
}

export default CryptoCheckout

export const CheckoutButton = styled.div`
  ${(props) =>
    props.disabled &&
    `
    button {
      cursor: not-allowed;
      background-color: var(--grey);

      &:hover {
        background-color: var(--grey);
      }
    }`}

  small {
    display: inline-block;
  }
`

const Message = styled.p`
  text-align: left;
  font-size: 13px;
  width: 100%;
`
const Warning = styled(Message)`
  color: var(--red);
  margin-top: 24px;
  font-size: 12px;
  text-align: center;
`

const CheckoutOptions = styled.div`
  width: 50%;
  display: flex;
  justify-content: space-around;
  margin-left: auto;
  margin-right: auto;
`

const Prompt = styled.p`
  font-size: 16px;
  color: var(--dimgrey);
`
