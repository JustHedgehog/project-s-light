package com.itti.api.api.service.explainer;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.itti.api.api.exceptions.DatasetSaveException;
import com.itti.api.api.exceptions.ExplainerNotFound;
import com.itti.api.api.exceptions.ModelNotFound;
import com.itti.api.api.exceptions.ProducerSendException;
import com.itti.api.api.model.encoder.Encoder;
import com.itti.api.api.model.explainer.Explainer;
import com.itti.api.api.model.explainer.ExplainerDTO;
import com.itti.api.api.model.explainer.ExplainerFormDTO;
import com.itti.api.api.model.model.Model;
import com.itti.api.api.repository.EncoderRepository;
import com.itti.api.api.repository.ExplainerRepository;
import com.itti.api.api.repository.ModelRepository;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.producer.*;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ExplainerServiceImpl implements ExplainerService{

    private final ExplainerRepository explainerRepository;
    private final GridFsTemplate gridFsTemplate;
    private final ModelRepository modelRepository;
    private final ProducerFactory<String, String> producerFactory;
    private final EncoderRepository encoderRepository;
    
    @Override
    public List<ExplainerDTO> getAll() {
        return explainerRepository.findAll()
                .stream()
                .map(ExplainerDTO::new)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<ExplainerDTO> getOneById(String id) {
        return explainerRepository.findById(id).map(ExplainerDTO::new);
    }

    @Override
    public List<ExplainerDTO> getAllByModelId(String id) {
        return explainerRepository.findAllByModelId(id)
                .stream()
                .map(ExplainerDTO::new)
                .collect(Collectors.toList());
    }

    @Override
    public ExplainerDTO update(String id, ExplainerFormDTO explainerFormDTO) {
        Explainer explainer = explainerRepository.findById(id).orElseThrow(() -> new ExplainerNotFound());
        explainer.update(explainerFormDTO);
        explainerRepository.save(explainer);
        return new ExplainerDTO(explainer);
    }

    @Override
    public ExplainerDTO save(ExplainerFormDTO explainerFormDTO, MultipartFile dataset) {

        Explainer explainer = new Explainer(explainerFormDTO);
        final Model model = modelRepository.findById(explainer.getModelId()).orElseThrow(() -> new ModelNotFound());
        final Gson gson = new Gson();

        ObjectId datasetId = null;
        if(dataset != null){
            DBObject metaData = new BasicDBObject();
            metaData.put("type", "dataset");
            metaData.put("explainerId", explainer.getId());
            try {
                datasetId = gridFsTemplate.store(
                        dataset.getInputStream(), dataset.getName(), dataset.getContentType(), metaData
                );
            } catch (IOException e) {
                throw new DatasetSaveException();
            }
        }

        String explainerJson = gson.toJson(explainer);
        HashMap<String, String> json = jsonToHashMap(explainerJson);
        json.put("modelType", model.getType());
        json.put("modelFileId", model.getModelFileId());
        if(datasetId != null)
            json.put("datasetId", datasetId.toString());

        Producer<String, String> producer = producerFactory.createProducer();
        Producer<String, String> logProducer =  producerFactory.createProducer();
        ProducerRecord<String, String> producerRecord = new ProducerRecord<>("explainer-"+ explainer.getName().toLowerCase() +"-generate", gson.toJson(json));

        producer.send(producerRecord, new Callback() {
            @Override
            public void onCompletion(RecordMetadata metadata, Exception exception) {
                if (exception == null){
                    sendMessageToLogger("Api Gateway send message to kafka topic " + "explainer-"+  explainer.getName().toLowerCase() +"-generate", "INFO");
                }else{
                    sendMessageToLogger("Api Gateway gets error when sending message to kafka topic " + "explainer-"+  explainer.getName().toLowerCase() +"-generate", "ERROR");
                    throw new ProducerSendException("explainer-"+  explainer.getName().toLowerCase() +"-generate");
                }
            }

            private void sendMessageToLogger(String message, String type) {
                Map<String, String> logData = new HashMap<>();
                logData.put("Date", String.valueOf(new Date()));
                logData.put("Type", type);
                logData.put("Message", message);
                ProducerRecord<String, String> producerRecord = new ProducerRecord<>("logs", gson.toJson(logData));
                logProducer.send(producerRecord);
                logProducer.close();
            }
        });
        producer.close();
        return new ExplainerDTO(explainer);
    }
    @Override
    public void delete(String id) {
        gridFsTemplate.delete(new Query(Criteria.where("explainerId").is(id)));
        explainerRepository.deleteById(id);
    }

    public static HashMap<String,String> jsonToHashMap(String json) {
        return new Gson().fromJson(json, new TypeToken<HashMap<String, String>>(){}.getType());
    }

}
