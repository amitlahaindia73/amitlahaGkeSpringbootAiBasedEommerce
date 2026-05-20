package com.amitra.commercemesh.batch.repository;

import com.amitra.commercemesh.batch.domain.BatchProductDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Collection;
import java.util.List;

public interface BatchProductRepository extends MongoRepository<BatchProductDocument, String> {
    List<BatchProductDocument> findByImportedBy(String importedBy);
    void deleteByImportedByAndIdNotIn(String importedBy, Collection<String> ids);
}
