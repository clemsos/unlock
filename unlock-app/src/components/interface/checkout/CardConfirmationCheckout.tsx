import React, { useContext, useState } from 'react'
import styled from 'styled-components'
import { Lock } from './Lock'
import { TransactionInfo } from '../../../hooks/useCheckoutCommunication'
import { AuthenticationContext } from '../Authenticate'
import { useAccount } from '../../../hooks/useAccount'
import { Button } from './FormStyles'
import { EnjoyYourMembership } from './EnjoyYourMembership'

interface CardConfirmationCheckoutProps {
  emitTransactionInfo: (info: TransactionInfo) => void
  lock: any
  network: number
  name: string
  emitCloseModal: () => void
  card: any
  token: string
}

export const CardConfirmationCheckout = ({
  emitTransactionInfo,
  lock,
  network,
  name,
  emitCloseModal,
  card,
  token,
}: CardConfirmationCheckoutProps) => {
  const { account } = useContext(AuthenticationContext)
  const { chargeCard } = useAccount(account, network)
  const [purchasePending, setPurchasePending] = useState(false)
  const [keyExpiration, setKeyExpiration] = useState(0)
  const [error, setError] = useState('')
  // Convenience
  const now = new Date().getTime() / 1000
  const hasValidkey = keyExpiration > now && keyExpiration < Infinity
  const hasOptimisticKey = keyExpiration === Infinity

  const totalPrice: number = Object.values(lock.fiatPricing.usd).reduce(
    (s: number, x: number): number => s + x,
    0
  ) as number
  const fee = totalPrice - lock.fiatPricing.usd.keyPrice

  const charge = async () => {
    setError('')
    setPurchasePending(true)
    try {
      const hash = await chargeCard(token, lock.address, network, totalPrice)
      if (!hash) {
        emitTransactionInfo({
          lock: lock.address,
          hash,
        })
        setKeyExpiration(Infinity) // Optimistic!
      }
      setPurchasePending(false)
      setError('Purchase failed. Please try again.')
    } catch (error) {
      console.error(error)
      setError('Purchase failed. Please try again.')
      setPurchasePending(false)
    }
  }

  const handleHasKey = (key: any) => {
    setKeyExpiration(key.expiration)
  }

  return (
    <Wrapper>
      <Lock
        network={network}
        lock={lock}
        name={name}
        setHasKey={handleHasKey}
        onSelected={null}
        optimisticKey={hasOptimisticKey}
        purchasePending={purchasePending}
      />

      {!hasValidkey && !hasOptimisticKey && (
        <>
          <Button disabled={purchasePending} onClick={charge}>
            Pay ${(totalPrice / 100).toFixed(2)} with Card
          </Button>
          {error && <Error>{error}</Error>}
          <FeeNotice>Includes ${(fee / 100).toFixed(2)} in fees ⓘ</FeeNotice>
          <CardNumber>Card ending in {card.last4}</CardNumber>
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
    </Wrapper>
  )
}

export default CardConfirmationCheckout

export const Wrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`

export const FeeNotice = styled.p`
  text-align: center;
  color: var(--green);
`

export const CardNumber = styled.p`
  text-align: center;
  color: var(--grey);
`

const Message = styled.p`
  text-align: left;
  font-size: 13px;
  width: 100%;
`

const Error = styled(Message)`
  color: var(--red);
`
