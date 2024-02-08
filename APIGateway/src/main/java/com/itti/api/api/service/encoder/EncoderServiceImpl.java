package com.itti.api.api.service.encoder;

import com.itti.api.api.model.encoder.Encoder;
import com.itti.api.api.repository.EncoderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EncoderServiceImpl implements EncoderService{

    private final EncoderRepository encoderRepository;

    @Override
    public List<Encoder> getAll() {
        return encoderRepository.findAll();
    }

    @Override
    public void delete(String id) {
        encoderRepository.deleteById(id);
    }

}
