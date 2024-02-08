package com.itti.api.api.model.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ModelDTO {

    private String id;
    private String name;
    private String type;

    public ModelDTO(Model model){
        this.id = model.getId();
        this.name = model.getName();
        this.type = model.getType();
    }

}
