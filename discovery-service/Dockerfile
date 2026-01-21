# 1. Build Stage: Dùng Maven để build code ra file .jar
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Build package, bỏ qua test cho nhanh
RUN mvn clean package -DskipTests

# 2. Run Stage: Dùng JRE nhẹ để chạy file .jar
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]