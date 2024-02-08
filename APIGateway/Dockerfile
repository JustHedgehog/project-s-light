#FROM eclipse-temurin:17.0.3_7-jre-focal
#COPY build/libs/*.jar app.jar
#ENTRYPOINT ["java","-jar","/app.jar"]
##RUN java -XshowSettings:system --versionr


FROM gradle:7-jdk17 AS TEMP_BUILD_IMAGE
ENV APP_HOME=/usr/app/
WORKDIR $APP_HOME
COPY ./APIGateway/build.gradle ./APIGateway/settings.gradle $APP_HOME

COPY ./APIGateway/gradle $APP_HOME/gradle
COPY --chown=gradle:gradle . /home/gradle/src
USER root
RUN chown -R gradle /home/gradle/src

RUN gradle bootJar || return 0
COPY ./APIGateway/. .
RUN gradle clean build

# actual container
FROM eclipse-temurin:17.0.3_7-jre-focal
ENV APP_HOME=/usr/app/

WORKDIR $APP_HOME
COPY --from=TEMP_BUILD_IMAGE $APP_HOME/build/libs/*.jar /app/spring-boot-aplication.jar

EXPOSE 8080
ENTRYPOINT exec java -jar /app/spring-boot-aplication.jar



