/**
 * Runs a payment for an order created by paymentsApi.createOrder and verifies it on the server.
 * Uses Razorpay Checkout when the backend has real keys; in local test mode (no keys) the payment
 * is simulated and the server accepts the mock signature only in that mode.
 */
import { paymentsApi, tokenStorage, type PaymentOrder } from './api'

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, cb: (res: any) => void) => void }
  }
}

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js'

function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = RAZORPAY_SCRIPT
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not load the payment window. Check your connection and try again.'))
    document.body.appendChild(script)
  })
}

export class PaymentCancelledError extends Error {
  constructor() {
    super('Payment was cancelled')
  }
}

export async function payForOrder(order: PaymentOrder): Promise<void> {
  if (order.mock) {
    await paymentsApi.verify(order.id, 'pay_mock_' + Date.now(), order.mockSignature || '')
    return
  }

  await loadRazorpay()
  const user = tokenStorage.getUser() || {}

  const result = await new Promise<{ razorpay_payment_id: string; razorpay_signature: string }>((resolve, reject) => {
    const rzp = new window.Razorpay!({
      key: order.keyId,
      amount: order.amountPaise,
      currency: order.currency,
      order_id: order.gatewayOrderId,
      name: 'Hunhar',
      description: order.description,
      prefill: { name: user.fullName, email: user.email },
      theme: { color: '#C06B3E' },
      handler: (res: any) => resolve(res),
      modal: { ondismiss: () => reject(new PaymentCancelledError()) },
    })
    rzp.on('payment.failed', (res: any) => reject(new Error(res?.error?.description || 'Payment failed')))
    rzp.open()
  })

  await paymentsApi.verify(order.id, result.razorpay_payment_id, result.razorpay_signature)
}
