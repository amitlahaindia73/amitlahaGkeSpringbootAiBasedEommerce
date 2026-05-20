FROM eclipse-temurin:21-jre

WORKDIR /app

COPY product-batch-service/target/product-batch-service-1.0.0.jar app.jar

EXPOSE 8087

ENTRYPOINT ["java","-jar","/app/app.jar"]