# Use the base image with Node.js
FROM node:22

# Copy the current directory into the Docker image
COPY . /learning-paths-api

# Set working directory for future use
WORKDIR /learning-paths-api

# Install the dependencies from package.json
RUN npm install

CMD node app.js
