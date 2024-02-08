package com.itti.api.api.model.explainer;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.UUID;

@Document
@Data
@NoArgsConstructor
public class Explainer {

    @Id
    private String id;
    private String name;
    private String modelId;
    private String inputType;
//    Tabular Explainers
    private String featureNames;
    private String categoricalFeatures;
    private String columnNames;
    private String labelColumn;


    public Explainer(ExplainerFormDTO explainerFormDTO) {
        this.id = UUID.randomUUID().toString();
        this.name = explainerFormDTO.getName();
        this.modelId = explainerFormDTO.getModelId();
        this.inputType = explainerFormDTO.getInputType();
        this.featureNames = explainerFormDTO.getFeatureNames();
        this.categoricalFeatures = explainerFormDTO.getCategoricalFeatures();
        this.columnNames = explainerFormDTO.getColumnNames();
        this.labelColumn = explainerFormDTO.getLabelColumn();
    }

    public void update(ExplainerFormDTO explainerFormDTO){
        this.modelId = explainerFormDTO.getModelId();
        this.featureNames = explainerFormDTO.getFeatureNames();
        this.categoricalFeatures = explainerFormDTO.getCategoricalFeatures();
        this.columnNames = explainerFormDTO.getColumnNames();
        this.labelColumn = explainerFormDTO.getLabelColumn();
    }

}
