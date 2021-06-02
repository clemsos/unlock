import { Response } from 'express-serve-static-core' // eslint-disable-line no-unused-vars, import/no-unresolved
import KeyPricer from '../utils/keyPricer'
import AuthorizedLockOperations from '../operations/authorizedLockOperations'
import { SignedRequest } from '../types'
import { getStripeConnectForLock } from '../operations/stripeOperations'

const logger = require('../logger')

namespace PriceController {
  // This method will return the key price in USD by default, but can eventually be used to return prices in a different curreny (via query string)
  export const fiatPrice = async (
    req: SignedRequest,
    res: Response
  ): Promise<any> => {
    const { lockAddress } = req.params
    try {
      // check that we have a Stripe key for this lock!
      const stripeConnectKey = await getStripeConnectForLock(
        lockAddress,
        req.chain
      )
      // let's see if the lock was authorized for credit card payments
      const isAuthorizedForCreditCard = await AuthorizedLockOperations.hasAuthorization(
        lockAddress,
        req.chain
      )

      // REMOVE ME BEFORE GOIGN TO PROD!
      return res.json({
        usd: {
          keyPrice: 2751,
          unlockServiceFee: 281,
          creditCardProcessing: 120,
        },
        creditCardEnabled: true,
      })

      // TODO: check that the purchaser has enough funds to pay for gas?

      const pricer = new KeyPricer()
      const pricing = await pricer.generate(lockAddress, req.chain)

      if (!isAuthorizedForCreditCard || !stripeConnectKey) {
        return res.json({
          usd: pricing,
          creditCardEnabled: false,
        })
      }

      return res.json({
        usd: pricing,
        creditCardEnabled: true,
      })
    } catch (error) {
      logger.error('PriceController.fiatPrice', error)
      return res.json({})
    }
  }
}

export = PriceController
