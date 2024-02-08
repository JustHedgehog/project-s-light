package com.itti.api.api.service.kafka;

import com.itti.api.api.model.kafka.KafkaMessageDTO;

import java.util.Set;

public interface KafkaService {

    Set<String> getTopics();

    Set<KafkaMessageDTO> getMessages(String topic, Integer range);
}
