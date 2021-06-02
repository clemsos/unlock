import styled from 'styled-components'
import React from 'react'

import { WordMarkLogo } from '../Logo'
import SvgComponents from '../svg'

interface CheckoutFooterProps {
  back: (() => void) | null
}

export const CheckoutFooter = ({ back }: CheckoutFooterProps) => (
  <FooterWrapper>
    {!!back && (
      <BackButton onClick={back}>
        <SvgComponents.Arrow />
      </BackButton>
    )}
    <span>
      Powered by
      <a
        href="https://unlock-protocol.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        <WordMark alt="Unlock" />
      </a>
    </span>
  </FooterWrapper>
)

const FooterWrapper = styled.footer`
  bottom: 0px;
  margin-top: 32px;
  font-size: 12px;
  color: var(--grey);
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`

const WordMark = styled(WordMarkLogo)`
  width: 48px;
  margin-bottom: -1px;
  margin-left: 4px;
`

const BackButton = styled.div`
  width: 30px;
  cursor: pointer;
  svg {
    transform: rotate(180deg);
    fill: var(--grey);
  }
`
