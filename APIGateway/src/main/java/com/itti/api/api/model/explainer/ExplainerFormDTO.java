package com.itti.api.api.model.explainer;

import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@Data
public class ExplainerFormDTO {

    private String name;
    private String inputType;
    private String modelId;
//    TABULAR EXPLAINERS
    private String columnNames;
    private String labelColumn;
    private String featureNames;
    private String categoricalFeatures;

}
