package com.itti.api.api.model.analyse;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Document
@Data
@NoArgsConstructor
public class Analyse {

    private String id;
    private String explainerId;
    private String explainerName;
    private String modelId;
    private String modelName;
    private Date analysisStartDate;
    private Date analysisEndDate;
    private String source;
    private String topic;
    private List<String> samples;
    private String result;

    public Analyse(LocalAnalyseFormDTO localAnalyseFormDTO) {
        this.id = UUID.randomUUID().toString();
        this.explainerId = localAnalyseFormDTO.getExplainerId();
        this.modelId = localAnalyseFormDTO.getModelId();
        this.topic = localAnalyseFormDTO.getTopic();
        this.samples = localAnalyseFormDTO.getSamples();
        this.analysisStartDate = Timestamp.from(Instant.now());
    }

}
