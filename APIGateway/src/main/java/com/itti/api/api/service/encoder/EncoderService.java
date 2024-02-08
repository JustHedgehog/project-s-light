package com.itti.api.api.service.encoder;

import com.itti.api.api.model.encoder.Encoder;

import java.util.List;

public interface EncoderService {

    List<Encoder> getAll();

    void delete(String id);
}
