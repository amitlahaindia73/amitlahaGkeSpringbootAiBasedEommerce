FROM eclipse-temurin:21-jre

WORKDIR /app

COPY delivery-service/target/delivery-service-1.0.0.jar app.jar

EXPOSE 8085

ENTRYPOINT ["java", "-jar", "/app/app.jar"]