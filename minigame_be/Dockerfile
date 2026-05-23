FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app

COPY pom.xml mvnw ./
COPY .mvn/ .mvn/
RUN chmod +x mvnw
RUN ./mvnw -q -DskipTests dependency:go-offline

COPY src/ src/
RUN ./mvnw -q -DskipTests package

FROM eclipse-temurin:17-jre

WORKDIR /app

RUN addgroup --system app && adduser --system --ingroup app app

ARG JAR_FILE=/app/target/*.jar
COPY --from=build ${JAR_FILE} /app/app.jar

USER app

EXPOSE 8080

ENV JAVA_OPTS=""

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]

