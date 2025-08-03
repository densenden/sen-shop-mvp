import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Badge, Table } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { CustomerDTO } from "@medusajs/types"

// Fetch customers function
const fetchCustomers = async (): Promise<CustomerDTO[]> => {
  const response = await fetch('/admin/customers')
  if (!response.ok) {
    throw new Error('Failed to fetch customers')
  }
  const data = await response.json()
  return data.customers || []
}

const CustomersPage = () => {
  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <Container className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="p-6">
        <div className="text-center text-red-600">
          Error loading customers: {error.message}
        </div>
      </Container>
    )
  }

  return (
    <Container className="p-6">
      <div className="flex items-center justify-between mb-6">
        <Heading level="h1">Customers</Heading>
        <Badge size="small" color="blue">
          {customers.length} Total
        </Badge>
      </div>

      {customers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-2">No customers found</p>
          <p className="text-sm text-gray-500">Customers who register on your storefront will appear here</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Email</Table.HeaderCell>
                <Table.HeaderCell>Phone</Table.HeaderCell>
                <Table.HeaderCell>Account</Table.HeaderCell>
                <Table.HeaderCell>Registered</Table.HeaderCell>
                <Table.HeaderCell>Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {customers.map((customer) => (
                <Table.Row key={customer.id}>
                  <Table.Cell>
                    <div>
                      <div className="font-medium">
                        {customer.first_name} {customer.last_name}
                      </div>
                      <div className="text-sm text-gray-500">ID: {customer.id}</div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>{customer.email}</Table.Cell>
                  <Table.Cell>{customer.phone || 'N/A'}</Table.Cell>
                  <Table.Cell>
                    <Badge 
                      size="small" 
                      color={customer.metadata?.has_account ? "green" : "gray"}
                    >
                      {customer.metadata?.has_account ? 'Registered' : 'Guest'}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="text-sm">
                      {formatDate(customer.created_at)}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex space-x-2">
                      <button 
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        onClick={() => {
                          // TODO: Navigate to customer detail page
                          console.log('View customer:', customer.id)
                        }}
                      >
                        View
                      </button>
                      <button 
                        className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                        onClick={() => {
                          // TODO: Edit customer
                          console.log('Edit customer:', customer.id)
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Customers",
  icon: "Users",
})

export default CustomersPage