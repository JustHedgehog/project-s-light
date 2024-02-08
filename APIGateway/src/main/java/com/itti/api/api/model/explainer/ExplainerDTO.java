package com.itti.api.api.model.explainer;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;

@Data
@NoArgsConstructor
public class ExplainerDTO {

    @Id
    private String id;
    private String name;
    private String modelId;
    private String inputType;
//    Tabular Explainers
    private String featureNames;
    private String categoricalFeatures;
    private String columnNames;

    public ExplainerDTO(Explainer entity){
        this.id = entity.getId();
        this.name = entity.getName();
        this.modelId = entity.getModelId();
        this.inputType = entity.getInputType();
        this.columnNames = entity.getColumnNames();
        this.featureNames = entity.getFeatureNames();
        this.categoricalFeatures = entity.getCategoricalFeatures();
    }

}
