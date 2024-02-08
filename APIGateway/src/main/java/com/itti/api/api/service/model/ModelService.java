package com.itti.api.api.service.model;

import com.itti.api.api.model.model.ModelDTO;
import com.itti.api.api.model.model.ModelFormDTO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

public interface ModelService {

    List<ModelDTO> getAll();
    Optional<ModelDTO> findOneById(String id);
    ModelDTO update(String id, ModelFormDTO modelFormDTO);
    ModelDTO save(ModelFormDTO modelFormDTO, MultipartFile modelFile, List<MultipartFile> scalersAndEncoders);
    void delete(String id);


}
