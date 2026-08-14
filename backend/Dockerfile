# Build stage
FROM eclipse-temurin:17-jdk-focal AS build
WORKDIR /app

# Copy Maven wrapper and pom.xml first for dependency caching
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline

# Copy the rest of the source code
COPY src ./src
# Build the application
RUN ./mvnw clean package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-focal
WORKDIR /app

# Copy the built jar from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose the default port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
