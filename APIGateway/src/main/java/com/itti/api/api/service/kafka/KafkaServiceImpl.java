package com.itti.api.api.service.kafka;

import com.itti.api.api.model.kafka.KafkaMessageDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.AdminClientConfig;
import org.apache.kafka.clients.admin.ListTopicsOptions;
import org.apache.kafka.clients.consumer.Consumer;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.common.TopicPartition;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class KafkaServiceImpl implements KafkaService {
    @Value("${app.kafka.url}")
    private String bootstrapAddress;

    @Autowired
    private final ConsumerFactory<String, String> consumerFactory;

    @Override
    public Set<String> getTopics() {

        List<String> blacklistedTopics = Arrays.asList("logs", "preprocessing",
                "explainer-lime-visualization", "explainer-shap-visualization",
                "explainer-anchors-visualization", "explainer-lime-generate", "explainer-shap-generate",
                "explainer-anchors-generate");

        Properties properties = new Properties();
        properties.put(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapAddress);

        AdminClient adminClient = AdminClient.create(properties);

        ListTopicsOptions listTopicsOptions = new ListTopicsOptions();
        listTopicsOptions.listInternal(true);

        try {
            return adminClient.listTopics(listTopicsOptions).names().get().stream()
                    .filter(topic -> !blacklistedTopics.contains(topic))
                    .filter(topic -> !topic.startsWith("__")).collect(Collectors.toSet());
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        } catch (ExecutionException e) {
            throw new RuntimeException(e);
        } finally {
            adminClient.close();
        }
    }

    @Override
    public Set<KafkaMessageDTO> getMessages(String topic, Integer range) {

//        log.info("TOPIC " + topic + " and with range " + range);

        int i = 0;
        int maxMessagesToReturn = range == null || range == 0 ? 1000 : range;
        Consumer<String, String> consumer = consumerFactory.createConsumer();
        Set<KafkaMessageDTO> result = new HashSet<>();
        try {
            // Explore available partitions
            List<TopicPartition> partitions = consumer
                    .partitionsFor(topic)
                    .stream()
                    .map(partitionInfo ->
                            new TopicPartition(topic, partitionInfo.partition()))
                    .collect(Collectors.toList());

            // Explicitly assign the partitions to our consumer
            consumer.assign(partitions);
            consumer.seekToBeginning(partitions);

            // Poll messages
            ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(5000));
//            log.info("Kafka received messages count " + records.count());

            // Iterate over messages and return opaque to DTO
            for (ConsumerRecord<String, String> record : records) {
                if (record.value() != null) {
                    if (i < maxMessagesToReturn) {
//                        log.info("Kafka message " + record.value());
                        result.add(new KafkaMessageDTO(record.key(), record.value()));
                    }
                    i++;
                }
            }
        } catch (Exception exc) {
            log.error("Error during connection or retrieving messages from topic " + topic, exc);
        } finally {
            // Close the consumer whatever happens
            consumer.close();
        }
        return result;
    }
}
