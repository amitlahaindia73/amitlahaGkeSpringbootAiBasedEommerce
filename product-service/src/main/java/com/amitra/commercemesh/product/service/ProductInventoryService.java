package com.amitra.commercemesh.product.service;

import com.amitra.commercemesh.product.domain.Product;
import com.amitra.commercemesh.product.exception.ResourceNotFoundException;
import com.amitra.commercemesh.product.repository.ProductRepository;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

@Service
public class ProductInventoryService {

    private final MongoTemplate mongoTemplate;
    private final ProductRepository repository;

    public ProductInventoryService(MongoTemplate mongoTemplate, ProductRepository repository) {
        this.mongoTemplate = mongoTemplate;
        this.repository = repository;
    }

    public Product reduceInventory(String productId, int quantity) {
        Query query = new Query(Criteria.where("_id").is(productId)
                .and("availableQuantity").gte(quantity));
        Update update = new Update().inc("availableQuantity", -quantity);

        Product updated = mongoTemplate.findAndModify(
                query,
                update,
                FindAndModifyOptions.options().returnNew(true),
                Product.class
        );

        if (updated != null) {
            return updated;
        }

        Product existing = repository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));

        Integer available = existing.getAvailableQuantity() == null ? 0 : existing.getAvailableQuantity();
        throw new IllegalStateException("Insufficient inventory for product: " + productId + ". Available=" + available + ", requested=" + quantity);
    }
}
