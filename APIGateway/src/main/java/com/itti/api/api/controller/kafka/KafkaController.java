package com.itti.api.api.controller.kafka;

import com.itti.api.api.model.kafka.KafkaMessageDTO;
import com.itti.api.api.service.kafka.KafkaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RequiredArgsConstructor
@RestController
@RequestMapping("api/kafka")
public class KafkaController {

    private final KafkaService kafkaService;

    @GetMapping("/topics")
    @ResponseStatus(HttpStatus.OK)
    public Set<String> getTopics(){
        return kafkaService.getTopics();
    }

    @GetMapping("/{topic}/messages")
    @ResponseStatus(HttpStatus.OK)
    public Set<KafkaMessageDTO> getMessages(@PathVariable String topic, @RequestParam(required = false)Integer range){

        return kafkaService.getMessages(topic, range);
    }

}
