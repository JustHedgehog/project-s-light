package com.itti.api.api.repository;

import com.itti.api.api.model.explainer.Explainer;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExplainerRepository extends MongoRepository<Explainer, String> {

    List<Explainer> findAllByModelId(String id);
}
