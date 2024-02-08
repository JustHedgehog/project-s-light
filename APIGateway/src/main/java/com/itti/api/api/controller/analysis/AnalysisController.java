package com.itti.api.api.controller.analysis;

import com.itti.api.api.model.analyse.AnalyseDTO;
import com.itti.api.api.model.analyse.LocalAnalyseFormDTO;
import com.itti.api.api.service.analyse.AnalyseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/analysis")
public class AnalysisController {

    private final AnalyseService analyseService;

    @GetMapping("/{id}")
    public AnalyseDTO getOne(@PathVariable String id){
        return analyseService.getOne(id);
    }

    @GetMapping
    public List<AnalyseDTO> getAll(){
        return analyseService.getAll();
    }

    @PostMapping("/local")
    public String localAnalysis(@RequestBody LocalAnalyseFormDTO localAnalyseFormDTO){
        return analyseService.localAnalyse(localAnalyseFormDTO);
    }

}
