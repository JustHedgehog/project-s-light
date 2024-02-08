package com.itti.api.api.service.analyse;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.itti.api.api.exceptions.*;
import com.itti.api.api.model.analyse.Analyse;
import com.itti.api.api.model.analyse.AnalyseDTO;
import com.itti.api.api.model.analyse.LocalAnalyseFormDTO;
import com.itti.api.api.model.explainer.Explainer;
import com.itti.api.api.model.model.Model;
import com.itti.api.api.repository.AnalyseRepository;
import com.itti.api.api.repository.ExplainerRepository;
import com.itti.api.api.repository.ModelRepository;
import com.mongodb.client.gridfs.model.GridFSFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.producer.Callback;
import org.apache.kafka.clients.producer.Producer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyseServiceImpl implements AnalyseService{

    private final AnalyseRepository analyseRepository;
    private final GridFsTemplate gridFsTemplate;
    private final ModelRepository modelRepository;
    private final ExplainerRepository explainerRepository;
    private final ProducerFactory<String, String> producerFactory;

    @Override
    public String localAnalyse(LocalAnalyseFormDTO localAnalyseFormDTO) {

        final Model model = modelRepository.findById(localAnalyseFormDTO.getModelId()).orElseThrow(() -> new ModelNotFound());
        final Explainer explainer = explainerRepository.findById(localAnalyseFormDTO.getExplainerId()).orElseThrow(() -> new ExplainerNotFound());
        final Analyse analyse = new Analyse(localAnalyseFormDTO);
        final Gson gson = new Gson();

        String analyseJSON = gson.toJson(analyse);
        HashMap<String, String> json = jsonToHashMap(analyseJSON);
        json.put("model", gson.toJson(model));
        json.put("explainer", gson.toJson(explainer));

        Producer<String, String> producer = producerFactory.createProducer();
        Producer<String, String> logProducer = producerFactory.createProducer();
        ProducerRecord<String, String> producerRecord = new ProducerRecord<>("explainer-" + explainer.getName().toLowerCase() + "-visualization", gson.toJson(json));

        producer.send(producerRecord, new Callback() {
            @Override
            public void onCompletion(RecordMetadata metadata, Exception exception) {
                if (exception == null) {
                    sendMessageToLogger("Api Gateway send message to kafka topic " + "explainer-" + explainer.getName().toLowerCase() + "-visualization", "INFO");
                    log.info("Send");
                } else {
                    log.error("error");
                    sendMessageToLogger("Api Gateway gets error when sending message to kafka theme " + "explainer-" + explainer.getName().toLowerCase() + "-visualization", "ERROR");
                    throw new ProducerSendException("explainer-" + explainer.getName().toLowerCase() + "-visualization");
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

        return analyse.getId();
    }

    @Override
    public AnalyseDTO getOne(String id) {
        Analyse analyse = analyseRepository.findById(id).orElseThrow(() -> new AnalyseNotFound());
        String resultId = analyse.getResult();
        GridFSFile gridFSFile = gridFsTemplate.findOne(new Query(Criteria.where("_id").is(resultId)));
        GridFsResource resource = gridFsTemplate.getResource(gridFSFile);
        String resultData = "";
        try {
            try (BufferedReader br = new BufferedReader(new InputStreamReader(resource.getInputStream(), "UTF-8"))) {
                resultData += br.readLine();
            }
        } catch (IOException e) {
            throw new ResultReadException();
        }
        analyse.setResult(resultData);

        return new AnalyseDTO(analyse);
    }

    @Override
    public List<AnalyseDTO> getAll() {
        return analyseRepository.findAll()
                .stream()
                .map(AnalyseDTO::new)
                .collect(Collectors.toList());
    }
    @Override
    public Optional<AnalyseDTO> findOneByModelIdAndExplainerName(String modelId, String explainerName) {
        return analyseRepository.findByModelIdAndExplainerName(modelId, explainerName)
                .stream()
                .reduce((first,second) -> second)
                .map(AnalyseDTO::new);
    }

    public static HashMap<String,String> jsonToHashMap(String json) {
        return new Gson().fromJson(json, new TypeToken<HashMap<String, Object>>(){}.getType());
    }
}
