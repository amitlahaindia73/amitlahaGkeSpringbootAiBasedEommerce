package com.amitra.commercemesh.product.controller;

import com.amitra.commercemesh.product.api.ApiResponse;
import com.amitra.commercemesh.product.domain.Product;
import com.amitra.commercemesh.product.dto.InventoryAdjustmentRequest;
import com.amitra.commercemesh.product.dto.ProductUpsertRequest;
import com.amitra.commercemesh.product.exception.ConflictException;
import com.amitra.commercemesh.product.exception.ResourceNotFoundException;
import com.amitra.commercemesh.product.repository.ProductRepository;
import com.amitra.commercemesh.product.service.ProductEventPublisher;
import com.amitra.commercemesh.product.service.ProductInventoryService;
import com.amitra.commercemesh.security.UserContext;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductRepository repository;
    private final ProductEventPublisher eventPublisher;
    private final ProductInventoryService productInventoryService;

    public ProductController(ProductRepository repository, ProductEventPublisher eventPublisher, ProductInventoryService productInventoryService) {
        this.repository = repository;
        this.eventPublisher = eventPublisher;
        this.productInventoryService = productInventoryService;
    }

    @Operation(summary = "List products with optional keyword/category filters")
    @GetMapping
    public ApiResponse<List<Product>> all(@RequestParam(required = false) String keyword,
                                          @RequestParam(required = false) String category,
                                          @RequestParam(defaultValue = "1") int page,
                                          @RequestParam(defaultValue = "10") int size,
                                          HttpServletRequest request) {
        List<Product> products;
        if (keyword != null && !keyword.isBlank()) {
            products = repository.findByNameContainingIgnoreCase(keyword.trim());
        } else if (category != null && !category.isBlank()) {
            products = repository.findByCategoryIgnoreCase(category.trim());
        } else {
            products = repository.findAll();
        }
        List<Product> filteredProducts = products.stream()
                .filter(product -> product.getActive() == null || product.getActive())
                .sorted(Comparator.comparing(Product::getName, String.CASE_INSENSITIVE_ORDER))
                .toList();

        int safeSize = Math.max(1, Math.min(size, 50));
        int safePage = Math.max(page, 1);
        int fromIndex = Math.min((safePage - 1) * safeSize, filteredProducts.size());
        int toIndex = Math.min(fromIndex + safeSize, filteredProducts.size());
        List<Product> pageItems = filteredProducts.subList(fromIndex, toIndex);

        return ApiResponse.success(pageItems, "Products fetched successfully", request.getHeader("X-Request-Id"));
    }

    @GetMapping("/{id}")
    public ApiResponse<Product> byId(@PathVariable String id, HttpServletRequest request) {
        Product product = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        return ApiResponse.success(product, "Product fetched successfully", request.getHeader("X-Request-Id"));
    }


    @PostMapping("/{id}/inventory/reduce")
    public ApiResponse<Product> reduceInventory(@PathVariable String id, @Valid @RequestBody InventoryAdjustmentRequest requestBody, HttpServletRequest request) {
        Product updated = productInventoryService.reduceInventory(id, requestBody.quantity());
        return ApiResponse.success(updated, "Inventory reduced successfully", request.getHeader("X-Request-Id"));
    }

    @PostMapping("/viewed/{productId}")
    public ApiResponse<String> viewed(@PathVariable String productId, HttpServletRequest request) {
        UserContext userContext = new UserContext(request);
        if (!userContext.isAuthenticated()) {
            throw new ResourceNotFoundException("Authenticated user context is missing");
        }
        repository.findById(productId).orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));
        String userId = userContext.getUserId();
        eventPublisher.publishViewed(userId, productId);
        return ApiResponse.success("OK", "Product viewed event published for user " + userId, request.getHeader("X-Request-Id"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Product>> create(@Valid @RequestBody ProductUpsertRequest requestBody, HttpServletRequest request) {
        if (requestBody.sku() != null && !requestBody.sku().isBlank() && repository.findBySku(requestBody.sku().trim()).isPresent()) {
            throw new ConflictException("Product SKU already exists: " + requestBody.sku());
        }
        Product saved = repository.save(toProduct(new Product(), requestBody));
        return ResponseEntity.ok(ApiResponse.success(saved, "Product created successfully", request.getHeader("X-Request-Id")));
    }

    @PutMapping("/{id}")
    public ApiResponse<Product> update(@PathVariable String id, @Valid @RequestBody ProductUpsertRequest requestBody, HttpServletRequest request) {
        Product existing = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        if (requestBody.sku() != null && !requestBody.sku().isBlank()) {
            repository.findBySku(requestBody.sku().trim())
                    .filter(product -> !product.getId().equals(id))
                    .ifPresent(product -> { throw new ConflictException("Product SKU already exists: " + requestBody.sku()); });
        }
        Product updated = repository.save(toProduct(existing, requestBody));
        return ApiResponse.success(updated, "Product updated successfully", request.getHeader("X-Request-Id"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Product not found: " + id);
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private Product toProduct(Product target, ProductUpsertRequest source) {
        target.setName(source.name().trim());
        target.setCategory(source.category().trim());
        target.setDescription(source.description().trim());
        target.setPrice(source.price());
        target.setSku(source.sku() == null || source.sku().isBlank() ? null : source.sku().trim().toUpperCase(Locale.ROOT));
        target.setImageUrl(source.imageUrl());
        target.setAvailableQuantity(source.availableQuantity());
        target.setActive(source.active() == null ? Boolean.TRUE : source.active());
        return target;
    }
}
