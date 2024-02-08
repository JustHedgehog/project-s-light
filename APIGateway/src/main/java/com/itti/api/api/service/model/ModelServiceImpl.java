package com.itti.api.api.service.model;

import com.itti.api.api.exceptions.DatasetSaveException;
import com.itti.api.api.exceptions.ModelNotFound;
import com.itti.api.api.model.encoder.Encoder;
import com.itti.api.api.model.explainer.Explainer;
import com.itti.api.api.model.model.Model;
import com.itti.api.api.model.model.ModelDTO;
import com.itti.api.api.model.model.ModelFormDTO;
import com.itti.api.api.repository.EncoderRepository;
import com.itti.api.api.repository.ExplainerRepository;
import com.itti.api.api.repository.ModelRepository;
import com.itti.api.api.service.explainer.ExplainerService;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
@Slf4j
@Service
@RequiredArgsConstructor
public class ModelServiceImpl implements ModelService{

    private final ModelRepository modelRepository;
    private final ExplainerRepository explainerRepository;
    private final ExplainerService explainerService;
    private final EncoderRepository encoderRepository;
    private final GridFsTemplate gridFsTemplate;

    @Override
    public List<ModelDTO> getAll() {
        return modelRepository.findAll()
                .stream()
                .map(ModelDTO::new)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<ModelDTO> findOneById(String id) {
        return modelRepository.findById(id).map(ModelDTO::new);
    }

    @Override
    public ModelDTO update(String id, ModelFormDTO modelFormDTO) {
        Model model = modelRepository.findById(id).orElseThrow(() -> new ModelNotFound());
        model.update(modelFormDTO);
        modelRepository.save(model);
        return new ModelDTO(model);
    }

    @Override
    public ModelDTO save(ModelFormDTO modelFormDTO, MultipartFile modelFile,List<MultipartFile> scalersAndEncoders) {
        Model model = new Model(modelFormDTO);

        if("offline".equals(model.getType())){
            DBObject metadata = new BasicDBObject();
            metadata.put("modelId", model.getId());
            metadata.put("modelName", model.getName());
            metadata.put("type", modelFile.getOriginalFilename());
            ObjectId modelFileId = null;
            try{
                modelFileId = gridFsTemplate.store(
                        modelFile.getInputStream(), modelFile.getOriginalFilename(), modelFile.getContentType(), metadata
                );
            }catch (IOException e){
                throw new DatasetSaveException();
            }
            model.setModelFileId(modelFileId.toString());
        }

        modelRepository.insert(model);

        for (MultipartFile file :
                scalersAndEncoders) {
                DBObject metaData = new BasicDBObject();
                metaData.put("modelId", model.getId());
                metaData.put("modelName", model.getName());
                metaData.put("type", file.getOriginalFilename());
                ObjectId encoderFileId = null;
                try{
                    encoderFileId = gridFsTemplate.store(
                            file.getInputStream(), file.getOriginalFilename(), file.getContentType(), metaData
                    );
                }catch (IOException e){
                    throw new DatasetSaveException();
                }
                Encoder encoder = new Encoder(model.getId(), file.getOriginalFilename(), encoderFileId.toString());
                encoderRepository.insert(encoder);
        }
        return new ModelDTO(model);
    }

    @Override
    public void delete(String id) {
        List<Explainer> explainers = explainerRepository.findAllByModelId(id);
        for (Explainer explainer:
             explainers) {
            explainerService.delete(explainer.getId());
        }
        List<Encoder> listOfEncoders = encoderRepository.findAllByModelId(id);
        for (Encoder encoder :
                listOfEncoders) {
            encoderRepository.delete(encoder);
        }

        gridFsTemplate.delete(new Query(Criteria.where("metadata.modelId").is(id)));
        modelRepository.deleteById(id);
    }
}
