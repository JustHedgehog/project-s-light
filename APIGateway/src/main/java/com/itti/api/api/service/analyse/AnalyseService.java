package com.itti.api.api.service.analyse;

import com.itti.api.api.model.analyse.AnalyseDTO;
import com.itti.api.api.model.analyse.LocalAnalyseFormDTO;

import java.util.List;
import java.util.Optional;

public interface AnalyseService {

    String localAnalyse(LocalAnalyseFormDTO localAnalyseFormDTO);
    Optional<AnalyseDTO> findOneByModelIdAndExplainerName(String modelId, String explainerName);
    AnalyseDTO getOne(String id);
    List<AnalyseDTO> getAll();

}
