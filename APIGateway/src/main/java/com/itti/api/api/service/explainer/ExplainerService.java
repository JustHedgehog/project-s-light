package com.itti.api.api.service.explainer;

import com.itti.api.api.model.explainer.ExplainerDTO;
import com.itti.api.api.model.explainer.ExplainerFormDTO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

public interface ExplainerService {

    List<ExplainerDTO> getAll();
    Optional<ExplainerDTO> getOneById(String id);
    List<ExplainerDTO> getAllByModelId(String id);
    ExplainerDTO update(String id, ExplainerFormDTO explainerFormDTO);
    ExplainerDTO save(ExplainerFormDTO explainerFormDTO, MultipartFile dataset);
    void delete(String id);

}
