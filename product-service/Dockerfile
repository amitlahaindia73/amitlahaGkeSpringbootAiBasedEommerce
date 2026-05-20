FROM eclipse-temurin:21-jre

WORKDIR /app

COPY product-service/target/product-service-1.0.0.jar app.jar

EXPOSE 8083

ENTRYPOINT ["java","-jar","/app/app.jar"]