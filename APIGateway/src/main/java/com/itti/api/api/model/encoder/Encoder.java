package com.itti.api.api.model.encoder;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.Binary;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document
@Data
@NoArgsConstructor
public class Encoder {

    @Id
    private String id;
    private String modelId;
    private String type;
    private String dataId;

    public Encoder(String modelId, String type,String dataId){
        this.modelId = modelId;
        this.type = type;
        this.dataId = dataId;
    }

}
