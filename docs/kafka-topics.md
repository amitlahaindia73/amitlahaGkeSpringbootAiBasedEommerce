# Kafka topics

## product.viewed
Main business event fired when a user views a product.

## product.viewed.retry
Reserved topic for retry handling growth.

## product.viewed.dlt
Reserved topic for dead-letter handling growth.

## order.completed
Main business event fired after local checkout simulation succeeds.

## order.completed.retry
Reserved topic for retry handling growth.

## order.completed.dlt
Reserved topic for dead-letter handling growth.

## delivery.created
Fired by Delivery Service after shipment record creation.
