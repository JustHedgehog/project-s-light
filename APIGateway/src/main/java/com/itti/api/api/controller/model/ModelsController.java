package com.itti.api.api.controller.model;

import com.itti.api.api.model.explainer.ExplainerDTO;
import com.itti.api.api.model.model.ModelDTO;
import com.itti.api.api.model.model.ModelFormDTO;
import com.itti.api.api.service.explainer.ExplainerService;
import com.itti.api.api.service.model.ModelService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("api/models")
public class ModelsController {

    private final ModelService modelService;
    private final ExplainerService explainerService;

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<ModelDTO> getAll(){
        return modelService.getAll();
    }

    @GetMapping("/{id}/explainers")
    @ResponseStatus(HttpStatus.OK)
    public List<ExplainerDTO> getAllModelExplainers(@PathVariable String id){
        return explainerService.getAllByModelId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ModelDTO create(@RequestPart(value = "model") ModelFormDTO modelFormDTO,
                           @RequestPart(value = "modelFile") MultipartFile modelFile,
                           @RequestPart(value = "scalersAndEncoders") List<MultipartFile> scalersAndEncoders){
        return modelService.save(modelFormDTO, modelFile, scalersAndEncoders);
    }

    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ModelDTO update(@PathVariable String id, @RequestBody ModelFormDTO modelFormDTO){
        return modelService.update(id, modelFormDTO);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public void delete(@PathVariable String id){
        modelService.delete(id);
    }

}
