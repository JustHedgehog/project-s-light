package com.itti.api.api.model.analyse;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@NoArgsConstructor
@Data
public class AnalyseDTO {

    private String id;
    private String explainerName;
    private String modelName;
    private String result;
    private Date analysisStartDate;
    private Date analysisEndDate;

    public AnalyseDTO (Analyse analyse){
        this.id = analyse.getId();
        this.explainerName = analyse.getExplainerName();
        this.modelName = analyse.getModelName();
        this.result = analyse.getResult();
        this.analysisStartDate = analyse.getAnalysisStartDate();
        this.analysisEndDate = analyse.getAnalysisEndDate();
    }

}

