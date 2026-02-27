import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App', () => {
  it('loads customer data from GraphQL', async () => {
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: 'Load Customer' }))

    await waitFor(
      () => {
        expect(screen.getByText(/"email":/)).toBeInTheDocument()
        expect(screen.getByText(/"tier":/)).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
  })

  it('fetches a price quote', async () => {
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: 'Get Quote' }))

    await waitFor(
      () => {
        expect(screen.getByText(/"unitPrice":/)).toBeInTheDocument()
        expect(screen.getByText(/"totalPrice":/)).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
  })

  it('places an order', async () => {
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: 'Place Order' }))

    await waitFor(
      () => {
        expect(screen.getByText(/"orderId":/)).toBeInTheDocument()
        expect(screen.getByText(/"status":/)).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
  })
})
