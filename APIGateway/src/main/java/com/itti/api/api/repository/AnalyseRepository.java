package com.itti.api.api.repository;

import com.itti.api.api.model.analyse.Analyse;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnalyseRepository extends MongoRepository<Analyse, String> {
    List<Analyse> findByModelIdAndExplainerName(String modelId, String explainerName);
}
