package com.itti.api.api.repository;

import com.itti.api.api.model.encoder.Encoder;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EncoderRepository extends MongoRepository<Encoder, String> {

    List<Encoder> findAllByModelId(String id);

}
