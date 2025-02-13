import React, { useContext } from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'

import { useRouter } from 'next/router'
import Buttons from '../../interface/buttons/lock'
import UnlockPropTypes from '../../../propTypes'
import CreatorLockStatus from './CreatorLockStatus'
import Media from '../../../theme/media'
import withConfig, { ConfigContext } from '../../../utils/withConfig'
import { TransactionType, TransactionStatus } from '../../../unlockTypes'

import { AuthenticationContext } from '../../interface/Authenticate'

export function LockIconBar({
  lock,
  toggleCode,
  edit,
  withdraw,
  toggleCreditCard,
}) {
  const { query } = useRouter()
  const config = useContext(ConfigContext)
  const { network } = useContext(AuthenticationContext)

  // If there is any blocking transaction, we show the lock as either submitted or confirming
  if (lock.transactions && Object.keys(lock.transactions) > 0) {
    // Only take the first one (TODO: support for multiple?)
    const transactionHash = Object.keys(lock.transactions)[0]
    const transaction = lock.transactions[transactionHash]
    return (
      <CreatorLockStatus
        confirmations={transaction.confirmations}
        hash={transactionHash}
        lock={lock}
      />
    )
  }
  const membersPage = `/members?locks=${lock.address}`
  // Otherwise, we just show the lock icon bar
  return (
    <StatusBlock>
      <IconBarContainer>
        <IconBar>
          {query.showCard === 'true' && (
            <Buttons.CreditCard
              as="button"
              lock={lock}
              action={toggleCreditCard}
            />
          )}
          <Buttons.Withdraw as="button" lock={lock} withdraw={withdraw} />
          <Buttons.Edit as="button" action={() => edit(lock.address)} />
          {/* Reinstate when we're ready <Buttons.ExportLock /> */}
          <Buttons.Members href={membersPage} />
          <Buttons.AppStore as="button" action={toggleCode} />
          <Buttons.Explorer
            target="_blank"
            href={config.networks[network].explorer.urls.address(lock.address)}
          />
        </IconBar>
      </IconBarContainer>
    </StatusBlock>
  )
}

LockIconBar.propTypes = {
  lock: UnlockPropTypes.lock.isRequired,
  toggleCode: PropTypes.func.isRequired,
  toggleCreditCard: PropTypes.func.isRequired,
  edit: PropTypes.func.isRequired,
  withdraw: PropTypes.func.isRequired,
}
export default withConfig(LockIconBar)

const IconBarContainer = styled.div`
  display: grid;
  justify-items: end;
  padding-right: 24px;
  ${Media.phone`
    display: none;
  `};
`

const IconBar = styled.div`
  display: grid;
  grid-gap: 16px;
  grid-template-columns: repeat(6, 24px);
`

const StatusBlock = styled.div``
