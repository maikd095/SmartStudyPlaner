FROM openjdk:17-jdk-slim

WORKDIR /app

# install Maven
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*

# copy pom.xml
COPY pom.xml .

# download dependencies
RUN mvn dependency:go-offline -B

# copy source code
COPY src ./src

RUN file src/main/resources/application.properties || echo "Datei nicht gefunden"
RUN cat src/main/resources/application.properties || echo "Kann Datei nicht lesen"

RUN mvn clean package -DskipTests -B -Dfile.encoding=UTF-8

EXPOSE 8080

RUN mv target/*.jar app.jar
CMD ["java", "-jar", "app.jar"]
