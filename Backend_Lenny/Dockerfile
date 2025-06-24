FROM openjdk:17-jdk-slim

WORKDIR /app

# Maven installieren
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*

# Nur pom.xml kopieren für besseres Dependency-Caching
COPY pom.xml .

# Dependencies herunterladen
RUN mvn dependency:go-offline -B

# Source Code kopieren
COPY src ./src

# Application bauen
RUN mvn clean package -DskipTests -B

# Port freigeben
EXPOSE 8080

# Application starten
CMD ["java", "-jar", "target/*.jar"]