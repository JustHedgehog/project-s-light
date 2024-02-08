package com.itti.api.api.model.model;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.UUID;

@Document
@Data
@NoArgsConstructor
public class Model {

    @Id
    private String id;
    private String name;
    private String type;
    private String modelFileId;

    public Model(ModelFormDTO modelFormDTO){
        this.id = UUID.randomUUID().toString();
        this.name = modelFormDTO.getName();
        this.type = modelFormDTO.getType();
    }

    public void update(ModelFormDTO modelFormDTO){
        this.name = modelFormDTO.getName();
    }

}
