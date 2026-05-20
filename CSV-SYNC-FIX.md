CSV/Product sync fix

What was wrong:
- The batch importer was reading only 5 columns although the CSV contains 9 columns.
- The importer never removed stale old products from MongoDB.
- That is why UI paging could show extra pages from older leftover products.

What is fixed:
- The importer now reads all 9 CSV columns correctly.
- It stores sku, availableQuantity, imageUrl, and active.
- It removes old products previously imported by product-batch-service that are not present in the current CSV.

Recommended file to import:
- batch-input/product-import-005-fixed.csv

One-time cleanup note:
- Because the existing filename product-import-105.csv may already be marked as imported, use the new file name above and trigger batch again.
