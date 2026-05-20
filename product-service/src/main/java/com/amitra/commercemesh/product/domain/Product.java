package com.amitra.commercemesh.product.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "products")
public class Product {
    @Id
    private String id;
    @Indexed(unique = true, sparse = true)
    private String sku;
    private String name;
    private String category;
    private String description;
    private double price;
    private Integer availableQuantity;
    private String imageUrl;
    private Boolean active;

    public Product() {}

    public String getId() { return id; }
    public String getSku() { return sku; }
    public String getName() { return name; }
    public String getCategory() { return category; }
    public String getDescription() { return description; }
    public double getPrice() { return price; }
    public Integer getAvailableQuantity() { return availableQuantity; }
    public String getImageUrl() { return imageUrl; }
    public Boolean getActive() { return active; }

    public void setId(String id) { this.id = id; }
    public void setSku(String sku) { this.sku = sku; }
    public void setName(String name) { this.name = name; }
    public void setCategory(String category) { this.category = category; }
    public void setDescription(String description) { this.description = description; }
    public void setPrice(double price) { this.price = price; }
    public void setAvailableQuantity(Integer availableQuantity) { this.availableQuantity = availableQuantity; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setActive(Boolean active) { this.active = active; }
}
