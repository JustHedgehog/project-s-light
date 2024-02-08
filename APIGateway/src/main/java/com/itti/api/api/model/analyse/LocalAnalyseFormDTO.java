package com.itti.api.api.model.analyse;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class LocalAnalyseFormDTO {

    private String topic;
    private List<String> samples;
    private String explainerId;
    private String modelId;

}
