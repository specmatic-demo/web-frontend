import { useState } from 'react'
import './App.css'

type GraphQLResponse<T> = {
  data?: T
  errors?: Array<{ message: string }>
}

type Customer = {
  id: string
  email: string
  tier: string
}

type CatalogItem = {
  sku: string
  name: string
  available: boolean
  listPrice: number
}

type PriceQuote = {
  sku: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

type PlaceOrderResult = {
  orderId: string
  status: string
}

type ScheduleReturnResult = {
  returnId: string
  status: string
  updatedAt: string
  refundAmount?: number | null
}

async function gqlRequest<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<GraphQLResponse<T>> {
  const response = await fetch('/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables })
  })

  return response.json() as Promise<GraphQLResponse<T>>
}

function App() {
  const [customerId, setCustomerId] = useState('cust-1')
  const [category, setCategory] = useState('')
  const [catalogLimit, setCatalogLimit] = useState('5')
  const [quoteSku, setQuoteSku] = useState('sku-1')
  const [quoteQty, setQuoteQty] = useState('1')
  const [orderCustomerId, setOrderCustomerId] = useState('cust-1')
  const [orderSku, setOrderSku] = useState('sku-1')
  const [orderQty, setOrderQty] = useState('1')
  const [paymentMethodId, setPaymentMethodId] = useState('card-1')
  const [returnOrderId, setReturnOrderId] = useState('order-1')
  const [returnCustomerId, setReturnCustomerId] = useState('cust-1')
  const [returnSku, setReturnSku] = useState('sku-1')
  const [returnQty, setReturnQty] = useState('1')
  const [reasonCode, setReasonCode] = useState('DAMAGED')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [customerResult, setCustomerResult] = useState<Customer | null>(null)
  const [catalogResult, setCatalogResult] = useState<CatalogItem[]>([])
  const [quoteResult, setQuoteResult] = useState<PriceQuote | null>(null)
  const [placeOrderResult, setPlaceOrderResult] = useState<PlaceOrderResult | null>(null)
  const [scheduleReturnResult, setScheduleReturnResult] = useState<ScheduleReturnResult | null>(null)

  async function run<T>(
    task: () => Promise<GraphQLResponse<T>>,
    onSuccess: (data: T) => void
  ): Promise<void> {
    setLoading(true)
    setError('')
    try {
      const payload = await task()
      if (payload.errors && payload.errors.length > 0) {
        setError(payload.errors.map((item) => item.message).join('\n'))
        return
      }

      if (!payload.data) {
        setError('No data returned by GraphQL API')
        return
      }

      onSuccess(payload.data)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  function parseIntOrDefault(value: string, fallback: number): number {
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  return (
    <main className="app">
      <h1>Web Frontend (BFF Client)</h1>
      <p className="muted">Calls are sent to <code>/graphql</code> and proxied by Vite.</p>

      {error ? (
        <pre className="error">{error}</pre>
      ) : null}

      <section className="panel">
        <h2>Customer</h2>
        <div className="row">
          <input value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="customer id" />
          <button
            disabled={loading}
            onClick={() =>
              run(
                () =>
                  gqlRequest<{ customer: Customer | null }>(
                    `query($id: String!) {
                      customer(id: $id) { id email tier }
                    }`,
                    { id: customerId }
                  ),
                (data) => setCustomerResult(data.customer)
              )
            }
          >
            Load Customer
          </button>
        </div>
        <pre>{JSON.stringify(customerResult, null, 2)}</pre>
      </section>

      <section className="panel">
        <h2>Catalog</h2>
        <div className="row">
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="category (optional)" />
          <input value={catalogLimit} onChange={(e) => setCatalogLimit(e.target.value)} placeholder="limit" />
          <button
            disabled={loading}
            onClick={() =>
              run(
                () =>
                  gqlRequest<{ catalogItems: CatalogItem[] }>(
                    `query($category: String, $limit: Int) {
                      catalogItems(category: $category, limit: $limit) {
                        sku name available listPrice
                      }
                    }`,
                    {
                      category: category || null,
                      limit: parseIntOrDefault(catalogLimit, 5)
                    }
                  ),
                (data) => setCatalogResult(data.catalogItems)
              )
            }
          >
            Load Catalog
          </button>
        </div>
        <pre>{JSON.stringify(catalogResult, null, 2)}</pre>
      </section>

      <section className="panel">
        <h2>Quote Price</h2>
        <div className="row">
          <input value={quoteSku} onChange={(e) => setQuoteSku(e.target.value)} placeholder="sku" />
          <input value={quoteQty} onChange={(e) => setQuoteQty(e.target.value)} placeholder="quantity" />
          <button
            disabled={loading}
            onClick={() =>
              run(
                () =>
                  gqlRequest<{ quotePrice: PriceQuote }>(
                    `query($sku: String!, $quantity: Int!) {
                      quotePrice(sku: $sku, quantity: $quantity) {
                        sku quantity unitPrice totalPrice
                      }
                    }`,
                    {
                      sku: quoteSku,
                      quantity: parseIntOrDefault(quoteQty, 1)
                    }
                  ),
                (data) => setQuoteResult(data.quotePrice)
              )
            }
          >
            Get Quote
          </button>
        </div>
        <pre>{JSON.stringify(quoteResult, null, 2)}</pre>
      </section>

      <section className="panel">
        <h2>Place Order</h2>
        <div className="row">
          <input value={orderCustomerId} onChange={(e) => setOrderCustomerId(e.target.value)} placeholder="customer id" />
          <input value={orderSku} onChange={(e) => setOrderSku(e.target.value)} placeholder="sku" />
          <input value={orderQty} onChange={(e) => setOrderQty(e.target.value)} placeholder="quantity" />
          <input value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)} placeholder="payment method id" />
          <button
            disabled={loading}
            onClick={() =>
              run(
                () =>
                  gqlRequest<{ placeOrder: PlaceOrderResult }>(
                    `mutation($input: PlaceOrderInput!) {
                      placeOrder(input: $input) { orderId status }
                    }`,
                    {
                      input: {
                        customerId: orderCustomerId,
                        sku: orderSku,
                        quantity: parseIntOrDefault(orderQty, 1),
                        paymentMethodId
                      } satisfies Record<string, unknown>
                    }
                  ),
                (data) => setPlaceOrderResult(data.placeOrder)
              )
            }
          >
            Place Order
          </button>
        </div>
        <pre>{JSON.stringify(placeOrderResult, null, 2)}</pre>
      </section>

      <section className="panel">
        <h2>Schedule Return</h2>
        <div className="row">
          <input value={returnOrderId} onChange={(e) => setReturnOrderId(e.target.value)} placeholder="order id" />
          <input value={returnCustomerId} onChange={(e) => setReturnCustomerId(e.target.value)} placeholder="customer id" />
          <input value={returnSku} onChange={(e) => setReturnSku(e.target.value)} placeholder="sku" />
          <input value={returnQty} onChange={(e) => setReturnQty(e.target.value)} placeholder="quantity" />
          <input value={reasonCode} onChange={(e) => setReasonCode(e.target.value)} placeholder="reason code" />
          <button
            disabled={loading}
            onClick={() =>
              run(
                () =>
                  gqlRequest<{ scheduleReturn: ScheduleReturnResult }>(
                    `mutation($input: ScheduleReturnInput!) {
                      scheduleReturn(input: $input) {
                        returnId status updatedAt refundAmount
                      }
                    }`,
                    {
                      input: {
                        orderId: returnOrderId,
                        customerId: returnCustomerId,
                        sku: returnSku,
                        quantity: parseIntOrDefault(returnQty, 1),
                        reasonCode
                      } satisfies Record<string, unknown>
                    }
                  ),
                (data) => setScheduleReturnResult(data.scheduleReturn)
              )
            }
          >
            Schedule Return
          </button>
        </div>
        <pre>{JSON.stringify(scheduleReturnResult, null, 2)}</pre>
      </section>
      {loading ? <p className="muted">Loading...</p> : null}
    </main>
  )
}

export default App
