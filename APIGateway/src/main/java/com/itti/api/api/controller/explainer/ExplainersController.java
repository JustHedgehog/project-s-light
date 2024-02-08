package com.itti.api.api.controller.explainer;

import com.itti.api.api.exceptions.ExplainerNotFound;
import com.itti.api.api.model.explainer.ExplainerDTO;
import com.itti.api.api.model.explainer.ExplainerFormDTO;
import com.itti.api.api.service.explainer.ExplainerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/explainers")
public class ExplainersController {

    private final ExplainerService explainerService;

    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<ExplainerDTO> getAll(@RequestParam(name = "modelId", required = false) String modelId) {
        return explainerService.getAll().stream().filter(exp -> {
            if(modelId == null)
                return true;
            return modelId.equals(exp.getModelId());
        }).toList();
    }

    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ExplainerDTO getOne(@PathVariable String id){
        return explainerService.getOneById(id).orElseThrow(() -> new ExplainerNotFound());
    }

    @PostMapping(headers = {"content-type=multipart/*"})
    @ResponseStatus(HttpStatus.CREATED)
    public ExplainerDTO create(@RequestPart(value = "explainer") ExplainerFormDTO explainerFormDTO,
                               @RequestPart(value = "dataset", required = false)MultipartFile dataset){
        return explainerService.save(explainerFormDTO, dataset);
    }

    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public ExplainerDTO update(@PathVariable String id, @RequestBody ExplainerFormDTO explainerFormDTO){
        return explainerService.update(id, explainerFormDTO);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public void delete(@PathVariable String id){
        explainerService.delete(id);
    }

}
