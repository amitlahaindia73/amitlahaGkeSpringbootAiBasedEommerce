Inventory fix applied:
- Added atomic inventory reduction endpoint in product-service
- Order-service now reduces product inventory after successful payment and before marking the order CONFIRMED
- Existing business flow and APIs remain unchanged

Why inventory was not reducing:
- Orders validated stock but never updated product availableQuantity
