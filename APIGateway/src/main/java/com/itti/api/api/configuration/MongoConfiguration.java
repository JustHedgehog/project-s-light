package com.itti.api.api.configuration;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Configurable;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.AbstractMongoClientConfiguration;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

import java.util.Collection;
import java.util.Collections;

@Slf4j
@Configuration
@EnableMongoRepositories(basePackages = "com.itti.api.api")
public class MongoConfiguration extends AbstractMongoClientConfiguration {

    @Value("${app.mongo.url}")
    private String mongoUrl;

    @Value("${app.mongo.database.name}")
    private String databaseName;


    @Override
    protected String getDatabaseName() {
        return databaseName;
    }

    @Override
    public MongoClient mongoClient(){
        final ConnectionString connectionString = new ConnectionString(mongoUrl);
        log.info("Initializing mongo connection with url : " + connectionString.getHosts());
        final MongoClientSettings mongoClientSettings = MongoClientSettings.builder()
                .applyConnectionString(connectionString)
                .build();
        return MongoClients.create(mongoClientSettings);
    }

    @Override
    public Collection<String> getMappingBasePackages() {
        return Collections.singleton("com.itti.api.api");
    }


}
